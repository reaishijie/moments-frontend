/* eslint-disable @typescript-eslint/no-explicit-any -- 测试里需要直接断言 JSON-LD 结构 */
import { describe, expect, it } from 'vitest'
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildProfileJsonLd,
  buildWebsiteJsonLd,
  toPlainText,
} from '~/utils/seo'
import type { articleData } from '~/types/article'

const site = {
  siteName: '瞬刻',
  siteUrl: 'https://example.com',
  description: '测试站点',
  logo: 'https://example.com/logo.png',
}

const article = {
  id: 7,
  user_id: 1,
  nickname: 'nick',
  avatar: '',
  content: '这是一篇用于测试的文章内容',
  type: 0,
  ad_title: '',
  ad_url: '',
  like_count: 3,
  comment_count: 2,
  created_at: '2026-01-02T03:04:05.000Z',
  updated_at: '2026-01-03T03:04:05.000Z',
  user: { id: '1', username: 'admin', nickname: '管理员', avatar: '' },
  article_images: [{ image_url: '/upload/a.png' }],
  article_videos: [],
  tags: [{ id: '1', name: '测试' }],
} as unknown as articleData

describe('SEO JSON-LD', () => {
  it('WebSite 的 SearchAction 指向真实存在的搜索页', () => {
    const data = buildWebsiteJsonLd(site) as any
    expect(data['@type']).toBe('WebSite')
    expect(data.potentialAction.target).toBe('https://example.com/search?q={search_term_string}')
  })

  it('BlogPosting 包含作者、图片、评论与互动数据', () => {
    const data = buildArticleJsonLd(article, site, [
      { content: '第一条评论', created_at: '2026-01-04T00:00:00.000Z', user: { username: 'u1', nickname: '用户一' } },
    ]) as any

    expect(data['@type']).toBe('BlogPosting')
    expect(data.url).toBe('https://example.com/article/7')
    expect(data.author.name).toBe('管理员')
    expect(data.image[0]).toEqual({ '@type': 'ImageObject', url: 'https://example.com/upload/a.png' })
    expect(data.commentCount).toBe(2)
    expect(data.comment[0]['@type']).toBe('Comment')
    expect(data.comment[0].author.name).toBe('用户一')
    expect(data.dateModified).toBe('2026-01-03T03:04:05.000Z')
    expect(data.interactionStatistic).toHaveLength(2)
  })

  it('评论数量最多取 10 条，避免 HTML 过大', () => {
    const comments = Array.from({ length: 25 }, (_, index) => ({
      content: `评论 ${index}`,
      created_at: '2026-01-04T00:00:00.000Z',
      user: { username: `u${index}` },
    }))
    const data = buildArticleJsonLd(article, site, comments) as any
    expect(data.comment).toHaveLength(10)
  })

  it('ProfilePage 指向 Person', () => {
    const data = buildProfileJsonLd({ username: 'admin', nickname: '管理员', avatar: '', brief: '简介' }, site) as any
    expect(data['@type']).toBe('ProfilePage')
    expect(data.mainEntity['@type']).toBe('Person')
    expect(data.mainEntity.url).toBe('https://example.com/home/admin')
  })

  it('BreadcrumbList 位置从 1 递增', () => {
    const data = buildBreadcrumbJsonLd(
      [{ name: '首页', path: '/' }, { name: '内容', path: '/article/7' }],
      'https://example.com',
    ) as any
    expect(data.itemListElement.map((item: any) => item.position)).toEqual([1, 2])
    expect(data.itemListElement[1].item).toBe('https://example.com/article/7')
  })

  it('ItemList 按顺序输出文章链接', () => {
    const data = buildItemListJsonLd([article], 'https://example.com') as any
    expect(data.itemListElement[0].url).toBe('https://example.com/article/7')
  })

  it('toPlainText 压缩空白并截断', () => {
    expect(toPlainText('  a\n\nb  ')).toBe('a b')
    expect(toPlainText('x'.repeat(200), 10)).toBe(`${'x'.repeat(10)}…`)
  })
})
