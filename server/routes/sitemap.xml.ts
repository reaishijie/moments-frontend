import { apiFetch, escapeXml, fetchSiteConfig, siteBaseUrl } from '../utils/api'
import type { SitemapPayload } from '../utils/api'
import { cachedValue } from '../utils/ttl-cache'

/**
 * 动态 sitemap：首页 / 友链 / 文章详情 / 用户主页 / 标签页。
 *
 * 文章与用户数据由 moments-api 的 /api/sitemap 提供，
 * 保证新发布内容无需重新构建即可被收录。
 */
export default defineEventHandler(async (event) => {
  const configs = await fetchSiteConfig(event)
  const siteUrl = (configs.site_url?.trim() || siteBaseUrl(event)).replace(/\/$/, '')

  // 10 分钟内复用同一份索引，避免爬虫高频请求时反复全量查询数据库
  const payload = await cachedValue<SitemapPayload>('sitemap-data', 600_000, async () => {
    try {
      return await apiFetch<SitemapPayload>(event, '/sitemap')
    } catch (error) {
      console.error('生成 sitemap 时获取数据失败：', error)
      return { articles: [], users: [], tags: [] }
    }
  })

  const urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }> = [
    { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/links`, changefreq: 'weekly', priority: '0.6' },
  ]

  for (const article of payload.articles ?? []) {
    urls.push({
      loc: `${siteUrl}/article/${article.id}`,
      lastmod: article.updated_at ? new Date(article.updated_at).toISOString() : undefined,
      changefreq: 'weekly',
      priority: '0.8',
    })
  }

  for (const user of payload.users ?? []) {
    urls.push({
      loc: `${siteUrl}/home/${encodeURIComponent(user.username)}`,
      lastmod: user.updated_at ? new Date(user.updated_at).toISOString() : undefined,
      changefreq: 'weekly',
      priority: '0.6',
    })
  }

  for (const tag of payload.tags ?? []) {
    urls.push({
      loc: `${siteUrl}/?tag=${encodeURIComponent(tag.name)}`,
      changefreq: 'weekly',
      priority: '0.5',
    })
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}${url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority ? `\n    <priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>
`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=600, s-maxage=600')
  return body
})
