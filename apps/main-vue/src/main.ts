import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupMicroApps } from './micro'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

// 基座挂载完成后注册并启动微应用
setupMicroApps()
