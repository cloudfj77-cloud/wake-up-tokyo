# 游戏版本约定

`package.json` 的 `version` 是本仓库的版本来源，`game.stage` 表示开发阶段，当前为 `demo`。Vite 自动将版本显示在游戏菜单、页面标题、FBX 预览页以及构建的 `version.json` 中；`package-lock.json` 同步记录同一版本。

- 修 Bug、小型 UI 或数值调整：最后一位加一，例如 `0.2.0 → 0.2.1`。
- 新地图、Boss、武器或完整玩法系统：中间一位加一，最后一位归零。
- 首次正式发行才使用 `1.0.0`。旧工程中占位用的 `1.0.0` 不代表已经正式发行；本次统一到已验收的 Demo v0.2.1。
- 一批可试玩更新只升一次号。同一批在本地和 GitHub 同步时不重复升号。

后续更新使用 `npm version patch --no-git-tag-version`（新玩法换成 `minor`），同步修改 CHANGELOG.md。完成 `npm test`、`npm run build` 和实际试玩后，提交并合并 PR，再给通过验收的提交建立 `vX.Y.Z` 标签。已有标签不能覆盖。

团队并行开发时由整合者统一升号；不要让不同 PR 各占一个版本号。本地 ForgeaX 工程使用自己的 `npm run version:bump` 命令，同步同一批游戏内容时保持相同版本号。存档格式、依赖版本和 ForgeaX schemaVersion 不跟着游戏版本一起改。
