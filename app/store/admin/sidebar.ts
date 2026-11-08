import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminNav } from '~/config/adminNav'

export const useSidebarStore = defineStore('sidebar', () => {
  // 后台菜单项（与 app/pages/admin 路由一一对应）
  const arr = adminNav
  // 是否展示菜单内容
  const isShowContent = ref(true)
  return {
    arr,
    isShowContent,
  }
})
