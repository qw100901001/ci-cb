import type { SubAppMountProps } from '@cb/shared'
import { formatDate } from '@cb/shared'
import { useState } from 'react'
import { qiankunWindow } from 'vite-plugin-qiankun/es/helper'

export default function App(props: Partial<SubAppMountProps>) {
  const [count, setCount] = useState(0)
  const poweredByQiankun = Boolean(qiankunWindow.__POWERED_BY_QIANKUN__)

  // 主应用通过 props 下发的 getUserInfo：每次渲染实时读取主应用 pinia
  const user = props.getUserInfo?.()

  return (
    <div className="subapp">
      <section className="card">
        <h2>⚛️ React 子应用</h2>
        <p className="mode">
          运行模式：
          <span className={poweredByQiankun ? 'tag ok' : 'tag'}>
            {poweredByQiankun ? 'qiankun 沙箱内' : '独立运行'}
          </span>
        </p>

        <div className="counter">
          <button onClick={() => setCount((c) => c - 1)}>-</button>
          <span className="num">{count}</span>
          <button onClick={() => setCount((c) => c + 1)}>+</button>
        </div>
        <p className="hint">组件状态在 unmount 后销毁，重新挂载时回到 0（沙箱隔离的效果之一）</p>
      </section>

      <div className="grid">
        <section className="card">
          <h3>主应用下发的登录态（props.getUserInfo）</h3>
          {user ? (
            <dl className="kv">
              <dt>用户</dt>
              <dd>{user.name}</dd>
              <dt>角色</dt>
              <dd>{user.role}</dd>
              <dt>Token</dt>
              <dd>
                <code>{user.token}</code>
              </dd>
              <dt>登录时间</dt>
              <dd>{formatDate(user.loginAt)}</dd>
            </dl>
          ) : (
            <p className="hint">独立运行模式，没有主应用下发的用户信息</p>
          )}
        </section>

        <section className="card">
          <h3>向主应用上报事件（setGlobalState）</h3>
          <p className="hint">点击后回到基座首页，可以在「子应用事件日志」中看到这条消息</p>
          <button
            className="btn primary"
            onClick={() =>
              props.setGlobalState?.({
                lastEvent: {
                  from: 'sub-react',
                  text: `React 子应用按钮被点了 ${count + 1} 次后发来问候`,
                  time: Date.now(),
                },
              })
            }
          >
            通知主应用
          </button>
        </section>
      </div>
    </div>
  )
}
