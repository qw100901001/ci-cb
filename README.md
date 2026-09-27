# ci-cb · 微前端 Monorepo 全链路项目

pnpm + Turborepo 管理的 monorepo，Vue3 基座通过 **qiankun** 加载 React / Vue3 双技术栈子应用，配套 **GitHub Actions** 流水线与 **Docker + Nginx** 同域部署。

> 📚 面试准备材料见 [docs/interview/](docs/interview/)（项目话术 + 微前端 / monorepo / Vue / React / CI-CD 六个专题）

## 架构

```
                 ┌────────────────────────────────┐
                 │   浏览器 http://localhost:7100  │
                 └───────────────┬────────────────┘
                                 │
                 ┌───────────────▼────────────────┐
                 │  apps/main-vue（Vue3 基座）     │
                 │  菜单/布局 · vue-router · Pinia │
                 │  registerMicroApps + start     │
                 └───────┬───────────────┬────────┘
                 activeRule /sub-react   activeRule /sub-vue
                 ┌───────▼──────┐  ┌──────▼───────┐
                 │ apps/        │  │ apps/        │
                 │ sub-react    │  │ sub-vue      │
                 │ React18      │  │ Vue3         │
                 └──────┬───────┘  └──────┬───────┘
                        └───────┬─────────┘
                        ┌───────▼────────┐
                        │ packages/shared│
                        │ 类型 + 工具函数 │
                        └────────────────┘
```

- **主→子通信**：qiankun props 下发 `getUserInfo`（getter 函数，实时读基座 Pinia 登录态）
- **子→主通信**：`initGlobalState` 全局状态，子应用上报事件、基座首页展示日志
- 每个子应用也可**独立运行**调试（直接访问各自端口）

## 快速开始

```bash
# 前置：Node >= 18，pnpm（npm i -g pnpm@9）
pnpm install

# 一键并行启动三个应用（turbo）
pnpm dev
```

| 应用 | 地址 | 说明 |
| --- | --- | --- |
| main-vue | http://localhost:7100 | 基座入口，从这里进 |
| sub-react | http://localhost:7101 | React 子应用（独立运行模式） |
| sub-vue | http://localhost:7102 | Vue3 子应用（独立运行模式） |

**验证微前端**：打开 7100 → 左侧菜单切到「React 子应用」「Vue 子应用」→ 首页「切换用户」后再进子应用，观察登录态变化 → 子应用里点「通知主应用」，回首页看事件日志。

## 常用命令

```bash
pnpm dev        # 并行启动所有应用（dev server）
pnpm build      # turbo 依赖图构建（shared 先行，未变更包走缓存）
pnpm test       # 单元测试（vitest）
pnpm typecheck  # 全量类型检查（tsc / vue-tsc）
```

## 部署

**本地 Docker 验证**（需安装 Docker）：

```bash
docker compose -f docker/docker-compose.yml up --build
# 访问 http://localhost:8080
```

**CI/CD**（推送到 GitHub 后自动生效）：

- `.github/workflows/ci.yml` — push/PR 触发：pnpm 缓存安装 → typecheck → test → build
- `.github/workflows/cd.yml` — push main 触发：Docker 多阶段构建 → 推送 `ghcr.io/<owner>/<repo>`

首次推送：

```bash
git remote add origin git@github.com:<你的用户名>/ci-cb.git
git push -u origin main
```

## 目录结构

```
├── apps/
│   ├── main-vue/       # Vue3 基座（qiankun 主应用，7100）
│   ├── sub-react/      # React18 子应用（7101）
│   └── sub-vue/        # Vue3 子应用（7102）
├── packages/shared/    # 共享 TS 类型 + 工具函数 + vitest
├── nginx/nginx.conf    # 同域部署：/ 主应用，/sub-* 子应用 + SPA fallback
├── docker/             # 多阶段 Dockerfile + docker-compose
├── .github/workflows/  # CI（质量门禁）+ CD（镜像发布）
└── docs/interview/     # 面试题库
```

## 已知技术决策

| 决策 | 原因 |
| --- | --- |
| Vite 5 + vite-plugin-qiankun | qiankun 依赖 UMD 产物，Vite 需插件桥接（dev 用 SystemJS、prod 注入 lifecycle）；Vite 5 是该插件验证过的组合 |
| cheerio 锁定 1.0.0-rc.12（pnpm overrides） | 新版 cheerio 纯 ESM 无 default export，会炸 vite-plugin-qiankun 构建 |
| 子应用容器 `#subapp-viewport` 常驻 DOM（v-show） | 避免条件渲染与 qiankun 挂载的竞态 |
| props 传 getter 而非值 | 子应用每次调用读到基座 Pinia 最新登录态 |
