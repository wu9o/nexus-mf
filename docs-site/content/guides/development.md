---
title: 本地开发与测试
---

# 本地开发与测试

## 启动示例

```bash
pnpm install
pnpm --parallel --stream -r --filter './examples/**' start
```

主应用和三个远程应用需要同时启动。修改 `packages/core` 后，建议重新构建核心包并刷新主应用。

## 验证命令

```bash
pnpm test
pnpm -r build
pnpm build:docs
```

`pnpm test` 会运行工作区中存在的测试；递归构建会同时验证核心包、示例远程和本手册站点。

## 本地预览手册

```bash
pnpm --filter docs-site dev
```

生产构建后也可以预览最终静态产物：

```bash
pnpm build:docs
pnpm --filter docs-site preview
```

## 修改文档的建议

- 先在手册首页说明能力边界，再在 API 页面给出可复制代码。
- 所有示例都要与 `packages/core/src` 和 `packages/shared-config` 的实际导出保持一致。
- 涉及线上部署路径的链接使用 `/nexus-mf/docs/` 作为基础路径。
- 如果修改了公共 API，同时更新根目录 README 和对应手册页面。
