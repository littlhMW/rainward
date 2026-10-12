import test from 'node:test';
import assert from 'node:assert/strict';
import { roomKey, visibleRoomNames, roomPolygons, roomClipPaths, canPlacePrecisely } from '../src/room-visibility.js';

const feature = (name, ring = [[0,0],[10,0],[10,10],[0,10],[0,0]]) => ({
  properties:{name}, geometry:{type:'Polygon',coordinates:[ring]},
});
const rooms = [feature('SU_A01'),feature('SU_A02'),feature('SU_A03')];
const identity = ([x,y]) => ({x,y});

test('mask starts hidden and reveals only recorded rooms with case-insensitive matching', () => {
  assert.deepEqual([...visibleRoomNames(rooms)], []);
  assert.deepEqual([...visibleRoomNames(rooms,{exploredRooms:['su_a02','UNKNOWN',null]})], ['SU_A02']);
  assert.equal(roomKey('<script>'), null);
  assert.equal(roomKey(undefined), null);
  assert.equal(roomKey('su_a01+1'), 'SU_A01+1');
});

test('per-room boolean overrides take priority; missing or null override follows exploration', () => {
  const settings = {exploredRooms:['SU_A01','SU_A02'],roomOverrides:{su_a01:false,SU_A02:null,SU_A03:true,UNKNOWN:true}};
  assert.deepEqual([...visibleRoomNames(rooms,settings)], ['SU_A02','SU_A03']);
  delete settings.roomOverrides.su_a01;
  assert.deepEqual([...visibleRoomNames(rooms,settings)], ['SU_A01','SU_A02','SU_A03']);
  assert.deepEqual([...visibleRoomNames(rooms,{exploredRooms:null,roomOverrides:{SU_A01:'true'}})], []);
});

test('full reveal ignores room overrides without mutating them', () => {
  const settings = {mask:false,exploredRooms:[],roomOverrides:{SU_A01:false}};
  assert.deepEqual([...visibleRoomNames(rooms,settings)], ['SU_A01','SU_A02','SU_A03']);
  assert.deepEqual(settings.roomOverrides,{SU_A01:false});
  assert.deepEqual([...visibleRoomNames(rooms,{...settings,mask:true})], []);
});

test('clipping follows actual polygon vertices and projection, never its bounding rectangle', () => {
  const triangle = feature('SU_A01',[[10,20],[50,20],[10,60],[10,20]]);
  const path = roomClipPaths([triangle,feature('HIDDEN')],new Set(['SU_A01']),([x,y])=>({x:x/2-3,y:-y/2+7}));
  assert.deepEqual(path,['M2,-3 L22,-3 L2,-23 L2,-3 Z']);
  assert.ok(!path[0].includes('L22,-23'), 'does not include unexplored space inside the rectangle');
  assert.deepEqual(roomClipPaths([triangle],new Set(),identity),[]);
});

test('overlapping visible polygons use separate SVG paths; one hidden room is never emitted', () => {
  const first = feature('SU_A01'),second = feature('SU_A02',[[5,0],[15,0],[15,10],[5,10],[5,0]]);
  const paths = roomClipPaths([first,second],new Set(['SU_A01','SU_A02']),identity);
  assert.equal(paths.length,2,'union separate paths instead of XOR with one evenodd compound path');
  assert.deepEqual(roomClipPaths([first,second],new Set(['SU_A01']),identity),paths.slice(0,1));
});

test('polygon holes stay within one evenodd path; multipolygons produce independent parts', () => {
  const hole = [[2,2],[4,2],[4,4],[2,4],[2,2]];
  const withHole = feature('SU_A01'); withHole.geometry.coordinates.push(hole);
  const compound = {properties:{name:'SU_A02'},geometry:{type:'MultiPolygon',coordinates:[feature('x').geometry.coordinates,feature('y',[[20,20],[25,20],[20,25],[20,20]]).geometry.coordinates]}};
  const paths = roomClipPaths([withHole,compound],new Set(['SU_A01','SU_A02']),identity);
  assert.equal(paths.length,3);
  assert.equal((paths[0].match(/M/g)||[]).length,2);
  assert.equal((paths[1].match(/M/g)||[]).length,1);
  assert.equal(roomPolygons(compound).length,2);
});

test('malformed geometry and nonfinite projected coordinates fail closed', () => {
  for (const value of [null,{},feature('SU_A01',[]),feature('SU_A01',[[0,0],[1,1],[NaN,2]]),{geometry:{type:'Polygon',coordinates:[null]}},{geometry:{type:'Point',coordinates:[0,0]}}]) {
    assert.deepEqual(roomPolygons(value),[]);
    assert.deepEqual(roomClipPaths([value],new Set(['SU_A01']),identity),[]);
  }
  assert.deepEqual(roomClipPaths(rooms,new Set(['SU_A01']),()=>({x:Infinity,y:0})),[]);
});

test('room-only remote players never acquire an invented precise position', () => {
  const pixel = {px:20,py:30,cx:0,cy:0};
  assert.equal(canPlacePrecisely(pixel),true,'legacy pixel snapshot');
  for (const accuracy of ['precise','pixel','exact']) assert.equal(canPlacePrecisely({...pixel,accuracy}),true);
  for (const accuracy of ['room','abstract','unknown','unrealized']) assert.equal(canPlacePrecisely({...pixel,accuracy}),false);
  for (const key of Object.keys(pixel)) {
    const missing = {...pixel}; delete missing[key];
    assert.equal(canPlacePrecisely(missing),false);
    assert.equal(canPlacePrecisely({...pixel,[key]:Infinity}),false);
    assert.equal(canPlacePrecisely({...pixel,[key]:'12'}),false);
  }
});
