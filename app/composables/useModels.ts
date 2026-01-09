import { ref } from 'vue';
import type { Provider } from '~/composables/useSessions';

// 全局状态 - 硬编码 Xiaomi 厂家和 MiMo 模型
const providers = ref<Provider[]>([
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    icon: '/openai.svg', // 可以根据需要更换图标
    models: [
      {
        id: 'mimo-v2-flash',
        name: '空灵智语AI',
        pricing: {
          input: 0,
          cachedInput: 0,
          output: 0
        }
      }
    ]
  }
]);
const isLoading = ref(false);

export const useModels = () => {
  const loadModels = async (baseUrl?: string, apiKey?: string) => {
    // 逻辑已删除，现在使用硬编码的列表
    return;
  };

  return {
    providers,
    isLoading,
    loadModels,
  };
};
