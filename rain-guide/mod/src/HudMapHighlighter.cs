using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;

namespace WhereShouldIGo
{
    // Draws over the game's own HUD map connection sprites. It never changes
    // terrain, entrances, exits, map textures, or room data.
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
        private static readonly Color Highlight = new Color(1f, 0.82f, 0.08f, 1f);
        private static HUD.Map activeMap;
        private static string activeSignature;
        private static HashSet<string> activePairs = new HashSet<string>(StringComparer.Ordinal);

        internal static void Draw(On.HUD.Map.orig_Draw orig, HUD.Map map, float timeStacker, bool enabled)
        {
            orig(map, timeStacker);
            try
            {
                // The overlay is active only while Rain World is showing its
                // map. The vanilla Draw call above restores base colours.
                if (!enabled || map?.hud?.owner == null || !map.hud.owner.RevealMap) { Clear(); return; }
                if (!ReferenceEquals(activeMap, map)) { Clear(); activeMap = map; activeSignature = null; }
                var signature = Signature(map);
                if (!String.Equals(signature, activeSignature, StringComparison.Ordinal))
                {
                    activePairs = BuildRoutePairs(map);
                    activeSignature = signature;
                }
                ApplyColors(map);
            }
            catch { Clear(); }
        }

        private static string Signature(HUD.Map map)
        {
            var owner = map?.hud?.owner;
            var room = owner?.MapOwnerRoom ?? -1;
            var rainWorld = map?.hud?.rainWorld;
            var game = rainWorld?.processManager?.currentMainLoop as RainWorldGame;
            var character = game?.StoryCharacter?.value ?? "";
            var region = map?.RegionName ?? "";
            return room + "|" + character + "|" + region;
        }

        private static HashSet<string> BuildRoutePairs(HUD.Map map)
        {
            var result = new HashSet<string>(StringComparer.Ordinal);
            var owner = map?.hud?.owner;
            var data = MapDataField?.GetValue(map);
            var connections = ConnectionsField?.GetValue(map) as IEnumerable;
            if (owner == null || data == null || connections == null) return result;

            var edges = new List<Edge>();
            foreach (var connection in connections)
            {
                var a = ReadIndex(RoomAField?.GetValue(connection));
                var b = ReadIndex(RoomBField?.GetValue(connection));
                if (a >= 0 && b >= 0) edges.Add(new Edge(a, b));
            }
            if (edges.Count == 0) return result;

            var target = TargetRegion(map);
            if (String.IsNullOrEmpty(target)) return result;
            var goals = GateRooms(map, data, target);
            var route = FindRoute(edges, owner.MapOwnerRoom, goals);
            foreach (var edge in route)
            {
                result.Add(Pair(edge.A, edge.B));
                result.Add(Pair(edge.B, edge.A));
            }
            return result;
        }

        private static HashSet<int> GateRooms(HUD.Map map, object data, string targetRegion)
        {
            var matching = new HashSet<int>();
            var gateData = GateDataField?.GetValue(data) as IEnumerable;
            if (gateData == null) return matching;
            var currentRegion = map?.RegionName ?? "";
            var nextRegion = NextRegion(currentRegion, targetRegion);
            foreach (var gate in gateData)
            {
                if (!(GateRoomField?.GetValue(gate) is int room)) continue;
                string name = null;
                try { name = map.mapData?.NameOfRoom(room); } catch { }
                if (!String.IsNullOrEmpty(nextRegion) && GateLeadsTo(name, currentRegion, nextRegion)) matching.Add(room);
            }
            // If the destination cannot be matched to a gate in this map,
            // leave the vanilla map unchanged instead of guessing an exit.
            return matching;
        }

        private static bool GateLeadsTo(string name, string currentRegion, string targetRegion)
        {
            if (String.IsNullOrEmpty(name) || !name.StartsWith("GATE_", StringComparison.OrdinalIgnoreCase)) return false;
            var parts = name.Split('_');
            if (parts.Length < 3) return false;
            return String.Equals(parts[1], targetRegion, StringComparison.OrdinalIgnoreCase)
                || String.Equals(parts[2], targetRegion, StringComparison.OrdinalIgnoreCase)
                || (String.Equals(parts[1], currentRegion, StringComparison.OrdinalIgnoreCase)
                    && String.Equals(parts[2], targetRegion, StringComparison.OrdinalIgnoreCase));
        }

