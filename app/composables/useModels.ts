import { ref } from 'vue';
import type { Provider } from '~/composables/useSessions';
import modelData from '~/data/models.json';
import { transformModels, fetchModelsFromOpenRouterAPI, fetchModelsFromOpenAICompatibleAPI } from '~/utils/model-parser';

// 全局状态
const providers = ref<Provider[]>(transformModels(modelData.data));
const isLoading = ref(false);

/**
 * 判断是否为 OpenRouter 的 URL
 */
function isOpenRouterUrl(url: string): boolean {
  return url.toLowerCase().includes('openrouter.ai');
}

export const useModels = () => {
  const loadModels = async (baseUrl?: string, apiKey?: string) => {
    isLoading.value = true;
    try {
      let onlineProviders: Provider[] = [];

      // 如果提供了 baseUrl 和 apiKey，根据 baseUrl 判断使用哪个方法
      if (baseUrl && apiKey) {
        if (isOpenRouterUrl(baseUrl)) {
          // 如果是 OpenRouter，使用专用的方法
          onlineProviders = await fetchModelsFromOpenRouterAPI();
        } else {
          // 否则使用 OpenAI 兼容 API 方法
          onlineProviders = await fetchModelsFromOpenAICompatibleAPI(baseUrl, apiKey);
        }
      } else {
        // 如果没有提供参数，默认使用 OpenRouter 公开方法
        onlineProviders = await fetchModelsFromOpenRouterAPI();
      }

      if (onlineProviders.length > 0) {
        // 使用splice方法原地更新数组，而不是替换整个引用
        // 这样可以减少响应式更新的副作用
        providers.value.splice(0, providers.value.length, ...onlineProviders);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      // Fallback is already set by default value
    } finally {
      isLoading.value = false;
    }
  };

  return {
    providers,
    isLoading,
    loadModels,
  };
};
