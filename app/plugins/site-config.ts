import { useDefaultStore } from '~/store/default'

/**
 * 首屏拉取站点公开配置（站点名、简介、Logo、背景、页脚 HTML 等）。
 *
 * 结果写入 useState('site-config')，随 SSR payload 下发；
 * 客户端后续导航直接复用，不会重复请求。
 */
export default defineNuxtPlugin(async () => {
  const defaultStore = useDefaultStore()
  if (defaultStore.isReady) return

  await defaultStore.getPublicConfig()
})
