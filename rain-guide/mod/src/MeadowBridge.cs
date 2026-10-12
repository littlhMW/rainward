using System;
using System.Collections;
using System.Reflection;

namespace Rainward
{
    // Only the documented Meadow API is inspected; never enumerate installed terrain mods.
    // Verified against Rain-Meadow 0cade766a851405bea89c7475ae88480c59df083.
    internal static class MeadowBridge
    {
        private const BindingFlags Flags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static;

        internal static object Member(object instance, string name)
        {
            if (instance == null) return null;
            var type = instance.GetType();
            var field = type.GetField(name, Flags);
            return field != null ? field.GetValue(instance) : type.GetProperty(name, Flags)?.GetValue(instance, null);
        }

        internal static bool TryLocalAvatar(object lobby, out AbstractCreature creature, out object gameMode)
        {
            creature = null;
            gameMode = Member(lobby, "gameMode");
            var avatars = Member(gameMode, "avatars") as IEnumerable;
            if (avatars == null) return false;
            foreach (var online in avatars)
            {
                // Fail closed on renamed APIs or transfer/spectator state, never choose a remote player.
                if (!(Member(online, "isMine") is bool mine) || !mine) continue;
                if (!(Member(online, "isAvatar") is bool avatar) || !avatar) continue;
                var candidate = Member(online, "abstractCreature") as AbstractCreature;
                if (candidate?.realizedCreature == null || candidate.realizedCreature.dead) continue;
                if (candidate.realizedCreature.room == null || candidate.realizedCreature.inShortcut) continue;
                creature = candidate;
                return true;
            }
            return false;
        }

        internal static bool TryGetLobby(out object lobby)
        {
            lobby = null;
            // The upstream csproj's assembly name is "Rain Meadow", with a space.
            var manager = Type.GetType("RainMeadow.OnlineManager, Rain Meadow", false);
            if (manager == null)
            {
                // Distinguish an absent plugin from a loaded plugin with a renamed
                // manager API. The latter must not fall back to a remote host.
                return Type.GetType("RainMeadow.RainMeadow, Rain Meadow", false) == null;
            }
            var field = manager.GetField("lobby", Flags);
            if (field == null) return false; // API changed: do not silently use a remote player.
            lobby = field.GetValue(null);
            return true;
        }
    }
}
