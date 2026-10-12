# 免费发布到 GitHub Pages

雨间是纯静态网页，发布时不需要 Node 服务、数据库、云服务器或付费域名。GitHub Free 账号可以为**公开仓库**免费提供 GitHub Pages。公开仓库中的源代码和提交历史也可被其他人查看；不要上传密码、令牌或个人文件。

以下步骤是发布方法，不表示当前项目已经部署成功。公开地址以 GitHub 仓库 Pages 设置中实际显示的地址为准。

预计发布目标是公开仓库 [littlhMW/rainward](https://github.com/littlhMW/rainward) 和网页 [https://littlhmw.github.io/rainward/](https://littlhmw.github.io/rainward/)，**目前仍待部署与公开访问验证**。仓库认证、创建或上传成功都不等于网页已上线。当前交付保留父仓库中的 `rain-guide/` 目录，初始分支为 `codex/rainward`，仓库根已提供与这一结构配套的工作流。

## 通用方式：站点文件位于独立仓库根目录

1. 在 GitHub 创建一个公开仓库，例如 `rainward`。名称可以更换。
2. 将 `rain-guide` 文件夹**里面的内容**放到该仓库根目录，让 `index.html`、`package.json` 和 `.github` 位于根目录。网页使用相对路径，可部署在仓库名称对应的子路径下。
3. 在仓库 `Settings → Pages → Build and deployment → Source` 中选择 **GitHub Actions**。
4. 将文件推送到 `main` 或 `codex/rainward` 分支。附带的 `.github/workflows/pages.yml` 会使用 Node.js 20 执行 `npm test`（即跨平台的 `node --test`），测试通过后上传静态页面并发布。也可在 `Actions → Deploy Rainward to GitHub Pages → Run workflow` 手动触发。不需要安装 npm 依赖。
5. 等待部署任务成功，再到 `Settings → Pages` 打开 GitHub 提供的公开地址。通常形如 `https://你的用户名.github.io/仓库名/`，但最终请以页面显示为准。

首次部署可能需要几分钟。若部署失败，在 Actions 中查看失败步骤；失败的任务不代表网站已发布。更改网页后再次推送 `main` 或 `codex/rainward` 即可更新。

两份工作流均配置 `branches: [main, 'codex/rainward']`。以后改用其他发布分支时，同步更新触发分支；如 Pages 环境另有分支保护，也需允许实际发布分支。

## 保留在现有仓库的 rain-guide 子目录

GitHub 只会识别**仓库根目录**下的 `.github/workflows/`。项目目前位于子目录时，不能只依靠 `rain-guide/.github/workflows/pages.yml` 触发部署。

当前父仓库根目录的 `.github/workflows/pages.yml` 已配置好以下内容，直接保留即可：

1. 使用 Node.js 20，在 `rain-guide` 目录运行 `npm test`；失败时不部署。
2. 只将浏览器需要的以下 8 个文件复制到 `_site`，再以 `path: '_site'` 上传：`index.html`、`icon.svg`、`manifest.webmanifest`、`sw.js`、`src/app.js`、`src/engine.js`、`src/data.js`、`src/style.css`。文档、测试和本地开发服务不会成为网站发布产物；它们仍属于公开仓库中的源码。
3. 在仓库 Pages 设置中选择 GitHub Actions，然后推送工作流和项目内容。

如果以后把项目移到其他仓库，需要将根工作流一起移动，并同步修改测试的 `working-directory` 与复制源路径。新增浏览器必须加载的文件时，也要将其加入工作流复制清单和适用的离线缓存清单。不要覆盖目标仓库中无关的工作流。

这种方式会把 `rain-guide` 的内容作为 Pages 站点根目录发布，公开 URL 中通常**不再额外加 `/rain-guide/`**。请使用 GitHub 返回的地址。

2026-10-12 本地已通过 43 项 Node 测试和 33 项浏览器检查。浏览器检查使用已有 Playwright 与 Edge，由 `scripts/check-browser.mjs` 执行，没有为本项目下载依赖或浏览器；复跑方式见 [README](../README.md#本地运行)。Pages 自动流程执行 Node 测试；本地浏览器检查通过不能代替部署后公开 URL 的验收。

## 简单方式：网页上传文件 + 从分支部署

不想使用 Actions 时，可以直接从分支发布：

1. 创建公开仓库。将站点文件上传到仓库根目录，确保 `index.html` 位于根目录，并保留代码中引用的目录结构。`scripts`、`tests` 和 `docs` 不是运行网页所必需的文件。
2. 不上传 `.github/workflows/pages.yml`，或先停用该工作流，避免两种发布方式同时运行。
3. 到 `Settings → Pages`，选择 `Deploy from a branch`，分支选择 `main`，目录选择 `/ (root)`，保存。
4. 等待 GitHub 的 Pages 构建完成，打开设置中出现的站点地址。

浏览器上传通常不方便处理隐藏文件夹。如果需要保留完整版本历史和 Actions，使用 GitHub Desktop 或 Git 命令上传整个项目更合适。

## 每项配置的用途

| 文件或设置 | 用途 | 是否付费／如何撤销 |
| --- | --- | --- |
| GitHub 公开仓库 | 保存网页源文件与历史版本 | 免费；可下载备份后删除仓库 |
| Pages 发布设置 | 为静态文件提供 HTTPS 公开地址 | 公开仓库可免费使用；可取消发布 |
| `.github/workflows/pages.yml` | 推送后自动上传并发布站点 | 使用 GitHub 提供的 Actions；禁用或删除工作流即可停止自动发布 |
| `actions/setup-node` 与 `npm test` | 在 GitHub 临时执行器使用 Node.js 20 校验项目，失败时阻止发布 | 不安装到本机，不安装第三方项目依赖 |
| `_site` 临时目录与显式复制清单 | 只发布浏览器必需的 HTML、样式、脚本、图标、manifest 和 Service Worker | 仅在临时执行器中生成，任务结束后自动清理 |
| `pages: write` 和 `id-token: write` | 让该工作流部署本站到 Pages | 只授予部署任务；删除工作流即可撤销该配置 |
| `actions/*` 步骤 | 在 GitHub 临时执行器中取文件、准备 Pages、上传和部署 | 不安装到本机；任务结束后临时执行器被清理 |
| `manifest.webmanifest` | 提供站点名称、图标、主题与独立窗口信息 | 免费；移除文件和 HTML 引用即可撤销，不等于离线缓存 |
| `sw.js` | 在本站范围缓存核心向导，实现首次成功访问后的离线使用 | 免费；网页「清除所有」可删除缓存并注销服务，详见卸载说明 |

本项目不配置自定义域名，不需要填写账单信息。GitHub 的服务限额与条款仍适用；若将来选择私有仓库、额外付费服务或自定义域名，应另行确认成本。

## 撤销发布

1. 在 `Settings → Pages` 使用 **Unpublish site**（如果当前界面提供）。如果从分支发布，也可以将发布分支改为 `None`。
2. 在 `Actions` 中禁用 Pages 工作流，或删除仓库根目录的 `.github/workflows/pages.yml`，避免下次推送再次发布。
3. 刷新并确认 Pages 设置显示未发布。GitHub 缓存可能短暂保留旧页面。
4. 如还要删除源码，在备份需要保留的文件后删除仓库。删除仓库会连同其提交历史一起移除，通常不必为了停止网页发布而删除仓库。

本地文件与浏览器记录的清理见 [卸载说明](UNINSTALL.md)。
