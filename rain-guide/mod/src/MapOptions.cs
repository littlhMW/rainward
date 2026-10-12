using Menu.Remix.MixedUI;
using UnityEngine;

namespace Rainward
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
                new ConfigurableInfo("littlhmw.rainward-open-map"));
            HoldTenths = config.Bind("HoldTenths", 6,
                new ConfigurableInfo("littlhmw.rainward-hold-duration",
                    new ConfigAcceptableRange<int>(2, 20)));
            EnableRouteHighlight = config.Bind("EnableRouteHighlight", true,
                new ConfigurableInfo("littlhmw.rainward-highlight-route"));
            EnableGNavigation = config.Bind("EnableGNavigation", true,
                new ConfigurableInfo("littlhmw.rainward-g-navigation"));
        }

        public override void Initialize()
        {
            base.Initialize();
            Tabs = new[] { new OpTab(this, Translate("littlhmw.rainward-map")) };
            Tabs[0].AddItems(
                new OpLabel(new Vector2(20, 535), new Vector2(560, 40), Translate("littlhmw.rainward-name"), FLabelAlignment.Center, true),
                new OpLabel(25, 465, Translate("littlhmw.rainward-open-map-label")),
                new OpKeyBinder(OpenKey, new Vector2(330, 460), new Vector2(180, 30), false)
                    { description = Translate("littlhmw.rainward-open-map") },
                new OpLabel(25, 385, Translate("littlhmw.rainward-hold-duration-label")),
                new OpSlider(HoldTenths, new Vector2(330, 385), 200)
                    { description = Translate("littlhmw.rainward-hold-duration") },
                new OpCheckBox(EnableRouteHighlight, new Vector2(25, 320))
                    { description = Translate("littlhmw.rainward-highlight-route") },
                new OpLabel(60, 320, Translate("littlhmw.rainward-highlight-route-label")),
                new OpCheckBox(EnableGNavigation, new Vector2(25, 285))
                    { description = Translate("littlhmw.rainward-g-navigation") },
                new OpLabel(60, 285, Translate("littlhmw.rainward-g-navigation-label")),
                new OpLabel(new Vector2(25, 190), new Vector2(550, 85),
                    Translate("littlhmw.rainward-default-help") + "\n" +
                    Translate("littlhmw.rainward-snapshot-help"), FLabelAlignment.Left),
                new OpLabel(new Vector2(25, 65), new Vector2(550, 105),
                    Translate("littlhmw.rainward-terrain-warning") + "\n" +
                    Translate("littlhmw.rainward-no-mod-scan") + "\n" +
                    Translate("littlhmw.rainward-browser-online"), FLabelAlignment.Left)
            );
        }
    }
}
