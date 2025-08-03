# Webpack Module Federation + Sandbox 集成探索之旅

本文档记录了在微前端项目中，尝试将 Webpack Module Federation (MF) 与运行时沙箱（Sandbox）技术结合所遇到的问题、探索过程、失败的尝试以及最终的解决方案。

## 初始目标

在一个基于 Webpack Module Federation 的微前端架构中，实现以下目标：
1.  **依赖共享**: 利用 MF 的 `shared` 机制，让主应用和所有子应用共享 `react`, `react-dom` 等公共依赖，保证单例性。
2.  **运行时隔离**: 为每个子应用提供一个独立的 JavaScript 运行时沙箱，防止子应用的全局变量污染、未处理的异常或 CSS 泄露影响主应用的稳定性。

## 探索过程与遇到的问题

### 方案一：MF 原生加载 + 动态沙箱包裹 (失败)

**思路**: 保持主应用使用 `React.lazy(() => import('dashboard/App'))` 的原生 MF 加载方式。在主应用中创建一个组件，当子应用组件加载后，尝试将其“放进”一个动态创建的沙箱中去渲染。

- **尝试使用的沙箱**: `@garfish/sandbox`, `@ice/sandbox`

- **遇到的核心问题**:
    1.  **`Invalid hook call` / 多 React 实例**: 这是最根本的冲突。MF 的 `shared` 机制依赖于一个**统一的、非隔离的** Webpack 运行时来保证 React 的单例。而沙箱的核心目的恰恰是**破坏**这个统一环境，创建一个**隔离的**运行时。当我们在沙箱中执行 `remoteEntry.js` 时，它无法访问到主应用的共享模块注册表，于是会加载一个全新的 React 实例，导致应用崩溃。
    2.  **`require is not defined`**: 为了解决多 React 实例问题，我们曾尝试将主应用的 `require` 函数注入沙箱。这个方案在 Webpack 开发模式下可行，但在生产构建中会失败，因为 `require` 函数名会被压缩混淆，导致 `eval('require')` 找不到目标。
    3.  **API 使用错误**: 在与 `garfish` 和 `@ice/sandbox` 的交互中，我们遇到了多次 API 使用错误，例如：
        - `TypeError: Sandbox.execScript is not a function` (正确应为 `execScriptInSandbox`)
        - `TypeError: sandbox.destroy is not a function` (正确应为 `closed` 或 `clear`)
        - `TypeError: Sandbox is not a constructor` (因为试图从错误的包或以错误的方式导入 `Sandbox` 类)

### 方案二：运行时 `fetch` + 沙箱执行 (部分成功，但有缺陷)

**思路**: 放弃 MF 的 `import()` 加载方式。在主应用组件中，通过 `fetch` 将 `remoteEntry.js` 作为**纯文本**下载下来，然后使用沙箱的 API (`sandbox.execScript(code)`) 来执行它。

- **遇到的核心问题**:
    1.  **沙箱 `window` 初始化时序问题**: 我们发现，在调用 `sandbox.execScript(code)` 后，`sandbox.window` 对象并不会被同步创建，导致我们无法立即从中获取子应用的模块容器。我们尝试使用 `Promise.resolve()` 等微任务来延迟执行，但这是一种不稳定的“猜测”，而非可靠的机制。
    2.  **`appendChild` 被拦截**: 当我们试图先加载脚本再创建沙箱时，发现如果项目中安装了 `garfish` 主包，它可能会在初始化时就重写 `document.appendChild` 等原生 API，导致我们的动态 `<script>` 标签无法被正确添加到 DOM 中，从而无法触发网络请求。
    3.  **`Illegal return statement`**: 在尝试通过 `execScript` 从沙箱中返回值时，由于不熟悉其类似 `eval()` 的执行机制，我们错误地在全局作用域中使用了 `return` 语句，导致了语法错误。

## 源码分析与最终洞见

通过对 `garfish`, `@ice/sandbox`, `mf-lite` 的源码分析，以及对社区文章的研读，我们得出了最终结论：

1.  **MF `shared` 与独立沙箱的根本性不兼容**: MF 的 `shared` 机制与运行时沙箱的隔离机制在底层原理上是冲突的。一个依赖于“共享”，另一个致力于“隔离”。
2.  **成熟框架的模式**: `qiankun`, `garfish`, `mf-lite` 等框架之所以能成功，是因为它们**放弃了 MF 的原生加载机制** (`remotes` + `import()`)，转而采用更可控的**加载器**模式。它们或者加载 HTML 入口，或者通过插件系统深度整合，确保了沙箱环境的优先创建和依赖的正确注入。
3.  **`@garfish/sandbox` 无法独立使用**: 源码分析表明，`Sandbox` 类并未从 `@garfish/sandbox` 包中以可直接使用的方式导出。它是一个内部模块，必须通过 Garfish 的插件系统和加载器来使用。

## 最终架构方案

基于以上探索，我们设计了最终的、可行的架构：

**核心思想：持久化沙箱 + 运行时 `fetch`**

1.  **单一持久化沙箱**: 在主应用入口 (`bootstrap.js`)，**只创建一次** `@ice/sandbox` 的实例，并将其作为单例在整个应用生命周期中持有。
2.  **统一执行环境**: 所有子应用的 `remoteEntry.js` 都会被 `fetch` 下来，并在**同一个**持久化沙箱实例中通过 `execScriptInSandbox` 执行。
3.  **隐式依赖共享**: 当第一个子应用在沙箱中执行时，它会加载共享的依赖（如 React）。由于沙箱是持久的，当后续的子应用也在这个沙箱中执行时，它们会自然地复用沙箱中**已经存在**的 React 单例。
4.  **主应用的角色**: 主应用只负责 `fetch` 脚本和调用沙箱 API，然后从沙箱的 `window` 代理中获取模块并渲染。

这个方案巧妙地绕过了 MF `shared` 运行时与沙箱的直接冲突，通过让所有子应用共享**同一个沙箱**，间接地实现了共享依赖（React 单例）的目标，同时保证了它们与主应用之间的隔离。
