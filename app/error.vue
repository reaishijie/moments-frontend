<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)

useHead({
  title: isNotFound.value ? '内容不存在 - 瞬刻' : '页面出错了 - 瞬刻',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="not-found">
    <h1>{{ isNotFound ? '404' : '500' }}</h1>
    <p>{{ isNotFound ? '哎呀，页面内容漂走啦～💨' : '服务器开了个小差，请稍后再试。' }}</p>
    <button class="home-link" type="button" @click="goHome">回到首页</button>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  text-align: center;
  background-color: var(--color-bg-notfound);
  color: #0077b6;
  font-family: 'Segoe UI', sans-serif;
}

.not-found h1 {
  font-size: 8rem;
  margin: 0;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
}

.not-found p {
  font-size: 1.5rem;
  margin: 1rem 0;
}

.home-link {
  margin-top: 1rem;
  padding: 0.5rem 1.2rem;
  border: 0;
  background-color: #00b4d8;
  color: white;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.home-link:hover {
  background-color: #0077b6;
}
</style>
