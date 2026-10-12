using System;
using BepInEx;
using RWCustom;
using UnityEngine;

namespace WhereShouldIGo
{
    [BepInPlugin(ModId, "Where Should I Go", "1.0.0")]
    [BepInDependency("henpemaz.rainmeadow", BepInDependency.DependencyFlags.SoftDependency)]
    public sealed class Plugin : BaseUnityPlugin
    {
        public const string ModId = "littlhmw.whereshouldigo";
        private readonly HoldGesture hold = new HoldGesture();
        private MapOptions options;
        private bool registered;
        private float nextRegistrationAttempt;
        private float nextErrorLog;
        private RainWorldGame previousGame;

        private void OnEnable()
        {
            hold.Suspend();
            On.RainWorld.OnModsInit += ModsInit;
        }

        private void OnDisable()
        {
            hold.Suspend();
            previousGame = null;
            On.RainWorld.OnModsInit -= ModsInit;
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
            if (options == null) options = new MapOptions();
            registered = MachineConnector.SetRegisteredOI(ModId, options);
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
                    hold.Suspend();
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

        private void OpenMap(RainWorldGame game)
        {
            AbstractCreature local = null;
            string campaign = game.StoryCharacter?.value;
            string mode = "story";
            if (!MeadowBridge.TryGetLobby(out var lobby))
            {
                Notify(game, "雨甸接口已变化，无法确认本地角色 / Meadow API changed; local player unavailable.");
                return;
            }
            if (lobby != null)
            {
                if (!MeadowBridge.TryLocalAvatar(lobby, out local, out var gameMode))
                {
                    Notify(game, "本地角色暂不可定位，请离开管道后重试 / Local avatar unavailable; retry outside a pipe.");
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
                Notify(game, "当前位置暂不可用，请进入房间后重试 / Position unavailable; retry inside a room.");
                return;
            }
            var room = creature.room;
            var tile = room.GetTilePosition(creature.mainBodyChunk.pos);
            var avatarName = creature is Player slugcat ? slugcat.SlugCatClass?.value : local.creatureTemplate.type.value;
            float? cameraX = null, cameraY = null;
            if (room.cameraPositions?.Length > 0)
            {
                var cameraMin = room.cameraPositions[0];
                foreach (var position in room.cameraPositions)
                    cameraMin = Vector2.Min(cameraMin, position);
                cameraX = cameraMin.x;
                cameraY = cameraMin.y;
            }
            var url = LinkProtocol.Build(campaign, room.world.region?.name, room.abstractRoom.name,
                tile.x, tile.y, avatarName, mode, ModManager.MSC,
                creature.mainBodyChunk.pos.x, creature.mainBodyChunk.pos.y, cameraX, cameraY);
            Notify(game, "正在打开地图；地形 MOD 可能使信息不准确 / Opening map; terrain mods may make it inaccurate.");
            Application.OpenURL(url);
        }

        private static void Notify(RainWorldGame game, string message)
        {
            if (game.cameras?.Length > 0)
                game.cameras[0].hud?.textPrompt?.AddMessage(message, 0, 180, false, false);
        }
    }
}
