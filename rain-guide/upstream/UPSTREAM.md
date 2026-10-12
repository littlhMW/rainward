# Rain World Map 上游来源

这个目录实际保留了 [Rain World Map](https://rain-world-map.github.io/) 的地图前端，
供“雨间”直接调整和同源嵌入。它不是从头绘制的区域示意图。

## 固定版本与许可

- 源仓库：<https://github.com/rain-world-map/rain-world-map.github.io>
- 取用提交：`971e8c1c4bda681bb6cd29499cf8c52950ea4b5c`
- 取用日期：2026-10-12。
- `map.html`、`global.js`、`beziero.js`、`rw.css`、`slugcats.json` 和其配套小资源来自该提交。
- 上游仓库许可为 **CC0 1.0 Universal**，原文保存在 [LICENSE](LICENSE)。
- 原始项目 [Henpemaz / Rain-World-Interactive-Map](https://github.com/henpemaz/Rain-World-Interactive-Map)
  使用 **MIT**，版权声明为 `Copyright (c) 2020 Henrique Maziero`。
  已按其保留声明要求附上 [LICENSE-Henpemaz](LICENSE-Henpemaz)，原文来源为
  <https://github.com/henpemaz/Rain-World-Interactive-Map/blob/master/LICENSE>。
  保留这份历史许可，不把下游仓库的 CC0 声明当作删除原作者 MIT 声明的依据。
- 上游随附的 **Leaflet 1.7.1** 另适用 **BSD-2-Clause**，不是 MIT。
  已补充其 [leaflet/LICENSE](leaflet/LICENSE)，来源为
  <https://github.com/Leaflet/Leaflet/blob/v1.7.1/LICENSE>，保留原作者声明。
- 原地图由 Henrique Maziero / Henpemaz 制作；图中 Rain World 游戏画面、名称和相关美术属于其各自权利人。
  上游代码的 CC0 不代表本项目拥有游戏素材，也不改变第三方权利。
- 本项目的调整包括界面精简、默认地形遮罩、防剧透地名和游戏位置桥接；
  核心房间布局、连线、地形和渲染逻辑保留上游来源。

## 下载了什么，为什么下载

只下载静态前端及小配套资源，原始合计约 **506 KB / 103 个文件**：

| 文件 | 用途 |
| --- | --- |
| `map.html` | 上游 Leaflet 地图页面、区域切换和地图分层 |
| `global.js` | 原图的生物/角色图标表与 JSON 加载辅助 |
| `beziero.js` | 根据原始 GeoJSON 绘制房间之间的曲线连接 |
| `rw.css`、`resources/Rodondo.otf` | 原站样式和字体 |
| `slugcats.json` | 上游 8 个原版/Downpour 角色的区域表 |
| `resources/icons/`、`favicon.png` | 原站角色与图层使用的小图标 |
| `leaflet/` | Leaflet 1.7.1 渲染库、样式、小图标和源码映射；不需要 npm 安装 |
| `LICENSE`、`LICENSE-Henpemaz`、`leaflet/LICENSE` | 保留上游、原作者与第三方许可 |

没有下载整个地形瓦片仓库，没有安装程序、服务或浏览器扩展，没有改系统配置。
地图数据与地形瓦片按浏览区域直接从原作者的公开服务器读取；因此详细地图需要网络，
也受上游服务可用性影响。本项目不收集游戏位置，位置由页面的 URL 片段传入。

## 原版 / Downpour 数据接口

上游页面已经使用绝对路径，不需要把大型图片搬到本项目：

```text
https://raw.githubusercontent.com/rain-world-map/vanilla/main/{slugcat}/{region}/region.json
https://raw.githubusercontent.com/rain-world-map/msc/main/{slugcat}/{region}/region.json
```

`vanilla` 下的角色是 `white`（幸存者）、`yellow`（僧侣）、`red`（猎手）。
`msc` 下是 `gourmand`、`artificer`、`rivulet`、`spear`、`saint`。
`region` 为小写区域代码。区域数据若带 `copyingrooms`，房间和瓦片应取该字段指定角色的同一区域；
生物数据仍来自当前角色，不能把整份 JSON 简单替换为另一角色。

瓦片地址为该区域目录下 `{z}/{x}_{y}.png`。使用 `L.CRS.Simple`，
`minZoom: -7`、`maxZoom: 3`、`maxNativeZoom: 0`。

数据内的 `room_features` 是真实房间截图的边界；`connection_features` 是真实房间间连接；
`geo_features` 是房间内部几何；`spawn_features` 是生物刷新信息。
遮罩应移除瓦片、内部几何和刷新信息，保留房间节点与原始连接；关闭遮罩时再显示地形。

上游原有链接格式为：

```text
map.html?slugcat=white&region=SU&room=SU_C04
```

`room_features[*].properties.name` 对应房间代码；`focusRoom` 会聚焦对应房间。
区域代码与角色需先用区域表验证，不应把任意 URL 内容拼入远程地址。

## Watcher 数据来源

上游当前提交只含 8 个角色，不包含 Watcher。
Watcher 的独立地图来源为 [alduris/watcher-map](https://alduris.github.io/watcher-map/)。
该仓库未声明可复制其新增源码的许可，因此本项目没有复制它的代码或重新发布其瓦片。
可以通过公开跨源数据接口读取其真实地图，并保留作者和原站入口：

```text
https://alduris.github.io/watcher-map/regions.json
https://alduris.github.io/watcher-map/slugcats/{REGION}/Watcher/region.json
https://alduris.github.io/watcher-map/slugcats/{REGION}/Watcher/{z}/{x}_{y}.png
```

区域目录为大写，`Watcher` 大小写固定。2026-10-12 已验证 `WPTA` 的区域数据返回 HTTP 200，
提供 `Access-Control-Allow-Origin: *`，且兼容上述房间、连线、地形和颜色字段。
额外的传送点、涟漪等字段不应在默认防剧透模式中展示。
读取公开数据不等于获得重新许可权；今后若需打包这部分离线数据，应先核实来源授权。

## 玩家坐标的精度边界

可以通过角色、区域与房间代码准确找到房间。普通 `region.json` 只含截图边界和标签位置，
不含游戏房间坐标原点，因此不能将游戏内格坐标直接加到截图边界就宣称是精确位置。

地图生成器的坐标公式可见 [generateGeoJSON.py](https://github.com/rain-world-map/generation/blob/main/generateGeoJSON.py)：

```text
roomOrigin = devPos * 10
cameraBottomLeft = roomOrigin + [17, 18] + cameraPosition
tileCenter = roomOrigin + [tileX * 20 + 10, tileY * 20 + 10]
```

若 Mod 另外提供房间所有 `cameraPositions` 各轴最小值 `cx`、`cy`，
可由截图边界最小点还原房间原点后标点；没有这些数据时只聚焦房间并显示原始格坐标，
不要绘制一个看似精确但实际错位的标记。区域或房间布局 Mod 可能改变这些关系。

## 清理 / 卸载

本目录内均为项目文件。停止使用项目后，可直接删除整个 `rain-guide/upstream/` 目录；
这只会移除已下载的上游前端资源，不会改动 Rain World 安装、存档或用户配置。
若要保留网站功能则不要单独删除它。浏览器对远程图片的普通缓存可在该站点的浏览器存储设置中清除。
完整项目的页面缓存、托管与 Mod 卸载方式见项目的卸载文档。
