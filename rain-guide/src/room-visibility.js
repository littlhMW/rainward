const ROOM = /^[A-Z0-9_+.-]{1,96}$/;
export const roomKey = value => typeof value === 'string' && ROOM.test(value.toUpperCase()) ? value.toUpperCase() : null;

export function visibleRoomNames(features, { mask = true, exploredRooms = [], roomOverrides = {} } = {}) {
  const explored = new Set((Array.isArray(exploredRooms) ? exploredRooms : []).map(roomKey).filter(Boolean));
  const overrides = new Map();
  if (roomOverrides && typeof roomOverrides === 'object' && !Array.isArray(roomOverrides)) {
    for (const [key, value] of Object.entries(roomOverrides)) {
      if (roomKey(key) && typeof value === 'boolean') overrides.set(roomKey(key), value);
    }
  }
  return new Set((Array.isArray(features) ? features : []).flatMap(feature => {
    const key = roomKey(feature?.properties?.name);
    return key && (!mask || (overrides.has(key) ? overrides.get(key) : explored.has(key))) ? [key] : [];
  }));
}

// Return one polygon at a time: each has an outer ring and optional holes.
// Separate SVG paths union overlapping rooms; evenodd only applies within a room.
export function roomPolygons(feature) {
  const geometry = feature?.geometry;
  const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
  if (!Array.isArray(polygons)) return [];
  return polygons.filter(polygon => Array.isArray(polygon) && polygon.length && polygon.every(ring =>
    Array.isArray(ring) && ring.length >= 3 && ring.every(point => Array.isArray(point) && point.length >= 2 &&
      Number.isFinite(point[0]) && Number.isFinite(point[1]))));
}

export function roomClipPaths(features, visible, project) {
  return (Array.isArray(features) ? features : []).flatMap(feature => {
    if (!visible.has(roomKey(feature?.properties?.name))) return [];
    return roomPolygons(feature).flatMap(polygon => {
      const rings = polygon.map(ring => ring.map(point => project(point)));
      if (rings.some(ring => ring.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)))) return [];
      return [rings.map(ring => ring.map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join(' ') + ' Z').join(' ')];
    });
  });
}

export function canPlacePrecisely(player) {
  if (player?.accuracy && !['pixel', 'exact', 'precise'].includes(player.accuracy)) return false;
  return ['px', 'py', 'cx', 'cy'].every(key => Number.isFinite(player?.[key]));
}
