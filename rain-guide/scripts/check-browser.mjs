// Uses existing Playwright and browser; no install or download.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { CAMPAIGNS } from '../src/data.js';
import { MAP_CHARACTERS } from '../src/location.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH} : {})});
const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const context = await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page = await context.newPage(), errors = [], checks = [];
page.on('pageerror',e=>errors.push(e.message));
await mkdir(new URL('../test-results/',import.meta.url),{recursive:true});
const check = (label,condition) => {assert.ok(condition,label);checks.push(label);console.log('PASS '+label);};
const frame = () => page.frames().find(f=>f.url().includes('/upstream/map.html'));
async function ready(role='white',region='SU') {
  await page.waitForFunction(({role,region})=>{const w=document.querySelector('#map-frame')?.contentWindow;return w?.loadedDifficulty===role && w?.loadedRegion===region && w?.rwRoomJSON && document.querySelector('#map-status').textContent==='';},{role,region},{timeout:45000});
}
const screenshot = name => page.screenshot({path:fileURLToPath(new URL(`../test-results/${name}.png`,import.meta.url)),fullPage:true});
try {
  await page.goto(base); await ready();
  check('default uses 67 real SU rooms with terrain and creatures hidden',await frame().evaluate(()=>rwRoomJSON.room_features.length===67 && !map.hasLayer(tileLayer) && !map.hasLayer(geometryLayer) && !map.hasLayer(densLayer) && document.querySelectorAll('.leaflet-tile').length===0));
  check('map occupies over 75% of desktop width',(await page.locator('.map-area').boundingBox()).width>1440*.75);
  check('ordinary names visible and Wiki spoiler names hidden',(await page.locator('#region-select option[value="HI"]').innerText()).includes('工业区') && (await page.locator('#region-select option[value="SS"]').innerText()).includes('剧透区域'));
  await page.locator('#names-toggle').check();
  check('spoiler name switch reveals actual name',!(await page.locator('#region-select option[value="SS"]').innerText()).includes('剧透区域'));
  await page.locator('#names-toggle').uncheck(); await screenshot('desktop-mask');
  await page.locator('#more-hint').focus(); await page.keyboard.press('Enter');
  check('keyboard hint action retains focus',await page.evaluate(()=>document.activeElement.id)==='more-hint');
  await page.locator('#more-hint').click();
  check('deep hint requires deliberate confirmation',await page.locator('#confirm-action').isVisible());
  await page.locator('#confirm-action').click(); await page.reload(); await ready();
  check('refresh cannot carry a deep hint to another clue',(await page.locator('.hint-level').innerText()).includes('1 / 3'));
  await page.locator('#mask-toggle').uncheck();
  await frame().waitForFunction(()=>[...document.querySelectorAll('.leaflet-tile')].some(i=>i.complete && i.naturalWidth),null,{timeout:45000});
  check('real terrain loads without opening hints',await frame().evaluate(()=>map.hasLayer(tileLayer) && map.hasLayer(geometryLayer)) && (await page.locator('.hint-level').innerText()).includes('1 / 3'));
  await screenshot('desktop-terrain');
  await page.locator('#spawns-toggle').check(); await frame().waitForFunction(()=>map.hasLayer(densLayer));
  await page.locator('#mask-toggle').check(); await frame().waitForFunction(()=>!map.hasLayer(tileLayer) && !map.hasLayer(geometryLayer) && !map.hasLayer(densLayer));
  check('mask removes undiscovered terrain and creature layers',!await page.locator('#spawns-toggle').isDisabled());
  await page.locator('#room-query').fill('SU_C04'); await page.locator('#room-form button').click();
  await page.waitForFunction(()=>document.querySelector('#room-route-status').textContent.includes('12 段'));
  check('SU_C04 to HI highlights 12 real connections',true);
  await page.locator('#region-select').selectOption('HI'); await ready('white','HI'); await page.reload(); await ready('white','HI');
  check('manual region survives reload',await page.locator('#region-select').inputValue()==='HI');
  for(const c of CAMPAIGNS) {
    await page.locator('#character-select').selectOption(c.id);
    const region=await page.locator('#region-select').inputValue(); await ready(MAP_CHARACTERS[c.id],region);
    check(`real map loads for ${c.id}`,await frame().evaluate(()=>rwRoomJSON.room_features.length>0) && await page.locator('#mask-toggle').isChecked());
  }
  await page.locator('#region-select').selectOption('WPTA'); await ready('watcher','WPTA');
  check('Watcher expansion schema loads',await frame().evaluate(()=>rwRoomJSON.room_features.length>0));
  await page.goto(base+'#v=1&character=Survivor&region=SU&room=SU_C04&x=12&y=7&px=250.5&py=140.25&cx=-40&cy=0&mode=meadow'); await ready();
  await frame().waitForFunction(()=>document.querySelector('.guide-position'));
  check('Mod location selects correct room and local-player pin',await frame().evaluate(()=>focusedRoom.feature.properties.name==='SU_C04' && [...document.querySelectorAll('.leaflet-tooltip')].some(e=>e.textContent.includes('本地'))) && (await page.locator('#position-text').innerText()).includes('雨甸自由模式'));
  const other=await frame().evaluate(()=>rwRoomJSON.room_features.find(f=>f.properties.name!=='SU_C04').properties.name);
  await page.locator('#room-query').fill(other); await page.locator('#room-form button').click(); await page.locator('#copy-link').click();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  check('another room link cannot reuse old coordinates',copied.includes('room='+other) && !copied.includes('&px=') && !copied.includes('&x='));
  await page.locator('#player-location').click(); await ready();
  check('return to player restores game room',await frame().evaluate(()=>focusedRoom.feature.properties.name==='SU_C04'));
  for(const suffix of ['character=ModCat&region=SU&room=SU_C04','character=Survivor&region=ZZZ&room=ZZZ_A01']) {
    await page.goto(base+'#v=1&'+suffix); await ready();
    check('unsupported location labelled: '+suffix,(await page.locator('#location-warning').innerText()).includes('未完成定位') && await frame().locator('.guide-position').count()===0 && !await page.locator('#player-location').isVisible());
  }
  await page.goto(base+'#v=1&character=Survivor&region=SU&room=SU_NOT_REAL');
  await page.waitForFunction(()=>document.querySelector('#map-status').textContent.includes('没有房间'));
  check('unknown room reports mismatch without player pin',await frame().locator('.guide-position').count()===0);
  await page.locator('#room-query').fill('SU_C04'); await page.locator('#room-form button').click();
  await page.waitForFunction(()=>document.querySelector('#map-status').textContent==='');
  check('correcting a missing room clears the error',true);
  await page.locator('#names-toggle').check();
  await page.goto(base+'#v=1&character=Monk&region=SU&room=SU_C04'); await ready('yellow','SU');
  check('Mod link to a different campaign resets spoiler names',!await page.locator('#names-toggle').isChecked());
  await page.locator('#character-select').selectOption('survivor'); await ready();
  await page.goto(base); await ready();
  await page.locator('#about-button').click(); await page.locator('summary').filter({hasText:'旅途笔记'}).click();
  await page.locator('#old-notes').fill('测试笔记 <script>window.BAD=true</script>');
  const pending=page.waitForEvent('download'); await page.locator('#export-progress').click();
  const download=await pending,backup=JSON.parse(await readFile(await download.path(),'utf8'));
  check('export preserves notes without running HTML',backup.profiles.survivor.notes.includes('<script>') && !await page.evaluate(()=>window.BAD));
  await page.locator('#import-progress').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{')});
  check('malformed backup rejected',(await page.locator('#import-status').innerText()).includes('导入失败'));
  backup.profiles.survivor.hint=2;
  await page.locator('#import-progress').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await page.locator('#confirm-action').click(); await ready();
  check('import restores safe hints and mask',(await page.locator('.hint-level').innerText()).includes('1 / 3') && await page.locator('#mask-toggle').isChecked());
  await page.locator('#about-button').click(); await page.locator('#clear-data').click(); await page.locator('#confirm-action').click(); await ready();
  check('clear removes site progress and old caches',await page.evaluate(async()=>!localStorage.getItem('rainward.progress.v1') && !(await caches.keys()).some(k=>k.startsWith('rainward-'))));
  const response=await context.request.get(new URL('downloads/WhereShouldIGo.zip',base).href);
  check('Mod ZIP downloadable',response.ok() && (await response.body()).subarray(0,2).toString()==='PK');
  for(const width of [390,320]) {
    await page.setViewportSize({width,height:844});
    check(`no page overflow at ${width}px`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); await screenshot('mobile-'+width);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.route('https://raw.githubusercontent.com/rain-world-map/**/region.json',r=>r.abort()); await page.reload();
  await page.waitForFunction(()=>document.querySelector('#map-status').textContent.includes('重新加载'),null,{timeout:30000});
  check('upstream failure shows recoverable error',true);
  check('no uncaught JavaScript errors',errors.length===0);
  console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
} finally {await browser.close();}
