# 雨间 我该去哪 / Rainward where to go

![雨间 我该去哪](rain-guide/mod/thumbnail.png)

面向《雨世界》（Rain World）的在线地图与故事线索工具。项目基于开源地图前端改进，保留真实房间、地形和连接，并提供探索遮罩、分层剧情提示，以及可选的游戏内位置快照 Mod。

**[打开网页](https://littlhmw.github.io/rainward/)** · **[下载 Mod](https://littlhmw.github.io/rainward/downloads/WhereShouldIGo.zip)** · **[查看源码](https://github.com/littlhMW/rainward)**

## 功能

- **真实地图**：沿用 Rain World Map 的地图数据；Watcher 使用对应地图数据。
- **探索遮罩**：导入游戏快照后显示已访问房间；可单独控制房间显示，也可查看完整地图。
- **故事线索**：提供分层剧情提示、区域方向和真实房间连接参考；由玩家确认剧情进度。
- **剧透控制**：默认隐藏按 Wiki 分类的 17 个区域名，可调整地名显示。
- **可选游戏 Mod**：适用于 Rain World PC 的 Remix/BepInEx；默认长按 G 0.6 秒打开网页并传入位置快照，可读取已访问房间及有限的剧情记录，并支持 Rain Meadow 玩家位置显示。
- **本地数据管理**：支持进度备份与导入导出，保留旅途笔记；无需账户。

## 快速开始

直接打开[在线地图](https://littlhmw.github.io/rainward/)。地图区域数据与地形瓦片按需联网加载。

需要游戏内位置快照时，下载 [WhereShouldIGo.zip](https://littlhmw.github.io/rainward/downloads/WhereShouldIGo.zip)，然后按照[安装与卸载说明](rain-guide/mod/README.md)操作。当前 Mod 版本为 **1.1.0**。

## 文档

| 文档 | 内容 |
| --- | --- |
| [详细使用说明](rain-guide/README.md) | 地图操作、线索、数据保存与本地运行 |
| [Mod 安装与使用](rain-guide/mod/README.md) | 安装、按键配置、Rain Meadow 兼容、构建与卸载 |
| [验证记录](rain-guide/docs/QA.md) | 测试范围、结果及已知限制 |
| [Steam 创意工坊上传教程](rain-guide/docs/WORKSHOP.md) | 本地 Mod 的工坊发布步骤 |
| [来源与许可证](rain-guide/upstream/UPSTREAM.md) | 上游地图、第三方依赖及许可说明 |
| [资料来源](rain-guide/docs/SOURCES.md) | 项目使用的参考资料 |
| [部署说明](rain-guide/docs/DEPLOY.md) | GitHub Pages 部署与维护 |
| [下载用途与完整卸载](rain-guide/docs/UNINSTALL.md) | 文件用途、数据位置与清理方法 |

## 开发与测试

需要 Node.js 18 或更新版本。在 `rain-guide/` 目录中运行：

```sh
npm run serve
npm test
```

本地预览地址为 [http://127.0.0.1:4173/](http://127.0.0.1:4173/)。前端所需 Leaflet 已包含在项目静态资源中，无需执行 `npm install`。详细检查方法与结果见[验证记录](rain-guide/docs/QA.md)。

## 已知限制

地图、区域 JSON 和地形瓦片需要联网，并依赖上游数据可用性。路线仅依据地图连接提供参考，不保证符合每个房间的通行条件；新增或修改地形的 Mod 也可能导致地图不准确。

游戏 Mod 已编译并完成代码、协议及自动化检查，**尚未完成单机或 Rain Meadow 联机实机验收，亦尚未上传 Steam 创意工坊**。雨甸客机的探索快照可能滞后；自由模式不提供可确认的探索与剧情进度。详细边界见[验证记录](rain-guide/docs/QA.md)。

## 来源与许可

项目调整基于 [Rain World Map](https://rain-world-map.github.io/) 开源前端，并保留相应来源和许可证。项目原创代码修改采用 MIT 许可；上游代码、Leaflet、Wiki 分类资料、封面图片及游戏素材适用各自的许可或权利安排。完整信息见[来源与许可证](rain-guide/upstream/UPSTREAM.md)。
