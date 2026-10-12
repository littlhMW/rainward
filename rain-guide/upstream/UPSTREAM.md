# Rain World Map 上游来源

`rain-guide/upstream/` 保留了 [Rain World Map](https://rain-world-map.github.io/) 的静态地图前端及其必要的小资源，供“雨间”调整界面、遮罩和路线提示。它不是本项目重新绘制的区域示意图，也不代表本项目取得了地图数据或游戏素材的再发布权。

## 固定版本与许可

- 源仓库：[rain-world-map/rain-world-map.github.io](https://github.com/rain-world-map/rain-world-map.github.io)。
- 取用提交：`971e8c1c4bda681bb6cd29499cf8c52950ea4b5c`；取用日期：2026-10-12。
- `map.html`、`global.js`、`beziero.js`、`rw.css`、`slugcats.json` 及配套小资源来自该提交。
- 上游前端仓库声明 **CC0 1.0 Universal**，原文保存在 [LICENSE](LICENSE)。该声明只按上游发布范围记录，不能单独覆盖独立地图数据、截图、地形瓦片或游戏素材。
- 原始项目 [Henpemaz / Rain-World-Interactive-Map](https://github.com/henpemaz/Rain-World-Interactive-Map) 使用 **MIT**，版权声明为 `Copyright (c) 2020 Henrique Maziero`。本目录保留 [LICENSE-Henpemaz](LICENSE-Henpemaz) 及其来源链接，不把下游 CC0 当作删除原作者声明的依据。
- 上游随附的 **Leaflet 1.7.1** 适用 **BSD-2-Clause**，不是 MIT。本目录保留 [leaflet/LICENSE](leaflet/LICENSE) 和原作者声明。
- `resources/Rodondo.otf` 的作者为 **Olly Wood**。作者页面 [Rodondo – dafont.com](https://www.dafont.com/rodondo.font) 说明可用于个人和商业项目并允许修改；本项目保留字体文件及来源，不将其列为 Rainward MIT 内容。
- 原地图中的 Rain World 游戏画面、名称、角色图标和其他美术属于各自权利人。完整范围见 [../THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。

本项目自己的界面调整、故事数据、遮罩逻辑和位置桥接代码属于 Rainward 原创部分，适用 [../LICENSE](../LICENSE)；上游和其他第三方文件按各自许可处理。

## 下载了什么，为什么下载

只下载静态前端及小配套资源，原始合计约 **506 KB / 103 个文件**：

| 文件 | 用途 |
| --- | --- |
| `map.html` | 上游 Leaflet 地图页面、区域切换和地图分层 |
| `global.js` | 原图的生物/角色图标表与 JSON 加载辅助 |
| `beziero.js` | 根据原始 GeoJSON 绘制房间之间的曲线连接 |
| `rw.css`、`resources/Rodondo.otf` | 原站样式和字体 |
| `slugcats.json` | 上游原版/Downpour 角色的区域表 |
| `resources/icons/`、`favicon.png` | 原站角色与图层使用的小图标 |
| `leaflet/` | Leaflet 1.7.1 渲染库、样式、小图标和源码映射；不需要 npm 安装 |
| `LICENSE`、`LICENSE-Henpemaz`、`leaflet/LICENSE` | 保留上游、原作者与第三方许可 |

没有下载整个地形瓦片仓库，没有安装程序、服务或浏览器扩展，没有改系统配置。原版与 Downpour 的区域 JSON 和地形瓦片由浏览器按需访问公开接口；这些独立数据的授权范围仍需以数据维护者和游戏权利人的说明为准，本项目不把整套数据镜像到仓库。详细地图需要网络，也受上游服务可用性影响。本项目不收集游戏位置，位置由页面 URL 的片段传入。

## 原版 / Downpour 数据接口

上游页面使用绝对路径，不需要把大型图片搬到本项目：

```text
https://raw.githubusercontent.com/rain-world-map/vanilla/main/{slugcat}/{region}/region.json
https://raw.githubusercontent.com/rain-world-map/msc/main/{slugcat}/{region}/region.json
```

`vanilla` 下的角色是 `white`（幸存者）、`yellow`（僧侣）、`red`（猎手）；`msc` 下是 `gourmand`、`artificer`、`rivulet`、`spear`、`saint`。`region` 为小写区域代码。区域数据若带 `copyingrooms`，房间和瓦片应取该字段指定角色的同一区域；生物数据仍来自当前角色，不能把整份 JSON 简单替换为另一角色。

瓦片地址为该区域目录下 `{z}/{x}_{y}.png`。使用 `L.CRS.Simple`，`minZoom: -7`、`maxZoom: 3`、`maxNativeZoom: 0`。

数据内的 `room_features` 是真实房间截图的边界；`connection_features` 是真实房间间连接；`geo_features` 是房间内部几何；`spawn_features` 是生物刷新信息。遮罩应移除瓦片、内部几何和刷新信息，保留房间节点与原始连接；关闭遮罩时再显示地形。

上游原有链接格式为：

```text
map.html?slugcat=white&region=SU&room=SU_C04
```

`room_features[*].properties.name` 对应房间代码；`focusRoom` 会聚焦对应房间。区域代码与角色需先用区域表验证，不应把任意 URL 内容拼入远程地址。

地图数据及地形瓦片由独立仓库维护，前端 CC0 不足以确认其全部游戏衍生素材可再发布。若将来需要离线打包或改作这些数据，应先取得维护者的明确授权。完整说明见 [../THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。

## Watcher：仅保留外部地图入口

上游固定版本不包含 Watcher。Watcher 地图来源为 [Alduris Watcher Map](https://alduris.github.io/watcher-map/)，其新增地图代码、区域 JSON 和地形瓦片目前没有本项目可确认的复制许可。

“雨间”不复制、离线打包或程序化读取该来源的地图代码、数据或瓦片。Watcher 仍保留故事线索和路线方向；需要查看真实地图时，页面只提供指向原站的外部链接。公开可访问不等于获得内嵌或再发布授权。若未来重新考虑接入，应先取得作者明确许可，并重新核对游戏衍生素材范围。

## 玩家坐标的精度边界

可以通过角色、区域与房间代码准确找到房间。普通 `region.json` 只含截图边界和标签位置，不含游戏房间坐标原点，因此不能将游戏内格坐标直接加到截图边界就宣称是精确位置。

地图生成器的坐标公式可见 [generateGeoJSON.py](https://github.com/rain-world-map/generation/blob/main/generateGeoJSON.py)：

```text
roomOrigin = devPos * 10
cameraBottomLeft = roomOrigin + [17, 18] + cameraPosition
tileCenter = roomOrigin + [tileX * 20 + 10, tileY * 20 + 10]
```

若 Mod 另外提供房间所有 `cameraPositions` 各轴最小值 `cx`、`cy`，可由截图边界最小点还原房间原点后标点；没有这些数据时只聚焦房间并显示原始格坐标，不要绘制一个看似精确但实际错位的标记。区域或房间布局 Mod 可能改变这些关系。

## 清理 / 卸载

本目录内均为项目文件。停止使用项目后，可直接删除整个 `rain-guide/upstream/` 目录；这只会移除已下载的上游前端资源，不会改动 Rain World 安装、存档或用户配置。若要保留网站功能则不要单独删除它。浏览器对远程图片的普通缓存可在该站点的浏览器存储设置中清除。完整项目的页面缓存、托管与 Mod 卸载方式见项目的卸载文档。
