<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
import MessageList from '~/components/MessageList.vue'
import { useUserStore } from '~/store/user'
import { useAuthStore } from '~/store/auth'

// 登录弹窗包含 hCaptcha 与 OAuth 逻辑，默认不显示：
// 用异步组件 + 按需挂载，避免把整块代码打进所有页面的首屏包。
const AuthDialog = defineAsyncComponent(() => import('~/components/user/Auth.vue'))

const userStore = useUserStore()
const authStore = useAuthStore()
const shouldRenderAuth = ref(false)

function hasPendingOAuthResult() {
  if (!import.meta.client) return false
  try {
    return !!sessionStorage.getItem('moments_oauth_result')
  } catch {
    return false
  }
}

onMounted(() => {
  // 只在浏览器端恢复会话：Access Token 保存在内存，Refresh Token 在 HttpOnly Cookie
  void userStore.restoreSession()
  // OAuth 回跳时需要在页面加载后消费 sessionStorage 里的结果
  shouldRenderAuth.value = authStore.isShow || hasPendingOAuthResult()
})

watch(
  () => authStore.isShow,
  (visible) => {
    if (visible) shouldRenderAuth.value = true
  },
)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <MessageList />
  <AuthDialog v-if="shouldRenderAuth" />
</template>
