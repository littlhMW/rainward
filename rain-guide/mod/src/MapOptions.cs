using Menu.Remix.MixedUI;
using UnityEngine;

namespace WhereShouldIGo
{
    internal sealed class MapOptions : OptionInterface
    {
        internal readonly Configurable<KeyCode> OpenKey;
        internal readonly Configurable<int> HoldTenths;

        internal MapOptions()
        {
            OpenKey = config.Bind("OpenMapKey", KeyCode.G,
                new ConfigurableInfo("按住此键打开当前位置网页 / Hold to open your current position."));
            HoldTenths = config.Bind("HoldTenths", 6,
                new ConfigurableInfo("按住时长，单位 0.1 秒 / Hold duration in tenths of a second.",
                    new ConfigAcceptableRange<int>(2, 20)));
        }

        public override void Initialize()
        {
            base.Initialize();
            Tabs = new[] { new OpTab(this, "地图 / Map") };
            Tabs[0].AddItems(
                new OpLabel(new Vector2(20, 535), new Vector2(560, 40), "我该去哪儿 / Where Should I Go", FLabelAlignment.Center, true),
                new OpLabel(25, 465, "打开地图 / Open map"),
                new OpKeyBinder(OpenKey, new Vector2(330, 460), new Vector2(180, 30), false),
                new OpLabel(25, 385, "按住时长 ×0.1 秒 / Hold ×0.1 s"),
                new OpSlider(HoldTenths, new Vector2(330, 385), 200),
                new OpLabel(new Vector2(25, 255), new Vector2(550, 85),
                    "默认按住 G 0.6 秒，每次松开后才可再次打开。\nDefault: hold G for 0.6 s; release before opening again.\n浏览器显示打开时的位置，移动后再次按键更新。\nThe map is a position snapshot; hold again to update.", FLabelAlignment.Left),
                new OpLabel(new Vector2(25, 130), new Vector2(550, 105),
                    "如有新增或修改地形的 MOD，地图信息可能不准确。\n本工具不扫描地形 MOD，不改存档，不使用剪贴板。\nTerrain mods may make map information inaccurate.\nNo terrain mod scanning, save changes or clipboard access.\n联机时浏览器打开不会暂停世界，请先找安全位置。\nOpening a browser does not pause an online world.", FLabelAlignment.Left)
            );
        }
    }
}
