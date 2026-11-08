<script setup lang="ts">
import { ChevronLeft } from '@vicons/fa'
import Icon from '~/components/utils/VIcon.vue'

/**
 * 统一的返回按钮。
 *
 * - 透明背景、无边框，悬浮时只改变图标颜色
 * - 没有可返回的历史记录时（例如直接打开链接）回退到 fallback（默认首页）
 */
const props = withDefaults(defineProps<{
  blurred?: boolean
  fallback?: string
}>(), {
  blurred: false,
  fallback: '/',
})

const router = useRouter()

function goBack() {
  if (router.options.history.state.back) {
    router.back()
    return
  }
  void router.push(props.fallback)
}
</script>

<template>
  <button type="button" class="back-button" aria-label="返回" title="返回" @click="goBack">
    <Icon class="back-icon" :class="{ blurred }">
      <ChevronLeft />
    </Icon>
  </button>
</template>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.back-icon {
  font-size: 20px;
  color: #EEE9E9;
}

.back-icon:hover {
  color: #C8C2C2;
}

.back-icon.blurred {
  color: #898888;
}

.back-icon.blurred:hover {
  color: #5f5e5e;
}

.back-button:focus-visible {
  outline: 2px solid #6cadf1;
  outline-offset: 2px;
  border-radius: 8px;
}
</style>
