<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Header from '~/components/Header.vue'
import Brief from '~/components/Brief.vue'
import BackButton from '~/components/utils/BackButton.vue'
import HomeArticleItem from '~/components/article/HomeArticleItem.vue'
import type { articleData } from '~/types/article'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const defaultStore = useDefaultStore()
const apiFetch = useApiFetch()

const keyword = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
const input = ref(keyword.value)

watch(keyword, (value) => {
  input.value = value
})

type SearchResponse = { data: articleData[]; total: number }

// 搜索结果页同样走 SSR，保证分享链接能直接看到结果
const { data, status } = await useAsyncData<SearchResponse>(
  () => `search:${keyword.value}`,
  () => (keyword.value
    ? apiFetch<SearchResponse>('/articles', {
        query: { page: 1, pageSize: 10, content: keyword.value },
      })
    : Promise.resolve({ data: [], total: 0 })),
  { watch: [keyword] },
)

const results = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const isLoading = computed(() => status.value === 'pending')

const siteName = computed(() => defaultStore.configs.sitename?.trim() || runtimeConfig.public.appTitle)

function submit() {
  const q = input.value.trim()
  void navigateTo({ path: '/search', query: q ? { q } : {} })
}

useSeo({
  title: computed(() => (keyword.value ? `搜索“${keyword.value}” - ${siteName.value}` : `搜索 - ${siteName.value}`)),
  description: computed(() => (keyword.value
    ? `在 ${siteName.value} 中搜索“${keyword.value}”的相关内容，共 ${total.value} 条结果。`
    : `搜索 ${siteName.value} 中的内容。`)),
  canonical: computed(() => (keyword.value ? `/search?q=${encodeURIComponent(keyword.value)}` : '/search')),
  // 搜索结果页属于低价值重复页面，不参与收录
  robots: PRIVATE_ROBOTS,
})
</script>

<template>
  <div class="container">
    <Header>
      <template #left="{ isBlurred }">
        <BackButton :blurred="isBlurred" fallback="/" />
      </template>
    </Header>

    <Brief>
      <template #brief-content>
        搜索站内的文字、图片与视频内容
      </template>
    </Brief>

    <main class="search-page">
      <form class="search-bar" role="search" @submit.prevent="submit">
        <label class="sr-only" for="site-search">搜索内容</label>
        <input
          id="site-search"
          v-model="input"
          type="search"
          name="q"
          placeholder="搜索内容关键词"
          autocomplete="off"
          enterkeyhint="search"
        >
        <button type="submit">搜索</button>
      </form>

      <p v-if="keyword" class="search-summary">
        关于「{{ keyword }}」的搜索结果：{{ total }} 条
      </p>

      <div v-if="!keyword" class="state-text">输入关键词开始搜索</div>
      <div v-else-if="isLoading" class="state-text">正在搜索...</div>
      <div v-else-if="results.length === 0" class="state-text">没有找到相关内容，换个关键词试试</div>

      <ul v-else class="search-results">
        <li v-for="article in results" :key="article.id">
          <HomeArticleItem :article="article" />
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.search-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 18px;
  box-sizing: border-box;
}

.search-bar {
  display: flex;
  gap: 8px;
  width: 100%;
}

.search-bar input {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-bg-app);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
}

.search-bar input:focus {
  border-color: #6cadf1;
}

.search-bar button {
  flex: 0 0 auto;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background-color: #6cadf1;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.search-bar button:hover {
  background-color: #4f97e0;
}

.search-summary {
  margin: 14px 0 0;
  color: var(--color-text-other);
  font-size: 13px;
}

.search-results {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}

.state-text {
  padding: 28px 0;
  color: var(--color-text-other);
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
