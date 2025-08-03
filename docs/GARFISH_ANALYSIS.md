# Garfish 源码分析：与 Webpack MF 结合的最终方案

本文档记录了在参考了外部实现方案并结合 Webpack Module Federation 核心原理后，得出的关于 `Webpack MF + @garfish/browser-vm` 结合使用的最终结论。

---

## 核心思想：“基建原生，完全桥接，业务隔离”

我们最终的、正确的思想是：

1.  **基建原生**: 让 Webpack Module Federation 的**“握手”过程**在**原生的、无沙箱的 `window` 环境**下进行。
2.  **完全桥接**: 在 MF 容器**在原生 `window` 中被完全初始化**之后，必须将所有 MF 运行时依赖的关键对象，**手动“桥接”或注入**到沙箱的全局 `window` 对象（`sandbox.global`）中。
3.  **业务隔离**: 在所有必要对象都桥接完成后，再使用 `@garfish/browser-vm` 沙箱来**执行和渲染具体的业务组件**。

---

## 最终的、正确的实现流程

### 1. Webpack 配置
-   **主应用**: 必须使用 `ModuleFederationPlugin`，并通过 `shared` 提供共享依赖。
-   **子应用**: 必须使用 `ModuleFederationPlugin`，并通过 `exposes` 暴露模块，同时通过 `shared` 来声明共享依赖。

### 2. 运行时实现 (`SandboxMFE.js`)

#### a. 加载并初始化远程容器 (在原生 `window` 中)
1.  **初始化共享作用域**: 主应用必须首先调用 `__webpack_init_sharing__('default')`。
2.  **加载 `remoteEntry.js`**: 通过动态创建 `<script>` 标签加载。
3.  **执行“握手”**: 在 `onload` 回调中，调用 `window[appName].init(__webpack_share_scopes__.default)`。

#### b. 在沙箱中加载并渲染业务组件
1.  **沙箱生命周期**: **为每一个微应用实例，创建一个全新的 `Sandbox` 实例**。
2.  **“完全桥接”**: **最关键的一步**。将原生 `window` 中所有 MF 相关的对象，都赋值给沙箱的全局对象。
3.  **获取模块**: 采用**异步回调**的方式，在沙箱中安全地调用 `container.get('./App')` 并获取 `factory` 函数。
4.  **执行工厂**: 调用 `factory()` 来获取最终的模块。
5.  **沙箱渲染 (最关键一步)**:
    -   **React Root 复用**: 为了遵循 React 18 的规范，避免在同一个 DOM 容器上重复调用 `createRoot`，必须在沙箱的全局 `window` (`sandbox.global`) 上**缓存和复用 React Root 实例**。
    -   **路由上下文**: 必须在沙箱内部，为子应用组件**重新提供一个 `<Router>` 组件**并设置正确的 `basename`。
    -   **异步卸载**: 为了遵循 React 18 的并发渲染规范，避免 `Attempted to synchronously unmount a root while React was already rendering` 的警告，必须将 `root.unmount()` 的调用**异步化**（例如，包装在 `Promise.resolve().then()` 中）。
    -   **清理**: 在组件卸载时，异步调用 `root.unmount()` 并清理沙箱。
