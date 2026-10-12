using System.IO.Compression;
using System.Text;
using System.Text.Json;
using WhereShouldIGo;

internal static class SnapshotCases
{
    internal const string HostSave = "SAV STATE NUMBER<svB>White<svA>SEED<svB>777<svA>CYCLENUM<svB>12<svA>DENPOS<svB>SU_S01<svA>HASROBO<svA>"
        + "REGIONSTATE<svB>REGIONNAME<rgB>SU<rgA>ROOMSVISITED<rgB>SU_C04,SU_S01<rgA><svA>"
        + "REGIONSTATE<svB>REGIONNAME<rgB>HI<rgA>ROOMSVISITED<rgB>HI_A01,SU_C04<rgA><svA>"
        + "DEATHPERSISTENTSAVEDATA<svB>KARMACAP<dpB>8<dpA>HASTHEMARK<dpA>GHOSTS<dpB>CC:2,SI:1<dpA>REDEXTRACYCLES<dpA><svA>"
        + "MISCWORLDSAVEDATA<svB>SSaiConversationsHad<mwB>2<mwA>SLaiState<mwB>integersArray<slosB>3.1.5<slosA><mwA>MOONHEART<mwA>ENERGYRAILOFF<mwA>SMPEARLTAGGED<mwA><svA>";

    internal static GameSnapshot Example() => new GameSnapshot
    {
        character = "Survivor", region = "SU", room = "SU_C04", x = 12, y = 7,
        px = 250.5f, py = 140.25f, cx = -40f, cy = 0f, avatar = "White", mode = "story",
        dlc = true, multiplayer = true, capturedAt = "2026-10-13T12:34:56.0000000Z",
        progress = SaveSnapshotReader.Host(HostSave, "White"),
        players = new List<PlayerSnapshot>
        {
            new PlayerSnapshot { id = "p2a0", name = "你", local = true, host = false, available = true, accuracy = "pixel", region = "SU", room = "SU_C04", x = 12, y = 7, px = 250.5f, py = 140.25f, cx = -40f, cy = 0f },
            new PlayerSnapshot { id = "p1a0", name = "房主", local = false, host = true, available = true, accuracy = "room", region = "HI", room = "HI_A01", x = 3, y = 5 },
            new PlayerSnapshot { id = "p3a0", name = "远端 <玩家>", available = false }
        }
    };

