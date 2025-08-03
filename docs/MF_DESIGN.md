# Webpack MF + Garfish Sandbox 微前端架构设计

## 1. 核心目标与设计哲学

本架构旨在实现一个**“零侵入”**的微前端解决方案，同时具备强大的 **JS 沙箱隔离**能力。

- **主应用**: 负责应用的整体布局、路由和微前端的加载与编排。
- **子应用**: 应为**标准的 Webpack Module Federation 应用**，无需为微前端环境进行任何专门的代码改造。其技术栈、开发和构建流程应与独立应用保持一致。

这种设计哲学确保了团队间的低耦合、子应用的可独立部署与维护性，以及未来迁移的灵活性。

---

## 2. 最终架构方案：“基建原生，容器桥接，业务隔离”

我们采用 **Webpack Module Federation 的 `dynamic remote containers`** 能力，结合 **`@garfish/browser-vm`** 的 JS 沙箱，实现了我们的目标。

### 2.1. 整体架构图

```mermaid
graph TD
    subgraph 主应用 (main-app)
        A[BrowserRouter] --> B{App Layout};
        B --> C[SandboxMFE Loader];
        C -- 动态设置 --> D[window.dashboardUrl];
        C -- 加载 --> E[remoteEntry.js];
    end

    subgraph 原生 Window 环境
        D;
        E -- 执行 --> F[创建 MF 容器 window.dashboard];
        G[主应用 __webpack_share_scopes__];
        F -- .init(G) --> H[完成“握手”];
    end
    
    subgraph Garfish Browser-VM Sandbox
        I[Sandbox 实例];
        J[隔离的 window (Proxy)];
        K[桥接的 MF 容器];
        L[桥接的共享作用域];
        M[子应用 React 组件树];
    end

    C -- 创建 --> I;
    I -- 拥有 --> J;
    C -- 桥接 H --> K;
    C -- 桥接 G --> L;
    C -- 在沙箱中调用 K.get() --> M;

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style H fill:#bbf,stroke:#333,stroke-width:2px
    style M fill:#9f9,stroke:#333,stroke-width:2px
```

### 2.2. 各部分职责详解

| 职责             | 主应用 (`main-app`)                                                                                                                                                                                                                         | 子应用 (`dashboard`, etc.)                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **构建配置**     | 1. **`ModuleFederationPlugin`**: <br>   - 通过 `remotes` 配置动态远程应用，URL 使用全局变量占位（`dashboard@[dashboardUrl]/remoteEntry.js`）。<br>   - 通过 `shared` 提供共享依赖。 | 1. **`ModuleFederationPlugin`**: <br>   - 通过 `exposes` 暴露模块。<br>   - 通过 `shared` 声明共享依赖。 |
| **依赖共享**     | **Webpack MF 标准机制**: <br>1. 在加载子应用前，调用 `__webpack_init_sharing__('default')` 初始化共享作用域。<br>2. 在 `remoteEntry.js` 加载后，调用 `container.init(__webpack_share_scopes__.default)` 完成“握手”。 | **Webpack MF 标准机制**: <br>在 `init` “握手”成功后，子应用运行时会自动从主应用提供的共享作用域中获取依赖。                                                       |
| **应用加载**     | **“基建原生”**: <br>1. 在 `SandboxMFE.js` 中，通过**动态创建 `<script>` 标签**的方式，在**原生 `window` 环境**中加载 `remoteEntry.js` 并完成 `init` “握手”。 | `remoteEntry.js` 在原生环境中被加载和初始化。                                                                                                                            |
| **沙箱与渲染**   | **“容器桥接，业务隔离”**: <br>1. 创建 `@garfish/browser-vm` 沙箱。<br>2. 将原生 `window` 中已初始化的**容器**和**共享作用域**，“桥接”到沙箱的 `global` 对象上。<br>3. 在沙箱中，通过 `sandbox.execScript` **手动调用** `container.get()` 和 `factory()` 来获取模块。<br>4. 在沙箱中，为子应用**重建渲染环境**（`createRoot`, `BrowserRouter`），并渲染组件。 | 子应用的业务代码和渲染逻辑，完全在隔离的沙箱环境中执行。                                                                                                                  |
| **路由机制**     | 使用 `<BrowserRouter>` 管理全局路由。                                                                                                                                                                             | 在沙箱中渲染时，为其包裹一个新的 `<BrowserRouter>` 并提供正确的 `basename`，使其拥有独立的、与主应用 URL 同步的路由上下文。                                                                                                                  |

