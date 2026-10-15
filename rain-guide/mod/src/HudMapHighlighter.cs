using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;

namespace Rainward
{
    internal static class HudMapHighlighter
    {
        private static readonly BindingFlags Instance = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
        private static readonly FieldInfo ConnectionsField = typeof(HUD.Map).GetField("mapConnections", Instance);
        private static readonly FieldInfo MapDataField = typeof(HUD.Map).GetField("mapData", Instance);
        private static readonly FieldInfo GateDataField = typeof(HUD.Map.MapData).GetField("gateData", Instance);
        private static readonly FieldInfo GateRoomField = Type.GetType("HUD.Map+MapData+GateData, Assembly-CSharp")?.GetField("roomIndex", Instance);
        private static readonly FieldInfo RoomAField = Type.GetType("HUD.Map+OnMapConnection, Assembly-CSharp")?.GetField("roomA", Instance);
        private static readonly FieldInfo RoomBField = Type.GetType("HUD.Map+OnMapConnection, Assembly-CSharp")?.GetField("roomB", Instance);
        private static readonly FieldInfo LineField = Type.GetType("HUD.Map+OnMapConnection, Assembly-CSharp")?.GetField("lineSprite", Instance);
        private static readonly FieldInfo DotAField = Type.GetType("HUD.Map+OnMapConnection, Assembly-CSharp")?.GetField("dotA", Instance);
        private static readonly FieldInfo DotBField = Type.GetType("HUD.Map+OnMapConnection, Assembly-CSharp")?.GetField("dotB", Instance);
        private static readonly FieldInfo RegionField = typeof(World).GetField("region", Instance);
        private static readonly FieldInfo SettingsTriggersField = typeof(RoomSettings).GetField("triggers", Instance);
        private static readonly FieldInfo TriggerEventField = typeof(EventTrigger).GetField("tEvent", Instance);
        private static readonly FieldInfo TriggerSlugcatsField = typeof(EventTrigger).GetField("slugcats", Instance);
        private static readonly FieldInfo TriggerTimelinesField = typeof(EventTrigger).GetField("timelines", Instance);
        private static readonly FieldInfo TriggerFromCycleField = typeof(EventTrigger).GetField("activeFromCycle", Instance);
        private static readonly FieldInfo TriggerToCycleField = typeof(EventTrigger).GetField("activeToCycle", Instance);
        private static readonly FieldInfo ShowDirectionOnlyField = typeof(ShowProjectedImageEvent).GetField("onlyWhenShowingDirection", Instance);
        private static readonly Color Highlight = new Color(1f, 0.82f, 0.08f, 1f);
        private static readonly Color InterestColor = new Color(0.92f, 0.9f, 0.82f, 1f);
        private static readonly Dictionary<HUD.Map, MapState> States = new Dictionary<HUD.Map, MapState>();
        private static readonly GuidanceProgress Progress = new GuidanceProgress();
        private static readonly MethodInfo RoomSettingsTemplateMethod = typeof(Region).GetMethod("GetRoomSettingsTemplate", Instance, null, new[] { typeof(string) }, null);

        internal static bool InitializeGuidance(RainWorldGame game, string sessionKey)
        {
            if (!IsStory(game)) return false;
            if (!Progress.Begin(sessionKey, CurrentGuidanceTarget(game))) return true;
            Reset();
            return true;
        }

        internal static string CurrentStoryGoal(RainWorldGame game)
        {
            var goal = CurrentCampaignGoal(game);
            return goal != null && String.Equals(goal.Region, CurrentRegion(game), StringComparison.OrdinalIgnoreCase)
                ? goal.Room : null;
        }

        internal static bool RefreshStoryGoal(RainWorldGame game)
        {
            return IsStory(game) && Progress.ObserveTarget(CurrentGuidanceTarget(game));
        }

        internal static string CurrentGuidanceTarget(RainWorldGame game)
        {
            var goal = CurrentCampaignGoal(game);
            if (goal != null) return goal.Stage + "|" + goal.Region + "|" + goal.Room;
            var region = CurrentRegion(game);
            var nextRegion = GuidanceRoutePlanner.CampaignTargetRegion(game?.StoryCharacter?.value, region);
            return String.IsNullOrWhiteSpace(nextRegion) ? null : "region|" + region + "|" + nextRegion;
        }

