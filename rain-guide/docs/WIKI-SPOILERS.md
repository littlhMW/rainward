# Wiki 地名剧透规则

核对日期：2026-10-12。本文档本身列出隐藏名单，包含地名剧透。

## 采用的实际标记

依据用户指定的 [Regions 页面，修订 337548](https://rainworld.miraheze.org/wiki/Regions?oldid=337548)，以及该页面实际引用的 [Template:RegionNavbox，修订 324754](https://rainworld.miraheze.org/wiki/Template:RegionNavbox?oldid=324754)。

该导航模板将区域分成普通列表与三个明确命名的剧透列表：`Vanilla Spoilers`、`Downpour Spoilers`、`Watcher Spoilers`。三个剧透列表的源代码均使用 `state = mw-collapsible mw-collapsed`，因此可作为地名默认显示/隐藏的明确依据。

- [Regions 原始 wikitext](https://rainworld.miraheze.org/w/index.php?title=Regions&oldid=337548&action=raw)
- [RegionNavbox 原始 wikitext](https://rainworld.miraheze.org/w/index.php?title=Template:RegionNavbox&oldid=324754&action=raw)
- [区域代号映射模板](https://rainworld.miraheze.org/w/index.php?title=Template:Region&action=raw)
- [Wiki 编写规范：Spoiler Tagging，修订 310048](https://rainworld.miraheze.org/wiki/Rain_World_Wiki:Style_Guide?oldid=310048#Spoiler_Tagging)

**边界：Regions 正文的图库会直接显示全部区域；它没有把所有剧透名称都包进隐藏标签。** 本项目采用的是同页导航框的明确分类，不宣称正文图库本身隐藏了这些地名，也没有凭“晚期区域”“还未探索”或“DLC 内容”推断分类。编写规范也明确区分 DLC 内容提示与剧情剧透提示。

## 默认隐藏的 17 个区域名

| Wiki 分组 | 代号 | Wiki 地名 |
| --- | --- | --- |
| Vanilla Spoilers | SS | Five Pebbles |
| Downpour Spoilers | MS | Submerged Superstructure |
| Downpour Spoilers | OE | Outer Expanse |
| Downpour Spoilers | LC | Metropolis |
| Downpour Spoilers | RM | The Rot |
| Downpour Spoilers | DM | Looks to the Moon |
| Downpour Spoilers | CL | Silent Construct |
| Downpour Spoilers | HR | Rubicon |
| Watcher Spoilers | WSUR | Crumbling Fringes |
| Watcher Spoilers | WHIR | Corrupted Factories |
| Watcher Spoilers | WDSR | Decaying Tunnels |
| Watcher Spoilers | WGWR | Infested Wastes |
| Watcher Spoilers | WARA | Shattered Terrace |
| Watcher Spoilers | WRSA | Daemon |
| Watcher Spoilers | WAUA | Ancient Urban |
| Watcher Spoilers | WSSR | Unfortunate Evolution |
| Watcher Spoilers | WORA | Outer Rim |

`src/spoilers.js` 中的 `level: 'major'` 是本项目的默认隐藏标记。Wiki 上述导航框只将它们归入 Spoilers，没有给这些区域逐一划分“轻微/严重”级别，因此该字段不代表 Wiki 作出了严重程度评级。

## 默认显示的 35 个区域名

普通基础区域：SU、HI、DS、GW、SL、SH、UW、CC、SI、LF、SB。

普通 Downpour 区域：VS、LM、UG。

普通 Watcher 区域：WRFA、WSKB、WSKA、WARF、WBLA、WARD、WTDB、WARC、WVWB、WARE、WMPA、WPGA、WRRA、WARB、WSKD、WPTA、WSKC、WARG、WTDA、WRFB、WVWA。

这些名称不因尚未探索而变成“未知区域”。未在已核对表内的第三方区域不得自动声称属于 Wiki 剧透；这里只核对 52 个正式区域。圣徒使用同一区域代号的另名仍沿用所属正式区域分类，名称变体本身没有额外虚构评级。

## 地名与地图的范围不同

地名开关只能保护界面上由本项目渲染的区域名称。它不能保证已展开的完整地形图、房间标签、子区域、房间内容和故事细节无剧透。

导航框另有子区域剧透列表，例如 SL 中的 Looks to the Moon、SB 中的 Depths，以及 Watcher 的 Station Annex 和 The Throne。它们不应导致整个 SL、SB 或 WARD 地名被隐藏，但详细地图若直接显示这些子区域，仍可能剧透。当前 `REGION_SPOILERS` 的键是区域代号，不是子区域名称，也不代表对房间级内容做过逐一分类。

建议产品文字准确写为“隐藏 Wiki 剧透地名”；地形遮罩使用独立开关。关闭地形遮罩即意味着查看完整地图内容，不能仅凭隐藏地名保证无剧透。通过 Mod 传来的区域、房间与坐标只说明当前地点，不是已完成剧情或已掌握路线的证据。

## 现有故事线索审查

这次审查未修改 `src/data.js`。大部分 `hints[0]` 用方向、准备和会面代替人物身份或结局，适合保留。默认只展示当前阶段的一条温和提示，可以显著减少尚未到达的情节信息；更明确的方向和地点由玩家逐层展开。

需要避免温和层从其他字段绕过保护：

- `saint.graphNote` 直接列出 HR 名称，`artificer.graphNote` 直接列出 LC 名称；区域自身的 `clue` 有些会预告入口的剧情条件。默认地名隐藏时，不应无条件显示这些原文。
- `watcher.scope` 明示结局条数；完整阶段列表会提前展现会面的次数、先后与分支关系。Watcher 后期温和文字涉及“第四次相遇”，应在玩家主动查看相应阶段时才出现。
- 溪流 `completion` 会先于对应提示说明任务物获取/安置。完成勾选的标签可以使用简短的“这一步已完成”，把原始核对条件放到展开后的提示中。
- Wiki 编写规范把猎手的永久失败和额外周期视作角色机制剧透。现有猎手提示将这类存档风险提前告知，实用但不能称为严格遵照 Wiki 的无剧透内容；可以收在单独的“角色机制提醒”里，让玩家主动展开。
- 列表、搜索结果、推荐目的地、定位提示与无障碍名称应使用同一地名规则，不能仅遮住地图上的一处文本。内容保护不应用删除正常地名来替代。

## Mod 地形提醒建议

“本地图按原版及对应 DLC 数据显示。若你使用了新增或修改区域、房间、连接的 Mod，地图与提示可能不准确，请以游戏内实际情况为准。此工具不检测你的 Mod 列表。”

这是固定说明，不暗示检测出玩家安装了什么 Mod。雨甸联机位置与剧情进度可能属于不同层面的信息：当前房间可以用于地图定位，但不能据此假定房主战役、当前可用门、已完成的会面或所有联机玩家的位置一致。

## 下载、配置与清理

本次只通过 HTTP 读取公开 Wiki 文本，未安装依赖、未把网页快照落盘、未修改系统配置。新增的 `src/spoilers.js` 用于可审计的地名分类，本文档用于记录证据、范围和限制；若撤销此功能，删除这两个文件并移除代码中对应导入即可。

Wiki 的文字内容按页面页脚声明使用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。本文的分类摘录及对 Wiki 分类的翻译整理按相同许可提供，注明来源为 Official Rain World Wiki 贡献者；产品实现代码不因此被声称来自 Wiki。
