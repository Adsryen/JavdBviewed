import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'JavdBviewed 文档中心',
  description: 'JavdBviewed 的使用文档、功能说明、隐私政策与开发参考',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }]
  ],
  outDir: '../docs-dist',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/quick-start' },
      { text: '使用教程', link: '/guide/' },
      { text: '版本发布', link: '/reference/changelog' },
      { text: '开发文档', link: '/developer/' },
      { text: 'GitHub', link: 'https://github.com/Adsryen/JavdBviewed' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '教程总览', link: '/guide/' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '界面介绍', link: '/guide/interface' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '视频标记', link: '/guide/video-marking' },
            { text: '数据管理', link: '/guide/data-management' },
            { text: 'WebDAV 同步', link: '/guide/webdav-sync' },
            { text: '115 网盘集成', link: '/guide/115-drive' }
          ]
        },
        {
          text: '增强功能',
          items: [
            { text: '演员管理', link: '/guide/actor-management' },
            { text: '新作品监控', link: '/guide/new-works' },
            { text: '磁力搜索', link: '/guide/magnet-search' },
            { text: '隐私保护', link: '/guide/privacy-protection' },
            { text: '页面增强', link: '/guide/page-enhancement' }
          ]
        },
        {
          text: '高级能力',
          items: [
            { text: '数据分析', link: '/guide/data-insights' },
            { text: 'Emby 集成', link: '/guide/emby-integration' },
            { text: 'AI 翻译', link: '/guide/ai-translation' }
          ]
        }
      ],
      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: '项目概览', link: '/reference/project-overview' },
            { text: '版本发布', link: '/reference/changelog' },
            { text: '功能总览', link: '/reference/features' },
            { text: '隐私政策', link: '/reference/privacy-policy' }
          ]
        }
      ],
      '/developer/': [
        {
          text: '开发文档',
          items: [
            { text: '开发总览', link: '/developer/' },
            { text: '二次开发指南', link: '/developer/development' },
            { text: '架构说明', link: '/developer/architecture' },
            { text: '数据同步模块', link: '/developer/data-sync' },
            { text: '115 模块说明', link: '/developer/drive115-module' },
            { text: 'UI 组件说明', link: '/developer/ui-components' }
          ]
        }
      ]
    },
    search: {
      provider: 'local'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Adsryen/JavdBviewed' }
    ],
    lastUpdated: {
      text: '最后更新'
    },
    footer: {
      message: '使用 VitePress 构建',
      copyright: 'Copyright © 2026 Adsryen'
    }
  }
})
