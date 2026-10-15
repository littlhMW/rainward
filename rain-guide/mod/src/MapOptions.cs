using Menu.Remix.MixedUI;
using UnityEngine;

namespace Rainward
{
    internal sealed class MapOptions : OptionInterface
    {
        internal readonly Configurable<KeyCode> OpenKey;
        internal readonly Configurable<int> HoldTenths;
        internal readonly Configurable<bool> EnableRouteHighlight;
        internal readonly Configurable<bool> LocateSpecificRoom;
        internal readonly Configurable<bool> EnableGNavigation;
        internal readonly Configurable<bool> GuideWhenBlocked;
        internal readonly Configurable<int> GuideAfterCycles;
        internal readonly Configurable<bool> GuideInterestPoints;
        internal readonly Configurable<bool> KeepOverseerNearby;

        internal MapOptions()
        {
            OpenKey = config.Bind("OpenMapKey", KeyCode.G,
                new ConfigurableInfo("littlhmw.rainward-open-map"));
            HoldTenths = config.Bind("HoldTenths", 6,
                new ConfigurableInfo("littlhmw.rainward-hold-duration",
                    new ConfigAcceptableRange<int>(2, 20)));
            EnableRouteHighlight = config.Bind("EnableRouteHighlight", true,
                new ConfigurableInfo("littlhmw.rainward-highlight-route"));
            LocateSpecificRoom = config.Bind("LocateSpecificRoom", GuidanceRoutePlanner.DefaultLocateSpecificRoom,
                new ConfigurableInfo("littlhmw.rainward-specific-room"));
            EnableGNavigation = config.Bind("EnableGNavigation", true,
                new ConfigurableInfo("littlhmw.rainward-g-navigation"));
            GuideWhenBlocked = config.Bind("GuideWhenBlocked", false,
                new ConfigurableInfo("littlhmw.rainward-guide-when-blocked"));
            GuideAfterCycles = config.Bind("GuideAfterCycles", GuidanceProgress.DefaultSleepsBeforeGuidance,
                new ConfigurableInfo("littlhmw.rainward-guide-after-cycles",
                    new ConfigAcceptableRange<int>(1, 10)));
            GuideInterestPoints = config.Bind("GuideInterestPoints", false,
                new ConfigurableInfo("littlhmw.rainward-guide-interest-points"));
            KeepOverseerNearby = config.Bind("KeepOverseerNearby", false,
                new ConfigurableInfo("littlhmw.rainward-keep-overseer-nearby"));
        }

        public override void Initialize()
        {
            base.Initialize();
            Tabs = new[] { new OpTab(this, Translate("littlhmw.rainward-map")) };
            Tabs[0].AddItems(
                new OpLabel(new Vector2(20, 540), new Vector2(560, 40), Translate("littlhmw.rainward-name"), FLabelAlignment.Center, true),
                new OpLabel(25, 470, Translate("littlhmw.rainward-open-map-label")),
                new OpKeyBinder(OpenKey, new Vector2(330, 465), new Vector2(180, 30), false)
                    { description = Translate("littlhmw.rainward-open-map") },
                new OpLabel(25, 420, Translate("littlhmw.rainward-hold-duration-label")),
                new OpSlider(HoldTenths, new Vector2(330, 420), 200)
                    { description = Translate("littlhmw.rainward-hold-duration") },
                new OpCheckBox(EnableRouteHighlight, new Vector2(25, 365))
                    { description = Translate("littlhmw.rainward-highlight-route") },
                new OpLabel(60, 365, Translate("littlhmw.rainward-highlight-route-label")),
                new OpCheckBox(LocateSpecificRoom, new Vector2(25, 330))
                    { description = Translate("littlhmw.rainward-specific-room") },
                new OpLabel(60, 330, Translate("littlhmw.rainward-specific-room-label")),
                new OpCheckBox(EnableGNavigation, new Vector2(25, 295))
                    { description = Translate("littlhmw.rainward-g-navigation") },
                new OpLabel(60, 295, Translate("littlhmw.rainward-g-navigation-label")),
                new OpCheckBox(GuideWhenBlocked, new Vector2(25, 260))
                    { description = Translate("littlhmw.rainward-guide-when-blocked") },
                new OpLabel(60, 260, Translate("littlhmw.rainward-guide-when-blocked-label")),
                new OpLabel(25, 220, Translate("littlhmw.rainward-guide-after-cycles-label")),
                new OpSlider(GuideAfterCycles, new Vector2(330, 220), 200)
                    { description = Translate("littlhmw.rainward-guide-after-cycles") },
                new OpCheckBox(GuideInterestPoints, new Vector2(25, 180))
                    { description = Translate("littlhmw.rainward-guide-interest-points") },
                new OpLabel(60, 180, Translate("littlhmw.rainward-guide-interest-points-label")),
                new OpCheckBox(KeepOverseerNearby, new Vector2(25, 145))
                    { description = Translate("littlhmw.rainward-keep-overseer-nearby") },
                new OpLabel(60, 145, Translate("littlhmw.rainward-keep-overseer-nearby-label")),
                new OpLabel(new Vector2(25, 80), new Vector2(550, 50),
                    Translate("littlhmw.rainward-default-help") + "\n" +
                    Translate("littlhmw.rainward-snapshot-help"), FLabelAlignment.Left),
                new OpLabel(new Vector2(25, 5), new Vector2(550, 65),
                    Translate("littlhmw.rainward-terrain-warning") + "\n" +
                    Translate("littlhmw.rainward-no-mod-scan") + "\n" +
                    Translate("littlhmw.rainward-browser-online"), FLabelAlignment.Left)
            );
        }
    }
}
