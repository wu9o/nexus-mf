# Nexus MF 使用手册

本文面向第一次接入 Nexus MF 的开发者，说明如何把 `@nexus-mf/core` 接入一个 React + Webpack 5 Module Federation 主应用。

## 1. 当前定位

Nexus MF 当前是一个 React 优先的微前端框架和实验性核心包，适合：

- 构建一个加载多个远程微应用的主应用；
- 在沙箱中挂载远程 React 应用；
- 运行时通过 Manifest 选择远程入口和版本；
- 在远程加载失败时按顺序回退；
- 清理远程应用注入的 CSS；
- 通过共享事件协议进行主应用与微应用通信。

当前版本仍建议以 alpha/preview 方式使用。正式生产接入前，应补充 Manifest 签名、密钥轮换、CDN 缓存策略和部署阶段的 integrity 自动生成。

## 2. 安装

在主应用中安装核心包及 React peer dependencies：

```bash
pnpm add @nexus-mf/core react react-dom react-router-dom
```

如果使用 npm：

```bash
npm install @nexus-mf/core react react-dom react-router-dom
```

## 3. 最小接入

`SandboxMFE` 负责加载 `remoteEntry.js`、初始化 Module Federation 容器，并在沙箱中挂载暴露的 React 应用。

```tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SandboxMFE } from '@nexus-mf/core';

export default function HostApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/dashboard/*"
          element={(
            <SandboxMFE
              name="dashboard"
              url="https://cdn.example.com/dashboard/1.0.0/remoteEntry.js"
              version="1.0.0"
              basename="/dashboard"
            />
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 必填字段

| 字段 | 说明 |
| --- | --- |
| `name` | 必须与远程 Module Federation 容器名称一致 |
| `url` | 远程 `remoteEntry.js` 地址 |
| `basename` | 远程应用内部 Router 使用的挂载前缀 |

### 常用可选字段

| 字段 | 说明 |
| --- | --- |
| `version` | 当前主版本标识 |
| `integrity` | 主 `remoteEntry.js` 的 SRI 值，例如 `sha384-...` |
| `fallbackVersions` | 按顺序尝试的备用版本列表 |
| `exposedModule` | 暴露模块，默认是 `./App` |
| `timeout` | 共享依赖和远程入口的加载超时，默认 5000ms |
| `onLoad` | 远程成功挂载后的回调 |
| `onFallback` | 某个版本失败、准备尝试下一个版本时的回调 |
| `onError` | 所有版本都失败后的回调 |

## 4. 远程应用如何配置

远程应用需要通过 Webpack Module Federation 暴露 `./App`，并与主应用共享 React 运行时：

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

主应用的 `name`、Manifest 中的 `name`、远程的 `name` 必须一致。远程内部的 Router 应使用与 Manifest 相同的 `basename`。

## 5. 使用 Remote Manifest

推荐把远程应用配置从组件代码中移到 `remote-manifest.json`：

```json
{
  "schemaVersion": 1,
  "remotes": {
    "dashboard": {
      "name": "dashboard",
      "version": "1.0.0",
      "entry": "https://cdn.example.com/dashboard/1.0.0/remoteEntry.js",
      "basename": "/dashboard",
      "exposedModule": "./App",
      "integrity": "sha384-替换为真实的Base64Hash",
      "fallbackVersions": [
        {
          "version": "0.9.0",
          "url": "https://cdn.example.com/dashboard/0.9.0/remoteEntry.js"
        }
      ]
    }
  }
}
```

主应用启动时加载并限制远程来源：

```tsx
import { loadRemoteManifest } from '@nexus-mf/core';

const manifest = await loadRemoteManifest('/remote-manifest.json', {
  allowedOrigins: ['https://cdn.example.com'],
  requireHttps: true,
});

