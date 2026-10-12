using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using UnityEngine;

namespace WhereShouldIGo
{
    internal static class SnapshotBuilder
    {
        internal static GameSnapshot Capture(RainWorldGame game, object lobby, object gameMode,
            AbstractCreature local, string campaign, string mode)
        {
            var own = Position(local, "local", "你", true, lobby == null || MeadowBridge.Member(lobby, "isOwner") is bool owner && owner);
            if (!own.available) throw new InvalidOperationException("本地位置暂不可用 / Local position unavailable.");
            var result = new GameSnapshot
            {
                character = LinkProtocol.Character(campaign), region = own.region, room = own.room,
                x = own.x, y = own.y, px = own.px, py = own.py, cx = own.cx, cy = own.cy,
                avatar = local.realizedCreature is Player player ? player.SlugCatClass?.value : local.creatureTemplate.type.value,
                mode = mode, dlc = ModManager.MSC, multiplayer = lobby != null,
                capturedAt = DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture)
            };
            if (lobby == null)
            {
                int index = 0;
                foreach (var creature in game.Players)
                    result.players.Add(Position(creature, "p" + index, "玩家 " + (++index), true, index == 1));
            }
            else result.players = MeadowPlayers(lobby);
            // If the roster has not caught up, retain the independently verified local avatar.
            if (!result.players.Any(x => x.local && x.available)) result.players.Add(own);
            try { result.progress = Progress(game, lobby, gameMode, campaign, mode); }
            catch (Exception) { result.progress = SaveSnapshotReader.Unavailable("无法可靠读取房主/单机探索记录；未使用客机存档替代。"); }
            return result;
        }

        private static ProgressSnapshot Progress(RainWorldGame game, object lobby, object gameMode, string campaign, string mode)
        {
            if (mode == "meadow") return SaveSnapshotReader.Unavailable("雨甸自由模式没有可确认的房主故事存档。");
            if (lobby != null)
            {
                if (!(MeadowBridge.Member(lobby, "isOwner") is bool host)) return SaveSnapshotReader.Unavailable("无法确认房主身份。");
                if (!host)
                {
                    var raw = MeadowBridge.Member(gameMode, "saveStateString") as string;
                    if (string.IsNullOrEmpty(raw)) return SaveSnapshotReader.Unavailable("房主存档快照尚未同步。");
                    var meadow = Type.GetType("RainMeadow.RainMeadow, Rain Meadow", false);
                    var inflate = meadow?.GetMethod("InflateJoarXML", BindingFlags.Public | BindingFlags.Static);
                    if (inflate == null) return SaveSnapshotReader.Unavailable("雨甸房主快照接口不可用。");
                    return SaveSnapshotReader.Host(inflate.Invoke(null, new object[] { raw }) as string, campaign);
                }
            }
            var save = game.GetStorySession?.saveState;
            if (save == null || LinkProtocol.Character(save.saveStateNumber.value) != LinkProtocol.Character(campaign))
                return SaveSnapshotReader.Unavailable("当前存档与战役不匹配。");
            var rooms = new HashSet<string>(StringComparer.Ordinal);
            // Loaded RegionState is newer than its persisted regionLoadStrings counterpart.
            for (int i = 0; i < Math.Max(save.regionStates?.Length ?? 0, save.regionLoadStrings?.Length ?? 0); i++)
            {
                var state = i < (save.regionStates?.Length ?? 0) ? save.regionStates[i] : null;
                if (state?.roomsVisited != null)
                    foreach (var room in state.roomsVisited) SaveSnapshotReader.AddRoom(room, rooms);
                else if (i < (save.regionLoadStrings?.Length ?? 0)) SaveSnapshotReader.AddRooms(save.regionLoadStrings[i], rooms);
            }
            var death = save.deathPersistentSaveData;
            var misc = save.miscWorldSaveData;
            return new ProgressSnapshot
            {
                source = lobby == null ? "solo" : "host", scope = "save", freshness = "live",
                cycle = save.cycleNumber, saveId = SaveSnapshotReader.SaveId(campaign, save.seed),
                rooms = rooms.OrderBy(x => x, StringComparer.Ordinal).ToList(),
                flags = new StoryFlags
                {
                    moonConversations = misc.EverMetMoon ? misc.SLOracleState.playerEncounters : 0,
                    pebblesConversations = misc.SSaiConversationsHad, hasMark = death.theMark, karmaCap = death.karmaCap,
                    moonHeartRestored = misc.moonHeartRestored, pebblesEnergyTaken = misc.pebblesEnergyTaken,
                    smPearlTagged = misc.smPearlTagged, ascended = death.ascended, altEnding = death.altEnding,
                    redExtraCycles = death.redExtraCycles, denPosition = save.denPosition, hasRobo = save.hasRobo,
                    ghostsTalkedTo = death.ghostsTalkedTo.ToDictionary(p => p.Key.value, p => p.Value)
                }
            };
        }