    internal static void Run(Action<bool, string> check)
    {
        var progress = SaveSnapshotReader.Host(HostSave, "Survivor");
        check(progress.source == "host" && progress.freshness == "cycle-start" && progress.scope == "save", "client progress explicitly identifies host cycle-start provenance");
        check(progress.rooms.SequenceEqual(new[] { "HI_A01", "SU_C04", "SU_S01" }), "host parser collects every repeated region record and deduplicates rooms");
        check(progress.saveId == "Survivor:seed:777" && progress.cycle == 12, "save identity contains campaign and seed, no account identity or client slot");
        check(progress.flags.moonConversations == 3 && progress.flags.pebblesConversations == 2 && progress.flags.hasMark && progress.flags.karmaCap == 8, "host encounter and mark fields use actual serialized values");
        check(progress.flags.hasRobo && progress.flags.denPosition == "SU_S01" && progress.flags.ghostsTalkedTo["CC"] == 2 && progress.flags.ghostsTalkedTo["SI"] == 1, "den, robot and echo records read from verified save tokens");
        check(progress.flags.moonHeartRestored && progress.flags.pebblesEnergyTaken && progress.flags.smPearlTagged && progress.flags.redExtraCycles && !progress.flags.ascended && !progress.flags.altEnding, "story flags preserve independent true and false state");
        var missing = SaveSnapshotReader.Host(null, "White");
        check(missing.source == "unavailable" && missing.rooms.Count == 0 && missing.flags == null, "missing host snapshot never falls back to local progress");
        check(SaveSnapshotReader.Host(HostSave, "Rivulet").source == "unavailable", "campaign mismatch cannot import a different campaign's exploration");
        check(SaveSnapshotReader.Host("SAV STATE NUMBER<svB>White<svA>", "White").source == "unavailable", "incomplete host payload is not accepted as an empty complete save");
        bool oldRejected = false;
        try { SaveSnapshotReader.AddRooms("ROOMSVISITED<rgB>0010101001<rgA>", new HashSet<string>()); }
        catch (FormatException) { oldRejected = true; }
        check(oldRejected, "legacy numeric room bitmaps fail closed rather than reveal or silently discard rooms");

        var snapshot = Example();
        var json = SnapshotProtocol.Json(snapshot);
        var url = SnapshotProtocol.Url(json);
        check(url.StartsWith("https://littlhmw.github.io/rainward/#v=2&data=") && new Uri(url).Query == "", "v2 compressed snapshot remains entirely in URL fragment");
        var data = url.Split("data=")[1].Replace('-', '+').Replace('_', '/');
        data += new string('=', (4 - data.Length % 4) % 4);
        using var packed = new MemoryStream(Convert.FromBase64String(data));
        using var gzip = new GZipStream(packed, CompressionMode.Decompress);
        using var restored = new MemoryStream();
        gzip.CopyTo(restored);
        check(json.SequenceEqual(restored.ToArray()), "gzip/base64url round trip preserves entire JSON without truncation");
        using var document = JsonDocument.Parse(json);
        check(document.RootElement.GetProperty("route").GetBoolean(), "route highlighting is enabled by default in a game snapshot");
        check(document.RootElement.GetProperty("progress").GetProperty("flags").GetProperty("ghostsTalkedTo").GetProperty("CC").GetInt32() == 2, "echo dictionary serializes as a JSON object");
        var players = document.RootElement.GetProperty("players");
        check(players.GetArrayLength() == 3 && !players[2].GetProperty("available").GetBoolean() && !players[2].TryGetProperty("room", out _), "unresolved remote players remain present without fabricated coordinates");
        check(!players[1].TryGetProperty("px", out _) && players[1].GetProperty("accuracy").GetString() == "room", "abstract remote position never pretends to have pixel precision");
        check(players[2].GetProperty("name").GetString() == "远端 <玩家>", "Unicode and markup-like player names survive JSON as text");

        snapshot.route = false;
        using (var routeOff = JsonDocument.Parse(SnapshotProtocol.Json(snapshot)))
            check(!routeOff.RootElement.GetProperty("route").GetBoolean(), "route highlighting setting is preserved in a game snapshot");

        snapshot.progress.rooms = Enumerable.Range(0, SnapshotProtocol.MaxRooms + 1).Select(x => "SU_R" + x).ToList();
        bool roomsRejected = false;
        try { SnapshotProtocol.Json(snapshot); } catch (InvalidOperationException) { roomsRejected = true; }
        check(roomsRejected, "more than 12000 rooms is explicitly rejected, not truncated");
        snapshot = Example();
        snapshot.players = Enumerable.Range(0, 65).Select(x => new PlayerSnapshot { id = "p" + x }).ToList();
        bool playersRejected = false;
        try { SnapshotProtocol.Json(snapshot); } catch (InvalidOperationException) { playersRejected = true; }
        check(playersRejected, "more than 64 players is explicitly rejected, not truncated");
        snapshot = Example(); snapshot.avatar = new string('A', SnapshotProtocol.MaxJsonBytes);
        bool bytesRejected = false;
        try { SnapshotProtocol.Json(snapshot); } catch (InvalidOperationException) { bytesRejected = true; }
        check(bytesRejected, "decompressed snapshot is limited to 1 MiB");
        snapshot = Example();
        var random = new Random(417);
        snapshot.progress.rooms = Enumerable.Range(0, 4000).Select(x => "SU_" + x + "_" + random.NextInt64().ToString("X")).ToList();
        var largeJson = SnapshotProtocol.Json(snapshot);
        check(SnapshotProtocol.Url(largeJson).Length > SnapshotProtocol.MaxUrlChars && largeJson.Length < SnapshotProtocol.MaxJsonBytes,
            "large exploration remains intact and selects file-export branch at 24000 URL characters");
    }
}
