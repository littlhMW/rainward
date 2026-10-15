using System;
using System.Reflection;

namespace Rainward
{
    // This feature is opt-in. When it is off, the mod never reads or changes
    // the Overseer AI state beyond the normal story guidance used for the map.
    internal static class OverseerPresence
    {
        private const float RefreshSeconds = 1.25f;
        private static readonly BindingFlags Instance = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
        private static readonly FieldInfo PlayerGuideField = typeof(OverseersWorldAI).GetField("playerGuide", Instance);
        private static readonly FieldInfo AbstractAiField = typeof(AbstractCreature).GetField("abstractAI", Instance);
        private static readonly PropertyInfo PlayerGuideProperty = typeof(OverseerAbstractAI).GetProperty("playerGuide", Instance);
        private static readonly MethodInfo BringToRoomMethod = typeof(OverseerAbstractAI).GetMethod(
            "BringToRoomAndGuidePlayer", Instance, null, new[] { typeof(int) }, null);

        private static RainWorldGame game;
        private static float nextRequest;

        internal static void Update(RainWorldGame currentGame, bool enabled, float now)
        {
            if (!enabled)
            {
                if (game != null) Reset();
                return;
            }

            if (!IsStory(currentGame))
            {
                Reset();
                return;
            }

            if (!Object.ReferenceEquals(game, currentGame))
            {
                game = currentGame;
                nextRequest = 0f;
            }
            if (now < nextRequest) return;

            try
            {
                var player = LocalPlayer(currentGame);
                var room = player?.Room;
                if (room == null || room.index < 0)
                {
                    nextRequest = now + RefreshSeconds;
                    return;
                }

                var worldAi = currentGame.world?.overseersWorldAI;
                var guide = PlayerGuideField?.GetValue(worldAi);
                var abstractAi = AbstractAiField?.GetValue(guide);
                if (guide == null || abstractAi == null || BringToRoomMethod == null
                    || !typeof(OverseerAbstractAI).IsInstanceOfType(abstractAi))
                {
                    nextRequest = now + RefreshSeconds;
                    return;
                }

                if (PlayerGuideProperty != null && PlayerGuideProperty.GetValue(abstractAi, null) is bool isPlayerGuide && !isPlayerGuide)
                {
                    nextRequest = now + RefreshSeconds;
                    return;
                }

                BringToRoomMethod.Invoke(abstractAi, new object[] { room.index });
            }
            catch
            {
                // The game and other mods can replace the Overseer AI while a
                // room is loading. Retry on the next interval without affecting
                // the base game's update loop.
            }
            nextRequest = now + RefreshSeconds;
        }

        internal static void Reset()
        {
            game = null;
            nextRequest = 0f;
        }

        private static AbstractCreature LocalPlayer(RainWorldGame currentGame)
        {
            var followed = currentGame.cameras?.Length > 0 ? currentGame.cameras[0].followAbstractCreature : null;
            if (followed?.realizedCreature is Player followedPlayer && !followedPlayer.dead) return followed;
            foreach (var candidate in currentGame.Players)
                if (candidate?.realizedCreature is Player player && !player.dead) return candidate;
            return null;
        }

        private static bool IsStory(RainWorldGame currentGame) => currentGame != null
            && currentGame.IsStorySession && currentGame.GetStorySession?.saveState != null;
    }
}