        private static List<Edge> FindRoute(List<Edge> edges, int start, HashSet<int> goals)
        {
            var result = new List<Edge>();
            if (goals.Count == 0 || start < 0) return result;
            var queue = new Queue<int>();
            var previousRoom = new Dictionary<int, int>();
            var previousEdge = new Dictionary<int, Edge>();
            queue.Enqueue(start); previousRoom[start] = start;
            var goal = -1;
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (goals.Contains(current)) { goal = current; break; }
                foreach (var edge in edges)
                {
                    var next = edge.A == current ? edge.B : edge.B == current ? edge.A : -1;
                    if (next < 0 || previousRoom.ContainsKey(next)) continue;
                    previousRoom[next] = current; previousEdge[next] = edge; queue.Enqueue(next);
                }
            }
            if (goal < 0) return result;
            while (goal != start) { result.Add(previousEdge[goal]); goal = previousRoom[goal]; }
            return result;
        }

        private static string TargetRegion(HUD.Map map)
        {
            var rainWorld = map?.hud?.rainWorld;
            var game = rainWorld?.processManager?.currentMainLoop as RainWorldGame;
            var character = game?.StoryCharacter?.value ?? "";
            var region = map?.RegionName ?? "";
            var route = Route(character);
            for (var i = 0; i < route.Length; i++)
                if (String.Equals(route[i], region, StringComparison.OrdinalIgnoreCase))
                    return i + 1 < route.Length ? NextRegion(region, route[i + 1]) : null;
            return null;
        }

        private static string NextRegion(string from, string destination)
        {
            if (String.IsNullOrEmpty(from) || String.IsNullOrEmpty(destination)
                || String.Equals(from, destination, StringComparison.OrdinalIgnoreCase)) return destination;
            var edges = new[]
            {
                "SU-HI", "SU-DS", "SU-LF", "HI-GW", "HI-CC", "HI-SH", "DS-GW", "DS-SB",
                "GW-SL", "SH-SL", "SH-UW", "CC-UW", "CC-SI", "SI-LF", "LF-SB", "SL-SB",
                "UW-SS", "DS-CC", "GW-SH", "HI-VS", "SI-VS", "SB-VS", "SL-VS", "SL-MS",
                "SB-OE", "OE-SU", "UW-LM", "UW-LC", "LM-DM", "UW-RM", "RM-MS", "SL-RM",
                "CC-CL", "SH-CL", "CL-SL", "UG-SB", "UG-DS", "SB-HR"
            };
            var graph = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var edge in edges)
            {
                var parts = edge.Split('-');
                if (!graph.ContainsKey(parts[0])) graph[parts[0]] = new List<string>();
                if (!graph.ContainsKey(parts[1])) graph[parts[1]] = new List<string>();
                graph[parts[0]].Add(parts[1]); graph[parts[1]].Add(parts[0]);
            }
            var queue = new Queue<List<string>>();
            queue.Enqueue(new List<string> { from });
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { from };
            while (queue.Count > 0)
            {
                var path = queue.Dequeue();
                var last = path[path.Count - 1];
                if (!graph.ContainsKey(last)) continue;
                foreach (var next in graph[last])
                {
                    if (!seen.Add(next)) continue;
                    var extended = new List<string>(path) { next };
                    if (String.Equals(next, destination, StringComparison.OrdinalIgnoreCase)) return extended[1];
                    queue.Enqueue(extended);
                }
            }
            return destination;
        }

        private static string[] Route(string character)
        {
            switch ((character ?? "").ToLowerInvariant())
            {
                case "white": case "yellow": return new[] { "SU", "HI", "GW", "SL", "SH", "UW", "SS", "SB" };
                case "red": return new[] { "LF", "SI", "CC", "UW", "SS", "SL", "SB" };
                case "gourmand": return new[] { "SH", "UW", "SS", "SB", "OE" };
                case "artificer": return new[] { "GW", "HI", "CC", "UW", "LC", "SB" };
                case "rivulet": return new[] { "DS", "GW", "SL", "RM", "MS", "SL" };
                case "spear": case "spearmaster": return new[] { "SU", "HI", "CC", "UW", "LM", "DM", "SI" };
                case "saint": return new[] { "SI", "CC", "CL", "SL", "UG", "LF", "SB", "HR" };
                default: return Array.Empty<string>();
            }
        }

        private static void ApplyColors(HUD.Map map)
        {
            var list = ConnectionsField?.GetValue(map) as IEnumerable;
            var data = MapDataField?.GetValue(map);
            if (list == null) return;
            foreach (var connection in list)
            {
                var a = ReadIndex(RoomAField?.GetValue(connection));
                var b = ReadIndex(RoomBField?.GetValue(connection));
                var highlight = activePairs.Contains(Pair(a, b));
                SetSprite(LineField?.GetValue(connection) as FSprite, highlight);
                SetSprite(DotAField?.GetValue(connection) as FSprite, highlight);
                SetSprite(DotBField?.GetValue(connection) as FSprite, highlight);
            }
        }

        private static int ReadIndex(object raw)
        {
            return raw is int value ? value : -1;
        }

        private static void SetSprite(FSprite sprite, bool highlight)
        {
            // The vanilla Draw call has already applied the current fade and
            // map-layer colour. Preserve that state for non-route connections
            // and only replace RGB on the selected route.
            if (sprite == null || !highlight) return;
            sprite.color = new Color(Highlight.r, Highlight.g, Highlight.b, sprite.color.a);
        }

        private static string Pair(int a, int b) => a + ":" + b;

        private static void Clear()
        {
            activeMap = null;
            activeSignature = null;
            activePairs.Clear();
        }

        private sealed class Edge
        {
            internal readonly int A;
            internal readonly int B;

            internal Edge(int a, int b)
            {
                A = a;
                B = b;
            }
        }
    }
}
