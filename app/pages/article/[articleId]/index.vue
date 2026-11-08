import { useDefaultStore } from '~/store/default'
<script setup lang="ts">
import { ChevronLeft, EllipsisH } from '@vicons/fa'
import Icon from '~/components/utils/VIcon.vue'
import ArticleItem from '~/components/article/ArticleItem.vue'
import { useArticleStore } from '~/store/article'
import { useUserStore } from '~/store/user'
import { useMessageStore } from '~/store/message'
import { updateArticle } from '~/api/articles'
import type { Liker, articleData } from '~/types/article'
import type { Comment, createCommentData } from '~/types/comments'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, toPlainText } from '~/utils/seo'

const router = useRouter()


const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const defaultStore = useDefaultStore()
const articleStore = useArticleStore()
const userStore = useUserStore()
const messageStore = useMessageStore()
const apiFetch = useApiFetch()

const articleId = Number(route.params.articleId)
if (!Number.isInteger(articleId) || articleId <= 0) {
  throw createError({ statusCode: 404, statusMessage: '内容不存在', fatal: true })
}

type ArticleDetailPayload = {
  article: articleData
  comments: Comment[]
  likers: Liker[]
}

// 详情页全部数据在服务端取好：正文与评论直接出现在 HTML 里，利于收录
const { data, error } = await useAsyncData<ArticleDetailPayload>(
  `article:${articleId}`,
  async () => {
    const article = await apiFetch<articleData>(`/articles/${articleId}`)

    const [commentsResponse, likers] = await Promise.all([
      apiFetch<{ data: Comment[]; total: number }>(`/comments/${articleId}`, {
        query: { page: 1, pageSize: 50 },
      }).catch(() => ({ data: [], total: 0 })),
      apiFetch<Liker[]>(`/articles/${articleId}/like`).catch(() => []),
    ])

    return {
      article,
      comments: commentsResponse.data ?? [],
      likers: likers ?? [],
    }
  },
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: '内容不存在', fatal: true })
}

watch(data, (payload) => {
  if (payload) {
    articleStore.hydrateArticle(payload)
  }
}, { immediate: true })

const article = computed(() => articleStore.article)
const isLoading = computed(() => articleStore.states.article)
const isShowInput = ref(false)
const isMenuOpen = ref(false)
const isUpdating = ref(false)
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const isAdmin = computed(() => Number(userStore.profile?.role) === 1)
const isOwner = computed(() => !!article.value && String(article.value.user_id) === String(userStore.profile?.id))
const isInEditWindow = computed(() => {
  if (!article.value?.created_at) return false
  const createdAt = new Date(article.value.created_at).getTime()
  return !Number.isNaN(createdAt) && Date.now() - createdAt <= ONE_DAY_MS
})
const canEditArticle = computed(() => isAdmin.value || (isOwner.value && isInEditWindow.value))
const canManage = computed(() => isAdmin.value || canEditArticle.value)

function toggleComment() {
  isShowInput.value = !isShowInput.value
}

async function handleSendReply(payload: createCommentData & { onComplete?: (success: boolean) => void }) {
  const { onComplete, ...commentData } = payload
  const success = await articleStore.createComment(commentData)
  onComplete?.(success)
}

function editArticle() {
  if (!article.value) return
  if (!canEditArticle.value) {
    messageStore.show('文章发布超过1天后不能编辑', 'info', 2000)
    return
  }
  isMenuOpen.value = false
  void router.push(`/article/${article.value.id}/edit`)
}

async function patchArticle(payload: { isTop?: boolean; isAd?: boolean; status?: number }) {
  if (!article.value || isUpdating.value) return
  const id = messageStore.show('正在更新文章', 'loading')
  const currentIsLiked = article.value.isLiked
  try {
    isUpdating.value = true
    const res = await updateArticle(article.value.id, payload)
    const updatedArticle = {
      ...res.data.data,
      isLiked: currentIsLiked,
    }
    articleStore.hydrateArticle({
      article: updatedArticle,
      comments: articleStore.comments,
      likers: articleStore.likers,
    })
    messageStore.update(id, { type: 'success', text: '更新成功', duration: 2000 })
    if (payload.status === 0) {
      void router.replace('/')
    }
  } catch (err) {
    console.error('更新文章失败:', err)
    messageStore.update(id, { type: 'error', text: '更新失败', duration: 2000 })
  } finally {
    isUpdating.value = false
    isMenuOpen.value = false
  }
}

