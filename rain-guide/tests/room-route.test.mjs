import test from 'node:test';
import assert from 'node:assert/strict';
import { findRoomRoute, gateRooms } from '../src/room-route.js';

const room = (name, x, y = 0, size = 10) => ({
  type: 'Feature', properties: { name },
  geometry: { type: 'Polygon', coordinates: [[[x, y], [x, y + size],
    [x + size, y + size], [x + size, y], [x, y]]] },
});
const edge = (from, to) => ({ type: 'Feature', properties: {}, geometry: {
  type: 'LineString', coordinates: [from, [999, 999], [-999, -999], to],
} });
const rooms = [room('SU_A01', 0), room('SU_A02', 20), room('GATE_SU_HI', 40)];

test('route uses actual cubic endpoints and preserves source feature indexes', () => {
  const result = findRoomRoute(rooms, [edge([5, 5], [25, 5]),
    edge([200, 200], [300, 300]), edge([25, 5], [45, 5])], 'su_a01', 'GATE_SU_HI');
  assert.deepEqual(result, { featureIndexes: [0, 2],
    rooms: ['SU_A01', 'SU_A02', 'GATE_SU_HI'], ambiguousEdges: 1 });
});

test('BFS chooses fewer reference connections and supports reverse traversal', () => {
  const edges = [edge([5, 5], [25, 5]), edge([25, 5], [45, 5]), edge([5, 5], [45, 5])];
  assert.deepEqual(findRoomRoute(rooms, edges, 'GATE_SU_HI', 'SU_A01'), {
    featureIndexes: [2], rooms: ['GATE_SU_HI', 'SU_A01'], ambiguousEdges: 0,
  });
});

test('overlapping bounds never silently choose a room or invent a connection', () => {
  const result = findRoomRoute([...rooms, room('SU_OTHER', 0)],
    [edge([5, 5], [25, 5]), edge([25, 5], [45, 5])], 'SU_A01', 'GATE_SU_HI');
  assert.deepEqual(result, { featureIndexes: [], rooms: [], ambiguousEdges: 1 });
});

test('unknown and disconnected rooms return no fabricated route', () => {
  assert.deepEqual(findRoomRoute(rooms, [], 'SU_A01', 'GATE_SU_HI'), {
    featureIndexes: [], rooms: [], ambiguousEdges: 0,
  });
  assert.deepEqual(findRoomRoute(rooms, [], 'MISSING', 'MISSING'), {
    featureIndexes: [], rooms: [], ambiguousEdges: 0,
  });
});

test('already at the target is distinguished from an unreachable target', () => {
  assert.deepEqual(findRoomRoute({ type: 'FeatureCollection', features: rooms },
    { type: 'FeatureCollection', features: [] }, 'SU_A01', 'SU_A01'), {
    featureIndexes: [], rooms: ['SU_A01'], ambiguousEdges: 0,
  });
});

test('gate lookup matches exact region pairs, both orders and compact names', () => {
  const gates = ['GATE_LM_SB', 'GATE_SB_LM', 'GATE_LMSB', 'GATE_SBLM',
    'GATE_LM_SBU', 'GATE_LM_SB_EXTRA', 'GATE_LM_SU', 'OTHER_LM_SB',
    'GATE_WPTA_WBLA', 'GATE_LM_SB'].map(name => room(name, 0));
  assert.deepEqual(gateRooms(gates, 'lm', 'SB'),
    ['GATE_LM_SB', 'GATE_SB_LM', 'GATE_LMSB', 'GATE_SBLM']);
  assert.deepEqual(gateRooms(gates, 'WPTA', 'WBLA'), ['GATE_WPTA_WBLA']);
  assert.deepEqual(gateRooms(gates, 'LM', 'LM'), []);
  assert.deepEqual(gateRooms(gates, 'LM_', 'SB'), []);
});

test('malformed features are excluded without throwing or assigning a nearest room', () => {
  assert.deepEqual(findRoomRoute([null, ...rooms], [null, { geometry: {} }],
    'SU_A01', 'GATE_SU_HI'), { featureIndexes: [], rooms: [], ambiguousEdges: 2 });
});
