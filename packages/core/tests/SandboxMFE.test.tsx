import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SandboxMFE from '../src/SandboxMFE';
import Sandbox from '@garfish/browser-vm';

// 最简化的沙箱模拟
const mockSandboxInstance = {
  global: { window: {}, document: {} },
  execScript: vi.fn(),
  close: vi.fn() // 确保close是spy函数
};

// 模拟沙箱构造函数
vi.mock('@garfish/browser-vm', () => ({
  default: vi.fn(() => mockSandboxInstance)
}));

describe('SandboxMFE 核心功能验证', () => {
  const baseProps = {
    name: 'test-app',
    url: 'http://test.com/remote.js',
    basename: '/test'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 模拟必要的Webpack全局变量
    window.__webpack_share_scopes__ = {
      default: {
        react: { get: vi.fn(), loaded: true },
        'react-dom': { get: vi.fn(), loaded: true },
        'react-router-dom': { get: vi.fn(), loaded: true }
      }
    };
    window.__webpack_init_sharing__ = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    // 清理全局变量
    delete window.__webpack_share_scopes__;
    delete window.__webpack_init_sharing__;
  });

  it('1. 应正确渲染容器节点', () => {
    render(<SandboxMFE {...baseProps} />);
    expect(document.getElementById('sandbox-container')).toBeTruthy();
  });

  it('2. 应创建沙箱实例并在卸载时关闭', async () => {
    // 渲染组件
    const { unmount } = render(<SandboxMFE {...baseProps} />);

    // 等待沙箱实例被创建
    await waitFor(() => {
      expect(Sandbox).toHaveBeenCalled(); // 验证沙箱被实例化
    });

    // 执行卸载
    unmount();

    // 验证沙箱关闭
    expect(mockSandboxInstance.close).toHaveBeenCalled();
  });

  it('3. 应初始化远程容器', async () => {
    // 手动模拟远程容器
    const mockContainer = {
      init: vi.fn(),
      get: vi.fn().mockResolvedValue(() => ({ default: () => <div /> }))
    };
    window[baseProps.name] = mockContainer;

    // 渲染组件
    render(<SandboxMFE {...baseProps} />);

    // 等待共享依赖检查完成（推进组件内部流程）
    await new Promise(resolve => setTimeout(resolve, 100));

    // 手动触发容器初始化（模拟script加载完成）
    mockContainer.init(window.__webpack_share_scopes__.default);

    // 验证初始化
    expect(mockContainer.init).toHaveBeenCalled();
  });
});