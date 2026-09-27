import type { GlobalState } from '@cb/shared'
import { initGlobalState, registerMicroApps, start } from 'qiankun'
import { useUserStore } from '../stores/user'
import { microApps } from './apps'

/**
 * 全局状态：主/子应用共享的通信通道
 * 主 -> 子：props 下发（getUserInfo 实时读 pinia）
 * 子 -> 主：setGlobalState 上报事件
 */
export const { onGlobalStateChange, setGlobalState, offGlobalStateChange } = initGlobalState({
  user: null,
  lastEvent: null,
} as GlobalState)

export function setupMicroApps() {
  const userStore = useUserStore()

  registerMicroApps(
    microApps.map((app) => ({
      ...app,
      props: {
        // 传函数而不是值：子应用每次调用时实时读取 pinia，避免挂载后主应用状态更新不同步
        getUserInfo: () => userStore.userInfo,
      },
    })),
  )

  start({ prefetch: 'all' })
}
