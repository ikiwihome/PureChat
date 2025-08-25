# **空灵智语AI (PureChat)**

## 项目定位

空灵智语AI（PureChat）是一款设计极简、体验纯净的智能对话助手。我们摒弃一切冗余，只为您呈现最直观的界面与最流畅的对话。无需复杂操作，一键开启与AI的深度交流，让思考更专注，让灵感更纯粹。

## 界面截图

<table>
  <tr>
    <td align="right"><img src="doc/screenshot1.png" width="800" /></td>
    <td align="left"><img src="doc/screenshot3.png" width="200" /></td>
  </tr>
  <tr>
    <td align="right"><img src="doc/screenshot2.png" width="800" /></td>
    <td align="left"><img src="doc/screenshot4.png" width="200" /></td>
  </tr>
  <tr>
    <td align="center"><img src="doc/screenshot5.png" width="800" /></td>
  </tr>
  <tr>
    <td align="center"><img src="doc/screenshot6.png" width="800" /></td>
  </tr>
</table>


## 支持的AI模型

所有模型的价格信息（单位：美元/百万tokens）

### OpenAI模型
| 模型ID | 输入/1M tokens | 缓存命中 | 输出/1M tokens |
|---------|-------|-------------|--------|
| gpt-5 | $1.25 | $0.125 | $10.00 |
| gpt-5-mini | $0.25 | $0.025 | $2.00 |
| gpt-4o | $2.50 | $1.25 | $10.00 |
| gpt-4o-mini | $0.15 | $0.075 | $0.60 |

### Google模型
| 模型ID | 输入/1M tokens | 缓存命中 | 输出/1M tokens |
|---------|-------|-------------|--------|
| gemini-2.5-pro | $1.25 | $0.31 | $10.00 |
| gemini-2.5-flash | $0.30 | $0.075 | $2.50 |

### Anthropic模型
| 模型ID | 输入/1M tokens | 缓存命中 | 输出/1M tokens |
|---------|-------|-------------|--------|
| claude-sonnet-4-20250514 | $3.00 | $0.30 | $15.00 |

### DeepSeek模型
| 模型ID | 输入/1M tokens | 缓存命中 | 输出/1M tokens |
|---------|-------|-------------|--------|
| deepseek-chat | $0.27 | $0.07 | $1.10 |

### xAI模型
| 模型ID | 输入/1M tokens | 缓存命中 | 输出/1M tokens |
|---------|-------|-------------|--------|
| grok-4-0709 | $3.00 | $0.75 | $15.00 |
| grok-3 | $3.00 | $0.75 | $15.00 |
| grok-3-mini | $0.30 | $0.075 | $0.50 |


## 技术栈

- **前端框架**: [Nuxt 3](https://nuxt.com/) (Vue 3)
- **UI组件库**: [shadcn/ui](https://ui.shadcn.com/) (基于Tailwind CSS)
- **包管理**: pnpm
- **后端API**: Nuxt Server API (支持OpenAI、Anthropic、Google、DeepSeek、xAI)


## 后端服务配置

### 环境变量配置

复制 `.env.example` 文件为 `.env` 并配置相应的API密钥：

```bash
# 复制示例配置文件
cp .env.example .env
```

编辑 `.env` 文件，填入实际的API密钥：


### API密钥获取地址, 推荐第三方API聚合服务, 兼容OpenAI API格式

- **O3**: O3速度比较快，官方价格，首字2.5秒左右 https://www.o3.fan
- **CloseAI**: 1.5倍官方价格，首字1.5秒左右 https://platform.closeai-asia.com/
- **UniAPI**: 速度挺快，首字2秒左右 https://uniapi.ai/dashboard
- **智创聚合API**: 首字3秒左右 https://s.lconai.com/

### API接口说明

后端提供了符合OpenAI API标准的统一接口：

**聊天完成接口**: `POST /api/chat/completions`

## 本地开发

1. 安装依赖
   ```bash
   pnpm install
   ```

2. 配置环境变量（参考上面的后端服务配置）

3. 启动开发服务器
   ```bash
   pnpm run dev
   ```

4. 打开浏览器访问：http://localhost:3000

## 生产构建

1. 构建前端资源
   ```bash
   pnpm run generate
   ```

2. 构建Web页面
   ```bash
   pnpm run build
   ```

3. 预览Web页面
   ```bash
   pnpm run preview
   ```

## 部署说明

项目支持多种部署方式：

1. **Node.js服务器部署**: 使用 `pnpm run build` 构建后，使用 `pnpm run preview` 启动生产服务器
2. **静态站点部署**: 使用 `pnpm run generate` 生成静态文件，部署到任何静态文件托管服务
3. **Docker部署**: 项目包含Dockerfile，支持容器化部署

注意：如果使用静态站点部署，需要配置反向代理将API请求转发到实际的AI服务提供商。
