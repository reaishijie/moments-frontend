import type { NitroFetchOptions } from 'nitropack'
import { useRequestHeaders, useRuntimeConfig } from '#imports'
import { useGuestHeaders } from '~/composables/useGuestHeaders'

type ApiFetchOptions = NitroFetchOptions<string>

type ApiFetch = <T = unknown>(path: string, options?: ApiFetchOptions) => Promise<T>

/**
 * 统一的 API 访问入口。
 *
 * - 浏览器：请求同源 `/api/**`，由 Nitro 代理转发（Cookie 自动携带）
 * - 服务端：直接请求 moments-api，省掉 Nitro 代理这一跳；
 *   同时手动转发 Cookie 与游客标识，保证登录态 / 点赞状态与浏览器一致
 *
 * path 传 `/articles` 这样的接口路径，不需要带 `/api` 前缀。
 */
export function useApiFetch(): ApiFetch {
  const requestHeaders = useRequestHeaders(['cookie'])
  const guestHeaders = useGuestHeaders()

  // apiProxyTarget 是服务端私有配置，浏览器端不读取它（否则会触发 NUXT_E1003 警告）
  let backendBase = ''
  if (import.meta.server) {
    backendBase = String(useRuntimeConfig().apiProxyTarget || '').replace(/\/$/, '')
  }

  return (<T = unknown>(path: string, options: ApiFetchOptions = {}) => {
    const headers = new Headers(options.headers as HeadersInit | undefined)
    for (const [name, value] of Object.entries(guestHeaders)) {
      if (value) headers.set(name, value)
    }
    if (import.meta.server) {
      for (const [name, value] of Object.entries(requestHeaders)) {
        if (value) headers.set(name, value)
      }
    }

    const url = import.meta.server ? `${backendBase}/api${path}` : `/api${path}`
    return $fetch<T>(url, { ...options, headers })
  }) as ApiFetch
}
