import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

export default defineConfig(({ mode }) => ({
  // 生产环境部署在同域 /sub-vue/ 路径下
  base: mode === 'production' ? '/sub-vue/' : '/',
  plugins: [
    vue(),
    // name 与主应用注册清单保持一致
    qiankun('sub-vue', { useDevMode: true }),
  ],
  server: {
    port: 7102,
    cors: true,
    origin: 'http://localhost:7102',
  },
}))