const dashboard = manifest.remotes.dashboard;
```

Manifest 加载器会校验：

- `schemaVersion` 是否为 `1`；
- 远程入口是否为 `http` 或 `https`；
- 生产环境是否满足 HTTPS 要求；
- 主版本和所有回退版本是否来自允许的 origin；
- `integrity` 是否符合 SRI 格式。

## 6. 版本回滚

当主版本在加载、初始化或获取暴露模块时失败，`SandboxMFE` 会按 `fallbackVersions` 的顺序继续尝试：

```tsx
<SandboxMFE
  name="dashboard"
  url="https://cdn.example.com/dashboard/1.2.0/remoteEntry.js"
  version="1.2.0"
  basename="/dashboard"
  fallbackVersions={[
    {
      version: '1.1.0',
      url: 'https://cdn.example.com/dashboard/1.1.0/remoteEntry.js',
    },
  ]}
  onFallback={({ failed, next, error }) => {
    console.warn('版本回退', failed.version, '=>', next.version, error);
  }}
  onLoad={({ version, usedFallback }) => {
    console.info('实际加载版本', version, { usedFallback });
  }}
  onError={(error) => console.error('所有远程版本均失败', error)}
/>
```

本地示例可以访问 [Dashboard 回滚演示](http://localhost:3000/dashboard?rollback=1)，查看主版本失败后的自动回退。

## 7. CSS 生命周期

框架会追踪远程运行时新增到 `document.head` 的 `style` 和 stylesheet 节点，并在最后一个使用该远程运行时的实例卸载后移除它们。

远程应用仍应遵循以下约定：

- 为组件 class 添加应用前缀，例如 `nexus-dashboard__header`；
- 不要修改或移除主应用已有的 style/link 节点；
- 弹窗、Portal 等挂载到 body 的组件需要单独验证样式边界；
- CSS Modules 或 Shadow DOM 暂未作为默认方案，使用前先确认组件库兼容性。

## 8. 微应用通信

示例中的 `@mf/shared-config` 提供带类型信息的事件协议：

```tsx
import { publish, subscribe } from '@mf/shared-config';
import type { NexusMFMessage } from '@mf/shared-config';

publish({
  source: 'settings',
  type: 'settings:theme-changed',
  payload: { theme: 'dark' },
});

const unsubscribe = subscribe<NexusMFMessage>(
  (message) => console.log(message.type, message.payload),
  { source: 'settings' },
);

// 组件卸载时取消订阅
unsubscribe();
```

消息会自动补充 `id` 和 `timestamp`，并通过 `source`、`type` 支持过滤。生产项目建议为自己的事件扩展 `NexusMFEventMap`，避免不同团队使用相同事件名表达不同语义。

## 9. 本地运行示例

```bash
pnpm install
pnpm --parallel --stream -r --filter './examples/**' start
```

访问：

- 主应用：<http://localhost:3000>
- Dashboard：<http://localhost:3001>
- 用户管理：<http://localhost:3002>
- 工作区设置：<http://localhost:3003>

生产构建：

```bash
pnpm test
pnpm -r build
```

## 10. 常见问题排查

### 页面提示 Manifest 加载失败

检查 `remote-manifest.json` 是否能访问，以及是否使用了当前支持的 `schemaVersion: 1` 和 `remotes` 结构。

### 提示远程 origin 不允许

检查 `loadRemoteManifest` 的 `allowedOrigins` 是否包含远程入口的 origin。开发环境的多个 localhost 端口需要分别加入白名单。

### 微应用一直 Loading

检查远程 `remoteEntry.js` 是否返回 200、`name` 是否一致、共享依赖是否配置为 singleton，以及 `basename` 是否与主应用路由一致。

### 切换路由后样式残留

检查远程是否动态插入了未被追踪的节点，或是否把节点插入了 `document.head` 之外的位置。宿主和远程也应避免使用相同的全局 class。

## 11. 当前限制

- 当前核心 API 主要面向 React 和 Webpack 5；
- Manifest 签名、密钥轮换、CDN 缓存策略仍在规划中；
- integrity 字段已经支持，但生产构建暂未自动生成 hash；
- Vue、Svelte 适配器和网络请求拦截尚未提供。
