import { normalizeProgress, normalizeRoomOverrides, suggestedStage } from './snapshot.js?v=2.3.0';
export const STORAGE_KEY = 'rainward.progress.v1';
export const VERSION = 1;
export function defaultProfile(campaign) {
  return { current: campaign.start, known: [campaign.start], completed: [], hint: 0, notes: '', checklist: [], gameProgress: null, roomOverrides: {} };
}
export function defaultState() {
  return { version: VERSION, campaign: 'survivor', profiles: {}, prefs: { mask: true, names: false, route: true, locateRoom: false, dlc: false, outerUnlocked: false } };
}
function allEdges(campaign) {
  const edges = campaign.edges.map(edge => edge.slice(0, 2));
  for (const [a, b] of campaign.directedEdges || []) {
    const index = edges.findIndex(([x, y]) => (a === x && b === y) || (a === y && b === x));
    if (index < 0) edges.push([a, b]); else edges[index] = [a, b];
  }
  return edges;
}
export function campaignNodes(campaign) {
  return [...new Set([campaign.start, ...(campaign.nodes || []), ...(campaign.regions || []), ...allEdges(campaign).flat(), ...campaign.stages.filter(s => s.kind !== 'optional').map(s => s.destination).filter(Boolean)])];
}
export function activeStage(campaign, profile) {
  return campaign.stages.find(stage => stage.kind !== 'optional' && !profile.completed.includes(stage.id)) || null;
}
export function recommendedStage(campaign, profile) {
  const index = campaign.stages.findIndex(stage => stage.id === suggestedStage(campaign.id, profile.gameProgress));
  return index < 0 ? activeStage(campaign, profile) : campaign.stages.slice(index).find(stage => stage.kind !== 'optional' && !profile.completed.includes(stage.id)) || null;
}
export function applyGameProgress(profile, progress) {
  const old = profile.gameProgress;
  const sameSave = old?.source === progress.source && progress.saveId && old.saveId === progress.saveId;
  if (!sameSave) {
    profile.roomOverrides = {};
    profile.completed = [];
    profile.hint = 0;
  }
  // A fresh snapshot replaces history; never merge different saves or guests.
  profile.gameProgress = progress;
  return !sameSave;
}
export function normalizeState(input, campaigns, regions) {
  if (!input || typeof input !== 'object' || input.version !== VERSION) throw new Error('目前仅支持版本 1 的雨间进度文件。');
  const state = defaultState();
  if (campaigns.some(c => c.id === input.campaign)) state.campaign = input.campaign;
  for (const key of Object.keys(state.prefs)) if (typeof input.prefs?.[key] === 'boolean') state.prefs[key] = input.prefs[key];
  for (const campaign of campaigns) {
    const value = input.profiles?.[campaign.id];
    if (!value || typeof value !== 'object') continue;
    const nodes = [...new Set([...campaignNodes(campaign), ...(campaign.dlcEdges || []).flat(), ...campaign.stages.map(s => s.destination)])].filter(id => regions[id]);
    const profile = defaultProfile(campaign);
    profile.known = [...new Set([campaign.start, ...(Array.isArray(value.known) ? value.known.filter(id => nodes.includes(id)) : [])])];
    if (profile.known.includes(value.current)) profile.current = value.current;
    profile.completed = Array.isArray(value.completed) ? [...new Set(value.completed.filter(id => campaign.stages.some(s => s.id === id)))] : [];
    profile.hint = Number.isInteger(value.hint) ? Math.max(0, Math.min(value.hint, 2)) : 0;
    profile.notes = typeof value.notes === 'string' ? value.notes.slice(0, 12000) : '';
    profile.checklist = Array.isArray(value.checklist) ? value.checklist.filter(v => ['food', 'shelter', 'rain', 'hands'].includes(v)) : [];
    profile.gameProgress = normalizeProgress(value.gameProgress);
    profile.roomOverrides = normalizeRoomOverrides(value.roomOverrides);
    state.profiles[campaign.id] = profile;
  }
  return state;
}
export function regionName(campaign, regions, id) {
  return campaign.regionNames?.[id] || regions[id]?.name || id;
}
export function visibleName(campaign, profile, regions, id, showNames = false) {
  if (showNames || profile.known.includes(id)) return regionName(campaign, regions, id);
  return `未知区域 ${String(campaignNodes(campaign).indexOf(id) + 1).padStart(2, '0')}`;
}
export function availableEdges(campaign) {
  return allEdges(campaign).filter(([a, b]) => !campaign.blockedEdges?.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));
}
export function adjacentRegions(campaign, id) {
  return [...new Set(availableEdges(campaign).flatMap(([a, b]) => a === id ? [b] : b === id && !campaign.directedEdges?.some(([x, y]) => x === a && y === b) ? [a] : []))];
}
export function findPath(campaign, start, end) {
  if (!start || !end || campaign.routeMode === 'waypoints') return [];
  const nodes = campaignNodes(campaign);
  if (!nodes.includes(start) || !nodes.includes(end)) return [];
  const graph = new Map();
  const add = (a, b) => graph.set(a, [...(graph.get(a) || []), b]);
  for (const [a, b] of availableEdges(campaign)) {
    add(a, b);
    if (!campaign.directedEdges?.some(([x, y]) => x === a && y === b)) add(b, a);
  }
  const queue = [[start]], seen = new Set([start]);
  while (queue.length) {
    const path = queue.shift(), last = path.at(-1);
    if (last === end) return path;
    for (const neighbor of graph.get(last) || []) if (!seen.has(neighbor)) { seen.add(neighbor); queue.push([...path, neighbor]); }
  }
  return [];
}
export function exactRegionMatches(campaign, regions, query) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];
  return campaignNodes(campaign).filter(id => [id, regionName(campaign, regions, id), regions[id]?.english, ...(regions[id]?.aliases || [])].filter(Boolean).some(name => name.toLocaleLowerCase() === term));
}
