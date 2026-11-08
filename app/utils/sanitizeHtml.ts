import { computed } from 'vue'

const ALLOWED_TAGS = new Set([
  'a',
  'br',
  'div',
  'em',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'small',
  'span',
  'strong',
  'ul',
])

const GLOBAL_ATTRS = new Set(['class', 'title', 'aria-label'])
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
}

function isSafeUrl(value: string) {
  // eslint-disable-next-line no-control-regex -- 需要剔除 URL 里的控制字符再判断协议
  const url = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '')
  return !/^(javascript|vbscript|data):/i.test(url)
}

function sanitizeAttrs(tagName: string, rawAttrs: string) {
  const allowed = TAG_ATTRS[tagName]
  const result: Array<[string, string]> = []

  const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g
  let match: RegExpExecArray | null
  while ((match = attrPattern.exec(rawAttrs))) {
    const name = (match[1] ?? '').toLowerCase()
    const value = match[3] ?? match[4] ?? match[5] ?? ''
    const isAllowed = GLOBAL_ATTRS.has(name) || allowed?.has(name)
    if (!isAllowed || name.startsWith('on')) continue
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue
    result.push([name, value])
  }

  // 站内/站外链接统一补上安全属性
  if (tagName === 'a') {
    const target = result.find(([name]) => name === 'target')
    const hasRel = result.some(([name]) => name === 'rel')
    if (target?.[1] === '_blank' && !hasRel) {
      result.push(['rel', 'noopener noreferrer'])
    }
  }

  return result
    .map(([name, value]) => ` ${name}="${value.replace(/"/g, '&quot;')}"`)
    .join('')
}

/**
 * 同构的 HTML 白名单过滤：后台配置的页脚 / 左右角标允许少量 HTML，
 * 服务端与客户端使用同一套规则，避免 v-html 造成水合不一致。
 */
export function sanitizeHtml(html?: string) {
  if (!html || typeof html !== 'string') return ''

  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*\/?\s*([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)\s*\/?>/g, (_match, rawTag, rawAttrs) => {
      const tagName = String(rawTag).toLowerCase()
      if (!ALLOWED_TAGS.has(tagName)) return ''
      if (/^<\s*\//.test(_match)) return `</${tagName}>`
      return `<${tagName}${sanitizeAttrs(tagName, String(rawAttrs || ''))}>`
    })
}

// 供需要响应式重新计算的场景使用
export function useSanitizedHtml(source: () => string | undefined) {
  return computed(() => sanitizeHtml(source()))
}
