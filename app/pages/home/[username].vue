<script setup lang="ts">
import { AngleDown, ChevronLeft, Cog } from '@vicons/fa'
import Icon from '~/components/utils/VIcon.vue'
import Header from '~/components/Header.vue'
import Brief from '~/components/Brief.vue'
import HomeArticleItem from '~/components/article/HomeArticleItem.vue'
import AvatarImage from '~/components/utils/AvatarImage.vue'
import { getArticle } from '~/api/articles'
import { useMessageStore } from '~/store/message'
import { useDefaultStore } from '~/store/default'
import { useUserStore } from '~/store/user'
import type { articleData } from '~/types/article'
import { buildBreadcrumbJsonLd, buildProfileJsonLd } from '~/utils/seo'

const router = useRouter()


const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const userStore = useUserStore()
const defaultStore = useDefaultStore()
const messageStore = useMessageStore()
const apiFetch = useApiFetch()

const username = String(route.params.username || '')
if (!username) {
  throw createError({ statusCode: 404, statusMessage: '用户不存在', fatal: true })
}

type UserSummary = {
  id: string
  nickname: string | null
  avatar: string | null
  header_background: string | null
  brief: string | null
}

type ArticlePage = { data: articleData[]; total: number }

// 用户资料与首屏文章都在服务端取好，用户主页可直接被收录
const { data, error } = await useAsyncData(`home:${username}`, async () => {
  const user = await apiFetch<UserSummary>(`/user/${encodeURIComponent(username)}`)
  const articles = await apiFetch<ArticlePage>('/articles', {
    query: { page: 1, pageSize: 5, userId: user.id },
  })
  return { user, articles }
})

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: '用户不存在', fatal: true })
}

const userId = computed(() => data.value?.user.id ?? '')
const displayName = computed(() => data.value?.user.nickname || username || '未命名用户')
const avatar = computed(() => data.value?.user.avatar || '/img/avatar.jpg')
const headerBackground = computed(() => data.value?.user.header_background || '/img/background.avif')
const brief = computed(() => data.value?.user.brief || '这个人很懒，什么都没有留下。')

const userArticle = ref<articleData[]>([])
const pagination = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 5,
  isLoading: false,
})

watch(data, (payload) => {
  if (!payload) return
  userArticle.value = payload.articles.data ?? []
  pagination.total = payload.articles.total ?? 0
  pagination.currentPage = 1
}, { immediate: true })

const hasMore = computed(() => userArticle.value.length < pagination.total)

const articleYearGroups = computed(() => {
  const currentYear = new Date().getFullYear()
  const groups = new Map<string, { label: string; articles: articleData[] }>()

  userArticle.value.forEach((article) => {
    const date = new Date(article.created_at)
    const year = Number.isNaN(date.getTime()) ? null : date.getFullYear()
    const key = year === null ? 'unknown' : String(year)
    const label = year === null ? '未知年份' : year === currentYear ? '' : `${year}年`
    const yearGroup = groups.get(key) ?? { label, articles: [] }

    yearGroup.articles.push(article)
    groups.set(key, yearGroup)
  })

  return Array.from(groups, ([year, group]) => ({ year, ...group }))
})

function handleBack() {
  if (route.query.from === 'post') {
    void router.replace('/')
    return
  }
  router.back()
}

async function fetchArticles() {
  if (pagination.isLoading || !userId.value) return
  pagination.isLoading = true
  const id = messageStore.show('正在加载文章', 'loading')
  try {
    const res = await getArticle({
      page: pagination.currentPage + 1,
      pageSize: pagination.pageSize,
      userId: userId.value,
    })

    userArticle.value.push(...res.data.data)
    pagination.total = res.data.total
    pagination.currentPage++
    messageStore.update(id, { type: 'success', text: '加载成功', duration: 2000 })
  } catch (err) {
    console.error('获取用户文章失败', err)
    messageStore.update(id, { type: 'error', text: '加载失败', duration: 2000 })
  } finally {
    pagination.isLoading = false
  }
}

// SEO
const siteName = computed(() => defaultStore.configs.sitename?.trim() || runtimeConfig.public.appTitle)
const siteUrl = computed(() => (defaultStore.configs.site_url?.trim() || runtimeConfig.public.siteUrl).replace(/\/$/, ''))

