import type { SubAppMountProps } from '@cb/shared'
import { createApp, type App as VueApp } from 'vue'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/es/helper'
import App from './App.vue'

let app: VueApp | null = null

/**
 * 渲染函数：qiankun 环境下挂到主应用传入的容器内，独立运行时挂到本页 #sub-vue-root
 */
function render(props: Partial<SubAppMountProps> = {}) {
  const { container } = props
  app = createApp(App, props)
  app.mount(container ? container.querySelector('#sub-vue-root') : '#sub-vue-root')
}

/**
 * 导出 qiankun 生命周期
 */
renderWithQiankun({
  bootstrap() {
    console.log('[sub-vue] bootstrap —— 仅首次加载执行一次')
  },
  mount(props) {
    console.log('[sub-vue] mount', props)
    render(props as Partial<SubAppMountProps>)
  },
  unmount() {
    console.log('[sub-vue] unmount —— 清理副作用，防止内存泄漏')
    app?.unmount()
    app = null
  },
  update() {
    console.log('[sub-vue] update')
  },
})

// 独立运行（直接访问 http://localhost:7102 调试子应用）
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
