import { useThemeStore } from '~/store/theme'

import type { ThemeMode } from '~/store/theme'

const THEME_COOKIE = 'moments_theme'

/**
 * 主题：服务端从 Cookie 读取，直接输出到 <html class>，避免深色模式闪白。
 */
export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore()
  const cookie = useCookie<ThemeMode | null>(THEME_COOKIE, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  if (cookie.value === 'dark' || cookie.value === 'light') {
    themeStore.setTheme(cookie.value)
  } else if (import.meta.client) {
    themeStore.setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }

  useHead({
    htmlAttrs: {
      class: computed(() => (themeStore.currentTheme === 'dark' ? 'dark-mode' : 'light-mode')),
    },
    meta: [
      {
        name: 'theme-color',
        content: computed(() => (themeStore.currentTheme === 'dark' ? '#191919' : '#ffffff')),
      },
    ],
  })

  watch(
    () => themeStore.currentTheme,
    (theme) => {
      cookie.value = theme
      if (!import.meta.client) return
      document.body.classList.remove('light-mode', 'dark-mode')
      document.body.classList.add(theme === 'dark' ? 'dark-mode' : 'light-mode')
    },
    { immediate: true },
  )
})
