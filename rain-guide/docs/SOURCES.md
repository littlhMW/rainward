# 资料与内容范围

核对日期：2026-10-12。以下来源页面，尤其是 Plot、Endings、角色与地区页面，**包含游戏剧透**。它们供维护者核对事实，不应作为新玩家默认展开的攻略。

## 项目参考与许可边界

- 用户指定参考：[Rain World Map](https://rain-world-map.github.io/)，[GitHub 源仓库](https://github.com/rain-world-map/rain-world-map.github.io)。站点根 [LICENSE](https://github.com/rain-world-map/rain-world-map.github.io/blob/master/LICENSE) 为 **CC0 1.0**。
- 上游原始项目：[Henpemaz / Rain-World-Interactive-Map](https://github.com/henpemaz/Rain-World-Interactive-Map)，[MIT LICENSE](https://github.com/henpemaz/Rain-World-Interactive-Map/blob/master/LICENSE)。作者版权声明为 Henrique Maziero，2020。其 README 说明项目为静态 HTML、CSS、JavaScript，使用 Leaflet 展示从游戏导出的地图。
- 参考站自己的页脚将原始工作归于 Henpemaz、移植归于 Dual，并标明 Rain World 属于 Videocult。
- 独立地图数据仓库 [rain-world-map/vanilla](https://github.com/rain-world-map/vanilla) 和 [rain-world-map/msc](https://github.com/rain-world-map/msc)，以及 [alduris/watcher-map](https://github.com/alduris/watcher-map) 在核对时没有由 GitHub 检出的根许可证。不能用主站 CC0 推定独立仓库、游戏截图、角色图像、字体、商标都可按 CC0 转载。
- 本工具使用原创界面、中文渐进提示与示意坐标，**未复制上述项目代码、游戏截图、房间几何、对话、音乐、字体或地图切片**。区域名称、可达关系、食物数量与玩法条件作为事实核对；不打包上游完整 JSON。
- Wiki 页脚标注 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。本项目没有逐句翻译或改写其长段文章，也未打包其图片；中文文案为独立编写。如将来复制 Wiki 文字或素材，需另行履行署名和相同方式共享等对应要求。
- 这不是官方工具。网站免费访问不等于游戏或 DLC 免费，本项目不提供游戏本体及收费资产。

## 覆盖范围

常规剧情角色共 **9 位**：基础版 Survivor、Monk、Hunter；Downpour 的 Gourmand、Artificer、Rivulet、Spearmaster、Saint；The Watcher 的 Watcher。Nightcat 不作为第十个独立剧情战役。秘密额外角色 Inv、竞技场、远征、自定义地区与模组不在当前攻略范围。

区域目录包含基础版 12 区、Downpour 新增 10 区、Watcher 新增 30 区，共 52 个区域。不同角色用到的子集和同一区域的版本不相同。Watcher 的中文名称采用便于阅读的描述性译名，英文名和内部代号用于核对，并不声称这些中文都与每个游戏版本的官方翻译一致。

基础三角色的默认图采用**原版 12 区**；`dlcEdges` 另存 Downpour 扩展相邻关系。默认图未将需要 DLC 的管道场、沉没巨构与额外捷径硬塞入原版路径。幸存者与僧侣的外部扩张区分支明确要求先在同一存档槽完成饕餮战役。

## 区域与连接的依据

1. [主站 slugcats.json](https://rain-world-map.github.io/slugcats.json) 验证主站覆盖八角色及每位角色的区域清单、出生区域；Watcher 不在该清单。
2. 主站 `map.html` 的数据 URL 指向 `rain-world-map/vanilla` 与 `rain-world-map/msc`。对各角色 `region.json` 的 `GATE_*` 房间名进行只读交叉核对，并按 Wiki 区域页排除不可通行、孤立支区及角色版本差异。**没有**把看见门房间直接等同于可以双向通过。
3. [Wiki Regions](https://rainworld.miraheze.org/wiki/Regions) 与各区域 infobox 的 `connections` 字段核实原版、MSC 与角色专属连接：
   - [Outskirts](https://rainworld.miraheze.org/wiki/Outskirts)
   - [Industrial Complex](https://rainworld.miraheze.org/wiki/Industrial_Complex)
   - [Drainage System](https://rainworld.miraheze.org/wiki/Drainage_System)
   - [Garbage Wastes](https://rainworld.miraheze.org/wiki/Garbage_Wastes)
   - [Shaded Citadel](https://rainworld.miraheze.org/wiki/Shaded_Citadel)
   - [Shoreline](https://rainworld.miraheze.org/wiki/Shoreline)
   - [The Exterior](https://rainworld.miraheze.org/wiki/The_Exterior)
   - [Chimney Canopy](https://rainworld.miraheze.org/wiki/Chimney_Canopy)
   - [Sky Islands](https://rainworld.miraheze.org/wiki/Sky_Islands)
   - [Farm Arrays](https://rainworld.miraheze.org/wiki/Farm_Arrays)
   - [Subterranean](https://rainworld.miraheze.org/wiki/Subterranean)
   - [Pipeyard](https://rainworld.miraheze.org/wiki/Pipeyard)
   - [Outer Expanse](https://rainworld.miraheze.org/wiki/Outer_Expanse)
   - [Silent Construct](https://rainworld.miraheze.org/wiki/Silent_Construct)
   - [Undergrowth](https://rainworld.miraheze.org/wiki/Undergrowth)
   - [Rubicon](https://rainworld.miraheze.org/wiki/Rubicon)

必须保留的例外：

- `DS–CC`、`GW–SH`、管道场等为 Downpour 增加的路线，不在原版基础图中。
- 普通角色的 `UW–SL` 只通往 The Precipice 孤立段，不能用来计算外缘直达海岸线主体的捷径。因此普通图省略此边；Spearmaster 与 Artificer 的 `UW–LM` 仍可用。
- `OE → SU` 是单向落差；进入 OE 应从 SB，并满足剧情解锁。Spearmaster 出生时看到的 OE 门不意味着他们可探索 OE。
- `UW–LC` 只用于 Artificer，且必须先完成 SS 会面。不会给 Artificer 添加通向 DM 的边。
- Rivulet 用 RM 替代 SS，不能进入 OE。
- Saint 用 UG 替代 DS、CL 替代 SH 及原来的部分巨构地区；没有旧版 UW/SS。`SB → HR` 是有条件的单向深入。
- Shoreline 与 Submerged Superstructure 有两扇不同门，其中一处是单向；区域图的 `SL–MS` 仅代表还有另一条区域进入方式，不保证任何入口都可往返。
- 所有示意图坐标为原创排布，不是地理测量，也不是房间级路线。区域最少边数不代表安全、省周期或容易通过。

## 战役路线依据与关键纠错

- [Story](https://rainworld.miraheze.org/wiki/Story)、[Plot](https://rainworld.miraheze.org/wiki/Plot)、[Endings](https://rainworld.miraheze.org/wiki/Endings)：战役范围、会面、结尾条件。提示只说明方向与玩家应确认的进度，不描述结局画面、角色动机或世界真相。
- [Survivor](https://rainworld.miraheze.org/wiki/Survivor)、[Monk](https://rainworld.miraheze.org/wiki/Monk)：推荐先海岸线东端，再高处设施；回访属于可选故事补充。不是声称该顺序为游戏唯一强制路线。
- [Hunter](https://rainworld.miraheze.org/wiki/Hunter)、[Echo](https://rainworld.miraheze.org/wiki/Echo)：默认 20 周期，可配置；高处会面默认增加 5 周期并只进行一次业力上限提升。推荐沿途三处特殊会面再加高处会面，从而满足后续最大业力条件。猎手无需预先激活回响，但仍受当前业力条件影响。任务交付与自身收尾是不同事项。
- [Gourmand](https://rainworld.miraheze.org/wiki/Gourmand)、[Outer Expanse](https://rainworld.miraheze.org/wiki/Outer_Expanse)：先 SS 会面解锁 SB–OE；22 类食物记录是额外目标，并非普通结尾前置。
- [Artificer](https://rainworld.miraheze.org/wiki/Artificer)、[Karma Gate](https://rainworld.miraheze.org/wiki/Karma_Gate)：先 SS，再 UW–LC；另一位水边居民不可访问。拾荒者尸体可影响过门，爆炸过热与极短水下时间需提醒。另一条收尾只作分支条件提示，不把它与城市路线强制串成单线。
- [Rivulet](https://rainworld.miraheze.org/wiki/Rivulet)、[Endings](https://rainworld.miraheze.org/wiki/Endings)：初访 SL 为推荐理解步骤；在 RM 会面并取得物品，再到 MS 安置，最后回 SL。溪流只是肺活量更大，不能无限在水下呼吸。
- [Spearmaster](https://rainworld.miraheze.org/wiki/Spearmaster)、[Endings](https://rainworld.miraheze.org/wiki/Endings)：可以先去 DM 帮助理解，再执行 SS → DM → SI 的送信流程。离开 SS 需保留关键珍珠，DM 会面后携带同一任务物去通讯阵列。关键物品跟随 Passage 取决于设置，不默认保证。
- [Saint](https://rainworld.miraheze.org/wiki/Saint)、[Echo](https://rainworld.miraheze.org/wiki/Echo)：由最大业力 2 起步，通常需七次不同成长会面到 10；普通七处为 SI、CC、CL、SL、UG、LF、SB，顺序可变。第 0 周期回响不出现。MS 还有额外会面，但不必为完成常规主线强迫前往。SL 与 CL 的居民回访不列作主线必需条件。

## Watcher：单独的数据边界

[The Watcher DLC](https://rainworld.miraheze.org/wiki/Rain_World:_The_Watcher) 及 [Watcher](https://rainworld.miraheze.org/wiki/Watcher) 当前资料包括 30 新区及四个结局。后续结局内容于 2025-09-25 更新，不能用首发时只有部分结尾的攻略覆盖现在的版本。

Wiki 指定的完整地图是 [Alduris Watcher Map](https://alduris.github.io/watcher-map/)。其 [regions.json](https://alduris.github.io/watcher-map/regions.json) 用于只读核对区域英文名与内部代号；未打包其地图数据。

核对来源：

- [Ripple](https://rainworld.miraheze.org/wiki/Ripple)：序章 CC、SH、LF 三次会面后才进入新机制。十二处新区域成长会面任选八次可把上限升到 9；当前值和上限不同，部分关键入口要求当前值 9。
- [Spinning Top](https://rainworld.miraheze.org/wiki/Spinning_Top)：成长会面位置、WARA 与 WAUA 的后续。WAUA 第一次结尾画面后，醒来还需返回最初房间完成该分支。
- [Warp Point](https://rainworld.miraheze.org/wiki/Warp_Point)：固定、单向、动态、自建传送点和疲劳。区域拓扑不能仅由地名猜测。玩家自建路线、能力与封闭状态使不同存档的实际连线不同。
- [The Prince](https://rainworld.miraheze.org/wiki/The_Prince)：WORA 四出口的分阶段开启，需在对应上限 3、5、7 时回访触发上部对话；全部开启后的会面是最终条件之一。
- [The Weaver](https://rainworld.miraheze.org/wiki/The_Weaver)：休眠地图金色羽毛、已关闭动态通路、镜头触发相遇与四次相遇效果。应关闭通路的集合不包括外环与涟漪专用通路。
- [Endings](https://rainworld.miraheze.org/wiki/Endings)：古老城区分支 + 金色痕迹分支 + 外环居民出现后至少交谈一次，构成最终条件；可选扩散分支不是最终前置。想同一存档体验全部分支，应注意第四次金色相遇对扩散目标的影响。

因此 Watcher 使用 `routeMode: 'waypoints'`：只给出已核实的序章连接，以及后续成长/会面路标；不声称生成可实时反映玩家存档的跨区路线。`destination` 对多地区成长和动态相遇仅作路标，实际可选地点写在提示及 `destinations` 中。

## 新手条目依据

- [Hibernation](https://rainworld.miraheze.org/wiki/Hibernation)：安全休眠、保存、强制饥饿的风险。
- [Karma Gate](https://rainworld.miraheze.org/wiki/Karma_Gate)：门槛、站稳激活、每周期一次、僧侣免除重复门槛。
- [Passages](https://rainworld.miraheze.org/wiki/Passages)：猎手、圣徒、观望者没有令牌；传送落点为去过的休眠处，关键物品同行取决于 Remix 设置。
- [Rain](https://rainworld.miraheze.org/wiki/Rain)、[Controls](https://rainworld.miraheze.org/wiki/Controls)、[Scavenger](https://rainworld.miraheze.org/wiki/Scavenger)、[Lantern](https://rainworld.miraheze.org/wiki/Lantern)：周期、基本操作、路口交涉与照明。
- 角色能力与食物条逐页交叉核对；如 DLC、Remix 或模组更改规则，以当前游戏为准。

## 检索与卸载记录

资料核对仅使用内存中的 HTTPS 请求，没有安装包、浏览器扩展、系统服务、字体或付费 API，也没有把外部地图切片下载进项目。这里只新增项目内的 `src/data.js` 与本说明文件；删除项目即可删除这些资料内容。浏览器进度及网站缓存的移除方式参见项目 README。
