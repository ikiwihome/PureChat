/**
 * OpenAI兼容的聊天完成API端点
 * 支持多种AI服务提供商
 */

// 导入停止功能
import { registerStreamController } from './stop.post'

// 类型定义
interface ApiConfig {
  apiKey: string
  baseUrl: string
}

interface RequestData {
  model: string
  messages: Array<{
    role: string
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

interface CustomApiConfig {
  useCustomApi?: boolean
  apiKey?: string
  apiBaseUrl?: string
  [key: string]: any // 兼容旧的按提供商分类的结构
}


export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 验证请求体
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid request body: messages array is required'
      })
    }

    // 获取API密钥和提供商配置
    const provider = body.provider || 'anthropic' // 默认提供商
    const model = body.model || 'anthropic/claude-haiku-4.5' // 默认模型

    // 从前端获取自定义API设置（如果提供）
    const customApiConfig = body.customApiConfig || {}

    // 根据提供商选择API配置
    const apiConfig = getApiConfig(provider, customApiConfig)

    // 处理系统提示词（如果提供）
    let messages = [...body.messages]
    if (body.systemPrompt) {
      // 将系统提示词作为系统消息添加到消息数组的开头
      messages = [
        {
          role: 'system',
          content: body.systemPrompt
        },
        ...messages
      ]
    }

    const stream = body.stream || false

    // 如果是流式请求，设置响应头
    if (stream) {
      setResponseHeaders(event, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'Access-Control-Allow-Credentials': 'true'
      })
    }

    // 调用相应的AI服务
    const response = await callOpenAICompatible(apiConfig, {
      model,
      messages: messages,
      temperature: body.temperature || 0.3,
      max_tokens: body.max_tokens,
      stream: stream
    })

    // 如果是流式响应，处理流式数据
    if (stream && response instanceof ReadableStream) {
      return sendStream(event, response)
    }

    return response
  } catch (error: unknown) {
    // 检查是否是用户主动中断的请求（AbortError）
    if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
      console.log('Chat completion was aborted by user')
      // 对于用户主动中断的请求，返回特殊的响应而不是错误
      return {
        aborted: true,
        message: 'Request was aborted by user'
      }
    }

    console.error('Chat completion error:', error)

    // 返回标准化的错误响应
    const err = error as Error & { statusCode?: number; statusMessage?: string; message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal Server Error',
      message: err.message || 'Failed to process chat completion'
    })
  }
})

/**
 * 获取API配置
 * @param provider 服务提供商
 * @param customApiConfig 自定义API配置
 */
