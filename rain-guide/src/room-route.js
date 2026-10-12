// These are reference connections, not a guarantee that gates, direction or
// character abilities allow the suggested journey in the running game.
const features = value => Array.isArray(value) ? value : value?.features ?? [];
const code = value => typeof value === 'string' ? value.trim().toUpperCase() : '';
const point = value => Array.isArray(value) && value.length >= 2 &&
  Number.isFinite(value[0]) && Number.isFinite(value[1]);

function roomBounds(feature) {
  const name = code(feature?.properties?.name);
  const ring = feature?.geometry?.type === 'Polygon' ? feature.geometry.coordinates?.[0] : null;
  if (!name || !Array.isArray(ring) || ring.length < 4 || !ring.every(point)) return null;
  return {
    name,
    minX: Math.min(...ring.map(p => p[0])), maxX: Math.max(...ring.map(p => p[0])),
    minY: Math.min(...ring.map(p => p[1])), maxY: Math.max(...ring.map(p => p[1])),
  };
}

/**
 * Match the two actual Bezier endpoints to exactly one upstream room rectangle.
 * Skip unresolved edges; never guess by nearest room or Bezier control points.
 * BFS minimizes connections only within this partial, undirected reference graph.
 * UI wording: 连接参考，门槛/方向/能力仍以游戏为准。
 */
export function findRoomRoute(roomFeatures, connectionFeatures, startRoom, targetRoom) {
  const bounds = features(roomFeatures).map(roomBounds).filter(Boolean);
  const start = code(startRoom), target = code(targetRoom);
  const graph = new Map(bounds.map(room => [room.name, []]));
  let ambiguousEdges = 0;
  const owner = p => {
    if (!point(p)) return null;
    const names = new Set(bounds.filter(room => p[0] >= room.minX && p[0] <= room.maxX &&
      p[1] >= room.minY && p[1] <= room.maxY).map(room => room.name));
    return names.size === 1 ? names.values().next().value : null;
  };
  features(connectionFeatures).forEach((feature, index) => {
    const coords = feature?.geometry?.type === 'LineString' ? feature.geometry.coordinates : null;
    const from = Array.isArray(coords) && coords.length >= 2 ? owner(coords[0]) : null;
    const to = Array.isArray(coords) && coords.length >= 2 ? owner(coords.at(-1)) : null;
    if (!from || !to) { ambiguousEdges++; return; }
    if (from === to) return;
    graph.get(from).push({ room: to, index });
    graph.get(to).push({ room: from, index });
  });
  const empty = { featureIndexes: [], rooms: [], ambiguousEdges };
  if (!graph.has(start) || !graph.has(target)) return empty;
  const queue = [start], previous = new Map([[start, null]]);
  for (let i = 0; i < queue.length && !previous.has(target); i++) {
    for (const edge of graph.get(queue[i])) {
      if (previous.has(edge.room)) continue;
      previous.set(edge.room, { room: queue[i], index: edge.index });
      queue.push(edge.room);
    }
  }
  if (!previous.has(target)) return empty;
  const rooms = [target], featureIndexes = [];
  for (let current = target; current !== start;) {
    const step = previous.get(current);
    featureIndexes.push(step.index);
    rooms.push(step.room);
    current = step.room;
  }
  return { featureIndexes: featureIndexes.reverse(), rooms: rooms.reverse(), ambiguousEdges };
}

/** Return only existing, exactly matched gate names, in source order. */
export function gateRooms(roomFeatures, currentRegion, nextRegion) {
  const current = code(currentRegion), next = code(nextRegion);
  if (!/^[A-Z0-9]+$/.test(current) || !/^[A-Z0-9]+$/.test(next) || current === next) return [];
  const names = new Set();
  for (const feature of features(roomFeatures)) {
    const name = code(feature?.properties?.name);
    const parts = /^GATE_([A-Z0-9]+)_([A-Z0-9]+)$/.exec(name);
    if (parts && ((parts[1] === current && parts[2] === next) ||
      (parts[1] === next && parts[2] === current))) names.add(name);
    // Some game data uses a compact pair, e.g. GATE_LMSB. Match the entire
    // known pair; never use prefix/substring matching or assume 2-letter codes.
    if (name === `GATE_${current}${next}` || name === `GATE_${next}${current}`) names.add(name);
  }
  return [...names];
}
