import { useDefaultStore } from '~/store/default'
<!-- 首页信息流：SSR 首屏 + 无限滚动 -->
<script setup lang="ts">
import Header from '~/components/Header.vue'
import Brief from '~/components/Brief.vue'
import ArticleList from '~/components/article/ArticleList.vue'
import { useFeedStore } from '~/store/feed'
import type { articleData } from '~/types/article'
import { buildItemListJsonLd, buildWebsiteJsonLd } from '~/utils/seo'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const defaultStore = useDefaultStore()
const feedStore = useFeedStore()
const apiFetch = useApiFetch()

const activeTag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag.trim() : ''))

type FeedResponse = { data: articleData[]; total: number; page: number; pageSize: number }

// 首屏在服务端渲染，标签筛选通过 URL 驱动，保证每个筛选结果都有独立可收录的 HTML
const { data, error } = await useAsyncData(
  () => `feed:${activeTag.value || 'all'}`,
  () => apiFetch<FeedResponse>('/articles', {
    query: {
      page: 1,
      pageSize: 5,
      ...(activeTag.value ? { tag: activeTag.value } : {}),
    },
  }),
  { watch: [activeTag] },
)

if (error.value) {
  console.error('首页信息流加载失败：', error.value)
}

watch(data, (payload) => {
  if (payload) feedStore.hydrateFeed(payload, { tag: activeTag.value })
}, { immediate: true })

const siteName = computed(() => defaultStore.configs.sitename?.trim() || runtimeConfig.public.appTitle)
const siteDescription = computed(
  () => defaultStore.configs.site_description?.trim()
    || defaultStore.configs.site_brief?.trim()
    || runtimeConfig.public.appDescription,
)
const siteUrl = computed(() => (defaultStore.configs.site_url?.trim() || runtimeConfig.public.siteUrl).replace(/\/$/, ''))

useSeo({
  title: computed(() => (activeTag.value ? `#${activeTag.value} - ${siteName.value}` : siteName.value)),
  description: computed(() => (activeTag.value
    ? `浏览 ${siteName.value} 中带有 #${activeTag.value} 标签的内容。${siteDescription.value}`
    : siteDescription.value)),
  canonical: computed(() => (activeTag.value ? `/?tag=${encodeURIComponent(activeTag.value)}` : '/')),
  image: computed(() => defaultStore.configs.site_avatar || defaultStore.configs.site_logo),
  jsonLd: computed(() => [
    buildWebsiteJsonLd({
      siteName: siteName.value,
      siteUrl: siteUrl.value,
      description: siteDescription.value,
      logo: defaultStore.configs.site_logo,
    }),
    buildItemListJsonLd(feedStore.articles, siteUrl.value),
  ]),
})
</script>

<template>
  <div class="container">
    <Header />
    <Brief />
    <ArticleList />
  </div>
</template>

<style scoped>
/* 主容器 */
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
