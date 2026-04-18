module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    'vue/setup-compiler-macros': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    './.eslintrc-auto-import.json',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Vue3 + Naive UI 常见写法，允许 v-model:value / v-model:show
    'vue/no-v-model-argument': 'off',
    // Vue3 支持多根节点，关闭 Vue2 时代限制
    'vue/no-multiple-template-root': 'off',
    // 现有页面中存在单词组件名（如 login.vue）
    'vue/multi-word-component-names': 'off',
  },
}
