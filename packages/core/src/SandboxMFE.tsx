import React, { useState, useEffect, useId, useRef } from 'react';
import Sandbox from '@garfish/browser-vm';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createStyleLifecycle, StyleLifecycleHandle } from './styleLifecycle';

// 为 Webpack 模块联邦的全局变量定义 TypeScript 接口
type WebpackShareScope = Record<string, unknown>;

interface WebpackShareScopes {
  default: WebpackShareScope;
}

interface WebpackContainer {
  init: (shareScope: WebpackShareScopes['default']) => void | Promise<void>;
  get: (module: string) => Promise<() => { default: React.ComponentType }>;
}

export interface SandboxMFEError extends Error {
  cause?: unknown;
}

export interface SandboxMFEVersion {
  version: string;
  url: string;
  /** Optional Subresource Integrity value for remoteEntry.js. */
  integrity?: string;
}

export interface SandboxMFEFallbackContext {
  failed: SandboxMFEVersion;
  next: SandboxMFEVersion;
  error: SandboxMFEError;
}

export interface SandboxMFELoadContext extends SandboxMFEVersion {
  usedFallback: boolean;
}

let webpackShareScopePromise: {
  initSharing: typeof __webpack_init_sharing__;
  promise: Promise<void>;
} | null = null;

const remoteEntryPromises = new Map<string, Promise<void>>();
const remoteContainerPromises = new Map<string, Promise<WebpackContainer>>();
const remoteRuntimeOwners = new Map<string, number>();
const remoteEntryOwners = new Map<string, number>();
const EMPTY_FALLBACK_VERSIONS: SandboxMFEVersion[] = [];

// 放宽全局 window 的类型声明，以允许在运行时附加各种属性。
// 这是处理模块联邦和沙箱动态特性的关键。
declare global {
  interface Window {
    [key: string]: any;
  }
  const __webpack_init_sharing__: (scope: 'default') => void | Promise<void>;
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
  /** Version label for the primary remote entry. */
  version?: string;
  /** Optional Subresource Integrity value for the primary remote entry. */
  integrity?: string;
  /** Ordered fallback versions. The first healthy candidate wins. */
  fallbackVersions?: SandboxMFEVersion[];
  /** Module exposed by the remote container. Defaults to `./App`. */
  exposedModule?: string;
  /** Maximum time, in milliseconds, allowed for shared dependencies and remoteEntry.js. */
  timeout?: number;
  /** Optional content rendered while the remote app is loading. */
  loadingFallback?: React.ReactNode;
  /** Optional content or renderer shown when loading fails. */
  errorFallback?: React.ReactNode | ((error: SandboxMFEError, retry: () => void) => React.ReactNode);
  /** Called after the remote app is mounted successfully. */
  onLoad?: (context: SandboxMFELoadContext) => void;
  /** Called before trying the next version after a load failure. */
  onFallback?: (context: SandboxMFEFallbackContext) => void;
  /** Called when loading or initializing the remote app fails. */
  onError?: (error: SandboxMFEError) => void;
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
const initializeWebpackShareScope = (): Promise<void> => {
  if (typeof __webpack_init_sharing__ !== 'function') {
    return Promise.reject(new Error('[SandboxMFE] Webpack `__webpack_init_sharing__` is not found on window.'));
  }

  const initSharing = __webpack_init_sharing__;
  if (webpackShareScopePromise?.initSharing === initSharing) {
    return webpackShareScopePromise.promise;
  }

  const promise = Promise.resolve(initSharing('default')).catch((error) => {
    if (webpackShareScopePromise?.promise === promise) {
      webpackShareScopePromise = null;
    }
    throw error;
  });
  webpackShareScopePromise = { initSharing, promise };

  return promise;
};

const hasSharedModuleGetter = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (typeof (value as { get?: unknown }).get === 'function') {
    return true;
  }

  return Object.values(value).some(hasSharedModuleGetter);
};

