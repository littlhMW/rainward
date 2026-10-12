# 雨间 · 我该去哪 | Rainward · Where Should I Go

《雨世界》PC Remix/BepInEx 小工具：**按住 G 0.6 秒**，系统默认浏览器打开 [雨间](https://littlhmw.github.io/rainward/)，带上当前地点、游戏实际记录的已访问房间、少量剧情状态和可读取的玩家位置。网页据此遮罩未探索房间，并提供逐层展开的故事线索。

按键和按住时长可在 Remix → 雨间 · 我该去哪 / Rainward → 配置中修改。一次按住只打开一次；松开后再按才能更新位置。从其他窗口、菜单或新一局返回游戏后，需要在游戏内松开一次再按，避免旧按键误触。网页得到的是按键时的位置快照，不会持续追踪游戏。工具不读写剪贴板，也不修改存档。

## 安装和使用

1. 从网页下载 `WhereShouldIGo.zip`（当前版本 1.1.0），关闭游戏。
2. 解压，将里面完整的 `whereshouldigo` 文件夹放入游戏的 `RainWorld_Data/StreamingAssets/mods/`。最终应有 `mods/whereshouldigo/modinfo.json` 和 `mods/whereshouldigo/plugins/WhereShouldIGo.dll`。
3. 在游戏 Remix 中启用「雨间 · 我该去哪 / Rainward」，应用更改，按游戏提示重启。
4. 进入故事游戏，在房间内按住 G。Remix 配置页可改键，并调整到 0.2–2.0 秒。

需要支持 Remix 的 PC 游戏版本；DLL 使用本机 Rain World 1.11.8 对应程序集编译，不需要另装 .NET SDK。发布包不含任何游戏 DLL、BepInEx、Rain Meadow 或游戏贴图。

1.1.0 增加了 v2 压缩快照协议与真实探索进度。Mod ID `littlhmw.whereshouldigo`、安装文件夹 `whereshouldigo`、程序集 `WhereShouldIGo.dll` 保持不变。由 1.0.x 更新时关闭游戏后覆盖同名文件夹中的本工具文件即可，保留原有按键配置，无需另建一个模组文件夹；网页继续识别旧 v1 位置链接。

浏览器打开时，联机世界会继续运行，请先停在安全的位置。此工具不自动暂停游戏；失焦、暂停/其他菜单、竞技场、角色死亡、管道过渡和暂时没有本地角色时不会报告错误位置。

**如果装有新增或改动地形的 MOD，地图信息可能不准确。** 此提醒固定显示，不扫描地形 MOD，不判断你安装了什么地形模组。官方 DLC 开启状态只用于选择原版/Downpour 图谱。

## 雨甸 / Rain Meadow

雨甸为可选兼容，无需将此工具装到其他玩家机器上。兼容代码通过雨甸自身的 `OnlineManager.lobby.gameMode.avatars` 与 `OnlineEntity.isMine` 确认本地角色。玩家列表从 `lobby.clientSettings` 的每位在游戏中的玩家及其 `avatars` 读取；未同步的位置保留为未知，跨区域抽象位置只标房间，实际房间与同步位置一致时才提供像素坐标。玩家名使用雨甸的 `DisplayName`，尊重其匿名模式，不传 Steam ID。

故事联机使用房间战役的 `StoryGameMode.currentCampaign` 选地图；自己的角色外观单独传递，防止不同角色客机误选世界时间线。多本地角色时选择第一个有效的本地角色；普通本地合作优先当前镜头所跟随的玩家。

单机与房主读取当前 `SaveState` 的 `RegionState.roomsVisited` 及未加载区域的访问记录。客机**只解析雨甸已经同步的房主 `saveStateString`**，不读取、合并客机自己的存档或本周期访问列表。该房主快照主要在周期开始更新，本周期新探索和故事变化可能尚未同步；网页必须展示这一限制。缺少房主快照或无法读取时标为未知，不用客机进度替代。雨甸自由模式可提供玩家位置，但没有可确认的房主故事记录，因此探索与剧情状态标为不可用。

剧情字段只是游戏中的原始记录，例如会面次数、机器人、回响、当前存档休眠房。会面开始不等于听完全部对话，休眠房也可能因传送或强制保存改变；本工具不把它们直接标成任务完成。

已核对 [Rain Meadow 公开源码](https://github.com/henpemaz/Rain-Meadow/tree/0cade766a851405bea89c7475ae88480c59df083) 的相关 API，并读取本机 Rain Meadow 0.1.15.2 程序集元数据确认相同字段/属性存在。**尚未在游戏内完成单机或真实联机验收**；源码核查、成功编译与自动检查不等于实机兼容保证。

## 数据与网页协议

v2 格式：

```text
https://littlhmw.github.io/rainward/#v=2&data=BASE64URL_GZIP_UTF8_JSON
```

JSON 的 `character` 是用于地图与剧情线索的战役角色，`avatar` 是本地角色内部名；`x/y` 是房间格坐标。`px/py` 是角色身体的房间像素坐标，`cx/cy` 是房间摄像机位置各轴的最小值。`players` 包含可读取的玩家与可用精度；`progress` 带有来源、快照新鲜程度、存档标识、周期、完整已访问房间列表和原始剧情字段。存档标识由战役与随机种子组成，不包含账号信息。房间遮罩依据访问列表，不使用可能混有本地其他进度的像素地图迷雾。

数据放在 URL `#` 后的 fragment，浏览器不会把它作为 HTTP 请求路径/查询参数发送到托管服务器。网页 JavaScript 可以读取它，浏览器历史和分享链接也会包含位置、玩家显示名和上述进度。本工具没有网络监听端口、后台服务、定时上传、自动更新或账号系统。

若链接超过 24,000 字符，完整 JSON 保存到游戏数据目录的 `Rainward/snapshot.json`，再打开网页导入界面；游戏提示和 BepInEx 日志会给出实际路径。Windows 通常为 `%USERPROFILE%/AppData/LocalLow/Videocult/Rain World/Rainward/snapshot.json`。只覆盖这个独立导出文件，不截断房间或玩家记录。数据超过 1 MiB、12,000 个房间或 64 位玩家时明确报错，不生成不完整快照。

## 卸载与清理

关闭游戏前在 Remix 取消启用；退出游戏后删除**仅此** `RainWorld_Data/StreamingAssets/mods/whereshouldigo/` 文件夹即可卸载，不影响游戏存档、其他 MOD 或雨甸。

若要同时移除按键配置，删除游戏存档数据目录 `ModConfigs/littlhmw.whereshouldigo.txt`。Windows 的通常位置为 `%USERPROFILE%/AppData/LocalLow/Videocult/Rain World/ModConfigs/littlhmw.whereshouldigo.txt`；游戏使用其他数据位置时以该位置为准。不要删除整个 `ModConfigs` 或游戏存档目录。Remix 可能保留禁用模组的条目，它不含游戏进度且不需清理整个全局配置。

网页数据与 Mod 配置分开：可在网页清除本站数据，或在浏览器删除 `littlhmw.github.io` 的对应站点数据；需要时单独删除浏览器历史中的位置链接。最后删除下载的 ZIP 即可。

如曾因链接过长导出 JSON，另删除上述游戏数据目录下的 `Rainward/snapshot.json`；若 `Rainward` 文件夹已空，可删除该空文件夹。不要删除整个游戏数据目录。

## 源码构建

只需已有 .NET SDK 8 和正版游戏提供的程序集，不添加 NuGet 包或全局开发依赖：

```powershell
./build.ps1 -GamePath 'D:/Steam/steamapps/common/Rain World'
```

结果在 `dist/WhereShouldIGo-1.1.0.zip`，完整目录在 `dist/whereshouldigo/`。脚本只构建和打包，不向游戏目录安装文件。可独立运行逻辑检查：

```powershell
dotnet run --project tests/ModLogic.Tests.csproj -c Release
```

可选：在命令末尾加 `-- '你的 Rain Meadow.dll 路径'` 验证已安装雨甸程序集的接口元数据，不加载或运行该程序集。

若已有 Node.js，可在运行上述 C# 检查后执行 `node tests/check-web-protocol.mjs`，把实际 C# 生成的九角色、雨甸和自定义角色链接交给网页的 `src/location.js` 解析，检查角色、坐标和像素位置协议。

## Steam 创意工坊发布准备

游戏内置上传入口位于 Remix：选中本地模组后，打开其创意工坊上传入口。先按上面的安装步骤使用 `dist/whereshouldigo/` 完整发布包，再从该本地模组发起上传。上传器会读取 `modinfo.json` 的名称和说明，以根目录 `thumbnail.png` 作为封面，并上传整个已安装模组目录，因此该目录应只包含发布包内容。

本仓库的 `mod/workshop/description.txt` 是完整中文上架文案，供发布时人工检查或编辑工坊页面；它不会被上传器自动读取。初次上传的精简说明已写入 `modinfo.json`，包括网页需要联网、可改键、雨甸尚未实机验收等限制。源码目录、研究缓存、构建产物和本地路径配置不进入发布包。构建脚本只打包，不自动安装、启动游戏或发布工坊条目。

下载及配置用途：

| 内容 | 意义 | 清理方法 |
| --- | --- | --- |
| `plugins/WhereShouldIGo.dll`、`modinfo.json` | 功能本体与 Remix 注册信息 | 删除独立的 `whereshouldigo` 文件夹 |
| `thumbnail.png` | Remix/工坊使用的项目封面 | 随 `whereshouldigo` 文件夹一起删除 |
| `ModConfigs/littlhmw.whereshouldigo.txt` | 保存可配置按键与按住时长 | 删除该文件；不要删除其他模组配置 |
| 游戏数据目录 `Rainward/snapshot.json` | 仅链接过长时完整导出快照，供网页导入 | 删除该文件及已空的 `Rainward` 文件夹 |
| 源码目录 `.cache/rain-meadow/` | 本次下载的公开源码片段，用于核查雨甸接口 | 仅开发时存在，不进发布包，直接删除此目录 |
| 源码目录 `bin/`、`obj/`、`tests/bin/`、`tests/obj/` | .NET 编译及检查产物 | 直接删除这些项目内目录 |
| 源码目录 `.cache/nuget/` | 构建时将来若有包缓存的限定位置；本版无外部包 | 如存在，直接删除此目录 |
| 源码目录 `dist/` | 可分发 DLL 与 ZIP | 删除此目录，不影响源码或游戏 |

源码依据仓库 MIT 许可发布。封面图片由用户提供给本项目使用，未另行声明第三方再利用许可；代码 MIT 不自动覆盖图片。Rain World 归其权利人所有；雨甸只进行可选 API 调用，未把雨甸源码或 DLL 编入发布包。
