import { CAMPAIGNS, REGIONS, SURVIVAL_TIPS } from './data.js?v=2';
import { STORAGE_KEY, defaultState, defaultProfile, normalizeState, activeStage, regionName, findPath } from './engine.js';
import { REGION_SPOILERS, SPOILER_POLICY } from './spoilers.js';
import { MAP_CHARACTERS, parseLocation, locationFragment } from './location.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog = await fetch('./upstream/slugcats.json').then(r => r.json());
let state = defaultState(), chosenStage = null, selectedRoom = '', received = null, storageOK = true, mapReady = false, locationError = '';
let layers = { rooms: false, spawns: false };
try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = normalizeState(JSON.parse(raw), CAMPAIGNS, REGIONS); } catch { storageOK = false; }
state.prefs.mask = true;
// A hint level belongs to the selected clue, which is intentionally not restored.
for (const p of Object.values(state.profiles)) p.hint = 0;
const baseCampaign = () => CAMPAIGNS.find(c => c.id === state.campaign) || CAMPAIGNS[0];
const profile = () => state.profiles[baseCampaign().id] ||= defaultProfile(baseCampaign());
function campaign() {
  const base = baseCampaign(), p = profile();
  const c = { ...base, edges: [...(state.prefs.dlc && base.dlcEdges ? base.dlcEdges : base.edges)], directedEdges: [...(base.directedEdges || [])], blockedEdges: [] };
  for (const edge of c.conditionalEdges || []) if (!p.completed.includes(edge.requires)) c.blockedEdges.push([edge.from, edge.to]);
  if (c.id === 'saint' && !p.completed.includes('saint-seven')) c.blockedEdges.push(['SB','HR']);
  if (state.prefs.dlc && state.prefs.outerUnlocked && ['survivor','monk'].includes(c.id)) { c.edges.push(['SB','OE']); c.directedEdges.push(['OE','SU']); }
  return c;
}
const stage = () => baseCampaign().stages.find(s => s.id === chosenStage) || activeStage(baseCampaign(), profile());
const names = id => REGION_SPOILERS[id] && !state.prefs.names ? `剧透区域 (${id})` : `${regionName(baseCampaign(), REGIONS, id)} (${id})`;
const regionIds = () => Object.keys(catalog[MAP_CHARACTERS[state.campaign]]?.regions || {});
const route = () => stage() && state.prefs.route ? findPath(campaign(), profile().current, stage().destination) : [];
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageOK = true; } catch { storageOK = false; }
  $('#save-status').textContent = storageOK ? '线索进度仅保存在本机' : '保存失败，请导出备份';
}
function toast(text) { $('#toast').textContent = text; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').textContent = '', 3500); }
function dialog(title, body, actions = '') {
  $('#dialog-content').innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${esc(title)}</h2><button id="close-dialog" aria-label="关闭">×</button></div>${body}${actions ? `<div class="dialog-actions">${actions}</div>` : ''}`;
  if (!$('#dialog').open) $('#dialog').showModal();
  $('#close-dialog').onclick = () => $('#dialog').close();
}
function confirm(title, body, action, label = '确认') {
  dialog(title, `<p class="dialog-copy">${esc(body)}</p>`, `<button id="cancel-action">取消</button><button id="confirm-action">${esc(label)}</button>`);
  $('#cancel-action').onclick = () => $('#dialog').close();
  $('#confirm-action').onclick = () => { $('#dialog').close(); action(); };
}
function updateControls() {
  $('#character-select').innerHTML = CAMPAIGNS.map(c => `<option value="${c.id}" ${c.id === state.campaign ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const ids = regionIds();
  if (!ids.includes(profile().current)) profile().current = baseCampaign().start;
  $('#region-select').innerHTML = ids.map(id => `<option value="${id}" ${id === profile().current ? 'selected' : ''}>${esc(names(id))}</option>`).join('');
  for (const [id,key] of [['mask-toggle','mask'],['names-toggle','names'],['route-toggle','route']]) $('#'+id).checked = state.prefs[key];
  $('#spawns-toggle').disabled = state.prefs.mask;
  $('#spawns-toggle').checked = layers.spawns && !state.prefs.mask;
  $('#rooms-toggle').checked = layers.rooms;
}
function chooseRegion(id, room = '') {
  if (!regionIds().includes(id)) return;
  profile().current = id; if (!profile().known.includes(id)) profile().known.push(id);
  selectedRoom = room; save(); updateControls(); renderStory(); loadMap();
}
function loadMap() {
  const c = baseCampaign(); mapReady = false;
  $('#map-status').textContent = '正在读取原地图…';
  const q = new URLSearchParams({ slugcat: MAP_CHARACTERS[c.id], region: profile().current, mask: state.prefs.mask ? '1' : '0', roomnames: layers.rooms ? '1' : '0' });
  const point = received?.campaign === c.id && received.region === profile().current ? received : null;
  let hash = '';
  if (selectedRoom || point?.room) hash = locationFragment({ ...(point && (!selectedRoom || selectedRoom === point.room) ? point : {}), character: c.english, region: profile().current, room: selectedRoom || point.room });
  $('#map-frame').src = `./upstream/map.html?${q}${hash}`;
  updatePosition();
}
function updatePosition() {
  $('#location-warning').textContent = locationError;
  const here = received?.campaign === state.campaign && received.region === profile().current;
  $('#player-location').hidden = !received?.campaign;
  $('#position-text').textContent = here ? `游戏位置：${names(received.region)} / ${received.room}${received.x !== undefined && received.y !== undefined ? ` · 格坐标 ${received.x}, ${received.y}` : ''}${received.mode === 'meadow' ? ' · 雨甸自由模式，无固定故事进度' : ''}` : selectedRoom ? `查询房间：${selectedRoom}` : `${names(profile().current)} · 点击房间可选中；滚轮缩放、拖动平移。`;
}
function sendMap(action = 'settings') {
  if (!mapReady) return;
  $('#map-frame').contentWindow.postMessage({ type: 'where-to-map', action, mask: state.prefs.mask, rooms: layers.rooms, spawns: layers.spawns && !state.prefs.mask, nextRegion: route()[1] || null, route: state.prefs.route, room: selectedRoom || (received?.campaign === state.campaign && received.region === profile().current ? received.room : null), player: received?.campaign === state.campaign && received.region === profile().current ? received : null }, location.origin);
}
function renderStory() {
  const focus = document.activeElement?.id, c = baseCampaign(), p = profile(), s = stage(), path = route();
  $('#story').innerHTML = `<p class="story-kicker">故事线索</p><h2>${esc(s?.title || '按自己的节奏继续探索')}</h2><div class="hint-copy" aria-live="polite">${esc(s ? s.hints[p.hint] : '这份向导的主要线索已完成。可以回看已完成的线索，或选择可选探索。')}</div>
    ${s ? `<p class="hint-level">提示 ${p.hint + 1} / 3 · ${['轻提示','更明确的方向','目的地提示'][p.hint]}</p><button id="more-hint" class="full-button" ${p.hint === 2 ? 'disabled' : ''}>${p.hint === 0 ? '再明确一点 →' : p.hint === 1 ? '查看目的地提示 →' : '已展开目的地提示'}</button>${p.hint ? '<button id="less-hint" class="text-button">收起提示</button>' : ''}` : ''}
    <div class="section"><h3>线索方向</h3><div class="route">${path.length ? path.map((id,i) => `${i ? '<span>→</span>' : ''}<button data-region="${id}" class="${i === 0 ? 'here' : ''}">${esc(names(id))}</button>`).join('') : `<span class="muted">${c.routeMode === 'waypoints' ? '传送路径由当前存档决定，按上方路标探索。' : !state.prefs.route ? '线索路线已关闭。' : '在当前区域继续探索，或参考上方提示。'}</span>`}</div><p class="note" id="room-route-status">${path.length > 1 ? '地图会标出通向下一地区的门。选中起点房间后，可显示已核实的房间连接参考。' : '连接参考，门槛、方向和能力仍以游戏为准。'}</p></div>
    <div class="section"><h3>房间定位</h3><form id="room-form" class="room-form"><input id="room-query" aria-label="房间代码" placeholder="例如 SU_C04" maxlength="96" value="${esc(selectedRoom)}"><button type="submit">定位</button></form><button class="text-button" id="copy-link">复制当前查询链接</button></div>
    ${s && c.stages.some(v => v.before === s.id) ? '<p class="branch-warning">这里有先后顺序会影响选择的分支。<button id="branch-info" class="text-button">查看提醒 →</button></p>' : ''}
    ${s ? '<button class="full-button complete" id="complete-stage">✓ 我已完成这条线索</button>' : ''}<button class="text-button" id="stages-button">回看、切换线索 / 可选探索</button>
    <details class="section"><summary>角色提醒与版本设置</summary><p class="note">${esc(c.warning)}</p>${c.dlcEdges ? `<label class="note"><input id="dlc-setting" type="checkbox" ${state.prefs.dlc ? 'checked' : ''}> 我启用了 Downpour</label><br><label class="note"><input id="outer-setting" type="checkbox" ${state.prefs.outerUnlocked ? 'checked' : ''}> 同存档槽已通关饕餮</label><p class="note">这些设置只影响路线建议。真实地图沿用上游角色数据，部分扩展地形需要 DLC。</p>` : ''}</details>`;
  if ($('#more-hint')) $('#more-hint').onclick = () => p.hint === 1 ? confirm('展开目的地提示？', '会给出具体区域和行动条件，可能包含 Wiki 标记的剧透地名。', () => { p.hint = 2; save(); renderStory(); }, '展开提示') : (p.hint = 1, save(), renderStory());
  if ($('#less-hint')) $('#less-hint').onclick = () => { p.hint = 0; save(); renderStory(); };
  if ($('#complete-stage')) $('#complete-stage').onclick = () => confirm('记录线索完成', s.completion, () => { p.completed = [...new Set([...p.completed,s.id])]; chosenStage = null; p.hint = 0; save(); renderStory(); sendMap(); }, '确认完成');
  $('#stages-button').onclick = showStages;
  document.querySelectorAll('[data-region]').forEach(b => b.onclick = () => chooseRegion(b.dataset.region));
  $('#room-form').onsubmit = event => { event.preventDefault(); const room = $('#room-query').value.trim().toUpperCase(); if (!/^[A-Z0-9_+.-]{1,96}$/.test(room)) return toast('请输入完整房间代码，例如 SU_C04。'); selectedRoom = room; sendMap('focus'); updatePosition(); };
  $('#copy-link').onclick = async () => {
    if (!selectedRoom && !(received?.campaign === c.id && received.region === p.current)) return toast('先选中或输入一个房间，再复制链接。');
    const value = { ...(received?.campaign === c.id && received.region === p.current && (!selectedRoom || selectedRoom === received.room) ? received : {}), character: c.english, region: p.current, room: selectedRoom || received.room };
    const url = location.href.split('#')[0] + locationFragment(value);
    try { await navigator.clipboard.writeText(url); toast('已复制位置链接。'); } catch { dialog('位置链接', `<p class="dialog-copy">${esc(url)}</p>`); }
  };
  if ($('#branch-info')) $('#branch-info').onclick = () => { const extra = c.stages.find(v => v.before === s.id); dialog('分支提醒', `<p class="dialog-copy">${esc(extra.hints[0])}</p><details><summary>展开更明确的条件</summary><p class="dialog-copy">${esc(extra.hints[2])}</p></details>`); };
  for (const [id,key] of [['dlc-setting','dlc'],['outer-setting','outerUnlocked']]) if ($('#'+id)) $('#'+id).onchange = event => { state.prefs[key] = event.target.checked; save(); renderStory(); sendMap(); };
  if (focus && document.getElementById(focus) && !document.getElementById(focus).disabled) document.getElementById(focus).focus({preventScroll:true});
  else if (focus === 'more-hint' || focus === 'complete-stage') $('#story').focus({preventScroll:true});
}
function showStages() {
  const c = baseCampaign(), p = profile();
  dialog('选择线索', `<p class="note">可直接选择适合当前进度的线索，不会把之前的目标自动记为完成。选中后只显示轻提示。</p><div class="stage-list">${c.stages.map(s => `<button data-stage="${s.id}">${p.completed.includes(s.id) ? '✓ ' : ''}${esc(s.title)}<small>${s.kind === 'optional' ? '可选' : ''}</small></button>`).join('')}</div><div class="section"><button id="reset-role">重置当前角色进度</button></div>`);
  document.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => { chosenStage = b.dataset.stage; p.hint = 0; $('#dialog').close(); save(); renderStory(); sendMap(); });
  $('#reset-role').onclick = () => confirm('重置当前角色？','将重置线索与探索记录。其他角色不受影响，旧笔记保留。', () => { const notes=p.notes; state.profiles[c.id]=defaultProfile(c); profile().notes=notes; chosenStage=null; selectedRoom=''; save(); updateControls(); renderStory(); loadMap(); });
}
function receiveLocation() {
  let value; received = null; locationError = '';
  try { value = parseLocation(location.hash); } catch (e) { locationError = e.message + ' 未定位，请手动选择地图。'; return false; }
  if (!value) return false;
  if (!value.campaign) { locationError = '这个角色尚未收录，未定位。当前显示手动参考地图。'; return false; }
  if (!Object.hasOwn(catalog[MAP_CHARACTERS[value.campaign]]?.regions || {}, value.region)) { locationError = `原图未收录区域 ${value.region}，未定位。当前显示手动参考地图。`; return false; }
  received = value;
  if (state.campaign !== value.campaign) { state.prefs.mask = true; state.prefs.names = false; }
  state.campaign = value.campaign; chosenStage = null; selectedRoom = '';
  profile().current = value.region; selectedRoom = value.room;
  if (!profile().known.includes(value.region)) profile().known.push(value.region);
  if (value.dlc) state.prefs.dlc = true;
  chosenStage = baseCampaign().stages.find(s => s.destination === value.region && s.kind !== 'optional' && !profile().completed.includes(s.id))?.id || null;
  profile().hint = 0; save(); return true;
}
window.addEventListener('hashchange', () => { receiveLocation(); updateControls(); renderStory(); loadMap(); });
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== $('#map-frame').contentWindow || event.data?.type !== 'where-to-parent') return;
  const message = event.data;
  if (message.event === 'ready') { mapReady = true; $('#map-status').textContent = ''; sendMap(); }
  if (message.event === 'error') $('#map-status').textContent = `${message.message} 可切换区域或重新加载。`;
  if (message.event === 'room') { $('#map-status').textContent = ''; selectedRoom = message.room; if ($('#room-query')) $('#room-query').value = selectedRoom; updatePosition(); }
  if (message.event === 'route' && $('#room-route-status')) $('#room-route-status').textContent = message.message;
});
$('#character-select').onchange = e => { state.campaign=e.target.value; chosenStage=null; selectedRoom=''; profile().hint=0; state.prefs.mask=true; state.prefs.names=false; save(); updateControls(); renderStory(); loadMap(); };
$('#region-select').onchange = e => chooseRegion(e.target.value);
$('#mask-toggle').onchange = e => { state.prefs.mask=e.target.checked; save(); updateControls(); sendMap(); };
$('#names-toggle').onchange = e => { state.prefs.names=e.target.checked; save(); updateControls(); renderStory(); updatePosition(); };
$('#route-toggle').onchange = e => { state.prefs.route=e.target.checked; save(); renderStory(); sendMap(); };
$('#rooms-toggle').onchange = e => { layers.rooms=e.target.checked; sendMap(); };
$('#spawns-toggle').onchange = e => { layers.spawns=e.target.checked; sendMap(); };
$('#world-view').onclick = () => sendMap('overview');
$('.skip-link').onclick = event => { event.preventDefault(); $('#story').focus(); };
$('#story-toggle').onclick = () => { const hide=document.body.classList.toggle('hide-story'); $('#story-toggle').textContent=hide?'« 故事线索':'收起线索 »'; $('#story-toggle').setAttribute('aria-expanded',String(!hide)); sendMap('resize'); };
$('#player-location').onclick = () => { if (!received?.campaign) return; state.campaign=received.campaign; chooseRegion(received.region, received.room); };
$('#help-button').onclick = () => {
  dialog('生存帮助', `<div class="help-list">${SURVIVAL_TIPS.map(t => `<button data-tip="${t.id}">${esc(t.title)}<small>${esc(t.summary)}</small></button>`).join('')}</div>`);
  document.querySelectorAll('[data-tip]').forEach(b => b.onclick = () => { const t=SURVIVAL_TIPS.find(t=>t.id===b.dataset.tip); dialog(t.title, `<p class="dialog-copy">${esc(t.body)}</p><a href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">Wiki 来源（外站可能剧透）</a>`); });
};
function exportProgress() {
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='where-should-i-go-progress.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('#about-button').onclick = () => {
  dialog('我该去哪儿', `<p class="dialog-copy">直接基于 Rain World Map 前端修改，使用原地图的房间、连接、地形与瓦片。遮罩默认只显示真实连接和房间节点；关掉遮罩即可看地形。</p><p class="note">${esc(SPOILER_POLICY.rule)} <a href="${SPOILER_POLICY.source}" target="_blank" rel="noopener noreferrer">Wiki 分组依据 ↗</a><br>图片内容、房间代码和已主动展开的剧情提示不在地名开关的范围内。</p><div class="section"><h3>游戏内定位</h3><p class="dialog-copy">下载并解压 Mod，将 whereshouldigo 文件夹放到 Rain World/RainWorld_Data/StreamingAssets/mods/，在 Remix 启用。默认按住 G 0.6 秒打开浏览器；Remix 的“我该去哪儿”设置中可改键和时长。位置随链接传入，不自动改剪贴板、不需要账户或后台服务器。</p><p class="note">雨甸使用本地玩家，不拿房主的位置；自由模式没有固定故事任务。Mod 已编译并核对接口，尚未实机单人/联机验证。</p><a href="./downloads/WhereShouldIGo.zip" download>下载 Mod 安装包</a> · <a href="https://github.com/littlhMW/rainward/tree/codex/rainward/rain-guide/mod" target="_blank" rel="noopener noreferrer">源码、安装与卸载说明</a></div><div class="section"><h3>本地数据</h3><div class="data-actions"><button id="export-progress">导出进度</button><label class="file-label">导入备份<input type="file" id="import-progress" accept="application/json,.json"></label><button id="clear-data">清除本站数据</button></div><p id="import-status" role="status" class="note"></p><details><summary>保留的旅途笔记</summary><textarea class="old-notes" id="old-notes" maxlength="12000" aria-label="当前角色笔记">${esc(profile().notes)}</textarea></details></div><div class="section"><p class="note">原创改动 MIT；上游 CC0；Leaflet BSD-2-Clause。游戏美术属于相应权利人。地图按需从原作者服务器读取，需联网。<a href="./upstream/UPSTREAM.md" target="_blank">来源、许可证与下载用途</a>。本次没有安装系统服务或新运行依赖，删除 Mod 文件夹即可卸载，配置与网页数据可单独清理。</p></div>`);
  $('#export-progress').onclick=exportProgress;
  $('#old-notes').oninput=e=>{profile().notes=e.target.value;save();};
  $('#import-progress').onchange=async e=>{const file=e.target.files[0]; if(!file)return;try{if(file.size>500000)throw new Error('文件大于 500 KB');const next=normalizeState(JSON.parse(await file.text()),CAMPAIGNS,REGIONS);confirm('替换本地进度？','这会替换所有角色记录，建议先导出备份。',()=>{state=next;for(const p of Object.values(state.profiles))p.hint=0;state.prefs.mask=true;state.prefs.names=false;chosenStage=null;selectedRoom='';save();updateControls();renderStory();loadMap();});}catch(err){$('#import-status').textContent='导入失败：'+err.message;}};
  $('#clear-data').onclick=()=>confirm('清除本站数据？','会清除所有角色记录、笔记与旧版离线缓存，不改动游戏存档。',async()=>{try{localStorage.removeItem(STORAGE_KEY);for(const key of await caches.keys())if(key.startsWith('rainward-'))await caches.delete(key);state=defaultState();chosenStage=null;selectedRoom='';received=null;history.replaceState(null,'',location.href.split('#')[0]);updateControls();renderStory();loadMap();toast('已清理本站本地数据。');}catch{toast('浏览器阻止清理，请在站点设置中移除数据。');}});
};
receiveLocation(); updateControls(); renderStory(); loadMap();
if(!storageOK)$('#save-status').textContent='本地存储不可用，请导出备份';
// Retire the old cache directly. Registering a retirement worker on every visit
// can revive an already unregistered worker without running activate again.
(async () => {
  if ('serviceWorker' in navigator) {
    const scope = new URL('./', location.href).href;
    for (const registration of await navigator.serviceWorker.getRegistrations())
      if (registration.scope === scope) await registration.unregister();
  }
  if ('caches' in window) for (const key of await caches.keys())
    if (key.startsWith('rainward-')) await caches.delete(key);
})().catch(()=>{});