        private static CampaignGuidanceGoal CurrentCampaignGoal(RainWorldGame game)
        {
            if (!IsStory(game)) return null;
            try
            {
                var save = game.GetStorySession.saveState;
                var misc = save.miscWorldSaveData;
                var death = save.deathPersistentSaveData;
                var ghostVisits = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                if (death.ghostsTalkedTo != null)
                    foreach (var pair in death.ghostsTalkedTo)
                        if (pair.Key != null && !String.IsNullOrWhiteSpace(pair.Key.value))
                            ghostVisits[pair.Key.value] = pair.Value;
                return CampaignGuidanceGoals.Resolve(game.StoryCharacter?.value, save.cycleNumber,
                    save.denPosition, misc.EverMetMoon ? misc.SLOracleState.playerEncounters : 0,
                    misc.SSaiConversationsHad, death.theMark, misc.moonHeartRestored,
                    misc.pebblesEnergyTaken, misc.smPearlTagged, save.hasRobo,
                    death.redExtraCycles, death.karmaCap, ghostVisits);
            }
            catch { return null; }
        }

        private static string CurrentRegion(RainWorldGame game)
        {
            try { return (RegionField?.GetValue(game?.world) as Region)?.name; }
            catch { return null; }
        }

        internal static void SuccessfulSleep(RainWorldGame game, string previousGoal, bool? discoveredNewRoom)
        {
            if (!IsStory(game)) return;
            Progress.SuccessfulSleep(previousGoal, CurrentGuidanceTarget(game), discoveredNewRoom);
        }

        internal static bool GuidanceVisibilityChanged(bool onlyWhenBlocked, int threshold) => Progress.RecordGuidanceMode(onlyWhenBlocked, threshold);

        internal static void Draw(On.HUD.Map.orig_Draw orig, HUD.Map map, float timeStacker, MapOptions options)
        {
            MapState state = null;
            if (map != null && States.TryGetValue(map, out state))
            {
                try { state.InterestTint.Restore(); state.Tint.Restore(); }
                catch { States.Remove(map); state = null; }
            }

            orig(map, timeStacker);
            try
            {
                // Route and interest markers have independent switches. The
                // route builder returns an empty set when it is disabled, but
                // interest entrances remain available on the same HUD map.
                if (map?.hud?.owner == null || !map.hud.owner.RevealMap)
                {
                    ClearMap(map);
                    return;
                }

                if (state == null) States.Add(map, state = new MapState());
                var signature = Signature(map, options);
                if (!String.Equals(signature, state.Signature, StringComparison.Ordinal))
                {
                    state.Pairs = BuildRoutePairs(map, options);
                    BuildInterestDoorPairs(map, options, state);
                    state.Signature = signature;
                }
                ApplyColors(map, state, timeStacker);
            }
            catch
            {
                ClearMap(map);
            }
        }

        private static string Signature(HUD.Map map, MapOptions options)
        {
            var owner = map?.hud?.owner;
            var room = owner?.MapOwnerRoom ?? -1;
            var game = map?.hud?.rainWorld?.processManager?.currentMainLoop as RainWorldGame;
            var connections = ConnectionsField?.GetValue(map) as ICollection;
            var gameId = game == null ? 0 : game.GetHashCode();
            return gameId + "|" + room + "|" + map?.RegionName + "|" + (connections?.Count ?? -1) + "|" + (options?.EnableRouteHighlight.Value ?? false) + "|" + (options?.LocateSpecificRoom.Value ?? false) + "|" + (options?.GuideInterestPoints.Value ?? false) + "|" + (options?.GuideWhenBlocked.Value ?? false) + "|" + (options?.GuideAfterCycles.Value ?? GuidanceProgress.DefaultSleepsBeforeGuidance) + "|" + Progress.CurrentTarget + "|" + Progress.Revision + "|" + Progress.SleepsWithoutProgress;
        }

