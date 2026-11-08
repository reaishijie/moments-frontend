/**
 * h3 的 proxyRequest 只在底层 fetch 失败时抛出 502，
 * 这里据此判断是否为「后端不可达」，并补一条可操作的提示。
 */
function isBackendUnreachable(error: unknown) {
  const candidate = (typeof error === 'object' && error !== null ? error : {}) as { statusCode?: number }
  return candidate.statusCode === 502
}

/**
 * 把 /api/** 原样转发到 moments-api。
 *
 * 浏览器与 moments-api 之间不再有跨域：Refresh Token 的 HttpOnly Cookie
 * 对 Nuxt 同源，SSR 时也能携带，登录态在前后端拆分后依旧可用。
 *
 * 同时透传 X-Forwarded-Host / X-Forwarded-Proto：
 * moments-api 在开启 TRUST_PROXY 时会用它们校验 Origin，
 * OAuth 回调、邮件链接等也能拿到用户实际访问的域名。
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const target = String(config.apiProxyTarget || '').replace(/\/$/, '')
  const url = getRequestURL(event)
  const apiPath = url.pathname.replace(/^\/api/, '')

  const forwardedProto = (getRequestHeader(event, 'x-forwarded-proto') || url.protocol.replace(':', ''))
    .split(',')[0]
    ?.trim() || 'http'

  try {
    return await proxyRequest(event, `${target}/api${apiPath}${url.search}`, {
      // 上传大文件时直接流式转发，避免在 Nitro 侧整包缓冲
      streamRequest: true,
      headers: {
        'x-forwarded-host': url.host,
        'x-forwarded-proto': forwardedProto,
      },
    })
  } catch (error) {
    // 响应已经开始时无法再改写状态码，交回 Nitro 默认处理
    if (event.node.res.headersSent) throw error

    if (isBackendUnreachable(error)) {
      console.error(
        `[api-proxy] 无法连接 moments-api（${target}）。`
        + '请确认后端已启动，或检查 NUXT_API_PROXY_TARGET 配置。',
      )
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: `无法连接 moments-api（${target}）。请先启动后端，或检查 NUXT_API_PROXY_TARGET 配置。`,
        cause: error,
      })
    }

    throw error
  }
})
