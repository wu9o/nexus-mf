---
title: 微应用通信
---

# 微应用通信

示例工程通过 `@mf/shared-config` 提供轻量的事件协议。消息会自动补充 `id` 和 `timestamp`，并支持按 `source` 与 `type` 过滤。

## 发布事件

```tsx
import { publish } from '@mf/shared-config';

publish({
  source: 'settings',
  type: 'settings:theme-changed',
  payload: { theme: 'dark' },
});
```

## 订阅事件

```tsx
import { subscribe } from '@mf/shared-config';
import type { NexusMFMessage } from '@mf/shared-config';

const unsubscribe = subscribe<NexusMFMessage>(
  (message) => {
    console.log(message.type, message.payload);
  },
  { source: 'settings' },
);

// React 组件卸载时取消订阅
unsubscribe();
```

## 扩展事件类型

已知事件在 `packages/shared-config/index.d.ts` 中通过 `NexusMFEventMap` 定义。业务团队可以为自己的事件扩展映射，避免不同应用使用相同事件名表达不同语义。

```ts
declare module '@mf/shared-config' {
  interface NexusMFEventMap {
    'orders:created': {
      orderId: string;
    };
  }
}
```

## 设计约束

- 事件只传递轻量状态，不建议用它传输大型数据或替代服务端接口。
- `source` 使用稳定的应用名，`type` 使用带领域前缀的事件名。
- 订阅必须在组件卸载时取消，避免重复处理和内存泄漏。
- 需要可靠投递、持久化或跨页面通信时，应使用更合适的基础设施。
