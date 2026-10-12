export const MAP_CHARACTERS = Object.freeze({ survivor: 'white', monk: 'yellow', hunter: 'red', gourmand: 'gourmand', artificer: 'artificer', rivulet: 'rivulet', spearmaster: 'spear', saint: 'saint', watcher: 'watcher' });
const aliases = { white: 'survivor', survivor: 'survivor', yellow: 'monk', monk: 'monk', red: 'hunter', hunter: 'hunter', gourmand: 'gourmand', artificer: 'artificer', rivulet: 'rivulet', spear: 'spearmaster', spearmaster: 'spearmaster', saint: 'saint', watcher: 'watcher' };
export function parseLocation(fragment) {
  const params = new URLSearchParams(fragment.replace(/^#/, ''));
  if (!params.has('v')) return null;
  if (params.get('v') !== '1') throw new Error('不支持这个位置链接的版本。');
  const character = params.get('character') || '';
  const region = (params.get('region') || '').toUpperCase();
  const room = (params.get('room') || '').toUpperCase();
  if (!/^[A-Z0-9]{1,16}$/.test(region) || !/^[A-Z0-9_+.-]{1,96}$/.test(room) || character.length > 64) throw new Error('位置链接里的角色、区域或房间格式不正确。');
  const key = character.toLowerCase();
  const result = { campaign: Object.hasOwn(aliases, key) ? aliases[key] : null, character, region, room, mode: params.get('mode') === 'meadow' ? 'meadow' : 'story', avatar: (params.get('avatar') || '').slice(0, 64), dlc: params.get('dlc') === 'downpour' };
  for (const key of ['x', 'y', 'px', 'py', 'cx', 'cy']) {
    const raw = params.get(key); if (raw === null || raw === '') continue;
    const value = Number(raw), limit = key === 'x' || key === 'y' ? 32768 : 1000000;
    if (!Number.isFinite(value) || Math.abs(value) > limit || (['x', 'y'].includes(key) && !Number.isInteger(value))) throw new Error('位置链接里的坐标超出可用范围。');
    result[key] = value;
  }
  return result;
}
export function locationFragment(value) {
  const p = new URLSearchParams({ v: '1', character: value.character, region: value.region, room: value.room });
  for (const key of ['x', 'y', 'px', 'py', 'cx', 'cy', 'mode', 'avatar']) if (value[key] !== undefined) p.set(key, String(value[key]));
  if (value.dlc) p.set('dlc', 'downpour');
  parseLocation('#' + p.toString()); return '#' + p.toString();
}
// Upstream: camera bottom-left = room origin + [17,18] + camera position.
export function playerPoint(feature, location) {
  if (![location?.px, location?.py, location?.cx, location?.cy].every(Number.isFinite)) return null;
  const coordinates = feature?.geometry?.coordinates?.[0]; if (!coordinates?.length) return null;
  const xs = coordinates.map(p => p[0]), ys = coordinates.map(p => p[1]);
  const x = Math.min(...xs) + location.px - 17 - location.cx, y = Math.min(...ys) + location.py - 18 - location.cy;
  if (x < Math.min(...xs) || x > Math.max(...xs) || y < Math.min(...ys) || y > Math.max(...ys)) return null;
  return [y, x];
}
