#!/bin/sh

# 你可以在这里添加启动前的逻辑，例如检查环境变量、运行数据库迁移等
echo "Starting PureChat application..."

# 加载 .env 文件到环境变量
if [ -f /app/.env ]; then
    export $(grep -v '^#' /app/.env | xargs)
fi

# 执行命令
node .output/server/index.mjs
