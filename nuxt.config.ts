import { defineNuxtConfig } from 'nuxt/config'

const apiProxyTarget = process.env.NUXT_API_PROXY_TARGET || 'http://127.0.0.1:9889'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  modules: ['@pinia/nuxt', '@nuxt/eslint', 'h3-compression/nuxt'],

  pinia: {
    // 沿用原有目录名 app/store（单数），并让 store 支持自动导入
    storesDirs: ['./store'],
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // 仅服务端可读：Nitro 反向代理到 moments-api 的目标地址
    apiProxyTarget,
    public: {
      // 站点对外地址，用于 canonical / sitemap / RSS / OG
      // 留空时自动使用当前请求的 Origin，后台「基础设置」里的 site_url 优先级更高
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      // 浏览器侧统一走 Nuxt 的同源代理，避免跨域 Cookie 问题
      apiBase: '/api',
      // 后端不可用或未配置时的兜底 SEO 文案
      appTitle: '瞬刻',
      appKeywords: '瞬刻,微信朋友圈,记录瞬间,博客程序,内容发布,博客',
      appDescription: '一个可以发布笔记、图片、视频的内容平台',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'RSS', href: '/rss.xml' },
      ],
    },
  },

  routeRules: {
    // 友链页不包含任何用户态数据，可以安全地做 5 分钟 SWR 缓存
    '/links': { swr: 300 },
    // 静态资源长缓存（文件名不带 hash，先给 7 天）
    '/img/**': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/emojis/**': { headers: { 'cache-control': 'public, max-age=604800' } },
    // 后台与登录后页面只做客户端渲染，避免把用户态数据写进 HTML
    '/admin/**': { ssr: false },
    '/profile': { ssr: false },
    '/post': { ssr: false },
    '/notifications': { ssr: false },
    // 注意：Nitro 路由规则不支持路径中间的 ** 通配，用命名参数精确匹配编辑页
    '/article/:articleId/edit': { ssr: false },
  },

  nitro: {
    compressPublicAssets: true,
  },

  // 动态 HTML / JSON / XML 的压缩（不依赖前置 Nginx）
  compression: {
    threshold: 1024,
    zstd: true,
    contentTypes: [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/rss+xml',
      'image/svg+xml',
    ],
  },

  eslint: {
    config: { stylistic: false },
  },
})
