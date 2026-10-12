// Optional browser QA. Uses an existing Playwright install and browser;
// does not install packages or download a browser.
// PLAYWRIGHT_MODULE may be an absolute path to the installed package.
// BROWSER_PATH may be an absolute path to an existing Chrome/Edge executable.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { CAMPAIGNS, REGIONS } from '../src/data.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
const check = (label, condition) => { assert.ok(condition, label); checks.push(label); };
const closeDialog = () => page.locator('[data-close]').click();
const role = async id => { await page.locator('#choose-character').click(); await page.locator(`[data-campaign="${id}"]`).click(); };
try {
  await page.goto(base);
  await page.locator('#world-map').waitFor();
  check('fresh visit: anonymous 12-region topology and no external map', await page.locator('.map-node').count() === 12 && await page.locator('iframe').count() === 0);
  check('unvisited real names absent from visible body', !(await page.locator('body').innerText()).includes(REGIONS.SS.name));
  check('unvisited accessible names are anonymous', (await page.locator('.map-node[data-node="HI"]').getAttribute('aria-label')).startsWith('未知区域'));
  await page.locator('.map-node[data-node="HI"]').click();
  check('node selection alone reveals no region name', !(await page.locator('#dialog').innerText()).includes(REGIONS.HI.name));
  await closeDialog();
  await page.locator('#more-hint').focus(); await page.keyboard.press('Enter');
  check('keyboard hint action preserves focus', await page.evaluate(() => document.activeElement.id) === 'more-hint');
  await page.locator('#more-hint').click();
  check('deep hint needs an explicit reveal action', await page.locator('#confirm-action').isVisible());
  await page.locator('#cancel-action').click();
  await page.locator('#less-hint').click();
  await page.locator('#locate-button').click();
  await page.locator('#region-query').fill('SL'); await page.locator('#locate-form button').click();
  await page.locator('[data-found="SL"]').click();
  check('visit is separate from story completion', (await page.locator('.story-panel h2').innerText()).includes('安顿'));
  await page.locator('#complete-stage').click(); await page.locator('#confirm-action').click();
  await page.locator('#history-button').click(); await page.locator('[data-undo="settle"]').click();
  check('story completion is reversible', (await page.locator('.story-panel h2').innerText()).includes('安顿'));
  await page.locator('[data-page="journal"]').click();
  await page.locator('#notes').fill('测试笔记 <script>window.BAD=true</script>');
  const downloadPromise = page.waitForEvent('download'); await page.locator('#journal-export').click();
  const download = await downloadPromise; const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
  check('backup contains local notes', backup.profiles.survivor.notes.startsWith('测试笔记'));
  await page.locator('[data-page="explore"]').click();
  await role('monk'); await page.locator('[data-page="journal"]').click();
  check('notes are isolated by character', await page.locator('#notes').inputValue() === '');
  await page.locator('[data-page="explore"]').click();
  await role('survivor'); await page.locator('[data-page="journal"]').click();
  check('note text is preserved without executing HTML', (await page.locator('#notes').inputValue()).includes('<script>') && !await page.evaluate(() => window.BAD));
  await page.locator('[data-page="explore"]').click();
  await page.locator('#settings-button').click();
  await page.locator('#import-progress').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  check('invalid imports show an error without replacing progress', (await page.locator('#import-status').innerText()).includes('导入失败'));
  backup.profiles.survivor.hint = 2;
  await page.locator('#import-progress').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.locator('#confirm-action').click();
  check('import restores safe hint level and mask', await page.locator('#mask-toggle').isChecked() && await page.locator('#more-hint').innerText().then(t => t.includes('再明确一点')));
  await page.locator('#edition-button').click(); await page.locator('#edition-dlc').check(); await page.locator('#save-edition').click();
  check('DLC switch adds verified expansion regions', await page.locator('.map-node[data-node="VS"]').count() === 1 && await page.locator('.map-node[data-node="MS"]').count() === 1 && await page.locator('.map-node[data-node="OE"]').count() === 0);
  await page.locator('#edition-button').click(); await page.locator('summary').click(); await page.locator('#edition-outer').check(); await page.locator('#save-edition').click();
  check('locked optional region requires explicit unlock setting', await page.locator('.map-node[data-node="OE"]').count() === 1);
  for (const c of CAMPAIGNS) {
    await role(c.id);
    check(`character ${c.id} renders safely`, await page.locator('.map-node').count() > 0 && await page.locator('#mask-toggle').isChecked() && !await page.locator('#names-toggle').isChecked());
    if (c.id === 'watcher') check('Watcher shows 35 waypoints without fabricated navigation', await page.locator('.map-node').count() === 35 && (await page.locator('.next-direction').innerText()).includes('传送门'));
  }
  await role('survivor');
  await page.locator('#mask-toggle').click();
  check('unmasking requires confirmation before requesting external content', await page.locator('#dialog').isVisible() && await page.locator('iframe').count() === 0);
  await page.route('https://rain-world-map.github.io/**', route => route.fulfill({ contentType: 'text/html', body: '<p>External map integration fixture</p>' }));
  await page.locator('#confirm-action').click();
  check('unmasking loads selected map without opening plot hints', await page.locator('iframe').count() === 1 && (await page.locator('#more-hint').innerText()).includes('再明确一点'));
  await page.locator('#mask-toggle').check();
  check('covering removes the external map from the DOM', await page.locator('iframe').count() === 0);
  await page.locator('#settings-button').click(); await page.locator('#clear-all').click(); await page.locator('#confirm-action').click();
  await page.waitForTimeout(400);
  check('clear all removes local progress and caches', await page.evaluate(async () => !localStorage.getItem('rainward.progress.v1') && !(await caches.keys()).some(k => k.startsWith('rainward-'))));
  await page.locator('#toast.show').waitFor({state:'hidden'});
  await page.screenshot({ path: fileURLToPath(new URL('../test-results/desktop.png', import.meta.url)), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    check(`no horizontal overflow at ${width}px`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: fileURLToPath(new URL(`../test-results/mobile-${width}.png`, import.meta.url)), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true); await page.reload();
  check('core guide works offline after caching', await page.locator('#world-map').count() === 1);
  await context.setOffline(false);
  check('no browser JavaScript errors', errors.length === 0);
  console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
} finally { await browser.close(); }
