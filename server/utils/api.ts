import type { H3Event } from 'h3'
import { cachedValue } from './ttl-cache'

export type SitemapPayload = {
  articles: Array<{ id: string; updated_at?: string | null }>
  users: Array<{ username: string; updated_at?: string | null }>
  tags: Array<{ name: string }>
}

export function backendBase(event: H3Event) {
  const config = useRuntimeConfig(event)
  return String(config.apiProxyTarget || '').replace(/\/$/, '')
}

export function siteBaseUrl(event: H3Event) {
  const config = useRuntimeConfig(event)
  const configured = String(config.public.siteUrl || '').trim()
  const origin = configured || getRequestURL(event).origin
  return origin.replace(/\/$/, '')
}

/** 服务端直接访问 moments-api，避免绕一圈 Nitro 代理 */
export function apiFetch<T>(event: H3Event, path: string, query?: Record<string, string | number | boolean | undefined>) {
  return $fetch<T>(`${backendBase(event)}/api${path}`, {
    query,
    timeout: 10000,
  })
}

/** 读取站点公开配置（60 秒进程内缓存，失败时回退到空对象） */
export async function fetchSiteConfig(event: H3Event): Promise<Record<string, string>> {
  return cachedValue('site-config', 60_000, async () => {
    try {
      const configs = await apiFetch<Record<string, string>>(event, '/admin/publicConfig')
      return configs || {}
    } catch {
      return {}
    }
  })
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** 把正文压成纯文本，供 RSS / sitemap 使用 */
export function toPlainText(content?: string, limit = 160) {
  const text = (content || '').replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}…`
}
