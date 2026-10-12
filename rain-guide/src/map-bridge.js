import { parseLocation, playerPoint } from './location.js';
import { findRoomRoute, gateRooms } from './room-route.js';
import { roomKey, visibleRoomNames, roomPolygons, roomClipPaths, canPlacePrecisely } from './room-visibility.js?v=2.1.0';

// The CC0 upstream owns terrain and connection rendering; this adapter controls
// disclosure, room overrides, names, player snapshots and existing route lines.
const notify = (event, data = {}) => parent.postMessage({ type:'where-to-parent', event, ...data }, location.origin);
let settings = { ...window.rwGuide, route:true, nextRegion:null, room:null, player:null, players:[], exploredRooms:[], roomOverrides:{}, names:false, regionLabel:'', regionLabels:{} };
try { settings.player = parseLocation(location.hash); settings.room = settings.player?.room || null; } catch { /* Parent validates external location links. */ }
let nodes, direction, playerMarkers, geographicNames, clipPath, loaded = false, insideFocus = false, zooming = false;
let visible = new Set();
const detailPanes = ['guideTerrain', 'guideGeometry', 'guideSpawns'];
const features = () => window.rwRoomJSON?.room_features || [];
const getRoom = name => window.roomsLayer?.getLayers().find(layer => roomKey(layer.feature?.properties?.name) === roomKey(name) && roomKey(name));
const text = value => { const span = document.createElement('span'); span.textContent = String(value ?? ''); return span; };
const roomCenter = feature => {
  const points = roomPolygons(feature).flat(2);
  return [(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2, (Math.min(...points.map(p=>p[0]))+Math.max(...points.map(p=>p[0])))/2];
};
const regionLabel = id => typeof settings.regionLabels?.[id] === 'string' ? settings.regionLabels[id].slice(0,160) : id;
function layer(value, show) {
  if (!value) return;
  if (show && !window.map.hasLayer(value)) value.addTo(window.map);
  else if (!show && window.map.hasLayer(value)) window.map.removeLayer(value);
}
function ensureClip() {
  if (clipPath) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;pointer-events:none';
  const defs = document.createElementNS(ns, 'defs');
  clipPath = document.createElementNS(ns, 'clipPath');
  clipPath.id = 'guide-visible-rooms'; clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
  defs.append(clipPath); svg.append(defs); window.map.getContainer().append(svg);
}
function updateClip() {
  if (!loaded) return;
  ensureClip();
  // Clip the panes themselves, outside each layer's tile/SVG/marker transforms.
  // One path per room unions overlapping polygons without evenodd cancellation.
  const paths = settings.mask ? roomClipPaths(features(), visible, point => window.map.latLngToLayerPoint([point[1], point[0]])) : [];
  clipPath.replaceChildren(...paths.map(d => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); path.setAttribute('clip-rule', 'evenodd');
    return path;
  }));
  for (const name of detailPanes) {
    const pane = window.map.getPane(name);
    pane.style.clipPath = settings.mask ? 'url(#guide-visible-rooms)' : 'none';
    pane.style.visibility = settings.mask && (zooming || paths.length === 0) ? 'hidden' : '';
  }
}
function applyLayers() {
  Object.assign(window.rwGuide, settings);
  if (!loaded) {
    if (settings.mask) for (const name of detailPanes) window.map.getPane(name).style.visibility = 'hidden';
    return;
  }
  visible = visibleRoomNames(features(), settings);
  window.rwRoomVisible = name => visible.has(roomKey(name));
  updateClip();
  const hasDetail = !settings.mask || visible.size > 0;
  layer(window.tileLayer, hasDetail);
  layer(window.geometryLayer, hasDetail);
  layer(window.roomNames, settings.rooms);
  layer(window.densLayer, settings.spawns && hasDetail);
  layer(window.connectionsLayer, true);
  layer(nodes, settings.mask);
  if (nodes) nodes.eachLayer(node => {
    const hidden = !visible.has(node.guideRoom);
    node.setStyle({ opacity:hidden ? 1 : 0, fillOpacity:hidden ? 1 : 0 });
  });
  window.roomsLayer.eachLayer(room => room.setStyle({ weight:visible.has(roomKey(room.feature.properties.name)) && room === window.focusedRoom ? 3 : 0, fillOpacity:0 }));
  window.map.getContainer().style.backgroundColor = settings.mask ? '#050505' : `rgb(${window.rwRegionJSON.bgcolor.join(',')})`;
}
function roomMenu(name, at) {
  const key = roomKey(name); if (!key) return;
  const box = document.createElement('div'); box.className = 'guide-room-menu';
  const title = document.createElement('strong'); title.textContent = key; box.append(title);
  const status = document.createElement('p');
  status.textContent = settings.mask ? (visible.has(key) ? '这个房间的地形已显示' : '这个房间的地形已遮罩') : '全图已揭开；单独设置会在重新开启遮罩后生效。';
  box.append(status);
  for (const [label, value] of [['显示这个房间',true],['遮罩这个房间',false],['跟随存档探索记录',null]]) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => {
      const overrides = { ...settings.roomOverrides };
      if (value === null) delete overrides[key]; else overrides[key] = value;
      settings.roomOverrides = overrides;
      applyLayers(); window.map.closePopup(); notify('room-mask', { room:key, visible:value });
    });
    box.append(button);
  }
  window.L.popup({ closeButton:true, className:'guide-room-popup' }).setLatLng(at).setContent(box).openOn(window.map);
}
function openRoomMenu(event, name, point) {
  if (event.originalEvent) window.L.DomEvent.stop(event.originalEvent);
  roomMenu(name, event.latlng || point);
}
function drawPlayers() {
  if (playerMarkers) window.map.removeLayer(playerMarkers);
  playerMarkers = window.L.layerGroup().addTo(window.map);
  const players = settings.players.length ? settings.players : settings.player ? [{...settings.player, name:'你', local:true}] : [];
  const overlaps = new Map();
  for (const player of players) {
    if (!player || (player.region && String(player.region).toUpperCase() !== window.loadedRegion)) continue;
    const found = getRoom(player.room); if (!found) continue;
    const precise = canPlacePrecisely(player) ? playerPoint(found.feature, player) : null;
    const point = precise || roomCenter(found.feature);
    const key = roomKey(player.room), index = overlaps.get(key) || 0;
    overlaps.set(key, index + 1);
    const local = player.local === true, host = player.host === true;
    const name = typeof player.name === 'string' && player.name.trim() ? player.name.slice(0,128) : local ? '你' : '玩家';
    const caption = `${name}${local ? ' · 本地' : ''}${host ? ' · 房主' : ''}\n${precise ? '位置快照' : '仅定位到房间'}`;
    const marker = window.L.circleMarker(point, { radius:local ? 7 : 6, color:local ? '#fff' : '#9ad0e1', weight:2, fillColor:local ? '#dbbc6b' : '#436d85', fillOpacity:1, interactive:false, className:'guide-position' });
    marker.bindTooltip(text(caption), {direction:index % 2 ? 'bottom' : 'top',offset:[0,(index % 2 ? 1 : -1)*(10+Math.floor(index/2)*36)],permanent:true,className:`guide-player-label${local ? ' local' : ''}`}).addTo(playerMarkers);
  }
}
function drawNames() {
  if (geographicNames) window.map.removeLayer(geographicNames);
  geographicNames = window.L.layerGroup().addTo(window.map);
  const bounds = window.roomsLayer.getBounds();
  if (!bounds.isValid()) return;
  // Parent supplies the spoiler-safe display name, including a hidden-name label.
  const current = settings.regionLabel || window.loadedRegion;
  window.L.tooltip({direction:'center',permanent:true,interactive:false,className:'guide-region-label'})
    .setContent(text(current)).setLatLng([bounds.getNorth(),bounds.getCenter().lng]).addTo(geographicNames);
  const candidates = new Set(Object.keys(settings.regionLabels));
  for (const feature of features()) {
    const match = /^GATE_([A-Z0-9]+)_([A-Z0-9]+)$/.exec(roomKey(feature.properties?.name) || '');
    if (match) for (const id of match.slice(1)) if (id !== window.loadedRegion) candidates.add(id);
  }
  for (const id of candidates) for (const name of gateRooms(features(), window.loadedRegion, id)) {
    const found = getRoom(name); if (!found) continue;
    window.L.tooltip({direction:'right',offset:[12,0],permanent:true,interactive:false,className:'guide-gate-label'})
      .setContent(text(`→ ${regionLabel(id)}`)).setLatLng(roomCenter(found.feature)).addTo(geographicNames);
  }
}
function drawRoute() {
  if (direction) window.map.removeLayer(direction);
  direction = window.L.layerGroup().addTo(window.map);
  if (!settings.route || !settings.nextRegion) return;
  const gates = gateRooms(features(), window.loadedRegion, settings.nextRegion);
  let best = null;
  for (const name of gates) {
    const target = getRoom(name); if (!target) continue;
    window.L.circleMarker(roomCenter(target.feature), {radius:10,color:'#e4ce90',weight:2,fillOpacity:0}).bindTooltip(text(`通向 ${regionLabel(settings.nextRegion)} 的门`), {className:'room-labels'}).addTo(direction);
    const path = findRoomRoute(features(), window.rwRoomJSON.connection_features, settings.room, name);
    if (path.rooms.length && (!best || path.featureIndexes.length < best.featureIndexes.length)) best = path;
  }
  if (best?.featureIndexes.length) {
    new window.L.BezierGeoJSON(best.featureIndexes.map(i => window.rwRoomJSON.connection_features[i]), {color:'#e4ce90',weight:4,opacity:.95,dashArray:'7 7',interactive:false}).addTo(direction);
    notify('route', {message:`已标出 ${best.featureIndexes.length} 段原图连接，通向 ${regionLabel(settings.nextRegion)} 的门。仅为连接参考，门槛、方向和能力仍以游戏为准。`});
  } else notify('route', {message:gates.length ? '已圈出通向下一地区的门；选中起点房间后显示连接参考。无法可靠连通时不会编造路线。' : '原图中未找到可核对的出口，暂不绘制房间路线。按区域方向自行探索，可能存在版本或 Mod 差异。'});
}
function focus(name, quiet = false) {
  const target = getRoom(name);
  if (!target) { if (!quiet) notify('error',{message:`原图没有房间 ${String(name).slice(0,96)}，已保留区域视图。`}); return false; }
  insideFocus = true; window.focusRoom(target); insideFocus = false;
  settings.room = target.feature.properties.name;
  applyLayers(); drawRoute();
  if (!quiet) notify('room', {room:settings.room});
  return true;
}
const originalFocus = window.focusRoom;
window.focusRoom = function(event) {
  originalFocus(event);
  if (loaded) {
    settings.room = window.room; applyLayers();
    if (!insideFocus) { drawRoute(); notify('room',{room:window.room}); }
  }
};
function ready() {
  loaded = true;
  if (nodes) window.map.removeLayer(nodes);
  nodes = window.L.layerGroup();
  for (const feature of features()) {
    if (!roomPolygons(feature).length) continue;
    const name = feature.properties.name, center = roomCenter(feature);
    const node = window.L.circleMarker(center, {radius:3,color:'#aaa',weight:1,fillColor:'#aaa',fillOpacity:1,className:'guide-room-node'});
    node.guideRoom = roomKey(name);
    node.bindTooltip(text(name),{className:'room-labels'});
    node.on('click', () => focus(name));
    node.on('contextmenu', event => openRoomMenu(event, name, center));
    node.addTo(nodes);
    getRoom(name)?.on('contextmenu', event => openRoomMenu(event, name, center));
  }
  applyLayers();
  const target = settings.room;
  if (!target || !getRoom(target)) window.map.fitBounds(window.roomsLayer.getBounds(),{padding:[30,30],maxZoom:-2});
  else focus(target, true);
  drawPlayers(); drawRoute(); drawNames();
  notify('ready',{rooms:features().length});
  if (target && !getRoom(target)) notify('error',{message:`原图没有房间 ${target}，已显示该区域。新增或改动地形可能不匹配。`});
}
window.addEventListener('rw-map-ready', ready);
window.addEventListener('rw-map-error', event => notify('error',{message:event.detail}));
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'where-to-map') return;
  const value = event.data;
  settings = { ...settings,
    mask:!!value.mask, rooms:!!value.rooms, spawns:!!value.spawns, names:!!value.names,
    nextRegion:typeof value.nextRegion==='string' ? value.nextRegion.toUpperCase() : null, route:!!value.route,
    room:typeof value.room==='string' ? value.room : null, player:value.player || null,
    players:Array.isArray(value.players) ? value.players.slice(0,64) : [],
    exploredRooms:Array.isArray(value.exploredRooms) ? value.exploredRooms.map(roomKey).filter(Boolean) : [],
    roomOverrides:Object.fromEntries(Object.entries(value.roomOverrides || {}).filter(([key,v]) => roomKey(key) && typeof v === 'boolean').map(([key,v]) => [roomKey(key),v])),
    regionLabel:typeof value.regionLabel === 'string' ? value.regionLabel.slice(0,160) : '',
    regionLabels:Object.fromEntries(Object.entries(value.regionLabels || {}).filter(([key,v]) => /^[A-Z0-9]{1,16}$/i.test(key) && typeof v === 'string').map(([key,v]) => [key.toUpperCase(),v.slice(0,160)])),
  };
  applyLayers();
  if (!loaded) return;
  if (value.action === 'overview') window.map.fitBounds(window.roomsLayer.getBounds(),{padding:[30,30],maxZoom:-2});
  if (value.action === 'focus' && settings.room) focus(settings.room);
  if (value.action === 'resize') requestAnimationFrame(()=>window.map.invalidateSize());
  drawPlayers(); drawRoute(); drawNames();
});
window.map.on('zoomstart', () => { zooming = true; if (settings.mask) for (const name of detailPanes) window.map.getPane(name).style.visibility = 'hidden'; });
window.map.on('zoomend', () => { zooming = false; updateClip(); });
window.map.on('moveend viewreset', updateClip);
window.L.control.zoom({position:'topleft'}).addTo(window.map);
new ResizeObserver(()=>window.map.invalidateSize()).observe(document.getElementById('mapid'));
if (window.rwRoomJSON) ready();
