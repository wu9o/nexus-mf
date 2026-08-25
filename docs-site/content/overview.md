---
title: Nexus MF 使用手册
---

# Nexus MF 使用手册

Nexus MF 是一个面向 React + Webpack 5 Module Federation 的沙箱微前端框架。它把远程微应用的加载、共享依赖初始化、版本回退、CSS 生命周期和应用间通信整理成一套可以复用的宿主侧能力。

## 这套框架解决什么问题？

在传统 Module Federation 接入中，主应用通常需要自己处理远程入口加载、容器初始化、共享 React 版本、加载失败回退，以及远程卸载后的样式清理。Nexus MF 将这些运行时工作集中在 `@nexus-mf/core` 的 `SandboxMFE` 组件中。

```text
主应用
  └─ SandboxMFE
      ├─ 加载 remoteEntry.js
      ├─ 初始化 Webpack shared scope
      ├─ 在 Garfish sandbox 中挂载远程 React 应用
      ├─ 按顺序尝试主版本与回退版本
      └─ 卸载时释放远程运行时和样式
```

## 推荐阅读路径

1. [快速开始](./getting-started.md)：安装核心包并挂载第一个微应用。
2. [集成主应用](./guides/integration.md)：了解路由、Manifest 和运行时入口的组合方式。
3. [接入远程微应用](./guides/remote-app.md)：配置远程 Webpack 构建和共享依赖。
4. [Remote Manifest](./api/remote-manifest.md)：把远程地址、版本和安全校验从代码中抽离。
5. [版本回滚](./api/version-rollback.md)、[CSS 生命周期](./api/css-lifecycle.md)和[微应用通信](./api/communication.md)：使用框架的增强能力。
6. [部署与发布](./guides/deployment.md)：构建示例、发布 npm 包和部署文档站。

## 当前能力边界

- 核心运行时主要面向 React 和 Webpack 5 Module Federation。
- Remote Manifest 支持版本化结构、HTTPS 要求、可信 origin 白名单和 SRI 格式校验。
- 远程入口支持主版本失败后的有序回退。
- 远程运行时新增的 `style` 和 stylesheet 节点可以在最后一个实例卸载时清理。
- `@mf/shared-config` 提供带类型约束的事件协议，用于宿主与微应用通信。
- Manifest 签名、密钥轮换、CDN 缓存策略和 Vue/Svelte 适配器不属于当前核心能力。

## 在线资源

- [在线示例](https://wu9o.github.io/nexus-mf/)
- [GitHub 仓库](https://github.com/wu9o/nexus-mf)
- [npm：@nexus-mf/core](https://www.npmjs.com/package/@nexus-mf/core)
