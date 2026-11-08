import axios from 'axios'

const serverApiBase = `${(process.env.NUXT_API_PROXY_TARGET || 'http://127.0.0.1:9889').replace(/\/$/, '')}/api`

// 浏览器端统一走同源代理（Nuxt server/api 转发到 moments-api），避免跨域 Cookie
const service = axios.create({
  baseURL: import.meta.server ? serverApiBase : '/api',
  timeout: 10000,
  withCredentials: true,
})

// 添加请求拦截器
service.interceptors.request.use(
  async (config) => {
    // 请求发送前执行此函数
    // 获取 store 实例
    const { useUserStore } = await import('~/store/user')
    const userStore = useUserStore()
    const accessToken = userStore.accessToken
    // 如果 accessToken 存在，为请求头带上 Authorization
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
      Object.assign(config, { _accessToken: accessToken })
    }
    return config
  },
  (error) => {
    console.error('请求拦截器发送错误：', error)
    return Promise.reject(error)
  },
)

const nonRefreshableAuthPaths = [
  '/auth/login',
  '/auth/login-email',
  '/auth/register',
  '/auth/refresh',
  '/auth/reset-password',
  '/auth/oauth/register-bind',
]

function canRefreshRequest(url?: string) {
  return Boolean(url) && !nonRefreshableAuthPaths.some(path => url === path || url?.startsWith(`${path}?`))
}

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response) {
      if (error.response.status === 401 && originalRequest && !originalRequest._retry && canRefreshRequest(originalRequest.url)) {
        originalRequest._retry = true
        const { useUserStore } = await import('~/store/user')
        const userStore = useUserStore()
        const requestToken = (originalRequest as { _accessToken?: string })._accessToken
        const nextToken = userStore.accessToken && userStore.accessToken !== requestToken
          ? userStore.accessToken
          : await userStore.refreshSession(true)
        if (nextToken) {
          originalRequest.headers.Authorization = `Bearer ${nextToken}`
          return service(originalRequest)
        }
      }

      // 游客访问受保护接口时 refresh 必然失败，这是预期行为，不打印噪音日志
      if (originalRequest?.url === '/auth/refresh') {
        return Promise.reject(error)
      }

      switch (error.response.status) {
        case 401:
          console.error('认证失败')
          break
        case 403:
          console.error('权限不足，无法访问资源。', error)
          break
        case 404:
          console.error('请求的资源并不存在')
          break
        default:
          console.error(`请求错误：\n 状态码： ${error.response.status}, \n 原因： ${error.response.data?.error}`)
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接或后端服务是否正常。')
    } else {
      console.error('请求发送失败：', error.message)
    }
    return Promise.reject(error)
  },
)

export default service
