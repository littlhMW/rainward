# 雨间：卸载与清理

网页与游戏 Mod 可以独立移除。下载和构建文件限定在项目目录；本次另将本工具的 5 个发布文件复制到游戏的独立 mods/whereshouldigo/ 目录，供 Remix 识别与工坊上传准备。没有新建系统服务、自启动项、全局 npm 包或后台位置服务器。先备份要保留的网页记录，再按需要清理，避免删除游戏存档及其他项目文件。

## 下载和配置分别做什么

| 内容 | 意义 | 位置与清理方式 |
| --- | --- | --- |
| 网页 HTML、CSS、JavaScript、故事数据 | 构成地图入口、线索与本地进度功能 | 在 rain-guide/ 内；停止预览后可删除该项目目录 |
| 下载的上游前端及配套小资源，原始约 506 KB | 保留许可的 Rain World Map 地图渲染，含 Leaflet、样式与图标 | 集中在 rain-guide/upstream/，连同目录中的许可一起保留；整体卸载时删除目录 |
| 远程区域 JSON、地形瓦片 | 按选择的区域显示原地图房间与地形，不在项目中存整套瓦片 | 由地图前端按需读取；常规 HTTP 缓存由浏览器管理，不是离线服务 |
| package.json、scripts/serve.mjs | 提供本地预览与测试命令 | 无需 npm install；Ctrl+C 停止预览，删除项目即可移除脚本 |
| 浏览器测试与 test-results/ | 用已有 Playwright/浏览器检验功能并保存截图 | 删除 test-results/ 清理产物，不卸载其他项目共用工具 |
| localStorage 键 rainward.progress.v1 | 保留旧版及新版角色进度、偏好与笔记 | 在“说明 / 数据 → 本地数据”导出或清除 |
| sw.js 与旧 rainward- 缓存 | 新版仅用于退役旧版离线功能，防止旧缓存持续覆盖新界面 | 正常更新后清除旧缓存并撤销旧服务；必要时用下文手动清理 |
| manifest.webmanifest | 提供网页名称、图标和独立窗口展示信息 | 不安装服务；若曾安装网页应用，在浏览器应用管理移除 |
| mod/dist/ 的 DLL、完整 Mod 文件夹与 ZIP | 可分发的游戏定位工具 | 未安装时直接删除构建包；已安装按下文移除独立 Mod 目录 |
| 本次复制到游戏的 mods/whereshouldigo/ | 让 Remix 识别本地 Mod，并准备上传工坊；仅含 modinfo.json、plugins/WhereShouldIGo.dll、thumbnail.png、README.md、LICENSE | 完整路径见下文；退出游戏后只删除此独立目录，不动其他 Mod |
| mod/workshop/description.txt、artwork.png 与 mod/thumbnail.png | 工坊文案、用户原图在项目内的副本，以及以已有 Pillow 最近邻放大并黑底补边的 1120×630 封面；封面也用于 GitHub README 横幅并已复制到游戏 | 均为项目文件，可分别删除；不会修改或删除桌面的 C:/Users/littlh/Desktop/雨间.png 原图，不影响游戏存档，未创建工坊条目；没有安装新依赖 |
| mod/.cache/rain-meadow/ | 下载公开源码片段以核对雨甸接口 | 开发资料，不进发布包；直接删除此项目子目录 |
| mod/bin/、mod/obj/、mod/tests/bin/、mod/tests/obj/、mod/.cache/nuget/ | 编译、测试及限定的构建缓存位置 | 如存在可删除这些项目子目录；不影响游戏与源码 |
| ModConfigs/littlhmw.whereshouldigo.txt | 保存 Mod 按键与长按时长 | 只删除这一配置文件，不删除整个 ModConfigs |
| 游戏数据目录 Rainward/snapshot.json | 压缩链接过长时完整保存访问记录和玩家位置，供网页手动导入 | 只删除这个文件；若 Rainward 文件夹空了，可删除空文件夹，不碰游戏存档 |
| GitHub Pages 与部署工作流 | 免费托管与推送后发布静态网页 | 取消发布并禁用本站工作流；不必删除源码仓库 |
| 仓库级 Git 作者配置 | 提交署名 littlhMW / littlhMW@users.noreply.github.com | 仅在本仓库 .git/config，不修改全局；共享父仓库配置不要随子项目删除 |

