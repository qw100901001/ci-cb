import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupMicroApps } from './micro'

async function bootstrap() {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  // 必须等初始路由解析完成再挂载：路由组件是懒加载的，
  // 直接刷新 /sub-* 时若立即 start()，qiankun 会找不到 #subapp-viewport
  await router.isReady()
  app.mount('#app')

  // 基座挂载完成后注册并启动微应用
  setupMicroApps()
}

bootstrap()
