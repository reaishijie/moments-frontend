import { apiFetch, escapeXml, fetchSiteConfig, siteBaseUrl, toPlainText } from '../utils/api'
import { cachedValue } from '../utils/ttl-cache'

type ArticleItem = {
  id: string
  content: string
  created_at: string
  updated_at?: string
  user?: { username?: string; nickname?: string }
  article_images?: Array<{ image_url: string }>
}

/**
 * RSS 2.0 订阅源：取最新 50 篇已发布内容。
 */
export default defineEventHandler(async (event) => {
  const configs = await fetchSiteConfig(event)
  const siteUrl = (configs.site_url?.trim() || siteBaseUrl(event)).replace(/\/$/, '')
  const siteName = configs.sitename?.trim() || '瞬刻'
  const siteDescription = configs.site_description?.trim() || configs.site_brief?.trim() || '一个可以发布笔记、图片、视频的内容平台'

  // 10 分钟缓存：RSS 阅读器与爬虫的请求频率远高于内容更新频率
  const articles = await cachedValue<ArticleItem[]>('rss-articles', 600_000, async () => {
    try {
      const response = await apiFetch<{ data: ArticleItem[] }>(event, '/articles', { page: 1, pageSize: 50 })
      return response.data ?? []
    } catch (error) {
      console.error('生成 RSS 时获取文章失败：', error)
      return []
    }
  })

  const items = articles.map((article) => {
    const link = `${siteUrl}/article/${article.id}`
    const title = toPlainText(article.content, 60) || `内容 ${article.id}`
    const description = toPlainText(article.content, 300)
    const author = article.user?.nickname || article.user?.username || siteName
    const pubDate = new Date(article.created_at).toUTCString()
    const enclosure = article.article_images?.[0]?.image_url

    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      <author>${escapeXml(author)}</author>
      <pubDate>${pubDate}</pubDate>${enclosure ? `\n      <enclosure url="${escapeXml(enclosure)}" type="image/jpeg" />` : ''}
    </item>`
  }).join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=600, s-maxage=600')
  return body
})
