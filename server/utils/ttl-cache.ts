type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

/**
 * 极简进程内 TTL 缓存。
 *
 * 用于 sitemap / RSS / 站点配置这类「读多写少、允许短暂延迟」的数据：
 * - 命中时直接返回，避免每次请求都回源 moments-api
 * - 并发请求共享同一个 Promise，避免缓存击穿
 */
export function cachedValue<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = store.get(key) as CacheEntry<T> | undefined

  if (hit && hit.expiresAt > now) {
    return Promise.resolve(hit.value)
  }

  const pending = inflight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const promise = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs })
      return value
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

/** 主动失效某个缓存（例如后台保存配置后立即刷新） */
export function invalidateCache(key: string) {
  store.delete(key)
  inflight.delete(key)
}

/** 仅用于测试/诊断 */
export function cacheSize() {
  return store.size
}
