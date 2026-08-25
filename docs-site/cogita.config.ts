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
  theme: './theme/index.ts',
  themeConfig: {
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
