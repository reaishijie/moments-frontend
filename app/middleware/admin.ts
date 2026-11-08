import { useUserStore } from '~/store/user'
export default defineNuxtRouteMiddleware(async () => {
  // 后台路由为纯客户端渲染，先恢复会话再判断管理员身份
  if (import.meta.server) return

  const userStore = useUserStore()

  if (!userStore.profile) {
    await userStore.restoreSession()
  }

  if (Number(userStore.profile?.role) === 1) return

  return navigateTo('/')
})