function getApiConfig(provider: string, customApiConfig: CustomApiConfig = {}): ApiConfig {
  // 从 Nuxt runtimeConfig 读取环境变量配置
  const config = useRuntimeConfig()
  
  // 统一的OPENAI兼容API配置 - 从环境变量读取默认配置
  const defaultApiConfig = {
    apiKey: config.defaultApiKey || '',
    baseUrl: config.defaultBaseUrl || 'https://openrouter.ai/api/v1'
  }

  // 优先使用自定义API配置（当useCustomApi为true时）
  // 检查是否是新的扁平化结构
  let customProviderConfig = customApiConfig.useCustomApi ? customApiConfig : null
  
  // 如果不是扁平化结构，尝试旧的按提供商分类的结构（向后兼容）
  if (!customProviderConfig && customApiConfig[provider]?.useCustomApi) {
    customProviderConfig = customApiConfig[provider]
  }

  // 当启用自定义API时，使用用户提供的配置
  if (customProviderConfig?.useCustomApi === true) {
    if (!customProviderConfig.apiKey) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Custom API key not provided for provider: ${provider}`
      })
    }

    return {
      apiKey: customProviderConfig.apiKey,
      baseUrl: customProviderConfig.apiBaseUrl || defaultApiConfig.baseUrl
    }
  }

  // 当未启用自定义API时，使用环境变量中的默认配置
  if (!defaultApiConfig.apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Default API key not configured in environment variables. Please set DEFAULT_API_KEY in your .env file.'
    })
  }

  return defaultApiConfig
}

/**
 * 调用OPENAI兼容的API
 * 适用于所有支持OpenAI格式的厂商（OpenAI、DeepSeek、xAI、Anthropic、Google等）
 * 所有厂商都使用统一的BaseURL和APIKEY格式
 */
async function callOpenAICompatible(apiConfig: ApiConfig, requestData: RequestData) {
  const { apiKey, baseUrl } = apiConfig
  const stream = requestData.stream || false

  // 记录请求开始时间
  const requestStartTime = Date.now()
  let firstTokenReceived = false
  let firstTokenTime = 0
  let promptTokens = 0
  let cachedTokens = 0
  let completionTokens = 0
  let hasReceivedUsage = false // 跟踪是否收到了有效的usage数据
  let accumulatedContent = '' // 用于累积AI回复内容以计算token

  // 计算输入消息的token数量
  const calculatePromptTokens = (messages: Array<{ content: string }>): number => {
    if (!messages || !Array.isArray(messages)) return 0

    // 简单的token估算方法：对于中文，大约1个汉字=1.5个token
    // 对于英文，大约1个单词=1.3个token
    // 这里使用更简单的基于字符数的估算：大约4个字符=1个token
    let totalTokens = 0

    for (const message of messages) {
      if (message.content) {
        const text = message.content
        const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length
        const englishCharCount = text.length - chineseCharCount

        // 中文按1.5个token/字符，英文按0.25个token/字符（4个字符=1个token）
        totalTokens += Math.round(chineseCharCount * 1.5 + englishCharCount * 0.25)
      }
    }

    return totalTokens
  }

  // 计算回复内容的token数量
  const calculateCompletionTokens = (content: string): number => {
    if (!content) return 0

    const chineseCharCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishCharCount = content.length - chineseCharCount

    // 中文按1.5个token/字符，英文按0.25个token/字符（4个字符=1个token）
    return Math.round(chineseCharCount * 1.5 + englishCharCount * 0.25)
  }

  // 创建 AbortController 用于中断请求
  const abortController = new AbortController()

  // 如果是流式请求，注册控制器以便可以被停止
  if (stream) {
    // 从请求数据中提取会话ID（如果前端提供）
    const sessionId = (requestData as any).sessionId
    // 检测提供商（基于baseUrl）
    const detectedProvider = baseUrl.includes('openrouter') ? 'openrouter' : 'other'
    
    registerStreamController(
      abortController,
      sessionId,
      undefined, // requestId - OpenRouter会在响应头中返回，这里暂时为undefined
      detectedProvider,
      requestData.model
    )
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestData),
    signal: abortController.signal // 添加中断信号
  })

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({}))
    const errorObj = errorData as { error?: { message?: string } }
    throw createError({
      statusCode: response.status,
      statusMessage: 'API Error',
      message: errorObj.error?.message || `API error: ${response.statusText}`
    })
  }

  // 处理流式响应并添加统计信息
  if (response.body) {
    const originalStream = response.body

    // 创建转换流来处理和增强流式响应
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // 检查是否已被中断
        if (abortController.signal.aborted) {
          controller.terminate()
          return
        }

        const text = new TextDecoder().decode(chunk)
        const lines = text.split('\n')

        for (const line of lines) {
          // 再次检查是否已被中断
          if (abortController.signal.aborted) {
            controller.terminate()
            return
          }

          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            // 处理 [DONE] 消息 - 这是OpenAI流式响应结束的标志
            if (data === '[DONE]') {
              // 在发送DONE之前，检查是否收到了有效的usage数据
              if (!hasReceivedUsage) {
                // 计算本地token统计数据作为备用
                promptTokens = calculatePromptTokens(requestData.messages)
                completionTokens = calculateCompletionTokens(accumulatedContent)
                cachedTokens = 0 // 缓存token始终为0

                // 创建包含usage和stats的数据块
                const usageData = {
                  usage: {
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: promptTokens + completionTokens,
                    prompt_tokens_details: {
                      cached_tokens: cachedTokens
                    }
                  },
                  stats: {
                    firstTokenTime: firstTokenTime,
                    totalTime: Date.now() - requestStartTime
                  }
                }

                // 发送包含usage和stats的数据块
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(usageData)}\n`))
              }

              controller.enqueue(new TextEncoder().encode(`${line}\n`))
              continue
            }

            try {
              const parsed = JSON.parse(data)

              // 记录第一个包含有效字符的token到达时间
              if (!firstTokenReceived && parsed.choices?.[0]?.delta?.content && parsed.choices[0].delta.content.trim().length > 0) {
                firstTokenReceived = true
                firstTokenTime = Date.now() - requestStartTime
              }

              // 累积AI回复内容用于token计算
              if (parsed.choices?.[0]?.delta?.content) {
                accumulatedContent += parsed.choices[0].delta.content
              }

              // 检查是否包含角色信息（通常在第一个数据块中）
              if (parsed.choices?.[0]?.delta?.role) {
                // 添加角色信息到响应中，确保前端能识别这是assistant消息
                parsed.role = parsed.choices[0].delta.role
              }

              // 检查是否包含usage数据且不为null，如果是则在这个数据块中追加stats信息
              if (parsed.usage !== null && parsed.usage !== undefined) {
                hasReceivedUsage = true // 标记已收到有效的usage数据

                // 在当前数据块中追加stats信息
                parsed.stats = {
                  firstTokenTime: firstTokenTime,
                  totalTime: Date.now() - requestStartTime
                }

                // 发送包含stats的修改后数据块
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(parsed)}\n`))

                // 然后发送[DONE]标记
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n'))
              } else {
                // 其他数据块保持原样
                controller.enqueue(new TextEncoder().encode(`${line}\n`))
              }

            } catch {
              // JSON解析失败，保持原样输出
              controller.enqueue(new TextEncoder().encode(`${line}\n`))
            }
          } else {
            // 非数据行保持原样输出
            controller.enqueue(new TextEncoder().encode(`${line}\n`))
          }
        }
      }
    })

    // 监听中断信号，当请求被中断时清理资源
    abortController.signal.addEventListener('abort', () => {
      console.log('Transform stream was cancelled due to abort signal')
    })

    return originalStream.pipeThrough(transformStream)
  }
}
