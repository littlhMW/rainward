import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP_CHARACTERS, parseLocation, locationFragment, playerPoint } from '../src/location.js';

const fragment = (fields = {}) => '#' + new URLSearchParams({
  v: '1', character: 'White', region: 'SU', room: 'SU_A01', ...fields,
});
const screenshot = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [
  [[100, 200], [1500, 200], [1500, 1000], [100, 1000], [100, 200]],
] } };
const position = { px: 300, py: 700, cx: 100, cy: 500 };

test('ordinary page fragments are ignored; only location protocol v1 is supported', () => {
  for (const hash of ['', '#', '#map', '#room=SU_A01']) assert.equal(parseLocation(hash), null);
  assert.equal(parseLocation(fragment()).campaign, 'survivor');
  assert.equal(parseLocation(fragment().slice(1)).campaign, 'survivor');
  for (const v of ['', '0', '2', '1.0', '01']) {
    assert.throws(() => parseLocation(fragment({ v })), /版本/, v);
  }
});

test('game names and web aliases select the correct one of nine campaigns', () => {
  const names = {
    White: 'survivor', Survivor: 'survivor', Yellow: 'monk', Monk: 'monk',
    Red: 'hunter', Hunter: 'hunter', Gourmand: 'gourmand', Artificer: 'artificer',
    Rivulet: 'rivulet', Spear: 'spearmaster', Spearmaster: 'spearmaster',
    Saint: 'saint', Watcher: 'watcher',
  };
  assert.equal(Object.keys(MAP_CHARACTERS).length, 9);
  for (const [name, expected] of Object.entries(names)) {
    for (const character of [name, name.toUpperCase(), name.toLowerCase()]) {
      const result = parseLocation(fragment({ character }));
      assert.equal(result.campaign, expected, character);
      assert.equal(result.character, character, 'original name remains available to show');
    }
  }
  for (const [campaign, character] of Object.entries(MAP_CHARACTERS)) {
    assert.equal(parseLocation(fragment({ character })).campaign, campaign);
  }
});

test('unknown or custom characters never silently become a supported campaign', () => {
  for (const character of ['', 'MyCustomSlugcat', 'Lizard', 'Inv', '__proto__', 'constructor']) {
    const result = parseLocation(fragment({ character }));
    assert.equal(result.campaign, null, character || '(empty character)');
    assert.equal(result.character, character);
    assert.equal(result.room, 'SU_A01');
  }
  assert.equal(parseLocation(fragment({ character: 'c'.repeat(64) })).campaign, null);
  assert.throws(() => parseLocation(fragment({ character: 'c'.repeat(65) })), /格式/);
});

test('region and room names normalize case while preserving valid mod room punctuation', () => {
  const result = parseLocation(fragment({ region: 'wArF', room: 'warf_a01+2-test.png' }));
  assert.equal(result.region, 'WARF');
  assert.equal(result.room, 'WARF_A01+2-TEST.PNG');
  assert.equal(parseLocation(fragment({ region: 'a'.repeat(16), room: 'b'.repeat(96) })).room.length, 96);
  assert.equal(parseLocation(fragment({ region: '1', room: 'a' })).region, '1');
});

test('missing, oversized, or unsafe region and room identifiers are rejected', () => {
  for (const region of ['', 'A'.repeat(17), 'SU_A', 'SU-A', 'SU.A', 'SU A', '../SU', '郊区', '<SU>']) {
    assert.throws(() => parseLocation(fragment({ region })), /格式/, `region ${region}`);
  }
  for (const room of ['', 'A'.repeat(97), 'SU A01', 'SU/A01', 'SU\\A01', 'SU:A01', '<script>', 'SU\nA01']) {
    assert.throws(() => parseLocation(fragment({ room })), /格式/, `room ${JSON.stringify(room)}`);
  }
  for (const key of ['region', 'room']) {
    const params = new URLSearchParams(fragment().slice(1));
    params.delete(key);
    assert.throws(() => parseLocation('#' + params), /格式/, `missing ${key}`);
  }
});

test('tile coordinates must be finite integers in the inclusive signed 32768 range', () => {
  for (const key of ['x', 'y']) {
    for (const value of [-32768, -1, 0, 1, 32768]) {
      assert.equal(parseLocation(fragment({ [key]: value }))[key], value, `${key}=${value}`);
    }
    for (const value of [-32769, 32769, 0.5, -2.5, 'NaN', 'Infinity', '-Infinity', 'not-a-number']) {
      assert.throws(() => parseLocation(fragment({ [key]: value })), /坐标/, `${key}=${value}`);
    }
    assert.ok(!Object.hasOwn(parseLocation(fragment()), key), `absent ${key}`);
    assert.ok(!Object.hasOwn(parseLocation(fragment({ [key]: '' })), key), `empty ${key}`);
  }
});

