# Nexus MF Usage Guide

This guide explains how to integrate `@nexus-mf/core` into a React + Webpack 5 Module Federation host.

## Positioning

Nexus MF is currently a React-first alpha/preview framework. It provides a sandboxed `SandboxMFE` loader, runtime manifests, ordered version fallback, remote CSS cleanup, and a typed example event protocol.

Production hardening still includes manifest signing, key rotation, CDN cache policy, and deployment-time integrity generation.

## Installation

```bash
pnpm add @nexus-mf/core react react-dom react-router-dom
```

## Minimal host integration

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

`name`, `url`, and `basename` are required. `version`, `integrity`, `fallbackVersions`, `exposedModule`, `timeout`, `onLoad`, `onFallback`, and `onError` are optional.

## Remote configuration

The remote must expose `./App`, use the same container name, and share the React runtime:

```js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-router-dom': { singleton: true },
  },
});
```

## Runtime Manifest

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
      "integrity": "sha384-REPLACE_WITH_A_REAL_BASE64_HASH",
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

Load it with a trusted origin policy:

```tsx
import { loadRemoteManifest } from '@nexus-mf/core';

const manifest = await loadRemoteManifest('/remote-manifest.json', {
  allowedOrigins: ['https://cdn.example.com'],
  requireHttps: true,
});
```

The loader validates the schema version, URL protocol, HTTPS requirement, remote origins, fallback entries, and SRI format.

## Fallback and lifecycle callbacks

When the primary entry fails during loading, initialization, or module resolution, `SandboxMFE` tries `fallbackVersions` in order and reports the selected version through `onLoad`.

```tsx
<SandboxMFE
  name="dashboard"
  url="https://cdn.example.com/dashboard/1.2.0/remoteEntry.js"
  version="1.2.0"
  basename="/dashboard"
  fallbackVersions={[{
    version: '1.1.0',
    url: 'https://cdn.example.com/dashboard/1.1.0/remoteEntry.js',
  }]}
  onFallback={({ failed, next, error }) => console.warn(failed, next, error)}
  onLoad={({ version, usedFallback }) => console.info(version, usedFallback)}
  onError={(error) => console.error(error)}
/>
```

The local example includes a failure-injection rollback demo at <http://localhost:3000/dashboard?rollback=1>.

## CSS and communication

Remote `style` and stylesheet nodes inserted into `document.head` are tracked and removed after the final mounted instance releases them. Keep remote class names prefixed and do not remove host-owned styles.

The example event bus in `@mf/shared-config` adds `id`, `timestamp`, `source`, `type`, and `payload`, and supports filtered subscriptions:

```tsx
publish({
  source: 'settings',
  type: 'settings:theme-changed',
  payload: { theme: 'dark' },
});
```

## Development

```bash
pnpm install
pnpm --parallel --stream -r --filter './examples/**' start
pnpm test
pnpm -r build
```

See the [Chinese usage guide](./USAGE.zh-CN.md) for troubleshooting and the complete API table.
