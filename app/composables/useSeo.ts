import { useDefaultStore } from '~/store/default'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

type RefLike<T> = T | MaybeRefOrGetter<T>

export type SeoInput = {
  /** 页面标题，省略时使用站点名 */
  title?: RefLike<string | undefined>
  description?: RefLike<string | undefined>
  image?: RefLike<string | undefined>
  type?: 'website' | 'article' | 'profile'
  /** 相对路径或绝对地址 */
  canonical?: RefLike<string | undefined>
  robots?: RefLike<string | undefined>
  publishedTime?: RefLike<string | undefined>
  modifiedTime?: RefLike<string | undefined>
  authors?: RefLike<string[] | undefined>
  section?: RefLike<string | undefined>
  tags?: RefLike<string[] | undefined>
  jsonLd?: RefLike<Record<string, unknown> | Array<Record<string, unknown>> | undefined>
}

export const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
export const PRIVATE_ROBOTS = 'noindex, nofollow'

/**
 * 统一的 SEO 出口：标题、描述、canonical、Open Graph、Twitter Card 与 JSON-LD。
 *
 * 站点信息优先取后台「基础设置」，取不到时回退到运行时环境变量，
 * 这样即使 moments-api 暂时不可用，页面也始终有完整的 meta 信息。
 */
export function useSeo(input: SeoInput = {}) {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()
  const defaultStore = useDefaultStore()

  const siteName = computed(() => defaultStore.configs.sitename?.trim() || runtimeConfig.public.appTitle)
  const siteDescription = computed(
    () => defaultStore.configs.site_description?.trim()
      || defaultStore.configs.site_brief?.trim()
      || runtimeConfig.public.appDescription,
  )
  const siteKeywords = computed(() => defaultStore.configs.site_keywords?.trim() || runtimeConfig.public.appKeywords)
  // 未配置对外域名时回退到当前请求的 Origin；SSR 结果通过 useState 传给客户端，
  // 保证 canonical 在服务端与客户端完全一致
  const requestUrl = useRequestURL()
  const detectedOrigin = useState('site-origin', () => requestUrl.origin)
  const siteUrl = computed(() => {
    const configured = defaultStore.configs.site_url?.trim() || String(runtimeConfig.public.siteUrl || '').trim()
    return (configured || detectedOrigin.value).replace(/\/$/, '')
  })

  const toAbsolute = (value?: string) => {
    if (!value) return undefined
    if (/^https?:\/\//i.test(value)) return value
    try {
      return new URL(value.startsWith('/') ? value : `/${value}`, `${siteUrl.value}/`).toString()
    } catch {
      return undefined
    }
  }

  const title = computed(() => toValue(input.title)?.trim() || siteName.value)
  const description = computed(() => toValue(input.description)?.trim() || siteDescription.value)
  const canonical = computed(() => toAbsolute(toValue(input.canonical) || route.path) || siteUrl.value)
  const image = computed(() => toAbsolute(toValue(input.image) || defaultStore.configs.site_logo || '/img/avatar.jpg'))
  const robots = computed(() => toValue(input.robots) || DEFAULT_ROBOTS)

  useHead({
    meta: [{ name: 'keywords', content: computed(() => siteKeywords.value || '') }],
  })

  useSeoMeta({
    title,
    description,
    robots,
    ogTitle: title,
    ogDescription: description,
    ogType: input.type || 'website',
    ogUrl: canonical,
    ogImage: image,
    ogSiteName: siteName,
    ogLocale: 'zh_CN',
    twitterCard: computed(() => (image.value ? 'summary_large_image' : 'summary')),
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    articlePublishedTime: computed(() => toValue(input.publishedTime)),
    articleModifiedTime: computed(() => toValue(input.modifiedTime)),
    articleAuthor: computed(() => toValue(input.authors)),
    articleSection: computed(() => toValue(input.section)),
    articleTag: computed(() => toValue(input.tags)),
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
  })

  useHead({
    script: computed(() => {
      const raw = toValue(input.jsonLd)
      if (!raw) return []
      const items = Array.isArray(raw) ? raw : [raw]
      return items
        .filter(Boolean)
        .map(item => ({
          type: 'application/ld+json',
          innerHTML: JSON.stringify(item),
        }))
    }),
  })

  return {
    siteName,
    siteDescription,
    siteUrl,
    canonical,
    image,
  }
}
