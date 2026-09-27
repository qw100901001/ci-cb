import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

export default defineConfig(({ mode }) => ({
  // 生产环境部署在同域 /sub-react/ 路径下，静态资源前缀必须与之匹配
  base: mode === 'production' ? '/sub-react/' : '/',
  plugins: [
    // ⚠️ dev 模式不能用 @vitejs/plugin-react：它注入的 react-refresh preamble 是
    // type="module" 脚本，qiankun(import-html-entry) 用 eval 执行子应用脚本时
    // 会报 "Cannot use import statement outside a module"，导致 bootstrap 超时、
    // 页面卡在"子应用加载中"。dev 下交给 Vite 原生 esbuild 处理 JSX（无 fast refresh，
    // 微前端 demo 可接受）；生产构建不受影响
    ...(mode === 'production' ? [react()] : []),
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
