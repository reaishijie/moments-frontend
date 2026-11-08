import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { getArticleDetails, likeArticle, dislikeArticle, getArticleLikers as apiGetArticleLikers } from '~/api/articles'
import type { Liker, articleData } from '~/types/article'
import { createComment as apiCreateComment, getAllComment } from '~/api/comments'
import type { Comment, createCommentData } from '~/types/comments'
import { useMessageStore } from './message'
import { useUserStore } from './user'
import { getOrCreateGuestId } from '~/utils/guest'

export const useArticleStore = defineStore('article', () => {
  // 注意：store 实例必须放在 setup 内，模块级调用在 SSR 下会拿不到 active pinia
  const userStore = useUserStore()
  const messageStore = useMessageStore()

  // 数据
  const article = ref<articleData | null>(null)
  const comments = ref<Comment[]>([])
  const likers = ref<Liker[]>([])
  const states = reactive({
    article: false,
    comment: false,
    liker: false,
  })

  /**
   * 用服务端首屏数据填充详情页，避免客户端重复请求。
   */
  const hydrateArticle = (payload: {
    article: articleData
    comments?: Comment[]
    likers?: Liker[]
  }) => {
    article.value = payload.article
    comments.value = payload.comments ?? []
    likers.value = payload.likers ?? []
  }

  // 根据文章 id 获取单篇文章详情
  const fetchArticle = async (articleId: number) => {
    states.article = true
    try {
      const guestId = !userStore.accessToken ? getOrCreateGuestId() : undefined
      const response = await getArticleDetails(articleId, guestId)
      article.value = response.data
    } catch (error) {
      console.error('获取文章内容失败：', error)
      article.value = null
    } finally {
      states.article = false
    }
  }

  // 获取点赞过的用户列表
  const fetchLikers = async (articleId: number) => {
    states.liker = true
    try {
      const res = await apiGetArticleLikers(articleId)
      likers.value = res.data
    } catch (error) {
      console.error(`获取文章 ${articleId} 的点赞用户列表失败`, error)
    } finally {
      states.liker = false
    }
  }

  // 获取评论
  const fetchComments = async (articleId: number) => {
    states.comment = true
    try {
      const response = await getAllComment(articleId, { page: 1, pageSize: 50 })
      comments.value = response.data.data
      return true
    } catch (error) {
      console.error('获取评论失败', error)
      comments.value = []
      return false
    } finally {
      states.comment = false
    }
  }

  const appendComment = (newComment: Comment, parentId?: number | string | null) => {
    if (!parentId) {
      comments.value.push({ ...newComment, replies: newComment.replies || [] })
      return
    }

    for (const comment of comments.value) {
      if (String(comment.id) === String(parentId)) {
        comment.replies = comment.replies || []
        comment.replies.push(newComment)
        return
      }

      const reply = comment.replies?.find(item => String(item.id) === String(parentId))
      if (reply) {
        comment.replies = comment.replies || []
        comment.replies.push(newComment)
        return
      }
    }

    comments.value.push(newComment)
  }

  // 评论文章
  const createComment = async (payload: createCommentData) => {
    const id = messageStore.show('正在发表评论', 'loading')
    try {
      const res = await apiCreateComment(payload)
      if (res.data) {
        const newComment = res.data
        appendComment(newComment, payload.parentId)
        if (article.value) {
          article.value.comment_count++
        }
      }
      messageStore.update(id, { type: 'success', text: '发表成功', duration: 2000 })
      return true
    } catch (error) {
      console.error('发表评论失败', error)
      messageStore.update(id, { type: 'error', text: '发表失败', duration: 2000 })
      return false
    }
  }

  // 点赞、取消点赞
  const toggleLike = async (articleId: number) => {
    if (!article.value) return false

    const originalIsLiked = article.value.isLiked
    const originalLikeCount = article.value.like_count

    // 本地乐观更新
    if (originalIsLiked) {
      article.value.isLiked = false
      article.value.like_count--
    } else {
      article.value.isLiked = true
      article.value.like_count++
    }

    let messageId: number | undefined
    try {
      if (userStore.accessToken) {
        if (article.value.isLiked) {
          messageId = messageStore.show('正在点赞', 'loading')
          await likeArticle(articleId)
          messageStore.update(messageId, { text: '点赞成功', type: 'success', duration: 2000 })
        } else {
          messageId = messageStore.show('正在取消点赞', 'loading')
          await dislikeArticle(articleId)
          messageStore.update(messageId, { text: '取消点赞成功', type: 'success', duration: 2000 })
        }
      } else {
        const guestId = getOrCreateGuestId()
        if (article.value.isLiked) {
          messageId = messageStore.show('正在点赞', 'loading')
          await likeArticle(articleId, guestId)
          messageStore.update(messageId, { text: '点赞成功', type: 'success', duration: 2000 })
        } else {
          messageId = messageStore.show('正在取消点赞', 'loading')
          await dislikeArticle(articleId, guestId)
          messageStore.update(messageId, { text: '取消点赞成功', type: 'success', duration: 2000 })
        }
      }
      return true
    } catch (error) {
      console.error(`为文章${articleId}更新点赞状态失败`, error)
      article.value.isLiked = originalIsLiked
      article.value.like_count = originalLikeCount
      if (messageId !== undefined) {
        messageStore.update(messageId, { text: '操作失败', type: 'error', duration: 2000 })
      }
      return false
    } finally {
      void fetchLikers(articleId)
    }
  }

  return {
    article,
    comments,
    likers,
    states,
    hydrateArticle,
    fetchArticle,
    fetchLikers,
    fetchComments,
    createComment,
    toggleLike,
  }
})
