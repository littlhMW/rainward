// Run after `dotnet run --project tests/ModLogic.Tests.csproj -c Release`.
// Parse actual C#-generated URLs through the live web protocol module.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseLocation, locationFragment, playerPoint } from '../../src/location.js';

const dll = fileURLToPath(new URL('./bin/Release/net8.0/ModLogic.Tests.dll', import.meta.url));
const fixtures = JSON.parse(execFileSync('dotnet', [dll, '--protocol-fixtures'], { encoding: 'utf8' }));
const expected = { White: 'survivor', Yellow: 'monk', Red: 'hunter', Gourmand: 'gourmand', Artificer: 'artificer', Rivulet: 'rivulet', Spear: 'spearmaster', Saint: 'saint', Watcher: 'watcher', MeadowOnline: 'survivor', 'Custom&Slug': null };
for (const fixture of fixtures) {
  const url = new URL(fixture.url), result = parseLocation(url.hash);
  assert.equal(url.search, '', 'coordinates must stay out of server query parameters');
  assert.equal(result.campaign, expected[fixture.internalName]);
  assert.equal(result.region, 'SU');
  assert.equal(result.room, 'SU_C04');
  assert.equal(result.x, 12); assert.equal(result.y, 7);
  assert.equal(result.px, 250.5); assert.equal(result.py, 140.25);
  assert.equal(result.cx, -40); assert.equal(result.cy, 0);
  assert.equal(result.dlc, true);
  assert.equal(result.mode, fixture.internalName === 'MeadowOnline' ? 'meadow' : 'story');
  assert.equal(result.avatar, fixture.internalName === 'MeadowOnline' ? 'GreenLizard' : fixture.internalName);
  assert.deepEqual(parseLocation(locationFragment(result)), result);
  console.log(`PASS C# → web protocol: ${fixture.internalName}`);
}
const feature = { geometry: { coordinates: [[[1000, 2000], [1500, 2000], [1500, 2500], [1000, 2500], [1000, 2000]]] } };
assert.deepEqual(playerPoint(feature, parseLocation(new URL(fixtures[0].url).hash)), [2122.25, 1273.5]);
console.log('PASS C# pixel and camera offsets → web player marker');
console.log(`${fixtures.length + 1} C#/web integration checks passed.`);
