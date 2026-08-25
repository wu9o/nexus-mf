---
title: Remote Manifest
---

# Remote Manifest

Remote Manifest 用一个版本化 JSON 文件描述远程微应用。它让远程地址、版本和安全约束可以独立于主应用代码发布。

## Manifest 结构

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

## 校验规则

`loadRemoteManifest` 会校验：

- `schemaVersion` 必须为 `1`；
- 每个远程必须提供 `name`、`version`、`entry` 和 `basename`；
- 入口和回退地址必须使用 `http` 或 `https`；
- `requireHttps: true` 时所有远程入口必须使用 HTTPS；
- `allowedOrigins` 非空时，入口 origin 必须出现在白名单中；
- `integrity` 必须符合 `sha256`、`sha384` 或 `sha512` 的 SRI 格式。

## 宿主侧加载

```tsx
const manifest = await loadRemoteManifest('/remote-manifest.json', {
  timeout: 5000,
  allowedOrigins: ['https://cdn.example.com'],
  requireHttps: true,
});

const dashboard = manifest.remotes.dashboard;
```

开发环境可以把 `http://localhost:3001` 等本地 origin 加入白名单；生产环境建议只允许明确的 CDN 或应用域名。

## 当前边界

Manifest 校验解决的是运行时配置的结构和来源约束，不等同于供应链签名。生产环境仍建议由发布系统生成 integrity，并继续规划 Manifest 签名、密钥轮换和 CDN 缓存失效策略。
