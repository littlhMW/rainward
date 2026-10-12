# 雨间 · 我该去哪：Steam 创意工坊上传

这份说明用于把已经构建好的本地 Mod 上传到《雨世界》创意工坊。**当前仅完成上传准备，没有创建或上传任何工坊条目，也没有工坊发布链接。** 本轮更新本地目录时没有启动或启用游戏；尚未进入存档进行单人或真实雨甸联机功能实测。

首传保持 **Unlisted / 不公开列出**，先检查介绍、下载内容与运行结果，再自行决定是否公开。Unlisted 不是私密：拿到链接的人仍可能访问，不要放入私密文件。

## 已准备好的文件

本机发布目录：

    D:/Steam/steamapps/common/Rain World/RainWorld_Data/StreamingAssets/mods/whereshouldigo/

目录中只复制了 5 个发布文件：

    whereshouldigo/
      modinfo.json
      thumbnail.png
      README.md
      LICENSE
      plugins/
        WhereShouldIGo.dll

当前版本为 **1.1.0**，显示名称为“雨间 · 我该去哪 / Rainward”，稳定 Mod ID 为 littlhmw.whereshouldigo。该版传入真实已访问房间、少量故事状态和所有可获取玩家位置；客机仅采用房主周期起点探索记录，可能晚于本轮实际进度。不要把项目源码目录、ZIP、bin/obj、游戏 DLL 或雨甸 DLL 塞进这个上传目录。

封面必须放在 Mod 根目录并命名为 thumbnail.png。Wiki 要求 16:9、建议至少 640×360、文件小于 1 MB；本次 PNG 已核对为 **960×540，30,459 字节**。

可编辑的上传材料保留在源码项目：

- [description.txt](../mod/workshop/description.txt)：工坊介绍文字，可直接复制到说明框。
- [thumbnail.svg](../mod/workshop/thumbnail.svg)：封面源图，方便后续编辑；不是 Remix 使用的 PNG。
- [thumbnail.png](../mod/thumbnail.png)：实际发布封面，已复制到上述游戏目录。
- [modinfo.json](../mod/modinfo.json)：本地标题、版本、作者和标签来源；代码功能在 plugins/WhereShouldIGo.dll 中。

## 在游戏里上传

1. 启动 Steam，登录准备作为工坊作者的账号，确认 Steam 在线；从该账号的 Steam 库运行《雨世界》。游戏需要成功初始化 Steam 才能使用工坊上传。若当前游戏没有正确连接 Steam，退出游戏后再从 Steam 启动。
2. 在游戏主菜单进入 **REMIX**。在左侧列表搜索或选中本地“雨间 · 我该去哪 / Rainward”，核对右侧名称、版本与封面。只选择条目即可准备上传，不需要进入游戏存档。
3. 点击所选 Mod **右侧信息框右上角的上传箭头**。这是 Remix 内置上传入口，不需要另装上传器。不同游戏语言的文字可能不同，以箭头位置及“上传至创意工坊”含义为准。
4. 核对上传标题、作者、版本、标签与说明。说明使用上面的 description.txt，保留“需要联网”“尚未实机单人/联机验收”“地图可能受地形 Mod 影响”“房主同步可能延迟”等事实，不要改成已完全兼容的承诺。
5. 首次上传选择 **Unlisted / 不公开列出**。如果上传面板不提供此选项，先保持其提供的非公开状态，创建后在工坊条目的可见性设置中选择 Unlisted；不要为了继续操作直接切换为 Public。这里是本次发布偏好，不是声称所有版本的 Remix 都有相同可见性控件。
6. 如果 Steam 要求接受创意工坊协议，由账号本人阅读并决定是否接受。未接受时条目可能不能完成可见性流程；**不要把协议确认交给自动点击代办**。
7. 点击面板中的确认上传按钮，等待成功提示。若只是打开了上传面板、进度条结束但报错，或没有条目链接，不能算已发布。成功后打开工坊条目，记录它的链接与 item ID，检查实际可见性是否为 Unlisted。
8. 检查封面、标题、完整说明以及内容文件。后续更新应使用同一条目 ID 更新原条目，避免重复新建。保留游戏上传后生成的工坊关联信息；其具体保存方式以游戏实际结果为准，不手工臆造 ID。

