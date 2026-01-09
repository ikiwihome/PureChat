# 构建阶段 (builder stage)
# 使用 Node.js 20 的 Alpine 版本作为基础镜像，用于构建 Nuxt.js 应用
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制所有项目文件到工作目录
# 确保所有源代码和配置文件都在，包括 package.json 和 pnpm-lock.yaml
COPY . .

# 全局安装 pnpm
# 确保在安装项目依赖之前 pnpm 是可用的
RUN npm install -g pnpm

# 安装项目依赖
# --frozen-lockfile 确保根据 lockfile 精确安装依赖，提高构建一致性
RUN pnpm install --frozen-lockfile

# 构建 Nuxt.js 应用
# Nuxt.js 会构建一个包含前后端逻辑的服务器应用，输出到 .output 目录
RUN pnpm build

# 生产阶段 (production stage)
# 使用 Node.js 20 的 Alpine 版本作为基础镜像，用于运行 Nuxt.js 服务器
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 复制构建阶段生成的完整 .output 目录到 .output 子目录
# 这个目录包含了 Nuxt.js 服务器端代码和所有静态资源
COPY --from=builder /app/.output ./.output

# 复制 entrypoint.sh 并赋予执行权限
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# 暴露 Nuxt.js 服务器监听的端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 定义容器启动时执行的入口脚本
ENTRYPOINT ["./entrypoint.sh"]
