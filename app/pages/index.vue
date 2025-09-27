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
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM16.0755 7.93219C16.5272 8.25003 16.6356 8.87383 16.3178 9.32549L11.5678 16.0755C11.3931 16.3237 11.1152 16.4792 10.8123 16.4981C10.5093 16.517 10.2142 16.3973 10.0101 16.1727L7.51006 13.4227C7.13855 13.014 7.16867 12.3816 7.57733 12.0101C7.98598 11.6386 8.61843 11.6687 8.98994 12.0773L10.6504 13.9039L14.6822 8.17451C15 7.72284 15.6238 7.61436 16.0755 7.93219Z" fill="currentColor"></path>
                </svg>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <!-- 模型选择下拉菜单 -->
        <Select v-model="selectedModel">
          <SelectTrigger class="pointer-cursor relative flex items-center justify-between rounded-md border hover:bg-gray-200/50 dark:hover:bg-gray-200/20 border-black/10 bg-white py-2 pl-3 pr-3 text-left focus:outline-none focus:ring-0 focus:ring-offset-0 dark:border-gray-700 dark:bg-black sm:text-sm radix-state-open:bg-gray-50 dark:radix-state-open:bg-gray-700">
            <span class="flex h-6 items-center gap-1 text-gray-800 dark:text-gray-200 text-xs min-w-[75px] font-normal">
              {{ currentModel?.name }}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="model in currentProviderModels" :key="model.id" :value="model.id">
                <span class="inline-flex w-full">
                  <span class="flex h-6 items-center gap-1 text-gray-800 dark:text-white text-xs min-w-[75px] font-normal">
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
        <!-- <Button variant="ghost" size="icon" @click="showSettingsSheet = true" class="no-hover">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button> -->
        <!-- 费用说明图标按钮，在移动端隐藏 -->
        <!-- <Button variant="ghost" size="icon" @click="showPricingSheet = true" class="no-hover hidden sm:flex">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <circle cx="12" cy="12" r="10" stroke-width="1.5"></circle>
                <path d="M12 6V18" stroke-width="1.5" stroke-linecap="round"></path>
                <path
                  d="M15 9.5C15 8.11929 13.6569 7 12 7C10.3431 7 9 8.11929 9 9.5C9 10.8807 10.3431 12 12 12C13.6569 12 15 13.1193 15 14.5C15 15.8807 13.6569 17 12 17C10.3431 17 9 15.8807 9 14.5"
                  stroke-width="1.5" stroke-linecap="round"></path>
              </g>
            </svg>
          </Button> -->
        <!-- 根据当前颜色模式显示太阳或月亮图标 -->
        <!-- <Button variant="ghost" size="icon" @click="toggleDarkMode" class="no-hover">
            <Sun v-if="colorMode.value === 'light'" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </Button> -->
      </div>
    </header>
    <!-- 主内容区域，增加顶部填充以避免被固定头部遮挡，并占据剩余高度 -->
    <div class="w-full flex-1 pt-20 lg:pt-16">
      <MainChat :selected-provider="selectedProvider" :current-model="currentModel" />
    </div>
  </SidebarInset>

  <!-- 价格说明弹窗 -->
  <Sheet :open="showPricingSheet" @update:open="showPricingSheet = $event">
    <SheetContent side="right" class="sm:max-w-md px-5">
      <SheetHeader>
        <SheetTitle>模型价格说明</SheetTitle>
        <SheetDescription>
          所有模型的价格信息（单位：美元/百万tokens）
        </SheetDescription>
      </SheetHeader>
      <ScrollArea class="h-[calc(100vh-8rem)]">
        <div class="space-y-2 px-2">
          <div v-for="provider in providers" :key="provider.id" class="border-b border-gray-200 dark:border-gray-700 py-4 last:border-b-0">
            <h3 class="font-semibold text-lg mb-2 flex items-center gap-2">
              <img :src="provider.icon" :alt="provider.name" class="h-5 w-5 dark:filter dark:invert" />
              {{ provider.name }}
            </h3>
            <div class="space-y-2">
              <div v-for="model in provider.models" :key="model.id" class="pb-2">
                <h4 class="font-medium text-sm mb-2">{{ model.name }}</h4>
                <div class="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div class="text-muted-foreground">输入价格(缓存未命中):</div>
                  <div class="text-right">${{ model.pricing.input }}</div>
                  <div class="text-muted-foreground">输入价格(缓存命中):</div>
                  <div class="text-right">${{ model.pricing.cachedInput }}</div>
                  <div class="text-muted-foreground">输出价格:</div>
                  <div class="text-right">${{ model.pricing.output }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>

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
          <!-- 模型厂家自定义API设置 -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <Label class="font-medium">模型自定义设置</Label>
            </div>
            <div v-for="provider in providers" :key="provider.id" class="space-y-3 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
              <!-- 厂家名称和SWITCH开关 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <img :src="provider.icon" :alt="provider.name" class="h-4 w-4 dark:filter dark:invert" />
                  <span>{{ provider.name }}</span>
                </div>
                <Switch v-model="providerSettings[provider.id]?.useCustomApi" @update:model-value="initProviderSettings(provider.id)" />
              </div>

              <!-- 自定义API设置（当SWITCH开启时显示） -->
              <div v-if="providerSettings[provider.id]?.useCustomApi" class="pl-6 space-y-3">
                <!-- API Base URL 设置 -->
                <div class="space-y-2">
                  <Label class="text-sm text-muted-foreground">API Base URL</Label>
                  <Input v-model="providerSettings[provider.id]?.apiBaseUrl" :placeholder="getDefaultApiBaseUrl(provider.id)" class="w-full text-sm px-2 py-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-200/10 dark:text-white" />
                </div>

                <!-- API KEY 设置 -->
                <div class="space-y-2">
                  <Label class="text-sm text-muted-foreground">API KEY</Label>
                  <Input v-model="providerSettings[provider.id]?.apiKey" type="password" placeholder="输入您的API密钥" class="w-full text-sm px-2 py-1 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-200/10 dark:text-white" />
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

  // useColorMode 由 Nuxt 自动注入，无需手动导入
  const colorMode = useColorMode();

  // 导入模型数据
  import modelData from '~/data/models.json';

  // 导入会话管理和类型定义
  import { useSessions, type Provider } from '~/composables/useSessions';

  // 厂家列表
  const providers = ref<Provider[]>(modelData.providers);

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

  // 控制价格说明弹窗显示状态
  const showPricingSheet = ref(false);

  // 控制设置弹窗显示状态
  const showSettingsSheet = ref(false);

  // 设置相关的响应式变量
  const temperature = ref([0.3]);
  const systemPrompt = ref('你是一个超级智能的AI大模型，擅长准确理解用户意图，回答用户问题');

  // 厂家自定义API设置
  const providerSettings = ref<Record<string, {
    useCustomApi: boolean;
    apiBaseUrl: string;
    apiKey: string;
  }>>({});

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
          if (settings.providerSettings) providerSettings.value = settings.providerSettings;
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

    // 初始化所有厂家的设置
    providers.value.forEach(provider => {
      initProviderSettings(provider.id);
    });
  });

  // 监听设置弹窗打开，确保所有厂家设置都已初始化
  watch(showSettingsSheet, (isOpen) => {
    if (isOpen) {
      // 确保所有厂家的设置都已初始化
      providers.value.forEach(provider => {
        initProviderSettings(provider.id);
      });
    }
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
  };

  // 监听厂家选择变化，更新模型列表
  watch(selectedProvider, (newProvider) => {
    if (newProvider.models.length > 0 && newProvider.models[0]) {
      selectedModel.value = newProvider.models[0].id;
    }
  });

  // 导入 toast 用于显示提示消息
  import { toast } from 'vue-sonner';

  /**
   * @description 初始化厂家设置
   * @param {string} providerId - 厂家ID
   */
  const initProviderSettings = (providerId: string) => {
    if (!providerSettings.value[providerId]) {
      providerSettings.value[providerId] = {
        useCustomApi: false,
        apiBaseUrl: getDefaultApiBaseUrl(providerId),
        apiKey: ''
      };
    }
  };

  /**
   * @description 获取默认的API Base URL
   * @param {string} providerId - 厂家ID
   * @returns {string} 默认的API Base URL
   */
  const getDefaultApiBaseUrl = (providerId: string): string => {
    const defaultUrls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      google: 'https://generativelanguage.googleapis.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      xai: 'https://api.x.ai/v1'
    };
    return defaultUrls[providerId] || 'https://api.openai.com/v1';
  };

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
          providerSettings: providerSettings.value
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


</script>
