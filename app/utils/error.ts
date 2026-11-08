export type ApiErrorLike = {
  response?: {
    status?: number
    data?: {
      error?: string
      message?: string
    }
  }
}

/** 把 catch 到的 unknown 收敛成可安全读取的 Axios 错误结构 */
export function getApiError(error: unknown): ApiErrorLike {
  return (typeof error === 'object' && error !== null ? error : {}) as ApiErrorLike
}

/** 读取后端返回的错误文案（兼容 error / message 两种字段） */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = getApiError(error).response?.data
  return data?.error || data?.message || fallback
}