---

## 3. 核心代码实现 (`SandboxMFE.js`)

```javascript
import React, { useState, useEffect, useRef } from 'react';
import Sandbox from '@garfish/browser-vm';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

/* global __webpack_init_sharing__, __webpack_share_scopes__, __webpack_require__ */

// 在原生环境中加载并初始化 MF 容器
const loadAndInitRemoteContainer = (appName, url) => {
  return new Promise((resolve, reject) => {
    __webpack_init_sharing__('default');
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      const container = window[appName];
      container.init(__webpack_share_scopes__.default);
      resolve(container);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const SandboxMFE = ({ name, url, basename }) => {
  const [AppComponent, setAppComponent] = useState(null);
  const containerRef = useRef(null);
  const sandboxRef = useRef(null);

  useEffect(() => {
    let sandbox;
    const loadApp = async () => {
      try {
        // 1. 基建原生：在原生环境中完成 MF 的加载和握手
        const nativeContainer = await loadAndInitRemoteContainer(name, url);

        // 2. 创建沙箱
        sandbox = new Sandbox({ namespace: name, disableWith: false });
        sandboxRef.current = sandbox;

        // 3. 完全桥接：将容器、共享作用域、运行时都注入沙箱
        sandbox.global[name] = nativeContainer;
        sandbox.global.__webpack_share_scopes__ = __webpack_share_scopes__;
        sandbox.global.__webpack_require__ = __webpack_require__;

        // 4. 业务隔离：在沙箱中获取模块
        const factory = await new Promise((resolve, reject) => {
          sandbox.global.__ON_FACTORY_LOADED__ = (f) => f ? resolve(f) : reject();
          sandbox.execScript(`
            window.${name}.get('./App').then(window.__ON_FACTORY_LOADED__);
          `);
        });
        const Module = factory();
        setAppComponent(() => Module.default);
      } catch (error) {
        console.error(`[SandboxMFE] Failed to load app ${name}:`, error);
      }
    };
    loadApp();
    return () => {
      if (sandbox) sandbox.close();
    };
  }, [name, url]);

  useEffect(() => {
    if (AppComponent && containerRef.current) {
      const sandbox = sandboxRef.current;
      if (!sandbox || !sandbox.global) return;

      // 5. 业务隔离：在沙箱中重建渲染环境
      sandbox.global.React = React;
      sandbox.global.ReactDOM = ReactDOM;
      sandbox.global.BrowserRouter = BrowserRouter;

      sandbox.execScript(`
        let root = window.__SANDBOX_REACT_ROOT__;
        if (!root) {
          root = ReactDOM.createRoot(containerRef.current);
          window.__SANDBOX_REACT_ROOT__ = root;
        }
        root.render(
          React.createElement(BrowserRouter, { basename: basename }, React.createElement(AppComponent))
        );
      `, { AppComponent, containerRef: containerRef, basename });
    }
    // 清理函数
    return () => {
      const sandbox = sandboxRef.current;
      if (sandbox && sandbox.global) {
        sandbox.execScript(`
          if (window.__SANDBOX_REACT_ROOT__) {
            Promise.resolve().then(() => window.__SANDBOX_REACT_ROOT__.unmount());
          }
        `);
      }
    };
  }, [AppComponent, basename]);

  return <div ref={containerRef} />;
};
```
