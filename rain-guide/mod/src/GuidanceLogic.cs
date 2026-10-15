using System;
using System.Collections.Generic;

namespace Rainward
{
    internal sealed class RouteEdge
    {
        internal readonly int A;
        internal readonly int B;

        internal RouteEdge(int a, int b)
        {
            A = a;
            B = b;
        }
    }

    internal sealed class GuidanceProgress
    {
        internal const int DefaultSleepsBeforeGuidance = 2;
        // Kept as a compatibility alias for the logic test and older callers.
        internal const int SleepsBeforeGuidance = DefaultSleepsBeforeGuidance;
        private string session;
        private string target;
        private int sleepsWithoutProgress;
        private bool initialized;
        private bool hasSuccessfulSleep;
        private int revision;
        private bool showingBlockedRoute;

        internal bool Begin(string sessionKey, string initialTarget)
        {
            sessionKey = Normalize(sessionKey);
            if (initialized && String.Equals(session, sessionKey, StringComparison.OrdinalIgnoreCase)) return false;

            session = sessionKey;
            target = Normalize(initialTarget);
            sleepsWithoutProgress = 0;
            hasSuccessfulSleep = false;
            showingBlockedRoute = false;
            initialized = true;
            revision++;
            return true;
        }

        internal void SuccessfulSleep(string previousTarget, string currentTarget, bool? discoveredNewRoom)
        {
            currentTarget = Normalize(currentTarget);
            if (!initialized)
            {
                Begin(null, currentTarget);
                hasSuccessfulSleep = true;
                return;
            }

            revision++;
            bool targetChanged = !String.Equals(target, currentTarget, StringComparison.OrdinalIgnoreCase)
                || !String.Equals(Normalize(previousTarget), currentTarget, StringComparison.OrdinalIgnoreCase);
            target = currentTarget;
            hasSuccessfulSleep = true;

            if (targetChanged || !discoveredNewRoom.HasValue || discoveredNewRoom.Value)
            {
                sleepsWithoutProgress = 0;
                return;
            }

            // The Remix setting accepts a small finite range, but the counter is
            // deliberately not capped at the old default so changing that
            // setting takes effect without restarting the campaign.
            if (sleepsWithoutProgress < Int32.MaxValue) sleepsWithoutProgress++;
        }

        internal bool ObserveTarget(string currentTarget)
        {
            currentTarget = Normalize(currentTarget);
            if (String.Equals(target, currentTarget, StringComparison.OrdinalIgnoreCase)) return false;

            target = currentTarget;
            sleepsWithoutProgress = 0;
            showingBlockedRoute = false;
            revision++;
            return true;
        }

        internal bool ShouldShowRoute(bool onlyWhenBlocked, int threshold = DefaultSleepsBeforeGuidance) => !onlyWhenBlocked
            || hasSuccessfulSleep && sleepsWithoutProgress >= NormalizeThreshold(threshold);

        internal bool RecordGuidanceMode(bool onlyWhenBlocked, int threshold = DefaultSleepsBeforeGuidance)
        {
            var blocked = onlyWhenBlocked && hasSuccessfulSleep && sleepsWithoutProgress >= NormalizeThreshold(threshold);
            var changed = showingBlockedRoute != blocked;
            showingBlockedRoute = blocked;
            return changed;
        }

        internal string CurrentTarget => target;
        internal int SleepsWithoutProgress => sleepsWithoutProgress;
        internal int Revision => revision;

        private static int NormalizeThreshold(int threshold) => Math.Max(1, threshold);

        private static string Normalize(string value) => String.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    internal static class GuidanceRoutePlanner
    {
        internal const bool DefaultLocateSpecificRoom = false;
        private static readonly string[] RegionConnections =
        {
            "SU-HI", "SU-DS", "SU-LF", "HI-GW", "HI-CC", "HI-SH", "DS-GW", "DS-SB",
            "GW-SL", "SH-SL", "SH-UW", "CC-UW", "CC-SI", "SI-LF", "LF-SB", "SL-SB",
            "UW-SS", "DS-CC", "GW-SH", "HI-VS", "SI-VS", "SB-VS", "SL-VS", "SL-MS",
            "SB-OE", "OE-SU", "UW-LM", "UW-LC", "LM-DM", "UW-RM", "RM-MS", "SL-RM",
            "CC-CL", "SH-CL", "CL-SL", "UG-SB", "UG-DS", "SB-HR"
        };

        internal static string CampaignTargetRegion(string character, string currentRegion)
        {
            var route = CampaignRegions(character);
            if (String.IsNullOrWhiteSpace(currentRegion)) return null;
            for (var i = 0; i < route.Length; i++)
            {
                if (!String.Equals(route[i], currentRegion, StringComparison.OrdinalIgnoreCase)) continue;
                return i + 1 < route.Length ? FirstRegionOnPath(currentRegion, route[i + 1]) : null;
            }
            return null;
        }

        private static string[] CampaignRegions(string character)
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

        private static string FirstRegionOnPath(string from, string destination)
        {
            if (String.IsNullOrWhiteSpace(from) || String.IsNullOrWhiteSpace(destination)
                || String.Equals(from, destination, StringComparison.OrdinalIgnoreCase)) return destination;

            var graph = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var edge in RegionConnections)
            {
                var parts = edge.Split('-');
                if (!graph.ContainsKey(parts[0])) graph[parts[0]] = new List<string>();
                if (!graph.ContainsKey(parts[1])) graph[parts[1]] = new List<string>();
                graph[parts[0]].Add(parts[1]);
                graph[parts[1]].Add(parts[0]);
            }

            var queue = new Queue<List<string>>();
            queue.Enqueue(new List<string> { from });
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { from };
            while (queue.Count > 0)
            {
                var path = queue.Dequeue();
                var last = path[path.Count - 1];
                if (!graph.TryGetValue(last, out var neighbors)) continue;
                foreach (var next in neighbors)
                {
                    if (!seen.Add(next)) continue;
                    if (String.Equals(next, destination, StringComparison.OrdinalIgnoreCase)) return path.Count == 1 ? next : path[1];
                    var extended = new List<string>(path) { next };
                    queue.Enqueue(extended);
                }
            }
            return destination;
        }

