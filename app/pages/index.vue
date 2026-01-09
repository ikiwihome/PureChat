<template>
<SidebarProvider>
  <AppSidebar />
  <SidebarInset class="flex flex-1 flex-col">
    <!-- 头部区域，包含面包屑和主题切换按钮，设置为固定定位，并确保有背景色 -->
    <header class="w-full fixed top-0 bg-white dark:bg-black z-30 flex justify-between lg:h-16 h-20 shrink-0 items-center gap-2 px-4">
      <div class="flex fixed top-4 sm:gap-2">
        <!-- 侧边栏触发器 -->
        <SidebarTrigger class="-ml-2 mt-1" />
      </div>
      <div class="flex fixed top-4 right-0 sm:right-2">
        <!-- 根据当前颜色模式显示太阳或月亮图标 -->
        <Button variant="ghost" size="icon" @click="toggleDarkMode" class="no-hover">
            <Sun v-if="colorMode.value === 'light'" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </Button>
      </div>
    </header>
    <!-- 主内容区域，增加顶部填充以避免被固定头部遮挡，并占据剩余高度 -->
    <div class="w-full flex-1 pt-20 lg:pt-16">
      <MainChat />
    </div>
  </SidebarInset>
</SidebarProvider>
</template>

<script setup
  lang="ts">
  import AppSidebar from '~/components/AppSidebar.vue'
  import MainChat from '~/components/MainChat.vue'

  // 导入shadcn/ui的Button组件
  import { Button } from '~/components/ui/button';

  // 导入 Sun, Moon 图标
  import { Sun, Moon } from 'lucide-vue-next';

  // 导入 shadcn/ui 组件
  import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
  } from '~/components/ui/sidebar'

  // useColorMode 由 Nuxt 自动注入，无需手动导入
  const colorMode = useColorMode();

  // 导入会话管理和类型定义
  import { useSessions } from '~/composables/useSessions';

  // 自动获取在线模型数据
  onMounted(async () => {
    loadThemePreference();
    
    // 恢复选择
    loadSessionModelInfo();
  });

  // 会话管理
  const sessions = useSessions();

  /**
   * @description 从本地存储加载主题偏好设置
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

  // 监听当前会话变化
  watch(() => sessions?.currentSession?.value, (newSession) => {
    if (newSession) {
      loadSessionModelInfo();
    }
  });

  /**
   * @description 从当前会话加载模型信息
   */
  const loadSessionModelInfo = () => {
    // 逻辑简化，不再需要手动切换 UI 状态
    if (!sessions?.currentSession?.value) {
      return;
    }
  };

  /**
   * @description 切换应用的深色/浅色模式
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
