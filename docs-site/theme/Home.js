import React from 'react';
import { usePageData } from '@rspress/runtime';

const Home = () => {
  usePageData();
  const base = '/nexus-mf/docs';
  const link = (path) => {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    const target = normalized
      ? `${normalized}${path.endsWith('/') ? '/index.html' : '.html'}`
      : 'index.html';
    return `${base.replace(/\/$/, '')}/${target}`;
  };

  const cards = [
    ['01', '快速开始', '安装核心包，挂载第一个远程微应用。', '/getting-started'],
    ['02', 'Remote Manifest', '管理远程地址、版本、来源和完整性校验。', '/api/remote-manifest'],
    ['03', '版本与生命周期', '了解回滚策略、CSS 清理和运行时卸载。', '/api/version-rollback'],
  ];

  return React.createElement(
    'main',
    { className: 'docs-home' },
    React.createElement(
      'section',
      { className: 'docs-home-hero' },
      React.createElement('p', { className: 'docs-home-eyebrow' }, 'Nexus MF · 框架使用手册'),
      React.createElement('h1', null, '让远程微应用更容易接入、回退和治理。'),
      React.createElement(
        'p',
        { className: 'docs-home-lead' },
        '面向 React + Webpack Module Federation 的沙箱微前端框架，集中处理远程加载、版本回滚、CSS 生命周期和微应用通信。',
      ),
      React.createElement(
        'div',
        { className: 'docs-home-actions' },
        React.createElement('a', { href: link('/getting-started') }, '开始接入'),
        React.createElement('a', { href: 'https://wu9o.github.io/nexus-mf/', target: '_blank', rel: 'noreferrer' }, '查看在线示例'),
      ),
    ),
    React.createElement(
      'section',
      { className: 'docs-home-grid', 'aria-label': '文档入口' },
      cards.map(([number, title, description, path]) => React.createElement(
        'a',
        { href: link(path), className: 'docs-home-card', key: path },
        React.createElement('span', null, number),
        React.createElement('strong', null, title),
        React.createElement('small', null, description),
      )),
    ),
    React.createElement(
      'section',
      { className: 'docs-home-system', 'aria-label': '框架能力' },
      React.createElement(
        'div',
        { className: 'docs-home-system-copy' },
        React.createElement('p', { className: 'docs-home-section-label' }, '运行时边界'),
        React.createElement('h2', null, '主应用负责编排，微应用保持独立。'),
        React.createElement(
          'p',
          null,
          '主应用读取 Manifest 并选择远程；SandboxMFE 负责初始化共享依赖、隔离运行时和清理资源；微应用只需要遵循 Module Federation 和路由约定。',
        ),
      ),
      React.createElement(
        'div',
        { className: 'docs-home-flow', 'aria-label': '加载流程' },
        ['Manifest', '校验', 'SandboxMFE', '远程 App'].flatMap((label, index, items) => (
          index < items.length - 1
            ? [React.createElement('span', { key: label }, label), React.createElement('span', { className: 'docs-home-flow-arrow', key: `${label}-arrow` }, '→')]
            : [React.createElement('span', { key: label }, label)]
        )),
      ),
    ),
  );
};

export default Home;
