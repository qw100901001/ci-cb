import type { SubAppMountProps } from '@cb/shared'
import { createRoot, type Root } from 'react-dom/client'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/es/helper'
import App from './App'
import './index.css'

let root: Root | null = null

/**
 * 渲染函数：qiankun 环境下挂到主应用传入的容器内，独立运行时挂到本页 #sub-react-root
 */
function render(props: Partial<SubAppMountProps> = {}) {
  const { container } = props
  const mountNode = container
    ? container.querySelector('#sub-react-root')
    : document.getElementById('sub-react-root')
  if (!mountNode) throw new Error('#sub-react-root 不存在')

  root = createRoot(mountNode)
  root.render(<App {...props} />)
}

/**
 * 导出 qiankun 生命周期（生产 UMD 产物由主应用加载；dev 下由插件以 ESM 方式暴露）
 */
renderWithQiankun({
  bootstrap() {
    console.log('[sub-react] bootstrap —— 仅首次加载执行一次')
  },
  mount(props) {
    console.log('[sub-react] mount', props)
    render(props as Partial<SubAppMountProps>)
  },
  unmount() {
    console.log('[sub-react] unmount —— 清理副作用，防止内存泄漏')
    root?.unmount()
    root = null
  },
  update() {
    console.log('[sub-react] update')
  },
})

// 独立运行（直接访问 http://localhost:7101 调试子应用）
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
