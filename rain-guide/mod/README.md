# 雨间：我该去哪 | Rainward: Where to Go

《雨世界》PC 版 Remix 工具。进入游戏后，在房间内按住 **G 约 0.6 秒**，即可在浏览器中打开[雨间](https://littlhmw.github.io/rainward/)，查看当前位置、探索记录和可读取的玩家位置，并获得逐步展开的故事线索。

## 安装

1. 下载 [Rainward-WhereToGo.zip](https://littlhmw.github.io/rainward/downloads/Rainward-WhereToGo.zip) 并解压。
2. 将其中的 `rainward` 文件夹放入游戏目录 `RainWorld_Data/StreamingAssets/mods/`。
3. 在 Remix 中启用「雨间：我该去哪 / Rainward: Where to Go」，按提示重启游戏。

更新时关闭游戏，用新版本替换 `rainward` 文件夹。由旧版 `whereshouldigo` 升级时，首次启动会迁移按键与开关配置；确认新版本运行正常后即可删除旧文件夹。Remix 中可以修改打开地图的按键和长按时间，并分别启用或停用游戏内地图高亮与 G 键导航。高亮只作用于游戏内 HUD 地图，不改变地形、入口或出口。

## 地图与位置

原版和 Downpour 地图保留房间、连接、地形、拖拽缩放与房间点击。未探索房间默认遮罩；可导入游戏快照显示已访问房间，也可单独调整房间遮罩。普通区域名默认显示，Wiki 标记为剧透的区域名默认隐藏。Watcher 提供故事线索和[原作者地图入口](https://alduris.github.io/watcher-map/)。

按住快捷键时生成一次位置快照，不会持续追踪游戏。浏览器打开时，联机游戏仍会继续运行，请先停在安全位置。使用新增或修改地形、房间或连接的 Mod 时，地图信息可能不准确；本工具不扫描已安装的 Mod。

打开网页时仍会显示网页自身的推荐路线。启用 Remix 的「启用高亮路线」后，长按游戏地图键打开的 HUD 地图会以黄色标出当前区域内通往推荐方向的连接；关闭后不添加该叠加层。关闭「启用 G 键导航」后，长按 G 不会打开网页地图。

雨甸中会显示当前可读取的玩家位置，探索记录只使用房主存档。客机收到的房主记录可能晚于当前周期；自由模式可以提供位置，但没有可确认的探索和剧情记录。无法读取的位置会标为未知。

## 数据与隐私

Mod 不修改游戏存档，不读取或写入剪贴板，也不发送 Steam ID。网页需要网络连接。游戏快照通过网址片段传入页面；网页脚本可以读取，浏览器历史和分享链接可能保留位置、显示名和探索记录。

快照过长时，完整数据会写入游戏数据目录 `Rainward/snapshot.json`，网页可从数据面板导入。Windows 常见位置为 `%USERPROFILE%/AppData/LocalLow/Videocult/Rain World/Rainward/snapshot.json`。

## 卸载与清理

1. 在 Remix 中禁用本 Mod，退出游戏。
2. 删除 `RainWorld_Data/StreamingAssets/mods/rainward/`。这不会影响游戏存档或其他 Mod。
3. 如需移除按键配置，单独删除 `%USERPROFILE%/AppData/LocalLow/Videocult/Rain World/ModConfigs/littlhmw.rainward.txt`。若曾从旧版升级并希望一并清理旧配置，可删除同目录中的 `littlhmw.whereshouldigo.txt`。不要删除整个 `ModConfigs` 或游戏数据目录。
4. 如曾导出长快照，删除 `Rainward/snapshot.json`；文件夹已空时可一并删除。
5. 网页进度保存在浏览器中，可在网页数据面板清除；下载的 ZIP 可直接删除。

## English

A Remix tool for the PC version of *Rain World*. Hold **G for about 0.6 seconds** in a room to open [Rainward](https://littlhmw.github.io/rainward/) with a location snapshot, exploration records, readable player positions, and layered story clues. Change the key and hold duration in Remix.

Base-game and Downpour maps retain rooms, connections, terrain, dragging, zooming, and room selection. Unexplored rooms are masked by default and can be revealed from a game snapshot or adjusted individually. Watcher provides story clues and a link to its [original map](https://alduris.github.io/watcher-map/).

The mod does not modify saves, access the clipboard, send Steam IDs, or continuously track the game. The website requires an internet connection. In Rain Meadow, exploration uses the host's save; the current cycle may not yet be synchronized. Mods that change terrain, rooms, or connections can make map information inaccurate.

The web map keeps its own route display. With “Highlight recommended route” enabled, the in-game HUD map marks connections toward the recommended direction in yellow; disabling it removes only that overlay. “Enable G-key navigation” controls opening the web map. Neither option changes terrain, entrances, or exits.

When upgrading from an older release, disable the mod, replace the old `whereshouldigo` folder with `rainward`, and launch the game once to migrate the key and toggle settings. Remove the old folder after confirming that the new version works.

To uninstall, disable the mod and delete `RainWorld_Data/StreamingAssets/mods/rainward/`. Remove the optional `ModConfigs/littlhmw.rainward.txt` file; if the installation was migrated from an older release, you may also remove `ModConfigs/littlhmw.whereshouldigo.txt`. Remove `Rainward/snapshot.json` separately if present. Browser progress can be cleared from the website's data panel.

## 来源与许可

Rain World、游戏内容与第三方地图素材归各自权利人所有。本项目代码及第三方内容的许可范围见[许可与来源声明](../THIRD-PARTY-NOTICES.md)。
