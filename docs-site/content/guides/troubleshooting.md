---
title: 故障排查
---

# 故障排查

## 远程区域为空或一直 Loading

依次检查：

1. `remoteEntry.js` 是否返回 200；
2. `SandboxMFE.name` 是否与远程容器名称一致；
3. 主应用是否已经初始化 Webpack shared scope；
4. React、React DOM 和 `react-router-dom` 是否配置为 singleton；
5. `basename` 是否与远程应用路由一致；
6. 远程暴露模块是否为 `./App`，或是否正确设置了 `exposedModule`。

## Manifest 加载失败

- 检查 Manifest 是否使用 `schemaVersion: 1` 和 `remotes` 包装结构；
- 检查 `entry` 和回退 URL 是否使用 `http` 或 `https`；
- 检查 `allowedOrigins` 是否包含实际远程 origin；
- 生产环境开启 `requireHttps` 后，所有入口必须是 HTTPS；
- `integrity` 必须是 `sha256-`、`sha384-` 或 `sha512-` 开头的 SRI 值。

## 样式切换后残留

检查远程是否把 style/link 节点加入 `document.head`，以及是否为宿主节点错误地添加了 Nexus MF 标记。还要确认远程没有使用与宿主相同的全局 class。

## 版本没有按预期回退

回退只会在入口加载、容器初始化或暴露模块获取失败时发生。确认：

- `fallbackVersions` 是有序数组；
- 每个 URL 可单独访问；
- 回退版本与当前宿主兼容；
- `onFallback` 没有被业务代码吞掉异常信息。

## GitHub Pages 页面 404 或资源 404

确认 `site.base`、`site.url` 和 `builderConfig.output.assetPrefix` 都使用：

```text
/nexus-mf/docs/
```

如果只修改了配置但没有重新执行生产构建，旧的 `doc_build` 仍可能引用旧路径。

## 自动发布没有创建版本 MR

检查仓库的 Actions 设置：

- Workflow permissions 允许读写；
- 允许 GitHub Actions 创建和批准 Pull Request；
- 仓库 Secrets 中存在 `NPM_TOKEN`。
