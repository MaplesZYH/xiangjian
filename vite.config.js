import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import autoprefixer from 'autoprefixer'
import postcssPxtorem from 'postcss-pxtorem'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
          ],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://116.198.38.236:8080',
        changeOrigin: true,
        rewrite: (pathValue) => pathValue.replace(/^\/api/, ''),
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        postcssPxtorem({
          rootValue: 16,
          unitPrecision: 3,
          propList: ['*', '!border*', '!box-shadow'],
          selectorBlackList: [/^html$/],
          replace: true,
          mediaQuery: false,
          minPixelValue: 1,
          exclude: [/node_modules/],
        }),
      ],
    },
  },
})
