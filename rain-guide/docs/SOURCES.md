# 雨间：资料与内容范围

核对日期：2026-10-12。下列来源及本文的路线细节可能剧透，供维护者核对，不作为新玩家默认展开的攻略。

## 真实地图来源与许可

本项目直接保留并修改了 [Rain World Map](https://rain-world-map.github.io/) 的地图前端，来源为 [rain-world-map/rain-world-map.github.io](https://github.com/rain-world-map/rain-world-map.github.io)，取用提交 971e8c1c4bda681bb6cd29499cf8c52950ea4b5c。不再以原创节点示意图代替用户要求的地形。

- 上游代码根许可为 CC0 1.0，原文保留在 upstream/LICENSE。
- 随附 Leaflet 1.7.1 使用 **BSD-2-Clause**，原文保留在 upstream/leaflet/LICENSE。前端库随静态文件提供，无需 npm 安装。
- 上游原始地图作者为 Henrique Maziero / Henpemaz；原项目是 [Rain-World-Interactive-Map](https://github.com/henpemaz/Rain-World-Interactive-Map)。本次具体取用文件、下载用途及上游适配见 [UPSTREAM.md](../upstream/UPSTREAM.md)。
- 地图的区域 JSON、房间几何、连接、生物刷新及地形瓦片由 [vanilla](https://github.com/rain-world-map/vanilla)、[msc](https://github.com/rain-world-map/msc) 的公开接口按需提供，不把大型地形仓库打包到本站。生成说明表明这些数据由游戏导出的截图和元数据制作，并与前端代码分开存放；前端仓库的 CC0 不能单独证明地图数据及游戏衍生素材的再发布范围。当前仅按需访问原公开接口，不镜像或离线分发；原版与 Downpour 由许可前端显示，完整记录见 [第三方声明](../THIRD-PARTY-NOTICES.md)。
- 游戏图像、字体、角色图标及其他美术仍属各自权利人；上游 CC0 不应被解释成对所有游戏内容重新授权。独立数据仓库的许可不能由前端根许可证推定。
- Wiki 页脚声明 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。本项目地名分类摘录与翻译整理按同一许可注明来源；原创中文故事提示独立撰写，没有复制 Wiki 的长段剧情描述或对话。参见 [地名核对记录](WIKI-SPOILERS.md)。

本项目为非官方工具，免费网页不提供游戏本体或 DLC。

## 地名显示依据

[Regions 修订 337548](https://rainworld.miraheze.org/wiki/Regions?oldid=337548) 引用了 [RegionNavbox 修订 324754](https://rainworld.miraheze.org/wiki/Template:RegionNavbox?oldid=324754)。后者明确区分普通地名与默认折叠的 Vanilla Spoilers、Downpour Spoilers、Watcher Spoilers。

按这三组默认隐藏 17 个地区名称，其余 35 个正式地区名正常显示，不再因为尚未探索而将所有地名匿名。Regions 正文图库本身不隐藏全部剧透地名，本项目使用的是同页导航框的明确分类。完整名单、源代码证据、子区域与房间级边界见 [WIKI-SPOILERS.md](WIKI-SPOILERS.md)。

## 角色与地图适用范围

常规剧情角色共 9 位：Survivor、Monk、Hunter、Gourmand、Artificer、Rivulet、Spearmaster、Saint、Watcher。Inv、竞技场、远征和自定义角色不作为已核实剧情战役；未知 Mod 角色不会静默冒充幸存者。

基础三位与 Downpour 五位使用许可前端及上游 [slugcats.json](https://rain-world-map.github.io/slugcats.json) 的区域目录和角色地图；Watcher 保留故事线索与外部地图入口，不在本项目内嵌其地图数据。52 个正式区域名称用于故事数据和地名规则，不是全部地图的绘制方法。屏幕上的真实房间位置、房间边界、内部地形和连接取自原版/Downpour 上游 JSON/瓦片。

基础三位的真实地形沿用上游 vanilla 角色数据；“启用了 Downpour”选项会更改区域路线建议，不能因此声称前端已具备三位角色每种 DLC 状态的独立地形版本。角色地图的版本以实际 provider 为准。

## 区域与房间路线

区域关系参考 [Wiki Regions](https://rainworld.miraheze.org/wiki/Regions)、各区域 infobox 的 connections，以及上游真实地图的门房间。区域图只用于故事方向，不能把存在一个门房间等同于现在可双向通行。

必须保留的例外：

- DS–CC、GW–SH、管道场等是 Downpour 增加的路线。
- 普通角色的 UW–SL 只到达孤立的 The Precipice，不能当成直达海岸线主体的捷径；较早时间线的 UW–LM 另论。
- OE → SU 是单向；进入 OE 要从 SB 且满足剧情解锁。幸存者、僧侣的可选路线要求同存档槽已完成饕餮，网站不读取存档确认。
- 工匠的 UW–LC 有会面前置，不能添加去 DM 的路线。
- 溪流用 RM 代替 SS；圣徒用 UG/CL 等角色区域，SB → HR 是有条件的单向深入。
- SL 与 MS 的门不止一扇，其中有单向情况，区域连线不能保证每个入口可往返。

房间路径从当前地图的 room_features 和 connection_features 计算，指向匹配下一地区的出口房间。连接末端或房间范围存在歧义时，不猜测“最近的房间”来拼路线。最少的参考连接不代表最安全、省周期或适合当前能力；它不检测实时业力门状态、存档剧情、动态传送或 Mod 改动。

## 故事线索依据

[Story](https://rainworld.miraheze.org/wiki/Story)、[Plot](https://rainworld.miraheze.org/wiki/Plot)、[Endings](https://rainworld.miraheze.org/wiki/Endings) 和各角色页面用于核对会面、携带物与收尾条件。默认轻提示不描述结局画面、人物动机或世界真相；玩家可以主动查看更明确的方向与目的地。

- [Survivor](https://rainworld.miraheze.org/wiki/Survivor)、[Monk](https://rainworld.miraheze.org/wiki/Monk)：推荐先往海岸线东端，再去高处设施；这是理解故事的推荐顺序，不是唯一强制路线。
- [Hunter](https://rainworld.miraheze.org/wiki/Hunter)、[Echo](https://rainworld.miraheze.org/wiki/Echo)：核对周期、额外周期、成长会面与委托。存档风险也属于 Wiki 角色机制剧透，放在玩家主动展开的角色提醒中。
- [Gourmand](https://rainworld.miraheze.org/wiki/Gourmand)：先会面解锁西侧路线，食物记录为额外目标，不是普通结尾前置。
- [Artificer](https://rainworld.miraheze.org/wiki/Artificer)：城市路线有会面前置，另一种收尾独立处理，避免将可选分支强制串入主线。
- [Rivulet](https://rainworld.miraheze.org/wiki/Rivulet)：核对会面、任务物、安置与回访先后；不是只到区域入口就算完成。
- [Spearmaster](https://rainworld.miraheze.org/wiki/Spearmaster)：核对可选提前拜访、关键物品的获取与送达，Passage 携物受设置影响。
- [Saint](https://rainworld.miraheze.org/wiki/Saint)：核对成长会面与条件，额外停留不冒充必需前置。

剧情完成仍由用户确认。Mod 读取游戏中的少量原始记录用于建议当前线索，例如会面次数、机器人、回响与当前休眠房；不将访问房间、开始会面直接当成剧情完成，也不据此证明任务物仍在手中。饕餮的西行建议依赖 hasMark，工匠的城市建议同时要求 hasMark 与 hasRobo；会面计数会在会面开始时变化，不能单独充当这些通路的解锁证据。圣徒的回响计数与 karmaCap 按游戏内部值核对。

## Watcher 线索与外部地图

[Alduris Watcher Map](https://alduris.github.io/watcher-map/) 是 Wiki 推荐的观望者地图。由于该来源目前没有本项目可确认的复制许可，“雨间”不复制、内嵌或程序化读取其新增地图代码、区域 JSON 和地形瓦片；Watcher 地图区域显示中只保留故事线索、路线方向和指向原站的外部链接。需要详细地图时请在原站查看。完整边界见 [第三方声明](../THIRD-PARTY-NOTICES.md) 与 [上游说明](../upstream/UPSTREAM.md)。

[Ripple](https://rainworld.miraheze.org/wiki/Ripple)、[Spinning Top](https://rainworld.miraheze.org/wiki/Spinning_Top)、[Warp Point](https://rainworld.miraheze.org/wiki/Warp_Point) 与 [Endings](https://rainworld.miraheze.org/wiki/Endings) 用于核对成长和分支条件。Watcher 的自建、封闭、单向与动态传送无法由静态故事路标推断；跨区建议不声称实时还原传送网络。

## 游戏定位与雨甸

[Mod README](../mod/README.md) 记录游戏版本、接口来源、v2 压缩快照协议、安装和卸载。Mod 传入战役、区域、房间、可用坐标、完整已访问房间列表、少量原始剧情记录与所有可获取的玩家位置。雨甸故事联机区分房间战役与本地角色外观，玩家名使用尊重匿名设置的 DisplayName，不发送 Steam ID；未知或未同步位置保留为未知。

实际探索读取游戏的 RegionState.roomsVisited 和未加载区域的访问记录，按房间控制遮罩，不用可能混有其他本机记录的地图迷雾贴图推断。客机只解析雨甸已同步的房主 saveStateString，不读写或合并客机存档，也不调用可能修改游戏状态的存档加载/保存方法。此房主缓存主要在周期开始更新，本周期新探索和故事状态可能延迟；没有可用房主记录时不沿用旧探索。自由模式只提供可读取的位置，没有可确认的探索与剧情记录。各存档快照互相替换，避免把不同存档的经过房间累计在一起。

精确标点需要房间像素坐标和截图相机偏移；只有格坐标或坐标越出截图时，只聚焦房间，不画虚假的精确位置。远端角色的实际房间与同步位置不一致时仅使用房间精度。Mod 已编译并核对接口，尚未进行游戏内单机和联机验证。固定的 Mod 地形提醒不扫描已安装 Mod。

## 新手帮助与清理

[Hibernation](https://rainworld.miraheze.org/wiki/Hibernation)、[Karma Gate](https://rainworld.miraheze.org/wiki/Karma_Gate)、[Passages](https://rainworld.miraheze.org/wiki/Passages)、[Rain](https://rainworld.miraheze.org/wiki/Rain)、[Controls](https://rainworld.miraheze.org/wiki/Controls)、[Scavenger](https://rainworld.miraheze.org/wiki/Scavenger) 和 [Lantern](https://rainworld.miraheze.org/wiki/Lantern) 用于核对休眠、过门、移动、传送和生存条目。游戏更新、Remix 或 Mod 更改规则时，以游戏为准。

本次下载了上游静态前端与配套小资源（原始约 506 KB），以及用于雨甸接口核对的公开源码片段；都限定在项目目录，未安装新系统服务。用途、文件位置与清理步骤见 [UNINSTALL.md](UNINSTALL.md) 和 [Mod README](../mod/README.md)。真实原版/Downpour 地图需联网；Watcher 仅提供外部地图入口。旧版离线缓存退役不应删除浏览器中的进度与笔记。
