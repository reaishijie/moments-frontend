import { nanoid } from 'nanoid'

export const GUEST_ID_COOKIE = 'moments_guest_id'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const row = document.cookie.split('; ').find(item => item.startsWith(`${name}=`))
  return row ? decodeURIComponent(row.slice(name.length + 1)) : null
}

/**
 * 游客标识：用于未登录用户的点赞记录。
 *
 * 存在 Cookie 里而不是 localStorage，服务端渲染时可以读取并透传给 moments-api，
 * 首屏就能拿到正确的 isLiked 状态，避免水合后再刷新。
 */
export function getOrCreateGuestId(): string {
  if (!import.meta.client) return ''

  const existing = readCookie(GUEST_ID_COOKIE)
  if (existing) return existing

  const guestId = nanoid()
  document.cookie = `${GUEST_ID_COOKIE}=${guestId}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  return guestId
}
