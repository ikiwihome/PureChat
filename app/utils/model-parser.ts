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

export async function fetchAndTransformModels(): Promise<Provider[]> {
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
