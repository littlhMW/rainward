import { parseLocation, playerPoint } from './location.js';
import { findRoomRoute, gateRooms } from './room-route.js';
import { roomKey, visibleRoomNames, roomPolygons, roomClipPaths, canPlacePrecisely } from './room-visibility.js?v=2.3.2';

// The CC0 upstream owns terrain and connection rendering; this adapter controls
// disclosure, room overrides, names, player snapshots and existing route lines.
const notify = (event, data = {}) => parent.postMessage({ type:'where-to-parent', event, ...data }, location.origin);
let parentLanguage = 'zh';
try { parentLanguage = parent.document.documentElement.lang === 'en' ? 'en' : 'zh'; } catch { /* Same-origin parent language is optional; Chinese remains the default. */ }
const initialLanguage = window.rwGuide?.language === 'en' || window.rwGuide?.language === 'zh' ? window.rwGuide.language : parentLanguage;
let settings = { ...window.rwGuide, language:initialLanguage, route:true, nextRegion:null, room:null, player:null, players:[], exploredRooms:[], roomOverrides:{}, names:false, regionLabel:'', regionLabels:{}, manualRoomRoute:null };
const language = () => settings.language === 'en' ? 'en' : 'zh';
const tx = (zh, en) => language() === 'en' ? en : zh;
document.documentElement.lang = language();
try { settings.player = parseLocation(location.hash); settings.room = settings.player?.room || null; } catch { /* Parent validates external location links. */ }
let nodes, direction, manualDirection, playerMarkers, geographicNames, clipPath, loaded = false, insideFocus = false, zooming = false;
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
  status.textContent = settings.mask ? (visible.has(key) ? tx('这个房间的地形已显示','Terrain in this room is visible.') : tx('这个房间的地形已遮罩','Terrain in this room is masked.')) : tx('全图已揭开；单独设置会在重新开启遮罩后生效。','The full map is visible. This room setting will apply when the mask is enabled.');
  box.append(status);
  for (const [label, value] of [[tx('显示这个房间','Reveal this room'),true],[tx('遮罩这个房间','Mask this room'),false],[tx('跟随存档探索记录','Follow save exploration'),null]]) {
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
  const players = settings.players.length ? settings.players : settings.player ? [{...settings.player, name:tx('你','You'), local:true}] : [];
  const overlaps = new Map();
  for (const player of players) {
    if (!player || (player.region && String(player.region).toUpperCase() !== window.loadedRegion)) continue;
    const found = getRoom(player.room); if (!found) continue;
    const precise = canPlacePrecisely(player) ? playerPoint(found.feature, player) : null;
    const point = precise || roomCenter(found.feature);
    const key = roomKey(player.room), index = overlaps.get(key) || 0;
    overlaps.set(key, index + 1);
    const local = player.local === true, host = player.host === true;
    const name = typeof player.name === 'string' && player.name.trim() ? player.name.slice(0,128) : local ? tx('你','You') : tx('玩家','Player');
    const caption = `${name}${local ? tx(' · 本地',' · Local') : ''}${host ? tx(' · 房主',' · Host') : ''}\n${precise ? tx('位置快照','Position snapshot') : tx('仅定位到房间','Room-level position')}`;
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
  if (!settings.route) return;
  if (settings.locateRoom && settings.targetRoom) {
    const target = getRoom(settings.targetRoom);
    if (target) {
      const targetPoint = roomCenter(target.feature);
      window.L.circleMarker(targetPoint, {radius:10,color:'#f1c84b',weight:3,fillColor:'#f1c84b',fillOpacity:.85,interactive:false})
        .bindTooltip(text(tx(`目标房间：${roomKey(settings.targetRoom)}`,`Target room: ${roomKey(settings.targetRoom)}`)), {className:'manual-route-label'}).addTo(direction);
      const start = settings.room && getRoom(settings.room);
      if (start) {
        const result = findRoomRoute(features(), window.rwRoomJSON.connection_features, settings.room, settings.targetRoom);
        if (result.rooms.length && result.featureIndexes.length) {
          new window.L.BezierGeoJSON(result.featureIndexes.map(index => window.rwRoomJSON.connection_features[index]), {color:'#f1c84b',weight:6,opacity:1,dashArray:'8 6',interactive:false}).addTo(direction);
          notify('route',{message:tx(`已标出 ${result.featureIndexes.length} 段连接：${roomKey(settings.room)} → ${roomKey(settings.targetRoom)}。连接仅供参考，实际通行以游戏为准。`,`Marked ${result.featureIndexes.length} connections: ${roomKey(settings.room)} → ${roomKey(settings.targetRoom)}. Connections are a reference; verify access in game.`)});
          return;
        } else if (roomKey(settings.room) === roomKey(settings.targetRoom)) {
          notify('route',{message:tx('已到达目标房间。','You are already at the target room.')});
          return;
        } else {
          notify('route',{message:tx('原图中未找到到目标房间的连接，继续显示区域方向。','No connection to the target room was found in the source map; regional guidance remains visible.')});
        }
      } else notify('route',{message:tx(`已标出目标房间 ${roomKey(settings.targetRoom)}。定位当前房间后可显示连接路线。`,`Target room ${roomKey(settings.targetRoom)} is marked. Locate your current room to show the connections.`)});
    }
  }
  if (!settings.nextRegion) return;
  const gates = gateRooms(features(), window.loadedRegion, settings.nextRegion);
  let best = null;
  for (const name of gates) {
    const target = getRoom(name); if (!target) continue;
    window.L.circleMarker(roomCenter(target.feature), {radius:10,color:'#e4ce90',weight:2,fillOpacity:0}).bindTooltip(text(tx(`通向 ${regionLabel(settings.nextRegion)} 的门`,`Gate to ${regionLabel(settings.nextRegion)}`)), {className:'room-labels'}).addTo(direction);
    const path = findRoomRoute(features(), window.rwRoomJSON.connection_features, settings.room, name);
    if (path.rooms.length && (!best || path.featureIndexes.length < best.featureIndexes.length)) best = path;
  }
  if (best?.featureIndexes.length) {
    new window.L.BezierGeoJSON(best.featureIndexes.map(i => window.rwRoomJSON.connection_features[i]), {color:'#e4ce90',weight:4,opacity:.95,dashArray:'7 7',interactive:false}).addTo(direction);
    notify('route', {message:language() === 'en' ? `Marked ${best.featureIndexes.length} connections from the source map toward the gate to ${regionLabel(settings.nextRegion)}. This indicates connectivity only; verify gate requirements, direction, and abilities in game.` : `已标出 ${best.featureIndexes.length} 段原图连接，通向 ${regionLabel(settings.nextRegion)} 的门。此线仅表示连接关系；门槛、方向和能力要求以游戏为准。`});
  } else notify('route', {message:gates.length ? tx('已标出通向下一地区的门。选定起点房间后可显示连接参考；无法核实的路线不会绘制。','The gate to the next region is marked. Select a starting room to show a connection route. Unverified routes are not drawn.') : tx('原图中未找到可核对的出口，暂不绘制房间路线。请按区域方向探索；游戏版本或地形 Mod 可能造成差异。','No verifiable exit was found in the source map, so no room route is shown. Explore according to the regional direction; game versions or terrain mods may differ.')});
}
function drawManualRoute(fit = false) {
  if (manualDirection) window.map.removeLayer(manualDirection);
  manualDirection = window.L.layerGroup().addTo(window.map);
  const route = settings.manualRoomRoute;
  if (!route || typeof route.start !== 'string' || typeof route.target !== 'string') return;
  const start = getRoom(route.start), target = getRoom(route.target);
  if (!start || !target) {
    notify('manual-route', {message:tx('原图中没有找到起点或目标房间；已保留当前区域地图。','The source map does not contain the starting or destination room; the regional map remains available.')});
    return;
  }
  const startPoint = roomCenter(start.feature), targetPoint = roomCenter(target.feature);
  window.L.circleMarker(startPoint, {radius:9,color:'#f1c84b',weight:3,fillColor:'#111',fillOpacity:1,interactive:false})
    .bindTooltip(text(tx(`起点：${roomKey(route.start)}`,`Start: ${roomKey(route.start)}`)), {className:'manual-route-label'}).addTo(manualDirection);
  window.L.circleMarker(targetPoint, {radius:10,color:'#f1c84b',weight:3,fillColor:'#f1c84b',fillOpacity:.9,interactive:false})
    .bindTooltip(text(tx(`目的地：${roomKey(route.target)}`,`Destination: ${roomKey(route.target)}`)), {className:'manual-route-label'}).addTo(manualDirection);
  const result = findRoomRoute(features(), window.rwRoomJSON.connection_features, route.start, route.target);
  if (result.rooms.length && result.featureIndexes.length) {
    new window.L.BezierGeoJSON(result.featureIndexes.map(index => window.rwRoomJSON.connection_features[index]), {color:'#f1c84b',weight:6,opacity:1,dashArray:'8 6',interactive:false}).addTo(manualDirection);
    notify('manual-route', {message:tx(`已标出 ${result.featureIndexes.length} 段连接：${roomKey(route.start)} → ${roomKey(route.target)}。连接仅供参考，实际通行以游戏为准。`,`Marked ${result.featureIndexes.length} connections: ${roomKey(route.start)} → ${roomKey(route.target)}. Connections are a reference; verify access in game.`)});
  } else if (roomKey(route.start) === roomKey(route.target)) {
    notify('manual-route', {message:tx('起点与目的地相同。','The starting room is already the destination.')});
  } else {
    notify('manual-route', {message:tx('原图中未找到连接路线；请确认房间代码、区域和地图版本。','No connected route was found in the source map. Check the room codes, region, and map version.')});
  }
  if (fit) {
    const bounds = manualDirection.getBounds();
    if (bounds.isValid()) window.map.fitBounds(bounds, {padding:[45,45], maxZoom:1});
  }
}
function focus(name, quiet = false) {
  const target = getRoom(name);
  if (!target) { if (!quiet) notify('error',{message:tx(`原图没有房间 ${String(name).slice(0,96)}，已保留区域视图。`,`The source map has no room ${String(name).slice(0,96)}. The regional view remains open.`)}); return false; }
  insideFocus = true; window.focusRoom(target); insideFocus = false;
  settings.room = target.feature.properties.name;
  applyLayers(); drawRoute(); drawManualRoute();
  if (!quiet) notify('room', {room:settings.room});
  return true;
}
const originalFocus = window.focusRoom;
window.focusRoom = function(event) {
  originalFocus(event);
  if (loaded) {
    settings.room = window.room; applyLayers();
    if (!insideFocus) { drawRoute(); drawManualRoute(); notify('room',{room:window.room}); }
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
  drawPlayers(); drawRoute(); drawManualRoute(); drawNames();
  notify('ready',{rooms:features().length});
  if (target && !getRoom(target)) notify('error',{message:tx(`原图没有房间 ${target}，已显示该区域。新增或改动地形可能不匹配。`,`The source map has no room ${target}; the regional view is shown. Added or altered terrain may not match.`)});
}
window.addEventListener('rw-map-ready', ready);
function translateMapError(value) {
  const message = String(value ?? '');
  if (language() !== 'en') return message;
  if (message === '该角色的原图没有收录这个区域。') return 'The source map does not include this region for the selected campaign.';
  let match = /^原地图暂未提供这个区域的数据。HTTP 状态码：(\d+)。$/.exec(message);
  if (match) return `The source map does not provide data for this region. HTTP status: ${match[1]}.`;
  if (message === '原地图数据加载失败，请检查网络。') return 'Could not load source map data. Check the network connection.';
  if (message === '原地图数据格式异常，暂时无法显示该区域。') return 'The source map data is invalid; this region cannot be displayed.';
  return message;
}
window.addEventListener('rw-map-error', event => notify('error',{message:translateMapError(event.detail)}));
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'where-to-map') return;
  const value = event.data;
  const previousLanguage = language();
  settings = { ...settings,
    language:value.language === 'en' ? 'en' : 'zh',
    mask:!!value.mask, rooms:!!value.rooms, spawns:!!value.spawns, names:!!value.names,
    nextRegion:typeof value.nextRegion==='string' ? value.nextRegion.toUpperCase() : null, route:!!value.route,
    locateRoom:!!value.locateRoom, targetRoom:typeof value.targetRoom==='string' ? roomKey(value.targetRoom) : null,
    room:typeof value.room==='string' ? value.room : null, player:value.player || null,
    players:Array.isArray(value.players) ? value.players.slice(0,64) : [],
    manualRoomRoute:value.manualRoomRoute && typeof value.manualRoomRoute.start === 'string' && typeof value.manualRoomRoute.target === 'string' ? {
      campaign:typeof value.manualRoomRoute.campaign === 'string' ? value.manualRoomRoute.campaign : '',
      region:typeof value.manualRoomRoute.region === 'string' ? value.manualRoomRoute.region.toUpperCase() : '',
      start:roomKey(value.manualRoomRoute.start), target:roomKey(value.manualRoomRoute.target),
    } : null,
    exploredRooms:Array.isArray(value.exploredRooms) ? value.exploredRooms.map(roomKey).filter(Boolean) : [],
    roomOverrides:Object.fromEntries(Object.entries(value.roomOverrides || {}).filter(([key,v]) => roomKey(key) && typeof v === 'boolean').map(([key,v]) => [roomKey(key),v])),
    regionLabel:typeof value.regionLabel === 'string' ? value.regionLabel.slice(0,160) : '',
    regionLabels:Object.fromEntries(Object.entries(value.regionLabels || {}).filter(([key,v]) => /^[A-Z0-9]{1,16}$/i.test(key) && typeof v === 'string').map(([key,v]) => [key.toUpperCase(),v.slice(0,160)])),
  };
  document.documentElement.lang = language();
  if (loaded && previousLanguage !== language()) window.map.closePopup();
  applyLayers();
  if (!loaded) return;
  if (value.action === 'overview') window.map.fitBounds(window.roomsLayer.getBounds(),{padding:[30,30],maxZoom:-2});
  if (value.action === 'focus' && settings.room) focus(settings.room);
  if (value.action === 'resize') requestAnimationFrame(()=>window.map.invalidateSize());
  drawPlayers(); drawRoute(); drawManualRoute(value.action === 'manual-route'); drawNames();
});
window.map.on('zoomstart', () => { zooming = true; if (settings.mask) for (const name of detailPanes) window.map.getPane(name).style.visibility = 'hidden'; });
window.map.on('zoomend', () => { zooming = false; updateClip(); });
window.map.on('moveend viewreset', updateClip);
window.L.control.zoom({position:'topleft'}).addTo(window.map);
new ResizeObserver(()=>window.map.invalidateSize()).observe(document.getElementById('mapid'));
if (window.rwRoomJSON) ready();
