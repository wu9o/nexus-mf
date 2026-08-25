# Nexus MF 发布策略

## 分支职责

- `main`：唯一集成、发布和 GitHub Pages 部署分支。
- `codex/*`、`feat/*`、`fix/*`：短生命周期功能分支，通过 Pull Request 合并到 `main`。
- 不再使用长期 `develop` 分支承载发布。需要 alpha 快照时，从 GitHub Actions 手动选择要发布的分支或提交。

## 自动化流程

### Pull Request CI

`.github/workflows/ci.yml` 在所有面向 `main` 的 PR 上运行：

1. `pnpm install --frozen-lockfile`
2. `pnpm test`
3. `pnpm -r build`

它只负责验证，不发布、不部署。

### 合并到 main 后

`.github/workflows/deploy.yml` 负责构建并部署示例站点和框架使用手册。示例位于站点根路径，Cogita 生成的手册位于 `/nexus-mf/docs/`。

`.github/workflows/release.yml` 负责读取 `.changeset/*.md`：

1. 有待发布 changeset 时创建版本 PR；
2. 版本 PR 合并后发布 `@nexus-mf/core`；
3. 发布完成后创建 GitHub Release。

### Alpha 快照

`.github/workflows/publish-alpha.yml` 只允许手动触发，不再监听 `develop` push。它会对选中的 ref 创建 snapshot 版本，并发布到指定 npm dist-tag，避免旧分支自动发布或绕过主干验证。

## 开发者发布步骤

1. 在功能分支完成代码和测试。
2. 添加一个 changeset：

   ```bash
   pnpm changeset
   ```

3. 创建 PR 并等待 CI 通过。
4. 合并到 `main`。
5. Release Workflow 创建版本 PR。
6. 合并版本 PR 后由 Workflow 发布 npm 包。

## 重要约束

- 不要直接向 `main` 推送未经 CI 验证的发布改动。
- 不要在 `develop` 上积累长期未同步的发布提交。
- 同一时间只允许一个 Release Workflow 运行。
- `NPM_TOKEN` 必须配置在 GitHub Actions Secrets 中；没有该 Secret 时只会在发布步骤失败，不应影响 PR CI。

## 文档站点

手册使用 Cogita Core/CLI 和站点侧文档主题构建，内容位于 `docs-site/content/`，本地命令为：

```bash
pnpm build:docs
pnpm preview:docs
```

修改框架公共 API 时，应同步更新 `docs-site/content/` 和根目录 README 中的在线手册链接。