完整取用来源与许可见 [第三方声明](../THIRD-PARTY-NOTICES.md) 和 [上游说明](../upstream/UPSTREAM.md)，Mod 的构建和清理说明见 [Mod README](../mod/README.md)。Node、.NET SDK、Edge 等已有通用工具可能被其他项目使用，卸载本工具不需要删除它们。发布包不包含游戏或雨甸 DLL。

用户已授权 artwork.png、thumbnail.png 及其生成版本用于本项目 GitHub 展示、Pages、Mod 和 Steam 工坊，并允许为这些用途修改与再发布；仓库代码 MIT 许可不自动适用于图片。卸载本项目时只移除项目副本与生成封面，不删除桌面原图。具体范围见 [第三方声明](../THIRD-PARTY-NOTICES.md)。

## 停止本地预览

在运行 npm run serve 的终端按 Ctrl+C。服务监听本机 127.0.0.1:4173，没有安装为系统服务。停止后关闭相关网页即可。

## 清除网页记录与旧缓存

需要保留进度时，先在“说明 / 数据 → 本地数据 → 导出进度”备份。

- “重置当前角色进度”只重置该角色的线索与探索记录，保留它的旧笔记和其他角色。
- “清除本站数据”删除所有角色记录、笔记与旧版离线缓存，不修改游戏存档。之后继续使用并保存会重新产生本地进度；完整移除时清理后关闭本站标签页。
- 单纯退役旧版 Service Worker 不应清除 rainward.progress.v1，旧笔记继续保留。新版不再提供离线地图功能。

如果无法使用页面清理，在浏览器开发者工具 Application / 应用中：

1. 仅删除 localStorage 中的 rainward.progress.v1。
2. 删除名称以 rainward- 开头的 Cache Storage 项。
3. 注销脚本 URL 和 scope 对应本站目录的 sw.js Service Worker，不动同域其他项目的服务。

本地预览与线上网站各有自己的存储。littlhmw.github.io 同域下其他项目可能共享存储空间；浏览器“清除整个站点数据”会影响同域其他网页，优先按上述键和服务范围清理。

下载到电脑的 JSON 备份、Mod ZIP 和浏览器历史不会随着网页清理自动删除。需要时单独删除。位置链接的 URL # 片段会保留在历史或分享链接里；可在浏览器中删除相关历史。

若曾安装“雨间”网页应用，在浏览器应用管理中移除，快捷方式也可单独删除。

## 卸载游戏 Mod

详细步骤以 [Mod README](../mod/README.md#卸载与清理) 为准：

本次准备上传时使用的本地目录为：D:/Steam/steamapps/common/Rain World/RainWorld_Data/StreamingAssets/mods/whereshouldigo/。仅放入 1.1.0 的上述 5 个发布文件，未复制游戏程序集或雨甸程序集。本轮更新没有启动或启用游戏；此前为查看 Remix 上传入口启动过游戏，但尚未进入存档进行单人或联机功能实测。工坊准备与发布步骤见 [WORKSHOP.md](WORKSHOP.md)。

1. 在 Remix 取消启用“雨间 · 我该去哪 / Rainward”（如果已启用），退出游戏。
2. 只删除游戏目录中的 RainWorld_Data/StreamingAssets/mods/whereshouldigo/。
3. 如要恢复按键配置的初始状态，只删除游戏数据目录里的 ModConfigs/littlhmw.whereshouldigo.txt。
4. 若生成过长链接导出，删除游戏数据目录中的 Rainward/snapshot.json；文件夹已空时可删除该空文件夹，不删除游戏数据目录。
5. 不再需要时删除下载的 ZIP；网页进度按上节单独清理。

不要删除 Rain Meadow、BepInEx、游戏原有 DLL、整个 mods/、ModConfigs/ 或存档目录。本工具不修改游戏存档，也不会卸载其他 Mod。

## 移除本地项目或停止公开访问

停止预览并备份所需文件后，在资源管理器确认目标为本项目的 rain-guide/ 再删除。它位于共享父仓库内，**不要连带删除父目录、父仓库 .git 或桌宠应用源码**。仓库根目录的本站 Pages 工作流需要单独禁用或移除；不要改动其他项目工作流。

取消线上发布的方法见 [DEPLOY.md](DEPLOY.md#撤销发布)。停站不会自动删除访问者自己的浏览器进度。只需停站时，无需删除 GitHub 仓库和历史。
