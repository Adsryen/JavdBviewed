import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'JavdBviewed',
  description: 'JavdBviewed 使用文档与帮助中心',
  cleanUrls: true,
  outDir: '../dist',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/quick-start' },
      { text: '常见问题', link: '/guide/faq' },
      { text: 'GitHub', link: 'https://github.com/Adsryen/JavdBviewed' }
    ],
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '文档首页', link: '/' },
          { text: '快速开始', link: '/guide/quick-start' },
          { text: '常见问题', link: '/guide/faq' }
        ]
      },
      {
        text: '功能教程',
        items: [
          { text: '界面介绍', link: '/guide/interface' },
          { text: '页面增强', link: '/guide/page-enhancement' },
          { text: '数据管理', link: '/guide/data-management' },
          { text: '演员管理', link: '/guide/actor-management' }
        ]
      },
      {
        text: '进阶功能',
        items: [
          { text: 'WebDAV 同步', link: '/guide/webdav-sync' },
          { text: '115 网盘集成', link: '/guide/115-drive' },
          { text: 'AI 翻译', link: '/guide/ai-translation' },
          { text: 'Emby 集成', link: '/guide/emby-integration' }
        ]
      },
      {
        text: '其他',
        items: [
          { text: '隐私政策', link: '/guide/privacy-policy' }
        ]
      }
    ],
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Adsryen/JavdBviewed' }
    ],
    footer: {
      message: '使用 VitePress 构建',
      copyright: 'Copyright © 2026 Adsryen'
    }
  }
})
