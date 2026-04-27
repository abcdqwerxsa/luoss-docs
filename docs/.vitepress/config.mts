import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'LuoSS 络书算衡',
    description: 'K8s 算力管理平台使用文档 - 企业级 Kubernetes 算力管理解决方案',
    lang: 'zh-CN',

    // SEO & Meta
    head: [
      ['link', { rel: 'icon', href: '/favicon.ico' }],
      ['meta', { name: 'theme-color', content: '#3eaf7c' }],
      ['meta', { name: 'og:type', content: 'website' }],
      ['meta', { name: 'og:title', content: 'LuoSS 络书算衡 - K8s 算力管理平台' }],
      ['meta', { name: 'og:description', content: '企业级 Kubernetes 算力管理平台，提供云端开发环境、分布式训练、资源配额管理等功能' }],
      ['meta', { name: 'og:image', content: '/logo.png' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'keywords', content: 'Kubernetes, K8s, 租户管理, 云开发环境, 分布式训练, 容器平台' }],
    ],

    // Sitemap
    sitemap: {
      hostname: 'https://luoss.nilpo.app',
      lastmodDateOnly: true,
    },

    // Last updated
    lastUpdated: true,

    // Clean URLs
    cleanUrls: true,

    themeConfig: {
      logo: '/logo.png',
      siteTitle: 'LuoSS 文档',

      // Navigation
      nav: [
        { text: '首页', link: '/' },
        { text: '用户指南', link: '/guide/overview' },
        { text: '快速开始', link: '/quickstart/' },
        { text: '管理员指南', link: '/admin/users' },
      ],

      // Sidebars
      sidebar: {
        '/guide/': [
          {
            text: '开始使用',
            items: [
              { text: '概述', link: '/guide/overview' },
              { text: '快速开始', link: '/guide/getting-started' },
            ],
          },
          {
            text: '核心概念',
            items: [
              { text: '系统架构', link: '/guide/architecture' },
              { text: '安全指南', link: '/guide/security' },
            ],
          },
          {
            text: '功能指南',
            items: [
              { text: '仪表盘', link: '/guide/dashboard' },
              { text: '调度仪表盘', link: '/guide/scheduling-dashboard' },
              { text: '开发环境', link: '/guide/environments' },
              { text: '训练任务', link: '/guide/training-jobs' },
              { text: '命令行工具 (ktp)', link: '/guide/cli' },
              { text: '项目管理', link: '/guide/projects' },
              { text: '集群拓扑', link: '/guide/cluster-topology' },
              { text: '数据存储', link: '/guide/model-manager' },
              { text: '镜像存储', link: '/guide/image-storage' },
              { text: '我的作业', link: '/guide/volcano-jobs' },
              { text: '使用统计', link: '/guide/my-usage' },
              { text: '站内信通知', link: '/guide/notifications' },
              { text: 'Web 终端', link: '/guide/web-terminal' },
              { text: '设置', link: '/guide/settings' },
            ],
          },
          {
            text: '帮助',
            items: [
              { text: '常见问题', link: '/guide/faq' },
            ],
          },
        ],
        '/admin/': [
          {
            text: '管理指南',
            items: [
              { text: '作业历史', link: '/admin/job-history' },
              { text: '实时作业', link: '/admin/job-active' },
              { text: '用户管理', link: '/admin/users' },
              { text: '项目管理', link: '/admin/projects' },
              { text: '配额管理', link: '/admin/quotas' },
              { text: '存储管理', link: '/admin/storage' },
              { text: '统计分析', link: '/admin/statistics' },
              { text: '计费管理', link: '/admin/billing' },
              { text: '审计日志', link: '/admin/audit' },
              { text: '队列管理', link: '/admin/queues' },
              { text: '队列资源池', link: '/admin/queue-pool' },
              { text: '集群监控', link: '/admin/cluster' },
              { text: 'NPU 监控', link: '/admin/npu-monitoring' },
              { text: '许可管理', link: '/admin/license' },
            ],
          },
          {
            text: '调度配置',
            items: [
              { text: '优先级调度', link: '/admin/priority-scheduling' },
            ],
          },
          {
            text: '运维指南',
            items: [
              { text: '故障排查', link: '/admin/troubleshooting' },
            ],
          },
        ],
        '/quickstart/': [
          {
            text: '快速开始',
            items: [
              { text: '概述', link: '/quickstart/' },
              { text: '环境配置', link: '/quickstart/environment' },
            ],
          },
          {
            text: '训练实例',
            items: [
              { text: 'YOLO 分布式训练', link: '/quickstart/yolo-training' },
              { text: 'MindsSpeed LLM 训练', link: '/quickstart/mindspeed-training' },
            ],
          },
          {
            text: '推理实例',
            items: [
              { text: 'VLLM 分布式推理', link: '/quickstart/vllm-inference' },
            ],
          },
          {
            text: '帮助',
            items: [
              { text: '常见问题排查', link: '/quickstart/troubleshooting' },
            ],
          },
        ],
      },

      // Social links
      socialLinks: [
        { icon: 'github', link: 'https://github.com/abcdqwerxsa/luoss-docs' },
      ],

      // Footer
      footer: {
        message: 'LuoSS 络书算衡 - K8s 算力管理平台',
        copyright: 'Copyright © 2026',
      },

      // Search
      search: {
        provider: 'local',
      },

      // Outline
      outline: {
        level: [1, 3],
      },

      // Edit link
      editLink: {
        pattern: 'https://github.com/abcdqwerxsa/luoss-docs/edit/main/docs/:path',
        text: '在 GitHub 上编辑此页',
      },

      // Last updated text
      lastUpdatedText: '最后更新',

      // Dark mode toggle
      darkModeSwitchLabel: '主题切换',
      darkModeSwitchTitle: '切换到深色模式',
      lightModeSwitchTitle: '切换到浅色模式',

      // Sidebar text
      sidebarMenuLabel: '菜单',
      returnToTopLabel: '返回顶部',

      // Doc footer
      docFooter: {
        prev: '上一页',
        next: '下一页',
      },

      // External link icon
      externalLinkIcon: true,
    },

    // Mermaid configuration
    mermaid: {
      // Refer to https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
      theme: 'default',
    },
    mermaidPlugin: {
      class: 'mermaid',
    },
  })
)
