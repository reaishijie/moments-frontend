<script setup lang="ts" name="VIcon">
import { computed } from 'vue'

/**
 * 轻量图标容器，替代 @vicons/utils 的 Icon。
 *
 * 后者依赖 css-render，在模块加载阶段就会访问 window，导致 Nuxt SSR 直接崩溃。
 * 这里保持与原组件一致的行为：
 * - 只有显式传入 size 时才写内联 font-size，否则沿用父级 CSS（如 `.icon { font-size: 20px }`）
 * - 支持 size / color / tag，svg 固定 1em，跟随 font-size 缩放
 */
const props = withDefaults(defineProps<{
  size?: string | number
  color?: string
  tag?: string
}>(), {
  size: undefined,
  color: undefined,
  tag: 'i',
})

const mergedSize = computed(() => {
  const size = props.size
  if (size === undefined) return undefined
  if (typeof size === 'number' || /^\d+$/.test(String(size))) return `${size}px`
  return size
})
</script>

<template>
  <component :is="tag" class="v-icon" :style="{ color, fontSize: mergedSize }">
    <slot />
  </component>
</template>

<style>
/* 与原 @xicons/utils 的 .xicon 保持一致 */
.v-icon {
  display: inline-flex;
  width: 1em;
  height: 1em;
}

.v-icon svg {
  width: 1em;
  height: 1em;
}

.v-icon svg:not([fill]) {
  fill: currentColor;
}
</style>