        private static HashSet<string> BuildRoutePairs(HUD.Map map, MapOptions options)
        {
            var result = new HashSet<string>(StringComparer.Ordinal);
            var owner = map?.hud?.owner;
            var data = MapDataField?.GetValue(map);
            var connections = ConnectionsField?.GetValue(map) as IEnumerable;
            if (owner == null || data == null || connections == null || options?.EnableRouteHighlight.Value != true) return result;

            var edges = new List<RouteEdge>();
            foreach (var connection in connections)
            {
                var a = ReadIndex(RoomAField?.GetValue(connection));
                var b = ReadIndex(RoomBField?.GetValue(connection));
                if (a >= 0 && b >= 0) edges.Add(new RouteEdge(a, b));
            }
            if (edges.Count == 0) return result;

            var game = map?.hud?.rainWorld?.processManager?.currentMainLoop as RainWorldGame;
            if (!IsStory(game)) return result;
            if (!Progress.ShouldShowRoute(options?.GuideWhenBlocked.Value ?? false,
                options?.GuideAfterCycles.Value ?? GuidanceProgress.DefaultSleepsBeforeGuidance)) return result;
            var startRoom = owner.MapOwnerRoom;
            var localRooms = MapRoomIndices(data);
            var route = new List<RouteEdge>();
            var goal = CurrentCampaignGoal(game);
            if (options?.LocateSpecificRoom.Value == true)
            {
                if (goal != null && !String.IsNullOrWhiteSpace(goal.Room)
                    && String.Equals(goal.Region, map.RegionName, StringComparison.OrdinalIgnoreCase))
                {
                    var targetRoom = RoomIndex(data, goal.Room);
                    if (targetRoom >= 0 && localRooms.Contains(targetRoom) && targetRoom != startRoom)
                        route = GuidanceRoutePlanner.FindPath(edges, startRoom, new HashSet<int> { targetRoom });
                }
            }
            // Story goals come from the campaign route and save-state milestones.
            // A specific room is used only when that goal lies in the active map;
            // otherwise guidance stops at the next region exit on its route.
            if (route.Count == 0 && (goal == null || !String.Equals(goal.Region, map.RegionName,
                StringComparison.OrdinalIgnoreCase) || String.IsNullOrWhiteSpace(goal.Room)
                || options?.LocateSpecificRoom.Value != true))
                route = BuildCampaignRegionalRoute(map, data, edges, startRoom, game, goal);

            foreach (var edge in route)
            {
                result.Add(Pair(edge.A, edge.B));
                result.Add(Pair(edge.B, edge.A));
            }
            return result;
        }

        private static List<RouteEdge> BuildCampaignRegionalRoute(HUD.Map map, object data,
            IList<RouteEdge> edges, int startRoom, RainWorldGame game, CampaignGuidanceGoal goal)
        {
            var result = new List<RouteEdge>();
            var currentRegion = map?.RegionName;
            var targetRegion = goal?.Region;
            var nextRegion = String.IsNullOrWhiteSpace(targetRegion)
                ? GuidanceRoutePlanner.CampaignTargetRegion(game?.StoryCharacter?.value, currentRegion)
                : GuidanceRoutePlanner.FirstRegionOnPath(currentRegion, targetRegion);
            if (String.IsNullOrWhiteSpace(nextRegion)) return result;
            if (String.Equals(currentRegion, targetRegion, StringComparison.OrdinalIgnoreCase)) return result;

            var gates = GateRooms(map, data, nextRegion);
            return GuidanceRoutePlanner.FindPath(edges, startRoom, gates);
        }

        private static HashSet<int> GateRooms(HUD.Map map, object data, string targetRegion)
        {
            var matching = new HashSet<int>();
            var gateData = GateDataField?.GetValue(data) as IEnumerable;
            if (gateData == null) return matching;
            var currentRegion = map?.RegionName ?? "";
            foreach (var gate in gateData)
            {
                if (!(GateRoomField?.GetValue(gate) is int room)) continue;
                string name = null;
                try { name = map.mapData?.NameOfRoom(room); } catch { }
                if (GateLeadsTo(name, currentRegion, targetRegion)) matching.Add(room);
            }
            return matching;
        }

        private static bool GateLeadsTo(string name, string currentRegion, string targetRegion)
        {
            if (String.IsNullOrEmpty(name) || !name.StartsWith("GATE_", StringComparison.OrdinalIgnoreCase)) return false;
            var parts = name.Split('_');
            return parts.Length >= 3
                && ((String.Equals(parts[1], currentRegion, StringComparison.OrdinalIgnoreCase)
                        && String.Equals(parts[2], targetRegion, StringComparison.OrdinalIgnoreCase))
                    || (String.Equals(parts[2], currentRegion, StringComparison.OrdinalIgnoreCase)
                        && String.Equals(parts[1], targetRegion, StringComparison.OrdinalIgnoreCase)));
        }

