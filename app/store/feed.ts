/** 创建文章加载流 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Liker, articleData } from '~/types/article'
import type { Comment, createCommentData } from '~/types/comments'
import { getArticle, likeArticle, dislikeArticle, getArticleDetails, getArticleLikers } from '~/api/articles'
import { getApiError } from '~/utils/error'
import { useUserStore } from './user'
import { getOrCreateGuestId } from '~/utils/guest'
import { useMessageStore } from './message'
import { getAllComment, createComment as apiCreateComment } from '~/api/comments'

type CommentPagination = {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  isLoading: boolean
  remaining: number
}

export type FeedPayload = {
  data: articleData[]
  total: number
  page?: number
  pageSize?: number
}

const countRootComments = (comments: Comment[] = []) => comments.filter(comment => !comment.parent_id).length

export const useFeedStore = defineStore('feed', () => {
  // 注意：所有状态必须定义在 store 内部，模块级 ref 会在 SSR 时跨请求共享
  const userStore = useUserStore()
  const messageStore = useMessageStore()

  const articles = ref<articleData[]>([])
  const page = ref(0)
  const total = ref(0)
  const isLoading = ref(false)
  const hasMore = ref(true)
  const activeTag = ref('')
  const articleLikesMap = ref<Record<number, Liker[]>>({})
  const commentsMap = ref<Record<number, Comment[]>>({})
  const commentPagination = ref<Record<string, CommentPagination>>({})

  const applyArticleMeta = (list: articleData[]) => {
    for (const article of list) {
      if (article.likers) {
        articleLikesMap.value[article.id] = article.likers
      }
      if (article.comments) {
        commentsMap.value[article.id] = article.comments
      }
      // 用聚合返回的评论总数初始化评论分页状态，与初始评论列表保持一致
      const commentTotal = article.comment_total ?? 0
      const loaded = countRootComments(article.comments)
      commentPagination.value[article.id] = {
        page: 1,
        pageSize: 3,
        total: commentTotal,
        hasMore: loaded < commentTotal,
        isLoading: false,
        remaining: Math.max(commentTotal - loaded, 0),
      }
    }
  }

  const resetState = () => {
    articles.value = []
    page.value = 0
    total.value = 0
    hasMore.value = true
    articleLikesMap.value = {}
    commentsMap.value = {}
    commentPagination.value = {}
  }

  /**
   * 用服务端首屏数据填充信息流，避免客户端重复请求。
   * 同时把聚合的点赞人/评论写入对应的 map。
   */
  const hydrateFeed = (payload: FeedPayload, options: { tag?: string } = {}) => {
    resetState()
    articles.value = payload.data ?? []
    total.value = payload.total ?? articles.value.length
    page.value = payload.page ?? 1
    hasMore.value = articles.value.length < total.value
    activeTag.value = options.tag ?? ''
    applyArticleMeta(articles.value)
  }

  const fetchSingleArticle = async (articleId: number) => {
    try {
      const article = articles.value.find(a => a.id === articleId)
      if (!article) {
        const guestId = !userStore.accessToken ? getOrCreateGuestId() : undefined
        const response = await getArticleDetails(articleId, guestId)
        articles.value.push(response.data)
      }
    } catch (error) {
      console.error(`获取文章 ${articleId}失败`, error)
    }
  }

  // 点赞用户列表
  const fetchArticleLikers = async (articleId: number) => {
    try {
      const res = await getArticleLikers(articleId)
      articleLikesMap.value[articleId] = res.data
    } catch (error) {
      console.error(`获取文章 ${articleId} 的点赞人列表失败:`, error)
    }
  }

  const buildArticleParams = (targetPage: number) => {
    const params: Record<string, unknown> = { page: targetPage, pageSize: 5 }
    if (activeTag.value) params.tag = activeTag.value
    return params
  }

  // 加载初始文章
  const fetchInitialArticles = async () => {
    isLoading.value = true
    try {
      const guestId = !userStore.accessToken ? getOrCreateGuestId() : undefined

      const response = await getArticle(buildArticleParams(1), guestId)
      articles.value = response.data.data
      total.value = response.data.total
      applyArticleMeta(articles.value)
      page.value = 1
      hasMore.value = articles.value.length < response.data.total
      return true
    } catch (error) {
      console.error('获取初始文章失败：', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 加载更多文章
  const fetchMoreArticles = async () => {
    if (isLoading.value || !hasMore.value) return { status: 0 }

    isLoading.value = true
    try {
      const nextPage = page.value + 1
      const guestId = !userStore.accessToken ? getOrCreateGuestId() : undefined
      const response = await getArticle(buildArticleParams(nextPage), guestId)

      if (response.data.data.length > 0) {
        const existingIds = new Set(articles.value.map((a: articleData) => a.id))
        const newArticles = response.data.data.filter((a: articleData) => !existingIds.has(a.id))

        articles.value.push(...newArticles)
        applyArticleMeta(newArticles)
        page.value += 1
        total.value = response.data.total
        hasMore.value = articles.value.length < response.data.total
        return { status: 1 }
      }

      hasMore.value = false
      return { status: 0 }
    } catch (error) {
      console.error('获取更多文章失败:', error)
      return { status: 2, error }
    } finally {
      isLoading.value = false
    }
  }

  const setActiveTag = async (tag: string) => {
    activeTag.value = tag
    resetState()
    return fetchInitialArticles()
  }

  const clearActiveTag = async () => {
    activeTag.value = ''
    resetState()
    return fetchInitialArticles()
  }

  // 点赞处理
  const toggleLike = async (articleId: number) => {
    const article = articles.value.find(a => a.id === articleId)
    if (!article) {
      console.error(`未在 Store 中找到 ID 为 ${articleId} 的文章`)
      return false
    }

    // 修改本地状态（乐观更新）
    const originalIsLiked = article.isLiked
    const originalLikeCount = article.like_count

    if (originalIsLiked) {
      article.isLiked = false
      article.like_count--
    } else {
      article.isLiked = true
      article.like_count++
    }

    let messageId: number | undefined
    try {
      if (userStore.accessToken) {
        if (article.isLiked) {
          messageId = messageStore.show('正在点赞', 'loading')
          await likeArticle(articleId)
          messageStore.update(messageId, { text: '点赞成功', type: 'success', duration: 2000 })
        } else {
          messageId = messageStore.show('正在取消点赞', 'loading')
          await dislikeArticle(articleId)
          messageStore.update(messageId, { text: '取消点赞成功', type: 'success', duration: 2000 })
        }
        await fetchArticleLikers(articleId)
        return true
      }

      // 游客
      const guestId = getOrCreateGuestId()
      if (article.isLiked) {
        messageId = messageStore.show('正在点赞', 'loading')
        await likeArticle(articleId, guestId)
        messageStore.update(messageId, { text: '点赞成功', type: 'success', duration: 2000 })
      } else {
        messageId = messageStore.show('正在取消点赞', 'loading', 2000)
        await dislikeArticle(articleId, guestId)
        messageStore.update(messageId, { text: '取消点赞成功', type: 'success', duration: 2000 })
      }
      return true
    } catch (error) {
      console.error(`为文章 ${articleId} 更新点赞状态失败：`, error)
      // 本地状态重置
      article.isLiked = originalIsLiked
      article.like_count = originalLikeCount
      if (messageId !== undefined) {
        const status = getApiError(error).response?.status
        messageStore.update(messageId, {
          text: status === 429 ? '操作过于频繁，请稍后重试' : '操作失败，请稍后重试',
          type: 'error',
          duration: 2000,
        })
      }
      return false
    }
  }

  const appendComment = (articleId: number, newComment: Comment, parentId?: number | string | null) => {
    if (!commentsMap.value[articleId]) {
      commentsMap.value[articleId] = []
    }

    if (!parentId) {
      commentsMap.value[articleId].push({ ...newComment, replies: newComment.replies || [] })
      return
    }

    for (const comment of commentsMap.value[articleId]) {
      if (comment.id === parentId) {
        comment.replies = comment.replies || []
        comment.replies.push(newComment)
        return
      }

      const reply = comment.replies?.find(item => item.id === parentId)
      if (reply) {
        comment.replies = comment.replies || []
        comment.replies.push(newComment)
        return
      }
    }

    commentsMap.value[articleId].push(newComment)
  }

  // 更新 hasMore 状态
  function updateHasMore(articleId: number, commentTotal: number) {
    const state = commentPagination.value[articleId]
    if (!state) return
    const currentLength = countRootComments(commentsMap.value[articleId])
    state.hasMore = currentLength < commentTotal
    state.remaining = Math.max(commentTotal - currentLength, 0)
  }

  // 获取文章初始评论
  const fetchInitialComments = async (articleId: number) => {
    const state = commentPagination.value[articleId]
    if (state?.isLoading || (state?.page ?? 0) > 0) return

    commentPagination.value[articleId] = {
      page: 1,
      pageSize: 3,
      total: 0,
      hasMore: true,
      isLoading: true,
      remaining: 0,
    }
    try {
      const response = await getAllComment(Number(articleId), {
        page: 1,
        pageSize: commentPagination.value[articleId]?.pageSize ?? 3,
      })
      commentsMap.value[articleId] = response.data.data
      const current = commentPagination.value[articleId]
      if (current) current.total = response.data.total
      updateHasMore(Number(articleId), response.data.total)
      return true
    } catch (error) {
      console.error('获取初始评论失败：', error)
      return false
    } finally {
      const current = commentPagination.value[articleId]
      if (current) current.isLoading = false
    }
  }

  // 加载更多文章评论
  const fetchMoreComments = async (articleId: number) => {
    const state = commentPagination.value[articleId]
    if (!state || state.isLoading || !state.hasMore) return

    const current = commentPagination.value[articleId]
    if (!current) return
    current.isLoading = true

    try {
      const nextPage = state.page + 1
      const pageSize = state.pageSize

      const response = await getAllComment(articleId, {
        page: nextPage,
        pageSize,
      })

      if (!commentsMap.value[articleId]) {
        commentsMap.value[articleId] = []
      }

      const existingIds = new Set(commentsMap.value[articleId]?.map(c => c.id))
      const newComments = response.data.data.filter((c: Comment) => !existingIds.has(c.id))

      commentsMap.value[articleId]?.push(...newComments)
      const current = commentPagination.value[articleId]
      if (current) {
        current.page = nextPage
        current.total = response.data.total
      }
      updateHasMore(articleId, response.data.total)
      return true
    } catch (error) {
      console.error('获取更多评论失败：', error)
      return false
    } finally {
      const current = commentPagination.value[articleId]
      if (current) current.isLoading = false
    }
  }

  // 创建评论
  const createComment = async (payload: createCommentData) => {
    try {
      const res = await apiCreateComment(payload)

      if (res.data) {
        const newComment = res.data
        appendComment(payload.articleId, newComment, payload.parentId)
        const state = commentPagination.value[payload.articleId]
        if (state && !payload.parentId) {
          state.total++
          updateHasMore(payload.articleId, state.total)
        }

        const article = articles.value.find(a => a.id === Number(payload.articleId))
        if (article) {
          article.comment_count++
        }
      }
      return true
    } catch (error) {
      console.error('创建评论失败：', error)
      return false
    }
  }

  return {
    articles,
    total,
    page,
    isLoading,
    hasMore,
    activeTag,
    articleLikesMap,
    commentsMap,
    commentPagination,
    hydrateFeed,
    resetState,
    fetchInitialArticles,
    fetchMoreArticles,
    toggleLike,
    fetchInitialComments,
    fetchMoreComments,
    createComment,
    fetchArticleLikers,
    fetchSingleArticle,
    setActiveTag,
    clearActiveTag,
  }
})
