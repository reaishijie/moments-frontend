import { apiFetch } from '../utils/api'
import { cachedValue, invalidateCache } from '../utils/ttl-cache'

const SITE_CONFIG_KEY = 'site-config'
const SITE_CONFIG_TTL = 60_000

/**
 * 站点公开配置的缓存出口。
 *
 * 页面渲染时由 plugins/site-config.ts 调用，60 秒内复用同一份数据，
 * 避免每个 SSR 请求都回源 moments-api；后台保存配置后可用 ?refresh=1 立即失效。
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (query.refresh === '1') {
    invalidateCache(SITE_CONFIG_KEY)
  }

  const configs = await cachedValue(SITE_CONFIG_KEY, SITE_CONFIG_TTL, async () => {
    try {
      return await apiFetch<Record<string, string>>(event, '/admin/publicConfig')
    } catch (error) {
      console.error('获取站点配置失败：', error)
      return {}
    }
  })

  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache')
  return configs
})
