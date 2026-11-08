export type AdminNavItem = {
  path: string
  meta: { title: string }
  children?: AdminNavItem[]
}

/**
 * 后台导航配置。
 *
 * 与 app/pages/admin 下的路由文件一一对应，集中维护菜单标题与层级，
 * 侧边栏与顶部面包屑都从这里派生，避免两处各写一份。
 */
export const adminNav: AdminNavItem[] = [
  { path: '/admin', meta: { title: '控制台' } },
  {
    path: '/admin/setting',
    meta: { title: '系统设置' },
    children: [
      { path: '/admin/setting/basic', meta: { title: '基础设置' } },
      { path: '/admin/setting/user', meta: { title: '用户设置' } },
      { path: '/admin/setting/email', meta: { title: '邮箱配置' } },
      { path: '/admin/setting/verify', meta: { title: '验证设置' } },
      { path: '/admin/setting/upload', meta: { title: '上传设置' } },
      { path: '/admin/setting/oauth', meta: { title: 'OAuth 登录' } },
      { path: '/admin/setting/other', meta: { title: '其他设置' } },
    ],
  },
  { path: '/admin/user', meta: { title: '用户管理' } },
  { path: '/admin/article', meta: { title: '文章管理' } },
  { path: '/admin/comment', meta: { title: '评论管理' } },
  { path: '/admin/link', meta: { title: '友链管理' } },
]

/** 返回当前路径对应的导航链路（用于面包屑与页面标题） */
export function findAdminNavTrail(path: string): AdminNavItem[] {
  for (const item of adminNav) {
    if (item.path === path) return [item]
    const child = item.children?.find(sub => sub.path === path)
    if (child) return [item, child]
  }

  // 未知路径时退回最长前缀匹配，避免标题闪烁
  const flat = adminNav.flatMap(item => [item, ...(item.children ?? [])])
  const matched = flat
    .filter(item => path.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  return matched ? [matched] : []
}