const loadRemoteEntry = (url: string, timeout: number, integrity?: string): Promise<void> => {
  const cached = remoteEntryPromises.get(url);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const timeoutId = setTimeout(() => {
      script.remove();
      reject(new Error(`[SandboxMFE] Timed out loading remoteEntry.js: ${url}`));
    }, timeout);

    script.src = url;
    script.async = true;
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
    }
    script.dataset.nexusMfRemoteUrl = url;
    script.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timeoutId);
      script.remove();
      reject(new Error(`[SandboxMFE] Failed to load remoteEntry.js: ${url}`));
    };

    document.head.appendChild(script);
  });

  remoteEntryPromises.set(url, promise);
  promise.catch(() => {
    if (remoteEntryPromises.get(url) === promise) {
      remoteEntryPromises.delete(url);
    }
  });
  return promise;
};

const loadAndInitRemoteContainer = async (
  appName: string,
  url: string,
  timeout: number,
  integrity?: string,
): Promise<WebpackContainer> => {
  const cacheKey = `${appName}:${url}:${integrity ?? ''}`;
  const cached = remoteContainerPromises.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    await initializeWebpackShareScope();
    await loadRemoteEntry(url, timeout, integrity);

    const container = window[appName] as WebpackContainer | undefined;
    if (!container || typeof container.init !== 'function') {
      throw new Error(`[SandboxMFE] Container "${appName}" not found on window.`);
    }

    await container.init(__webpack_share_scopes__.default);
    return container;
  })();

  remoteContainerPromises.set(cacheKey, promise);
  promise.catch(() => {
    if (remoteContainerPromises.get(cacheKey) === promise) {
      remoteContainerPromises.delete(cacheKey);
    }
  });
  return promise;
};

const retainRemoteRuntime = (appName: string, url: string): void => {
  const containerKey = `${appName}:${url}`;
  remoteRuntimeOwners.set(containerKey, (remoteRuntimeOwners.get(containerKey) ?? 0) + 1);
  remoteEntryOwners.set(url, (remoteEntryOwners.get(url) ?? 0) + 1);
};

const releaseRemoteRuntime = (appName: string, url: string, container: WebpackContainer): void => {
  const containerKey = `${appName}:${url}`;
  const nextContainerOwners = (remoteRuntimeOwners.get(containerKey) ?? 1) - 1;
  if (nextContainerOwners > 0) {
    remoteRuntimeOwners.set(containerKey, nextContainerOwners);
  } else {
    remoteRuntimeOwners.delete(containerKey);
    remoteContainerPromises.delete(containerKey);
    if (window[appName] === container) {
      const descriptor = Object.getOwnPropertyDescriptor(window, appName);
      if (!descriptor || descriptor.configurable) {
        Reflect.deleteProperty(window, appName);
      } else if (descriptor.writable) {
        // Webpack may define the container as a non-configurable global. It is
        // still safe to clear a writable value, but `delete` would throw in
        // strict mode and break React's unmount lifecycle.
        window[appName] = undefined;
      }
    }
  }

  const nextEntryOwners = (remoteEntryOwners.get(url) ?? 1) - 1;
  if (nextEntryOwners > 0) {
    remoteEntryOwners.set(url, nextEntryOwners);
    return;
  }

  remoteEntryOwners.delete(url);
  remoteEntryPromises.delete(url);
  document.head.querySelectorAll('script[data-nexus-mf-remote-url]').forEach((script) => {
    if (script.getAttribute('data-nexus-mf-remote-url') === url) script.remove();
  });
};

/**
 * 检查并等待关键共享依赖加载完成
 * @param deps 需要检查的共享依赖列表（如 ['react', 'react-dom', 'react-router-dom']）
 * @param timeout 超时时间（默认5000ms）
 * @returns Promise 成功则表示依赖就绪，失败则超时
 */
const waitForSharedDeps = async (
  deps: string[] = ['react', 'react-dom', 'react-router-dom'],
  timeout = 5000
): Promise<void> => {
  await initializeWebpackShareScope();

  const startTime = Date.now();
  while (Date.now() - startTime <= timeout) {
    const shareScope = typeof __webpack_share_scopes__ === 'undefined'
      ? undefined
      : __webpack_share_scopes__.default;
    const allLoaded = shareScope && deps.every(dep => {
      return hasSharedModuleGetter(shareScope[dep]);
    });

    if (allLoaded) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`[SandboxMFE] Shared dependencies ${deps.join(', ')} timed out`);
};