        private static void BuildInterestDoorPairs(HUD.Map map, MapOptions options, MapState state)
        {
            state.InterestDoors.Clear();
            state.InterestRoomIndices.Clear();
            if (options?.GuideInterestPoints.Value != true) return;
            var owner = map?.hud?.owner;
            var data = MapDataField?.GetValue(map);
            var connections = ConnectionsField?.GetValue(map) as IEnumerable;
            if (owner == null || data == null || connections == null) return;

            var edges = new List<RouteEdge>();
            var game = map?.hud?.rainWorld?.processManager?.currentMainLoop as RainWorldGame;
            var campaign = game?.StoryCharacter?.value;
            var cycle = game?.GetStorySession?.saveState?.cycleNumber ?? 0;
            var interestRooms = InterestRooms(data, TimelineName(game), campaign, cycle, game);
            state.InterestRoomIndices.UnionWith(interestRooms);
            foreach (var connection in connections)
            {
                var a = ReadIndex(RoomAField?.GetValue(connection));
                var b = ReadIndex(RoomBField?.GetValue(connection));
                if (a >= 0 && b >= 0) edges.Add(new RouteEdge(a, b));
            }
            var mainRoute = edges.FindAll(edge => state.Pairs.Contains(Pair(edge.A, edge.B)));
            foreach (var edgeKey in GuidanceRoutePlanner.FindInterestDoors(edges, mainRoute, owner.MapOwnerRoom, interestRooms))
                state.InterestDoors.Add(edgeKey);
        }

        private static HashSet<int> InterestRooms(object data, string timeline, string campaign, int cycle, RainWorldGame game)
        {
            var result = new HashSet<int>();
            try
            {
                var names = data.GetType().GetField("roomNames", Instance)?.GetValue(data) as string[];
                var indices = data.GetType().GetField("roomIndices", Instance)?.GetValue(data) as int[];
                if (names == null || indices == null) return result;
                var world = data.GetType().GetField("world", Instance)?.GetValue(data);
                var region = RegionField?.GetValue(world) as Region;
                if (region == null || RoomSettingsTemplateMethod == null) return result;
                for (var i = 0; i < Math.Min(names.Length, indices.Length); i++)
                {
                    if (game?.GetStorySession?.saveState?.miscWorldSaveData?.playerGuideState?.HasImageBeenShownInRoom(names[i]) == true) continue;
                    if (IsInterestDoor(region, names[i], timeline, campaign, cycle)) result.Add(indices[i]);
                }
            }
            catch { }
            return result;
        }

        private static HashSet<int> MapRoomIndices(object data)
        {
            var result = new HashSet<int>();
            try
            {
                var indices = data?.GetType().GetField("roomIndices", Instance)?.GetValue(data) as int[];
                if (indices != null)
                    foreach (var index in indices)
                        if (index >= 0) result.Add(index);
            }
            catch { }
            return result;
        }

        private static bool IsInterestDoor(Region region, string roomName, string timeline, string campaign, int cycle)
        {
            if (String.IsNullOrWhiteSpace(roomName)) return false;
            try
            {
                var roomSettings = RoomSettingsTemplateMethod.Invoke(region, new object[] { roomName });
                var triggers = SettingsTriggersField?.GetValue(roomSettings) as IEnumerable;
                if (triggers == null) return false;
                foreach (var trigger in triggers)
                {
                    var projected = TriggerEventField?.GetValue(trigger);
                    if (!(projected is ShowProjectedImageEvent)) continue;
                    if (ShowDirectionOnlyField == null || !(ShowDirectionOnlyField.GetValue(projected) is bool onlyWhenDirection) || !onlyWhenDirection) continue;
                    if (cycle < (TriggerFromCycleField?.GetValue(trigger) as int? ?? 0)) continue;
                    var toCycle = TriggerToCycleField?.GetValue(trigger) as int? ?? -1;
                    if (toCycle >= 0 && cycle > toCycle) continue;
                    if (!ListAllows(TriggerSlugcatsField?.GetValue(trigger), campaign)) continue;
                    if (!ListAllows(TriggerTimelinesField?.GetValue(trigger), timeline)) continue;
                    return true;
                }
            }
            catch { }
            return false;
        }

        private static bool ListAllows(object list, string value)
        {
            if (!(list is IEnumerable values)) return true;
            if (String.IsNullOrWhiteSpace(value)) return false;
            bool hasEntries = false;
            foreach (var item in values)
            {
                var name = item?.GetType().GetField("value", Instance)?.GetValue(item) as string
                    ?? item?.GetType().GetProperty("value", Instance)?.GetValue(item, null) as string
                    ?? item?.ToString();
                if (String.IsNullOrWhiteSpace(name)) continue;
                hasEntries = true;
                if (String.Equals(name, value, StringComparison.OrdinalIgnoreCase)) return true;
            }
            return !hasEntries;
        }

