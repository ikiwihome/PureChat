/**
 * API 测试接口
 * 用于测试自定义 API 的连接性和可用性
 */
export default defineEventHandler(async (event) => {
  try {
    // 解析请求体
    const body = await readBody(event);
    const { apiBaseUrl, apiKey, model } = body;

    // 验证必填字段
    if (!apiBaseUrl || !apiKey) {
      return {
        success: false,
        error: '缺少必要的参数：API Base URL 或 API KEY'
      };
    }

    // 确保 API Base URL 格式正确
    let baseUrl = apiBaseUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }

    // 移除末尾的斜杠
    baseUrl = baseUrl.replace(/\/$/, '');

    // 首先尝试获取模型列表
    const modelsUrl = `${baseUrl}/models`;
    let availableModels: string[] = [];
    
    try {
      const modelsResponse = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // 5秒超时
      });

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        // OpenAI格式: { data: [{id: "model-name"}, ...] }
        if (modelsData.data && Array.isArray(modelsData.data)) {
          availableModels = modelsData.data.map((m: any) => m.id);
        }
      }
    } catch (e) {
      // 如果获取模型列表失败，继续使用默认模型列表
      console.log('Failed to fetch models list, using default models');
    }

    // 确定要测试的模型
    let testModel = model; // 使用用户当前选择的模型
    
    // 如果没有提供模型或模型不在可用列表中，使用备选方案
    if (!testModel || (availableModels.length > 0 && !availableModels.includes(testModel))) {
      if (availableModels.length > 0) {
        // 使用API返回的第一个可用模型
        testModel = availableModels[0];
      } else {
        // 使用常见的通用模型名称列表（按优先级排序）
        const commonModels = [
          'gpt-4o-mini',
          'gpt-4o',
          'gpt-3.5-turbo',
          'claude-3-haiku-20240307',
          'gemini-pro',
          'llama-3.1-8b-instant'
        ];
        testModel = commonModels[0];
      }
    }

    // 构建测试请求 - 发送一个简单的聊天完成请求
    const testUrl = `${baseUrl}/chat/completions`;

    // 构建一个最简单的测试请求
    const testPayload = {
      model: testModel,
      messages: [
        {
          role: 'user',
          content: 'Hi'
        }
      ],
      max_tokens: 5,
      stream: false
    };

    // 发送测试请求
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    // 检查响应状态
    if (response.ok) {
      // 尝试解析响应
      const data = await response.json();
      
      // 检查响应是否包含预期的字段
      if (data.id || data.choices || data.model) {
        return {
          success: true,
          message: `测试成功！${availableModels.length > 0 ? ` (检测到 ${availableModels.length} 个可用模型)` : ''}`
        };
      } else {
        return {
          success: false,
          error: 'API 返回了意外的响应格式'
        };
      }
    } else {
      // 处理错误响应
      let errorMessage = `测试失败！API 返回错误状态码: ${response.status}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        }
      } catch (e) {
        // 无法解析错误响应，使用默认消息
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error: any) {
    console.error('测试失败:', error);

    // 处理不同类型的错误
    let errorMessage = '测试失败';

    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      errorMessage = '请求超时，请检查 API URL 是否正确或网络连接';
    } else if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
      errorMessage = '无法连接到 API 服务器，请检查 URL 是否正确';
    } else if (error.message?.includes('SSL') || error.message?.includes('certificate')) {
      errorMessage = 'SSL证书验证失败，请检查 API 服务器配置';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
});
