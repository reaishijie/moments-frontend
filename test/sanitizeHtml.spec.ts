import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '~/utils/sanitizeHtml'

describe('sanitizeHtml', () => {
  it('空值返回空字符串', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
  })

  it('保留白名单标签', () => {
    expect(sanitizeHtml('<p>hello <strong>world</strong></p>'))
      .toBe('<p>hello <strong>world</strong></p>')
  })

  it('移除不在白名单的标签', () => {
    expect(sanitizeHtml('<div><section>hi</section></div>')).toBe('<div>hi</div>')
    expect(sanitizeHtml('<iframe src="https://x"></iframe>')).toBe('')
  })

  it('移除事件属性', () => {
    expect(sanitizeHtml('<img src="/a.png" onerror="alert(1)">'))
      .toBe('<img src="/a.png">')
  })

  it('移除 javascript: 协议', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
  })

  it('为 target=_blank 的链接补 rel', () => {
    expect(sanitizeHtml('<a href="https://example.com" target="_blank">x</a>'))
      .toBe('<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>')
  })

  it('保留 class 与 title', () => {
    expect(sanitizeHtml('<span class="a" title="b">x</span>'))
      .toBe('<span class="a" title="b">x</span>')
  })
})
