import { parseLocation } from './location.js';

const ROOM = /^[A-Z0-9_+.-]{1,96}$/;
const REGION = /^[A-Z0-9]{1,16}$/;
export const MAX_SNAPSHOT_BYTES = 1024 * 1024;
const MAX_ROOMS = 12000;
const text = (value, length) => typeof value === 'string' ? value.slice(0, length) : '';
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const roomCode = value => typeof value === 'string' && ROOM.test(value.toUpperCase()) ? value.toUpperCase() : null;
const regionCode = value => typeof value === 'string' && REGION.test(value.toUpperCase()) ? value.toUpperCase() : null;

export function normalizeProgress(input, multiplayer = false) {
  if (!record(input)) return null;
  const source = ['solo', 'host'].includes(input.source) && (!multiplayer || input.source === 'host') && ['save','session'].includes(input.scope) && ['live','cycle-start'].includes(input.freshness) ? input.source : 'unavailable';
  const valid = source !== 'unavailable';
  const rooms = valid && Array.isArray(input.rooms) ? input.rooms : [];
  if (rooms.length > MAX_ROOMS) throw new Error('探索记录超过 12000 个房间，请分开导入存档。');
  const flags = {};
  if (valid && record(input.flags)) {
    for (const key of ['hasMark','hasRobo','moonHeartRestored','pebblesEnergyTaken','smPearlTagged','ascended','altEnding','redExtraCycles'])
      if (typeof input.flags[key] === 'boolean') flags[key] = input.flags[key];
    for (const key of ['moonConversations','pebblesConversations','karmaCap'])
      if (Number.isInteger(input.flags[key]) && input.flags[key] >= 0 && input.flags[key] <= 100000) flags[key] = input.flags[key];
    if (roomCode(input.flags.denPosition)) flags.denPosition = roomCode(input.flags.denPosition);
    if (record(input.flags.ghostsTalkedTo)) {
      flags.ghostsTalkedTo = {};
      for (const [region, count] of Object.entries(input.flags.ghostsTalkedTo))
        if (regionCode(region) && Number.isInteger(count) && count >= 0 && count <= 1000) flags.ghostsTalkedTo[region.toUpperCase()] = count;
    }
  }
  return {
    source, saveId: valid ? text(input.saveId,128) : '',
    scope: valid && ['save','session'].includes(input.scope) ? input.scope : 'none',
    freshness: valid && ['live','cycle-start'].includes(input.freshness) ? input.freshness : 'unavailable',
    cycle: valid && Number.isInteger(input.cycle) && Math.abs(input.cycle) <= 100000 ? input.cycle : null,
    rooms: [...new Set(rooms.map(roomCode).filter(Boolean))], flags,
    capturedAt: Number.isFinite(Date.parse(input.capturedAt)) ? new Date(input.capturedAt).toISOString() : '',
  };
}

export function normalizeRoomOverrides(input) {
  const result = {};
  if (!record(input)) return result;
  const entries = Object.entries(input);
  if (entries.length > MAX_ROOMS) throw new Error('房间遮罩记录过大。');
  for (const [room,visible] of entries) if (roomCode(room) && typeof visible === 'boolean') result[roomCode(room)] = visible;
  return result;
}

