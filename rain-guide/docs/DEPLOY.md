# 雨间：免费发布到 GitHub Pages

本项目是纯静态网站。GitHub Free 的公开仓库可免费使用 Pages；不需要后端服务器、数据库、付费域名或支付信息。原版与 Downpour 地图 JSON 和地形瓦片由保留许可的地图前端按需访问上游，网站自身不承载整套大型地图；Watcher 仅提供原作者网站外链。

沿用网站地址 [https://littlhmw.github.io/rainward/](https://littlhmw.github.io/rainward/) 与源码仓库 [littlhMW/rainward](https://github.com/littlhMW/rainward)。旧版“雨间”曾成功发布；本次真实地图与 Mod 改版是否上线，以最新 Actions、公开页面和下载包核对结果为准，不能用旧部署记录代替新版验证。

## 当前仓库布局

源码放在 rain-guide/ 子目录，GitHub 识别的是仓库根目录 .github/workflows/pages.yml。rain-guide/.github/workflows/pages.yml 是将网站单独放到仓库根时使用的模板，不能在父仓库中自行触发发布。

发布分支为 main；推送匹配路径的修改或手动运行 Pages 工作流会触发部署。Pages 设置的 Source 应为 GitHub Actions，部署环境应允许实际使用的分支。

发布前应完成：

1. 在 rain-guide/ 执行 npm test，失败则不发布。
2. 用本地预览检查新版首页及 GitHub 项目入口、真实房间/地形加载、拖拽缩放、单房间遮罩与剧透地名开关、游戏 v2 快照和所有可读取的雨甸玩家位置、Watcher 故事线索及外部地图链接、移动布局和进度导入导出。
3. 确认静态发布目录包含下表所有必要文件，且没有带入游戏 DLL、构建缓存、测试截图或个人文件。
4. 如提供 Mod 下载，核对 ZIP 内只包含独立 Mod 文件夹及本项目 DLL/说明，没有游戏或雨甸程序集。Mod 源码编译不等于实机联机验收。
5. 等待最新部署任务成功，随后验证公开地址显示“雨间”、地图可加载、Mod 下载可用。只有这些完成后才记录新版已上线。

具体测试结论由 [QA 记录](QA.md) 的对应版本注明；不要把旧版测试数量直接写作新版结果。

## 必要的静态发布内容

| 内容 | 原因 |
| --- | --- |
| index.html、icon.svg、manifest.webmanifest | 网页入口、图标与网页应用名称 |
| src/ 中浏览器引用的模块及样式 | 界面、故事数据、v1/v2 快照协议、单房间遮罩、房间路径与剧透分类 |
| upstream/ 全部配套文件及许可证 | 同源运行修改后的原地图前端，含 Leaflet 与所需小资源 |
| sw.js | 保持旧 URL 可更新，用于退役旧版离线缓存及 Service Worker |
| downloads/WhereShouldIGo.zip（如页面提供下载） | 网站的 Mod 下载入口，来自已核对的构建 ZIP |
| 页面所链接的来源、许可文件 | 保留第三方署名与许可，避免部署后来源链接失效 |
| map-source-notice.html | Watcher 外部地图来源说明页 |
| THIRD-PARTY-NOTICES.md | 说明原创代码、上游前端、Leaflet、地图数据、Wiki、字体和委托图片的许可边界 |

不能沿用旧版“仅复制 8 个文件”的发布清单。新增浏览器模块、上游目录或下载文件后，要同步更新两种仓库布局的发布步骤。不要将 mod/ 下整个开发环境、缓存或引用程序集原样复制到站点。

构建准备产生的 _site/ 应只含公开静态文件。位置通过 URL # 片段进入网页，不需要为定位新增服务器、端口、API 密钥或数据库。原版/Downpour 真实地图依赖上游在线数据，本版不构建离线地图包；Watcher 只保留外部地图入口，不在发布目录内嵌其地图数据。

## 在新公开仓库部署

1. 创建公开仓库，并把 rain-guide/ 中的项目内容放在仓库根，保留所需目录结构。复制前确认不含构建缓存、游戏程序集或本地私密文件。
2. 使用项目提供的根布局工作流；同步检查其包含上一节的完整发布清单。
3. 在 Settings → Pages → Source 选择 GitHub Actions。
4. 推送到工作流允许的分支，等待部署完成。
5. 使用 Pages 设置实际给出的 URL。网页路径为相对路径，可部署在仓库子路径下。

如果保留 rain-guide/ 子目录布局，应使用父仓库工作流及相应 working-directory。不要用根布局模板覆盖其他项目的工作流。

也可从分支直接部署静态文件，但要先停用 Actions 发布，避免两个发布源混用；同样必须保留 upstream/、src/、许可和可用的下载路径；Watcher 不得改为本地内嵌。

## 配置的用途与撤销

| 配置 | 用途 | 撤销方式 |
| --- | --- | --- |
| GitHub 公开仓库 | 保存源码及修改历史 | 可备份后删除；停止网站通常无需删仓库 |
| Pages 发布设置 | 免费 HTTPS 访问地址 | 在 Settings → Pages 取消发布 |
| Pages 工作流 | 校验并上传静态文件 | 在 Actions 禁用本站工作流或删除对应文件 |
| actions/setup-node 与 npm test | 在临时执行器中运行已有测试 | 不安装到本机，无需 npm install |
| _site/ 与发布清单 | 限定上线内容，保留必要第三方许可 | 本地测试生成时可单独删除；GitHub 临时目录随任务清理 |
| pages: write、id-token: write | 允许部署任务发布到 Pages | 移除工作流中的授权或禁用任务 |
| manifest.webmanifest | 显示名称、图标与独立窗口信息 | 移除文件与页面引用；不等同离线缓存 |
| sw.js 退役脚本 | 清除旧缓存，避免旧向导继续覆盖改版 | 迁移期间保留同 URL，旧用户更新后注销；不清除进度笔记 |
| 仓库级 Git 作者配置 | 提交署名 littlhMW / littlhMW@users.noreply.github.com | 仅作用于当前仓库；不要更改全局配置 |

GitHub 服务限额与条款仍适用；本项目不配置自定义域名或收费服务。

## 撤销发布

1. 在 Settings → Pages 使用 Unpublish site；若采用分支发布，也可将发布分支改为 None。
2. 在 Actions 禁用本站 Pages 工作流，避免之后推送再次上线。
3. 确认 Pages 设置已显示未发布；边缘缓存可能短暂保留旧页面。
4. 仅当也不需要源码时，备份后删除仓库。停站本身不要求删除仓库历史。

本地文件、旧缓存、浏览器进度与游戏 Mod 的分别清理见 [UNINSTALL.md](UNINSTALL.md)。
