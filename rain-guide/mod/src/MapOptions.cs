using Menu.Remix.MixedUI;
using UnityEngine;

namespace WhereShouldIGo
{
    internal sealed class MapOptions : OptionInterface
    {
        internal readonly Configurable<KeyCode> OpenKey;
        internal readonly Configurable<int> HoldTenths;
        internal readonly Configurable<bool> EnableRouteHighlight;
        internal readonly Configurable<bool> EnableGNavigation;

        internal MapOptions()
        {
            OpenKey = config.Bind("OpenMapKey", KeyCode.G,
                new ConfigurableInfo("littlhmw.whereshouldigo-open-map"));
            HoldTenths = config.Bind("HoldTenths", 6,
                new ConfigurableInfo("littlhmw.whereshouldigo-hold-duration",
                    new ConfigAcceptableRange<int>(2, 20)));
            EnableRouteHighlight = config.Bind("EnableRouteHighlight", true,
                new ConfigurableInfo("littlhmw.whereshouldigo-highlight-route"));
            EnableGNavigation = config.Bind("EnableGNavigation", true,
                new ConfigurableInfo("littlhmw.whereshouldigo-g-navigation"));
        }

        public override void Initialize()
        {
            base.Initialize();
            Tabs = new[] { new OpTab(this, Translate("littlhmw.whereshouldigo-map")) };
            Tabs[0].AddItems(
                new OpLabel(new Vector2(20, 535), new Vector2(560, 40), Translate("littlhmw.whereshouldigo-name"), FLabelAlignment.Center, true),
                new OpLabel(25, 465, Translate("littlhmw.whereshouldigo-open-map-label")),
                new OpKeyBinder(OpenKey, new Vector2(330, 460), new Vector2(180, 30), false)
                    { description = Translate("littlhmw.whereshouldigo-open-map") },
                new OpLabel(25, 385, Translate("littlhmw.whereshouldigo-hold-duration-label")),
                new OpSlider(HoldTenths, new Vector2(330, 385), 200)
                    { description = Translate("littlhmw.whereshouldigo-hold-duration") },
                new OpCheckBox(EnableRouteHighlight, new Vector2(25, 320))
                    { description = Translate("littlhmw.whereshouldigo-highlight-route") },
                new OpLabel(60, 320, Translate("littlhmw.whereshouldigo-highlight-route-label")),
                new OpCheckBox(EnableGNavigation, new Vector2(25, 285))
                    { description = Translate("littlhmw.whereshouldigo-g-navigation") },
                new OpLabel(60, 285, Translate("littlhmw.whereshouldigo-g-navigation-label")),
                new OpLabel(new Vector2(25, 190), new Vector2(550, 85),
                    Translate("littlhmw.whereshouldigo-default-help") + "\n" +
                    Translate("littlhmw.whereshouldigo-snapshot-help"), FLabelAlignment.Left),
                new OpLabel(new Vector2(25, 65), new Vector2(550, 105),
                    Translate("littlhmw.whereshouldigo-terrain-warning") + "\n" +
                    Translate("littlhmw.whereshouldigo-no-mod-scan") + "\n" +
                    Translate("littlhmw.whereshouldigo-browser-online"), FLabelAlignment.Left)
            );
        }
    }
}