        internal static List<RouteEdge> FindPath(IList<RouteEdge> edges, int start, ISet<int> goals)
        {
            var result = new List<RouteEdge>();
            if (edges == null || goals == null || goals.Count == 0 || start < 0 || goals.Contains(start)) return result;

            var adjacency = new Dictionary<int, List<RouteEdge>>();
            foreach (var edge in edges)
            {
                if (edge == null || edge.A < 0 || edge.B < 0 || edge.A == edge.B) continue;
                Add(edge.A, edge);
                Add(edge.B, edge);
            }

            var queue = new Queue<int>();
            var previousRoom = new Dictionary<int, int>();
            var previousEdge = new Dictionary<int, RouteEdge>();
            queue.Enqueue(start);
            previousRoom[start] = start;
            var goal = -1;

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (goals.Contains(current))
                {
                    goal = current;
                    break;
                }

                if (!adjacency.TryGetValue(current, out var connected)) continue;
                foreach (var edge in connected)
                {
                    var next = edge.A == current ? edge.B : edge.A;
                    if (previousRoom.ContainsKey(next)) continue;
                    previousRoom[next] = current;
                    previousEdge[next] = edge;
                    queue.Enqueue(next);
                }
            }

            if (goal < 0) return result;
            while (goal != start)
            {
                result.Add(previousEdge[goal]);
                goal = previousRoom[goal];
            }
            result.Reverse();
            return result;

            void Add(int room, RouteEdge edge)
            {
                if (!adjacency.TryGetValue(room, out var list)) adjacency[room] = list = new List<RouteEdge>();
                list.Add(edge);
            }
        }

        internal static List<int> PathRooms(IList<RouteEdge> path, int start)
        {
            var rooms = new List<int>();
            if (start < 0) return rooms;
            rooms.Add(start);
            if (path == null) return rooms;

            var current = start;
            foreach (var edge in path)
            {
                if (edge == null) continue;
                if (edge.A == current) current = edge.B;
                else if (edge.B == current) current = edge.A;
                else break;
                rooms.Add(current);
            }
            return rooms;
        }

        internal static List<RouteEdge> RegionalGuidancePath(IList<RouteEdge> edges, int start,
            int targetRoom, bool targetIsRegionExit)
        {
            var path = FindPath(edges, start, new HashSet<int> { targetRoom });
            if (targetIsRegionExit || path.Count <= 1) return path;

            // In regional mode, retain a useful directional hint inside the
            // destination region without drawing a room-by-room route to its
            // ordinary story target. The next map opening replans from the
            // player's new room.
            return new List<RouteEdge> { path[0] };
        }

        internal static int RegionExitOnPath(IList<int> worldPathRooms, ISet<int> currentRegionRooms, int start)
        {
            if (worldPathRooms == null || currentRegionRooms == null || start < 0) return -1;
            var lastCurrentRegionRoom = -1;
            foreach (var room in worldPathRooms)
            {
                if (currentRegionRooms.Contains(room))
                {
                    lastCurrentRegionRoom = room;
                    continue;
                }

                // The first room outside the current region confirms that the
                // preceding local room is the exit to the destination region.
                if (lastCurrentRegionRoom >= 0)
                    return lastCurrentRegionRoom == start ? -1 : lastCurrentRegionRoom;
            }
            return -1;
        }

        internal static HashSet<string> FindInterestDoors(IList<RouteEdge> edges, IList<RouteEdge> mainRoute,
            int start, ISet<int> interestRooms)
        {
            var result = new HashSet<string>(StringComparer.Ordinal);
            if (edges == null || interestRooms == null || interestRooms.Count == 0 || start < 0)
                return result;

            mainRoute = mainRoute ?? new List<RouteEdge>();

            var mainRouteRooms = new HashSet<int> { start };
            foreach (var edge in mainRoute)
            {
                if (edge == null) continue;
                mainRouteRooms.Add(edge.A);
                mainRouteRooms.Add(edge.B);
            }

            foreach (var edge in edges)
            {
                if (edge == null || edge.A < 0 || edge.B < 0 || edge.A == edge.B) continue;
                bool aIsInterest = interestRooms.Contains(edge.A) && edge.A != start;
                bool bIsInterest = interestRooms.Contains(edge.B) && edge.B != start;
                var isMainRouteEdge = mainRoute.Contains(edge);
                var aIsEntrance = aIsInterest && mainRouteRooms.Contains(edge.B)
                    && (!mainRouteRooms.Contains(edge.A) || isMainRouteEdge);
                var bIsEntrance = bIsInterest && mainRouteRooms.Contains(edge.A)
                    && (!mainRouteRooms.Contains(edge.B) || isMainRouteEdge);
                if (aIsEntrance || bIsEntrance)
                    result.Add(EdgeKey(edge.A, edge.B));
            }
            return result;
        }

        internal static string EdgeKey(int a, int b) => a <= b ? a + ":" + b : b + ":" + a;
    }

    internal static class GuidanceAnimation
    {
        internal const float PeriodSeconds = 3.6f;

        internal static float Pulse(float timeSeconds)
        {
            return (float)(0.5 + 0.5 * Math.Sin(timeSeconds * (Math.PI * 2.0 / PeriodSeconds)));
        }

        internal static float ApplyAlpha(float originalAlpha, float pulse) => originalAlpha * pulse;
    }
}
