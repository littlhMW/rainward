using System.Globalization;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using WhereShouldIGo;

if (args.Length == 1 && args[0] == "--protocol-fixtures")
{
    CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("de-DE");
    var names = new[] { "White", "Yellow", "Red", "Gourmand", "Artificer", "Rivulet", "Spear", "Saint", "Watcher", "MeadowOnline", "Custom&Slug" };
    var fixtures = names.Select(name => new
    {
        internalName = name,
        url = LinkProtocol.Build(name, "SU", "SU_C04", 12, 7, name == "MeadowOnline" ? "GreenLizard" : name,
            name == "MeadowOnline" ? "meadow" : "story", true, 250.5f, 140.25f, -40f, 0f)
    });
    Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(fixtures));
    return;
}

int passed = 0;
void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
    passed++;
    Console.WriteLine("PASS " + message);
}

CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("de-DE");
var url = LinkProtocol.Build("White", "SU", "SU_C04", 12, 7, "White", "story", true, 250.5f, 140.25f, -40f, 0f);
Check(url.StartsWith("https://littlhmw.github.io/rainward/#v=1&character=Survivor&"), "fixed HTTPS destination and fragment protocol");
Check(new Uri(url).Query == "", "location is not a server query parameter");
Check(url.Contains("&room=SU_C04&x=12&y=7&"), "room and tile coordinates preserved");
Check(url.Contains("&px=250.5&py=140.25&cx=-40&cy=0"), "pixels use culture-independent decimal points");
var encoded = LinkProtocol.Build("Mod&cat", "W A", "R#1&x=evil", -1, 2, "猫", "meadow", false);
Check(encoded.Contains("character=Mod%26cat&region=W%20A&room=R%231%26x%3Devil&"), "unknown mod names cannot inject URL fields");
Check(!encoded.Contains("&px="), "pixel refinement omitted when unavailable");
Check(LinkProtocol.Character("Yellow") == "Monk" && LinkProtocol.Character("Red") == "Hunter" && LinkProtocol.Character("Spear") == "Spearmaster", "base and expansion character aliases");
Check(LinkProtocol.Character("Watcher") == "Watcher" && LinkProtocol.Character("CustomSlug") == "CustomSlug", "Watcher and unknown character identities preserved");
Check(LinkProtocol.Character("MeadowOnline") == "Survivor", "Meadow default timeline uses its actual enum value alias");

var gesture = new HoldGesture();
Check(!gesture.Tick(true, true, 10f, .6f) && !gesture.Tick(true, true, 10.5f, .6f), "short press does not open");
Check(gesture.Tick(true, true, 10.7f, .6f), "holding reaches activation threshold");
Check(!gesture.Tick(true, true, 11.5f, .6f), "one held press cannot open repeated tabs");
gesture.Tick(false, true, 12f, .6f);
gesture.Tick(true, true, 13f, .6f);
Check(gesture.Tick(true, true, 13.7f, .6f), "release rearms opening");
gesture.Tick(false, true, 14f, .6f);
gesture.Tick(true, false, 15f, .6f);
Check(!gesture.Tick(true, true, 16f, .6f), "focus or menu transition requires fresh release");
gesture.Tick(false, true, 17f, .6f);
gesture.Tick(true, true, 18f, .6f);
Check(gesture.Tick(true, true, 18.7f, .6f), "fresh hold after focus transition works");
gesture.Tick(false, false, 19f, .6f);
gesture.Tick(true, true, 20f, .6f);
Check(!gesture.Tick(true, true, 20.7f, .6f), "Unity false key state while unfocused cannot rearm a held key");
gesture.Tick(false, true, 21f, .6f);
gesture.Tick(true, true, 22f, .6f);
gesture.Suspend();
Check(!gesture.Tick(true, true, 23f, .6f), "session restart or plugin disable cancels an unfinished hold");
gesture.Tick(false, true, 24f, .6f);
gesture.Tick(true, true, 25f, .6f);
Check(gesture.Tick(true, true, 25.7f, .6f), "release after session restart restores normal operation");