onMounted(async () => {
  if (userStore.accessToken && !userStore.profile) {
    await userStore.fetchUserProfile()
  }
})

// SEO
const siteName = computed(() => defaultStore.configs.sitename?.trim() || runtimeConfig.public.appTitle)
const siteUrl = computed(() => (defaultStore.configs.site_url?.trim() || runtimeConfig.public.siteUrl).replace(/\/$/, ''))

const pageTitle = computed(() => {
  const text = toPlainText(article.value?.content, 40)
  return text ? `${text} - ${siteName.value}` : `内容详情 - ${siteName.value}`
})

useSeo({
  title: pageTitle,
  description: computed(() => toPlainText(article.value?.content, 160)),
  type: 'article',
  image: computed(() => article.value?.article_images?.[0]?.image_url),
  canonical: computed(() => `/article/${articleId}`),
  publishedTime: computed(() => article.value?.created_at),
  modifiedTime: computed(() => article.value?.updated_at),
  authors: computed(() => (article.value?.user ? [article.value.user.nickname || article.value.user.username] : undefined)),
  tags: computed(() => article.value?.tags?.map(tag => tag.name)),
  jsonLd: computed(() => {
    if (!article.value) return undefined
    const site = {
      siteName: siteName.value,
      siteUrl: siteUrl.value,
      logo: defaultStore.configs.site_logo,
    }
    return [
      buildArticleJsonLd(article.value, site, articleStore.comments),
      buildBreadcrumbJsonLd([
        { name: '首页', path: '/' },
        { name: article.value.user?.nickname || '用户主页', path: `/home/${article.value.user?.username ?? ''}` },
        { name: `内容 ${article.value.id}`, path: `/article/${article.value.id}` },
      ], siteUrl.value),
    ]
  }),
})
</script>

<template>
  <div class="container">
    <!-- 顶部栏 -->
    <div class="header">
      <button id="back" type="button" aria-label="返回上一页" @click="router.back()">
        <Icon>
          <ChevronLeft />
        </Icon>
      </button>
      <div>内容详情</div>
      <div class="func">
        <button v-if="canManage" class="menu-button" type="button" @click.stop="isMenuOpen = !isMenuOpen" title="文章操作">
          <Icon>
            <EllipsisH />
          </Icon>
        </button>
        <div v-if="isMenuOpen && canManage" class="action-menu">
          <button v-if="canEditArticle" type="button" @click="editArticle">编辑文章</button>
          <template v-if="isAdmin">
            <button type="button" @click="patchArticle({ isTop: !article?.is_top })">
              {{ article?.is_top ? '取消置顶' : '设为置顶' }}
            </button>
            <button type="button" @click="patchArticle({ isAd: !article?.is_ad })">
              {{ article?.is_ad ? '取消广告' : '设为广告' }}
            </button>
            <button type="button" class="danger" @click="patchArticle({ status: 0 })">下架文章</button>
          </template>
        </div>
      </div>
    </div>
    <!-- 文章展示 -->
    <div class="body">
      <span v-if="isLoading && !article">正在加载中...</span>
      <ArticleItem
        v-if="article"
        :article="article"
        :likers="articleStore.likers || []"
        :comments="articleStore.comments || []"
        :is-show-input="!!isShowInput"
        :has-more-comments="false"
        :remaining-comments="0"
        :is-loading-comments="false"
        @like="() => articleStore.toggleLike(articleId)"
        @comment="() => toggleComment()"
        @send-reply="handleSendReply"
        @load-more-comments="() => undefined"
      />
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

/* 头部栏 */
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 6vh;
  /* 保证 36px 的返回按钮在矮屏（横屏手机）里也不会被裁切 */
  min-height: 48px;
  background-color: var(--color-post-bar);
  padding: 0px 5px 0px 10px;
}

#back {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: color 0.2s ease;
}

#back:hover {
  color: #000000fb;
}

.dark-mode #back:hover {
  color: #ffffff;
}

.func {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  color: var(--color-text-primary);
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.menu-button:hover {
  background: var(--color-ad);
}

.action-menu {
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 20;
  min-width: 118px;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-bg-app);
  box-shadow: var(--color-shadow);
}

.action-menu button {
  width: 100%;
  border: none;
  border-radius: 5px;
  padding: 8px 10px;
  color: var(--color-text-primary);
  background: transparent;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}

.action-menu button:hover {
  background-color: var(--color-ad);
}

.action-menu button.danger {
  color: #e05a47;
}

/* 主体 */
.body {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}

.body span {
  margin-top: 40vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: skyblue;
}
</style>
