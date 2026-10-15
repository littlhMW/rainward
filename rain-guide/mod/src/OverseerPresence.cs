using System;
using System.Reflection;

namespace Rainward
{
    // This feature is opt-in. While off, the mod only records native departure
    // directives so enabling it later cannot override one that is still active.
    internal static class OverseerPresence
    {
        private const float RefreshSeconds = 10f;
        private static readonly BindingFlags Instance = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
        private static readonly PropertyInfo PlayerGuideProperty = typeof(OverseerAbstractAI).GetProperty("playerGuide", Instance);
        private static readonly MethodInfo BringToRoomMethod = typeof(OverseerAbstractAI).GetMethod(
            "BringToRoomAndGuidePlayer", Instance, null, new[] { typeof(int) }, null);

        private static RainWorldGame game;
        private static World world;
        private static AbstractCreature trackedGuide;
        private static OverseerAbstractAI gameOrderedAway;
        private static OverseerAbstractAI modDirectedGuide;
        private static int modTargetRoom = -1;
        private static float nextRequest;

        internal static void Update(RainWorldGame currentGame, bool enabled, float now)
        {
            if (!IsStory(currentGame))
            {
                Reset();
                return;
            }

            if (!Object.ReferenceEquals(game, currentGame))
            {
                Reset();
                game = currentGame;
                nextRequest = 0f;
            }

            if (!Object.ReferenceEquals(world, currentGame.world))
            {
                world = currentGame.world;
                trackedGuide = null;
                gameOrderedAway = null;
                modDirectedGuide = null;
                modTargetRoom = -1;
                nextRequest = 0f;
            }

            var worldAi = currentGame.world?.overseersWorldAI;
            var guide = worldAi?.playerGuide;
            var abstractAi = guide?.abstractAI as OverseerAbstractAI;
            if (!Object.ReferenceEquals(trackedGuide, guide))
            {
                trackedGuide = guide;
                gameOrderedAway = null;
                modDirectedGuide = null;
                modTargetRoom = -1;
                nextRequest = 0f;
            }

            // The game uses PlayerGuideGoAway for story and AI decisions.
            // Respect it until the game resumes guiding or replaces the guide.
            if (Object.ReferenceEquals(gameOrderedAway, abstractAi))
            {
                if (abstractAi != null && abstractAi.playerGuide && !abstractAi.goToPlayer)
                    return;
                gameOrderedAway = null;
            }

            if (!enabled) return;
            if (now < nextRequest) return;
            nextRequest = now + RefreshSeconds;

            try
            {
                var player = LocalPlayer(currentGame);
                var room = player?.Room;
                if (room == null || room.index < 0)
                {
                    return;
                }

                if (guide == null || abstractAi == null || BringToRoomMethod == null
                    || !guide.state.alive || guide.slatedForDeletion)
                {
                    return;
                }

                if (PlayerGuideProperty != null && PlayerGuideProperty.GetValue(abstractAi, null) is bool isPlayerGuide && !isPlayerGuide)
                {
                    return;
                }

                var destinationRoom = abstractAi.destination.room;
                var previousModTarget = Object.ReferenceEquals(modDirectedGuide, abstractAi)
                    ? modTargetRoom : -1;
                if (destinationRoom >= 0 && destinationRoom != room.index
                    && destinationRoom != previousModTarget && guide.pos.room != destinationRoom)
                {
                    // Let the game's existing room destination finish first.
                    return;
                }

                BringToRoomMethod.Invoke(abstractAi, new object[] { room.index });
                modDirectedGuide = abstractAi;
                modTargetRoom = room.index;
            }
            catch
            {
                // The game and other mods can replace the Overseer AI while a
                // room is loading. Retry on the next interval without affecting
                // the base game's update loop.
            }
        }

        internal static void GameRequestedDeparture(OverseerAbstractAI ai)
        {
            if (ai?.playerGuide == true) gameOrderedAway = ai;
        }

        internal static void Reset()
        {
            game = null;
            world = null;
            trackedGuide = null;
            gameOrderedAway = null;
            modDirectedGuide = null;
            modTargetRoom = -1;
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
