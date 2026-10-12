# 雨间 · 我该去哪 / Rainward

直接基于 [Rain World Map](https://rain-world-map.github.io/) 开源前端调整的《雨世界》地图工具：真实地形与房间连接，附带逐层展开的故事线索。

**网站地址：[littlhmw.github.io/rainward](https://littlhmw.github.io/rainward/)** · **[源码仓库](https://github.com/littlhMW/rainward)**

- 黑白、方角界面，地图占主要面积；默认按房间遮罩地形，保留真实连接。游戏已访问房间自动显示；每个房间可单独显示、遮住或跟随游戏记录，总开关可显示完整原图。
- 地名直接显示在地图上；普通地名可见，按 Wiki 明确分组默认隐藏 17 个剧透区域名。
- 九位常规剧情角色，同一界面使用原地图及 Watcher 真实地图数据。
- 故事线索、区域方向、实际房间出口连接参考、位置链接和本地备份；读取少量游戏记录建议线索，不自动把经过房间或开始会面标为剧情完成。
- 可选“雨间”Mod 1.1.0：默认长按 G 打开当前地点与实际探索快照，Remix 可改键；显示雨甸中所有能读取位置的玩家，探索只采用房主记录。客机使用房主周期起点快照，本轮新探索可能延迟；自由模式不提供可确认的探索及剧情进度。已编译并核对接口，尚未实机单机/联机验收。
- GitHub Pages 免费托管，无需账户；地形和 JSON 按需联网读取。保留旧笔记，退役旧版离线缓存。

**[下载 Mod 安装包](https://littlhmw.github.io/rainward/downloads/WhereShouldIGo.zip)**。网页顶部有直接 GitHub 项目入口。源码在 [rain-guide](rain-guide/)，参阅 [运行说明](rain-guide/README.md)、[Mod 安装](rain-guide/mod/README.md)、[Steam 工坊上传教程](rain-guide/docs/WORKSHOP.md)、[来源与许可](rain-guide/upstream/UPSTREAM.md)、[验证记录](rain-guide/docs/QA.md)及[下载用途与完整卸载](rain-guide/docs/UNINSTALL.md)。工坊尚未上传。

已下载的上游前端与小资源集中在 rain-guide/upstream/，原始约 506 KB；上游 CC0、Leaflet BSD-2-Clause、原创修改 MIT、Wiki 分类摘录 CC BY-SA 4.0。游戏和第三方素材仍属各自权利人。固定地形 Mod 提醒不会扫描玩家的 Mod 列表。
