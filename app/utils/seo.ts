import type { articleData } from '~/types/article'
import type { userData } from '~/types/user'

/** 把正文压成一段适合做 description / headline 的纯文本 */
export function toPlainText(content?: string, limit = 120) {
  const text = (content || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}…`
}

type SiteInfo = {
  siteName: string
  siteUrl: string
  description?: string
  logo?: string
}

export function buildWebsiteJsonLd(site: SiteInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.siteName,
    alternateName: site.siteName,
    url: site.siteUrl,
    description: site.description,
    inLanguage: 'zh-CN',
    publisher: {
      '@type': 'Organization',
      name: site.siteName,
      url: site.siteUrl,
      logo: site.logo ? { '@type': 'ImageObject', url: site.logo } : undefined,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${site.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildArticleJsonLd(
  article: articleData,
  site: SiteInfo,
  comments: Array<{
    content: string
    created_at: string
    user?: { nickname?: string | null; username?: string } | null
  }> = [],
) {
  const url = `${site.siteUrl}/article/${article.id}`
  const images = (article.article_images || [])
    .map(image => image.image_url)
    .filter(Boolean)
    .map(url => (/^https?:\/\//i.test(url) ? url : `${site.siteUrl}${url.startsWith('/') ? '' : '/'}${url}`))

  const authorName = article.user?.nickname || article.user?.username || '匿名用户'
  const authorUrl = article.user?.username ? `${site.siteUrl}/home/${article.user.username}` : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: toPlainText(article.content, 110) || `内容 ${article.id}`,
    description: toPlainText(article.content, 200),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    inLanguage: 'zh-CN',
    image: images.length > 0
      ? images.map(url => ({ '@type': 'ImageObject', url }))
      : undefined,
    commentCount: article.comment_count ?? 0,
    comment: comments.slice(0, 10).map(comment => ({
      '@type': 'Comment',
      text: toPlainText(comment.content, 300),
      dateCreated: comment.created_at,
      author: {
        '@type': 'Person',
        name: comment.user?.nickname || comment.user?.username || '匿名用户',
      },
    })),
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: site.siteName,
      url: site.siteUrl,
      logo: site.logo ? { '@type': 'ImageObject', url: site.logo } : undefined,
    },
    interactionStatistic: [
      {
        '@type': 'LikeAction',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: article.like_count ?? 0,
      },
      {
        '@type': 'CommentAction',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: article.comment_count ?? 0,
      },
    ],
  }
}

export function buildProfileJsonLd(user: Pick<userData, 'username' | 'nickname' | 'avatar' | 'brief'>, site: SiteInfo) {
  const url = `${site.siteUrl}/home/${user.username}`
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    inLanguage: 'zh-CN',
    mainEntity: {
      '@type': 'Person',
      name: user.nickname || user.username,
      alternateName: user.username,
      description: user.brief || undefined,
      image: user.avatar || undefined,
      url,
      worksFor: { '@type': 'Organization', name: site.siteName, url: site.siteUrl },
    },
  }
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  }
}

export function buildItemListJsonLd(articles: articleData[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/article/${article.id}`,
      name: toPlainText(article.content, 60) || `内容 ${article.id}`,
    })),
  }
}