test('pixel and camera coordinates accept fractions but reject nonfinite and out-of-range values', () => {
  for (const key of ['px', 'py', 'cx', 'cy']) {
    for (const value of [-1000000, -42.5, 0, 17.25, 1000000]) {
      assert.equal(parseLocation(fragment({ [key]: value }))[key], value, `${key}=${value}`);
    }
    for (const value of [-1000000.1, 1000000.1, 'Infinity', '-Infinity', 'NaN', 'invalid']) {
      assert.throws(() => parseLocation(fragment({ [key]: value })), /坐标/, `${key}=${value}`);
    }
    assert.ok(!Object.hasOwn(parseLocation(fragment()), key), `absent ${key}`);
    assert.ok(!Object.hasOwn(parseLocation(fragment({ [key]: '' })), key), `empty ${key}`);
  }
});

test('Meadow mode and Downpour selection require their explicit protocol flags', () => {
  assert.equal(parseLocation(fragment()).mode, 'story');
  assert.equal(parseLocation(fragment()).dlc, false);
  const meadow = parseLocation(fragment({ mode: 'meadow', dlc: 'downpour', avatar: 'Lizard' }));
  assert.equal(meadow.mode, 'meadow');
  assert.equal(meadow.dlc, true);
  assert.equal(meadow.avatar, 'Lizard');
  assert.equal(meadow.campaign, 'survivor', 'Meadow avatar does not replace the map campaign');
  for (const mode of ['story', 'arena', 'MEADOW']) assert.equal(parseLocation(fragment({ mode })).mode, 'story');
  for (const dlc of ['', 'false', 'true', 'watcher', 'DOWNPOUR']) assert.equal(parseLocation(fragment({ dlc })).dlc, false);
  assert.equal(parseLocation(fragment({ avatar: 'a'.repeat(100) })).avatar.length, 64);
});

test('location fragments round-trip encoded room names and all position fields', () => {
  const input = { character: 'Spear', region: 'lm', room: 'lm_a01+2', x: -12, y: 8,
    px: 105.5, py: 500.25, cx: -20, cy: 380, mode: 'meadow', avatar: 'Slug cat', dlc: true };
  const hash = locationFragment(input);
  assert.ok(hash.startsWith('#v=1&'));
  assert.match(hash, /room=lm_a01%2B2/);
  assert.deepEqual(parseLocation(hash), { ...input, campaign: 'spearmaster', region: 'LM', room: 'LM_A01+2' });
  const defaultHash = locationFragment({ character: 'White', region: 'SU', room: 'SU_A01', dlc: false });
  assert.ok(!defaultHash.includes('dlc='));
  assert.throws(() => locationFragment({ ...input, x: 0.5 }), /坐标/);
  assert.throws(() => locationFragment({ ...input, room: '../invalid' }), /格式/);
});

test('player point applies screenshot origin, upstream camera padding and camera offset in Leaflet order', () => {
  assert.deepEqual(playerPoint(screenshot, position), [382, 283]);
  assert.deepEqual(playerPoint(screenshot, { px: 17, py: 18, cx: 0, cy: 0 }), [200, 100]);
  assert.deepEqual(playerPoint(screenshot, { px: 1417, py: 818, cx: 0, cy: 0 }), [1000, 1500]);
  assert.deepEqual(playerPoint(screenshot, { px: 17.5, py: 18.25, cx: -10, cy: -20 }), [220.25, 110.5]);
});

test('player point is unavailable without every finite pixel and camera coordinate', () => {
  for (const key of ['px', 'py', 'cx', 'cy']) {
    const incomplete = { ...position };
    delete incomplete[key];
    assert.equal(playerPoint(screenshot, incomplete), null, `missing ${key}`);
    for (const value of [undefined, null, NaN, Infinity, -Infinity, '100']) {
      assert.equal(playerPoint(screenshot, { ...position, [key]: value }), null, `${key}=${value}`);
    }
  }
  assert.equal(playerPoint(screenshot, undefined), null);
  assert.equal(playerPoint(screenshot, { x: 10, y: 20 }), null, 'tile coordinates cannot substitute for pixels');
  for (const feature of [null, {}, { geometry: {} }, { geometry: { coordinates: [] } }, { geometry: { coordinates: [[]] } }]) {
    assert.equal(playerPoint(feature, position), null);
  }
});

test('offscreen player coordinates return null instead of pinning outside the screenshot', () => {
  for (const coordinates of [
    { px: 16.9, py: 18 }, { px: 1417.1, py: 18 },
    { px: 17, py: 17.9 }, { px: 17, py: 818.1 },
  ]) {
    assert.equal(playerPoint(screenshot, { cx: 0, cy: 0, ...coordinates }), null);
  }
  assert.equal(playerPoint(screenshot, { ...position, cx: 5000 }), null, 'camera offset is part of the bounds check');
});
