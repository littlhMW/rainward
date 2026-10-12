# 我该去哪儿 / Where Should I Go

《雨世界》地图与故事线索工具。直接基于 [Rain World Map](https://rain-world-map.github.io/) 的开源前端调整，以真实房间、连接和地形为主体，使用简洁的黑白、方角界面。

**网站地址：[littlhmw.github.io/rainward](https://littlhmw.github.io/rainward/)** · **[源码](https://github.com/littlhMW/rainward)**

沿用原有免费 GitHub Pages 地址与仓库。[改版验证记录](docs/QA.md)列出本版实际检查与限制。

## 地图与线索

- 默认遮罩地形，保留原地图的房间节点与真实连接；关闭遮罩即显示地形。可以拖动、缩放、按房间代码定位。
- 普通地名正常显示。按 Wiki 同页导航框的明确分组，默认隐藏 17 个剧透区域名；可单独开启地名显示，规则见 [Wiki 核对记录](docs/WIKI-SPOILERS.md)。房间图像、代码及主动展开的提示不属于该开关的保护范围。
- 保留故事线索，先给轻提示，再逐步展开方向与目的地；每个角色分别保存线索进度。区域路线给下一步方向，选中起点房间后，可在地图数据足够明确时标出通向下一地区出口的房间连接参考。
- 九位常规剧情角色在同一地图界面选择。基础三位及 Downpour 五位使用 Rain World Map 数据；Watcher 使用 Alduris Watcher Map 的真实房间、连接与地形。Watcher 动态传送仍以当前存档为准，不推测存档中的实时跨区网络。
- 生存帮助、进度备份导入导出和旧版旅途笔记保留；备份与笔记位于“说明 / 数据”中。无需账户。

门槛、单向通路、角色能力与剧情条件可能影响可通行性。地图连接参考不是安全路径保证。基础三位的“启用了 Downpour”设置用于路线建议；地图仍按上游当前角色数据源加载，不应将此设置误认为已有每个角色、每个 DLC 组合的完整地形版本。

**如果使用了新增或修改地形、房间或连接的 Mod，地图和提示可能不准确，请以游戏实际情况为准。** 这是固定提醒，本工具不扫描地形 Mod。

## 可选游戏 Mod

[下载 Mod 安装包](https://littlhmw.github.io/rainward/downloads/WhereShouldIGo.zip) · [源码、安装与卸载说明](mod/README.md)。可分发的 ZIP 在 downloads/WhereShouldIGo.zip，本地构建原件在 mod/dist/。

默认在游戏内按住 **G 0.6 秒**，打开系统默认浏览器并传入当前区域、房间、位置快照；按键及按住时长可在 Remix 中修改。不需要先复制坐标，不自动改剪贴板。再按一次才会更新位置，不持续追踪。

已实现雨甸本地角色定位及战役选择，雨甸自由模式的故事提示仅供参考。Mod 已成功编译并核对公开接口，**尚未完成单机或真实联机实机验收**。安装包不含游戏 DLL、雨甸 DLL、BepInEx 或游戏素材，也不自动安装到游戏目录。

## 本地运行与检查

需要已有 Node.js 18 或更新版本。前端所需 Leaflet 已随上游静态文件保留，**无需 npm install**。

在本目录运行：

    npm run serve

打开 [http://127.0.0.1:4173/](http://127.0.0.1:4173/)，按 Ctrl+C 停止。预览只监听本机，不创建服务、自启动项或全局配置。

    npm test

浏览器检查使用 scripts/check-browser.mjs。复跑时先启动预览，并让 PLAYWRIGHT_MODULE 指向已有 Playwright、BROWSER_PATH 指向已有 Edge/Chrome；运行 node scripts/check-browser.mjs。SITE_URL 可覆盖待检查地址，产物在 test-results/，可以单独删除。测试数量与完成状态见 [QA 记录](docs/QA.md) 的对应版本，不能沿用旧版结果宣称新界面已验证。

## 联网、数据与许可

本版是真实在线地图：区域 JSON 和地形瓦片按需从上游读取，需要网络，也受上游可用性影响。旧版核心向导的离线 Service Worker 与 rainward- 缓存正在退役，不再提供离线地图承诺。

进度和笔记保存在浏览器 localStorage 的 rainward.progress.v1 中，兼容旧版记录；不同浏览器不会自动同步。可在“说明 / 数据 → 本地数据”备份或清除。重置当前角色时保留其旧笔记；清除本站数据才会删除所有角色记录与笔记，不修改游戏存档。

Mod 位置使用 URL # 片段传入，HTTP 请求不会把该片段发送给托管服务器；网页脚本、浏览器历史及分享链接仍可看到它。地图请求会访问上游服务，本项目没有账户、后台位置服务器或定时上传。

下载的上游静态前端与配套小资源原始约 506 KB，集中在 upstream/。上游代码为 CC0，随附 Leaflet 为 BSD-2-Clause，保留各自许可证及作者来源；游戏美术仍属相应权利人。原创修改为 MIT；Wiki 分类摘录按 CC BY-SA 4.0，不能用项目 MIT 覆盖第三方内容。

[来源及许可证](upstream/UPSTREAM.md) · [资料范围](docs/SOURCES.md) · [免费部署](docs/DEPLOY.md) · [下载用途与完整卸载](docs/UNINSTALL.md)
