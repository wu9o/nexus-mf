---
title: 集成主应用
---

# 集成主应用

主应用负责路由、导航、远程配置和公共依赖；微应用负责自身页面和业务。推荐让主应用从 Remote Manifest 读取远程信息，再把单个条目传给 `SandboxMFE`。

## 推荐的加载链路

```text
remote-manifest.json
        ↓
loadRemoteManifest()
        ↓
校验 schema、URL、origin、integrity
        ↓
根据当前路由选择 remote
        ↓
SandboxMFE 加载和挂载
```

## 从 Manifest 创建运行时配置

```tsx
import { useEffect, useState } from 'react';
import { loadRemoteManifest, SandboxMFE } from '@nexus-mf/core';

export function DashboardRoute() {
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof loadRemoteManifest>>['remotes'][string]>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    loadRemoteManifest('/remote-manifest.json', {
      allowedOrigins: ['https://cdn.example.com'],
      requireHttps: true,
    })
      .then((manifest) => setRemote(manifest.remotes.dashboard))
      .catch((reason) => setError(reason));
  }, []);

  if (error) return <p>远程配置加载失败：{error.message}</p>;
  if (!remote) return <p>正在读取远程配置…</p>;

  return (
    <SandboxMFE
      name={remote.name}
      url={remote.entry}
      version={remote.version}
      integrity={remote.integrity}
      basename={remote.basename}
      exposedModule={remote.exposedModule}
      fallbackVersions={remote.fallbackVersions}
    />
  );
}
```

## 路由约定

- 主应用的路由必须覆盖远程的挂载路径，例如 `/dashboard/*`。
- `basename` 必须与远程应用内部的 `BrowserRouter` 配置一致。
- 远程应用不要假设自己运行在域名根路径下。
- GitHub Pages 等静态托管环境需要为 SPA 深层链接提供 `404.html` 回退。

## 共享依赖约定

主应用和所有远程应用应尽量使用同一主版本的 React，并在 Module Federation 中配置为 singleton。否则可能出现 Hooks、Context 或路由实例不一致的问题。

```js
shared: {
  react: { singleton: true, requiredVersion: '^18.2.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
  'react-router-dom': { singleton: true },
}
```
