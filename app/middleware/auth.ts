import { useUserStore } from '~/store/user'
import { useMessageStore } from '~/store/message'
export default defineNuxtRouteMiddleware(async () => {
  // 登录后页面均为 CSR，这里只处理浏览器端会话恢复与跳转
  if (import.meta.server) return

  const userStore = useUserStore()

  if (!userStore.profile) {
    await userStore.restoreSession()
  }

  if (userStore.profile) return

  const messageStore = useMessageStore()
  messageStore.show('请先登录账户', 'info', 2000)
  return navigateTo('/')
})
