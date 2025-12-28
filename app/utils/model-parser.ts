import type { Provider, Model } from '~/composables/useSessions';

export interface RawModelData {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
    input_cache_read?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

const PROVIDER_MAP: Record<string, { name: string; icon: string }> = {
  anthropic: { name: 'Anthropic', icon: '/anthropic.svg' },
  openai: { name: 'OpenAI', icon: '/openai.svg' },
  google: { name: 'Google', icon: '/google.svg' },
};

export function transformModels(rawData: RawModelData[]): Provider[] {
  const providersMap = new Map<string, Provider>();

  rawData.forEach((item) => {
    const [providerId] = item.id.split('/');
    if (!providerId) return;

    if (!providersMap.has(providerId)) {
      const providerInfo = PROVIDER_MAP[providerId] || {
        name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
        icon: '/openai.svg', // Default icon
      };

      providersMap.set(providerId, {
        id: providerId,
        name: providerInfo.name,
        icon: providerInfo.icon,
        models: [],
      });
    }

    const provider = providersMap.get(providerId)!;
    
    // Clean up model name (remove provider prefix if present)
    let modelName = item.name;
    if (modelName.includes(': ')) {
      modelName = modelName.split(': ')[1] || modelName;
    }

    const model: Model = {
      id: item.id,
      name: modelName,
      pricing: {
        input: parseFloat(item.pricing.prompt) * 1000000,
        cachedInput: parseFloat(item.pricing.input_cache_read || '0') * 1000000,
        output: parseFloat(item.pricing.completion) * 1000000,
      },
    };

    provider.models.push(model);
  });

  return Array.from(providersMap.values());
}

/**
 * 从 OpenAI 兼容的 API 获取模型列表
 * @param baseUrl - API 基础 URL (例如: https://api.openai.com/v1)
 * @param apiKey - API 密钥
 * @returns 转换后的 Provider 数组
 */
export async function fetchModelsFromOpenAICompatibleAPI(
  baseUrl: string,
  apiKey: string
): Promise<Provider[]> {
  try {
    // 确保 baseUrl 格式正确
    let normalizedUrl = baseUrl.trim().replace(/\/$/, '');
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // 如果 URL 已经包含 /v1,则直接使用,否则添加
    if (!normalizedUrl.endsWith('/v1')) {
      normalizedUrl = normalizedUrl + '/v1';
    }

    const modelsUrl = `${normalizedUrl}/models`;

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const json = await response.json();

    // OpenAI 格式: { data: [{id: "model-name", ...}, ...] }
    if (!json.data || !Array.isArray(json.data)) {
      throw new Error('Invalid response format: missing data array');
    }

    return transformOpenAIModels(json.data, baseUrl);
  } catch (error) {
    console.error('Error fetching models from OpenAI compatible API:', error);
    throw error;
  }
}

/**
 * 转换 OpenAI 格式的模型数据为应用所需格式
 * @param models - OpenAI 格式的模型数据
 * @param sourceUrl - 来源 URL,用于生成 provider ID
 * @returns 转换后的 Provider 数组
 */
export function transformOpenAIModels(
  models: any[],
  sourceUrl?: string
): Provider[] {
  const providersMap = new Map<string, Provider>();

  models.forEach((model) => {
    // 模型 ID 可能是 "gpt-4", "claude-3-opus" 或 "provider/model" 格式
    const modelId = model.id;
    let providerId: string;
    let modelName: string;

    // 尝试从模型 ID 中解析提供商
    if (modelId.includes('/')) {
      // 格式: "provider/model"
      [providerId, modelName] = modelId.split('/', 2);
    } else if (modelId.startsWith('gpt-')) {
      providerId = 'openai';
      modelName = modelId;
    } else if (modelId.startsWith('claude-')) {
      providerId = 'anthropic';
      modelName = modelId;
    } else if (modelId.startsWith('gemini-')) {
      providerId = 'google';
      modelName = modelId;
    } else {
      // 使用通用提供商名称
      providerId = (sourceUrl ? new URL(sourceUrl).hostname.split('.')[0] : 'custom') as string;
      modelName = modelId;
    }

    // 确保提供商存在
    if (!providersMap.has(providerId)) {
      const providerInfo = PROVIDER_MAP[providerId] || {
        name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
        icon: '/openai.svg',
      };

      providersMap.set(providerId, {
        id: providerId,
        name: providerInfo.name,
        icon: providerInfo.icon,
        models: [],
      });
    }

    const provider = providersMap.get(providerId)!;

    // 创建模型对象
    const transformedModel: Model = {
      id: modelId,
      name: model.name || modelName,
      pricing: {
        // OpenAI API 可能不返回价格信息,使用默认值 0
        input: 0,
        cachedInput: 0,
        output: 0,
      },
    };

    provider.models.push(transformedModel);
  });

  return Array.from(providersMap.values());
}

/**
 * 从 OpenRouter 获取并转换模型列表
 * @returns 转换后的 Provider 数组
 */
export async function fetchModelsFromOpenRouterAPI(): Promise<Provider[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const json = await response.json();
    const rawData = json.data as RawModelData[];

    const filteredData = rawData.filter((model) => {
      const id = model.id.toLowerCase();
      return (
        id.startsWith('anthropic/claude-sonnet') ||
        id.startsWith('anthropic/claude-haiku') ||
        id.startsWith('openai/gpt-5') ||
        id.startsWith('google/gemini-3')
      );
    });

    return transformModels(filteredData);
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}
