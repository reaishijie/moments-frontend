/**
 * 所有响应的基础安全头。
 *
 * moments-api 对 API 响应已经设置了同类头，这里补齐 Nuxt 直接返回的
 * HTML / XML / 静态资源，避免只部署 Node 服务时缺失。
 * 不设置严格 CSP：页面包含 Nuxt payload 内联脚本与 JSON-LD，需要单独评估 nonce 方案。
 */
export default defineEventHandler((event) => {
  const res = event.node.res
  if (res.headersSent) return

  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // 允许 OAuth 弹窗通过 window.opener 回传结果
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
})
