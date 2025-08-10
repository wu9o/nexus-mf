import React, { useState, useEffect, useRef } from 'react';
import Sandbox from '@garfish/browser-vm';
import { BrowserRouter } from 'react-router-dom';

// 为 Webpack 模块联邦的全局变量定义 TypeScript 接口
interface WebpackShareScopes {
  default: Record<string, unknown>;
}

interface WebpackContainer {
  init: (shareScope: WebpackShareScopes['default']) => void;
  get: (module: string) => Promise<() => { default: React.ComponentType }>;
}

// 放宽全局 window 的类型声明，以允许在运行时附加各种属性。
// 这是处理模块联邦和沙箱动态特性的关键。
declare global {
  interface Window {
    [key: string]: any;
  }
  const __webpack_init_sharing__: (scope: 'default') => Promise<void>;
  const __webpack_share_scopes__: WebpackShareScopes;
  const __webpack_require__: any;
}

/**
 * @zh
 * SandboxMFE 组件的 Props 接口。
 * @en
 * Props interface for the SandboxMFE component.
 */
export interface SandboxMFEProps {
  /**
   * @zh 微应用的唯一名称，必须与微应用暴露的 `name` 一致。
   * @en The unique name of the micro-frontend, must match the 'name' exposed by the micro-frontend.
   */
  name: string;
  /**
   * @zh 微应用 `remoteEntry.js` 文件的 URL。
   * @en The URL of the micro-frontend's `remoteEntry.js` file.
   */
  url: string;
  /**
   * @zh 传递给微应用内 `BrowserRouter` 的 `basename`。
   * @en The `basename` to be passed to the `BrowserRouter` within the micro-frontend.
   */
  basename: string;
}

/**
 * @zh
 * 一个辅助函数，用于在主应用的原生环境中加载和初始化远程模块容器。
 * 这是实现沙箱化模块联邦的第一步。
 * @en
 * A helper function to load and initialize the remote module container in the host application's native environment.
 * This is the first step in implementing sandboxed module federation.
 * @param appName - 微应用的名称。
 * @param url - `remoteEntry.js` 的 URL。
 * @returns 返回一个 Promise，解析为已初始化的 Webpack 容器。
 */
const loadAndInitRemoteContainer = (appName: string, url: string): Promise<WebpackContainer> => {
  return new Promise((resolve, reject) => {
    // 1. 检查并初始化 Webpack 的共享作用域
    if (typeof __webpack_init_sharing__ !== 'function') {
      return reject(new Error('[SandboxMFE] Webpack `__webpack_init_sharing__` is not found on window.'));
    }
    __webpack_init_sharing__('default');

    // 2. 创建 script 标签来加载 remoteEntry.js
    const script = document.createElement('script');
    script.src = url;

    script.onload = () => {
      // 3. 从 window 对象上获取微应用暴露的容器
      const container = window[appName];
      if (!container || typeof container.init !== 'function') {
        return reject(new Error(`[SandboxMFE] Container "${appName}" not found on window.`));
      }
      
      // 4. 使用主应用的共享作用域来初始化容器
      container.init(__webpack_share_scopes__.default);
      resolve(container);
    };

    script.onerror = () => {
      reject(new Error(`[SandboxMFE] Failed to load remoteEntry.js: ${url}`));
    };

    document.head.appendChild(script);
  });
};

/**
 * @zh
 * 核心组件，用于在沙箱环境中加载和渲染一个模块联邦（MF）微应用。
 * @en
 * The core component for loading and rendering a Module Federation (MF) micro-frontend in a sandboxed environment.
 */
