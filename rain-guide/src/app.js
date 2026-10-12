import { CAMPAIGNS, REGIONS, SURVIVAL_TIPS } from './data.js?v=2.2.0';
import { EN_CAMPAIGNS, EN_REGIONS, EN_SURVIVAL_TIPS } from './data-en.js?v=2.2.0';
import { STORAGE_KEY, defaultState, defaultProfile, normalizeState, recommendedStage, applyGameProgress, regionName, findPath } from './engine.js?v=2.2.0';
import { REGION_SPOILERS, SPOILER_POLICY } from './spoilers.js';
import { MAP_CHARACTERS, locationFragment } from './location.js';
import { parseGameLink, normalizeSnapshot, MAX_SNAPSHOT_BYTES } from './snapshot.js?v=2.2.0';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let language = 'zh';
try { language = localStorage.getItem('rainward.language') === 'en' ? 'en' : 'zh'; } catch { /* Chinese remains the default without storage access. */ }
const tx = (zh, en) => language === 'en' ? en : zh;
const campaignData = () => language === 'en' ? EN_CAMPAIGNS : CAMPAIGNS;
const regionData = () => language === 'en' ? EN_REGIONS : REGIONS;
const survivalTips = () => language === 'en' ? EN_SURVIVAL_TIPS : SURVIVAL_TIPS;
function translateStatic() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  $('#language-select').value = language;
  $('#language-select').setAttribute('aria-label', tx('界面语言','Interface language'));
  document.querySelectorAll('[data-zh][data-en]').forEach(el => { el.textContent = language === 'en' ? el.dataset.en : el.dataset.zh; });
  document.querySelectorAll('[data-aria-zh][data-aria-en]').forEach(el => el.setAttribute('aria-label', language === 'en' ? el.dataset.ariaEn : el.dataset.ariaZh));
  $('.toolbar').setAttribute('aria-label', tx('地图设置','Map settings'));
  $('#character-select').setAttribute('aria-label', tx('角色','Slugcat'));
  $('#region-select').setAttribute('aria-label', tx('区域','Region'));
  $('#map-frame').title = state?.campaign === 'watcher'
    ? tx('观望者地图外部来源说明','Watcher map source notice')
    : tx('雨世界地图：房间、连接与地形','Rain World map: rooms, connections, and terrain');
  document.title = tx('雨间：我该去哪','Rainward: Where to Go');
  document.querySelector('meta[name="description"]').content = tx('雨间：探索《雨世界》的真实地图，查看角色故事线索与当前地点。','Rainward: explore the Rain World map, story guides, and your current location.');
  document.querySelector('meta[property="og:title"]').content = document.title;
  $('#wiki-link').href = language === 'en' ? 'https://rainworld.miraheze.org/wiki/Rain_World_Wiki' : 'https://rainworld.miraheze.org/wiki/Rain_World_Wiki/zh-hans';
  $('#story-toggle').textContent = document.body.classList.contains('hide-story') ? tx('« 故事线索','« Story guide') : tx('收起线索 »','Hide guide »');
  $('#save-status').textContent = storageOK ? tx('线索进度仅保存在本机','Guide progress is stored on this device') : tx('保存失败，请导出备份','Could not save. Export a backup.');
}
const SNAPSHOT_ERRORS = new Map([
  ['不支持这个位置链接的版本。','This location link version is unsupported.'],
  ['位置链接里的角色、区域或房间格式不正确。','The location link contains an invalid character, region, or room code.'],
  ['位置链接里的坐标超出可用范围。','The location link contains coordinates outside the supported range.'],
  ['游戏快照链接不完整或过大，请导入 JSON 文件。','The game snapshot link is incomplete or too large. Import the JSON file instead.'],
  ['此浏览器不支持地图快照解压，请更新浏览器或导入 JSON。','This browser cannot decompress map snapshots. Update the browser or import the JSON file.'],
  ['解压后的游戏快照超过 1 MB。','The decompressed game snapshot exceeds 1 MB.'],
  ['探索记录超过 12000 个房间，请分开导入存档。','The exploration record exceeds 12,000 rooms. Import a smaller save.'],
  ['玩家位置超过本工具支持的 64 个条目。','The player list exceeds the 64 entries supported by this tool.'],
  ['房间遮罩记录过大。','The room visibility record is too large.'],
  ['目前仅支持版本 2 的游戏地图快照。','Only version 2 game map snapshots are supported.'],
  ['目前仅支持版本 1 的雨间进度文件。','Only version 1 Rainward progress files are supported.'],
]);
function errorText(error) {
  const message = String(error?.message || error || '');
  if (language === 'en') return SNAPSHOT_ERRORS.get(message) || (/[\u3400-\u9fff]/.test(message) ? 'The file or link contains invalid or unsupported data.' : message);
  return /[\u3400-\u9fff]/.test(message) ? message : '文件或链接无效，或其数据格式不受支持。';
}
function mapErrorText(message) {
  const value = String(message || '');
  if (language === 'en' && /[\u3400-\u9fff]/.test(value)) {
    const missingRoom = /(?:原图没有房间|原图中没有房间)\s*([A-Z0-9_+.-]{1,96})/.exec(value);
    if (missingRoom) return `Room ${missingRoom[1]} is not present in the source map. The regional map remains available; terrain mods may cause differences.`;
    return 'The map data could not be loaded. Check the network connection or reload the page.';
  }
  return value;
}
const catalog = await fetch('./upstream/slugcats.json').then(r => r.json());
let state = defaultState(), chosenStage = null, selectedRoom = '', received = null, storageOK = true, mapReady = false, locationError = '', expandedRouteKey = null, manualRoomRoute = null;
let layers = { rooms: false, spawns: false }, locationRequest = 0, mapLoadRequest = 0;
try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = normalizeState(JSON.parse(raw), CAMPAIGNS, REGIONS); } catch { storageOK = false; }
// A hint level belongs to the selected clue, which is intentionally not restored.
for (const p of Object.values(state.profiles)) p.hint = 0;
const baseCampaign = () => campaignData().find(c => c.id === state.campaign) || campaignData()[0];
const profile = () => state.profiles[baseCampaign().id] ||= defaultProfile(baseCampaign());
function campaign() {
  const base = baseCampaign(), p = profile();
  const flags = p.gameProgress?.flags || {};
  const unlocked = { 'gourmand-visit': flags.hasMark, 'artificer-visit': flags.hasRobo && flags.hasMark };
  const c = { ...base, edges: [...(state.prefs.dlc && base.dlcEdges ? base.dlcEdges : base.edges)], directedEdges: [...(base.directedEdges || [])], blockedEdges: [] };
  for (const edge of c.conditionalEdges || []) if (!p.completed.includes(edge.requires) && !unlocked[edge.requires]) c.blockedEdges.push([edge.from, edge.to]);
  if (c.id === 'saint' && !p.completed.includes('saint-seven') && !(flags.karmaCap >= 9)) c.blockedEdges.push(['SB','HR']);
  if (state.prefs.dlc && state.prefs.outerUnlocked && ['survivor','monk'].includes(c.id)) { c.edges.push(['SB','OE']); c.directedEdges.push(['OE','SU']); }
  return c;
}
const gameProgress = () => profile().gameProgress;
const stage = () => baseCampaign().stages.find(s => s.id === chosenStage) || recommendedStage(baseCampaign(), profile());
const names = id => REGION_SPOILERS[id] && !state.prefs.names ? tx(`剧透区域 ${id}`,`Spoiler region ${id}`) : `${regionName(baseCampaign(), regionData(), id)} · ${id}`;
const routeName = id => `${regionName(baseCampaign(), regionData(), id)} · ${id}`;
const regionIdsForCampaign = campaignId => campaignId === 'watcher' ? (campaignData().find(c => c.id === 'watcher')?.regions || []) : Object.keys(catalog[MAP_CHARACTERS[campaignId]]?.regions || {});
const regionIds = () => regionIdsForCampaign(state.campaign);
const route = () => stage() && state.prefs.route ? findPath(campaign(), profile().current, stage().destination) : [];
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageOK = true; } catch { storageOK = false; }
  $('#save-status').textContent = storageOK ? tx('线索进度仅保存在本机','Guide progress is stored on this device') : tx('保存失败，请导出备份','Could not save. Export a backup.');
}
function toast(text) { $('#toast').textContent = text; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').textContent = '', 3500); }
function dialog(title, body, actions = '') {
  $('#dialog-content').innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${esc(title)}</h2><button id="close-dialog" aria-label="${tx('关闭','Close')}">×</button></div>${body}${actions ? `<div class="dialog-actions">${actions}</div>` : ''}`;
  if (!$('#dialog').open) $('#dialog').showModal();
  $('#close-dialog').onclick = () => $('#dialog').close();
}
function confirm(title, body, action, label = tx('确认','Confirm')) {
  dialog(title, `<p class="dialog-copy">${esc(body)}</p>`, `<button id="cancel-action">${tx('取消','Cancel')}</button><button id="confirm-action">${esc(label)}</button>`);
  $('#cancel-action').onclick = () => $('#dialog').close();
  $('#confirm-action').onclick = () => { $('#dialog').close(); action(); };
}
function updateControls() {
  $('#character-select').innerHTML = campaignData().map(c => `<option value="${c.id}" ${c.id === state.campaign ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const ids = regionIds();
  if (!ids.includes(profile().current)) profile().current = baseCampaign().start;
  $('#region-select').innerHTML = ids.map(id => `<option value="${id}" ${id === profile().current ? 'selected' : ''}>${esc(names(id))}</option>`).join('');
  const mapUnavailable = state.campaign === 'watcher';
  for (const id of ['mask-toggle','names-toggle','route-toggle','rooms-toggle','spawns-toggle','world-view']) $('#'+id).disabled = mapUnavailable;
  for (const [id,key] of [['mask-toggle','mask'],['names-toggle','names'],['route-toggle','route']]) $('#'+id).checked = state.prefs[key];
  $('#spawns-toggle').checked = layers.spawns;
  $('#rooms-toggle').checked = layers.rooms;
}
function chooseRegion(id, room = '') {
  if (!regionIds().includes(id)) return;
  if (profile().current !== id) manualRoomRoute = null;
  profile().current = id; if (!profile().known.includes(id)) profile().known.push(id);
  selectedRoom = room; save(); updateControls(); renderStory(); loadMap();
}
function loadMap() {
  const c = baseCampaign(); mapReady = false;
  $('#map-status').textContent = tx('正在读取地图…','Loading map…');
  const region = profile().current;
  const point = received?.campaign === c.id && received.region === region ? received : null;
  const room = selectedRoom || point?.room || '';
  if (c.id === 'watcher') {
    const mapURL = new URL('https://alduris.github.io/watcher-map/map.html');
    mapURL.searchParams.set('region', region);
    if (room) mapURL.searchParams.set('room', room);
    const notice = new URL('./map-source-notice.html', location.href);
    notice.searchParams.set('source', 'watcher');
    notice.searchParams.set('lang', language);
    notice.searchParams.set('map', mapURL.href);
    notice.searchParams.set('regionLabel', names(region));
    $('#map-frame').src = notice.href;
    $('#map-frame').title = tx('观望者地图外部来源说明','Watcher map source notice');
    $('#map-status').textContent = tx('观望者的故事线索可用；地图请在原作者网站查看。','Watcher story guidance is available; open the original map site separately.');
    updatePosition();
    return;
  }
  $('#map-frame').title = tx('雨世界地图：房间、连接与地形','Rain World map: rooms, connections, and terrain');
  const q = new URLSearchParams({ slugcat: MAP_CHARACTERS[c.id], region, mask: state.prefs.mask ? '1' : '0', roomnames: layers.rooms ? '1' : '0', view: String(++mapLoadRequest) });
  let hash = '';
  if (selectedRoom || point?.room) hash = locationFragment({ ...(point && (!selectedRoom || selectedRoom === point.room) ? point : {}), character: c.english, region, room: selectedRoom || point.room });
  $('#map-frame').src = `./upstream/map.html?${q}${hash}`;
  updatePosition();
}

function updatePosition() {
  $('#location-warning').textContent = locationError;
  const here = received?.campaign === state.campaign && received.region === profile().current;
  $('#player-location').hidden = !received?.campaign;
  $('#position-text').textContent = here ? `${tx('本地玩家','Player')}: ${names(received.region)} / ${received.room}${received.x !== undefined && received.y !== undefined ? ` · ${tx('格坐标','Tile')}: ${received.x}, ${received.y}` : ''}${received.capturedAt ? ` · ${new Date(received.capturedAt).toLocaleTimeString(language === 'en' ? 'en' : 'zh-CN')} ${tx('快照','snapshot')}` : ''}${received.mode === 'meadow' ? ` · ${tx('雨甸自由模式','Meadow Free Mode')}` : ''}` : selectedRoom ? `${tx('查询房间','Room')}: ${selectedRoom}` : `${names(profile().current)} · ${tx('点击房间可定位并调整遮罩；滚轮缩放，拖动平移。','Select a room to focus or change its mask. Scroll to zoom and drag to pan.')}`;
  updateRoomControls();
}
function sendMap(action = 'settings') {
  if (!mapReady) return;
  const current = received?.campaign === state.campaign;
  $('#map-frame').contentWindow.postMessage({ type: 'where-to-map', action, mask: state.prefs.mask, rooms: layers.rooms, spawns: layers.spawns, nextRegion: route()[1] || null, route: state.prefs.route, room: selectedRoom || (current && received.region === profile().current ? received.room : null), player: current && received.v !== 2 && received.region === profile().current ? received : null,
    players: current && received.v === 2 ? received.players : [], exploredRooms: gameProgress()?.rooms || [], roomOverrides: profile().roomOverrides,
    names: state.prefs.names, language, regionLabel: names(profile().current), regionLabels: Object.fromEntries(Object.keys(REGIONS).map(id=>[id,names(id)])), manualRoomRoute }, location.origin);
}
function progressText() {
  const p=gameProgress();
  if(!p) return tx('尚无游戏探索记录。按住 G 更新，或导入 Mod 导出的快照。手动查看地图不会计入游戏记录。','No game exploration data is available. Hold G to update, or import a snapshot from the mod. Viewing the map manually does not count as in-game exploration.');
  if(p.source==='unavailable') return tx('无法读取房主探索记录。不会以客机存档替代。雨甸自由模式不提供故事进度；房间仍可手动显示或遮罩。','The host exploration record is unavailable. Client progress is not used as a substitute. Meadow Free Mode has no story progress; rooms can still be revealed or masked manually.');
  const source=p.source==='host'?tx('房主存档','Host save'):tx('单人存档','Single-player save');
  return `${source} · ${tx(`${p.rooms.length} 个已访问房间`,`${p.rooms.length} visited rooms`)}${p.cycle!==null ? ` · ${tx('周期','Cycle')} ${p.cycle}` : ''}${p.capturedAt ? ` · ${new Date(p.capturedAt).toLocaleString(language === 'en' ? 'en' : 'zh-CN')} ${tx('快照','snapshot')}` : ''}. ${p.freshness==='cycle-start'?tx('来自房主已同步记录；本周期新增探索可能尚未同步。','From the host’s synchronized save. Exploration from the current cycle may not yet be included.'):tx('在按下 G 时更新；不会持续追踪。','Updated when G is pressed; this is not live tracking.')}${received?.v===1?tx(' 当前链接只包含位置；探索数据来自上次导入。',' This location link does not update exploration data.') : ''}`;
}
function playersHTML() {
  if(received?.v!==2 || received.campaign!==state.campaign || !received.players.length) return '';
  return `<div class="players-list"><h3>${tx('玩家位置','Player locations')} · ${received.players.length}</h3>${received.players.map((p,i)=>`<button class="player-row" data-player="${i}" ${!p.available||!regionIds().includes(p.region)?'disabled':''}><span>${esc(p.name)}${p.local?` · ${tx('本地','You')}`:''}${p.host?` · ${tx('房主','Host')}`:''}</span><small>${p.available?`${esc(names(p.region))} / ${esc(p.room)}${p.accuracy==='room'?` · ${tx('仅房间','Room only')}`:''}`:tx('当前位置不可读取','Position unavailable')}</small></button>`).join('')}<p class="note">${tx('显示当前可获取的位置快照。其他地区可点击跳转；无法读取的位置保持未知。','Positions reflect the available snapshot. Select a player in another region to jump there. Unknown positions remain undisclosed.')}</p></div>`;
}
function setRoomVisibility(room,visible) {
  if(!/^[A-Z0-9_+.-]{1,96}$/.test(room) || (visible!==null && typeof visible!=='boolean')) return;
  if(visible===null) delete profile().roomOverrides[room]; else profile().roomOverrides[room]=visible;
  state.prefs.mask=true; save(); updateControls(); updateRoomControls(); sendMap();
}
function updateRoomControls() {
  const el=$('#room-visibility'); if(!el)return;
  el.hidden=!selectedRoom || !mapReady;
  const override=profile().roomOverrides[selectedRoom],visited=gameProgress()?.rooms.includes(selectedRoom);
  $('#room-mask-state').textContent=`${selectedRoom} · ${typeof override==='boolean'?(override?tx('手动显示','Manually revealed'):tx('手动遮住','Manually masked')):visited?tx('存档已探索','Visited in save'):tx('存档未记录探索','Not recorded as visited')}${!state.prefs.mask?` · ${tx('当前全图展开','Full map is visible')}`:''}`;
}
function roomRegion(room) {
  const value = String(room || '').toUpperCase();
  const gate = /^GATE_([A-Z0-9]+)_/.exec(value);
  return gate ? gate[1] : value.split('_', 1)[0];
}
function navigationStart(c, p) {
  if (manualRoomRoute?.campaign === c.id && manualRoomRoute.region === p.current && manualRoomRoute.start) return manualRoomRoute.start;
  if (selectedRoom && roomRegion(selectedRoom) === p.current) return selectedRoom;
  if (received?.campaign === c.id && received.region === p.current && received.room) return received.room;
  return '';
}
function navigationRouteHTML(c, p) {
  const current = navigationStart(c, p), target = manualRoomRoute?.campaign === c.id && manualRoomRoute.region === p.current ? manualRoomRoute.target : '';
  const active = manualRoomRoute?.campaign === c.id && manualRoomRoute.region === p.current;
  return `<details class="section room-navigation" id="room-navigation" open><summary>${tx('房间导航','Room navigation')}<small>${tx('输入目标房间代码，起点默认使用当前定位。','Enter a destination room. The starting room uses the current location by default.')}</small></summary><form id="room-route-form" class="room-route-form"><label>${tx('起点房间','Starting room')}<input id="room-route-start" maxlength="96" value="${esc(current)}" placeholder="${tx('例如 SU_C04','e.g. SU_C04')}"></label><label>${tx('目标房间','Destination room')}<input id="room-route-target" maxlength="96" value="${esc(target)}" placeholder="${tx('例如 SU_C12','e.g. SU_C12')}"></label><div class="room-route-actions"><button type="submit">${tx('规划路线','Find route')}</button><button type="button" class="text-button" id="clear-room-route">${tx('清除路线','Clear route')}</button></div></form><p class="note" id="manual-route-status">${active ? tx('正在使用当前区域的房间连接规划路线。','A room-connection route is active in this region.') : tx('路线仅作连接参考；实际门槛、方向与角色能力以游戏为准。','Connections are a reference; gates, direction, and character abilities determine access in game.')}</p></details>`;
}
async function importGameFile(event) {
  const file=event.target.files[0]; if(!file)return;
  try {
    if(file.size>MAX_SNAPSHOT_BYTES)throw new Error(tx('文件超过 1 MB。','File exceeds 1 MB.'));
    const value=normalizeSnapshot(JSON.parse(await file.text()));
    // File import is a fresh snapshot; remove the old URL so refresh cannot replay it.
    applyLocation(value);
    history.replaceState(null,'',location.href.split('#')[0]); ++locationRequest;
    updateControls(); renderStory(); loadMap(); toast(tx('游戏快照已导入。','Game snapshot imported.'));
  } catch(error) { toast(`${tx('导入失败：','Import failed: ')}${errorText(error)}`); }
}
function renderStory() {
  const focus = document.activeElement?.id, c = baseCampaign(), p = profile(), s = stage(), path = route();
  const routeKey = `${c.id}:${s?.id || ''}`;
  $('#story').innerHTML = `<div class="game-sync"><p class="note" id="sync-summary">${esc(progressText())}</p><label class="file-label">${tx('导入游戏快照','Import game snapshot')}<input type="file" id="import-game" accept="application/json,.json"></label></div>${playersHTML()}<p class="story-kicker">${tx('故事线索','Story guide')}${gameProgress()&&gameProgress().source!=='unavailable'?` · ${tx('参考游戏记录','based on game records')}`:''}</p><h2>${esc(s?.title || tx('按自己的节奏继续探索','Continue exploring at your own pace'))}</h2><div class="hint-copy" aria-live="polite">${esc(s ? s.hints[p.hint] : tx('主要故事线索已完成。可回看已完成的线索，或选择可选探索。','The main story guide is complete. Review completed stages or choose an optional journey.'))}</div>
    ${s ? `<p class="hint-level">${tx('提示','Hint')} ${p.hint + 1} / 3 · ${[tx('轻提示','Gentle clue'),tx('方向提示','Direction'),tx('目的地提示','Destination')][p.hint]}</p><button id="more-hint" class="full-button" ${p.hint === 2 ? 'disabled' : ''}>${p.hint === 0 ? tx('再明确一点 →','Reveal a clearer clue →') : p.hint === 1 ? tx('查看目的地提示 →','Show destination hint →') : tx('目的地提示已展开','Destination hint revealed')}</button>${p.hint ? `<button id="less-hint" class="text-button">${tx('收起提示','Hide hint')}</button>` : ''}` : ''}
    <details class="section recommended-route" id="recommended-route" ${expandedRouteKey === routeKey ? 'open' : ''}><summary>${tx('推荐路线','Recommended route')}<small>${tx('展开将显示具体地点名称与区域代码，可能涉及剧透。','Expanding reveals specific place names and region codes and may contain spoilers.')}</small></summary><div class="route">${path.length ? path.map((id,i) => `${i ? '<span>→</span>' : ''}<button data-region="${id}" class="${i === 0 ? 'here' : ''}">${esc(routeName(id))}</button>`).join('') : `<span class="muted">${c.routeMode === 'waypoints' ? tx('传送路径取决于当前存档，请参考游戏内路标。','Warp paths depend on the current save. Follow in-game waypoints.') : !state.prefs.route ? tx('路线显示已关闭。','Route guidance is hidden.') : tx('继续探索当前区域，或查看上方提示。','Explore this region or reveal the next clue.')}</span>`}</div><p class="note" id="room-route-status">${path.length > 1 ? tx('完整地图请打开原作者网站；雨间仅保留区域方向。','Open the source map for room connections; Rainward keeps the regional direction here.') : tx('连接仅供参考；实际通行取决于门槛、方向与角色能力。','Connections are guides. Gates, direction, and character abilities affect access.')}</p></details>
    <div class="section"><h3>${tx('房间代码查询','Room code lookup')}</h3><form id="room-form" class="room-form"><input id="room-query" aria-label="${tx('房间代码','Room code')}" placeholder="${tx('例如 SU_C04','e.g. SU_C04')}" maxlength="96" value="${esc(selectedRoom)}"><button type="submit">${tx('定位','Locate')}</button></form><div id="room-visibility" hidden><p id="room-mask-state" class="note"></p><div class="room-mask-actions"><button id="reveal-room">${tx('显示此房间','Reveal room')}</button><button id="cover-room">${tx('遮罩此房间','Mask room')}</button><button id="follow-room">${tx('跟随探索记录','Follow exploration')}</button></div></div><button class="text-button" id="copy-link">${tx('复制当前位置链接','Copy location link')}</button></div>
    ${navigationRouteHTML(c, p)}
    ${s && c.stages.some(v => v.before === s.id) ? `<p class="branch-warning">${tx('不同选择会影响后续路线。','Some choices affect later routes.')}<button id="branch-info" class="text-button">${tx('查看提醒 →','View note →')}</button></p>` : ''}
    ${s ? `<button class="full-button complete" id="complete-stage">✓ ${tx('确认完成此线索','Mark clue complete')}</button>` : ''}<p class="note">${tx('探索记录读取自游戏存档。故事建议只依据可识别的标记；到过房间不代表完成互动，无法确认的目标由玩家判断。','Exploration is read from the save. Story guidance uses identifiable flags; visiting a room does not confirm an encounter. Confirm uncertain goals yourself.')}</p><button class="text-button" id="stages-button">${tx('选择其他线索或可选探索','Choose another clue or optional journey')}</button>
    <details class="section"><summary>${tx('角色说明与路线设置','Campaign notes and route settings')}</summary><p class="note">${esc(c.warning)}</p>${c.dlcEdges ? `<label class="note"><input id="dlc-setting" type="checkbox" ${state.prefs.dlc ? 'checked' : ''}> ${tx('已启用 Downpour','Downpour is enabled')}</label><br><label class="note"><input id="outer-setting" type="checkbox" ${state.prefs.outerUnlocked ? 'checked' : ''}> ${tx('当前存档已完成饕餮旅途','Gourmand’s journey is complete in this save')}</label><p class="note">${tx('这些选项只影响路线建议；完整地图请打开原作者网站。','These options affect route guidance only. Open the source site for the complete map.')}</p>` : ''}</details>`;
  if ($('#more-hint')) $('#more-hint').onclick = () => p.hint === 1 ? confirm(tx('展开目的地提示？','Reveal the destination hint?'), tx('提示将给出具体地区与行动条件，可能包含剧透。','This hint names a region and describes story conditions. It may contain spoilers.'), () => { p.hint = 2; save(); renderStory(); }, tx('展开提示','Reveal hint')) : (p.hint = 1, save(), renderStory());
  if ($('#less-hint')) $('#less-hint').onclick = () => { p.hint = 0; save(); renderStory(); };
  $('#recommended-route').ontoggle = event => { expandedRouteKey = event.currentTarget.open ? routeKey : null; };
  if ($('#complete-stage')) $('#complete-stage').onclick = () => confirm(tx('记录线索完成','Mark this clue complete'), s.completion, () => { p.completed = [...new Set([...p.completed,s.id])]; chosenStage = null; p.hint = 0; save(); renderStory(); sendMap(); }, tx('确认完成','Confirm'));
  $('#stages-button').onclick = showStages;
  $('#import-game').onchange=importGameFile;
  document.querySelectorAll('[data-player]').forEach(button=>button.onclick=()=>{const player=received.players[Number(button.dataset.player)];chooseRegion(player.region,player.room);});
  $('#reveal-room').onclick=()=>setRoomVisibility(selectedRoom,true);
  $('#cover-room').onclick=()=>setRoomVisibility(selectedRoom,false);
  $('#follow-room').onclick=()=>setRoomVisibility(selectedRoom,null);
  updateRoomControls();
  document.querySelectorAll('[data-region]').forEach(b => b.onclick = () => chooseRegion(b.dataset.region));
  $('#room-form').onsubmit = event => { event.preventDefault(); const room = $('#room-query').value.trim().toUpperCase(); if (!/^[A-Z0-9_+.-]{1,96}$/.test(room)) return toast(tx('请输入有效的房间代码，例如 SU_C04。','Enter a valid room code, such as SU_C04.')); selectedRoom = room; sendMap('focus'); updatePosition(); };
  $('#room-route-form').onsubmit = event => {
    event.preventDefault();
    const start = $('#room-route-start').value.trim().toUpperCase(), target = $('#room-route-target').value.trim().toUpperCase();
    if (!/^[A-Z0-9_+.-]{1,96}$/.test(start) || !/^[A-Z0-9_+.-]{1,96}$/.test(target)) return toast(tx('请输入有效的起点和目标房间代码。','Enter valid starting and destination room codes.'));
    if (roomRegion(start) !== p.current || roomRegion(target) !== p.current) {
      $('#manual-route-status').textContent = tx('房间导航目前只计算当前区域，请先切换到目标所在区域。','Room navigation currently works within the selected region. Switch to the target region first.');
      return;
    }
    manualRoomRoute = { campaign:c.id, region:p.current, start, target };
    sendMap('manual-route');
    $('#manual-route-status').textContent = tx('正在根据原图连接规划路线…','Planning a route from the source-map connections…');
  };
  $('#clear-room-route').onclick = () => { manualRoomRoute = null; sendMap('manual-route'); $('#manual-route-status').textContent = tx('路线已清除。','Route cleared.'); };
  $('#copy-link').onclick = async () => {
    if (!selectedRoom && !(received?.campaign === c.id && received.region === p.current)) return toast(tx('请先选中或输入房间代码，再复制链接。','Select or enter a room code before copying a location link.'));
    const value = { ...(received?.campaign === c.id && received.region === p.current && (!selectedRoom || selectedRoom === received.room) ? received : {}), character: c.english, region: p.current, room: selectedRoom || received.room };
    const url = location.href.split('#')[0] + locationFragment(value);
    try { await navigator.clipboard.writeText(url); toast(tx('位置链接已复制。','Location link copied.')); } catch { dialog(tx('位置链接','Location link'), `<p class="dialog-copy">${esc(url)}</p>`); }
  };
  if ($('#branch-info')) $('#branch-info').onclick = () => { const extra = c.stages.find(v => v.before === s.id); dialog(tx('路线分支提示','Route branch'), `<p class="dialog-copy">${esc(extra.hints[0])}</p><details><summary>${tx('查看具体条件','View conditions')}</summary><p class="dialog-copy">${esc(extra.hints[2])}</p></details>`); };
  for (const [id,key] of [['dlc-setting','dlc'],['outer-setting','outerUnlocked']]) if ($('#'+id)) $('#'+id).onchange = event => { state.prefs[key] = event.target.checked; save(); renderStory(); sendMap(); };
  if (focus && document.getElementById(focus) && !document.getElementById(focus).disabled) document.getElementById(focus).focus({preventScroll:true});
  else if (focus === 'more-hint' || focus === 'complete-stage') $('#story').focus({preventScroll:true});
}
function showStages() {
  const c = baseCampaign(), p = profile();
  dialog(tx('选择线索','Select a clue'), `<p class="note">${tx('可选择与当前进度相符的线索。未完成的目标不会自动标记。选中后显示第一层提示。','Choose a clue that matches your progress. Other goals remain unchanged. The first hint is shown.')}</p><div class="stage-list">${c.stages.map(s => `<button data-stage="${s.id}">${p.completed.includes(s.id) ? '✓ ' : ''}${esc(s.title)}<small>${s.kind === 'optional' ? tx('可选','Optional') : ''}</small></button>`).join('')}</div><div class="section"><button id="reset-role">${tx('重置当前角色记录','Reset this campaign')}</button></div>`);
  document.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => { chosenStage = b.dataset.stage; p.hint = 0; $('#dialog').close(); save(); renderStory(); sendMap(); });
  $('#reset-role').onclick = () => confirm(tx('重置当前角色？','Reset this campaign?'),tx('此操作将清除当前角色的线索与探索记录，不影响其他角色，并保留旅途笔记。','This clears clue and exploration records for this campaign only. Other campaigns and travel notes are preserved.'), () => { const notes=p.notes; state.profiles[c.id]=defaultProfile(c); profile().notes=notes; chosenStage=null; selectedRoom=''; received=null;history.replaceState(null,'',location.href.split('#')[0]);++locationRequest; save(); updateControls(); renderStory(); loadMap(); });
}
function applyLocation(value) {
  if (!value.campaign) throw new Error(tx('尚未收录此角色。','This campaign is not supported.'));
  if (!regionIdsForCampaign(value.campaign).includes(value.region)) throw new Error(tx(`地图数据未收录区域 ${value.region}。`,`The map data does not include region ${value.region}.`));
  received = value;
  locationError = '';
  if (state.campaign !== value.campaign) { state.prefs.mask = true; state.prefs.names = false; }
  state.campaign = value.campaign; chosenStage = null; selectedRoom = ''; manualRoomRoute = null;
  if (value.v === 2) {
    if (applyGameProgress(profile(), value.progress)) state.prefs.names = false;
    state.prefs.mask = true;
    state.prefs.route = value.route !== false;
  }
  profile().current = value.region; selectedRoom = value.room;
  if (!profile().known.includes(value.region)) profile().known.push(value.region);
  if (value.dlc) state.prefs.dlc = true;
  if (value.v !== 2) chosenStage = baseCampaign().stages.find(s => s.destination === value.region && s.kind !== 'optional' && !profile().completed.includes(s.id))?.id || null;
  profile().hint = 0; save(); return true;
}
async function receiveLocation() {
  const request = ++locationRequest;
  received = null; locationError = ''; selectedRoom = ''; manualRoomRoute = null;
  try {
    if (new URLSearchParams(location.hash.slice(1)).get('sync') === 'file') {
      locationError = tx('快照较大，Mod 已导出 snapshot.json。请在侧栏选择“导入游戏快照”并选取该文件。','The snapshot is too large for a link. The mod exported snapshot.json. Select “Import game snapshot” in the sidebar and choose that file.');
      return;
    }
    const value = await parseGameLink(location.hash);
    if (request !== locationRequest) return;
    if (value) applyLocation(value);
  } catch (error) {
    if (request !== locationRequest) return;
    locationError = errorText(error) + tx(' 未完成定位，本地记录已保留。',' The location was not applied. Local records were preserved.');
  }
}
window.addEventListener('hashchange', async () => { await receiveLocation(); updateControls(); renderStory(); loadMap(); });
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== $('#map-frame').contentWindow || event.data?.type !== 'where-to-parent') return;
  const message = event.data;
  if (message.event === 'ready') { mapReady = true; $('#map-status').textContent = ''; sendMap(); }
  if (message.event === 'error') $('#map-status').textContent = `${mapErrorText(message.message)} ${tx('可切换区域或重新加载页面。','Select another region or reload the page.')}`;
  if (message.event === 'room') { $('#map-status').textContent = ''; selectedRoom = message.room; if ($('#room-query')) $('#room-query').value = selectedRoom; if (!manualRoomRoute && $('#room-route-start')) $('#room-route-start').value = selectedRoom; updatePosition(); }
  if (message.event === 'room-mask') { selectedRoom = message.room; if ($('#room-query')) $('#room-query').value = selectedRoom; setRoomVisibility(message.room,message.visible); updatePosition(); }
  if (message.event === 'route' && $('#room-route-status')) $('#room-route-status').textContent = message.message;
  if (message.event === 'manual-route' && $('#manual-route-status')) $('#manual-route-status').textContent = message.message;
});
$('#character-select').onchange = e => { state.campaign=e.target.value; chosenStage=null; selectedRoom=''; manualRoomRoute=null; profile().hint=0; state.prefs.mask=true; state.prefs.names=false; save(); updateControls(); renderStory(); loadMap(); };
$('#region-select').onchange = e => chooseRegion(e.target.value);
$('#mask-toggle').onchange = e => { state.prefs.mask=e.target.checked; save(); updateControls(); updateRoomControls(); sendMap(); };
$('#names-toggle').onchange = e => { state.prefs.names=e.target.checked; save(); updateControls(); renderStory(); updatePosition(); sendMap(); };
$('#route-toggle').onchange = e => { state.prefs.route=e.target.checked; save(); renderStory(); sendMap(); };
$('#rooms-toggle').onchange = e => { layers.rooms=e.target.checked; sendMap(); };
$('#spawns-toggle').onchange = e => { layers.spawns=e.target.checked; sendMap(); };
$('#world-view').onclick = () => sendMap('overview');
$('.skip-link').onclick = event => { event.preventDefault(); $('#story').focus(); };
$('#story-toggle').onclick = () => { const hide=document.body.classList.toggle('hide-story'); $('#story-toggle').textContent=hide?tx('« 故事线索','« Story guide'):tx('收起线索 »','Hide guide »'); $('#story-toggle').setAttribute('aria-expanded',String(!hide)); sendMap('resize'); };
$('#player-location').onclick = () => { if (!received?.campaign) return; state.campaign=received.campaign; chooseRegion(received.region, received.room); };
$('#help-button').onclick = () => {
  dialog(tx('生存指南','Survival guide'), `<div class="help-list">${survivalTips().map(tip => `<button data-tip="${tip.id}">${esc(tip.title)}<small>${esc(tip.summary)}</small></button>`).join('')}</div>`);
  document.querySelectorAll('[data-tip]').forEach(button => button.onclick = () => { const tip=survivalTips().find(item=>item.id===button.dataset.tip); dialog(tip.title, `<p class="dialog-copy">${esc(tip.body)}</p><a href="${esc(tip.source)}" target="_blank" rel="noopener noreferrer">${tx('Wiki 来源；外部页面可能包含剧透 ↗','Wiki source; external pages may contain spoilers ↗')}</a>`); });
};
function exportProgress() {
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='where-should-i-go-progress.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('#about-button').onclick = () => {
  const body = language === 'en'
    ? `<p class="dialog-copy">Rainward uses the licensed Rain World Map front end for base-game and Downpour rooms, connections, terrain, and tiles. Unexplored rooms are masked by default; imported game records reveal visited rooms. Reveal or mask rooms individually, or show the full region from the toolbar. Watcher keeps its story guide and opens its original map site separately.</p><p class="note">Spoiler region names follow the Wiki’s collapsed groups. Room codes remain available for precise lookup. Map images and expanded story clues may reveal later content.</p><p class="dialog-copy"><a href="https://github.com/littlhMW/rainward" target="_blank" rel="noopener noreferrer">GitHub project ↗</a> · <a href="https://github.com/littlhMW/rainward" target="_blank" rel="noopener noreferrer">Star on GitHub ↗</a></p><div class="section"><h3>In-game location</h3><p class="dialog-copy">Install the mod in the game’s mods folder and enable it in Remix. Hold G for 0.6 seconds to open this page with a location snapshot. Change the key and hold duration in Remix settings.</p><p class="note">Rain Meadow shows currently available player positions. Exploration uses the host’s save; changes from the client’s current cycle may not yet be synchronized. Free Mode provides location only. Terrain mods may affect map accuracy.</p><a href="./downloads/Rainward-WhereToGo.zip" download>Download the mod</a> · <a href="https://github.com/littlhMW/rainward/tree/main/rain-guide/mod" target="_blank" rel="noopener noreferrer">Mod information, installation, and removal</a></div><div class="section"><h3>Local data</h3><div class="data-actions"><button id="export-progress">Export progress</button><label class="file-label">Import backup<input type="file" id="import-progress" accept="application/json,.json"></label><button id="clear-data">Clear site data</button></div><p id="import-status" role="status" class="note"></p><details><summary>Travel notes</summary><textarea class="old-notes" id="old-notes" maxlength="12000" aria-label="Travel notes">${esc(profile().notes)}</textarea></details></div>`
    : `<p class="dialog-copy">雨间使用具备许可记录的 Rain World Map 前端显示原版与 Downpour 的房间、连接、地形与瓦片。默认遮罩未探索房间；导入游戏记录后显示已访问房间。可单独调整每个房间，也可从工具栏展开区域全图。Watcher 保留故事线索，并单独打开原作者地图。</p><p class="note">剧透区域名按 Wiki 的折叠分组默认隐藏。房间代码可继续用于精确定位；地图图像和展开后的故事提示可能包含后续内容。</p><p class="dialog-copy"><a href="https://github.com/littlhMW/rainward" target="_blank" rel="noopener noreferrer">GitHub 项目 ↗</a> · <a href="https://github.com/littlhMW/rainward" target="_blank" rel="noopener noreferrer">在 GitHub 上 Star ↗</a></p><div class="section"><h3>游戏内定位</h3><p class="dialog-copy">将 Mod 安装到游戏的 mods 目录，并在 Remix 中启用。默认按住 G 0.6 秒，可携带当前位置快照打开本页。按键和长按时长可在 Remix 设置中修改。</p><p class="note">雨甸显示当前可读取的玩家位置，探索记录取自房主存档；客机本周期的变化可能尚未同步。自由模式可显示位置，但无法确认探索和故事进度。地形类 Mod 可能影响地图准确性。</p><a href="./downloads/Rainward-WhereToGo.zip" download>下载 Mod</a> · <a href="https://github.com/littlhMW/rainward/tree/main/rain-guide/mod" target="_blank" rel="noopener noreferrer">Mod 说明、安装与卸载</a></div><div class="section"><h3>本地数据</h3><div class="data-actions"><button id="export-progress">导出进度</button><label class="file-label">导入备份<input type="file" id="import-progress" accept="application/json,.json"></label><button id="clear-data">清除本站数据</button></div><p id="import-status" role="status" class="note"></p><details><summary>旅途笔记</summary><textarea class="old-notes" id="old-notes" maxlength="12000" aria-label="当前角色笔记">${esc(profile().notes)}</textarea></details></div>`;
  dialog(tx('雨间：我该去哪','Rainward: Where to Go'), body);
  $('#export-progress').onclick=exportProgress;
  $('#old-notes').oninput=e=>{profile().notes=e.target.value;save();};
  $('#import-progress').onchange=async e=>{const file=e.target.files[0]; if(!file)return;try{if(file.size>12000000)throw new Error(tx('文件不得超过 12 MB。','File must not exceed 12 MB.'));const next=normalizeState(JSON.parse(await file.text()),CAMPAIGNS,REGIONS);confirm(tx('替换本地进度？','Replace local progress?'),tx('此操作将替换所有角色记录。建议先导出备份。','This replaces records for all campaigns. Export a backup first.'),()=>{state=next;received=null;history.replaceState(null,'',location.href.split('#')[0]);++locationRequest;for(const p of Object.values(state.profiles))p.hint=0;state.prefs.mask=true;state.prefs.names=false;chosenStage=null;selectedRoom='';save();updateControls();renderStory();loadMap();});}catch(err){$('#import-status').textContent=`${tx('导入失败：','Import failed: ')}${err.message}`;}};
  $('#clear-data').onclick=()=>confirm(tx('清除本站数据？','Clear site data?'),tx('此操作将清除所有角色记录与旅途笔记，不会修改游戏存档。','This clears records and travel notes for every campaign. Game saves are not changed.'),async()=>{try{localStorage.removeItem(STORAGE_KEY);for(const key of await caches.keys())if(key.startsWith('rainward-'))await caches.delete(key);state=defaultState();chosenStage=null;selectedRoom='';received=null;locationError='';++locationRequest;history.replaceState(null,'',location.href.split('#')[0]);updateControls();renderStory();loadMap();toast(tx('本站数据已清除。','Site data cleared.'));}catch{toast(tx('浏览器未允许清除数据，请在站点设置中移除。','The browser could not clear site data. Remove it in site settings.'));}});
};
$('#language-select').onchange = event => {
  language = event.target.value === 'en' ? 'en' : 'zh';
  try { localStorage.setItem('rainward.language', language); } catch { /* Language applies for this session. */ }
  translateStatic(); updateControls(); renderStory(); updatePosition(); sendMap();
};
translateStatic(); await receiveLocation(); updateControls(); renderStory(); loadMap();
if(!storageOK)$('#save-status').textContent=tx('本地存储不可用，请导出备份。','Local storage is unavailable. Export a backup.');
// Retire the old cache directly. Registering a retirement worker on every visit
// can revive an already unregistered worker without running activate again.
(async () => {
  if ('serviceWorker' in navigator) {
    const scope = new URL('./', location.href).href;
    for (const registration of await navigator.serviceWorker.getRegistrations())
      if (registration.scope === scope) await registration.unregister();
  }
  if ('caches' in window) for (const key of await caches.keys())
    if (key.startsWith('rainward-')) await caches.delete(key);
})().catch(()=>{});
