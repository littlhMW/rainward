using System;
using System.IO;
using BepInEx;
using RWCustom;
using UnityEngine;

namespace Rainward
{
    [BepInPlugin(ModId, "Rainward: Where to Go", "1.3.5")]
    [BepInDependency("henpemaz.rainmeadow", BepInDependency.DependencyFlags.SoftDependency)]
    public sealed class Plugin : BaseUnityPlugin
    {
        private const string LegacyModId = "littlhmw.whereshouldigo";

        public const string ModId = "littlhmw.rainward";
        private readonly HoldGesture hold = new HoldGesture();
        private MapOptions options;
        private bool registered;
        private float nextRegistrationAttempt;
        private float nextErrorLog;
        private RainWorldGame previousGame;
        private bool previousStorySession;
        private string guidanceSessionKey;
        private bool guidanceVisibilityInitialized;
        private bool guideWhenBlockedLastFrame;
        private int guideAfterCyclesLastFrame = -1;

        private void OnEnable()
        {
            hold.Suspend();
            On.RainWorld.OnModsInit += ModsInit;
            On.HUD.Map.Draw += MapDraw;
            On.RainWorldGame.Win += GameWin;
        }

        private void OnDisable()
        {
            hold.Suspend();
            HudMapHighlighter.Reset();
            OverseerPresence.Reset();
            previousGame = null;
            previousStorySession = false;
            guidanceSessionKey = null;
            guidanceVisibilityInitialized = false;
            guideWhenBlockedLastFrame = false;
            guideAfterCyclesLastFrame = -1;
            On.RainWorld.OnModsInit -= ModsInit;
            On.HUD.Map.Draw -= MapDraw;
            On.RainWorldGame.Win -= GameWin;
        }

        private void OnApplicationFocus(bool focused)
        {
            if (!focused) hold.Suspend();
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) hold.Suspend();
        }

        private void ModsInit(On.RainWorld.orig_OnModsInit orig, RainWorld self)
        {
            orig(self);
            try { RegisterOptions(); }
            catch (Exception error) { Logger.LogError(error); }
        }

        private void RegisterOptions()
        {
            if (registered) return;
            MigrateLegacyConfig();
            if (options == null) options = new MapOptions();
            registered = MachineConnector.SetRegisteredOI(ModId, options);
        }

        private static void MigrateLegacyConfig()
        {
            try
            {
                var directory = Path.Combine(Application.persistentDataPath, "ModConfigs");
                var legacyPath = Path.Combine(directory, LegacyModId + ".txt");
                var currentPath = Path.Combine(directory, ModId + ".txt");
                if (!File.Exists(currentPath) && File.Exists(legacyPath))
                    File.Copy(legacyPath, currentPath);
            }
            catch (Exception error)
            {
                Debug.LogWarning("[Rainward] Could not migrate the previous configuration: " + error.Message);
            }
        }

        private void Update()
        {
            try
            {
                if (!registered && Time.unscaledTime >= nextRegistrationAttempt)
                {
                    nextRegistrationAttempt = Time.unscaledTime + 2f;
                    // Wait until Remix has created this mod's registered interface.
                    if (MachineConnector.GetRegisteredOI(ModId) != null) RegisterOptions();
                }
                var game = Custom.rainWorld?.processManager?.currentMainLoop as RainWorldGame;
                if (!ReferenceEquals(previousGame, game))
                {
                    previousGame = game;
                    previousStorySession = false;
                    hold.Suspend();
                }
                var storySession = IsStory(game);
                var sessionKey = StorySessionKey(game);
                if (storySession && (!previousStorySession || !String.Equals(guidanceSessionKey, sessionKey, StringComparison.Ordinal)))
                {
                    if (HudMapHighlighter.InitializeGuidance(game, sessionKey))
                    {
                        guidanceSessionKey = sessionKey;
                        guidanceVisibilityInitialized = false;
                    }
                }
                if (storySession && HudMapHighlighter.RefreshStoryGoal(game))
                    HudMapHighlighter.InvalidateMaps();
                if (!storySession) guidanceSessionKey = null;
                previousStorySession = storySession;
                var guideWhenBlocked = options?.GuideWhenBlocked.Value ?? false;
                var guideAfterCycles = options?.GuideAfterCycles.Value ?? GuidanceProgress.DefaultSleepsBeforeGuidance;
                var visibilityChanged = HudMapHighlighter.GuidanceVisibilityChanged(guideWhenBlocked, guideAfterCycles);
                if (!guidanceVisibilityInitialized || guideWhenBlocked != guideWhenBlockedLastFrame
                    || guideAfterCycles != guideAfterCyclesLastFrame || visibilityChanged)
                {
                    HudMapHighlighter.InvalidateMaps();
                    guidanceVisibilityInitialized = true;
                    guideWhenBlockedLastFrame = guideWhenBlocked;
                    guideAfterCyclesLastFrame = guideAfterCycles;
                }
                OverseerPresence.Update(game, options?.KeepOverseerNearby.Value ?? false, Time.unscaledTime);
                var navigationEnabled = options?.EnableGNavigation.Value ?? true;
                if (!navigationEnabled)
                {
                    hold.Suspend();
                    return;
                }
                var key = options?.OpenKey.Value ?? KeyCode.G;
                var duration = (options?.HoldTenths.Value ?? 6) / 10f;
                var available = Application.isFocused && game != null && game.IsStorySession
                    && game.pauseMenu == null && !game.GamePaused && game.manager.upcomingProcess == null;
                if (hold.Tick(Input.GetKey(key), available, Time.unscaledTime, duration)) OpenMap(game);
            }
            catch (Exception error)
            {
                // Avoid filling the log every frame if an external API changes.
                if (Time.unscaledTime >= nextErrorLog)
                {
                    nextErrorLog = Time.unscaledTime + 30f;
                    Logger.LogError(error);
                }
            }
        }

