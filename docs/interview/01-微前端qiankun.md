# 01 · 微前端 & qiankun 面试题

## Q1：什么是微前端？什么场景下用？

**答**：把微服务思想搬到前端——把一个大型应用拆成多个可**独立开发、独立构建、独立部署**的小应用，在运行时组合成一个整体。

适用信号：
- 多团队并行开发、技术栈不统一（本仓库就是 React/Vue 共存的最小案例）；
- 巨石应用迭代慢，想按模块逐步重构/替换；
- 需要聚合多个已有系统成一个门户。

不适用：小团队单技术栈——引入微前端只会增加复杂度。**微前端是组织架构问题的技术解，不是炫技手段**。

## Q2：qiankun 的整体原理是什么？

**答**：qiankun = single-spa（路由劫持 + 应用生命周期编排）+ import-html-entry（HTML Entry 加载）+ 自己实现的沙箱与通信。

加载流程（对着本仓库讲）：
1. 主应用 `registerMicroApps` 注册 `name/entry/activeRule/container`（`apps/main-vue/src/micro/apps.ts`）；
2. `start()` 后监听路由变化（popstate/pushState 劫持），URL 命中某应用的 `activeRule` 时激活；
3. 通过 `import-html-entry` **fetch 子应用 entry HTML**，解析出内联/外链的 JS 和 CSS；
4. 把样式和脚本包装后在**沙箱（Proxy 代理的 fakeWindow）**里执行，拿到子应用暴露的 `bootstrap/mount/unmount` 生命周期；
5. 匹配 `container` 选择器，把子应用的 DOM 结构插进去。

## Q3：为什么是 HTML Entry 而不是 JS Entry？

**答**：
- **JS Entry**（single-spa 原生方式）：主应用直接加载子应用一个 JS bundle。缺点：子应用必须把资源打到一个文件、资源路径必须写死（publicPath），构建侵入性强。
- **HTML Entry**：主应用抓取子应用的 index.html，自动从中提取所有 script/link。优点：**子应用照常构建**，不用关心资源清单；资源相对路径天然正确。缺点：多一次 HTML 请求。

一句话：HTML Entry 让子应用的接入成本趋近于零。

## Q4：qiankun 的 JS 沙箱怎么实现？（高频）

**答**：三代实现，都在 `with(proxy){}` 包裹里执行子应用脚本，让子应用所有的全局读写都打到代理上：

| 沙箱 | 适用 | 原理 |
| --- | --- | --- |
| SnapshotSandbox | 不支持 Proxy 的环境（降级） | 激活时拍快照，失活时 diff 还原。同一时刻只能一个应用 |
| LegacySandbox（单例） | 单实例场景 | 一个 Proxy，记录新增/修改，卸载时还原 window |
| ProxySandbox（多例，默认） | 多实例并存 | **每个子应用一个 fakeWindow**，属性写在 fakeWindow 上，查不到才透传真 window；互相不可见 |

ProxySandbox 关键伪代码：
```js
const fakeWindow = {}
const proxy = new Proxy(fakeWindow, {
  get(target, key) {
    return key in target ? target[key] : window[key] // 自己优先，否则透传
  },
  set(target, key, value) {
    target[key] = value  // 永远写在自己身上，不污染全局
    return true
  },
})
```
本仓库里两个子应用可以同时激活（都挂过），用的就是 ProxySandbox。

## Q5：样式隔离怎么做？

**答**：qiankun 提供两个配置，但都有局限：
- `strictStyleIsolation: true` —— Shadow DOM 真隔离。但弹窗类组件（Portal 到 body）样式会挂掉，一般不能用；
- `experimentalStyleIsolation: true` —— 给子应用选择器加 `div[data-qiankun="app-name"]` 前缀（类似 scoped）。对 `body {}` 这类全局选择器无效。

工程实践：**约定优先于配置**——子应用自身用 CSS Modules/scoped，全局样式收敛到设计系统，主应用别写全局污染样式。本仓库子应用全部 scoped，就是靠规范做软隔离。

## Q6：主子应用通信有哪几种方式？本项目怎么选的？

**答**：
1. **props 下发**（主→子）：注册时配 `props`，mount 时注入。适合"登录态、配置"这类主应用主导的数据。
2. **initGlobalState 全局状态**（双向）：发布订阅模式，`setGlobalState/onGlobalStateChange`，本质是 qiankun 维护的一棵观察者树。适合事件通知类通信。
3. **CustomEvent / localStorage / 共享 npm 包（自己写 EventEmitter）**：脱离 qiankun 的通用方案，甚至能跨技术栈复用。

