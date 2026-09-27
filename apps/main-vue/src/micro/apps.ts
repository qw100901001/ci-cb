/**
 * 微应用注册清单
 * dev：entry 指向子应用 dev server（qiankun 通过 fetch 抓取 entry HTML）
 * prod：entry 指向同域 nginx 静态目录（无需跨域）
 */
const isDev = import.meta.env.DEV

export interface MicroAppConfig {
  name: string
  entry: string
  container: string
  activeRule: string
}

export const microApps: MicroAppConfig[] = [
  {
    name: 'sub-react',
    entry: isDev ? '//localhost:7101' : '/sub-react/',
    container: '#subapp-viewport',
    activeRule: '/sub-react',
  },
  {
    name: 'sub-vue',
    entry: isDev ? '//localhost:7102' : '/sub-vue/',
    container: '#subapp-viewport',
    activeRule: '/sub-vue',
  },
]
