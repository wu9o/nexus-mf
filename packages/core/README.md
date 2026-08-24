# @nexus-mf/core

React loader for sandboxed Webpack Module Federation micro-frontends.

```bash
pnpm add @nexus-mf/core react react-dom react-router-dom
```

```tsx
import { SandboxMFE } from '@nexus-mf/core';

<SandboxMFE
  name="dashboard"
  url="https://cdn.example.com/dashboard/1.0.0/remoteEntry.js"
  version="1.0.0"
  basename="/dashboard"
  fallbackVersions={[{
    version: '0.9.0',
    url: 'https://cdn.example.com/dashboard/0.9.0/remoteEntry.js',
  }]}
/>
```

The remote container must expose `./App`, use the same container name, and share React, React DOM, and React Router as singletons.

See the complete [Chinese usage guide](../../docs/USAGE.zh-CN.md) or [English usage guide](../../docs/USAGE.md).
