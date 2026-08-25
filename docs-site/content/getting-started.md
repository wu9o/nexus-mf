---
title: 快速开始
---

# 快速开始

## 1. 安装核心包

在主应用中安装核心包及 React peer dependencies：

```bash
pnpm add @nexus-mf/core react react-dom react-router-dom
```

如果使用 npm：

```bash
npm install @nexus-mf/core react react-dom react-router-dom
```

## 2. 挂载一个远程微应用

`SandboxMFE` 接收远程 `remoteEntry.js` 地址，并默认加载远程容器暴露的 `./App`：

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
| `name` | 必须与远程 Module Federation 容器名称一致。 |
| `url` | 远程 `remoteEntry.js` 地址。 |
| `basename` | 远程应用内部 Router 的挂载前缀。 |

### 常用可选字段

| 字段 | 说明 |
| --- | --- |
| `version` | 主版本标识，默认是 `current`。 |
| `integrity` | 主入口的 SRI 值，例如 `sha384-...`。 |
| `fallbackVersions` | 按顺序尝试的备用版本。 |
| `exposedModule` | 远程暴露模块，默认是 `./App`。 |
| `timeout` | 共享依赖和远程入口的超时时间，默认 5000ms。 |
| `loadingFallback` | 加载期间展示的 React 节点。 |
| `errorFallback` | 所有版本失败后的错误展示。 |
| `onLoad` / `onFallback` / `onError` | 运行时生命周期回调。 |

## 3. 启动仓库示例

```bash
git clone https://github.com/wu9o/nexus-mf.git
cd nexus-mf
pnpm install
pnpm --parallel --stream -r --filter './examples/**' start
```

示例地址：

- 主应用：`http://localhost:3000`
- Dashboard：`http://localhost:3001`
- 用户管理：`http://localhost:3002`
- 工作区设置：`http://localhost:3003`

## 4. 验证安装

```bash
pnpm test
pnpm -r build
```

如果打开主应用后远程区域为空，优先阅读[故障排查](./guides/troubleshooting.md)，重点检查 `remoteEntry.js`、容器名称、共享依赖和路由 `basename`。
