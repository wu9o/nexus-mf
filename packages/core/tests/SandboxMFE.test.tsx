import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SandboxMFE from '../src/SandboxMFE';

const mockContainer = {
  init: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(() => ({ default: () => <div>Remote app</div> })),
};

const mockSandboxGlobal: Record<string, any> = {
  document,
};
mockSandboxGlobal.window = mockSandboxGlobal;

const mockSandboxInstance = {
  global: mockSandboxGlobal,
  execScript: vi.fn((script: string) => {
    if (script.includes("get('./App')") || script.includes('get("./App")')) {
      void mockContainer.get('./App').then((factory) => {
        mockSandboxGlobal.__ON_FACTORY_LOADED__(factory);
      });
    }
  }),
  close: vi.fn(),
};

vi.mock('@garfish/browser-vm', () => ({
  default: vi.fn(() => mockSandboxInstance),
}));

describe('SandboxMFE 核心功能验证', () => {
  let shouldFailRemoteEntry = false;
  let failedRemoteUrls = new Set<string>();
  let testUrlSequence = 0;
  const createProps = () => ({
    name: 'test-app',
    url: `http://test.com/remote-${testUrlSequence++}.js`,
    basename: '/test',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    shouldFailRemoteEntry = false;
    failedRemoteUrls = new Set<string>();
    mockContainer.init.mockResolvedValue(undefined);
    mockContainer.get.mockResolvedValue(() => ({ default: () => <div>Remote app</div> }));
    mockSandboxGlobal.document = document;
    window.__webpack_share_scopes__ = {
      default: {
        react: { '18.3.1': { get: vi.fn(), loaded: true } },
        'react-dom': { '18.3.1': { get: vi.fn(), loaded: true } },
        'react-router-dom': { '7.7.1': { get: vi.fn(), loaded: true } },
      },
    };
    window.__webpack_init_sharing__ = vi.fn().mockResolvedValue(undefined);
    window.__webpack_require__ = {};

    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLScriptElement) {
        window['test-app'] = mockContainer;
        queueMicrotask(() => {
          if (shouldFailRemoteEntry || failedRemoteUrls.has(node.src)) {
            node.onerror?.(new Event('error'));
          } else {
            node.onload?.(new Event('load'));
          }
        });
      }
      return node;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__webpack_share_scopes__;
    delete window.__webpack_init_sharing__;
    delete window.__webpack_require__;
    delete window['test-app'];
  });

  it('应在加载期间渲染 loading 状态', () => {
    const { getByRole } = render(<SandboxMFE {...createProps()} />);

    expect(getByRole('status')).toHaveTextContent('Loading test-app');
  });

  it('应初始化共享作用域、加载远程容器并获取 App 模块', async () => {
    render(<SandboxMFE {...createProps()} />);

    await waitFor(() => {
      expect(window.__webpack_init_sharing__).toHaveBeenCalledWith('default');
      expect(mockContainer.init).toHaveBeenCalledWith(window.__webpack_share_scopes__.default);
      expect(mockContainer.get).toHaveBeenCalledWith('./App');
    });
  });

  it('应在微应用加载后执行沙箱渲染脚本', async () => {
    const { unmount } = render(<SandboxMFE {...createProps()} />);

    await waitFor(() => {
      expect(mockSandboxInstance.execScript).toHaveBeenCalledWith(
        expect.stringContaining('createRoot'),
        expect.objectContaining({ basename: '/test' }),
      );
    });

    unmount();
    expect(mockSandboxInstance.close).toHaveBeenCalled();
  });

  it('应为远程入口设置 Subresource Integrity 属性', async () => {
    const appendChild = vi.mocked(document.head.appendChild);
    render(<SandboxMFE {...createProps()} integrity="sha384-AbCd1234" />);

    await waitFor(() => {
      const script = appendChild.mock.calls
        .map(([node]) => node)
        .find((node): node is HTMLScriptElement => node instanceof HTMLScriptElement);
      expect(script?.integrity).toBe('sha384-AbCd1234');
      expect(script?.crossOrigin).toBe('anonymous');
    });
  });

  it('加载失败时应展示错误状态，并允许重试', async () => {
    shouldFailRemoteEntry = true;
    const { getByRole, queryByRole } = render(<SandboxMFE {...createProps()} />);

    await waitFor(() => {
      expect(getByRole('alert')).toHaveTextContent('Failed to load test-app');
    });

    shouldFailRemoteEntry = false;
    fireEvent.click(getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(queryByRole('alert')).not.toBeInTheDocument();
      expect(mockContainer.get).toHaveBeenCalledWith('./App');
    });
  });

  it('主版本失败时应按顺序回滚到可用版本', async () => {
    const primary = createProps();
    const fallback = {
      version: '0.9.0',
      url: `http://test.com/remote-${testUrlSequence++}.js`,
    };
    failedRemoteUrls.add(primary.url);
    const onFallback = vi.fn();
    const onLoad = vi.fn();

    render(
      <SandboxMFE
        {...primary}
        version="1.0.0"
        fallbackVersions={[fallback]}
        onFallback={onFallback}
        onLoad={onLoad}
      />,
    );

    await waitFor(() => {
      expect(mockContainer.get).toHaveBeenCalledWith('./App');
      expect(onFallback).toHaveBeenCalledWith(expect.objectContaining({
        failed: { version: '1.0.0', url: primary.url },
        next: fallback,
      }));
      expect(onLoad).toHaveBeenCalledWith({ ...fallback, usedFallback: true });
    });
  });
});
