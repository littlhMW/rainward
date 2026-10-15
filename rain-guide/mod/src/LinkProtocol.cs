using System;
using System.Globalization;

namespace Rainward
{
    internal static class LinkProtocol
    {
        internal const string Website = "https://littlhmw.github.io/rainward/test/";

        internal static string Character(string internalName)
        {
            switch (internalName)
            {
                case "White": return "Survivor";
                case "Yellow": return "Monk";
                case "Red": return "Hunter";
                case "Spear": return "Spearmaster";
                // Ext_SlugcatStatsName.OnlineSessionPlayer.value is "MeadowOnline".
                // Use the base-world reference for Meadow's default free-roam timeline.
                case "MeadowOnline": return "Survivor";
                case "OnlineSessionPlayer": return "Survivor";
                default: return string.IsNullOrWhiteSpace(internalName) ? "Unknown" : internalName;
            }
        }

        internal static string Build(string campaign, string region, string room, int x, int y,
            string avatar, string mode, bool downpour, float? px = null, float? py = null,
            float? cx = null, float? cy = null)
        {
            var url = Website + "#v=1&character=" + Uri.EscapeDataString(Character(campaign))
                + "&region=" + Uri.EscapeDataString(region ?? "")
                + "&room=" + Uri.EscapeDataString(room ?? "")
                + "&x=" + x.ToString(CultureInfo.InvariantCulture)
                + "&y=" + y.ToString(CultureInfo.InvariantCulture)
                + "&avatar=" + Uri.EscapeDataString(avatar ?? "")
                + "&mode=" + Uri.EscapeDataString(mode ?? "story")
                + "&dlc=" + (downpour ? "downpour" : "base");
            if (px.HasValue && py.HasValue && cx.HasValue && cy.HasValue)
                url += "&px=" + px.Value.ToString("0.###", CultureInfo.InvariantCulture)
                    + "&py=" + py.Value.ToString("0.###", CultureInfo.InvariantCulture)
                    + "&cx=" + cx.Value.ToString("0.###", CultureInfo.InvariantCulture)
                    + "&cy=" + cy.Value.ToString("0.###", CultureInfo.InvariantCulture);
            return url;
        }
    }

    // A held key opens once. Leaving the game/focus requires release before rearming.
    internal sealed class HoldGesture
    {
        private float startedAt = -1f;
        private bool latched;

        internal void Suspend()
        {
            startedAt = -1f;
            latched = true;
        }

        internal bool Tick(bool held, bool available, float now, float holdSeconds)
        {
            // Unity may report every key as released while unfocused. Only accept
            // an observed release after returning to active, focused gameplay.
            if (!available)
            {
                Suspend();
                return false;
            }
            if (!held)
            {
                startedAt = -1f;
                latched = false;
                return false;
            }
            if (latched) return false;
            if (startedAt < 0f) startedAt = now;
            if (now - startedAt < holdSeconds) return false;
            latched = true;
            return true;
        }
    }
}
