# 雨间第三方声明

本文件列出“雨间：我该去哪”（Rainward）使用或引用的第三方内容、来源和许可边界。它与 [LICENSE](LICENSE) 一起阅读。

## Rainward 原创部分

`rain-guide/LICENSE` 与 `rain-guide/mod/LICENSE` 的 MIT 许可只覆盖本项目分别创作的网页、Mod 源代码和项目文档。`rain-guide/package.json` 中的 `license: MIT` 是源码包的元数据；其适用范围同样限于这些原创部分。第三方代码、地图数据、游戏衍生素材、字体和委托图片不因放在本仓库中而转为 MIT，也不因本项目对它们进行了调用或整理而取得新的权利。

## 地图前端与渲染库

| 内容 | 来源与用途 | 许可与保留事项 |
| --- | --- | --- |
| Rain World Map 前端 | [rain-world-map/rain-world-map.github.io](https://github.com/rain-world-map/rain-world-map.github.io)，固定取用提交 `971e8c1c4bda681bb6cd29499cf8c52950ea4b5c` 的静态前端和配套资源 | 上游仓库声明 **CC0 1.0 Universal**，原文见 [`upstream/LICENSE`](upstream/LICENSE)。本项目保留来源和原文，不把下列独立地图数据或游戏素材一并主张为 CC0。 |
| Henpemaz 原始地图代码 | [Rain-World-Interactive-Map](https://github.com/henpemaz/Rain-World-Interactive-Map)，其代码沿用于上游前端 | **MIT**，版权声明 `Copyright (c) 2020 Henrique Maziero`；原文见 [`upstream/LICENSE-Henpemaz`](upstream/LICENSE-Henpemaz)。 |
| Leaflet 1.7.1 | 上游前端的地图渲染库，随静态文件提供 | **BSD-2-Clause**；版权声明和条件见 [`upstream/leaflet/LICENSE`](upstream/leaflet/LICENSE)。不将 Leaflet 重新标为本项目 MIT。 |

## 原版与 Downpour 地图数据

区域 JSON、房间几何、连接、刷新信息和地形瓦片由 [rain-world-map/vanilla](https://github.com/rain-world-map/vanilla) 与 [rain-world-map/msc](https://github.com/rain-world-map/msc) 的公开接口按需提供。相关地图生成说明表明数据由游戏导出的截图和元数据制作，并与前端代码分开存放。

这些数据仓库未在本项目核查范围内提供足以确认全部游戏衍生素材权利的统一许可。前端仓库的 CC0 声明不能单独证明这些数据、截图、瓦片或游戏内容可以重新发布、离线镜像或改作。本项目目前不把这些数据仓库或整套瓦片打包到仓库，也不为其作新的许可声明；网页按需链接原公开接口，数据权利仍由相应维护者和权利人决定。若要离线分发或在其他项目中再利用，应先取得数据维护者对数据及游戏衍生素材使用范围的明确授权。

## Watcher 地图

[alduris/watcher-map](https://alduris.github.io/watcher-map/) 的新增地图代码、区域 JSON 和地形瓦片没有在本项目中复制、打包或程序化读取。Watcher 在“雨间”中保留故事线索，并提供指向原站的外部链接；需要查看其地图时请在原站打开。

[alduris/MapExporter](https://github.com/alduris/MapExporter) 的根目录 `LICENSE` 和 `assets/map-frontend/LICENSE` 均声明 **CC0 1.0 Universal**。该许可可以覆盖作者在该仓库中创作的导出器代码和前端文件；本项目若复用这些文件，应继续保留前端所列的 Leaflet、Henpemaz、Alduris 和 Rain World 署名信息。MapExporter 的导出器会在运行时从 Rain World 读取房间、瓦片和对象并生成数据，仓库的 CC0 不会替第三方素材清权。

`alduris/watcher-map` 仓库当前没有 `LICENSE` 文件，GitHub API 也未标注仓库许可。因此，Watcher 地图的区域 JSON、生成的地形瓦片、截图、图标和游戏衍生内容不能仅因 MapExporter 使用 CC0 就视为可再发布。公开可访问不等于获得再发布或内嵌授权；若未来要接入其地图数据，应先取得作者明确许可，并确认许可覆盖 GitHub Pages、Mod、Steam Workshop、修改和再发布。

## Wiki 资料

区域名称、普通/剧透分组及部分路线核对使用 [Rain World Wiki](https://rainworld.miraheze.org/wiki/Rain_World_Wiki) 与 [简体中文 Wiki](https://rainworld.miraheze.org/wiki/Rain_World_Wiki/zh-hans)。Wiki 页面页脚声明 **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**。本项目对区域分类的摘录、翻译和改编按该许可注明来源；使用者若再分发这些改编内容，应保留署名、许可链接并按相同许可提供改编部分。网页中的原创故事线索由本项目独立撰写，不复制 Wiki 的长段剧情文字或游戏对话。

## Rodondo 字体

地图前端随附 `upstream/resources/Rodondo.otf`。作者为 **Olly Wood**，来源为 [Rodondo – dafont.com](https://www.dafont.com/rodondo.font)。作者页面说明该字体可用于个人和商业项目，并允许修改；本项目保留字体文件及作者来源，不将字体列为 Rainward MIT 内容。使用者应以作者页面当前条款为准。

## 雨世界与游戏素材

《Rain World》、Downpour、Rain Meadow、Watcher 以及游戏中的图像、角色、名称、音效和其他衍生内容属于各自权利人。本仓库的代码许可不覆盖这些内容；Mod 发布包也不包含游戏文件、游戏程序集或 Rain Meadow 程序集。

## 委托封面与横幅

`mod/thumbnail.png` 以及 README 使用的横幅源自用户提供的 `C:\Users\littlh\Desktop\雨间.png`。用户在本项目委托中明确允许将该图及本项目生成的裁切、放大、补边版本用于：公开 GitHub 仓库展示、GitHub Pages、Rain World Mod 发布、Steam 创意工坊发布，以及为上述用途进行必要的修改和再发布。该授权记录只针对本项目及这些用途；图片不因仓库公开或代码采用 MIT 而自动成为 MIT 或 CC0。原始桌面文件不由本项目修改或删除。

## 维护者注意事项

- 保留各目录中的上游许可证和本文件；不要把第三方文件批量替换成 Rainward 的 MIT 文本。
- 发现上游许可证、地图数据条款或字体作者条款变化时，应更新本文件和对应来源记录。
- 本文件是来源和许可记录，不替代权利人的正式授权或适用法律意见。
