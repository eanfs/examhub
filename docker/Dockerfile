# examhub 考务可视化大屏 —— 多阶段构建
# 构建上下文为项目根目录：docker build -f docker/Dockerfile .

# ---------- 构建阶段：编译静态产物 ----------
FROM node:22-alpine AS builder

WORKDIR /app

# 跳过 Playwright 浏览器下载：镜像构建不跑 E2E，省时省空间
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 先装依赖，利用 Docker 层缓存（package*.json 未变时复用此层）
COPY package.json package-lock.json ./
RUN npm ci

# 再拷源码并构建（读 .env.production：VITE_DATA_SOURCE=api）
COPY . .
RUN npm run build

# ---------- 运行阶段：nginx 托管 dist 并反代 /api ----------
# 基础镜像沿用旧 master 的华为云 SWR nginx（私有镜像，构建前需 docker login SWR）
FROM swr.cn-east-3.myhuaweicloud.com/intetech/nginx:1.27.0

# 移除默认站点，换上考务大屏配置
RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/exam-web.conf /etc/nginx/conf.d/

# 静态产物放到 nginx root（与 exam-web.conf 的 root /data/ 对应）
COPY --from=builder /app/dist /data

EXPOSE 80
