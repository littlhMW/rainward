import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSION,
  defaultState,
  defaultProfile,
  normalizeState,
  campaignNodes,
  activeStage,
  regionName,
  visibleName,
  availableEdges,
  adjacentRegions,
  findPath,
  exactRegionMatches,
} from '../src/engine.js';

// These deliberately fictional regions exercise behavior without needing
// campaign content, external sources, a browser, or downloaded dependencies.
const REGIONS = {
  A: { name: '起点', english: 'Starting Place', aliases: ['出生地'] },
  B: { name: '未见的山谷', english: 'Hidden Valley', aliases: ['山谷全名'] },
  C: { name: '未见的高塔', english: 'Hidden Tower', aliases: [] },
  D: { name: '未见的港湾', english: 'Hidden Harbor', aliases: [] },
  E: { name: '另一旅者起点', english: 'Other Start', aliases: [] },
  F: { name: '另一旅者区域', english: 'Other Region', aliases: [] },
  ISOLATED: { name: '独立路标', english: 'Isolated Waypoint', aliases: [] },
  DLC_ONLY: { name: '扩展区域', english: 'Expansion Area', aliases: [] },
};
const survivor = {
  id: 'survivor', start: 'A', nodes: ['ISOLATED'],
  edges: [['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'C']],
  stages: [
    { id: 'optional-first', kind: 'optional', destination: 'D' },
    { id: 'first', destination: 'B' },
    { id: 'optional-middle', kind: 'optional', destination: 'D' },
    { id: 'second', destination: 'C' },
  ],
};
const other = {
  id: 'other', start: 'E', nodes: [], edges: [['E', 'F']],
  regionNames: { F: '本旅者的特别名称' },
  stages: [{ id: 'other-first', destination: 'F' }],
};
const campaigns = [survivor, other];
const imported = (profiles = {}, extra = {}) => ({ version: VERSION, campaign: 'survivor', profiles, ...extra });

test('a new journey starts masked with no completed story or expanded hint', () => {
  const state = defaultState();
  const profile = defaultProfile(survivor);
  assert.equal(state.campaign, 'survivor');
  assert.equal(state.prefs.mask, true);
  assert.equal(state.prefs.names, false);
  assert.equal(state.prefs.dlc, false);
  assert.equal(state.prefs.outerUnlocked, false);
  assert.deepEqual(state.profiles, {});
  assert.equal(profile.current, 'A');
  assert.deepEqual(profile.known, ['A']);
  assert.deepEqual(profile.completed, []);
  assert.equal(profile.hint, 0);
});

test('fresh state and role profiles do not share mutable records', () => {
  const first = defaultState(), second = defaultState();
  first.prefs.names = true;
  assert.equal(second.prefs.names, false);
  const a = defaultProfile(survivor), b = defaultProfile(survivor);
  a.known.push('B');
  a.completed.push('first');
  a.checklist.push('rain');
  assert.deepEqual(b.known, ['A']);
  assert.deepEqual(b.completed, []);
  assert.deepEqual(b.checklist, []);
});

test('import rejects empty, primitive, and unsupported-version input', () => {
  for (const input of [null, undefined, false, 12, 'json', [], {}, { version: '1' }, { version: 0 }, { version: 2 }]) {
    assert.throws(() => normalizeState(input, campaigns, REGIONS), /版本 1/);
  }
});

test('import defaults unknown roles and accepts only boolean preferences', () => {
  const state = normalizeState(imported({}, {
    campaign: '__proto__',
    prefs: { mask: 'false', names: true, route: 0, dlc: null, outerUnlocked: 'true', injected: true },
  }), campaigns, REGIONS);
  assert.equal(state.campaign, 'survivor');
  assert.deepEqual(state.prefs, { mask: true, names: true, route: true, dlc: false, outerUnlocked: false });
});

test('import accepts explicit edition and optional-route preferences as booleans', () => {
  const state = normalizeState(imported({}, { prefs: { dlc: true, outerUnlocked: true } }), campaigns, REGIONS);
  assert.equal(state.prefs.dlc, true);
  assert.equal(state.prefs.outerUnlocked, true);
});

test('import drops foreign region IDs, foreign stage IDs, and duplicate records', () => {
  const state = normalizeState(imported({ survivor: {
    current: 'B', known: ['B', 'B', 'E', '__proto__', null, 13, {}, ['C']],
    completed: ['first', 'first', 'other-first', '__proto__', null, 42],
    checklist: ['food', 'untrusted', null, 'rain'],
  } }), campaigns, REGIONS);
  assert.deepEqual(state.profiles.survivor.known, ['A', 'B']);
  assert.equal(state.profiles.survivor.current, 'B');
  assert.deepEqual(state.profiles.survivor.completed, ['first']);
  assert.deepEqual(state.profiles.survivor.checklist, ['food', 'rain']);
});

test('import never makes an unknown or foreign region the current location', () => {
  for (const current of ['C', 'E', 'made-up', '__proto__', {}, null]) {
    const state = normalizeState(imported({ survivor: { current, known: ['B'] } }), campaigns, REGIONS);
    assert.equal(state.profiles.survivor.current, 'A');
  }
});

test('regions missing from the catalog cannot enter an imported known list', () => {
  const missingCatalog = { ...REGIONS };
  delete missingCatalog.B;
  const state = normalizeState(imported({ survivor: { known: ['B'], current: 'B' } }), campaigns, missingCatalog);
  assert.deepEqual(state.profiles.survivor.known, ['A']);
  assert.equal(state.profiles.survivor.current, 'A');
});

test('malformed profile fields reset safely and notes have a storage bound', () => {
  const state = normalizeState(imported({ survivor: {
    known: 'B', completed: { first: true }, checklist: 'food', hint: '2', notes: '字'.repeat(13000),
  }, other: 'not a profile' }), campaigns, REGIONS);
  assert.deepEqual(state.profiles.survivor.known, ['A']);
  assert.deepEqual(state.profiles.survivor.completed, []);
  assert.deepEqual(state.profiles.survivor.checklist, []);
  assert.equal(state.profiles.survivor.hint, 0);
  assert.equal(state.profiles.survivor.notes.length, 12000);
  assert.equal(Object.hasOwn(state.profiles, 'other'), false);
  assert.equal(normalizeState(imported({ survivor: { notes: {} } }), campaigns, REGIONS).profiles.survivor.notes, '');
});

test('imported hint levels are integers bounded to supported disclosure levels', () => {
  for (const [hint, expected] of [[-10, 0], [0, 0], [1, 1], [2, 2], [99, 2], [1.5, 0], [null, 0]]) {
    assert.equal(normalizeState(imported({ survivor: { hint } }), campaigns, REGIONS).profiles.survivor.hint, expected);
  }
});

test('JSON prototype-pollution keys and unknown nested fields are not copied', () => {
  const payload = JSON.parse('{"version":1,"campaign":"survivor","__proto__":{"polluted":"yes"},"prefs":{"__proto__":{"mask":false},"constructor":{"prototype":{"polluted":"yes"}}},"profiles":{"survivor":{"known":["B","__proto__"],"notes":"<img src=x onerror=alert(1)>","__proto__":{"polluted":"yes"},"extra":"discard"},"__proto__":{"polluted":"yes"}}}');
  const state = normalizeState(payload, campaigns, REGIONS);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.getPrototypeOf(state), Object.prototype);
  assert.equal(Object.getPrototypeOf(state.profiles), Object.prototype);
  assert.equal(Object.hasOwn(state, '__proto__'), false);
  assert.equal(Object.hasOwn(state.prefs, 'constructor'), false);
  assert.equal(Object.hasOwn(state.profiles, '__proto__'), false);
  assert.equal(Object.hasOwn(state.profiles.survivor, 'extra'), false);
  assert.deepEqual(state.profiles.survivor.known, ['A', 'B']);
  // Notes remain inert text here; escaping belongs to the rendering layer.
  assert.equal(state.profiles.survivor.notes, '<img src=x onerror=alert(1)>');
});

test('role progress stays isolated when importing a multi-role backup', () => {
  const state = normalizeState(imported({
    survivor: { known: ['B', 'F'], current: 'B', completed: ['first', 'other-first'], hint: 2, notes: '甲的笔记' },
    other: { known: ['F', 'B'], current: 'F', completed: ['other-first', 'first'], hint: 0, notes: '乙的笔记' },
  }), campaigns, REGIONS);
  assert.deepEqual(state.profiles.survivor.known, ['A', 'B']);
  assert.deepEqual(state.profiles.other.known, ['E', 'F']);
  assert.deepEqual(state.profiles.survivor.completed, ['first']);
  assert.deepEqual(state.profiles.other.completed, ['other-first']);
  assert.equal(state.profiles.other.hint, 0);
  assert.equal(state.profiles.other.notes, '乙的笔记');
  state.profiles.survivor.known.push('C');
  assert.deepEqual(state.profiles.other.known, ['E', 'F']);
});

test('normalization makes independent arrays and does not modify the input backup', () => {
  const original = imported({ survivor: { known: ['B'], completed: ['first'], checklist: ['rain'], notes: '旅途' } });
  const before = JSON.stringify(original);
  const state = normalizeState(original, campaigns, REGIONS);
  assert.equal(JSON.stringify(original), before);
  original.profiles.survivor.known.push('C');
  original.profiles.survivor.completed.push('second');
  original.profiles.survivor.checklist.push('food');
  assert.deepEqual(state.profiles.survivor.known, ['A', 'B']);
  assert.deepEqual(state.profiles.survivor.completed, ['first']);
  assert.deepEqual(state.profiles.survivor.checklist, ['rain']);
});

test('import preserves valid DLC exploration when a base role switches edition', () => {
  const editionCampaign = { ...survivor, dlcEdges: [...survivor.edges, ['C', 'DLC_ONLY']] };
  for (const dlc of [false, true]) {
    const state = normalizeState(imported({ survivor: {
      known: ['B', 'DLC_ONLY', 'F'], current: 'DLC_ONLY', completed: ['first'], notes: '扩展旅途记录',
    } }, { prefs: { dlc } }), [editionCampaign, other], REGIONS);
    assert.deepEqual(state.profiles.survivor.known, ['A', 'B', 'DLC_ONLY']);
    assert.ok(state.profiles.survivor.known.includes(state.profiles.survivor.current));
    assert.deepEqual(state.profiles.survivor.completed, ['first']);
    assert.equal(state.profiles.survivor.notes, '扩展旅途记录');
  }
});

test('a visited destination alone does not mark the story objective complete', () => {
  const profile = { ...defaultProfile(survivor), current: 'B', known: ['A', 'B', 'C'] };
  assert.equal(activeStage(survivor, profile).id, 'first');
});

test('optional objectives never block a required story objective', () => {
  const profile = defaultProfile(survivor);
  assert.equal(activeStage(survivor, profile).id, 'first');
  profile.completed.push('first');
  assert.equal(activeStage(survivor, profile).id, 'second');
  profile.completed.push('second');
  assert.equal(activeStage(survivor, profile), null);
});

test('out-of-order completion keeps the earliest incomplete required objective active', () => {
  const profile = { ...defaultProfile(survivor), completed: ['second', 'optional-first'] };
  assert.equal(activeStage(survivor, profile).id, 'first');
  assert.equal(activeStage({ ...survivor, stages: [] }, profile), null);
});

test('unknown-node display labels expose no ID, real name, English name, or alias', () => {
  const profile = defaultProfile(survivor);
  const labels = campaignNodes(survivor).filter(id => id !== 'A').map(id => {
    const label = visibleName(survivor, profile, REGIONS, id);
    assert.match(label, /^未知区域 \d+$/);
    assert.notEqual(label, id);
    assert.ok(!label.includes(REGIONS[id].name));
    assert.ok(!label.includes(REGIONS[id].english));
    return label;
  });
  assert.equal(new Set(labels).size, labels.length);
});

test('known names and explicitly enabled names respect role-specific naming', () => {
  const profile = defaultProfile(other);
  assert.equal(visibleName(other, profile, REGIONS, 'E'), '另一旅者起点');
  assert.match(visibleName(other, profile, REGIONS, 'F'), /^未知区域 /);
  assert.equal(visibleName(other, profile, REGIONS, 'F', true), '本旅者的特别名称');
  profile.known.push('F');
  assert.equal(visibleName(other, profile, REGIONS, 'F'), '本旅者的特别名称');
  assert.equal(regionName(other, REGIONS, 'F'), '本旅者的特别名称');
});

test('anonymous labels stay stable when other regions become known', () => {
  const profile = defaultProfile(survivor);
  const before = visibleName(survivor, profile, REGIONS, 'C');
  profile.known.push('B', 'D');
  assert.equal(visibleName(survivor, profile, REGIONS, 'C'), before);
});

test('optional destinations outside the selected graph do not leak as isolated nodes', () => {
  const graph = { ...survivor, stages: [
    ...survivor.stages,
    { id: 'unavailable-optional', kind: 'optional', destination: 'DLC_ONLY' },
  ] };
  assert.equal(campaignNodes(graph).includes('DLC_ONLY'), false);
  assert.deepEqual(exactRegionMatches(graph, REGIONS, 'Expansion Area'), []);
  assert.equal(campaignNodes(graph).includes('D'), true, 'an optional destination already in the graph stays available');
});

test('explicit regions and main-story destinations remain available as standalone waypoints', () => {
  const graph = { ...survivor, nodes: [], regions: ['ISOLATED'], edges: [['A', 'B']], stages: [{ id: 'first', destination: 'C' }] };
  assert.deepEqual(new Set(campaignNodes(graph)), new Set(['A', 'B', 'C', 'ISOLATED']));
  assert.deepEqual(exactRegionMatches(graph, REGIONS, 'Isolated Waypoint'), ['ISOLATED']);
});

test('location lookup only reveals exact matches rather than unknown-name suggestions', () => {
  for (const query of ['', '   ', '未见', 'Hidden', '山谷', 'A<B']) assert.deepEqual(exactRegionMatches(survivor, REGIONS, query), []);
  for (const query of [' b ', '未见的山谷', ' HIDDEN VALLEY ', '山谷全名']) assert.deepEqual(exactRegionMatches(survivor, REGIONS, query), ['B']);
  assert.deepEqual(exactRegionMatches(survivor, REGIONS, 'Other Region'), []);
  assert.deepEqual(exactRegionMatches(other, REGIONS, '本旅者的特别名称'), ['F']);
});

test('pathfinding gives a shortest connected path and handles cycles', () => {
  const graph = { ...survivor, edges: [['A', 'B'], ['B', 'D'], ['D', 'C'], ['A', 'C'], ['C', 'B']] };
  assert.deepEqual(findPath(graph, 'A', 'C'), ['A', 'C']);
  assert.deepEqual(findPath(graph, 'C', 'A'), ['C', 'A']);
  assert.deepEqual(findPath(graph, 'A', 'A'), ['A']);
  assert.deepEqual(findPath(graph, 'A', 'ISOLATED'), []);
});

test('blocked connections are excluded regardless of endpoint order', () => {
  for (const blockedEdges of [[['B', 'C']], [['C', 'B']]]) {
    const graph = { ...survivor, blockedEdges };
    assert.deepEqual(findPath(graph, 'A', 'C'), ['A', 'D', 'C']);
    assert.deepEqual(findPath(graph, 'C', 'B'), ['C', 'D', 'A', 'B']);
  }
  assert.deepEqual(findPath({ ...survivor, blockedEdges: [['A', 'B'], ['A', 'D']] }, 'A', 'C'), []);
});

test('one-way connections cannot be followed backward', () => {
  const graph = { ...survivor, edges: [['A', 'B'], ['B', 'C']], directedEdges: [['B', 'C']] };
  assert.deepEqual(findPath(graph, 'A', 'C'), ['A', 'B', 'C']);
  assert.deepEqual(findPath(graph, 'C', 'A'), []);
  assert.deepEqual(findPath(graph, 'B', 'A'), ['B', 'A']);
});

test('extra directed connections add usable nodes and are not silently dropped', () => {
  const graph = { ...survivor, nodes: [], edges: [['A', 'B']], stages: [], directedEdges: [['B', 'C']] };
  assert.deepEqual(new Set(campaignNodes(graph)), new Set(['A', 'B', 'C']));
  assert.deepEqual(findPath(graph, 'A', 'C'), ['A', 'B', 'C']);
  assert.deepEqual(findPath(graph, 'C', 'A'), []);
  assert.deepEqual(adjacentRegions(graph, 'B'), ['A', 'C']);
  assert.deepEqual(adjacentRegions(graph, 'C'), []);
});

test('a directed declaration governs traversal even if its stored base edge is reversed', () => {
  const graph = { ...survivor, nodes: [], edges: [['B', 'A']], stages: [], directedEdges: [['A', 'B']] };
  assert.deepEqual(findPath(graph, 'A', 'B'), ['A', 'B']);
  assert.deepEqual(findPath(graph, 'B', 'A'), []);
  assert.deepEqual(adjacentRegions(graph, 'A'), ['B']);
  assert.deepEqual(adjacentRegions(graph, 'B'), []);
});

test('blocked-edge filtering also covers extra directed connections', () => {
  const graph = { ...survivor, nodes: [], edges: [['A', 'B']], stages: [], directedEdges: [['B', 'C']], blockedEdges: [['C', 'B']] };
  assert.deepEqual(availableEdges(graph), [['A', 'B']]);
  assert.deepEqual(adjacentRegions(graph, 'B'), ['A']);
  assert.deepEqual(findPath(graph, 'A', 'C'), []);
});

test('map connections and neighbor navigation both exclude blocked routes', () => {
  const graph = { ...survivor, blockedEdges: [['B', 'A'], ['D', 'C']] };
  assert.deepEqual(availableEdges(graph), [['B', 'C'], ['A', 'D']]);
  assert.deepEqual(adjacentRegions(graph, 'A'), ['D']);
  assert.deepEqual(adjacentRegions(graph, 'C'), ['B']);
  assert.deepEqual(findPath(graph, 'A', 'C'), []);
});

test('neighbor navigation agrees with one-way path traversal and removes duplicate exits', () => {
  const graph = { ...survivor, edges: [['A', 'B'], ['A', 'B'], ['B', 'C']], directedEdges: [['B', 'C']] };
  assert.deepEqual(adjacentRegions(graph, 'A'), ['B']);
  assert.deepEqual(adjacentRegions(graph, 'B'), ['A', 'C']);
  assert.deepEqual(adjacentRegions(graph, 'C'), []);
  assert.deepEqual(adjacentRegions(graph, 'missing'), []);
});

test('waypoint campaigns do not invent fixed routes from their listed locations', () => {
  const graph = { ...survivor, routeMode: 'waypoints' };
  assert.deepEqual(findPath(graph, 'A', 'C'), []);
  assert.deepEqual(findPath(graph, 'A', 'A'), []);
});

test('pathfinding refuses missing and non-campaign endpoints, including equal invalid IDs', () => {
  for (const [start, end] of [[null, 'C'], ['A', undefined], ['', 'C'], ['A', 'E'], ['E', 'C'], ['E', 'E'], ['missing', 'missing']]) {
    assert.deepEqual(findPath(survivor, start, end), [], `invalid endpoints: ${String(start)} -> ${String(end)}`);
  }
});