**本项目的设计**（`apps/main-vue/src/micro/index.ts`）：
- 主→子（登录态）：props 传 **getter 函数** 而不是值——`getUserInfo: () => userStore.userInfo`，保证子应用每次调用都拿到 pinia 最新值，规避"挂载后主应用更新不同步"；
- 子→主（事件上报）：`setGlobalState({ lastEvent })`，基座首页监听并展示事件日志。

## Q7：子应用有哪些生命周期？分别什么时候执行？

**答**：
- `bootstrap`：首次加载执行一次（一般空着）；
- `mount(props)`：每次激活执行，在这里渲染；props 里带 `container`（挂载容器）和主应用注入的数据/方法；
- `unmount`：失活执行，**必须清理**（unmount 组件、解绑事件、清定时器），否则内存泄漏 + 下次挂载冲突；
- `update`：仅当用 loadMicroApp 手动挂载且 props 变化时触发。

对应 `apps/sub-vue/src/main.ts`：`renderWithQiankun({...})` 导出四个钩子，同时判断 `__POWERED_BY_QIANKUN__` 支持独立运行调试。

## Q8：Vite 子应用为什么不能直接接入 qiankun？

**答**：qiankun 的脚本执行依赖（编译期的）UMD 产物——它要在沙箱里拿到子应用挂到全局的生命周期对象。而 Vite：
1. dev 模式产物是**原生 ESM**，`import` 语法无法直接在被 `with(proxy)` 包裹的 eval 里执行（import 不受 with 影响，且会逃逸沙箱）；
2. Vite 也不默认支持输出 UMD。

**解法**（本仓库用 `vite-plugin-qiankun`）：
- dev：插件把入口改成 `System.import` 风格（systemjs 格式可以被劫持执行），并把生命周期挂到 `window.proxy`；
- prod：构建时在 HTML 注入一段内联脚本，把 ESM 动态 import 的结果包装成 `window['sub-react'] = { bootstrap, mount, ... }`（可用 `apps/sub-react/dist/index.html` 验证）。

追问"还有别的方案吗"：qiankun 3 对 ESM 有实验性支持；或者换 webpack 打 UMD；或者干脆用 Module Federation（见 Q10）。

## Q9：qiankun 的预加载（prefetch）是干嘛的？

**答**：`start({ prefetch: 'all' })` 会在浏览器空闲（requestIdleCallback）时提前 fetch 子应用的 entry 和静态资源，用户真正切换时省掉网络等待。本仓库 `apps/main-vue/src/micro/index.ts` 用的 `prefetch: 'all'`——打开首页时两个子应用资源已在后台拉好。

## Q10：qiankun vs Module Federation vs iframe？

**答**：

| 方案 | 原理 | 优势 | 劣势 |
| --- | --- | --- | --- |
| iframe | 原生隔离 | 天然 JS/样式全隔离、最稳 | 通信麻烦、URL/弹窗/体验割裂、白屏成本高 |
| qiankun | HTML Entry + Proxy 沙箱 | 接入成本低、社区成熟、不限构建工具（基本） | 沙箱有边界（eval 场景）、对 ESM 工程不友好 |
| Module Federation | 构建器（webpack5/Rspack）原生共享模块 | **共享依赖**（一份 vue/react）、按需粒度到模块 | 强绑定构建器；依赖版本协商复杂；没有运行时隔离（信任内部团队） |

选型话术：跨团队弱信任、技术栈杂 → qiankun；同一技术栈想抽公共依赖 → MF；纯外部系统拼装 → iframe/微组件。

## Q11：qiankun 常见的坑（部署/联调）

**答**（每条都在本仓库处理过或验证过）：
1. dev 下主应用 fetch 子应用 entry 跨域 → 子应用 `server.cors: true`，且要配 `origin` 修正资源绝对路径；
2. 生产白屏 → `base` 必须等于部署子路径（`/sub-react/`），nginx `try_files` 兜底；
3. `application 'xx' died in status LOADING_SOURCE_CODE` → entry 拿不到/404，或产物没暴露生命周期（UMD 名字不匹配）；
4. 容器找不到（container not found）→ 注册的容器选择器在激活那一刻不在 DOM（条件渲染竞态），本仓库让 `#subapp-viewport` 常驻 DOM 用 `v-show` 控制；
5. 子应用 window 事件/定时器没清 → unmount 钩子里必须回收。

## Q12：公共依赖怎么处理？（vue/react 只打一份）

**答**：当前教学版每个子应用自带 runtime（简单但体积大）。生产做法：
1. 子应用构建把 vue/react 配 `external`，运行时从主应用全局取（`window.React`，主应用引 CDN/expose）；
2. 或换 Module Federation 的 shared 能力，自动协商版本；
3. monorepo 里依赖版本用 catalog/统一约束，避免多版本并存。
