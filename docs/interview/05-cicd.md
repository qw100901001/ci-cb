# 05 · CI/CD & 部署面试题（结合本仓库流水线）

## Q1：CI 和 CD 分别是什么？解决什么问题？

**答**：
- **CI 持续集成**：每次 push/PR 自动跑**质量门禁**——类型检查、单测、构建。目的是"坏代码进不了 main"，且问题在提交后几分钟内暴露，而不是上线当晚；
- **CD 持续交付/部署**：交付=自动产出可发布产物（镜像/包）；部署=自动推到环境。目的是**发布变成一件无聊的、低风险的事**。

本仓库的两条流水线正是这个结构：`.github/workflows/ci.yml`（typecheck/test/build 门禁）+ `cd.yml`（main 分支构建 Docker 镜像推 GHCR）。

## Q2：GitHub Actions 的核心概念？

**答**：
- **workflow**（一个 yml）→ 触发器 `on`（push/PR/定时/手动 workflow_dispatch）；
- **job**（并行单元，各自独立虚拟机）→ 可用 `needs` 串行；
- **step**（job 内顺序步骤）→ 跑 shell 或引用 **action**（可复用步骤，如 `actions/checkout@v4`）；
- **runner**：GitHub 托管的机器（ubuntu-latest）；
- **secrets**：加密环境变量（GITHUB_TOKEN 内置，本仓库用它登录 GHCR 推镜像）。

本仓库细节：`concurrency` 配了 `cancel-in-progress`——同分支新 push 会取消还在跑的旧流水线，省配额也省时间。

## Q3：流水线怎么提速？（必问优化题）

**答**（按收益排）：
1. **依赖缓存**：`actions/setup-node` 的 `cache: 'pnpm'` 缓存 pnpm store，命中时 install 从分钟级降到秒级；
2. **构建缓存**：Turborepo 哈希命中直接回放产物；CD 里 `docker/build-push-action` 配 `cache-from/to: type=gha` 复用 Docker 层缓存；
3. **按需触发**：`on.push` 配分支过滤 + concurrency 取消旧跑；
4. **只构建受影响的包**：turbo `--filter`（本仓库规模暂不需要，见 02-monorepo Q7）。

## Q4：Docker 镜像和容器的区别？镜像为什么是分层的？

**答**：镜像是只读的分层文件系统快照（每条 Dockerfile 指令一层），容器是镜像 + 可写层的一个运行进程。层的意义：**构建缓存**（指令不变层复用）与**存储复用**（多个容器共享同一镜像层）。

所以 Dockerfile 指令顺序是性能问题（见 Q5），也是本仓库 `docker/Dockerfile` 先 COPY 清单再 COPY 源码的原因。

## Q5：什么是多阶段构建？为什么最终镜像能小那么多？

**答**：构建期需要 node + 全部 devDependencies（~1GB），运行期只需要 nginx + 静态产物（~50MB）。多阶段构建用 `FROM ... AS builder` 分段，最终镜像**只拷贝**上一阶段的 `dist`：

```dockerfile
FROM node:20-alpine AS builder   # 装 pnpm、install、turbo build
FROM nginx:alpine                # 只 COPY 三个 dist + nginx.conf
```

推而广之的思想：**构建环境和运行环境分离**——前端静态站点根本不需要 node 运行时。

## Q6：nginx 部署微前端有哪些要点？（结合 nginx/nginx.conf）

**答**：
1. **同域部署**消除 CORS：`/` 主应用、`/sub-react/`、`/sub-vue/` 同一域名下，qiankun fetch entry 不跨域（生产推荐）；dev 下才需要子应用开 `server.cors`；
2. **SPA fallback**：每个 location 都要 `try_files $uri $uri/ /xx/index.html`，否则子路由刷新 404；
3. **缓存策略二分**：带 hash 的 `assets/*.js` 长缓存 `immutable`（内容变文件名变），`index.html` 不缓存（保证发版即生效）；
4. **gzip**：js/css/json 压缩，子应用加载提速。

## Q7：滚动、蓝绿、灰度（金丝雀）部署的区别？

**答**：
- **滚动**：新旧实例逐批替换。省资源、慢收敛，失败回滚要再滚一轮；
- **蓝绿**：两套环境并存，流量一次性切到绿。切回快，成本双倍；
- **灰度/金丝雀**：先放 1%~5% 流量到新版本，观测无异常再逐步放量。风险最小，需要网关按比例分流。

加分话术："微前端架构做灰度还有独特玩法——按 `activeRule` 把 entry 指向新旧两版子应用路径，可以**只灰度某一个子应用**，基座和其他子应用不动，粒度比整站灰度细。"

## Q8：本仓库 CD 推镜像到 GHCR 的细节？

**答**：
- 登录用内置 `secrets.GITHUB_TOKEN` + `permissions: packages: write`，不需要额外申请 token；
- ghcr 要求镜像名**全小写**，而仓库名可能有大写，所以 cd.yml 里有 `${GITHUB_REPOSITORY,,}` 转小写一步；
- tag 策略：`latest`（跟最新）+ `sha-xxxxxxx`（可追溯到具体 commit，回滚=改 tag）。

## Q9：如果流水线红了，你怎么排查？（实操题）

**答**：按层定位：Actions 页面看是哪个 job/step 红 →
- **install 挂**：lockfile 与 package.json 不同步（本地改了依赖没提交 lockfile）→ 本地 `pnpm install` 重新生成提交；
- **typecheck/test 挂**：本地复现 `pnpm typecheck && pnpm test`（好消息是 CI 命令与本地完全一致，这正是 monorepo 统一脚本的好处）；
- **build 挂**：看 turbo 日志定位到具体包；缓存导致的"本地好 CI 挂"用 `--force` 重跑排除缓存变量；
- **CD 挂**：`docker build` 本地复现；权限问题查 GITHUB_TOKEN 的 permissions。

## Q10：整个项目从提交到上线的完整链路？（收尾串联题）

**答**：`git push` → GitHub Actions CI（pnpm 缓存安装 → turbo 并行 typecheck/test/build，shared 先行）→ 合并 main 触发 CD（Docker 多阶段构建，层缓存命中 → 推 ghcr.io/owner/repo:sha & latest）→ 服务器 `docker pull && docker run -p 80:80` → nginx 同域托管三个应用 → 用户访问 `/` 进 Vue 基座，qiankun 按需加载子应用。整条链路无人工干预点，且每一步都有缓存或并行优化。
