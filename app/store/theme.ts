import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeMode>('light')

  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme
  }

  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  const defaultOutsideBgColor = computed(() => {
    return currentTheme.value === 'dark' ? '#0a0a0a' : '#f0f0f0'
    // 这些值应该与 main.css 中的 --color-bg-outside 变量对应
  })

  return {
    currentTheme,
    setTheme,
    toggleTheme,
    defaultOutsideBgColor,
  }
})
