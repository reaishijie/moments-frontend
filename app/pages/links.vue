import { useDefaultStore } from '~/store/default'
<script setup lang="ts">
import Brief from '~/components/Brief.vue'
import Header from '~/components/Header.vue'
import BackButton from '~/components/utils/BackButton.vue'
import type { linkData } from '~/types/link'
import { buildBreadcrumbJsonLd } from '~/utils/seo'



const runtimeConfig = useRuntimeConfig()
const defaultStore = useDefaultStore()
const apiFetch = useApiFetch()

// 友链在服务端取好，输出成真实 <a> 标签，方便收录与直接跳转
const { data: links } = await useAsyncData('links', () => apiFetch<linkData[]>('/link'))

const siteName = computed(() => defaultStore.configs.sitename?.trim() || runtimeConfig.public.appTitle)
const siteUrl = computed(() => (defaultStore.configs.site_url?.trim() || runtimeConfig.public.siteUrl).replace(/\/$/, ''))
const linksBrief = computed(() => defaultStore.configs.link_brief || '欢迎访问这些朋友的站点')

useSeo({
  title: computed(() => `友情链接 - ${siteName.value}`),
  description: computed(() => `${linksBrief.value}。${siteName.value} 的友情链接页面。`),
  canonical: '/links',
  jsonLd: computed(() => buildBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '友情链接', path: '/links' },
  ], siteUrl.value)),
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
        {{ linksBrief }}
      </template>
    </Brief>

    <main class="links-page">
      <section class="links-content">
        <h1 class="links-title">友情链接</h1>

        <div v-if="!links?.length" class="state-text">暂时还没有友情链接</div>

        <ul v-else class="link-list">
          <li v-for="link in links" :key="link.id">
            <a class="link-item" :href="link.url" target="_blank" rel="noopener noreferrer">
              <img :src="link.logo ? link.logo : '/img/avatar.jpg'" :alt="`${link.sitename} LOGO`" loading="lazy">
              <span class="link-text">
                <span class="link-name">{{ link.sitename }}</span>
                <span class="link-brief">{{ link.brief ? link.brief : '暂时未设置站点介绍' }}</span>
              </span>
            </a>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.links-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 18px;
  box-sizing: border-box;
}

.links-title {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 600;
}

.state-text {
  padding: 24px 0;
  color: var(--color-text-other);
  text-align: center;
}

.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.link-list li + li {
  border-top: 1px solid rgba(128, 128, 128, 0.12);
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  text-decoration: none;
}

.link-item:hover {
  background-color: rgba(128, 128, 128, 0.12);
}

.link-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}

.link-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.link-name {
  font-weight: 600;
}

.link-brief {
  color: var(--color-text-other);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
</style>
