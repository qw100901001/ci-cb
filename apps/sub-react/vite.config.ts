import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

export default defineConfig(({ mode }) => ({
  // 生产环境部署在同域 /sub-react/ 路径下，静态资源前缀必须与之匹配
  base: mode === 'production' ? '/sub-react/' : '/',
  plugins: [
    react(),
    // name 必须与主应用 registerMicroApps 中注册的 name 完全一致
    qiankun('sub-react', { useDevMode: true }),
  ],
  server: {
    port: 7101,
    // qiankun 通过 fetch 抓取子应用 entry HTML，dev 下必须开 CORS 并修正资源绝对路径
    cors: true,
    origin: 'http://localhost:7101',
  },
}))