        private static string TimelineName(RainWorldGame game)
        {
            if (game == null) return null;
            try
            {
                var timeline = game.GetType().GetProperty("Timeline", Instance)?.GetValue(game, null);
                return timeline?.ToString();
            }
            catch { return null; }
        }

        private static bool IsStory(RainWorldGame game) => game != null && game.IsStorySession && game.GetStorySession?.saveState != null;

        private static int RoomIndex(object data, string name)
        {
            if (String.IsNullOrWhiteSpace(name)) return -1;
            try
            {
                // Match against the active map names and actual room indices.
                var namesField = data.GetType().GetField("roomNames", Instance);
                var indicesField = data.GetType().GetField("roomIndices", Instance);
                var names = namesField?.GetValue(data) as string[];
                var indices = indicesField?.GetValue(data) as int[];
                if (names == null || indices == null) return -1;
                for (var i = 0; i < Math.Min(names.Length, indices.Length); i++)
                    if (String.Equals(names[i], name, StringComparison.OrdinalIgnoreCase)) return indices[i];
            }
            catch { }
            return -1;
        }

        private static int ReadIndex(object raw) => raw is int value ? value : -1;
        private static string Pair(int a, int b) => a + ":" + b;

        private static void ApplyColors(HUD.Map map, MapState state, float timeStacker)
        {
            var list = ConnectionsField?.GetValue(map) as IEnumerable;
            if (list == null) return;
            map.hud.rainWorld.Shaders.TryGetValue("Basic", out var shader);
            var pulse = GuidanceAnimation.Pulse(UnityEngine.Time.unscaledTime);
            var alpha = Mathf.Lerp(0.72f, 1f, pulse);
            var mainColor = new Color(Highlight.r, Highlight.g, Highlight.b, alpha);
            foreach (var connection in list)
            {
                var a = ReadIndex(RoomAField?.GetValue(connection));
                var b = ReadIndex(RoomBField?.GetValue(connection));
                if (!state.Pairs.Contains(Pair(a, b))) continue;
                state.Tint.Apply(LineField?.GetValue(connection) as FSprite, shader, mainColor);
                state.Tint.Apply(DotAField?.GetValue(connection) as FSprite, shader, mainColor);
                state.Tint.Apply(DotBField?.GetValue(connection) as FSprite, shader, mainColor);
            }

            // Keep interest points as static entrance markers after route tinting.
            // They never alter the route line itself.
            foreach (var connection in list)
            {
                var a = ReadIndex(RoomAField?.GetValue(connection));
                var b = ReadIndex(RoomBField?.GetValue(connection));
                if (!state.InterestDoors.Contains(GuidanceRoutePlanner.EdgeKey(a, b))) continue;
                if (state.InterestRoomIndices.Contains(a))
                    state.InterestTint.Apply(DotAField?.GetValue(connection) as FSprite, shader, InterestColor);
                if (state.InterestRoomIndices.Contains(b))
                    state.InterestTint.Apply(DotBField?.GetValue(connection) as FSprite, shader, InterestColor);
            }
        }

        internal static void ClearMap(HUD.Map map)
        {
            if (map == null || !States.TryGetValue(map, out var state)) return;
            try { state.InterestTint.Restore(); state.Tint.Restore(); } catch { }
            States.Remove(map);
        }

        internal static void InvalidateMaps()
        {
            foreach (var state in States.Values)
            {
                state.Signature = null;
                state.Pairs.Clear();
                state.InterestDoors.Clear();
                state.InterestRoomIndices.Clear();
            }
        }

        internal static void Reset()
        {
            foreach (var state in States.Values)
                try { state.InterestTint.Restore(); state.Tint.Restore(); } catch { }
            States.Clear();
        }

        private sealed class MapState
        {
            internal readonly HudRouteTint Tint = new HudRouteTint();
            internal readonly HudRouteTint InterestTint = new HudRouteTint();
            internal string Signature;
            internal HashSet<string> Pairs = new HashSet<string>(StringComparer.Ordinal);
            internal HashSet<string> InterestDoors = new HashSet<string>(StringComparer.Ordinal);
            internal HashSet<int> InterestRoomIndices = new HashSet<int>();
        }
    }
}
