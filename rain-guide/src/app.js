import { REGIONS, CAMPAIGNS, SURVIVAL_TIPS, SOURCES } from './data.js';
import { STORAGE_KEY, defaultState, defaultProfile, normalizeState, campaignNodes, activeStage, regionName, visibleName, findPath, exactRegionMatches, availableEdges, adjacentRegions } from './engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icons = {
  arrow: '<svg viewBox="0 0 24 24"><path d="m5 12 14 0m-6-6 6 6-6 6"/></svg>',
  compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/></svg>',
  rain: '<svg viewBox="0 0 24 24"><path d="M7 3v5m5-2v5m5-8v5M5 13v5m6-3v6m6-8v5"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M5 19C0 5 13 4 20 4c0 9-2 16-12 13M4 21 16 9"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M12 6c-3-3-6-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 2v15"/></svg>',
};
let state = defaultState(), storageOK = true, page = 'explore', zoom = 1, filter = '';
try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = normalizeState(JSON.parse(raw), CAMPAIGNS, REGIONS); }
catch { storageOK = false; }
// A new visit always starts with the detailed external map covered.
state.prefs.mask = true;
const campaign = () => {
  const base = CAMPAIGNS.find(c => c.id === state.campaign) || CAMPAIGNS[0];
  const c = { ...base, edges: [...(state.prefs.dlc && base.dlcEdges ? base.dlcEdges : base.edges)], directedEdges: [...(base.directedEdges || [])], blockedEdges: [...(base.blockedEdges || [])] };
  const completed = state.profiles[c.id]?.completed || [];
  for (const edge of c.conditionalEdges || []) if (!completed.includes(edge.requires)) c.blockedEdges.push([edge.from, edge.to]);
  if (c.id === 'saint' && !completed.includes('saint-seven')) c.blockedEdges.push(['SB', 'HR']);
  if (state.prefs.dlc && state.prefs.outerUnlocked && ['survivor', 'monk'].includes(c.id)) { c.edges.push(['SB', 'OE']); c.directedEdges.push(['OE', 'SU']); }
  if (state.prefs.dlc && base.dlcEdges) c.scope = '已启用 Downpour 扩展连接。可选扩展路线仍需在版本设置中确认游戏内已经解锁。' + c.scope;
  return c;
};
const profile = () => state.profiles[campaign().id] ||= defaultProfile(campaign());
const name = id => visibleName(campaign(), profile(), REGIONS, id, state.prefs.names);
const fullName = id => regionName(campaign(), REGIONS, id);
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageOK = true; }
  catch { storageOK = false; }
  $('#save-status').textContent = storageOK ? '进度仅存本机' : '无法保存 · 请导出备份';
}
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 4000);
}
function dialog(title, body, footer = '') {
  $('#dialog-content').innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${escape(title)}</h2><button class="icon-button" data-close aria-label="关闭弹窗">×</button></div>${body}${footer ? `<div class="dialog-footer">${footer}</div>` : ''}`;
  $('#dialog').setAttribute('aria-labelledby', 'dialog-title');
  $('#dialog').showModal();
  $('[data-close]').onclick = () => $('#dialog').close();
}
$('#dialog').addEventListener('click', event => { if (event.target === $('#dialog')) { const r = $('#dialog').getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $('#dialog').close(); } });
function confirmDialog(title, description, action, button = '确认') {
  dialog(title, `<p class="dialog-copy">${escape(description)}</p>`, `<button class="button subtle" id="cancel-action">取消</button><button class="button primary" id="confirm-action">${escape(button)}</button>`);
  $('#cancel-action').onclick = () => $('#dialog').close();
  $('#confirm-action').onclick = () => { $('#dialog').close(); action(); };
}
function setPage(next) {
  page = next;
  document.querySelectorAll('[data-page]').forEach(b => { b.classList.toggle('active', b.dataset.page === page); if (b.dataset.page === page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  render();
}
document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => setPage(b.dataset.page));

function hero(kicker, title, subtitle) {
  return `<section class="hero"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="hero-subtitle">${subtitle}</p></div><div class="hero-stamp">${icons.rain}<span>跟随好奇心<br><strong>把发现留给你</strong></span></div></section>`;
}
function toggle(id, checked, title, subtitle) {
  return `<label class="toggle-row" for="${id}"><span><strong>${title}</strong><small>${subtitle}</small></span><input id="${id}" type="checkbox" role="switch" ${checked ? 'checked' : ''}><span class="switch" aria-hidden="true"></span></label>`;
}
function render() {
  const activeId = document.activeElement?.id;
  renderContent();
  if (activeId && document.getElementById(activeId) && !document.getElementById(activeId).disabled) document.getElementById(activeId).focus({ preventScroll: true });
}
function renderContent() {
  const c = campaign(), p = profile();
  if (!campaignNodes(c).includes(p.current)) p.current = c.start;
  document.documentElement.style.setProperty('--character', c.color || '#dce5db');
  if (page === 'guide') return renderGuide();
  if (page === 'journal') return renderJournal();
  const stage = activeStage(c, p);
  const path = stage ? findPath(c, p.current, stage.destination) : [];
  $('#main').innerHTML = `${hero('A QUIET COMPANION / 雨世界探索手册', '世界很大，先走下一步。', '一点方向，一点帮助。故事的答案，留在你自己的旅途中。')}
  <div class="workspace">
    <aside class="journey-panel panel">
      <div class="section-heading"><span class="eyebrow">YOUR JOURNEY</span><span class="tiny-number">01</span></div>
      <h2>你的旅程</h2>
      <button class="character-picker" id="choose-character"><span class="character-avatar" aria-hidden="true"><i></i><i></i></span><span><strong>${escape(c.name)}</strong><small>${escape(c.english || c.id.toUpperCase())}</small></span><span class="chevron">⌄</span></button>
      <div class="edition-row"><span class="edition-tag">${escape(c.dlcEdges && state.prefs.dlc ? '原版 + Downpour' : c.dlc || '原版')}</span>${c.dlcEdges ? '<button class="text-button" id="edition-button">版本设置</button>' : ''}</div>
      <div class="divider identity-divider"></div>
      <label class="field-label" for="current-region">我现在在</label>
      <select id="current-region">${p.known.filter(id => campaignNodes(c).includes(id)).map(id => `<option value="${escape(id)}" ${id === p.current ? 'selected' : ''}>${escape(fullName(id))}</option>`).join('')}</select>
      <button id="locate-button" class="text-button locate">＋ 记录新到达的区域</button>
      <p class="microcopy">${p.known.length} 个区域留下了足迹<br>到访记录与剧情完成分别保存</p>
      <div class="divider"></div>
      <div class="section-heading"><span class="field-label">按你的节奏探索</span>${icons.shield}</div>
      ${toggle('mask-toggle', state.prefs.mask, '详细地图遮罩', '默认仅显示区域连接')}
      ${toggle('names-toggle', state.prefs.names, '显示未知地名', '关闭时以匿名节点呈现')}
      ${toggle('route-toggle', state.prefs.route, '标记线索方向', '只标连接，不揭示剧情')}
      <p class="privacy-note">${icons.shield}<span>提示逐级展开<br>你决定知道多少</span></p>
    </aside>
    <section class="map-panel panel" aria-label="区域连接地图">
      <div class="map-heading"><div><p class="eyebrow">THE WORLD, SOFTLY REVEALED</p><h2>雨幕之下 <span class="map-mode">${state.prefs.mask ? '连接视图' : '外部详细地图'}</span></h2></div><span class="map-live"><i></i>${state.prefs.mask ? '遮罩开启' : '已揭开'}</span></div>
      <div id="map-container" class="map-container ${!state.prefs.mask ? 'unmasked' : ''}">${state.prefs.mask ? mapSVG(c, p, path) : detailedMap(c)}</div>
      ${state.prefs.mask ? `<div class="map-toolbar"><span class="map-legend"><i class="legend-known"></i> 已探索 <i class="legend-unknown"></i> 未知 <i class="legend-route"></i> 线索方向</span><div class="zoom-controls"><button id="zoom-out" aria-label="缩小地图">−</button><button id="zoom-reset" aria-label="重置地图缩放">复位</button><button id="zoom-in" aria-label="放大地图">＋</button></div></div>` : ''}
      <div class="map-caption">${icons.compass}<div><strong>${c.routeMode === 'waypoints' ? '此旅程使用路标导航' : '连接的是区域，不是房间'}</strong><p>${escape(c.routeMode === 'waypoints' ? (c.graphNote || '传送路径会随进度变化，不推算固定最短路。') : '图中位置为示意；连线不保证业力门槛、捷径或单向通行。')}</p></div><button class="icon-button" id="map-info" aria-label="查看地图适用范围">ⓘ</button></div>
    </section>
    <aside class="story-panel panel">
      <p class="eyebrow accent">${icons.compass} A LITTLE DIRECTION</p>
      <div class="story-title-row"><span class="pill">${stage?.kind === 'optional' ? '可选探索' : '故事线索'}</span><span class="small-text">${p.hint === 0 ? '轻轻提示' : p.hint === 1 ? '更明确一点' : '目的地提示'}</span></div>
      <h2>${escape(stage?.title || '接下来，按自己的节奏。')}</h2>
      <div class="hint-copy" aria-live="polite">${escape(stage ? stage.hints[Math.min(p.hint, stage.hints.length - 1)] : '已完成这份向导中的主要路标。你仍然可以记录旅程、回看目标，或探索其他方向。')}</div>
      ${stage ? `<div class="hint-meter" aria-label="提示级别 ${p.hint + 1}，共三级">${[0, 1, 2].map(n => `<span class="${n <= p.hint ? 'lit' : ''}"></span>`).join('')}<small>由你决定深浅</small></div><button class="button hint-button" id="more-hint" ${p.hint >= 2 ? 'disabled' : ''}>${p.hint === 0 ? '再明确一点' : p.hint === 1 ? '揭示目的地区域' : '已展开目的地提示'} ${icons.arrow}</button>${p.hint ? '<button class="text-button" id="less-hint">收起到轻提示</button>' : ''}<div class="next-direction"><span class="field-label">从这里出发</span><strong>${escape(name(p.current))} <span>→</span> ${escape(path.length > 1 ? name(path[1]) : p.current === stage.destination ? '在本区域继续探索' : '参考上方提示')}</strong><small>${path.length > 1 ? '按连线给出的方向参考，不代表最安全路线' : c.routeMode === 'waypoints' ? '跟随当前存档的路标与传送门' : '到达区域后仍需自行寻找触发位置'}</small></div><button class="button complete-button" id="complete-stage">✓ 我已完成这条线索</button>` : ''}
      ${stage && c.stages.some(s => s.before === stage.id) ? `<div class="branch-reminder">${escape(c.stages.find(s => s.before === stage.id).hints[0])}<button class="text-button" id="branch-warning">查看分支先后提醒 →</button></div>` : ''}
      <button class="text-button history-button" id="history-button">${p.completed.length ? '回看与撤销已完成线索' : '角色提醒与可选探索'} <span>↗</span></button>
      <div class="story-footnote">迷路并不代表走错。<br>没有需要赶上的标准进度。</div>
    </aside>
  </div>
  <div class="below-grid"><section class="nearby-panel"><div class="section-heading"><h2>眼前的岔路</h2><span class="small-text">与地图等价的文字导航</span></div><div class="neighbor-list">${neighbors(c, p.current).map(id => `<button class="neighbor-button" data-node="${escape(id)}"><span class="node-dot ${p.known.includes(id) ? 'visited' : ''}"></span><span>${escape(name(id))}</span>${icons.arrow}</button>`).join('') || '<p class="muted">此处使用进度相关路标，请参考右侧提示。</p>'}</div></section><section class="field-reminder"><span class="reminder-icon">${icons.leaf}</span><div><p class="eyebrow">FIELD NOTE</p><p>${escape(c.warning || '先找食物和避雨处，再试着多走一个房间。观察，也是一种前进。')}</p></div></section></div>
  <section class="quick-help"><div class="section-heading"><div><p class="eyebrow">BEFORE THE NEXT RAIN</p><h2>在下一场雨之前</h2></div><button id="all-guide" class="text-button">打开生存手册 ↗</button></div><div class="help-grid">${SURVIVAL_TIPS.slice(0, 3).map((tip, i) => tipCard(tip, i)).join('')}</div></section>`;
  bindExplore(stage);
  if (!storageOK) $('#save-status').textContent = '无法保存 · 请导出备份';
}
function neighbors(c, id) { return adjacentRegions(c, id); }
function point(c, id, index, total) {
  if (c.routeMode === 'waypoints') return [100 + index % 6 * 140, 80 + Math.floor(index / 6) * 90];
  const r = REGIONS[id];
  if (r && Number.isFinite(r.x) && Number.isFinite(r.y)) return [r.x, r.y];
  const angle = index / Math.max(1, total) * Math.PI * 2;
  return [450 + Math.cos(angle) * 290, 290 + Math.sin(angle) * 200];
}
function mapSVG(c, p, path) {
  const nodes = campaignNodes(c);
  const raw = nodes.map((id, i) => point(c, id, i, nodes.length));
  const xs = raw.map(p => p[0]), ys = raw.map(p => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), dx = Math.max(1, Math.max(...xs) - minX), dy = Math.max(1, Math.max(...ys) - minY);
  const positions = Object.fromEntries(nodes.map((id, i) => [id, [90 + (raw[i][0] - minX) / dx * 640, 65 + (raw[i][1] - minY) / dy * 365]]));
  const edgeInPath = (a, b) => path.some((v, i) => i && ((v === a && path[i - 1] === b) || (v === b && path[i - 1] === a)));
  const label = id => escape(name(id));
  const links = availableEdges(c).map(([a, b]) => { if (!positions[a] || !positions[b]) return ''; const [x1, y1] = positions[a], [x2, y2] = positions[b]; return `<path class="map-edge ${state.prefs.route && edgeInPath(a, b) ? 'route-edge' : ''}" d="M${x1} ${y1} L${x2} ${y2}" ${c.directedEdges?.some(([x,y]) => x === a && y === b) ? 'marker-end="url(#edge-arrow)"' : ''}/>`; }).join('');
  const markers = nodes.map(id => {
    const [x, y] = positions[id], current = id === p.current, known = p.known.includes(id), suggested = state.prefs.route && id === path[1];
    return `<g class="map-node ${current ? 'current' : ''} ${known ? 'known' : ''} ${suggested ? 'suggested' : ''}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${label(id)}${current ? '，当前位置' : ''}" data-node="${escape(id)}"><circle class="node-hit" r="27"/>${current ? '<circle class="node-halo" r="25"/><circle class="node-ring" r="15"/>' : suggested ? '<circle class="suggested-ring" r="16"/>' : ''}<circle class="node-core" r="${current ? 7 : known ? 6 : 4.5}"/><text y="${current ? 40 : 28}" text-anchor="middle">${label(id)}</text>${current ? '<text class="you-label" y="-35" text-anchor="middle">你在这里</text>' : ''}</g>`;
  }).join('');
  return `<svg id="world-map" class="world-map" viewBox="0 0 820 500" role="group" aria-label="${escape(c.name)}区域连接示意图"><defs><marker id="edge-arrow" viewBox="0 0 10 10" refX="17" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L8 5L0 9" fill="none" stroke="#afbfaa"/></marker><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="#718081" opacity="0.18"/></pattern><radialGradient id="glow"><stop stop-color="#708f80" stop-opacity=".13"/><stop offset="1" stop-color="#111a1d" stop-opacity="0"/></radialGradient></defs><rect width="820" height="500" fill="url(#dots)"/><ellipse cx="385" cy="260" rx="380" ry="240" fill="url(#glow)"/><g class="contours" fill="none" stroke="#839d90" stroke-opacity=".06"><path d="M-50 400Q140 280 90 180T360 30T880 250M-30 450Q170 315 130 180T390 65T910 260M-40 500Q210 345 170 200T410 100T910 320"/><ellipse cx="480" cy="240" rx="300" ry="170"/><ellipse cx="480" cy="240" rx="345" ry="205"/></g><g id="map-zoom" style="transform:scale(${zoom})">${links}${markers}</g><text x="22" y="474" class="map-watermark">RAINWARD / TOPOLOGY ${c.routeMode === 'waypoints' ? 'UNAVAILABLE' : 'ONLY'}</text><g class="north" transform="translate(782 34)"><path d="M0 20V0m-5 7L0 0l5 7"/><text x="0" y="34" text-anchor="middle">示意</text></g></svg>${c.routeMode === 'waypoints' ? '<div class="waypoint-note">传送关系随进度变化<br><span>节点是剧情路标，不连成固定地图</span></div>' : ''}`;
}
function detailedMap(c) {
  const url = c.mapUrl || 'https://rain-world-map.github.io/';
  return `<div class="external-map-note">外部地图会显示房间、地点与物品；不受本站的提示等级保护。<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">单独打开 ↗</a></div><iframe title="${escape(c.name)}的外部详细地图（包含剧透）" src="${escape(url)}" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups" loading="lazy"></iframe><p class="iframe-fallback">若外站拒绝嵌入或加载失败，请使用上方“单独打开”。外部地图需要联网。</p>`;
}
function bindExplore(stage) {
  $('#choose-character').onclick = chooseCharacter;
  if ($('#edition-button')) $('#edition-button').onclick = editionSettings;
  $('#current-region').onchange = event => { profile().current = event.target.value; save(); render(); };
  $('#locate-button').onclick = locate;
  $('#mask-toggle').onchange = event => {
    if (event.target.checked) { state.prefs.mask = true; save(); render(); }
    else { event.target.checked = true; confirmDialog('揭开详细地图？', '这会联网加载原作者的地图，显示房间结构、区域名称及地图标记，可能包含剧情地点。本站的文字提示等级保持不变；重新打开本站会恢复遮罩。', () => { state.prefs.mask = false; save(); render(); }, '揭开并加载地图'); }
  };
  $('#names-toggle').onchange = event => {
    if (!event.target.checked) { state.prefs.names = false; save(); render(); }
    else { event.target.checked = false; confirmDialog('显示所有区域名称？', '名称本身可能暗示未遇见的地点。打开后，本角色连接图中的未知地名将可见；这不会把区域记为已探索。', () => { state.prefs.names = true; save(); render(); }, '显示地名'); }
  };
  $('#route-toggle').onchange = event => { state.prefs.route = event.target.checked; save(); render(); };
  document.querySelectorAll('[data-node]').forEach(node => {
    node.addEventListener('click', () => selectNode(node.dataset.node));
    if (node.tagName.toLowerCase() === 'g') node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNode(node.dataset.node); } });
  });
  for (const [id, delta] of [['zoom-in', .15], ['zoom-out', -.15], ['zoom-reset', 0]]) if ($('#' + id)) $('#' + id).onclick = () => { zoom = delta ? Math.max(.7, Math.min(1.75, zoom + delta)) : 1; $('#map-zoom').style.transform = `scale(${zoom})`; };
  if ($('#more-hint')) $('#more-hint').onclick = () => {
    if (profile().hint === 1) confirmDialog('查看目的地提示？', '下一级会显示目的地区域名称和到达后的行动方向，不解释剧情事件或结局。', () => { profile().hint = 2; save(); render(); }, '查看目的地');
    else { profile().hint = Math.min(2, profile().hint + 1); save(); render(); }
  };
  if ($('#less-hint')) $('#less-hint').onclick = () => { profile().hint = 0; save(); render(); };
  if ($('#complete-stage')) $('#complete-stage').onclick = () => confirmDialog('记录这条线索已完成', stage.completion || '只有到达区域不一定完成事件。确认你已完成提示中的目标后，再前往下一条线索。', () => { profile().completed.push(stage.id); profile().hint = 0; save(); render(); toast('已记录；可在“回看与撤销”中恢复。'); }, '确认完成');
  $('#history-button').onclick = history;
  if ($('#branch-warning')) $('#branch-warning').onclick = () => { const optional = campaign().stages.find(s => s.before === stage.id); dialog('分支先后提醒', `<p class="dialog-copy">${escape(optional.hints[1])}</p><details><summary>展开具体条件（含地点及能力提示）</summary><p class="dialog-copy">${escape(optional.hints[2])}</p></details>`); };
  $('#map-info').onclick = () => dialog('地图适用范围', `<p class="dialog-copy">${escape(campaign().scope || '区域级导航，不替代游戏内地图。')}</p><p class="dialog-copy">${escape(campaign().graphNote || '连线表示区域相连；门槛、角色能力和游戏进度仍以游戏内状态为准。')}</p><p class="dialog-copy">匿名连接图仍会透露世界的大致规模。地名开关、地图遮罩和文字提示等级分别控制。</p>`);
  $('#all-guide').onclick = () => setPage('guide');
  bindTips();
}
function chooseCharacter() {
  dialog('选择一位旅者', `<p class="dialog-copy">每位角色有独立的进度与线索。切换后恢复地图遮罩和匿名地名，角色名字本身可能包含解锁内容。</p><div class="campaign-grid">${CAMPAIGNS.map(c => `<button class="campaign-option ${c.id === campaign().id ? 'selected' : ''}" data-campaign="${escape(c.id)}" style="--character:${escape(c.color)}"><span class="mini-avatar" aria-hidden="true"></span><strong>${escape(c.name)}</strong><small>${escape(c.dlc)}</small></button>`).join('')}</div><p class="microcopy">原版 3 位 · Downpour 5 位 · Watcher 1 位。秘密额外模式与竞技场角色不作为常规剧情路线。</p>`);
  document.querySelectorAll('[data-campaign]').forEach(button => button.onclick = () => { state.campaign = button.dataset.campaign; state.prefs.mask = true; state.prefs.names = false; profile().hint = 0; zoom = 1; save(); $('#dialog').close(); render(); });
}
function editionSettings() {
  dialog('游戏版本与扩展', `<p class="dialog-copy">选择当前存档启用的内容。Downpour 会增加区域与通路；切换图谱不会删除已记录的足迹。地图中的位置仍是示意。</p>${toggle('edition-dlc', state.prefs.dlc, '启用 Downpour 图谱', '仅在游戏中启用对应 DLC 时打开')}<div class="settings-section"><details><summary>我已通关过其他角色：设置可选路线</summary><p class="microcopy">下面涉及跨角色解锁条件；第一次游玩可保持关闭。</p>${toggle('edition-outer', state.prefs.outerUnlocked, '同存档槽已完成饕餮', '为幸存者 / 僧侣加入已解锁的可选路线')}</details></div>`, '<button class="button primary" id="save-edition">保存版本设置</button>');
  $('#save-edition').onclick = () => {
    state.prefs.dlc = $('#edition-dlc').checked;
    state.prefs.outerUnlocked = $('#edition-outer').checked;
    state.prefs.mask = true; state.prefs.names = false;
    for (const c of CAMPAIGNS.filter(c => c.dlcEdges)) {
      const p = state.profiles[c.id];
      if (p && !state.prefs.dlc && !campaignNodes(c).includes(p.current)) p.current = c.start;
    }
    save(); $('#dialog').close(); render(); toast('版本设置已更新，已恢复地图遮罩。');
  };
}
function selectNode(id) {
  const known = profile().known.includes(id);
  dialog(name(id), `<p class="dialog-copy">${known ? '已在你的探索记录里。你可以把这里设为当前位置；这不会自动完成剧情。' : '这里是一个尚未记录的区域。仅选择节点不会揭示名称；确认你已在游戏里到达后，再把它加入探索记录。'}</p>`, `${known ? '' : '<button class="button subtle" id="mark-known">只标记到过（显示地名）</button>'}<button class="button primary" id="set-location">${known ? '我现在在这里' : '我已到达这里（显示地名）'}</button>`);
  const mark = move => { if (!profile().known.includes(id)) profile().known.push(id); if (move) profile().current = id; save(); $('#dialog').close(); render(); toast(`已记录：${fullName(id)}`); };
  if ($('#mark-known')) $('#mark-known').onclick = () => mark(false);
  $('#set-location').onclick = () => mark(true);
}
function locate() {
  dialog('记录你到达的地方', `<p class="dialog-copy">输入游戏里已经看到的完整区域名或缩写（如 SU）。不会预先列出未知地名。也可以在连接图上选择匿名节点。</p><form id="locate-form"><label class="field-label" for="region-query">区域名或代码</label><div class="search-row"><input id="region-query" maxlength="80" autocomplete="off" placeholder="例如：郊区 / SU"><button class="button primary" type="submit">查找</button></div></form><div id="search-results" role="status"></div>`);
  $('#locate-form').onsubmit = event => {
    event.preventDefault();
    const matches = exactRegionMatches(campaign(), REGIONS, $('#region-query').value);
    $('#search-results').innerHTML = matches.length ? matches.map(id => `<button class="search-result" data-found="${escape(id)}">${escape(fullName(id))}<span>设为当前位置 →</span></button>`).join('') : '<p class="microcopy">未找到精确匹配。请检查完整名称或区域缩写，以及所选角色；部分扩展区域不在当前图谱的覆盖范围。</p>';
    document.querySelectorAll('[data-found]').forEach(button => button.onclick = () => { const id = button.dataset.found; if (!profile().known.includes(id)) profile().known.push(id); profile().current = id; save(); $('#dialog').close(); render(); });
  };
  $('#region-query').focus();
}
function history() {
  const c = campaign(), p = profile();
  const completed = c.stages.filter(s => p.completed.includes(s.id));
  dialog('旅程记录', `<p class="dialog-copy">${escape(c.warning || '不用为了赶路线忽略沿途探索。')}</p><p class="microcopy">${escape(c.scope || '')}</p>${completed.length ? `<div class="history-list">${completed.map(s => `<div><span>✓ ${escape(s.title)}</span><button class="text-button" data-undo="${escape(s.id)}">撤销</button></div>`).join('')}</div>` : '<p class="empty-note">还没有完成的线索。到访区域和完成剧情是两件不同的事。</p>'}<p class="microcopy">撤销会同时重置后续线索，避免跳过剧情前提。可选探索不影响主线。</p>${c.stages.some(s => s.kind === 'optional') ? '<button class="button subtle" id="optional-button">查看可选探索提示</button>' : ''}`);
  document.querySelectorAll('[data-undo]').forEach(button => button.onclick = () => { const index = c.stages.findIndex(s => s.id === button.dataset.undo); const later = c.stages.slice(index).map(s => s.id); p.completed = p.completed.filter(id => !later.includes(id)); p.hint = 0; save(); $('#dialog').close(); render(); toast('已撤销这条及后续线索。'); });
  if ($('#optional-button')) $('#optional-button').onclick = () => { $('#dialog').close(); dialog('可选探索 · 轻提示', `<p class="dialog-copy">这些方向不阻塞主线，可按兴趣选择。</p>${c.stages.filter(s => s.kind === 'optional').map(s => `<section class="optional-hint"><h3>${escape(s.title)}</h3><p>${escape(s.hints[0])}</p><button class="text-button" data-optional="${escape(s.id)}">展开目的地提示（会显示地名） ↗</button></section>`).join('')}`); document.querySelectorAll('[data-optional]').forEach(b => b.onclick = () => { const s = c.stages.find(s => s.id === b.dataset.optional); b.outerHTML = `<p class="dialog-copy">${escape(s.hints.at(-1))}</p>`; }); };
}
function tipCard(tip, index = 0) {
  return `<button class="tip-card" data-tip="${escape(tip.id)}"><span class="tip-icon">${[icons.rain, icons.leaf, icons.shield][index % 3]}</span><div><span class="tip-category">${escape(tip.category)}</span><h3>${escape(tip.title)}</h3><p>${escape(tip.summary)}</p></div><span class="tip-arrow">↗</span></button>`;
}
function bindTips() { document.querySelectorAll('[data-tip]').forEach(button => button.onclick = () => {
  const tip = SURVIVAL_TIPS.find(t => t.id === button.dataset.tip);
  dialog(tip.title, `<span class="pill">${escape(tip.category)}</span><div class="tip-body">${escape(tip.body).replace(/\n/g, '<br>')}</div>${tip.source ? `<a class="source-link" href="${escape(tip.source)}" target="_blank" rel="noopener noreferrer">核对 Wiki 资料 ↗</a><p class="microcopy">外站可能包含剧情，且不受本站防剧透设置控制。</p>` : ''}`);
}); }
function renderGuide() {
  const categories = [...new Set(SURVIVAL_TIPS.map(t => t.category))];
  const tips = SURVIVAL_TIPS.filter(t => !filter || t.category === filter);
  $('#main').innerHTML = `${hero('FIELD MANUAL / 随身生存手册', '先活过这一场雨。', '遇到一点困难时，来这里找一点帮助。这里的常规建议不会展开故事。')}<div class="guide-layout"><section><div class="filter-bar"><button data-filter="" class="chip ${!filter ? 'active' : ''}">全部</button>${categories.map(category => `<button class="chip ${filter === category ? 'active' : ''}" data-filter="${escape(category)}">${escape(category)}</button>`).join('')}</div><div class="guide-grid">${tips.map(tipCard).join('')}</div></section><aside class="checklist panel"><p class="eyebrow">ONE CYCLE AT A TIME</p><h2>出门前，停一下</h2><p class="muted">不用每次都走很远。一个小目标就好。</p>${[['food', '看过食物需求'], ['shelter', '记得最近的避雨处'], ['rain', '留意雨周期 / 当前天气'], ['hands', '检查手里带的东西']].map(([id, title]) => `<label><input type="checkbox" value="${id}" ${profile().checklist.includes(id) ? 'checked' : ''}>${title}</label>`).join('')}<button class="text-button" id="clear-checklist">新的一天，重新检查</button><p class="microcopy">仅是随手清单，不与游戏连接。不同角色的生存条件以角色提醒为准。</p></aside></div>`;
  document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; renderGuide(); });
  document.querySelectorAll('.checklist input').forEach(input => input.onchange = () => { const p = profile(); p.checklist = input.checked ? [...new Set([...p.checklist, input.value])] : p.checklist.filter(v => v !== input.value); save(); });
  $('#clear-checklist').onclick = () => { profile().checklist = []; save(); renderGuide(); };
  bindTips();
}
function renderJournal() {
  const p = profile();
  $('#main').innerHTML = `${hero('TRAVEL JOURNAL / 把足迹留在这里', '这是你的旅程。', '一个认得的路口，一处安心的避雨处。记下自己的发现，不必记住攻略。')}<div class="journal-layout"><section class="panel journal-editor"><div class="section-heading"><h2>${escape(campaign().name)}的随手记</h2><button class="text-button" id="journal-character">切换角色 ↗</button></div><label class="sr-only" for="notes">旅途笔记</label><textarea id="notes" maxlength="12000" placeholder="比如：下一个周期，沿着熟悉的管道去东边看看……">${escape(p.notes)}</textarea><div class="section-heading"><small class="muted">自动保存在此浏览器 · 最多 12,000 字</small><span id="note-count" class="small-text">${p.notes.length} / 12000</span></div></section><aside class="panel known-panel"><p class="eyebrow">PLACES YOU KNOW</p><h2>到过的地方</h2><div class="known-list">${p.known.map(id => `<div><span>${escape(fullName(id))}${id === p.current ? '<small>当前位置</small>' : ''}</span>${id !== campaign().start && id !== p.current ? `<button class="text-button" data-forget="${escape(id)}" aria-label="移除${escape(fullName(id))}的到访记录">移除</button>` : '<span class="muted">◉</span>'}</div>`).join('')}</div><button class="button subtle" id="journal-export">导出进度与笔记 ↓</button><p class="microcopy">换设备、清理浏览器前，记得导出。本站不会把笔记上传到服务器。</p></aside></div>`;
  $('#notes').oninput = event => { profile().notes = event.target.value; $('#note-count').textContent = `${event.target.value.length} / 12000`; save(); };
  $('#journal-character').onclick = chooseCharacter;
  $('#journal-export').onclick = exportProgress;
  document.querySelectorAll('[data-forget]').forEach(b => b.onclick = () => { profile().known = profile().known.filter(id => id !== b.dataset.forget); save(); renderJournal(); });
}
function exportProgress() {
  const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `rainward-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('已导出所有角色的本地进度。');
}
function settings() {
  dialog('关于雨间', `<p class="eyebrow">RAINWARD · 把发现留给你</p><p class="dialog-copy">一份非官方的雨世界新手向导。参考 Rain World Map 的区域组织与 Wiki 资料，原创中文分级提示与连接示意。无广告、无付费功能、无需账户。</p><div class="settings-section"><h3>你的数据，由你保管</h3><p class="microcopy">进度与笔记仅存此浏览器。核心向导首次加载后可离线使用，外部详细地图和 Wiki 需要网络。浏览器可能清除本地存储，建议定期备份。</p><div class="settings-actions"><button class="button subtle" id="export-progress">导出进度 ↓</button><label class="button subtle file-label">导入备份 ↑<input type="file" id="import-progress" accept=".json,application/json"></label></div><p id="import-status" role="status" class="microcopy"></p></div><div class="settings-section"><h3>资料与适用范围</h3><p class="microcopy">九位常规剧情角色均有独立路标；基础三位可在版本设置中选择原版或 Downpour；扩展与特殊条件以当前角色的“地图适用范围”为准。Watcher 使用进度路标，不推算固定传送路径。提示是建议，不是唯一正确的游玩顺序。</p><div class="sources-list">${SOURCES.map(source => `<div><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a><p>${escape(source.note)}</p></div>`).join('')}</div><p class="microcopy">外站可能剧透。本项目不重新分发游戏地图图片、音乐或游戏文件；详细地图由原站按需提供。Rain World 属于 Videocult 及相关权利人。资料核对日期：2026-10-12。</p></div><div class="settings-section"><h3>重置与清理</h3><div class="settings-actions"><button class="button subtle" id="reset-character">重置当前角色</button><button class="button danger" id="clear-all">清除本站所有本地数据</button></div><p class="microcopy">“清除所有”会移除进度、笔记、本站离线缓存与离线注册；导出的备份文件需自行删除。不会改动游戏存档。</p></div><p class="microcopy version-line">RAINWARD 1.0 · 原创代码 MIT · <a href="https://github.com/littlhMW/rainward" target="_blank" rel="noopener noreferrer">项目源码 ↗</a></p>`);
  $('#export-progress').onclick = exportProgress;
  $('#import-progress').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 500000) throw new Error('文件过大，请选择小于 500 KB 的进度备份。');
      const imported = normalizeState(JSON.parse(await file.text()), CAMPAIGNS, REGIONS);
      $('#dialog').close();
      confirmDialog('用备份替换本地进度？', '将替换本机所有角色的记录与笔记。建议先导出当前进度。导入后地图会恢复遮罩，未知地名会隐藏。', () => { state = imported; for (const p of Object.values(state.profiles)) p.hint = 0; state.prefs.mask = true; state.prefs.names = false; save(); render(); toast('进度已导入。'); }, '替换并导入');
    } catch (error) { $('#import-status').textContent = `导入失败：${error.message}`; }
  };
  $('#reset-character').onclick = () => { $('#dialog').close(); confirmDialog('重置当前角色？', `只清除${campaign().name}的探索、线索和笔记。其他角色保留。此操作可用此前导出的备份恢复。`, () => { state.profiles[campaign().id] = defaultProfile(campaign()); state.prefs.mask = true; state.prefs.names = false; save(); render(); toast('当前旅程已重置。'); }, '重置当前角色'); };
  $('#clear-all').onclick = () => { $('#dialog').close(); confirmDialog('清除雨间的本地数据？', '将清除所有角色进度、笔记和本站离线缓存。这不会删除游戏文件，也不会删除已导出的备份。当前页面保留可用；下次联网访问可重新缓存。', async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      if ('caches' in window) for (const key of await caches.keys()) if (key.startsWith('rainward-')) await caches.delete(key);
      if ('serviceWorker' in navigator) for (const registration of await navigator.serviceWorker.getRegistrations()) if (registration.active?.scriptURL === new URL('../sw.js', import.meta.url).href || registration.waiting?.scriptURL === new URL('../sw.js', import.meta.url).href) await registration.unregister();
      state = defaultState(); render(); toast('本地数据与本站离线缓存已清除。');
    } catch { toast('部分浏览器存储不可访问，请通过浏览器的站点设置完成清理。'); }
  }, '清除所有'); };
}
$('#settings-button').onclick = settings;
$('#sources-button').onclick = settings;
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
