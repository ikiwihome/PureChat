/**
 * OpenAI兼容的聊天完成API端点
 * 支持多种AI服务提供商
 */
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
    const provider = body.provider || 'deepseek' // 默认使用DeepSeek
    const model = body.model || 'deepseek-chat' // 默认模型

    // 从前端获取自定义API设置（如果提供）
    const customApiConfig = body.customApiConfig || {}

    // 根据提供商选择API配置
    const apiConfig = getApiConfig(provider, customApiConfig)

    // 处理系统提示词（如果提供）
    let messages = [...body.messages];
    if (body.systemPrompt) {
      // 将系统提示词作为系统消息添加到消息数组的开头
      messages = [
        {
          role: 'system',
          content: body.systemPrompt
        },
        ...messages
      ];
    }

    const stream = body.stream || false;

    // 如果是流式请求，设置响应头
    if (stream) {
      setResponseHeaders(event, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'Access-Control-Allow-Credentials': 'true'
      });
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
      return sendStream(event, response);
    }

    return response
  } catch (error: any) {
    console.error('Chat completion error:', error)

    // 返回标准化的错误响应
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error',
      message: error.message || 'Failed to process chat completion'
    })
  }
})

/**
 * 获取API配置
 * @param provider 服务提供商
 * @param customApiConfig 自定义API配置
 */
function getApiConfig(provider: string, customApiConfig: any = {}) {
  // 统一的OPENAI兼容API配置 - 直接从环境变量读取
  const defaultApiConfig = {
    apiKey: process.env.DEFAULT_API_KEY,
    baseUrl: process.env.DEFAULT_BASE_URL || 'https://api.openai.com/v1' // 统一的BaseURL，默认为OpenAI
  }

  // 优先使用自定义API配置
  const customProviderConfig = customApiConfig[provider]
  if (customProviderConfig?.useCustomApi) {
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

  // 使用默认的API配置
  if (!defaultApiConfig.apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `Default API key not configured`
    })
  }

  return defaultApiConfig
}

/**
 * 调用OPENAI兼容的API
 * 适用于所有支持OpenAI格式的厂商（OpenAI、DeepSeek、xAI、Anthropic、Google等）
 * 所有厂商都使用统一的BaseURL和APIKEY格式
 */
async function callOpenAICompatible(apiConfig: any, requestData: any) {
  const { apiKey, baseUrl } = apiConfig
  const stream = requestData.stream || false;

  // 记录请求开始时间
  const requestStartTime = Date.now();
  let firstTokenReceived = false;
  let firstTokenTime = 0;
  let promptTokens = 0;
  let cachedTokens = 0;
  let completionTokens = 0;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestData)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw createError({
      statusCode: response.status,
      statusMessage: 'API Error',
      message: errorData.error?.message || `API error: ${response.statusText}`
    })
  }

  // 处理流式响应并添加统计信息
  if (response.body) {
    const originalStream = response.body;

    // 创建转换流来处理和增强流式响应
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            // 处理 [DONE] 消息 - 这是OpenAI流式响应结束的标志
            if (data === '[DONE]') {
              controller.enqueue(new TextEncoder().encode(`${line}\n`));
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              // 记录第一个包含有效字符的token到达时间
              if (!firstTokenReceived && parsed.choices?.[0]?.delta?.content && parsed.choices[0].delta.content.trim().length > 0) {
                firstTokenReceived = true;
                firstTokenTime = Date.now() - requestStartTime;
              }

              // 检查是否包含角色信息（通常在第一个数据块中）
              if (parsed.choices?.[0]?.delta?.role) {
                // 添加角色信息到响应中，确保前端能识别这是assistant消息
                parsed.role = parsed.choices[0].delta.role;
              }

              // 检查是否包含usage数据且不为null，如果是则在这个数据块中追加stats信息
              if (parsed.usage !== null && parsed.usage !== undefined) {
                // 在当前数据块中追加stats信息
                parsed.stats = {
                  firstTokenTime: firstTokenTime,
                  totalTime: Date.now() - requestStartTime
                };

                // 发送包含stats的修改后数据块
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(parsed)}\n`));

                // 然后发送[DONE]标记
                controller.enqueue(new TextEncoder().encode(`data: [DONE]\n`));
              } else {
                // 其他数据块保持原样
                controller.enqueue(new TextEncoder().encode(`${line}\n`));
              }

            } catch (error) {
              // JSON解析失败，保持原样输出
              controller.enqueue(new TextEncoder().encode(`${line}\n`));
            }
          } else {
            // 非数据行保持原样输出
            controller.enqueue(new TextEncoder().encode(`${line}\n`));
          }
        }
      }
    });

    return originalStream.pipeThrough(transformStream);
  }
}
