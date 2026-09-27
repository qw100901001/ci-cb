# 04 · React 面试题（结合本仓库 sub-react）

## Q1：函数组件的 state 存在哪？hooks 原理？

**答**：hooks 状态存在 fiber 节点的 `memoizedState` 链表上，每个 hook 占一个节点，靠**调用顺序**对应。所以规则是：只在顶层调用、不能放进条件/循环——顺序一乱，链表错位，取到的就是别的 hook 的状态。多次 `useState` 就是链表上依次排列的多个节点。

## Q2：useState 的闭包陷阱？（高频，结合本项目）

**答**：每次渲染都是一次函数执行，捕获当次的 props/state 快照。本仓库 `apps/sub-react/src/App.tsx`：

```tsx
const [count, setCount] = useState(0)
// 事件回调里读 count —— 永远是那次渲染的快照
onClick={() => props.setGlobalState({ lastEvent: { text: `点了 ${count + 1} 次` } })}
```

如果异步（setTimeout/setInterval）里读 count，拿到的是**创建回调那次**的旧值。解法：函数式更新 `setCount(c => c + 1)` 拿最新值，或用 ref 镜像。React 18 的自动批处理下，同一事件里多次 setState 也只渲染一次。

## Q3：useEffect 的执行时机和清理函数？

**答**：渲染 **commit 之后异步**执行（不阻塞绘制），这点和 useLayoutEffect（同步、阻塞绘制）相对。返回的清理函数在**下次 effect 执行前**和卸载时调用——定时器、订阅、事件监听必须在清理函数里回收。

微前端语境（加分）：qiankun 的 `unmount` 等价于"整个应用被卸载"，本仓库在 unmount 里 `root.unmount()` 会让 React 走完整的组件卸载 → 各 useEffect 清理函数执行 → 不留泄漏。**qiankun unmount 和 useEffect cleanup 是两个层级的清理，都要做**。

## Q4：为什么需要 useMemo/useCallback？什么时候用？

**答**：引用相等性优化——每次渲染对象/函数字面量都是新引用，传给 `memo` 包裹的子组件或作为 useEffect 依赖时会引发无效重渲染/重复执行。useMemo 缓存值、useCallback 缓存函数（等价 useMemo 返回函数）。

但**不要无脑包**：缓存本身有成本（内存 + 比较依赖），纯展示小组件包了反而慢。真正该用的是：确实昂贵的计算、传递给 memo 子组件的 props。本仓库 App 是单页面小组件，刻意不用，属于正确的"不用"。

## Q5：讲讲 Fiber 架构？

**答**：
- 目的：把不可中断的递归渲染（stack reconciler）改为**可中断、可恢复的增量渲染**；
- 做法：渲染拆成两阶段——**render 阶段**（构建/比对 fiber 链表，可被时间片打断让出主线程，`shouldYield`）+ **commit 阶段**（一次性同步上 DOM，不可打断）；
- **双缓存**：current 树（屏幕上）与 workInProgress 树（内存中构建），完成后指针切换，类似显卡双缓冲；
- 优先级： lanes 模型，用户输入 > 过渡更新，高优先级可插队。

React 18 的 Concurrent 特性（startTransition、useDeferredValue、Suspense 流式渲染）都建立在这套可中断调度上。

## Q6：合成事件是什么？和原生事件的区别？

**答**：React 17+ 在**根容器**上委托监听，事件触发后按虚拟 DOM 树合成事件对象再派发（之前是 document 委托）。意义：跨浏览器抹平差异、池化复用减少 GC（旧版）、统一进入 React 的事件与调度系统。注意与原生监听的执行顺序：原生捕获 → 根委托捕获 → 目标 → 根委托冒泡 → 原生冒泡，混用 alert 顺序题常考。

## Q7：受控/非受控组件、key 的作用？

**答**：
- 受控：表单值绑定 state（`value` + `onChange`），数据单一来源；非受控：DOM 自己管，ref 取值；
- key：diff 时同层比对前先按 key 建索引，key 相同复用节点、不同销毁重建。**index 作 key 在列表增删头元素时会导致状态错位 + 无效渲染**；稳定业务 id 才是正解。

## Q8：React 和 Vue 的对比（两面都会问）

**答**（客观、不站队）：
| 维度 | React | Vue |
| --- | --- | --- |
| 响应式 | 拉取式：不可变数据 + 重渲染整个函数 | 推送式：细粒度依赖跟踪，只更新受影响组件 |
| 模板 vs JSX | JSX=JS，灵活度高，编译期能做的优化少 | 模板受限但可被编译器静态分析优化（PatchFlag/静态提升） |
| 心智 | 全 JS、显式（useCallback 等手动优化） | 指令+约定，自动化程度高 |
| 生态/场景 | 大型应用、跨端（RN）、团队 JS 功底强 | 中后台快开、上手快 |

本仓库双栈并存正好是话术："微前端架构下框架是局部选择，我在基座选了 Vue3（团队熟练度），子应用里 React/Vue 都接了一遍，两边的生命周期和清理模型我都对齐过（qiankun unmount 时 React 走 root.unmount、Vue 走 app.unmount）。"
