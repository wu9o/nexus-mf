---
title: 接入远程微应用
---

# 接入远程微应用

远程应用是一个可以独立开发、构建和部署的 React 应用。它通过 Webpack 5 Module Federation 暴露一个入口模块，主应用再由 Nexus MF 负责加载和挂载。

## Webpack 配置

```js
const { ModuleFederationPlugin } = require('webpack').container;

new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
    'react-router-dom': { singleton: true },
  },
});
```

## 远程应用的入口约定

1. `name` 必须与 `SandboxMFE.name` 以及 Manifest 的 `name` 一致。
2. `remoteEntry.js` 必须能被主应用所在页面访问。
3. 容器必须暴露 `./App`，或者在主应用中显式指定 `exposedModule`。
4. 应用内部路由必须接受宿主传入的 `basename`。
5. 动态插入的样式应当进入 `document.head`，这样框架才能追踪并在卸载时清理。

## 远程应用的独立验证

在主应用接入前，先单独确认：

```bash
curl -I https://cdn.example.com/dashboard/1.0.0/remoteEntry.js
```

然后检查：

- 返回状态为 200；
- `Content-Type` 是 JavaScript 类型；
- CDN 没有返回登录页或错误 HTML；
- `name` 与容器注册名一致；
- 远程应用与宿主使用兼容的 React 和 React DOM 版本。
