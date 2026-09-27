# 面试题库索引

面试前的复习路线：先背 `00` 的项目话术（所有问题的容器），再按面试方向深入专题。

| 文档 | 内容 | 对应仓库代码 |
| --- | --- | --- |
| [00-项目介绍话术](00-项目介绍话术.md) | STAR 讲项目、架构图、三个踩坑故事、追问预案 | 全仓库 |
| [01-微前端qiankun](01-微前端qiankun.md) | HTML Entry、三种沙箱、样式隔离、通信、Vite 接入、方案对比 | `apps/*/src`（生命周期）、`apps/main-vue/src/micro/` |
| [02-monorepo](02-monorepo.md) | pnpm 软链结构、workspace 协议、overrides、Turborepo 缓存 | `pnpm-workspace.yaml`、`turbo.json`、根 `package.json` |
| [03-vue](03-vue.md) | 响应式、ref/reactive、diff 优化、pinia、Vite 原理 | `apps/main-vue/`、`apps/sub-vue/` |
| [04-react](04-react.md) | hooks 链表、闭包陷阱、Fiber、合成事件、React vs Vue | `apps/sub-react/src/` |
| [05-cicd](05-cicd.md) | 流水线设计、缓存优化、多阶段构建、nginx、部署策略 | `.github/workflows/`、`docker/`、`nginx/` |

## 使用建议

1. **每道题先自己答一遍再看答案**——答案刻意写成"话术体"，方便直接复述；
2. 涉及原理的（沙箱、缓存、Fiber）动手验证：如 `cat apps/sub-react/dist/index.html` 看生命周期注入、跑两遍 `pnpm build` 看 turbo 缓存命中日志；
3. `00` 里的三个踩坑故事是差异化亮点，务必讲得出细节（报错信息 → 定位思路 → 解决 → 升华）。
