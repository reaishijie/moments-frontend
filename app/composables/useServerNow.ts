import { useState } from '#imports'

/**
 * 服务端渲染时的“当前时间”。
 *
 * 相对时间（几分钟前 / 几小时前）如果在服务端和客户端各取一次 Date.now()，
 * 遇到 59 分钟 → 1 小时这类边界会出现水合文本不一致。
 * 这里把服务端时间戳随 payload 下发，保证首帧两端完全一致。
 */
export function useServerNow() {
  return useState<number>('server-now', () => Date.now())
}