useSeo({
  title: computed(() => `${displayName.value}的主页 - ${siteName.value}`),
  description: computed(() => brief.value),
  type: 'profile',
  canonical: computed(() => `/home/${encodeURIComponent(username)}`),
  image: computed(() => avatar.value),
  jsonLd: computed(() => {
    const site = { siteName: siteName.value, siteUrl: siteUrl.value, logo: defaultStore.configs.site_logo }
    return [
      buildProfileJsonLd({
        username,
        nickname: displayName.value,
        avatar: avatar.value,
        brief: brief.value,
      }, site),
      buildBreadcrumbJsonLd([
        { name: '首页', path: '/' },
        { name: displayName.value, path: `/home/${username}` },
      ], siteUrl.value),
    ]
  }),
})
</script>

<template>
  <div class="container">
    <div class="top-bar">
      <Header :header-background-url="headerBackground">
        <!-- 左插槽 -->
        <template #left="{ isBlurred }">
          <div class="top-bar-left">
            <Icon :class="['icon', { blurred: isBlurred }]" @click="handleBack">
              <ChevronLeft />
            </Icon>
          </div>
        </template>
        <!-- 右插槽 -->
        <template #right="{ isBlurred }">
          <div class="profile">
            <Icon v-if="userStore.accessToken" :class="['icon', { blurred: isBlurred }]" @click="router.push('/profile')">
              <Cog />
            </Icon>
          </div>
        </template>
      </Header>
    </div>
    <div class="brief">
      <Brief>
        <template #brief-img>
          <span>{{ displayName }}</span>
          <AvatarImage :src="avatar" alt="avatar" @click="router.push('/profile')" />
        </template>
        <template #brief-content>
          {{ brief }}
        </template>
      </Brief>
    </div>
    <div class="content-container">
      <!-- 简略文章展示 -->
      <div class="content-main">
        <div v-for="group in articleYearGroups" :key="group.year" class="year-block">
          <div v-if="group.label" class="year-title">{{ group.label }}</div>
          <ul class="year-articles">
            <li v-for="article in group.articles" :key="article.id">
              <!-- 每篇文章都循环使用 template 进行展示 -->
              <HomeArticleItem :article="article" />
            </li>
          </ul>
        </div>
      </div>
      <div class="content-footer">
        <div v-if="pagination.isLoading" class="status-indicator">正在加载中...</div>
        <div v-if="hasMore && !pagination.isLoading" class="status-indicator" @click="fetchArticles">
          加载更多
          <Icon>
            <AngleDown />
          </Icon>
        </div>
        <div v-if="!hasMore && userArticle.length > 0" class="status-indicator">- 没有更多了 -</div>
        <div v-if="userArticle.length === 0" class="status-indicator">- 该用户还没有发表内容哦 -</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color-bg-app);
}

.brief span {
  padding: 5px;
  color: #f3f3f3;
  margin-top: -35px;
  margin-right: 10px;
  z-index: 5;
  font-size: large;
  font-weight: 600;
}

/* 简介头像 */
.brief img {
  border-radius: 10%;
  width: 60px;
  height: 60px;
  margin-top: -40px;
  margin-right: 25px;
  z-index: 5;
}

.brief img:hover {
  cursor: pointer;
}

/* 简介语 */
.brief p {
  margin: 5px 5px 1px 5px;
  padding: 5px;
  font-size: smaller;
  color: #787878;
  font-style: italic;
}

/* bar的图标 */
.icon {
  font-size: 20px;
  color: #EEE9E9;
  margin: 3px;
}

.icon:hover {
  color: #C8C2C2;
  cursor: pointer;
}

.icon.blurred {
  font-size: 20px;
  color: #858484;
}

.icon.blurred:hover {
  color: #bfbebe;
}

/* 内容 */
.content-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 文章主内容 */
.content-main {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.year-block {
  margin: 12px 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background-color: var(--color-bg-app);
}

.year-title {
  padding: 12px 16px;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
}

.content-main ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.year-articles :deep(.article-item:last-child) {
  border-bottom: none;
}

.content-footer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.status-indicator {
  color: #25252574;
  margin-left: 10px;
  transition: color 0.3s, font-size 0.3s;
  height: 20px;
  font-size: smaller;
}

.status-indicator:hover {
  cursor: pointer;
  color: #bbd7f4;
}
</style>