/**
 * @zh
 * 核心组件，用于在沙箱环境中加载和渲染一个模块联邦（MF）微应用。
 * @en
 * The core component for loading and rendering a Module Federation (MF) micro-frontend in a sandboxed environment.
 */
const SandboxMFE: React.FC<SandboxMFEProps> = ({
  name,
  url,
  basename,
  version = 'current',
  integrity,
  fallbackVersions = EMPTY_FALLBACK_VERSIONS,
  exposedModule = './App',
  timeout = 5000,
  loadingFallback,
  errorFallback,
  onLoad,
  onFallback,
  onError,
}) => {
  // 用于渲染的 React 组件状态
  const [AppComponent, setAppComponent] = useState<React.ComponentType | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<SandboxMFEError | null>(null);
  const [activeVersion, setActiveVersion] = useState(version);
  const [retryToken, setRetryToken] = useState(0);
  // DOM 容器的引用
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `nexus-mf-${useId().replace(/:/g, '')}`;
  // Garfish 沙箱实例的引用
  const sandboxRef = useRef<InstanceType<typeof Sandbox> | null>(null);
  const callbacksRef = useRef({ onLoad, onFallback, onError });
  callbacksRef.current = { onLoad, onFallback, onError };

  const retry = () => {
    setAppComponent(null);
    setLoadError(null);
    setStatus('loading');
    setActiveVersion(version);
    setRetryToken(value => value + 1);
  };

  // 主 effect，负责加载、沙箱化和引导微应用
  useEffect(() => {
    let sandbox: InstanceType<typeof Sandbox> | null = null;
    let cancelled = false;
    let activeRuntime: { candidate: SandboxMFEVersion; container: WebpackContainer } | null = null;
    let activeStyleLifecycle: StyleLifecycleHandle | null = null;
    setAppComponent(null);
    setLoadError(null);
    setStatus('loading');

    const loadAndRenderApp = async () => {
      try {
        // 1. 等待关键共享依赖加载完成
        await waitForSharedDeps();
        if (cancelled) return;

        // 2. 创建一个新的 Garfish 沙箱实例
        sandbox = new Sandbox({
          namespace: name,
          disableWith: false, // 允许沙箱访问主应用的 window，但所有修改将被代理
        });
        sandboxRef.current = sandbox;

        // 3. Load the primary version and fall back in order when loading,
        // initializing, or resolving the exposed module fails.
        const candidates: SandboxMFEVersion[] = [{ version, url, integrity }, ...fallbackVersions];
        let loadedCandidate: SandboxMFEVersion | null = null;
        let loadedModule: { default: React.ComponentType } | null = null;
        let lastError: SandboxMFEError | null = null;

        for (let index = 0; index < candidates.length; index += 1) {
          const candidate = candidates[index];
          const styleLifecycle = createStyleLifecycle(`${name}:${candidate.url}`);
          let claimedRuntime = false;
          try {
            const nativeContainer = await loadAndInitRemoteContainer(name, candidate.url, timeout, candidate.integrity);
            if (cancelled) {
              styleLifecycle.release();
              sandbox.close();
              return;
            }

            retainRemoteRuntime(name, candidate.url);
            claimedRuntime = true;
            const global: any = sandbox.global;
            global.React = React;
            global.ReactDOM = ReactDOM;
            global.BrowserRouter = BrowserRouter;
            global[name] = nativeContainer;
            global.__webpack_share_scopes__ = __webpack_share_scopes__;
            global.__webpack_require__ = __webpack_require__;

            const factory = await new Promise<() => { default: React.ComponentType }>((resolve, reject) => {
              global.__ON_FACTORY_LOADED__ = (f: () => { default: React.ComponentType }) => {
                delete global.__ON_FACTORY_LOADED__;
                f ? resolve(f) : reject(new Error(`Module factory is invalid.`));
              };
              sandbox!.execScript(`
                window.${name}.get(${JSON.stringify(exposedModule)})
                  .then(factory => window.__ON_FACTORY_LOADED__(factory))
                  .catch(err => {
                    console.error('[SandboxMFE] Error in container.get("./App"):', err);
                    window.__ON_FACTORY_LOADED__(null);
                  });
              `);
            });
            const module = factory();
            if (!module || !module.default) {
              throw new Error(`Module or default export is invalid.`);
            }

            activeRuntime = { candidate, container: nativeContainer };
            activeStyleLifecycle = styleLifecycle;
            loadedCandidate = candidate;
            loadedModule = module;
            setActiveVersion(candidate.version);
            break;
          } catch (error) {
            if (cancelled) return;
            if (claimedRuntime) releaseRemoteRuntime(name, candidate.url, window[name]);
            styleLifecycle.release();
            lastError = error instanceof Error
              ? error
              : Object.assign(new Error(String(error)), { cause: error });
            const nextCandidate = candidates[index + 1];
            if (nextCandidate) {
              callbacksRef.current.onFallback?.({ failed: candidate, next: nextCandidate, error: lastError });
            }
          }
        }

        if (!loadedCandidate || !loadedModule) {
          throw lastError ?? new Error(`[SandboxMFE] No usable version found for ${name}.`);
        }

        // 4. 从工厂函数中获取模块并更新 state，以触发渲染
        const Module = loadedModule;
        if (!Module || !Module.default) {
          throw new Error(`Module or default export is invalid.`);
        }
        
        setAppComponent(() => Module.default);
        setStatus('ready');
        callbacksRef.current.onLoad?.({
          ...loadedCandidate,
          usedFallback: loadedCandidate.version !== version,
        });
      } catch (error) {
        if (cancelled) return;
        const normalizedError: SandboxMFEError = error instanceof Error
          ? error
          : Object.assign(new Error(String(error)), { cause: error });
        setLoadError(normalizedError);
        setStatus('error');
        callbacksRef.current.onError?.(normalizedError);
        console.error(`[SandboxMFE] Failed to load app ${name}:`, error);
      }
    };

    loadAndRenderApp();

    // 7. 清理函数：在组件卸载时关闭沙箱
    return () => {
      cancelled = true;
      activeStyleLifecycle?.release();
      if (activeRuntime) {
        releaseRemoteRuntime(name, activeRuntime.candidate.url, activeRuntime.container);
      }
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
        if (sandboxRef.current === sandbox) {
          sandboxRef.current = null;
        }
      }
    };
  }, [name, url, version, integrity, fallbackVersions, exposedModule, timeout, retryToken]);

  // 渲染 effect，负责将微应用组件渲染到 DOM 中
  useEffect(() => {
    if (AppComponent && containerRef.current) {
      const sandbox = sandboxRef.current;
      if (sandbox?.global) {
        // 在沙箱中执行渲染脚本
        sandbox.execScript(`
          if (window.__SANDBOX_REACT_ROOT__) {
            window.__SANDBOX_REACT_ROOT__.unmount();
            window.__SANDBOX_REACT_ROOT__ = null;
          }
          const root = ReactDOM.createRoot(document.getElementById(containerId));
          window.__SANDBOX_REACT_ROOT__ = root;
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
          containerId: containerId,
        });
      }
    }
  }, [AppComponent, basename, containerId]);

  if (status === 'loading') {
    return <>{loadingFallback ?? <div role="status">Loading {name}...</div>}</>;
  }

  if (status === 'error' && loadError) {
    const fallback = typeof errorFallback === 'function'
      ? errorFallback(loadError, retry)
      : errorFallback;

    return <>{fallback ?? (
      <div role="alert">
        <p>Failed to load {name}.</p>
        <button type="button" onClick={retry}>Retry</button>
      </div>
    )}</>;
  }

  // 返回一个 div 作为微应用的挂载点
  return <div id={containerId} ref={containerRef} data-nexus-mf-name={name} data-nexus-mf-version={activeVersion} />;
};

export default SandboxMFE;
