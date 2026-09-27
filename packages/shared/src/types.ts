/**
 * 用户信息（主应用登录态，通过 qiankun props 下发给子应用）
 */
export interface UserInfo {
  id: number
  name: string
  role: 'admin' | 'user'
  token: string
  loginAt: number
}

/**
 * 子应用 -> 主应用 的事件回传（走 qiankun 全局状态）
 */
export interface SubAppEvent {
  from: 'sub-react' | 'sub-vue'
  text: string
  time: number
}

/**
 * 全局状态：initGlobalState 创建，主/子应用共享
 */
export interface GlobalState {
  user: UserInfo | null
  /** 最近一次子应用上报的事件 */
  lastEvent: SubAppEvent | null
}

/**
 * 主应用通过 qiankun props 额外下发给子应用的内容
 */
export interface SubAppExtraProps {
  /** 实时读取主应用 pinia 中的登录态（传函数而非值，保证子应用拿到的是最新数据） */
  getUserInfo: () => UserInfo
}

/**
 * 子应用 mount 生命周期收到的完整 props
 * （container / setGlobalState / onGlobalStateChange 等为 qiankun 内置注入）
 */
export interface SubAppMountProps extends SubAppExtraProps {
  container?: HTMLElement
  name?: string
  setGlobalState: (state: Partial<GlobalState>) => void
  onGlobalStateChange: (
    callback: (state: GlobalState, prev: GlobalState) => void,
    fireImmediately?: boolean,
  ) => void
  offGlobalStateChange: () => boolean
}
