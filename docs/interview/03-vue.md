# 03 · Vue 面试题（结合本仓库基座/子应用）

## Q1：Vue3 响应式原理？和 Vue2 的区别？（必考）

**答**：
- **Vue2**：`Object.defineProperty` 逐属性劫持 getter/setter。缺陷：新增/删除属性不响应（要 `$set`）、数组要重写七个方法、初始化时递归整棵对象树成本高。
- **Vue3**：`Proxy` 代理整个对象，拦截 13 种 trap。新增/删除属性、数组下标赋值都天然拦截；**惰性深响应**（访问到嵌套对象才递归代理），初始化更快。

核心流程：`reactive(obj)` 返回 Proxy → 组件 render/`computed`/`watchEffect` 执行时触发 `get` → `track()` 把当前副作用函数收进 targetMap（`WeakMap<target, Map<key, Set<effect>>>`）→ 数据变更触发 `set` → `trigger()` 重新执行收集的副作用。

## Q2：ref 和 reactive 怎么选？

**答**：
- `reactive`：对象类型，Proxy 实现；**解构会断响应**（解构出的基本类型失去代理）；
- `ref`：任意类型，基本类型用 `{ value }` 的 getter/setter 劫持（`ref(0)`），对象类型内部还是转 `reactive`。模板里自动解 `.value`。

实践：本仓库 `apps/main-vue/src/stores/user.ts` 里 `const userInfo = ref<UserInfo>(...)`——因为 user 是会被**整体替换**的数据（`userInfo.value = {...next}`），用 reactive 整体赋值就断响应了，ref 更稳。命名上 ESLint 社区规范也倾向全用 ref，心智统一。

## Q3：computed 和 watch / watchEffect 的区别？

**答**：
- `computed`：**衍生值**，惰性求值 + 缓存（依赖不变不重算）。子应用里的用户信息就该是 computed：`apps/sub-vue/src/App.vue` 里 `const user = computed(() => props.getUserInfo?.())`——props 变化自动重算；
- `watch(源, cb)`：**副作用**，显式声明源，可拿到新旧值、可配 immediate/deep；
- `watchEffect(fn)`：立即执行一次自动收集依赖，依赖变了重跑。适合"依赖什么做什么"的联动逻辑。

## Q4：组合式 API（setup）相比选项式好在哪？

**答**：选项式把一个功能撕碎到 data/methods/computed 各处，跨功能跳读；组合式按**逻辑关注点**组织代码，可提炼成 composable 复用（对比 mixins 的命名冲突、来源不明）。TS 支持也更好（setup 泛型推 props）。本仓库所有组件都是 `<script setup lang="ts">` 写法。

## Q5：Vue3 编译优化做了什么？（diff 相关）

**答**：
- **PatchFlag**：编译期给每个 vnode 标记类型（CLASS/TEXT/PROPS...），diff 时只比对标记的部分，跳过静态内容；
- **静态提升（hoistStatic）**：静态节点提到 render 外只创建一次；
- **事件缓存（cacheHandlers）**：内联函数缓存引用，避免每次渲染新函数触发子组件无效更新；
- **块级树（Block Tree）**：动态节点拍平收集进数组，diff 从递归整树降为遍历动态节点列表；
- 最长递增子序列优化 DOM 移动（vue2 也是，vue3 保留并简化）。

## Q6：vue-router 的 hash 和 history 模式区别？微前端里怎么选？

**答**：
- hash：`#/path`，改 URL 不发请求，部署零配置；丑、SEO 弱；
- history：`pushState` 真路径，**需要服务器 fallback**（所有路径回 index.html）。

本仓库基座用 `createWebHistory()`（`apps/main-vue/src/router/index.ts`），配套 nginx 的 `try_files $uri $uri/ /index.html`。生产微前端基本都选 history + 服务端兜底，路径语义和子应用 `activeRule` 对齐更清晰。

## Q7：Pinia 相比 Vuex 好在哪？

**答**：去掉 mutation（同步异步都直接 action）、天然 TS 推导、模块化靠多 store 实例不需要 modules 嵌套、支持组合式写法（本仓库 `defineStore('user', () => {...})` 就是 setup 风格）、devtools 与 SSR 支持完备。基座把登录态收敛在 Pinia（`stores/user.ts`），再通过 qiankun props 的 getter 下发子应用——**单一数据源**。

## Q8：Vite 为什么快？（常和 Vue3 一起问）

**答**：
- **dev**：不打包。启动时 esbuild 预构建依赖（CJS→ESM、合包），请求到某模块才按需转换；原生 ESM 按 import 图按需加载，项目越大启动优势越明显（对比 webpack 全量打包）；
- **HMR**：粒度到模块，沿着 import 链向上找到边界失效，不整页刷新；
- **prod**：Rollup 打包（可插拔 esbuild 压缩）。dev 与 prod 引擎不同偶有差异，是已知 trade-off。

## Q9：结合项目：基座启动到子应用渲染的完整链路？

**答**（串联题，面试官爱问）：
main.ts `createApp → use(pinia/router) → mount('#app')` → `setupMicroApps()`：从 pinia 取 userStore 构造 props getter → `registerMicroApps`（此时不加载）→ `start({ prefetch: 'all' })` 空闲预取两个子应用 → 用户点菜单，vue-router 切到 `/sub-react` → qiankun 劫持路由命中 activeRule → fetch 7101 的 HTML → 沙箱执行脚本 → 调子应用 `mount(props)` → `createRoot(container.querySelector('#sub-react-root')).render(<App {...props}/>)` → 页面出现，`props.getUserInfo()` 拿到基座 pinia 的登录态。
