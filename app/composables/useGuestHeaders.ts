import { GUEST_ID_COOKIE } from '~/utils/guest'

/**
 * 服务端渲染时把游客标识透传给 moments-api，
 * 让首屏的 isLiked / 点赞人列表与浏览器端保持一致。
 */
export function useGuestHeaders(): Record<string, string> {
  const cookie = useCookie<string | null>(GUEST_ID_COOKIE, { path: '/' })
  return cookie.value ? { 'x-guest-id': cookie.value } : {}
}
