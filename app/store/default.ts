import type { updateConfigData } from '~/types/admin'
import { defineStore } from 'pinia'
import { computed } from 'vue'

/**
 * 站点公开配置。
 *
 * 配置放在 Nuxt useState 中：服务端首屏拉取一次，随 payload 下发，
 * 客户端无需重复请求，也保证 SSR 与 hydration 的配置完全一致。
 * 真正的回源与缓存由 server/routes/site-config.json.ts 负责（60 秒 TTL）。
 */
export const useDefaultStore = defineStore('default', () => {
  const configs = useState<updateConfigData>('site-config', () => ({}))

  const isReady = computed(() => Object.keys(configs.value).length > 0)

  const getPublicConfig = async (force = false) => {
    if (!force && isReady.value) return configs.value
    try {
      const data = await $fetch<updateConfigData>('/site-config.json', {
        // 后端不可用时不要让 SSR 长时间等待
        timeout: 2500,
        query: force ? { refresh: '1' } : undefined,
      })
      configs.value = data || {}
    } catch (error) {
      console.error('获取站点配置失败：', error)
    }
    return configs.value
  }

  return {
    configs,
    isReady,
    getPublicConfig,
  }
})