        private void MapDraw(On.HUD.Map.orig_Draw orig, HUD.Map map, float timeStacker)
        {
            HudMapHighlighter.Draw(orig, map, timeStacker, options?.EnableRouteHighlight.Value ?? true, options);
        }

        private static bool IsStory(RainWorldGame game) => game != null && game.IsStorySession && game.GetStorySession?.saveState != null;

        private static string StorySessionKey(RainWorldGame game)
        {
            if (!IsStory(game)) return null;
            var save = game.GetStorySession.saveState;
            return game.StoryCharacter?.value + ":" + save.seed;
        }

        private void GameWin(On.RainWorldGame.orig_Win orig, RainWorldGame game,
            bool malnourished, bool fromWarpPoint)
        {
            var previousGoal = HudMapHighlighter.CurrentStoryGoal(game);
            var discoveredNewRoom = NewRoomsThisCycle(game);
            orig(game, malnourished, fromWarpPoint);
            if (!fromWarpPoint && IsStory(game))
            {
                HudMapHighlighter.SuccessfulSleep(game, previousGoal, discoveredNewRoom);
                HudMapHighlighter.InvalidateMaps();
            }
        }

        private static bool? NewRoomsThisCycle(RainWorldGame game)
        {
            if (!IsStory(game)) return null;
            try
            {
                var save = game.GetStorySession.saveState;
                if (save.regionStates == null) return null;
                var field = typeof(RegionState).GetField("newRoomsThisCycle",
                    System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic);
                if (field == null) return null;
                var count = 0;
                foreach (var state in save.regionStates)
                    if (state != null && field.GetValue(state) is int value) count += value;
                return count > 0;
            }
            catch { return null; }
        }

        private void OpenMap(RainWorldGame game)
        {
            AbstractCreature local = null;
            object gameMode = null;
            string campaign = game.StoryCharacter?.value;
            string mode = "story";
            if (!MeadowBridge.TryGetLobby(out var lobby))
            {
                Notify(game, "littlhmw.rainward-meadow-api");
                return;
            }
            if (lobby != null)
            {
                if (!MeadowBridge.TryLocalAvatar(lobby, out local, out gameMode))
                {
                    Notify(game, "littlhmw.rainward-avatar-unavailable");
                    return;
                }
                var storyCampaign = MeadowBridge.Member(gameMode, "currentCampaign") as SlugcatStats.Name;
                if (storyCampaign != null) campaign = storyCampaign.value;
                else
                {
                    mode = "meadow";
                    var loadAs = gameMode.GetType().GetMethod("LoadWorldAs", new[] { typeof(RainWorldGame) });
                    if (loadAs?.Invoke(gameMode, new object[] { game }) is SlugcatStats.Name worldAs)
                        campaign = worldAs.value;
                }
            }
            else
            {
                // In local co-op prefer the camera's player, then the first living local player.
                var followed = game.cameras?.Length > 0 ? game.cameras[0].followAbstractCreature : null;
                if (followed?.realizedCreature is Player followedPlayer && !followedPlayer.dead)
                    local = followed;
                if (local == null)
                    foreach (var candidate in game.Players)
                        if (candidate.realizedCreature is Player player && !player.dead)
                        {
                            local = candidate;
                            break;
                        }
            }
            var creature = local?.realizedCreature;
            if (creature?.room == null || creature.inShortcut || creature.mainBodyChunk == null)
            {
                Notify(game, "littlhmw.rainward-position-unavailable");
                return;
            }
            try
            {
                var snapshot = SnapshotBuilder.Capture(game, lobby, gameMode, local, campaign, mode);
                // The web map keeps its own route control. This Remix option
                // only changes the in-game HUD map overlay.
                snapshot.route = true;
                var json = SnapshotProtocol.Json(snapshot);
                var url = SnapshotProtocol.Url(json);
                if (url.Length > SnapshotProtocol.MaxUrlChars)
                {
                    var directory = Path.Combine(Application.persistentDataPath, "Rainward");
                    Directory.CreateDirectory(directory);
                    var path = Path.Combine(directory, "snapshot.json");
                    File.WriteAllBytes(path, json);
                    Notify(game, "littlhmw.rainward-snapshot-exported", path);
                    Logger.LogInfo("Rainward snapshot exported to " + path);
                    Application.OpenURL(LinkProtocol.Website + "#sync=file");
                    return;
                }
                Notify(game, "littlhmw.rainward-opening-snapshot");
                Application.OpenURL(url);
            }
            catch (Exception error)
            {
                Logger.LogError(error);
                Notify(game, "littlhmw.rainward-snapshot-unavailable", error.Message);
            }
        }

        private static void Notify(RainWorldGame game, string message, string detail = null)
        {
            if (game.cameras?.Length > 0)
                game.cameras[0].hud?.textPrompt?.AddMessage(OptionInterface.Translate(message) + (detail == null ? "" : " " + detail), 0, 180, false, false);
        }
    }
}
