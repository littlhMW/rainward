# 雨间 · 我该去哪 | Rainward · Where Should I Go

![雨间 · 我该去哪](mod/thumbnail.png)

《雨世界》交互地图与故事线索工具。本项目基于 [Rain World Map](https://rain-world-map.github.io/) 的开源前端，保留真实房间、连接和地形，并以简洁的黑白界面呈现地图与路线提示。

**[打开网页](https://littlhmw.github.io/rainward/)** · **[GitHub 项目](https://github.com/littlhMW/rainward)**

## 功能

### 地图与探索

- 地图默认按房间遮罩未探索地形，同时保留房间节点和连接关系。
- 导入游戏快照后，游戏中已访问的房间会自动显示。右键房间或使用房间面板，可以单独选择“显示”“遮住”或“跟随游戏记录”；总开关可以显示完整地图。
- 地名直接标在地图上。普通地名默认可见；按照 Wiki 导航模板中的剧透分组，17 个区域名默认隐藏，可在设置中开启。
- 地图支持拖动、缩放和按房间代码定位。连接、节点和已选择的路线在遮罩状态下仍然可见。
- 使用新增或修改地形、房间或连接的 Mod 时，地图与提示可能不准确，请以游戏实际情况为准。本项目不会扫描已安装的 Mod。

### 角色与线索

- 支持九位常规剧情角色。基础角色和 Downpour 角色使用 Rain World Map 数据；Watcher 使用 Alduris Watcher Map 的房间、连接与地形数据。
- 故事线索按层级展开，先提供方向，再提供目的地和路线参考。经过房间或开始会面不会自动被视为完成剧情目标，完成状态由玩家确认。
- 区域路线根据角色能力、门槛和单向通路给出下一步方向。路线是地图数据中的连接参考，不保证构成安全路径。
- 提供生存提示、进度备份导入导出和旅途笔记；使用网页无需账户。

## 游戏 Mod

[下载 Where Should I Go 1.1.0](https://littlhmw.github.io/rainward/downloads/WhereShouldIGo.zip) · [Mod 源码、安装与卸载](mod/README.md)

Mod 默认在游戏内按住 **G 0.6 秒**，打开系统浏览器并传入当前区域、房间、位置、已访问房间和可读取的剧情记录。按键和按住时长可在 Remix 中修改。Mod 不需要先复制坐标，也不会持续追踪或自动修改剪贴板；再次按键时才生成新的快照。

过长的快照会完整写入游戏数据目录的 `Rainward/snapshot.json`，网页会提示选择该文件导入，不会截断记录。

雨甸会显示所有可读取的玩家位置：同区玩家显示在地图上，跨区玩家提供切换入口，尚未同步的位置标记为未知；没有精确坐标时只显示房间位置。探索进度只使用房主记录。单机和房主读取当前实际访问记录，客机使用雨甸同步的房主周期起点快照，因此本周期的新探索和故事变化可能延迟。自由模式可显示玩家位置，但不提供可确认的探索与剧情进度。

Mod 已完成编译，尚未完成单机或雨甸联机实机测试。安装包不包含游戏文件或 Mod 加载器。Steam 工坊尚未上传，上传步骤见 [Steam 工坊上传教程](docs/WORKSHOP.md)。

## 本地运行

需要 Node.js 18 或更新版本。Leaflet 等前端依赖已随上游静态文件保留，无需运行 `npm install`。

```text
npm run serve
```

然后打开 <http://127.0.0.1:4173/>。预览服务只监听本机；按 Ctrl+C 停止。

```text
npm test
```

浏览器检查脚本为 `scripts/check-browser.mjs` 和 `scripts/check-snapshot-browser.mjs`。运行方式、测试范围和已知限制见 [验证记录](docs/QA.md)。

## 数据与隐私

- 区域 JSON 和地形瓦片按需从上游读取，需要网络。网页不提供账户、后台位置服务器或定时上传。
- 游戏快照、单房间遮罩、手动线索进度和笔记保存在浏览器 localStorage 的 `rainward.progress.v1` 中，不会在不同浏览器间自动同步。可以在“说明 / 数据”中备份或清除。
- 每次游戏快照会替换探索列表，不会把不同存档的房间合并；同一来源和存档会保留单房间设置，切换存档或来源不可用时会清除旧探索与手动完成记录并保留笔记。
- Mod 快照通过 URL 片段传入，HTTP 请求不会把片段发送给托管服务器；浏览器历史和分享链接仍可能包含位置、显示名与探索记录。

## 许可与来源

地图代码与数据来源、许可证和 Wiki 资料范围见 [来源与许可](upstream/UPSTREAM.md) 与 [资料范围](docs/SOURCES.md)。本项目原创代码采用 MIT 许可；上游代码、Leaflet、Wiki 摘录和图片素材适用各自许可，游戏素材仍归相应权利人所有。

[免费部署](docs/DEPLOY.md) · [下载用途与完整卸载](docs/UNINSTALL.md) · [GitHub 项目](https://github.com/littlhMW/rainward)

## English

Rainward is an interactive map and story-clue guide for *Rain World*. It is based on the open-source front end of [Rain World Map](https://rain-world-map.github.io/) and keeps the original room connections and terrain as the primary map content.

The map masks unexplored room terrain by default while keeping connections visible. Imported game snapshots reveal visited rooms. Each room can be shown, covered, or linked to the game record independently, and a global switch can reveal the complete map. Ordinary region names are visible; 17 region names grouped as spoilers in the Wiki navigation template are hidden by default.

Nine standard story campaigns are supported. Clues unfold in layers and suggest a direction before revealing more detail. Visiting a room or starting a meeting does not automatically complete a story objective. Routes are connection references and may be affected by character abilities, gates, one-way passages, or terrain mods.

The optional mod opens a browser snapshot when **G is held for 0.6 seconds** by default. It passes the current location, visited rooms, and available story data. In Rain Meadow, all readable player positions are shown, while exploration uses only the host record. Clients receive the host's cycle-start snapshot, so changes from the current cycle may appear later. Free mode can provide player positions but does not provide confirmed exploration or story progress.

The mod has been compiled but has not completed in-game single-player or Rain Meadow multiplayer testing. The package contains no game files or mod loader. Steam Workshop upload instructions are available in [docs/WORKSHOP.md](docs/WORKSHOP.md).

For local development, use Node.js 18 or newer, run `npm run serve`, and open <http://127.0.0.1:4173/>. Run `npm test` for the automated checks. Map data and terrain tiles load online. Browser progress stays in local storage and can be backed up or cleared from the data panel.

Related resources: [Rain World Wiki](https://rainworld.miraheze.org/wiki/Rain_World_Wiki) · [简体中文 Wiki](https://rainworld.miraheze.org/wiki/Rain_World_Wiki/zh-hans) · [Desktop Rain World Slugcat Simulation](https://github.com/littlhMW/desktop-rainworld-slugcat-simulation) · [Original map](https://rain-world-map.github.io/)
