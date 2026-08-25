// 直接引用无 CSS side effect 的主题 bundle，避免 Cogita 在 Node 构建阶段加载浏览器样式模块。

import React from 'react';

export function getThemeConfig() {
  return {
    name: '@nexus-mf/docs-theme',
    pageLayouts: {
      home: './Home.js',
    },
    globalStyles: new URL('./styles.css', import.meta.url).pathname,
  };
}

export function useThemeState() {
  return React.useState('light');
}

const navItems = [
  ['首页', '/'],
  ['快速开始', '/getting-started'],
  ['核心能力', '/api/'],
  ['部署与发布', '/guides/deployment'],
];

const sidebarGroups = [
  {
    title: '开始使用',
    items: [
      ['手册首页', '/'],
      ['快速开始', '/getting-started'],
      ['集成主应用', '/guides/integration'],
      ['接入远程微应用', '/guides/remote-app'],
    ],
  },
  {
    title: '核心能力',
    items: [
      ['能力总览', '/api/'],
      ['Remote Manifest', '/api/remote-manifest'],
      ['版本回滚', '/api/version-rollback'],
      ['CSS 生命周期', '/api/css-lifecycle'],
      ['微应用通信', '/api/communication'],
    ],
  },
  {
    title: '工程实践',
    items: [
      ['本地开发与测试', '/guides/development'],
      ['部署与发布', '/guides/deployment'],
      ['故障排查', '/guides/troubleshooting'],
    ],
  },
];

function Layout() {
  // 延迟加载 Rspress runtime，避免 Cogita 在读取站点配置时触发 virtual-* 浏览器模块。
  const { Content, usePageData } = require('@rspress/runtime');
  usePageData();
  const base = '/nexus-mf/docs';
  const link = (path) => {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    const target = normalized
      ? `${normalized}${path.endsWith('/') ? '/index.html' : '.html'}`
      : 'index.html';
    return `${base.replace(/\/$/, '')}/${target}`;
  };

  return React.createElement(
    'div',
    { className: 'nexus-docs-shell' },
    React.createElement(
      'header',
      { className: 'nexus-docs-header' },
      React.createElement('a', { className: 'nexus-docs-brand', href: link('/') }, 'Nexus MF 使用手册'),
      React.createElement(
        'nav',
        { className: 'nexus-docs-nav', 'aria-label': '顶部导航' },
        navItems.map(([label, path]) => React.createElement('a', { href: link(path), key: path }, label)),
        React.createElement('a', { href: 'https://wu9o.github.io/nexus-mf/', target: '_blank', rel: 'noreferrer' }, '在线示例'),
      ),
    ),
    React.createElement(
      'div',
      { className: 'nexus-docs-body' },
      React.createElement(
        'aside',
        { className: 'nexus-docs-sidebar', 'aria-label': '文档目录' },
        sidebarGroups.map((group) => React.createElement(
          'section',
          { key: group.title },
          React.createElement('h2', null, group.title),
          group.items.map(([label, path]) => React.createElement('a', { href: link(path), key: path }, label)),
        )),
      ),
      React.createElement('main', { className: 'nexus-docs-content' }, React.createElement(Content, null)),
    ),
  );
}

export default { Layout, NotFoundLayout: Layout };
