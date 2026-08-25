import { defineConfig } from '@cogita/core';

export default defineConfig({
  site: {
    title: 'Nexus MF 使用手册',
    description: '面向 React + Webpack Module Federation 的沙箱微前端框架使用手册。',
    lang: 'zh-CN',
    base: '/nexus-mf/docs/',
    url: 'https://wu9o.github.io/nexus-mf/docs/',
  },
  contentDir: 'content',
  theme: '@cogita/theme-docs',
  themeConfig: {
    home: {
      eyebrow: 'Nexus MF · 框架使用手册',
      title: '让远程微应用更容易接入、回退和治理。',
      lead: '面向 React + Webpack Module Federation 的沙箱微前端框架，集中处理远程加载、版本回滚、CSS 生命周期和微应用通信。',
      actions: [
        { text: '开始接入', link: '/getting-started' },
        { text: '查看在线示例', link: 'https://wu9o.github.io/nexus-mf/' },
      ],
      cards: [
        { label: '01', title: '快速开始', description: '安装核心包，挂载第一个远程微应用。', link: '/getting-started' },
        { label: '02', title: 'Remote Manifest', description: '管理远程地址、版本、来源和完整性校验。', link: '/api/remote-manifest' },
        { label: '03', title: '版本与生命周期', description: '了解回滚策略、CSS 清理和运行时卸载。', link: '/api/version-rollback' },
      ],
      system: {
        eyebrow: '运行时边界',
        title: '主应用负责编排，微应用保持独立。',
        description: '主应用读取 Manifest 并选择远程；SandboxMFE 负责初始化共享依赖、隔离运行时和清理资源；微应用只需要遵循 Module Federation 和路由约定。',
        flow: ['Manifest', '校验', 'SandboxMFE', '远程 App'],
      },
      themes: {
        eyebrow: '框架能力',
        title: '从远程加载到微应用治理，能力按边界逐步展开。',
        linkText: '查看能力总览 →',
        link: '/api/',
        items: [
          { variant: 'docs', label: 'CORE', title: '运行时核心', description: '加载远程容器、初始化共享依赖并管理沙箱生命周期。', link: '/api/' },
          { variant: 'lucid', label: 'OPS', title: '版本与发布', description: '通过 Manifest、回退版本和发布流程治理线上远程应用。', link: '/guides/deployment' },
          { variant: 'editorial', label: 'DEMO', title: '在线示例', description: '直接查看主应用与多个远程微应用的组合效果。', link: 'https://wu9o.github.io/nexus-mf/' },
        ],
      },
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/getting-started' },
      { text: '核心能力', link: '/api/' },
      { text: '部署与发布', link: '/guides/deployment' },
      { text: '在线示例', link: 'https://wu9o.github.io/nexus-mf/' },
    ],
    sidebar: {
      '/': [
        {
          text: '开始使用',
          items: [
            { text: '手册首页', link: '/' },
            { text: '快速开始', link: '/getting-started' },
            { text: '集成主应用', link: '/guides/integration' },
            { text: '接入远程微应用', link: '/guides/remote-app' },
          ],
        },
        {
          text: '核心能力',
          items: [
            { text: '能力总览', link: '/api/' },
            { text: 'Remote Manifest', link: '/api/remote-manifest' },
            { text: '版本回滚', link: '/api/version-rollback' },
            { text: 'CSS 生命周期', link: '/api/css-lifecycle' },
            { text: '微应用通信', link: '/api/communication' },
          ],
        },
        {
          text: '工程实践',
          items: [
            { text: '本地开发与测试', link: '/guides/development' },
            { text: '部署与发布', link: '/guides/deployment' },
            { text: '故障排查', link: '/guides/troubleshooting' },
          ],
        },
      ],
    },
  },
  builderConfig: {
    output: {
      assetPrefix: '/nexus-mf/docs/',
    },
  },
});
