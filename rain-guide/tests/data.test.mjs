import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGNS, REGIONS, SOURCES, SURVIVAL_TIPS } from '../src/data.js';
import { campaignNodes, findPath, defaultProfile, activeStage } from '../src/engine.js';

const byId = Object.fromEntries(CAMPAIGNS.map(campaign => [campaign.id, campaign]));
const hasEdge = (edges, a, b) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

test('all nine supported story campaigns and 52 distinct regions are represented', () => {
  assert.deepEqual(CAMPAIGNS.map(c => c.id).sort(), [
    'artificer', 'gourmand', 'hunter', 'monk', 'rivulet', 'saint', 'spearmaster', 'survivor', 'watcher',
  ]);
  assert.equal(Object.keys(REGIONS).length, 52);
  for (const region of Object.values(REGIONS)) {
    assert.ok(region.name && region.english && region.clue);
    assert.ok(Number.isFinite(region.x) && Number.isFinite(region.y));
  }
});

test('campaign starts, connections, and every stage destination reference existing regions', () => {
  for (const campaign of CAMPAIGNS) {
    assert.ok(REGIONS[campaign.start], `${campaign.id}: start`);
    for (const edge of [...campaign.edges, ...(campaign.directedEdges || []), ...(campaign.dlcEdges || [])]) {
      assert.equal(edge.length, 2, `${campaign.id}: pair of regions`);
      assert.notEqual(edge[0], edge[1], `${campaign.id}: no accidental self-loop`);
      for (const id of edge) assert.ok(REGIONS[id], `${campaign.id}: edge ${id}`);
    }
    for (const stage of campaign.stages) {
      assert.ok(REGIONS[stage.destination], `${campaign.id}/${stage.id}: destination`);
      for (const id of stage.destinations || []) assert.ok(REGIONS[id], `${campaign.id}/${stage.id}: alternate ${id}`);
    }
  }
});

test('every stage has three progressive hints, a completion condition, and a stable unique ID', () => {
  let mainCount = 0;
  for (const campaign of CAMPAIGNS) {
    const seen = new Set();
    for (const stage of campaign.stages) {
      assert.ok(!seen.has(stage.id), `${campaign.id}: duplicate ${stage.id}`);
      seen.add(stage.id);
      assert.match(stage.id, /^[a-z0-9-]+$/);
      assert.ok(stage.title && stage.completion);
      assert.ok(['story', 'optional'].includes(stage.kind));
      assert.equal(stage.hints.length, 3);
      assert.equal(new Set(stage.hints).size, 3, `${campaign.id}/${stage.id}: hints should increase detail`);
      for (const hint of stage.hints) assert.ok(typeof hint === 'string' && hint.trim().length > 8);
      if (stage.kind === 'story') mainCount += 1;
      if (stage.before) assert.ok(campaign.stages.some(s => s.id === stage.before));
    }
  }
  assert.equal(mainCount, 40);
});

test('all normal-campaign main destinations are reachable in their regional topology', () => {
  // This checks graph integrity only. Gates, mechanics and quest prerequisites
  // are intentionally not represented as a guarantee that a player can pass.
  for (const campaign of CAMPAIGNS.filter(c => c.routeMode !== 'waypoints')) {
    let from = campaign.start;
    for (const stage of campaign.stages.filter(s => s.kind === 'story')) {
      const path = findPath(campaign, from, stage.destination);
      assert.ok(path.length, `${campaign.id}: ${from} -> ${stage.destination} (${stage.id})`);
      assert.equal(path[0], from);
      assert.equal(path.at(-1), stage.destination);
      from = stage.destination;
    }
  }
});

test('optional visits never block the next recommended main stage', () => {
  for (const campaign of CAMPAIGNS) {
    const profile = defaultProfile(campaign);
    const main = campaign.stages.filter(s => s.kind === 'story');
    for (const expected of main) {
      assert.equal(activeStage(campaign, profile)?.id, expected.id);
      profile.completed.push(expected.id);
    }
    assert.equal(activeStage(campaign, profile), null);
  }
});

test('base-game maps do not accidentally route through uninstalled or locked DLC regions', () => {
  for (const id of ['survivor', 'monk', 'hunter']) {
    const campaign = byId[id];
    for (const edge of campaign.edges) {
      assert.ok(!edge.includes('VS') && !edge.includes('MS') && !edge.includes('OE'));
    }
    assert.ok(campaign.dlcEdges.some(edge => edge.includes('VS')));
    assert.ok(campaign.dlcEdges.some(edge => edge.includes('MS')));
    assert.ok(!campaign.dlcEdges.some(edge => edge.includes('OE')));
    assert.ok(!hasEdge(campaign.edges, 'DS', 'CC'));
    assert.ok(!hasEdge(campaign.edges, 'GW', 'SH'));
  }
});

test('known disconnected or campaign-specific passages are not invented as shortcuts', () => {
  for (const id of ['survivor', 'monk', 'hunter', 'gourmand', 'rivulet']) {
    assert.ok(!hasEdge(byId[id].edges, 'UW', 'SL'), `${id}: Precipice is not a through-route`);
  }
  const artificerNodes = campaignNodes(byId.artificer);
  assert.ok(artificerNodes.includes('LC') && artificerNodes.includes('LM'));
  assert.ok(!artificerNodes.includes('DM') && !artificerNodes.includes('SL'));
  assert.ok(hasEdge(byId.artificer.edges, 'UW', 'LC'));
  assert.ok(hasEdge(byId.spearmaster.edges, 'LM', 'DM'));
  assert.ok(!campaignNodes(byId.rivulet).includes('SS'));
  assert.ok(!campaignNodes(byId.rivulet).includes('OE'));
});

test('one-way additions are navigable only in their verified direction', () => {
  assert.deepEqual(findPath(byId.gourmand, 'OE', 'SU'), ['OE', 'SU']);
  assert.notDeepEqual(findPath(byId.gourmand, 'SU', 'OE'), ['SU', 'OE']);
  assert.deepEqual(findPath(byId.saint, 'SB', 'HR'), ['SB', 'HR']);
  assert.deepEqual(findPath(byId.saint, 'HR', 'SB'), []);
  for (const obsolete of ['DS', 'SH', 'UW', 'SS']) {
    assert.ok(!campaignNodes(byId.saint).includes(obsolete), `Saint: obsolete region ${obsolete}`);
  }
});

test('Watcher exposes all waypoints but never invents a static route through dynamic warps', () => {
  const watcher = byId.watcher;
  assert.equal(watcher.routeMode, 'waypoints');
  assert.equal(watcher.regions.length, 35);
  for (const id of watcher.regions) assert.ok(campaignNodes(watcher).includes(id), `Watcher node ${id}`);
  assert.equal(watcher.edges.length, 4, 'only verified prologue connections are stored');
  for (const stage of watcher.stages) assert.deepEqual(findPath(watcher, watcher.start, stage.destination), []);
  const fork = watcher.stages.find(s => s.id === 'watcher-other');
  assert.equal(fork.kind, 'optional');
  assert.equal(fork.before, 'watcher-feathers');
});

test('mechanical help and references have usable HTTPS source links', () => {
  assert.ok(SURVIVAL_TIPS.length >= 15);
  const ids = SURVIVAL_TIPS.map(tip => tip.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const tip of SURVIVAL_TIPS) {
    assert.ok(tip.category && tip.title && tip.summary && tip.body);
    assert.equal(new URL(tip.source).protocol, 'https:');
  }
  for (const source of SOURCES) {
    assert.ok(source.title && source.note);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
});
