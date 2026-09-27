# 02 · Monorepo（pnpm + Turborepo）面试题

## Q1：为什么用 monorepo？和 multirepo 比各有什么优劣？

**答**：
- **monorepo**（本仓库）：多个应用/包放一个仓库，统一版本管理、原子提交、公共代码直接引用源码。
  - 优：跨应用的修改一个 PR 完成、工具链和规范统一（一套 tsconfig/eslint/CI）、共享包零发布成本（`workspace:*` 直接链源码）；
  - 劣：仓库体积增长、CI 变慢（需要 turbo 的增量能力）、权限边界模糊。
- **multirepo**：独立仓库独立发布，团队自治强，但公共库要走 npm 发版流程，跨库改动要串行多个 PR。

对本项目（3 应用 + 1 共享包，强关联、同节奏迭代），monorepo 显然更合适。

## Q2：pnpm 的 node_modules 结构是什么样的？为什么快、为什么省磁盘？（高频）

**答**：pnpm 用**符号链接 + 内容寻址存储**，三层结构：

```
node_modules/
├── vue -> .pnpm/vue@3.5.13/node_modules/vue   # 顶层只有直接依赖的软链
└── .pnpm/                                     # 真正的存储平面
    ├── vue@3.5.13/node_modules/
    │   ├── vue/         # 硬链接到全局 store
    │   └── @vue/...     # vue 的依赖也软链到 .pnpm 对应目录
    └── vue@3.4.0/node_modules/...
```

- **全局 store**（`~/.pnpm-store`）按文件内容哈希存一份，所有项目**硬链接**过去——同版本包全局只占一份磁盘，安装几乎零拷贝，这是快的根本原因；
- **没有幽灵依赖（phantom dependencies）**：顶层 node_modules 只放 package.json 声明过的包。npm/yarn 的扁平化结构下，你没声明也能 `require('lodash')`（因为被提升了），哪天依赖树变了就炸；pnpm 非法引用直接解析失败，问题在开发期暴露；
- 不同版本共存天然支持（`.pnpm` 里两个 vue 目录互不干扰）。

## Q3：workspace 协议是什么？

**答**：`"@cb/shared": "workspace:*"`（见各 app 的 package.json）告诉 pnpm 这个依赖**来自本仓库**，链接本地目录而不是去 registry 下载；发布时（如果有发包需求）会自动替换成真实版本号。本仓库 `@cb/shared` 的类型（`SubAppMountProps`）和工具（`formatDate`）被 Vue 基座和两个子应用同时引用，改一处三端生效。

## Q4：pnpm 的 overrides 是干什么的？（可结合真实踩坑讲）

**答**：强制重写依赖树中某（传递）依赖的版本，用于：
- 上游包的间接依赖有 bug/安全漏洞，等不及上游发版；
- 版本冲突强制对齐。

**本仓库真实案例**：`vite-plugin-qiankun` 依赖的 cheerio 被 semver 解析到 1.2.0（纯 ESM、无 default export），导致 `vite build` 失败。在根 package.json：

```json
"pnpm": { "overrides": { "cheerio": "1.0.0-rc.12" } }
```

锁回有 default export 的版本即可。对比：yarn 叫 `resolutions`，npm 有 `overrides` 字段。**这体现的是"semver 范围会漂移，lockfile + overrides + CI 是三道防线"的工程意识。**

## Q5：Turborepo 解决什么问题？原理是什么？

**答**：monorepo 变大后两个痛点——任务串行慢、没改的包也在反复构建。Turborepo 做**任务编排 + 缓存**：

- **编排**：按依赖图拓扑执行。本仓库 `turbo.json` 里 `build` 声明 `dependsOn: ["^build"]`——先构建上游（shared）再构建依赖它的应用；多个应用之间没有依赖关系则**并行**。
- **缓存**：对每个任务算一个**哈希（输入 = 包源文件内容 + 依赖包的哈希 + 任务名 + 参数 + 环境变量白名单）**，命中则直接回放上次产出的 `outputs`（`dist/**`）和终端日志，秒级完成。改了 sub-react 的代码，只有它自己重新构建，main-vue 直接吃缓存。
- **远程缓存**：配置 `TURBO_TOKEN/TURBO_TEAM` 后缓存共享给团队和 CI——本地构建过的包，CI 不再重复构建。Vercel 托管免费额度。

对应本仓库的 `turbo.json`：`build` 有 outputs、`dev` 标 `persistent: true`（长驻进程不缓存不等待）。

## Q6：`packageManager` 字段和 corepack 是什么？

**答**：`packageManager: "pnpm@9.15.9"`（根 package.json）声明本仓库的包管理器及精确版本。corepack（Node 自带）开启后会拦截 `pnpm` 命令，确保所有人（包括 CI 和 Docker 构建）用同一版本——避免"我这 pnpm 9 你那 pnpm 10，lockfile 格式都不一样"的协作问题。

## Q7：只在改动影响的包上跑 CI 怎么做？

**答**（加分项，展示视野）：
- turbo 天然支持：`pnpm exec turbo run build --filter=@cb/sub-react...`（`...` 表示含其依赖）；
- GitHub Actions 配合 `turbo-ignore` 或 changesets 做 PR 级别跳过；
- 本仓库规模小，全量 + 缓存已经秒级，不值得引入复杂度——**知道何时不用更高级的方案也是工程判断**。

## Q8：和 Nx 比，为什么选 Turborepo？

**答**：Nx 是"带脚手架的全家桶"（生成器、插件体系、依赖图可视化、甚至跑测试框架），侵入性强、学习曲线陡；Turborepo 只做"任务编排 + 缓存"这一件事，不侵入各包的构建脚本（package.json scripts 原样保留）。本仓库构建就是普通 `vite build`，选轻量的 Turborepo 足够。团队如果需要强约束的代码生成/迁移工具链再考虑 Nx。
