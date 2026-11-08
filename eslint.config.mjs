// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

/**
 * 迁移自旧的 Vue SPA，存量代码里有较多 `any` 与 v-html 用法：
 * - v-html 的内容全部经过 utils/sanitizeHtml 白名单过滤
 * - any 统一降级为 warning，避免一次性重写业务逻辑
 */
export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    // Vue 3 支持多根节点（布局需要同时渲染 Func / 容器 / 角标）
    'vue/no-multiple-template-root': 'off',
    // 模板风格由编辑器统一，不做强制
    'vue/html-self-closing': 'off',
    'vue/attributes-order': 'off',
    // 页脚 / 角标 HTML 已经过白名单过滤
    'vue/no-v-html': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-function-type': 'off',
  },
})