var remote = new FakeAvatar { isMine = false };
var mine = new FakeAvatar { isMine = true };
var lobby = new FakeLobby { gameMode = new FakeMode { avatars = new object[] { remote, mine } } };
Check(MeadowBridge.TryLocalAvatar(lobby, out var selected, out _) && selected == mine.abstractCreature, "Meadow skips remote host and chooses local owner");
lobby.gameMode.avatars = new object[] { remote };
Check(!MeadowBridge.TryLocalAvatar(lobby, out _, out _), "spectator does not fall back to host");
mine.abstractCreature.realizedCreature.inShortcut = true;
lobby.gameMode.avatars = new object[] { mine, remote };
Check(!MeadowBridge.TryLocalAvatar(lobby, out _, out _), "shortcut state never reports stale room");
mine.abstractCreature.realizedCreature.inShortcut = false;
mine.abstractCreature.realizedCreature.dead = true;
Check(!MeadowBridge.TryLocalAvatar(lobby, out _, out _), "dead local avatar is not replaced with another player's position");
mine.abstractCreature.realizedCreature.dead = false;
mine.isAvatar = false;
Check(!MeadowBridge.TryLocalAvatar(lobby, out _, out _), "owned non-avatar objects do not qualify");
lobby.gameMode.avatars = new object[] { new object() };
Check(!MeadowBridge.TryLocalAvatar(lobby, out _, out _), "changed ownership API fails closed");
lobby.gameMode.avatars = new object[] { new FailingAvatar(), remote };
bool reflectionStopped = false;
try { MeadowBridge.TryLocalAvatar(lobby, out _, out _); }
catch (System.Reflection.TargetInvocationException) { reflectionStopped = true; }
Check(reflectionStopped, "reflection exception stops selection instead of falling back to a remote player");
if (args.Length == 1)
{
    using var stream = File.OpenRead(args[0]);
    using var pe = new PEReader(stream);
    var metadata = pe.GetMetadataReader();
    Check(metadata.GetString(metadata.GetAssemblyDefinition().Name) == "Rain Meadow", "installed Meadow assembly name matches optional reflection bridge");
    TypeDefinition Type(string name) => metadata.TypeDefinitions.Select(metadata.GetTypeDefinition)
        .Single(t => metadata.GetString(t.Namespace) == "RainMeadow" && metadata.GetString(t.Name) == name);
    bool Field(string type, string field) => Type(type).GetFields().Select(metadata.GetFieldDefinition)
        .Any(f => metadata.GetString(f.Name) == field);
    bool Property(string type, string property) => Type(type).GetProperties().Select(metadata.GetPropertyDefinition)
        .Any(p => metadata.GetString(p.Name) == property);
    Check(Field("OnlineManager", "lobby") && Field("Lobby", "gameMode"), "installed Meadow lobby API fields match");
    Check(Field("OnlineGameMode", "avatars") && Property("OnlineEntity", "isMine"), "installed Meadow local avatar ownership API matches");
    Check(Property("OnlineCreature", "isAvatar") && Property("OnlineCreature", "abstractCreature"), "installed Meadow avatar and creature API matches");
    Check(Field("StoryGameMode", "currentCampaign"), "installed Meadow campaign selection API matches");
}
Console.WriteLine($"{passed} checks passed. These are logic/API-shape tests, not in-game multiplayer tests.");

// Shape stubs isolate reflection and ownership behavior from the proprietary game runtime.
public class AbstractCreature { public Creature realizedCreature = new(); }
public class Creature { public bool dead; public bool inShortcut; public object room = new(); }
public class FakeEntity { public bool isMine { get; set; } }
public class FakeAvatar : FakeEntity { public bool isAvatar { get; set; } = true; public AbstractCreature abstractCreature { get; } = new(); }
public class FakeMode { public object[] avatars; }
public class FakeLobby { public FakeMode gameMode; }
public class FailingAvatar { public bool isMine => throw new InvalidOperationException("API unavailable"); }
