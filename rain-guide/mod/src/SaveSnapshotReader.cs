using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace WhereShouldIGo
{
    // Parse only documented serialized fields. Never invoke SaveState.LoadGame or
    // SaveToString: both can mutate game state. Client snapshots remain host-only.
    internal static class SaveSnapshotReader
    {
        internal static IEnumerable<KeyValuePair<string, string>> Fields(string text, string a, string b)
        {
            foreach (var section in (text ?? "").Split(new[] { a }, StringSplitOptions.RemoveEmptyEntries))
            {
                var split = section.IndexOf(b, StringComparison.Ordinal);
                yield return new KeyValuePair<string, string>(split < 0 ? section : section.Substring(0, split),
                    split < 0 ? "" : section.Substring(split + b.Length));
            }
        }

        internal static Dictionary<string, string> Dictionary(string text, string a, string b)
        {
            var result = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var pair in Fields(text, a, b)) result[pair.Key] = pair.Value;
            return result;
        }

        private static string Get(Dictionary<string, string> data, string key) => data.TryGetValue(key, out var value) ? value : "";
        private static int Number(Dictionary<string, string> data, string key, int fallback = 0)
            => int.TryParse(Get(data, key), NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : fallback;

        internal static void AddRooms(string regionState, HashSet<string> rooms)
        {
            var fields = Dictionary(regionState, "<rgA>", "<rgB>");
            foreach (var room in Get(fields, "ROOMSVISITED").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                AddRoom(room, rooms);
        }

        internal static void AddRoom(string room, HashSet<string> rooms)
        {
            if (string.IsNullOrEmpty(room)) return;
            // Very old saves can use a digit-only bitmap; fail closed rather than
            // misrepresent it as an empty or complete modern visited-room list.
            if (!Regex.IsMatch(room, @"^[A-Za-z0-9_+.-]{1,96}$") || Regex.IsMatch(room, @"^\d+$"))
                throw new FormatException("无法准确读取旧版或自定义房间记录 / Unsupported visited-room format.");
            rooms.Add(room.ToUpperInvariant());
        }

        internal static string SaveId(string campaign, int seed) => LinkProtocol.Character(campaign) + ":seed:" + seed.ToString(CultureInfo.InvariantCulture);

        internal static ProgressSnapshot Host(string inflated, string campaign)
        {
            if (string.IsNullOrWhiteSpace(inflated)) return Unavailable("房主存档快照尚未同步 / Host save not synchronized.");
            var fields = Dictionary(inflated, "<svA>", "<svB>");
            if (!int.TryParse(Get(fields, "SEED"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var seed)
                || !int.TryParse(Get(fields, "CYCLENUM"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var cycle)
                || LinkProtocol.Character(Get(fields, "SAV STATE NUMBER")) != LinkProtocol.Character(campaign)
                || !fields.ContainsKey("DEATHPERSISTENTSAVEDATA"))
                return Unavailable("房主快照无效或战役不匹配 / Invalid or mismatched host save.");

            var rooms = new HashSet<string>(StringComparer.Ordinal);
            foreach (var pair in Fields(inflated, "<svA>", "<svB>"))
                if (pair.Key == "REGIONSTATE") AddRooms(pair.Value, rooms);
            var death = Dictionary(Get(fields, "DEATHPERSISTENTSAVEDATA"), "<dpA>", "<dpB>");
            var misc = Dictionary(Get(fields, "MISCWORLDSAVEDATA"), "<mwA>", "<mwB>");
            var moon = Dictionary(Get(misc, "SLaiState"), "<slosA>", "<slosB>");
            var ghosts = new Dictionary<string, int>();
            foreach (var record in Get(death, "GHOSTS").Split(','))
            {
                var parts = record.Split(':');
                if (parts.Length == 2 && int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var count))
                    ghosts[parts[0]] = count;
            }
            int.TryParse(Get(moon, "integersArray").Split('.')[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var moonEncounters);
            return new ProgressSnapshot
            {
                source = "host", scope = "save", freshness = "cycle-start", cycle = cycle,
                saveId = SaveId(campaign, seed), rooms = rooms.OrderBy(x => x, StringComparer.Ordinal).ToList(),
                note = "雨甸已同步的房主周期起点快照；本周期新增探索可能尚未同步。",
                flags = new StoryFlags
                {
                    moonConversations = moonEncounters, pebblesConversations = Number(misc, "SSaiConversationsHad"),
                    hasMark = death.ContainsKey("HASTHEMARK"), karmaCap = Number(death, "KARMACAP"),
                    moonHeartRestored = misc.ContainsKey("MOONHEART"), pebblesEnergyTaken = misc.ContainsKey("ENERGYRAILOFF"),
                    smPearlTagged = misc.ContainsKey("SMPEARLTAGGED"), ascended = death.ContainsKey("ASCENDED"),
                    altEnding = death.ContainsKey("ALTENDING"), redExtraCycles = death.ContainsKey("REDEXTRACYCLES"),
                    denPosition = Get(fields, "DENPOS"), hasRobo = fields.ContainsKey("HASROBO"), ghostsTalkedTo = ghosts
                }
            };
        }

        internal static ProgressSnapshot Unavailable(string reason) => new ProgressSnapshot { note = reason };
    }
}
