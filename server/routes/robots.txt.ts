import { fetchSiteConfig, siteBaseUrl } from '../utils/api'

/**
 * robots.txt：禁止抓取后台、接口与需要登录的页面，并声明 sitemap 地址。
 */
export default defineEventHandler(async (event) => {
  const configs = await fetchSiteConfig(event)
  const siteUrl = (configs.site_url?.trim() || siteBaseUrl(event)).replace(/\/$/, '')
  const siteName = configs.sitename?.trim() || '瞬刻'

  const body = `# ${siteName}
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api
Disallow: /profile
Disallow: /post
Disallow: /notifications
Disallow: /article/*/edit

Sitemap: ${siteUrl}/sitemap.xml
`

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return body
})
