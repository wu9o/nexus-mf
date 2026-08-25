---
title: 部署与发布
---

# 部署与发布

本仓库把在线示例和框架手册部署在同一个 GitHub Pages 站点：

- 示例：<https://wu9o.github.io/nexus-mf/>
- 使用手册：<https://wu9o.github.io/nexus-mf/docs/>

## 构建目录

Cogita 输出目录是 `docs-site/doc_build`。部署工作流会把它放到最终站点的 `_site/docs/`，不会覆盖主应用和远程微应用的目录。

```text
_site/
├── index.html             # 主应用
├── dashboard/             # Dashboard 远程
├── user-management/       # 用户管理远程
├── settings/              # 设置远程
└── docs/                  # Nexus MF 使用手册
```

## GitHub Actions

推送到 `main` 后，`.github/workflows/deploy.yml` 会依次执行：

1. 安装锁定版本的 pnpm 依赖；
2. 运行测试；
3. 递归构建核心包、示例应用和 docs-site；
4. 上传各应用和手册产物；
5. 组装 `_site` 并部署到 GitHub Pages。

## npm 发布

框架包使用 Changesets 管理版本：

1. 功能分支在变更时添加 `.changeset/*.md`；
2. 合并到 `main` 后，Release 工作流自动创建版本发布 MR；
3. 审阅并合并发布 MR 后，Changesets 使用 `NPM_TOKEN` 发布包。

Alpha 快照通过 `Publish Alpha Snapshot` 工作流手动指定分支和 dist-tag，不再由长期 `develop` 分支自动触发。

## 发布前检查

```bash
pnpm test
pnpm -r build
pnpm build:docs
```

同时确认：

- `docs-site/cogita.config.ts` 的 `base` 与线上路径一致；
- `docs-site/doc_build/index.html` 存在；
- 手册中的内部链接没有指向旧的 `/cogita/` 路径；
- `NPM_TOKEN` 已配置且 GitHub Actions 具备创建版本发布 MR 的权限。
