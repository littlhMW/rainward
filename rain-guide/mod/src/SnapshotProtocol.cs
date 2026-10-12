using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;

namespace WhereShouldIGo
{
    [DataContract]
    internal sealed class GameSnapshot
    {
        [DataMember] public int v = 2;
        [DataMember] public string character;
        [DataMember] public string region;
        [DataMember] public string room;
        [DataMember(EmitDefaultValue = false)] public int? x;
        [DataMember(EmitDefaultValue = false)] public int? y;
        [DataMember(EmitDefaultValue = false)] public float? px;
        [DataMember(EmitDefaultValue = false)] public float? py;
        [DataMember(EmitDefaultValue = false)] public float? cx;
        [DataMember(EmitDefaultValue = false)] public float? cy;
        [DataMember] public string avatar;
        [DataMember] public string mode = "story";
        [DataMember] public bool dlc;
        [DataMember] public bool multiplayer;
        [DataMember] public string capturedAt;
        [DataMember] public List<PlayerSnapshot> players = new List<PlayerSnapshot>();
        [DataMember] public ProgressSnapshot progress;
    }

    [DataContract]
    internal sealed class PlayerSnapshot
    {
        [DataMember] public string id;
        [DataMember] public string name;
        [DataMember] public bool local;
        [DataMember] public bool host;
        [DataMember] public bool available;
        [DataMember] public string accuracy = "room";
        [DataMember(EmitDefaultValue = false)] public string region;
        [DataMember(EmitDefaultValue = false)] public string room;
        [DataMember(EmitDefaultValue = false)] public int? x;
        [DataMember(EmitDefaultValue = false)] public int? y;
        [DataMember(EmitDefaultValue = false)] public float? px;
        [DataMember(EmitDefaultValue = false)] public float? py;
        [DataMember(EmitDefaultValue = false)] public float? cx;
        [DataMember(EmitDefaultValue = false)] public float? cy;
    }

    [DataContract]
    internal sealed class ProgressSnapshot
    {
        [DataMember] public string source = "unavailable";
        [DataMember(EmitDefaultValue = false)] public string saveId;
        [DataMember(EmitDefaultValue = false)] public int? cycle;
        [DataMember] public string scope = "none";
        [DataMember] public string freshness = "unavailable";
        [DataMember] public List<string> rooms = new List<string>();
        [DataMember(EmitDefaultValue = false)] public StoryFlags flags;
        [DataMember(EmitDefaultValue = false)] public string note;
    }

    [DataContract]
    internal sealed class StoryFlags
    {
        [DataMember] public int moonConversations;
        [DataMember] public int pebblesConversations;
        [DataMember] public bool hasMark;
        [DataMember] public int karmaCap;
        [DataMember] public bool moonHeartRestored;
        [DataMember] public bool pebblesEnergyTaken;
        [DataMember] public bool smPearlTagged;
        [DataMember] public bool ascended;
        [DataMember] public bool altEnding;
        [DataMember] public bool redExtraCycles;
        [DataMember] public string denPosition;
        [DataMember] public bool hasRobo;
        [DataMember] public Dictionary<string, int> ghostsTalkedTo = new Dictionary<string, int>();
    }

    internal static class SnapshotProtocol
    {
        internal const int MaxUrlChars = 24000;
        internal const int MaxJsonBytes = 1024 * 1024;
        internal const int MaxRooms = 12000;
        internal const int MaxPlayers = 64;

        internal static byte[] Json(GameSnapshot snapshot)
        {
            if (snapshot.players.Count > MaxPlayers) throw new InvalidOperationException("玩家数量超过 64，未截断或导出。 / Too many players.");
            if (snapshot.progress?.rooms.Count > MaxRooms) throw new InvalidOperationException("探索房间超过 12000，未截断或导出。 / Too many rooms.");
            using (var stream = new MemoryStream())
            {
                new DataContractJsonSerializer(typeof(GameSnapshot), new DataContractJsonSerializerSettings
                    { UseSimpleDictionaryFormat = true }).WriteObject(stream, snapshot);
                if (stream.Length > MaxJsonBytes) throw new InvalidOperationException("位置数据超过 1 MB，未截断或导出。 / Snapshot too large.");
                return stream.ToArray();
            }
        }

        internal static string Url(byte[] json)
        {
            using (var packed = new MemoryStream())
            {
                using (var gzip = new GZipStream(packed, CompressionLevel.Optimal, true))
                    gzip.Write(json, 0, json.Length);
                return LinkProtocol.Website + "#v=2&data=" + Convert.ToBase64String(packed.ToArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_');
            }
        }
    }
}
