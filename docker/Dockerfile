# ---------- 阶段一：构建 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 启用 corepack 提供 pnpm（与仓库 packageManager 字段版本一致）
RUN corepack enable

# 先拷贝清单文件，充分利用 Docker 层缓存：依赖不变时跳过 install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm build

# ---------- 阶段二：运行 ----------
# 多阶段构建：最终镜像只含 nginx + 三个静态产物，不含 node_modules，体积从 ~1GB 降到 ~50MB
FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/apps/main-vue/dist /usr/share/nginx/html
COPY --from=builder /app/apps/sub-react/dist /usr/share/nginx/html/sub-react
COPY --from=builder /app/apps/sub-vue/dist /usr/share/nginx/html/sub-vue

EXPOSE 80
