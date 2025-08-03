# 微前端架构升级交接文档

**致下一个 Gemini CLI 实例：**

你好！我们正在进行一个基于 Webpack Module Federation 的微前端项目。当前的核心任务是为这个架构集成一个**运行时沙箱**，以实现主应用与子应用之间的 JavaScript 隔离。

我们已经经历了漫长而深入的探索，排除了多种不可行的方案，并最终确定了一个清晰、正确的前进方向。你的任务是接手当前的工作，并完成最终的实现。

## 当前状态与最终目标

- **项目位置**: `/Users/wujiuli/Git/mf`
- **最终目标**: 实现一个基于 **Webpack MF + 持久化沙箱** 的微前端架构。
- **已完成的工作**:
    1.  我们已经通过源码分析和社区调研，证实了**无法**将一个独立的沙箱（如 `@ice/sandbox`）与 Module Federation 的原生 `shared` 依赖共享机制直接混合使用，因为两者在底层原理上存在根本性冲突。
    2.  我们已经探索并记录了所有失败的尝试，详情请参阅项目根目录下的 `WEBPACK_MF_SANDBOX_JOURNEY.md` 文档。
    3.  我们已经确定了最终的、正确的架构方案。

## 最终架构方案（你需要实现的目标）

**核心思想：持久化沙箱 + 运行时 `fetch`**

1.  **单一持久化沙箱**: 在主应用入口 (`apps/main-app/src/bootstrap.js`)，**只创建一次** `@ice/sandbox` 的实例，并将其作为单例在整个应用生命周期中持有。
2.  **统一执行环境**: 所有子应用的 `remoteEntry.js` 都会被 `fetch` 下来，并在**同一个**持久化沙箱实例中通过 `execScriptInSandbox` 执行。
3.  **隐式依赖共享**: 当第一个子应用在沙箱中执行时，它会加载共享的依赖（如 React）。由于沙箱是持久的，当后续的子应用也在这个沙箱中执行时，它们会自然地复用沙箱中**已经存在**的 React 单例，从而解决“多 React 实例”和“Invalid hook call”的问题。
4.  **主应用的角色**: 主应用中的 `SandboxMFE.js` 组件负责 `fetch` 脚本和调用沙箱 API，然后从沙箱的 `window` 代理中获取模块并渲染。

## 你的任务清单

**你需要从头开始，严格按照以下步骤执行，以确保一个干净的实现：**

1.  **清理项目**:
    - **卸载所有沙箱依赖**: 运行 `pnpm --filter main-app remove @ice/sandbox garfish @garfish/sandbox`，确保没有任何沙箱库的残留。
    - **恢复 `SandboxMFE.js`**: 将 `apps/main-app/src/SandboxMFE.js` 恢复到一个最简单的骨架状态，或者直接删除后重建。
    - **恢复 `bootstrap.js`**: 确保 `apps/main-app/src/bootstrap.js` 是干净的，只负责渲染 React 应用。

2.  **安装正确的依赖**:
    - 运行 `pnpm --filter main-app add @ice/sandbox`。

3.  **实现持久化沙箱**:
    - **修改 `apps/main-app/src/bootstrap.js`**:
        - `import Sandbox from '@ice/sandbox';`
        - 创建并 `export` 一个常量 `persistentSandbox`，即 `new Sandbox({ type: 'loose' });`。

4.  **重构 `SandboxMFE.js`**:
    - **修改 `apps/main-app/src/SandboxMFE.js`**:
        - `import { persistentSandbox } from './bootstrap';`
        - 在 `useEffect` 中，使用 `persistentSandbox` 这个已经存在的实例。
        - **核心逻辑**:
            - 检查 `persistentSandbox.getSandbox()[name]` 是否已存在，如果存在，则直接获取模块，避免重复加载和执行 `remoteEntry.js`。
            - 如果不存在，则 `fetch` 子应用的 `remoteEntry.js` 代码文本。
            - 调用 `persistentSandbox.execScriptInSandbox(code)`。
            - 从 `persistentSandbox.getSandbox()[name]` 获取模块容器。
            - `await container.get('./App')` 获取组件。
            - 使用 `useState` 设置组件并触发渲染。
        - **注意**: `useEffect` 的清理函数中**不应该**销毁或清理沙箱，因为它需要被持久化。

5.  **验证**:
    - 启动所有应用 (`pnpm dev`)。
    - 导航到第一个子应用，确认其能正常渲染。
    - 导航到第二个子应用，确认它也能正常渲染，并且**不会**出现 `Invalid hook call` 错误（因为它们复用了同一个沙箱中的 React 实例）。
    - 检查浏览器控制台，确认没有错误。

祝你好运！这个方案是经过深入研究后得出的，我相信你能成功地实现它。
