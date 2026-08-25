---
title: 版本回滚
---

# 版本回滚

`SandboxMFE` 会把主版本和 `fallbackVersions` 组成有序候选列表。当入口加载、共享依赖初始化或暴露模块获取失败时，它会继续尝试下一个候选版本。

## 配置回退链

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
      integrity: 'sha384-备用版本Hash',
    },
    {
      version: '1.0.0',
      url: 'https://cdn.example.com/dashboard/1.0.0/remoteEntry.js',
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

## 回退顺序

```text
1.2.0（主版本） → 1.1.0 → 1.0.0
```

只要某个候选版本完成入口加载、容器初始化并成功获取暴露模块，后续版本就不会继续尝试。所有候选版本失败后才会触发 `onError`。

## 发布建议

- 每个远程版本使用不可变 URL，不要覆盖已经发布的 `remoteEntry.js`。
- 回退版本应该经过与当前宿主兼容性验证。
- 回退链不宜过长，通常保留一个稳定版本即可。
- 通过 `onFallback` 上报版本失败，便于发现 CDN、共享依赖或远程构建问题。
- Manifest 中的回退 URL 同样需要经过 origin 和 HTTPS 校验。
