# 微前端架构调试日志 (MF + Garfish) - 完整旅程

本文档详细记录了从零开始，实现 `Webpack Module Federation + @garfish/browser-vm` 微前端架构的完整调试过程，包括所有遇到的问题、错误的假设、深入的源码分析以及最终的解决方案。

---

### V1: `Unexpected reserved word 'await'`
- **问题**: `main-app` 启动时 Webpack 编译失败。
- **分析**: `await` 关键字被直接用在了 `useEffect` 的同步回调函数中。
- **解决方案**: 在 `useEffect` 内部定义一个 `async` 函数来包裹异步逻辑。

---

### V2: `react is not defined` (在子应用中)
- **问题**: 运行时在子应用代码中报错。
- **分析**: 子应用的 `externals` 配置使其依赖 `require` 函数，而我们只通过 `sandbox.global` 注入了全局变量。
- **解决方案 (探索)**: 尝试使用 `sandbox` 的 `modules` 选项注入自定义 `require`。

---

### V3: `MFE container not found`
- **问题**: `remoteEntry.js` 执行后，无法在沙箱中找到子应用容器。
- **分析**: 对 Garfish Core 的分析揭示了我们手动模拟流程的缺陷，特别是对 `evalWithEnv` 函数包裹作用域的误解。
- **解决方案 (探索)**: 尝试更精确地模拟 `App` 类的行为，并探索不同沙箱。

---

### V4: `Module not found: @garfish/browser-snapshot`
- **问题**: 尝试使用新沙箱时 Webpack 编译失败。
- **分析**: 只是从源码中知道了这个包，但从未安装过。
- **解决方案**: `pnpm add @garfish/browser-snapshot`。

---

### V5: `ReactDOM is not defined` (在主应用中)
- **问题**: `main-app` 自身在 `SandboxMFE.js` 中报错。
- **分析**: 在 `SandboxMFE.js` 中使用了 `ReactDOM` 等变量，但忘记 `import`。
- **解决方案**: 添加所有缺失的 `import` 语句。

---

### V6: 架构的根本性反思 - `dynamic remote containers`
- **启发**: 引入外部 LLM 分析，得到核心思想：“基建原生，业务隔离”。
- **结论**: 应让 MF 的初始化流程在原生 `window` 中进行，只用沙箱隔离业务渲染。

---

### V7: `script.onerror` 与 URL 拼接错误
- **问题**: 动态创建的 `<script>` 标签加载 `remoteEntry.js` 失败。
- **分析**: 增强日志后发现，请求的 URL 是错误的 `.../remoteEntry.js/remoteEntry.js`，由字符串拼接错误导致。
- **解决方案**: 修正 `SandboxMFE.js` 的逻辑，不再重复拼接 `remoteEntry.js`。

---

### V8: 静默失败 (模块未初始化)
- **问题**: `remoteEntry.js` 加载成功，但子应用未发起后续请求。
- **分析**: 缺失了 Webpack MF 的“握手”协议。
- **解决方案**: 实现 `loadAndInitRemoteContainer` 函数，完整执行 `__webpack_init_sharing__` 和 `container.init()` 流程。

---

### V9: `Failed to resolve module specifier`
- **问题**: 在沙箱中执行 `import('dashboard/App')` 失败。
- **分析**: `import()` 是 Webpack 的语法糖，依赖在沙箱中不存在的主应用 Webpack 运行时。
- **解决方案**: 放弃“语法糖”，改为在沙箱中手动调用 MF 的标准 API：`container.get('./App')`。

---

### V10: `Failed to load remote module` (模块执行失败)
- **问题**: `container.get('./App')` 返回的 `factory` 函数执行后，没有得到有效模块。
- **分析**: `factory` 函数在执行时，**必须**接收主应用的共享作用域作为参数：`factory(__webpack_share_scopes__.default)`。
- **解决方案**: 在“桥接”容器的同时，也“桥接” `__webpack_share_scopes__` 对象到沙箱中，并在调用 `factory` 时传入它。

---

### V11: React 18 渲染错误与路由上下文丢失
- **问题**: 模块成功加载并渲染后，出现 `ReactDOM.render is no longer supported` 和 `useRoutes() may be used only in the context of a <Router>` 错误。
- **分析**: 沙箱隔离了 React Context，且我们使用了过时的渲染 API。
- **解决方案**: 在沙箱的渲染脚本中，改用 `createRoot` API，并为子应用包裹一个新的 `<BrowserRouter>`。

---

### V12: `No routes matched location`
- **问题**: 子应用在沙箱内的路由系统中，找不到与当前 URL 匹配的路由。
- **分析**: 沙箱内的 `BrowserRouter` 读取了完整的 URL 路径，而子应用的路由是从 `/` 开始的。
- **解决方案**: 为沙箱内的 `<BrowserRouter>` 提供正确的 `basename` prop。

---

### V13: `Cannot set properties of undefined` (在路由切换时)
- **问题**: 第一个子应用渲染成功，但切换到第二个时崩溃。
- **分析**: `useEffect` 的清理函数调用了 `sandbox.close()`，销毁了沙箱。而新的组件实例错误地复用了这个已被销毁的沙箱。
- **解决方案**: 确保每个 `SandboxMFE` 实例都创建一个**全新**的 `Sandbox` 实例，不进行复用。

---

### V14: `createRoot` 重复调用与同步卸载警告
- **问题**: 在不同子应用之间切换时，同时出现 `createRoot` 重复调用和同步卸载的警告。
- **分析**: 这是由 React 18 的并发渲染机制引发的复杂竞态条件。
- **最终解决方案**:
    1.  **缓存 Root 实例**: 在沙箱的 `global` 对象上，缓存 `createRoot` 的实例。
    2.  **异步卸载**: 在 `useEffect` 的清理函数中，将 `root.unmount()` 的调用**异步化**。

---
*（V15, V16, V17... 均为对 V14 方案的逐步调试和完善，最终稳定为此方案）*