export function normalizeSnapshot(input) {
  if (!record(input) || input.v !== 2) throw new Error('不是受支持的游戏地图快照（需要版本 2）。');
  const params = new URLSearchParams({v:'1', character:input.character ?? '',region:input.region ?? '',room:input.room ?? ''});
  for (const key of ['x','y','px','py','cx','cy','mode','avatar']) if (input[key] !== undefined && input[key] !== null) params.set(key,String(input[key]));
  if (input.dlc === true) params.set('dlc','downpour');
  const location = parseLocation('#'+params);
  const players = Array.isArray(input.players) ? input.players : [];
  if (players.length > 64) throw new Error('玩家位置超过本工具支持的 64 个条目。');
  const normalizedPlayers = players.filter(record).map((player,i) => {
    const result = {id:text(player.id,80) || String(i),name:text(player.name,80) || `玩家 ${i+1}`,local:player.local === true,host:player.host === true,available:false,accuracy:'room'};
    const room=roomCode(player.room), region=regionCode(player.region);
    if (player.available === false || !room || !region) return result;
    Object.assign(result,{room,region,available:true});
    for (const key of ['x','y','px','py','cx','cy']) {
      const number=player[key], integer=key==='x'||key==='y';
      if (Number.isFinite(number) && Math.abs(number) <= (integer ? 32768 : 1000000) && (!integer || Number.isInteger(number))) result[key]=number;
    }
    if (player.accuracy === 'pixel' && ['px','py','cx','cy'].every(key=>Number.isFinite(result[key]))) result.accuracy='pixel';
    return result;
  });
  const capturedAt=Number.isFinite(Date.parse(input.capturedAt)) ? new Date(input.capturedAt).toISOString() : '';
  const progress=normalizeProgress({...input.progress,capturedAt,...(location.mode==='meadow'?{source:'unavailable'}:{})},input.multiplayer === true);
  return {...location,v:2,multiplayer:input.multiplayer === true,capturedAt,players:normalizedPlayers,progress};
}

export async function parseGameLink(hash) {
  const params=new URLSearchParams(hash.replace(/^#/,''));
  if (params.get('v') !== '2') return parseLocation(hash);
  const encoded=params.get('data');
  if (!encoded || encoded.length > 131072 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('游戏快照链接不完整或过大，请导入 JSON 文件。');
  if (typeof DecompressionStream === 'undefined') throw new Error('此浏览器不支持地图快照解压，请更新浏览器或导入 JSON。');
  const bytes=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  let length=0; const chunks=[];
  try {
    while (true) {
      const {value,done}=await reader.read(); if(done) break;
      length+=value.byteLength;
      if(length>MAX_SNAPSHOT_BYTES) { await reader.cancel(); throw new Error('解压后的游戏快照超过 1 MB。'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const decoded=new Uint8Array(length); let offset=0;
  for(const chunk of chunks){decoded.set(chunk,offset);offset+=chunk.length;}
  return normalizeSnapshot(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded)));
}

// Recommend a clue from observed save facts; never treat a visited room as a
// completed conversation, carried quest item, or finished ending.
export function suggestedStage(campaign, progress) {
  if (!progress || progress.source === 'unavailable') return null;
  const f=progress.flags;
  if (campaign === 'survivor' || campaign === 'monk') {
    if(f.hasMark) return 'far-journey';
    if(f.moonConversations>0) return 'high-visit';
    if(progress.cycle>0 && f.denPosition && !f.denPosition.startsWith('SU_')) return 'first-visit';
  }
  if(campaign==='gourmand' && f.hasMark) return 'gourmand-west';
  if(campaign==='artificer' && f.hasRobo && f.hasMark) return 'artificer-city';
  if(campaign==='rivulet') {
    if(f.moonHeartRestored) return 'rivulet-return';
    if(f.pebblesEnergyTaken) return 'rivulet-deep';
    if(f.pebblesConversations>0) return 'rivulet-carry';
    if(f.moonConversations>0) return 'rivulet-high';
  }
  if(campaign==='spearmaster') {
    if(f.smPearlTagged) return 'spear-final';
    if(f.pebblesConversations>0) return 'spear-deliver';
  }
  if(campaign==='hunter' && f.redExtraCycles) return 'delivery';
  if(campaign==='saint') {
    if(f.karmaCap>=9) return 'saint-close';
    if(f.ghostsTalkedTo) return [['SI','saint-one'],['CC','saint-two'],['CL','saint-three'],['SL','saint-four'],['UG','saint-five'],['LF','saint-six'],['SB','saint-seven']].find(([region])=>(f.ghostsTalkedTo[region]||0)<2)?.[1] || null;
  }
  return null;
}
