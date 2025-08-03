import React, { useState, useEffect, useRef } from 'react';
import Sandbox from '@garfish/browser-vm';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 声明 Webpack 注入的全局变量
/* global __webpack_init_sharing__, __webpack_share_scopes__, __webpack_require__ */

// 远程容器加载和初始化函数
const loadAndInitRemoteContainer = (appName, url) => {
  return new Promise((resolve, reject) => {
    console.log(`[SandboxMFE] Step 1: Initializing share scope and loading remoteEntry.js for "${appName}" from ${url}`);
    if (typeof __webpack_init_sharing__ !== 'function') {
      return reject(new Error('[SandboxMFE] Webpack `__webpack_init_sharing__` is not found on window.'));
    }
    __webpack_init_sharing__('default');

    const script = document.createElement('script');
    script.src = url;

    script.onload = () => {
      const container = window[appName];
      if (!container || typeof container.init !== 'function') {
        return reject(new Error(`[SandboxMFE] Container "${appName}" not found on window.`));
      }
      
      container.init(__webpack_share_scopes__.default);
      console.log(`[SandboxMFE] Step 2: Container "${appName}" initialized in native window.`);
      resolve(container);
    };

    script.onerror = (event) => {
      const errorMsg = `[SandboxMFE] Failed to load remoteEntry.js: ${url}`;
      console.error(errorMsg, event);
      reject(new Error(errorMsg));
    };

    document.head.appendChild(script);
  });
};

const SandboxMFE = ({ name, url, basename }) => {
  const [AppComponent, setAppComponent] = useState(null);
  const containerRef = useRef(null);
  const sandboxRef = useRef(null);

  // 合并为一个 useEffect，统一管理加载和渲染的生命周期
  useEffect(() => {
    let sandbox;
    let appComponent; // 在 effect 内部追踪当前组件，避免 state 闭包问题

    const loadAndRenderApp = async () => {
      try {
        sandbox = new Sandbox({
          namespace: name,
          disableWith: false,
        });
        sandboxRef.current = sandbox;

        const nativeContainer = await loadAndInitRemoteContainer(name, url);

        sandbox.global[name] = nativeContainer;
        sandbox.global.__webpack_share_scopes__ = __webpack_share_scopes__;
        sandbox.global.__webpack_require__ = __webpack_require__;

        const factory = await new Promise((resolve, reject) => {
          sandbox.global.__ON_FACTORY_LOADED__ = (f) => {
            delete sandbox.global.__ON_FACTORY_LOADED__;
            f ? resolve(f) : reject(new Error(`Module factory is invalid.`));
          };
          sandbox.execScript(`
            window.${name}.get('./App')
              .then(factory => window.__ON_FACTORY_LOADED__(factory))
              .catch(err => {
                console.error('[SandboxMFE] Error in container.get("./App"):', err);
                window.__ON_FACTORY_LOADED__(null);
              });
          `);
        });

        const Module = factory();
        if (!Module || !Module.default) {
          throw new Error(`Module or default export is invalid.`);
        }
        
        appComponent = Module.default;
        setAppComponent(() => appComponent); // 更新 state 以触发渲染

      } catch (error) {
        console.error(`[SandboxMFE] Failed to load app ${name}:`, error);
      }
    };

    loadAndRenderApp();

    // 清理函数
    return () => {
      if (sandbox) {
        // 异步卸载，避免与 React 渲染周期冲突
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
  }, [name, url, basename]); // 将 basename 也加入依赖项

  // 渲染 effect
  useEffect(() => {
    if (AppComponent && containerRef.current) {
      const sandbox = sandboxRef.current;
      if (!sandbox || !sandbox.global) return;

      sandbox.global.React = React;
      sandbox.global.ReactDOM = ReactDOM;
      sandbox.global.BrowserRouter = BrowserRouter;

      // 在沙箱中缓存和复用 React Root 实例
      sandbox.execScript(`
        let root = window.__SANDBOX_REACT_ROOT__;
        if (!root) {
          root = ReactDOM.createRoot(containerRef.current);
          window.__SANDBOX_REACT_ROOT__ = root;
        }
        root.render(
          React.createElement(
            BrowserRouter,
            { basename: basename },
            React.createElement(AppComponent)
          )
        );
      `, {
        AppComponent: AppComponent,
        containerRef: containerRef,
        basename: basename,
      });
    }
  }, [AppComponent, basename]); // 依赖 AppComponent 和 basename

  return <div ref={containerRef} />;
};

export default SandboxMFE;
