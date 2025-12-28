<template>
<SidebarProvider>
  <AppSidebar />
  <SidebarInset class="flex flex-1 flex-col">
    <!-- 头部区域，包含面包屑和主题切换按钮，设置为固定定位，并确保有背景色 -->
    <header class="w-full fixed top-0 bg-white dark:bg-black z-30 flex justify-between lg:h-16 h-20 shrink-0 items-center gap-2 px-4">
      <div class="flex fixed top-4 sm:gap-2">
        <!-- 侧边栏触发器 -->
        <SidebarTrigger class="-ml-2 mt-1" />

        <!-- 模型厂家选择菜单 -->
        <Menubar class="lg:mx-5 px-1 border-none">
          <MenubarMenu>
            <MenubarTrigger class="w-25 sm:w-40 flex items-center justify-between gap-4 font-bold hover:bg-gray-200/50 dark:hover:bg-gray-200/20">
              <div class="flex space-x-2">
                <img :src="selectedProvider.icon" :alt="selectedProvider.name" class="h-5 w-5 dark:filter dark:invert hidden sm:block" />
                <span>{{ selectedProvider.name }}</span>
              </div>
              <div>
                <ChevronDown class="h-4 w-4 hidden sm:flex text-muted-foreground" />
              </div>
            </MenubarTrigger>
            <MenubarContent class="border-none">
              <MenubarItem v-for="provider in providers" :key="provider.id" @select="selectProvider(provider)" class="flex items-center justify-between">
                <div class="flex items-center gap-4 w-40">
                  <img :src="provider.icon" :alt="provider.name" class="h-4 w-4 dark:filter dark:invert" />
                  <span>{{ provider.name }}</span>
                </div>
                <svg v-if="selectedProvider.id === provider.id" class="h-4 w-4 mr-0 icon-md block text-black dark:text-gray-200" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM16.0755 7.93219C16.5272 8.25003 16.6356 8.87383 16.3178 9.32549L11.5678 16.0755C11.3931 16.3237 11.1152 16.4792 10.8123 16.4981C10.5093 16.517 10.2142 16.3973 10.0101 16.1727L7.51006 13.4227C7.13855 13.014 7.16867 12.3816 7.57733 12.0101C7.98598 11.6386 8.61843 11.6687 8.98994 12.0773L10.6504 13.9039L14.6822 8.17451C15 7.72284 15.6238 7.61436 16.0755 7.93219Z" fill="currentColor" />
                </svg>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <!-- 模型选择下拉菜单 -->
        <Select v-model="selectedModel">
          <SelectTrigger class="pointer-cursor relative flex items-center justify-between rounded-md border hover:bg-gray-200/50 dark:hover:bg-gray-200/20 border-black/10 bg-white py-2 pl-3 pr-3 text-left focus:outline-none focus:ring-0 focus:ring-offset-0 dark:border-gray-700 dark:bg-black sm:text-sm radix-state-open:bg-gray-50 dark:radix-state-open:bg-gray-700">
            <span class="flex h-6 items-center gap-1 text-gray-800 dark:text-gray-200 text-xs min-w-18.75 font-normal">
              {{ currentModel.name }}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="model in currentProviderModels" :key="model.id" :value="model.id">
                <span class="inline-flex w-full">
                  <span class="flex h-6 items-center gap-1 text-gray-800 dark:text-white text-xs min-w-18.75 font-normal">
                    {{ model.name }}
                  </span>
                </span>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div class="flex fixed top-4 right-0 sm:right-2">
        <!-- 设置图标按钮，在移动端隐藏 -->
        <Button variant="ghost" size="icon" @click="showSettingsSheet = true" class="no-hover hidden lg:inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button>
        <!-- 根据当前颜色模式显示太阳或月亮图标 -->
        <Button variant="ghost" size="icon" @click="toggleDarkMode" class="no-hover">
            <Sun v-if="colorMode.value === 'light'" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </Button>
      </div>
    </header>
    <!-- 主内容区域，增加顶部填充以避免被固定头部遮挡，并占据剩余高度 -->
    <div class="w-full flex-1 pt-20 lg:pt-16">
      <MainChat :selected-provider="selectedProvider" :current-model="currentModel" />
    </div>
  </SidebarInset>

  <!-- 设置弹窗 -->
  <Sheet :open="showSettingsSheet" @update:open="showSettingsSheet = $event">
    <SheetContent side="right" class="sm:max-w-md px-5">
      <SheetHeader>
        <SheetTitle>模型参数设置</SheetTitle>
        <SheetDescription>
          自定义模型参数
        </SheetDescription>
      </SheetHeader>
      <ScrollArea class="h-[calc(100vh-8rem)]">
        <div class="px-4 space-y-6">
          <!-- OpenAI API 设置 -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <Label class="font-medium">OpenAI API 设置</Label>
              <Switch v-model="useCustomApi" />
            </div>

            <!-- 自定义API设置（当SWITCH开启时显示） -->
            <div v-if="useCustomApi" class="space-y-3">
              <!-- API Base URL 设置 -->
              <div class="space-y-2">
                <Label class="text-sm text-muted-foreground">API Base URL</Label>
                <Input v-model="apiBaseUrl" placeholder="https://openrouter.ai/api/v1" class="w-full text-sm px-2 py-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-200/10 dark:text-white" />
              </div>

              <!-- API KEY 设置 -->
              <div class="space-y-2">
                <Label class="text-sm text-muted-foreground">API KEY</Label>
                <Input v-model="apiKey" type="password" placeholder="输入您的 OpenAI API 密钥" class="w-full text-sm px-2 py-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-200/10 dark:text-white" />
              </div>

              <!-- API 测试按钮和状态 -->
              <div class="space-y-2">
                <Button @click="testApi" :disabled="isTestingApi || !apiBaseUrl || !apiKey" variant="outline" class="w-full">
                  <span v-if="!isTestingApi">测试 API</span>
                  <span v-else class="flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                    测试中...
                  </span>
                </Button>
                <!-- 测试结果显示 -->
                <div v-if="apiTestResult" :class="[
                  'text-sm p-2 rounded-md',
                  apiTestResult.success ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                ]">
                  {{ apiTestResult.message }}
                </div>
              </div>
            </div>
          </div>

          <!-- 模型温度设置 -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <Label class="font-medium">采样温度</Label>
              <span class=" text-gray-500">{{ temperature[0] }}</span>
            </div>
            <Slider v-model="temperature" :min="0.0" :max="1.0" :step="0.1" class="w-full mt-4" />
            <div class="flex justify-between text-gray-500">
              <span>0.0</span>
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>

          <!-- 系统提示词设置 -->
          <div class="space-y-4">
            <Label class="font-medium">自定义系统提示词</Label>
            <Textarea v-model="systemPrompt" placeholder="你是一个超级智能的AI大模型，擅长准确理解用户意图，回答用户问题" rows="4" class="w-full mt-4 text-sm px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-200/10 dark:text-white resize-none" />
          </div>

          <!-- 保存和取消按钮 -->
          <div class="flex gap-3 pt-4">
            <Button @click="saveSettings" class="flex-1">
              保存
            </Button>
            <Button variant="outline" @click="showSettingsSheet = false" class="flex-1">
              取消
            </Button>
          </div>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