const SandboxMFE: React.FC<SandboxMFEProps> = ({ name, url, basename }) => {
  // 用于渲染的 React 组件状态
  const [AppComponent, setAppComponent] = useState<React.ComponentType | null>(null);
  // DOM 容器的引用
  const containerRef = useRef<HTMLDivElement>(null);
  // Garfish 沙箱实例的引用
  const sandboxRef = useRef<InstanceType<typeof Sandbox> | null>(null);

  // 主 effect，负责加载、沙箱化和引导微应用
  useEffect(() => {
    let sandbox: InstanceType<typeof Sandbox> | null = null;

    const loadAndRenderApp = async () => {
      try {
        // 1. 创建一个新的 Garfish 沙箱实例
        sandbox = new Sandbox({
          namespace: name,
          disableWith: false, // 允许沙箱访问主应用的 window，但所有修改将被代理
        });
        sandboxRef.current = sandbox;

        // 2. 在主应用环境中加载并初始化远程容器
        const nativeContainer = await loadAndInitRemoteContainer(name, url);

        // 3. 将所有必要的对象和函数注入到沙箱的全局作用域中
        //    这是实现沙箱内运行的关键步骤
        const global: any = sandbox.global;
        global[name] = nativeContainer; // 注入远程容器
        global.__webpack_share_scopes__ = __webpack_share_scopes__; // 注入共享作用域
        global.__webpack_require__ = __webpack_require__; // 注入 webpack require

        // 4. 在沙箱内部执行代码，以获取微应用的模块工厂
        const factory = await new Promise<() => { default: React.ComponentType }>((resolve, reject) => {
          // 通过在沙箱的 window 上挂载一个回调函数，来从 `execScript` 的异步执行中获取结果
          global.__ON_FACTORY_LOADED__ = (f: () => { default: React.ComponentType }) => {
            delete global.__ON_FACTORY_LOADED__;
            f ? resolve(f) : reject(new Error(`Module factory is invalid.`));
          };
          // 执行脚本，调用容器的 get 方法来获取 './App' 模块
          sandbox!.execScript(`
            window.${name}.get('./App')
              .then(factory => window.__ON_FACTORY_LOADED__(factory))
              .catch(err => {
                console.error('[SandboxMFE] Error in container.get("./App"):', err);
                window.__ON_FACTORY_LOADED__(null);
              });
          `);
        });

        // 5. 从工厂函数中获取模块并更新 state，以触发渲染
        const Module = factory();
        if (!Module || !Module.default) {
          throw new Error(`Module or default export is invalid.`);
        }
        
        setAppComponent(() => Module.default);
      } catch (error) {
        console.error(`[SandboxMFE] Failed to load app ${name}:`, error);
      }
    };

    loadAndRenderApp();

    // 6. 清理函数：在组件卸载时关闭沙箱
    return () => {
      if (sandbox) {
        // 异步执行卸载脚本，以确保 React 组件已从 DOM 中移除
        const unmountScript = `
          if (window.__SANDBOX_REACT_ROOT__) {
            Promise.resolve().then(() => {
              window.__SANDBOX_REACT_ROOT__.unmount();
              delete window.__SANDBOX_REACT_ROOT__;
            });
          }
        `;
        if (sandbox.global) {
          sandbox.execScript(unmountScript);
        }
        sandbox.close();
      }
    };
  }, [name, url, basename]);

  // 渲染 effect，负责将微应用组件渲染到 DOM 中
  useEffect(() => {
    if (AppComponent && containerRef.current) {
      const sandbox = sandboxRef.current;
      if (sandbox?.global) {
        // 1. 将渲染所需的 React 相关库注入到沙箱中
        const global: any = sandbox.global;
        global.React = React;
        // 使用 require 来动态获取 react-dom/client，避免顶层 import 带来的类型冲突
        global.ReactDOM = require('react-dom/client');
        global.BrowserRouter = BrowserRouter;

        // 2. 在沙箱中执行渲染脚本
        sandbox.execScript(`
          let root = window.__SANDBOX_REACT_ROOT__;
          // 复用 React Root 以提高性能
          if (!root) {
            root = ReactDOM.createRoot(document.getElementById('sandbox-container'));
            window.__SANDBOX_REACT_ROOT__ = root;
          }
          // 使用 React.createElement 来渲染组件
          root.render(
            React.createElement(
              BrowserRouter,
              { basename: basename },
              React.createElement(AppComponent)
            )
          );
        `, {
          // 将变量传递给 execScript 的上下文
          AppComponent: AppComponent,
          basename: basename,
        });
      }
    }
  }, [AppComponent, basename]);

  // 返回一个 div 作为微应用的挂载点
  return <div id="sandbox-container" ref={containerRef} />;
};

export default SandboxMFE;