        private static List<PlayerSnapshot> MeadowPlayers(object lobby)
        {
            var result = new List<PlayerSnapshot>();
            var settings = MeadowBridge.Member(lobby, "clientSettings") as IEnumerable;
            if (settings == null) return result;
            var host = MeadowBridge.Member(lobby, "owner");
            foreach (var pair in settings)
            {
                var owner = MeadowBridge.Member(pair, "Key");
                var config = MeadowBridge.Member(pair, "Value");
                if (!(MeadowBridge.Member(config, "inGame") is bool inGame) || !inGame) continue;
                bool local = MeadowBridge.Member(owner, "isMe") is bool mine && mine;
                bool isHost = Equals(owner, host);
                string ownerId = Convert.ToString(MeadowBridge.Member(owner, "inLobbyId"), CultureInfo.InvariantCulture);
                // DisplayName respects Meadow's streamer mode; do not expose Steam IDs or raw persona names.
                var name = MeadowBridge.Member(MeadowBridge.Member(owner, "id"), "DisplayName") as string;
                name = string.IsNullOrWhiteSpace(name) ? "玩家 " + ownerId : Regex.Replace(name, @"[\p{Cc}\p{Cf}]", "");
                if (name.Length > 80) name = name.Substring(0, 80);
                var avatars = MeadowBridge.Member(config, "avatars") as IEnumerable;
                int index = 0;
                if (avatars != null)
                    foreach (var id in avatars)
                    {
                        var shortId = "p" + ownerId + "a" + index++;
                        try
                        {
                            var resolve = id.GetType().GetMethod("FindEntity", new[] { typeof(bool) });
                            var entity = resolve?.Invoke(id, new object[] { true });
                            var creature = MeadowBridge.Member(entity, "apo") as AbstractCreature;
                            result.Add(Position(creature, shortId, name, local, isHost));
                        }
                        catch (Exception) { result.Add(Position(null, shortId, name, local, isHost)); }
                    }
                if (index == 0) result.Add(Position(null, "p" + ownerId, name, local, isHost));
            }
            return result;
        }

        private static PlayerSnapshot Position(AbstractCreature creature, string id, string name, bool local, bool host)
        {
            var result = new PlayerSnapshot { id = id, name = name, local = local, host = host };
            if (creature == null) return result;
            var pos = creature.pos;
            string roomName = pos.unknownName;
            if (string.IsNullOrEmpty(roomName) && RainWorld.roomIndexToName != null)
                RainWorld.roomIndexToName.TryGetValue(pos.room, out roomName);
            if (string.IsNullOrEmpty(roomName)) return result;
            // A remote apo.world can lag behind its synchronized pos after a region change.
            // Only use live room/body coordinates when the abstract room index matches.
            var realized = creature.realizedCreature;
            var room = realized?.room;
            bool sameRoom = room != null && room.abstractRoom.index == pos.room && room.abstractRoom.name == roomName;
            var prefix = roomName.Split('_')[0];
            string region = sameRoom ? room.world.region?.name : prefix;
            if (!Regex.IsMatch(region ?? "", @"^[A-Za-z0-9]{1,16}$") || prefix == "GATE" && !sameRoom) return result;
            result.available = true;
            result.region = region.ToUpperInvariant(); result.room = roomName.ToUpperInvariant();
            if (pos.TileDefined) { result.x = pos.x; result.y = pos.y; }
            if (sameRoom && !realized.inShortcut && realized.mainBodyChunk != null && room.cameraPositions?.Length > 0)
            {
                var pixel = realized.mainBodyChunk.pos;
                var tile = room.GetTilePosition(pixel);
                var cameraMin = room.cameraPositions[0];
                foreach (var camera in room.cameraPositions) cameraMin = Vector2.Min(cameraMin, camera);
                result.x = tile.x; result.y = tile.y; result.px = pixel.x; result.py = pixel.y;
                result.cx = cameraMin.x; result.cy = cameraMin.y; result.accuracy = "pixel";
            }
            return result;
        }
    }
}
