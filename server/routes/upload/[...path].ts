/**
 * 本地存储的上传文件由 moments-api 提供，这里做同源转发，
 * 保证 /upload/2026/01/xxx.png 这类历史地址在拆分后依然可访问。
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const target = String(config.apiProxyTarget || '').replace(/\/$/, '')
  const url = getRequestURL(event)

  return proxyRequest(event, `${target}${url.pathname}${url.search}`)
})
