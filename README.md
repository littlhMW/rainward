# 雨间：我该去哪 | Rainward: Where to Go

![雨间：我该去哪](rain-guide/mod/thumbnail.png)

《雨世界》的交互地图与无剧透探索指南。雨间保留原地图的房间、连接、地形、拖拽、缩放和房间交互，以逐层故事线索提供前进方向。

**[打开网页](https://littlhmw.github.io/rainward/)** · **[GitHub 项目](https://github.com/littlhMW/rainward)** · **[Star 项目](https://github.com/littlhMW/rainward/star)** · **[下载 Mod](https://littlhmw.github.io/rainward/downloads/WhereShouldIGo.zip)**

## 功能

- 原版与 Downpour 使用 [Rain World Map](https://rain-world-map.github.io/) 的开源地图前端，保留真实房间、房间连接、地形、生物图层、拖拽缩放和房间点击。
- 地图默认按房间遮罩未探索地形，同时保留节点与出口连接。导入游戏快照后，已访问房间会显示；每个房间都可以单独显示或遮罩，也可以一键显示完整区域。
- 地名直接显示在地图上。普通区域名默认可见；Wiki 导航模板归入剧透分组的 17 个区域名默认隐藏，可以在设置中开启。房间代码始终可用于定位。
- 支持九位常规剧情角色。故事线索按层级展开，先给出方向，再提供目的地和路线参考；玩家可以自行确认已完成的线索。
- 推荐路线根据地图连接、区域方向和当前角色提供参考。门槛、单向通路、角色能力及地形 Mod 可能影响实际通行。
- Watcher 保留故事线索，并通过原作者网站打开 Watcher 地图。
- 可选 Mod 默认按住 **G 0.6 秒**，在浏览器中打开当前地点快照。按键和按住时长可以在 Remix 中修改。
- 雨甸中显示能够读取的玩家位置，探索进度只使用房主记录。本工具不会扫描地形 Mod；新增或修改地形、房间、连接的 Mod 可能使地图与提示不准确。

## 使用 Mod

从上方链接下载压缩包，解压后将 `whereshouldigo` 文件夹放入 Rain World 的 `RainWorld_Data/StreamingAssets/mods/`，在 Remix 中启用「雨间：我该去哪 / Rainward: Where to Go」。进入游戏后，在房间内按住 G 即可打开网页快照。

Mod 不修改存档、不读取或写入剪贴板，也不会持续追踪位置。网页需要网络连接；地图与快照数据仅在打开页面时使用。

## 卸载 Mod

在 Remix 中停用「雨间：我该去哪 / Rainward: Where to Go」并关闭游戏，删除 `RainWorld_Data/StreamingAssets/mods/whereshouldigo/` 文件夹即可。若要同时移除按键配置，再删除游戏数据目录中的 `ModConfigs/littlhmw.whereshouldigo.txt`；不要删除其他 Mod 配置或游戏存档。浏览器中的雨间数据可在网页数据面板中清除。

## 语言与资料

网页默认使用简体中文，可切换 English。地图、角色和区域资料参考 [Rain World Wiki（简体中文）](https://rainworld.miraheze.org/wiki/Rain_World_Wiki/zh-hans) 与 [Rain World Wiki](https://rainworld.miraheze.org/wiki/Rain_World_Wiki)。

- [桌面雨世界模拟](https://github.com/littlhMW/desktop-rainworld-slugcat-simulation)
- [原地图](https://rain-world-map.github.io/)
- [来源与许可](rain-guide/THIRD-PARTY-NOTICES.md)

## English

Rainward: Where to Go is an interactive *Rain World* map and spoiler-aware exploration guide. It preserves the original rooms, connections, terrain, dragging, zooming, and room interaction, then adds layered story clues to help you choose a direction.

- Base-game and Downpour maps use the open-source front end of [Rain World Map](https://rain-world-map.github.io/), including room connections, terrain, creature layers, dragging, zooming, and room controls.
- Unexplored terrain is masked by room by default while nodes and exits remain visible. Import a game snapshot to reveal visited rooms; each room can be shown or masked independently, or the whole region can be revealed.
- Region names appear on the map. Ordinary names are visible by default; the 17 regions grouped as spoilers in the Wiki navigation template are hidden until enabled. Room codes remain available for precise lookup.
- Nine standard story campaigns are supported. Clues unfold in layers, suggesting a direction before revealing more detail. Players decide when a clue is complete.
- Recommended routes use map connections, regional direction, and the current character as references. Gates, one-way passages, character abilities, and terrain mods can affect actual access.
- Watcher keeps its story clues and opens the original author’s map site separately.
- The optional mod opens a browser snapshot when **G is held for 0.6 seconds** by default. The key and hold duration can be changed in Remix.
- Rain Meadow shows every readable player position and uses only the host’s exploration record. This project does not scan terrain mods; mods that add or change terrain, rooms, or connections may make the map and guidance inaccurate.

Download the mod above, extract `whereshouldigo` into `RainWorld_Data/StreamingAssets/mods/`, and enable 「雨间：我该去哪 / Rainward: Where to Go」 in Remix. Hold G in a room to open the current snapshot in your browser.

The mod does not modify saves, read or write the clipboard, or continuously track location. The web page requires an internet connection when opened.

To remove the mod, disable 「雨间：我该去哪 / Rainward: Where to Go」 in Remix, close the game, and delete `RainWorld_Data/StreamingAssets/mods/whereshouldigo/`. To remove its key configuration as well, delete `ModConfigs/littlhmw.whereshouldigo.txt` from the game data directory. Do not delete other mod settings or save data. Rainward browser data can be cleared from the web page’s data panel.

The interface defaults to Simplified Chinese and supports English. Reference material: [Rain World Wiki](https://rainworld.miraheze.org/wiki/Rain_World_Wiki) · [简体中文 Wiki](https://rainworld.miraheze.org/wiki/Rain_World_Wiki/zh-hans) · [Desktop Rain World Slugcat Simulation](https://github.com/littlhMW/desktop-rainworld-slugcat-simulation) · [Original map](https://rain-world-map.github.io/) · [Third-party notices](rain-guide/THIRD-PARTY-NOTICES.md)