以上操作没有订阅费用。无需 Steamworks 开发者账号、额外付费上传工具或自定义服务器；使用拥有游戏和正常工坊权限的 Steam 账号即可。若 Steam 显示账号或社区权限限制，按其具体提示处理。

## 上传入口或结果不正常时

- **列表找不到 Mod**：确认不是多套了一层目录，modinfo.json 应直接位于 whereshouldigo/ 根目录，DLL 位于 plugins/。修改文件后返回主菜单或重启游戏刷新。
- **上传箭头不可用或提示 Steam 未初始化**：确认 Steam 已运行并登录，用 Steam 库重新启动游戏，再查看具体错误。不要因此安装第三方上传器或把账号密码写进脚本。
- **封面不显示**：确认文件名是 thumbnail.png、16:9、小于 1 MB，并且不是把 SVG 改名成 PNG。本次提供的 PNG 满足这些条件。
- **页面提示协议未接受**：由账号本人在 Steam 页面处理；文件上传成功不等于条目已公开可用。
- **条目已生成但可见性不对**：在条目管理页核实和修改，不要反复创建新的同名条目。

发布前仍建议进行真正的单人和雨甸联机功能验证。当前编译、协议检查和上传准备不能代替游戏内长按按键、定位本地玩家及浏览器正确显示地点的验收。

## 本次复制、配置与清理

| 内容或动作 | 意义 | 干净移除方式 |
| --- | --- | --- |
| 复制 5 个文件到游戏独立目录 | Remix 读取本地 Mod，并提供上传内容 | 若启用先在 Remix 禁用，退出游戏后仅删除 whereshouldigo/；不删其他 Mod 或存档 |
| description.txt 与 SVG/PNG 封面 | 准备可审核的说明与封面，PNG 符合 Remix 格式 | 都在本项目内，可单独删除；本次未安装图形工具或额外上传程序 |
| 启动已有 Steam/游戏 | 使用游戏内置上传入口并初始化 Steam | 退出游戏即可；不是安装后台服务，没有新建自启动项 |
| 首次 Unlisted 可见性 | 先供链接检查，避免直接进入公开列表 | 上传后可在工坊条目管理调整；本说明本身没有创建该配置 |
| 接受工坊协议 | Steam 账号本人授权分享内容 | 由本人阅读和操作，不属于文件清理；不代为接受 |
| 上传后的工坊条目（如果后续创建） | 托管可订阅的 Mod 文件 | 在本人条目管理中隐藏或删除；只删本地文件不会撤下线上条目 |
| Mod 按键配置（若游戏已生成） | 保存自定义按键与长按时长 | 只删除游戏数据目录 ModConfigs/littlhmw.whereshouldigo.txt，不删整个配置目录 |

本次写说明只读取公开资料，没有下载新安装包。项目之前下载的地图前端与雨甸参考源码、网页数据及 Mod 卸载详见 [UNINSTALL.md](UNINSTALL.md)。如果以后订阅自己发布的条目，要避免同时保留重复的本地安装副本；取消订阅只能移除 Steam 管理的订阅文件，本次手动复制目录仍需单独清理。

## 核对来源

核对日期：2026-10-12。

- [Rain World Wiki：Remix](https://rainworld.miraheze.org/wiki/Remix)：确认主菜单 Remix、本地 Mod 识别，以及右侧信息框右上角上传箭头。
- [Rain World Modding Wiki：Mod Directories](https://rainworldmodding.miraheze.org/wiki/Mod_Directories)：确认 mods 下的独立目录、根 modinfo.json、thumbnail.png 的 16:9/尺寸/小于 1 MB 要求。
- [Rain World Modding Wiki：ModInfo.json](https://rainworldmodding.miraheze.org/wiki/ModInfo.json)：确认名称、版本、作者、依赖和工坊标签等元数据。
- [Steamworks：Workshop Implementation](https://partner.steamgames.com/doc/features/workshop/implementation) 与 [ISteamUGC](https://partner.steamgames.com/doc/api/ISteamUGC)：说明创建/更新流程及用户需要接受工坊协议的返回状态。无需用户申请开发者权限阅读或照做 Steamworks API；实际上传使用 Remix 内置界面。

文档是本项目编写的操作步骤，不是 Wiki 的逐字翻译；Wiki 页面与第三方服务仍适用各自许可及条款。