</SidebarProvider>
</template>

<script setup
  lang="ts">
  import AppSidebar from '~/components/AppSidebar.vue'
  import MainChat from '~/components/MainChat.vue'

  // 导入shadcn/ui的Button组件
  import { Button } from '~/components/ui/button';

  // 导入 Sun, Moon, ChevronDown 图标
  import { Sun, Moon, ChevronDown } from 'lucide-vue-next';

  // 导入 menubar 组件
  import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
  } from '~/components/ui/menubar'

  // 导入 select 组件
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
  } from '~/components/ui/select'

  import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
  } from '~/components/ui/sidebar'

  // 导入 sheet 组件
  import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
  } from '~/components/ui/sheet'

  // 导入 scroll-area 组件
  import { ScrollArea } from '~/components/ui/scroll-area'

  // 导入 label 组件
  import { Label } from '~/components/ui/label'

  // 导入 input 组件
  import { Input } from '~/components/ui/input'

  // 导入 switch 组件
  import { Switch } from '~/components/ui/switch'

  // 导入 slider 组件
  import { Slider } from '~/components/ui/slider'

  // 导入 textarea 组件
  import { Textarea } from '~/components/ui/textarea'

  // useColorMode 由 Nuxt 自动注入，无需手动导入
  const colorMode = useColorMode();

  // 导入会话管理和类型定义
  import { useSessions, type Provider } from '~/composables/useSessions';
  import { useModels } from '~/composables/useModels';

  // 厂家列表
  const { providers, loadModels } = useModels();

  // 自动获取在线模型数据
  onMounted(async () => {
    // 保存当前选择的厂家和模型ID
    const currentProviderId = selectedProvider.value.id;
    const currentModelId = selectedModel.value;

    await loadModels();
    
    // 尝试恢复之前选择的厂家和模型
    const provider = providers.value.find(p => p.id === currentProviderId);
    if (provider) {
      selectedProvider.value = provider;
      
      // 检查之前选择的模型是否还存在
      const model = provider.models.find(m => m.id === currentModelId);
      if (model) {
        selectedModel.value = model.id;
      } else if (provider.models.length > 0 && provider.models[0]) {
        // 如果之前的模型不存在了，使用该厂家的第一个模型
        selectedModel.value = provider.models[0].id;
      }
    } else {
      // 如果当前选中的厂家不在新列表中，重置选中项
      const firstProvider = providers.value[0];
      if (firstProvider) {
        selectedProvider.value = firstProvider;
        selectedModel.value = firstProvider.models[0]?.id || '';
      }
    }
  });

  // 会话管理
  const sessions = useSessions();

  // 当前选中的厂家（确保有默认值）
  const selectedProvider = ref<Provider>(providers.value[0] || {
    id: '',
    name: '',
    icon: '',
    models: []
  });

  // 当前选中的模型
  const selectedModel = ref<string>(selectedProvider.value.models[0]?.id || '');

  // 标志位：是否正在加载会话模型信息（防止watch触发时覆盖）
  const isLoadingSessionModel = ref(false);

  // 控制设置弹窗显示状态
  const showSettingsSheet = ref(false);

  // 设置相关的响应式变量
  const temperature = ref([0.3]);
  const systemPrompt = ref('你是一个超级智能的AI大模型，擅长准确理解用户意图，回答用户问题');

  // OpenAI API 设置
  const useCustomApi = ref(false);
  const apiBaseUrl = ref('');
  const apiKey = ref('');

  // API 测试相关状态
  const isTestingApi = ref(false);
  const apiTestResult = ref<{ success: boolean; message: string } | null>(null);

  // 从本地存储加载设置
  const loadSettingsFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('chat_settings');
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.temperature !== undefined) {
            // 处理温度设置的类型兼容性（可能是数字或数组）
            temperature.value = Array.isArray(settings.temperature)
              ? settings.temperature
              : [settings.temperature];
          }
          if (settings.systemPrompt) systemPrompt.value = settings.systemPrompt;
          if (settings.useCustomApi !== undefined) useCustomApi.value = settings.useCustomApi;
          if (settings.apiBaseUrl !== undefined) apiBaseUrl.value = settings.apiBaseUrl;
          if (settings.apiKey !== undefined) apiKey.value = settings.apiKey;
        }
      } catch (error) {
        console.error('Failed to load settings from localStorage:', error);
      }
    }
  };

  /**
   * @description 从本地存储加载主题偏好设置
   * 如果存在保存的主题偏好，则应用该偏好
   */
  const loadThemePreference = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedPreference = localStorage.getItem('theme_preference');
        if (storedPreference && (storedPreference === 'light' || storedPreference === 'dark')) {
          colorMode.preference = storedPreference;
        }
      } catch (error) {
        console.error('Failed to load theme preference from localStorage:', error);
      }
    }
  };

  // 组件挂载时加载设置、主题偏好和会话模型信息
  onMounted(() => {
    loadSettingsFromLocalStorage();
    loadThemePreference();
    loadSessionModelInfo();
  });

  // 监听当前会话变化，同步模型信息
  watch(() => sessions?.currentSession?.value, (newSession) => {
    if (newSession) {
      loadSessionModelInfo();
    }
  });

  /**
   * @description 从当前会话加载模型信息
   */
  const loadSessionModelInfo = () => {
    if (!sessions?.currentSession?.value) {
      return;
    }

    const currentSession = sessions.currentSession.value;

    // 设置标志位，防止 watch 触发
    isLoadingSessionModel.value = true;

    // 根据会话中的 providerId 查找对应的厂家
    const provider = providers.value.find(p => p.id === currentSession.providerId);
    if (provider) {
      selectedProvider.value = provider;

      // 根据会话中的 modelId 查找对应的模型
      const model = provider.models.find(m => m.id === currentSession.modelId);
      if (model) {
        selectedModel.value = model.id;
      } else if (provider.models.length > 0 && provider.models[0]) {
        // 如果找不到对应的模型，使用该厂家的第一个模型
        selectedModel.value = provider.models[0].id;
      }
    }

    // 重置标志位
    nextTick(() => {
      isLoadingSessionModel.value = false;
    });
  };

  // 监听厂家选择变化，更新模型列表
  watch(selectedProvider, (newProvider) => {
    // 如果正在加载会话模型信息，跳过自动更新
    if (isLoadingSessionModel.value) {
      return;
    }

    if (newProvider.models.length > 0 && newProvider.models[0]) {
      selectedModel.value = newProvider.models[0].id;
    }
  });

  // 导入 toast 用于显示提示消息
  import { toast } from 'vue-sonner';

  /**
   * @description 保存设置到本地存储
   */
  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      try {
        // 创建设置对象
        const settings = {
          temperature: temperature.value,
          systemPrompt: systemPrompt.value,
          useCustomApi: useCustomApi.value,
          apiBaseUrl: apiBaseUrl.value,
          apiKey: apiKey.value
        };

        // 保存到本地存储
        localStorage.setItem('chat_settings', JSON.stringify(settings));

        // 显示保存成功的提示
        toast.success('设置已保存到本地存储', {
          position: 'top-center',
          duration: 2000,
        });
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error);
        toast.error('保存设置失败', {
          position: 'top-center',
          duration: 2000,
        });
      }
    }

    // 关闭设置弹窗
    showSettingsSheet.value = false;
  };

  /**
   * @description 获取当前选中的模型对象
   */
  const currentModel = computed(() => {
    const foundModel = selectedProvider.value.models.find(model => model.id === selectedModel.value);
    return foundModel || selectedProvider.value.models[0] || {
      id: '',
      name: '未选择模型',
      pricing: {
        input: 0,
        cachedInput: 0,
        output: 0
      }
    };
  });

  /**
   * @description 获取当前厂家的模型列表
   */
  const currentProviderModels = computed(() => {
    return selectedProvider.value.models;
  });

  /**
   * @description 选择模型厂家
   * @param {Provider} provider - 选择的厂家对象
   */
  const selectProvider = (provider: Provider) => {
    selectedProvider.value = provider;
  };

  /**
   * @description 切换应用的深色/浅色模式
   * 通过改变 colorMode.preference 的值，@nuxtjs/color-mode 模块会自动更新 body 或 html 上的类
   * 同时将用户偏好保存到本地存储，以便下次访问时记住设置
   */
  const toggleDarkMode = () => {
    const newPreference = colorMode.preference === 'dark' ? 'light' : 'dark';
    colorMode.preference = newPreference;

    // 保存主题偏好到本地存储
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme_preference', newPreference);
      } catch (error) {
        console.error('Failed to save theme preference to localStorage:', error);
      }
    }
  };

  /**
   * @description 测试自定义API连接
   */
  const testApi = async () => {
    // 清除之前的测试结果
    apiTestResult.value = null;

    // 验证必填字段
    if (!apiBaseUrl.value || !apiKey.value) {
      apiTestResult.value = {
        success: false,
        message: '请填写完整的 API Base URL 和 API KEY'
      };
      return;
    }

    isTestingApi.value = true;

    try {
      const response = await fetch('/api/chat/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiBaseUrl: apiBaseUrl.value,
          apiKey: apiKey.value,
          model: currentModel.value.id // 传递当前选择的模型ID
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        apiTestResult.value = {
          success: true,
          message: result.message || 'API 连接测试成功！'
        };
        toast.success('API 连接测试成功', {
          position: 'top-center',
          duration: 2000,
        });
      } else {
        apiTestResult.value = {
          success: false,
          message: result.error || result.message || 'API 连接测试失败'
        };
        toast.error('API 连接测试失败', {
          position: 'top-center',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('API测试失败:', error);
      apiTestResult.value = {
        success: false,
        message: error.message || '网络错误，请检查您的网络连接'
      };
      toast.error('API 测试失败', {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      isTestingApi.value = false;
    }
  };


</script>
