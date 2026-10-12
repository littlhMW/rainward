// Browser verification for v2 snapshots. Uses an existing browser/runtime only.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless:true, ...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH} : {}) });
const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const context = await browser.newContext({viewport:{width:1440,height:1000}});
const page = await context.newPage(), errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const out = new URL('../test-results/',import.meta.url);
await mkdir(out,{recursive:true});
const check = (name, condition) => { assert.ok(condition,name); checks.push(name); console.log('PASS '+name); };
const frame = () => page.frames().find(f=>f.url().includes('/upstream/map.html'));
const shot = name => page.screenshot({path:fileURLToPath(new URL('snapshot-'+name+'.png',out)),fullPage:true});
const hash = snapshot => '#v=2&data='+gzipSync(Buffer.from(JSON.stringify(snapshot))).toString('base64url');
async function ready(role='white',region='SU') {
  await page.waitForFunction(({role,region})=>{
    const map=document.querySelector('#map-frame')?.contentWindow;
    return map?.loadedDifficulty===role && map?.loadedRegion===region && map?.rwRoomJSON && document.querySelector('#map-status').textContent==='';
  },{role,region},{timeout:45000});
}
const state = () => page.evaluate(()=>JSON.parse(localStorage.getItem('rainward.progress.v1')));
async function importSnapshot(value) {
  await page.locator('#import-game').setInputFiles({name:'game-snapshot.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});
  await ready('white',value.region);
  await page.waitForFunction(source=>JSON.parse(localStorage.getItem('rainward.progress.v1'))?.profiles.survivor.gameProgress?.source===source,value.progress.source);
}
async function clipState() {
  return frame().evaluate(()=>({
    pathCount:document.querySelectorAll('#guide-visible-rooms path').length,
    detail:['guideTerrain','guideGeometry','guideSpawns'].map(name=>({name,clip:map.getPane(name).style.clipPath,visibility:map.getPane(name).style.visibility})),
    tiles:map.hasLayer(tileLayer),geometry:map.hasLayer(geometryLayer),spawns:map.hasLayer(densLayer),
  }));
}
async function mapPixels(name) {
  const buffer=await frame().locator('#mapid').screenshot();
  await writeFile(new URL('snapshot-'+name+'.png',out),buffer);
  return buffer.toString('base64');
}
// Compare actual screenshots, not just CSS declarations. Any changed pixels
// outside visible room polygons (+3px antialiasing margin) are a disclosure bug.
async function pixelAudit(blank, partial, polygons) {
  return page.evaluate(async ({blank,partial,polygons})=>{
    const read=async data=>{const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);return {width:c.width,height:c.height,data:g.getImageData(0,0,c.width,c.height).data};};
    const a=await read(blank),b=await read(partial);
    if(a.width!==b.width||a.height!==b.height)throw Error('screenshot viewport changed');
    const inside=(x,y,ring)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const p=ring[i],q=ring[j];if((p.y>y)!==(q.y>y)&&x<(q.x-p.x)*(y-p.y)/(q.y-p.y)+p.x)hit=!hit;}return hit;};
    const distance=(x,y,p,q)=>{const dx=q.x-p.x,dy=q.y-p.y;const t=Math.max(0,Math.min(1,((x-p.x)*dx+(y-p.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-p.x-t*dx,y-p.y-t*dy);};
    const allowed=(x,y)=>polygons.some(ring=>inside(x,y,ring)||ring.some((p,i)=>distance(x,y,p,ring[(i+1)%ring.length])<=3));
    let insideChanged=0,outsideChanged=0;const examples=[];
    for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
      const i=(y*a.width+x)*4;if(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2])<20)continue;
      if(allowed(x,y))insideChanged++;else{outsideChanged++;if(examples.length<5)examples.push({x,y});}
    }
    return {insideChanged,outsideChanged,examples};
  },{blank,partial,polygons});
}
async function waitTiles() {
  await frame().waitForFunction(()=>[...document.querySelectorAll('.leaflet-tile')].some(img=>img.complete&&img.naturalWidth),null,{timeout:45000});
  await frame().waitForFunction(()=>!tileLayer.isLoading(),null,{timeout:45000});
}
async function sampleClip(label) {
  // Keep viewport/players/labels identical. Hide optional nodes and focus border
  // during the comparison so only terrain/geometry/spawns can change pixels.
  await frame().evaluate(()=>{
    const style=document.createElement('style');style.id='snapshot-audit-style';style.textContent='.guide-room-node{visibility:hidden!important}';document.head.append(style);
    roomsLayer.eachLayer(layer=>layer.setStyle({weight:0}));
    window.__snapshotPaneVisibility=['guideTerrain','guideGeometry','guideSpawns'].map(name=>[name,map.getPane(name).style.visibility]);
    for(const [name] of window.__snapshotPaneVisibility)map.getPane(name).style.visibility='hidden';
  });
  const blank=await mapPixels(label+'-blank');
  await frame().evaluate(()=>{for(const [name,value]of window.__snapshotPaneVisibility)map.getPane(name).style.visibility=value;});
  const partial=await mapPixels(label+'-partial');
  const polygons=await frame().evaluate(()=>rwRoomJSON.room_features.filter(f=>rwRoomVisible(f.properties.name)).map(f=>f.geometry.coordinates[0].map(([x,y])=>map.latLngToContainerPoint([y,x]))));
  const audit=await pixelAudit(blank,partial,polygons);
  console.log('PIXELS '+label+' '+JSON.stringify(audit));
  check(label+' terrain is visible inside explored room polygons',audit.insideChanged>50);
  check(label+' no detailed pixels escape the explored-room clip',audit.outsideChanged===0);
  await frame().evaluate(()=>document.querySelector('#snapshot-audit-style')?.remove());
}
try {
  await page.goto(base); await ready();
  check('header links directly to the GitHub project',await page.locator('#github-project').getAttribute('href')==='https://github.com/littlhMW/rainward' && await page.locator('#github-project').isVisible());
  check('fresh visit has no game exploration and no terrain',(await clipState()).pathCount===0 && !(await clipState()).tiles);
  const metadata=await frame().evaluate(()=>{
    const source=rwRoomJSON.room_features,local=source.find(f=>f.properties.name==='SU_C04');
    const center=f=>{const p=f.geometry.coordinates[0];return [(Math.min(...p.map(v=>v[0]))+Math.max(...p.map(v=>v[0])))/2,(Math.min(...p.map(v=>v[1]))+Math.max(...p.map(v=>v[1])))/2];};
    const first=center(local),others=source.filter(f=>f!==local).sort((a,b)=>Math.hypot(...center(a).map((x,i)=>x-first[i]))-Math.hypot(...center(b).map((x,i)=>x-first[i])));
    const ring=local.geometry.coordinates[0];
    return {near:others[0].properties.name,far:others.at(-1).properties.name,px:(Math.max(...ring.map(p=>p[0]))-Math.min(...ring.map(p=>p[0])))/2+17,py:(Math.max(...ring.map(p=>p[1]))-Math.min(...ring.map(p=>p[1])))/2+18};
  });
  const remoteJSON=await page.evaluate(async()=>await (await fetch('https://raw.githubusercontent.com/rain-world-map/vanilla/main/white/hi/region.json')).json());
  const otherRegionRoom=remoteJSON.room_features[0].properties.name;
  const hostile='<img src=x onerror="window.NAME_EXECUTED=true">';
  const snapshot={v:2,character:'Survivor',region:'SU',room:'SU_C04',mode:'story',multiplayer:true,capturedAt:'2026-10-12T14:00:00Z',px:metadata.px,py:metadata.py,cx:0,cy:0,
    progress:{source:'host',saveId:'browser-test-host-A',scope:'save',freshness:'cycle-start',cycle:14,rooms:['SU_C04',metadata.near],flags:{}},
    players:[
      {id:'local',name:'本地测试',local:true,host:false,region:'SU',room:'SU_C04',accuracy:'pixel',px:metadata.px,py:metadata.py,cx:0,cy:0},
      {id:'host',name:hostile,local:false,host:true,region:'SU',room:metadata.near,accuracy:'room',px:999999,py:999999,cx:0,cy:0},
      {id:'remote',name:'另一地区的朋友',region:'HI',room:otherRegionRoom,accuracy:'room'},
      {id:'unavailable',name:'位置不可读取',available:false},
    ]};
  // Exercise both a same-page hash update and a full reload. The update itself
  // must synchronize settings even when the underlying iframe URL is unchanged.
  await page.goto(base+hash(snapshot)); await ready();
  await frame().waitForFunction(()=>document.querySelectorAll('#guide-visible-rooms path').length===2);
  await waitTiles();
  check('gzip v2 link restores host exploration without merging client rooms',(await state()).profiles.survivor.gameProgress.rooms.length===2 && (await page.locator('#sync-summary').innerText()).includes('房主存档'));
  check('v2 exploration clips tiles and geometry in dedicated panes',(await clipState()).detail.every(p=>p.clip.includes('#guide-visible-rooms')&&p.visibility==='') && (await clipState()).geometry);
  check('same-region players have two pins, other regions stay in the list',await frame().locator('.guide-position').count()===2 && await page.locator('.player-row').count()===4);
  const captions=await frame().locator('.guide-player-label').allTextContents();
  check('player labels distinguish local, host and room-only accuracy',captions.some(v=>v.includes('本地测试 · 本地')&&v.includes('位置快照')) && captions.some(v=>v.includes('房主')&&v.includes('仅定位到房间')));
  check('Chinese player caption stays horizontal',(await frame().locator('.guide-player-label.local').boundingBox()).height<65);
  check('hostile names remain plain text in map and sidebar',captions.some(v=>v.includes(hostile)) && await frame().locator('.guide-player-label img').count()===0 && await page.locator('.player-row img').count()===0 && !await page.evaluate(()=>window.NAME_EXECUTED));
  check('map has actual Chinese geographic labels',(await frame().locator('.guide-region-label').innerText()).includes('郊区') && (await frame().locator('.guide-gate-label').allTextContents()).some(v=>v.includes('工业区')));
  check('unavailable player entry is disabled',await page.locator('[data-player="3"]').isDisabled());
  await page.locator('#world-view').click();
  await frame().waitForFunction(()=>map.getZoom()<=-2);
  await waitTiles(); await shot('explored-overview');
  await sampleClip('overview');
  await frame().evaluate(name=>{const found=roomsLayer.getLayers().find(l=>l.feature.properties.name===name);map.fitBounds(found.getBounds().pad(.8));},'SU_C04');
  await waitTiles(); await sampleClip('zoomed');
  await frame().evaluate(()=>map.panBy([113,-67],{animate:false}));
  await sampleClip('panned');
  await page.locator('#spawns-toggle').check();
  await frame().waitForFunction(()=>map.hasLayer(densLayer));
  check('spawns share the same room polygon clip',(await clipState()).detail.find(p=>p.name==='guideSpawns').clip.includes('#guide-visible-rooms'));
  await sampleClip('spawns');

  await frame().evaluate(()=>{const room=roomsLayer.getLayers().find(l=>l.feature.properties.name==='SU_C04');room.fire('contextmenu',{latlng:room.getBounds().getCenter()});});
  check('right click exposes one-room controls',await frame().locator('.guide-room-menu').isVisible());
  await frame().getByRole('button',{name:'遮罩这个房间',exact:true}).click();
  await frame().waitForFunction(()=>!rwRoomVisible('SU_C04'));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('rainward.progress.v1')).profiles.survivor.roomOverrides.SU_C04===false);
  check('one-room cover persists in parent override',(await state()).profiles.survivor.roomOverrides.SU_C04===false);
  await page.reload(); await ready();
  await frame().waitForFunction(()=>!rwRoomVisible('SU_C04')&&document.querySelectorAll('#guide-visible-rooms path').length===1);
  check('same-save snapshot reload preserves manual room cover',true);
  await page.locator('#follow-room').click();
  await frame().waitForFunction(()=>rwRoomVisible('SU_C04'));
  check('follow-save removes the manual override',!Object.hasOwn((await state()).profiles.survivor.roomOverrides,'SU_C04'));
  await page.locator('#room-query').fill(metadata.far); await page.locator('#room-form button').click();
  check('manual room browsing does not add it to game exploration',!(await state()).profiles.survivor.gameProgress.rooms.includes(metadata.far));
  await page.locator('#reveal-room').click();
  await frame().waitForFunction(name=>rwRoomVisible(name),metadata.far);
  check('manual reveal affects only the requested room',(await state()).profiles.survivor.roomOverrides[metadata.far]===true && (await clipState()).pathCount===3);
  await page.locator('#follow-room').click();
  await page.locator('#mask-toggle').uncheck();
  await frame().waitForFunction(()=>map.getPane('guideTerrain').style.clipPath==='none');
  check('global reveal removes clipping from all detailed layers',(await clipState()).detail.every(p=>p.clip==='none'));
  await page.locator('#mask-toggle').check();
  await frame().waitForFunction(()=>document.querySelectorAll('#guide-visible-rooms path').length===2);
  check('global mask restores explored-room policy',true);

  await page.locator('[data-player="2"]').click(); await ready('white','HI');
  await frame().waitForFunction(()=>document.querySelectorAll('.guide-position').length===1);
  check('cross-region player jump focuses actual room and only its regional pin',await frame().evaluate(name=>focusedRoom.feature.properties.name===name,otherRegionRoom));
  await page.locator('#region-select').selectOption('SS'); await ready('white','SS');
  check('Wiki spoiler region is hidden directly on map',(await frame().locator('.guide-region-label').innerText()).includes('剧透区域'));
  await page.locator('#names-toggle').check();
  await frame().waitForFunction(()=>document.querySelector('.guide-region-label')?.textContent.includes('五块卵石'));
  check('names toggle updates map geographic label',true);
  await page.locator('#names-toggle').uncheck();
  await page.locator('#player-location').click(); await ready();
  const unavailable={...snapshot,capturedAt:'2026-10-12T15:00:00Z',progress:{source:'unavailable',rooms:['SU_C04',metadata.near],flags:{hasMark:true}}};
  await importSnapshot(unavailable);
  await frame().waitForFunction(()=>document.querySelectorAll('#guide-visible-rooms path').length===0&&!map.hasLayer(tileLayer));
  check('unavailable host clears old exploration, ignoring submitted client rooms',(await state()).profiles.survivor.gameProgress.rooms.length===0 && (await page.locator('#sync-summary').innerText()).includes('无法读取房主探索记录'));
  check('unavailable host does not remove valid position snapshots',await frame().locator('.guide-position').count()===2);
  await shot('host-unavailable');
  await importSnapshot({...snapshot,capturedAt:'2026-10-12T16:00:00Z'});
  await frame().waitForFunction(()=>document.querySelectorAll('#guide-visible-rooms path').length===2);
  for(const width of [390,320]) {
    await page.setViewportSize({width,height:844});
    await page.locator('#world-view').click(); await waitTiles();
    check(`mobile ${width}px has no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    check(`mobile ${width}px retains room controls and readable player list`,await page.locator('#reveal-room').count()===1 && await page.locator('.player-row').count()===4);
    await shot('mobile-'+width);
  }
  check('no uncaught JavaScript errors',errors.length===0);
  await writeFile(new URL('snapshot-browser-results.json',out),JSON.stringify({passed:checks.length,checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
} catch(error) {
  console.log('FAILURE STATE '+JSON.stringify(await frame()?.evaluate(()=>({settings:rwGuide,clip:document.querySelector('#guide-visible-rooms')?.outerHTML,pins:document.querySelectorAll('.guide-position').length,names:document.querySelectorAll('.guide-region-label').length})).catch(()=>null)));
  await shot('failure').catch(()=>{});
  await writeFile(new URL('snapshot-browser-results.json',out),JSON.stringify({passed:checks.length,checks,errors,failure:String(error)},null,2));
  throw error;
} finally { await browser.close(); }
