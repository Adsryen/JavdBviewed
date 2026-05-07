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
          text: '首页',
          items: [
            { text: '界面介绍', link: '/guide/interface' }
          ]
        },
        {
          text: '番号库',
          items: [
            { text: '视频标记', link: '/guide/video-marking' },
            { text: '数据管理', link: '/guide/data-management' }
          ]
        },
        {
          text: '清单',
          items: [
            { text: '数据管理', link: '/guide/data-management' }
          ]
        },
        {
          text: '演员库',
          items: [
            { text: '演员管理', link: '/guide/actor-management' }
          ]
        },
        {
          text: '新作品',
          items: [
            { text: '新作品监控', link: '/guide/new-works' }
          ]
        },
        {
          text: '数据同步',
          items: [
            { text: 'WebDAV 同步', link: '/guide/webdav-sync' },
            { text: '同步设置', link: '/guide/settings-sync' }
          ]
        },
        {
          text: '115任务',
          items: [
            { text: '115 网盘集成', link: '/guide/115-drive' }
          ]
        },
        {
          text: '报告',
          items: [
            { text: '数据分析与报告', link: '/guide/data-insights' },
            { text: '报告设置', link: '/guide/settings-report' }
          ]
        },
        {
          text: '设置总览',
          items: [
            { text: '设置导航', link: '/guide/settings-index' }
          ]
        },
        {
          text: '设置 / 显示设置',
          items: [
            { text: '显示设置', link: '/guide/settings-display' }
          ]
        },
        {
          text: '设置 / 功能增强',
          items: [
            { text: '功能增强', link: '/guide/page-enhancement' }
          ]
        },
        {
          text: '设置 / 搜索引擎',
          items: [
            { text: '搜索引擎与磁力搜索', link: '/guide/magnet-search' }
          ]
        },
        {
          text: '设置 / AI设置',
          items: [
            { text: 'AI 翻译', link: '/guide/ai-translation' }
          ]
        },
        {
          text: '设置 / 隐私保护',
          items: [
            { text: '隐私保护', link: '/guide/privacy-protection' }
          ]
        },
        {
          text: '设置 / WebDAV同步',
          items: [
            { text: 'WebDAV 同步', link: '/guide/webdav-sync' }
          ]
        },
        {
          text: '设置 / 同步设置',
          items: [
            { text: '同步设置', link: '/guide/settings-sync' }
          ]
        },
        {
          text: '设置 / 115网盘',
          items: [
            { text: '115 网盘集成', link: '/guide/115-drive' }
          ]
        },
        {
          text: '设置 / Emby增强',
          items: [
            { text: 'Emby 集成', link: '/guide/emby-integration' }
          ]
        },
        {
          text: '设置 / 报告',
          items: [
            { text: '报告设置', link: '/guide/settings-report' },
            { text: '数据分析与报告', link: '/guide/data-insights' }
          ]
        },
        {
          text: '设置 / 日志设置',
          items: [
            { text: '日志设置', link: '/guide/settings-log' }
          ]
        },
        {
          text: '设置 / 高级配置',
          items: [
            { text: '高级配置', link: '/guide/settings-advanced' }
          ]
        },
        {
          text: '设置 / 网络配置',
          items: [
            { text: '网络配置', link: '/guide/settings-network' }
          ]
        },
        {
          text: '设置 / 全局操作',
          items: [
            { text: '全局操作', link: '/guide/settings-global-actions' }
          ]
        },
        {
          text: '设置 / 检查更新',
          items: [
            { text: '检查更新', link: '/guide/settings-update' }
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
