import { parseLocation, playerPoint } from './location.js';
import { findRoomRoute, gateRooms } from './room-route.js';

// The CC0 upstream still owns map rendering. This small adapter only controls
// visibility, player focus, and highlights connections that already exist.
const notify = (event, data = {}) => parent.postMessage({ type:'where-to-parent', event, ...data }, location.origin);
let settings = { ...window.rwGuide, route: true, nextRegion: null, room: null, player: null };
try { settings.player = parseLocation(location.hash); settings.room = settings.player?.room || null; } catch { /* Parent validates external location links. */ }
let nodes, direction, playerMarker, loaded = false, insideFocus = false;
const features = () => window.rwRoomJSON?.room_features || [];
const getRoom = name => window.roomsLayer?.getLayers().find(layer => layer.feature.properties.name.toUpperCase() === String(name).toUpperCase());
const roomCenter = feature => {
  const ring = feature.geometry.coordinates[0];
  return [(Math.min(...ring.map(p=>p[1]))+Math.max(...ring.map(p=>p[1])))/2, (Math.min(...ring.map(p=>p[0]))+Math.max(...ring.map(p=>p[0])))/2];
};
function layer(value, visible) {
  if (!value) return;
  if (visible && !window.map.hasLayer(value)) value.addTo(window.map);
  else if (!visible && window.map.hasLayer(value)) window.map.removeLayer(value);
}
function applyLayers() {
  Object.assign(window.rwGuide, settings);
  if (!loaded) return;
  const map = window.map;
  layer(window.tileLayer, !settings.mask);
  layer(window.geometryLayer, !settings.mask);
  layer(window.roomNames, settings.rooms);
  layer(window.densLayer, settings.spawns && !settings.mask);
  layer(window.connectionsLayer, true);
  layer(nodes, settings.mask);
  window.roomsLayer.eachLayer(room => room.setStyle({ weight: !settings.mask && room === window.focusedRoom ? 3 : 0, fillOpacity: 0 }));
  map.getContainer().style.backgroundColor = settings.mask ? '#050505' : `rgb(${window.rwRegionJSON.bgcolor.join(',')})`;
}
function drawPlayer() {
  if (playerMarker) window.map.removeLayer(playerMarker);
  playerMarker = null;
  const found = getRoom(settings.player?.room);
  if (!found) return;
  const precise = playerPoint(found.feature, settings.player);
  const point = precise || roomCenter(found.feature);
  playerMarker = window.L.circleMarker(point, { radius: 7, color: '#fff', weight: 2, fillColor: '#dbbc6b', fillOpacity: 1, className: 'guide-position' });
  playerMarker.bindTooltip(precise ? '玩家位置（按原图换算）' : '玩家所在房间', {direction:'top',permanent:true,className:'room-labels'}).addTo(window.map);
}
function drawRoute() {
  if (direction) window.map.removeLayer(direction);
  direction = window.L.layerGroup().addTo(window.map);
  if (!settings.route || !settings.nextRegion) return;
  const gates = gateRooms(features(), window.loadedRegion, settings.nextRegion);
  let best = null;
  for (const name of gates) {
    const target = getRoom(name); if (!target) continue;
    window.L.circleMarker(roomCenter(target.feature), {radius:10,color:'#e4ce90',weight:2,fillOpacity:0}).bindTooltip(`通向 ${settings.nextRegion} 的门`, {className:'room-labels'}).addTo(direction);
    const path = findRoomRoute(features(), window.rwRoomJSON.connection_features, settings.room, name);
    if (path.rooms.length && (!best || path.featureIndexes.length < best.featureIndexes.length)) best = path;
  }
  if (best?.featureIndexes.length) {
    new window.L.BezierGeoJSON(best.featureIndexes.map(i => window.rwRoomJSON.connection_features[i]), {color:'#e4ce90',weight:4,opacity:.95,dashArray:'7 7',interactive:false}).addTo(direction);
    notify('route', {message:`已标出 ${best.featureIndexes.length} 段原图连接，通向 ${settings.nextRegion} 的门。仅为连接参考，门槛、方向和能力仍以游戏为准。`});
  } else notify('route', {message:gates.length ? '已圈出通向下一地区的门；选中起点房间后显示连接参考。无法可靠连通时不会编造路线。' : '原图中未找到可核对的出口，暂不绘制房间路线。按区域方向自行探索，可能存在版本或 Mod 差异。'});
}
function focus(name, quiet = false) {
  const target = getRoom(name);
  if (!target) { if (!quiet) notify('error',{message:`原图没有房间 ${String(name).slice(0,96)}，已保留区域视图。`}); return false; }
  insideFocus = true;
  window.focusRoom(target);
  insideFocus = false;
  settings.room = target.feature.properties.name;
  applyLayers(); drawRoute();
  if (!quiet) notify('room', {room:settings.room});
  return true;
}
const originalFocus = window.focusRoom;
window.focusRoom = function(event) {
  originalFocus(event);
  if (loaded) {
    settings.room = window.room;
    applyLayers();
    if (!insideFocus) { drawRoute(); notify('room',{room:window.room}); }
  }
};
function ready() {
  loaded = true;
  if (nodes) window.map.removeLayer(nodes);
  nodes = window.L.layerGroup();
  for (const feature of features()) {
    const node = window.L.circleMarker(roomCenter(feature), {radius:3,color:'#aaa',weight:1,fillColor:'#aaa',fillOpacity:1,className:'guide-room-node'});
    node.bindTooltip(feature.properties.name,{className:'room-labels'});
    node.on('click', () => focus(feature.properties.name));
    node.addTo(nodes);
  }
  applyLayers();
  const target = settings.room;
  if (!target || !getRoom(target)) window.map.fitBounds(window.roomsLayer.getBounds(),{padding:[30,30],maxZoom:-2});
  else focus(target, true);
  drawPlayer(); drawRoute();
  notify('ready',{rooms:features().length});
  if (target && !getRoom(target)) notify('error',{message:`原图没有房间 ${target}，已显示该区域。新增或改动地形可能不匹配。`});
}
window.addEventListener('rw-map-ready', ready);
window.addEventListener('rw-map-error', event => notify('error',{message:event.detail}));
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'where-to-map') return;
  const value = event.data;
  settings = { mask:!!value.mask, rooms:!!value.rooms, spawns:!!value.spawns, nextRegion:typeof value.nextRegion==='string' ? value.nextRegion : null, route:!!value.route, room:typeof value.room==='string' ? value.room : null, player:value.player || null };
  applyLayers();
  if (!loaded) return;
  if (value.action === 'overview') window.map.fitBounds(window.roomsLayer.getBounds(),{padding:[30,30],maxZoom:-2});
  if (value.action === 'focus' && settings.room) focus(settings.room);
  if (value.action === 'resize') requestAnimationFrame(()=>window.map.invalidateSize());
  drawPlayer(); drawRoute();
});
window.L.control.zoom({position:'topleft'}).addTo(window.map);
new ResizeObserver(()=>window.map.invalidateSize()).observe(document.getElementById('mapid'));
if (window.rwRoomJSON) ready();
