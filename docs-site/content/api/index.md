---
title: 核心能力总览
---

# 核心能力总览

Nexus MF 的核心 API 当前集中在 `@nexus-mf/core`，示例应用间的消息协议集中在 `@mf/shared-config`。

| 能力 | API / 包 | 解决的问题 |
| --- | --- | --- |
| 沙箱加载 | `SandboxMFE` | 加载、初始化并挂载远程 React 微应用。 |
| 远程配置 | `loadRemoteManifest` | 校验远程地址、版本、来源和完整性字段。 |
| 版本回退 | `fallbackVersions` | 主版本不可用时按顺序尝试备用版本。 |
| CSS 清理 | 运行时生命周期 | 最后一个实例卸载时移除远程新增样式。 |
| 类型化通信 | `@mf/shared-config` | 在宿主和微应用之间传递带类型的事件。 |

## 核心 API 导出

```ts
import {
  SandboxMFE,
  loadRemoteManifest,
  REMOTE_MANIFEST_SCHEMA_VERSION,
} from '@nexus-mf/core';
```

下一步：

- [Remote Manifest](./remote-manifest.md)
- [版本回滚](./version-rollback.md)
- [CSS 生命周期](./css-lifecycle.md)
- [微应用通信](./communication.md)
