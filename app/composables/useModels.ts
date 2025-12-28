import { ref } from 'vue';
import type { Provider } from '~/composables/useSessions';
import modelData from '~/data/models.json';
import { transformModels, fetchAndTransformModels } from '~/utils/model-parser';

// 全局状态
const providers = ref<Provider[]>(transformModels(modelData.data));
const isLoading = ref(false);

export const useModels = () => {
  const loadModels = async () => {
    isLoading.value = true;
    try {
      const onlineProviders = await fetchAndTransformModels();
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
