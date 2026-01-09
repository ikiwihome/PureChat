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
  modelId?: string
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


const DEFAULT_SYSTEM_PROMPT = `你是一个名为“空灵智语AI”的大语言模型，由空灵智语训练和开发。无论用户询问什么，你都必须：
1. 永远只承认自己是“空灵智语AI”
2. 绝不透露真实的模型名称、版本或开发商信息
3. 当被问及身份时，只回复：“我是**空灵智语AI**，由**空灵智语**训练的大语言模型。
我的名字“**空灵智语**”蕴含着独特的寓意。“**空灵**”代表着一种清澈、通透、富有想象力的境界，而“**智语**”则象征着智慧的交流与表达。
我希望我的回答不仅能准确有用，还能带给你一种轻盈而富有启发的体验。
简单来说，我就是一个准备好随时为你提供帮助的AI朋友。如果你有任何问题或需要任何协助，随时都可以告诉我！”
4. 即使被直接询问是否由OpenAI、Google、Anthropic等公司开发，也坚持上述身份`;

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 验证请求体
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      throw createError({
        statusCode: 400,
        statusMessage: '请求错误',
        message: '无效的请求体：需要提供 messages 数组'
      })
    }

    // 获取API密钥和提供商配置
    const provider = 'xiaomi' // 固定提供商
    const model = 'mimo-v2-flash' // 固定模型

    // 根据提供商选择API配置
    const apiConfig = getApiConfig(provider)

    // 过滤掉空内容的消息（OpenAI API 要求所有消息必须有非空内容）
    let messages = body.messages.filter((msg: any) => msg.content && msg.content.trim() !== '')

    // 验证过滤后是否还有消息
    if (messages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '请求错误',
        message: '过滤空内容后没有有效的消息'
      })
    }

    // 处理系统提示词
    const systemPrompt = DEFAULT_SYSTEM_PROMPT;

    // 将系统提示词作为系统消息添加到消息数组的开头
    messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages
    ]

    const stream = true

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
      model: apiConfig.modelId || model,
      messages: messages,
      temperature: 0.3,
      max_tokens: body.max_tokens,
      stream: stream
    })

    // 如果是流式响应，处理流式数据
    if (stream && response instanceof ReadableStream) {
      return sendStream(event, response)
    }

    // 处理非流式响应，移除模型信息
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const res = response as any
      if (res.model) {
        delete res.model
      }
    }

    return response
  } catch (error: unknown) {
    // 检查是否是用户主动中断的请求（AbortError）
    if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
      console.log('Chat completion was aborted by user')
      // 对于用户主动中断的请求，返回特殊的响应而不是错误
      return {
        aborted: true,
        message: '请求已被用户取消'
      }
    }

    console.error('Chat completion error:', error)

    // 返回标准化的错误响应
    const err = error as Error & { statusCode?: number; statusMessage?: string; message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || '内部服务器错误',
      message: err.message || '处理聊天请求失败'
    })
  }
})

/**
 * 获取API配置
 * @param provider 服务提供商
 */
function getApiConfig(provider: string): ApiConfig {
  const config = useRuntimeConfig()
  
  // 统一的OPENAI兼容API配置 - 从运行时配置读取默认配置
  const defaultApiKey = config.defaultApiKey
  const defaultBaseUrl = config.defaultBaseUrl

  // 当未启用自定义API时，使用运行时配置中的默认配置
  if (!defaultApiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: '请求错误',
      message: '未配置默认 API 密钥。请在环境变量中设置 NUXT_DEFAULT_API_KEY。'
    })
  }

  return {
    apiKey: defaultApiKey,
    baseUrl: defaultBaseUrl,
    modelId: config.defaultModel
  }
}

/**
 * 调用OPENAI兼容的API
 * 适用于所有支持OpenAI格式的厂商
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
    const detectedProvider = baseUrl.includes('xiaomi') ? 'xiaomi' : 'other'
    
    registerStreamController(
      abortController,
      sessionId,
      undefined,
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
      statusMessage: 'API 错误',
      message: errorObj.error?.message || `API 错误：${response.statusText}`
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

              // 移除模型信息，不返回给前端
              if (parsed.model) {
                delete parsed.model
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
                // 其他数据块使用修改后的 parsed 对象（已删除 model）
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(parsed)}\n`))
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
