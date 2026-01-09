<template>
<Sidebar v-bind="props" :open="isMobile ? openMobile : open" @update:open="(val: boolean) => isMobile ? setOpenMobile(val) : setOpen(val)">
  <SidebarContent>
    <!-- New Chat Button -->
    <div class="sticky bg-sidebar left-0 right-0 top-0 z-20 pt-3.5 dark:bg-gray-750 p-2">
      <div class="pb-0.5 last:pb-0 rounded-lg" tabindex="0">
        <SidebarMenuButton type="button" @click="onCreateNewSession" class="group flex h-10 items-center gap-2 rounded-lg px-2 font-medium w-full justify-start text-token-text-primary hover:bg-gray-200/50 dark:hover:bg-gray-200/10">
          <div class="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            创建新会话
          </div>
          <span class="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-black dark:text-white h-4.5 w-4.5">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M16.7929 2.79289C18.0118 1.57394 19.9882 1.57394 21.2071 2.79289C22.4261 4.01184 22.4261 5.98815 21.2071 7.20711L12.7071 15.7071C12.5196 15.8946 12.2652 16 12 16H9C8.44772 16 8 15.5523 8 15V12C8 11.7348 8.10536 11.4804 8.29289 11.2929L16.7929 2.79289ZM19.7929 4.20711C19.355 3.7692 18.645 3.7692 18.2071 4.2071L10 12.4142V14H11.5858L19.7929 5.79289C20.2308 5.35499 20.2308 4.64501 19.7929 4.20711ZM6 5C5.44772 5 5 5.44771 5 6V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V14C19 13.4477 19.4477 13 20 13C20.5523 13 21 13.4477 21 14V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6C3 4.34314 4.34315 3 6 3H10C10.5523 3 11 3.44771 11 4C11 4.55228 10.5523 5 10 5H6Z" fill="currentColor" />
            </svg>
          </span>
        </SidebarMenuButton>
      </div>
    </div>
    <!-- 动态生成会话列表 -->
    <div v-for="group in groupedSessions" :key="group.groupName">
      <SidebarGroup>
        <SidebarGroupLabel>{{ group.groupName }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <!-- 遍历分组后的会话 -->
            <SidebarMenuItem v-for="session in group.sessions" :key="session.id" :class="{ 'rounded-sm': currentSessionId === session.id }">
              <SidebarMenuButton @click="handleSelectSession(session.id)" @mouseenter="hoveredSessionId = session.id" @mouseleave="hoveredSessionId = null" :class="['w-full flex items-center justify-between hover:bg-gray-200/50 dark:hover:bg-gray-200/10',
                { 'bg-gray-300/50 dark:bg-gray-200/10 rounded-sm': currentSessionId === session.id }]">
                <img :src="getProviderIcon(session.providerId)" :alt="session.providerId" class="h-4 w-4 dark:filter dark:invert shrink-0 text-gray-500 dark:text-gray-400 mr-2" />
                <div class="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                  {{ session.title || '新会话' }}
                </div>
                <button v-show="hoveredSessionId === session.id" @click.stop="confirmDeleteSession(session.id)" class="ml-2 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-800 text-red-500 flex transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
    <!-- 如果没有历史会话，则显示提示信息 -->
    <SidebarMenuItem v-if="sessions.length === 0">
      <span class="text-sm text-muted-foreground px-2 py-1">暂无历史会话</span>
    </SidebarMenuItem>
  </SidebarContent>
  <SidebarRail />
</Sidebar>

<!-- 删除确认弹窗 -->
<AlertDialog :open="showDeleteConfirmDialog" @update:open="showDeleteConfirmDialog = $event">
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确定要删除这个会话吗？</AlertDialogTitle>
      <AlertDialogDescription>
        此操作无法撤销。这将永久删除此会话及其所有内容。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction @click="executeDelete">删除</AlertDialogAction>
      <AlertDialogCancel @click="cancelDelete">取消</AlertDialogCancel>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
</template>

<script setup
  lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue';

  import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    type SidebarProps,
    SidebarRail,
  } from '~/components/ui/sidebar'

  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '~/components/ui/alert-dialog'

  import { useSidebar } from '~/components/ui/sidebar/utils'; // 引入 useSidebar
  import { useSessions } from '~/composables/useSessions'; // 引入 useSessions
  import { useModels } from '~/composables/useModels';

  // 厂家列表
  const { providers } = useModels();

  /**
   * @description 根据厂家ID获取厂家图标
   * @param {string} providerId - 厂家ID
   * @returns {string} 厂家图标路径
   */
  const getProviderIcon = (providerId: string): string => {
    const provider = providers.value.find(p => p.id === providerId);
    return provider?.icon || '/openai.svg'; // 默认图标
  };

  const props = defineProps<SidebarProps>();

  // 使用我们自定义的 useSessions Composable
  const sessionsStore = useSessions();
  if (!sessionsStore) {
    throw new Error('Sessions store is not available');
  }
  const { sessions, currentSessionId,
    createNewSession,
    selectSession,
    deleteSession, } = sessionsStore;

  const sidebar = useSidebar(); // 从 useSidebar 获取相关状态和方法
  const { isMobile, openMobile, setOpenMobile } = sidebar;
  const open = sidebar.open;
  const setOpen = sidebar.setOpen;

  /**
   * @description 对会话进行排序和分组的计算属性
   * @returns {Array<{groupName: string, sessions: any[]}>} - 返回一个包含分组名称和会话数组的对象数组
   */
  const groupedSessions = computed(() => {
    const groups: Record<string, any[]> = {};
    // 显式初始化groups对象
    Object.keys(groups).forEach(key => {
      groups[key] = [];
    });
    const now = new Date();
    // 创建不带时间的日期对象，以便于按天比较
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. 先对所有会话按创建时间倒序排序
    const sortedSessions = [...sessions.value].sort((a, b) =>
      (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)
    );

    // 2. 遍历排序后的会话并进行分组
    for (const session of sortedSessions) {
      // 确保 session.createdAt 存在
      if (!session.createdAt) continue;

      const sessionDate = new Date(session.createdAt);
      const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

      let groupKey = '';

      if (sessionDay.getTime() === today.getTime()) {
        groupKey = '今天';
      } else if (sessionDay.getTime() === yesterday.getTime()) {
        groupKey = '昨天';
      } else if (sessionDay >= thirtyDaysAgo) {
        groupKey = '过去30天';
      } else if (sessionDate.getFullYear() === now.getFullYear()) {
        // 本年度，超过30天的，按月份分组
        groupKey = `${sessionDate.getMonth() + 1}月`;
      } else {
        // 往年，按年份分组
        groupKey = `${sessionDate.getFullYear()}年`;
      }

      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey]!.push(session); // 使用非空断言
    }

    // 3. 定义分组的显示顺序并对分组键进行排序
    const groupOrder = ["今天", "昨天", "过去30天"];
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const indexA = groupOrder.indexOf(a);
      const indexB = groupOrder.indexOf(b);

      // 如果都在预设顺序中，按预设顺序排
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // 如果只有一个在，让它排在前面
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // 按月份排序 (例如 "8月", "7月")
      if (a.endsWith('月') && b.endsWith('月')) {
        return parseInt(b) - parseInt(a); // 月份数字大的排前面
      }
      // 按年份排序 (例如 "2024年", "2023年")
      if (a.endsWith('年') && b.endsWith('年')) {
        return parseInt(b) - parseInt(a); // 年份大的排前面
      }

      // 处理月份和年份混合的情况，年份总是在月份之后
      if (a.endsWith('年') && b.endsWith('月')) return 1;
      if (a.endsWith('月') && b.endsWith('年')) return -1;

      return 0;
    });

    // 4. 根据排序后的键创建最终的数组，以保证模板渲染顺序
    return sortedGroupKeys.map(key => ({
      groupName: key,
      sessions: groups[key] || [] // 确保sessions始终是数组
    }));
  });


  // --- 鼠标悬停状态，用于控制删除按钮显示 ---
  const hoveredSessionId = ref<string | null>(null); // 存储当前鼠标悬停的会话ID

  // --- 删除确认弹窗相关状态 ---
  const showDeleteConfirmDialog = ref(false); // 控制删除确认弹窗的显示
  const sessionToDeleteId = ref<string | null>(null); // 存储待删除会话的ID

  /**
   * @description 创建新会话，并自动切换到新会话
   */
  const onCreateNewSession = () => {
    const newSessionId = createNewSession();
    // 在移动设备上，创建新会话后可以考虑自动收起侧边栏，提供更好的体验
    if (isMobile.value) {
      setOpenMobile(false);
    }
  };

  /**
   * @description 弹出删除确认弹窗
   * @param {string} id - 待删除会话的 ID
   */
  const confirmDeleteSession = (id: string) => {
    sessionToDeleteId.value = id;
    showDeleteConfirmDialog.value = true;
  };

  /**
   * @description 执行删除操作
   */
  const executeDelete = () => {
    if (sessionToDeleteId.value) {
      deleteSession(sessionToDeleteId.value);
      sessionToDeleteId.value = null; // 清除待删除 ID
      showDeleteConfirmDialog.value = false; // 关闭弹窗
    }
  };

  /**
   * @description 取消删除操作
   */
  const cancelDelete = () => {
    sessionToDeleteId.value = null; // 清除待删除 ID
    showDeleteConfirmDialog.value = false; // 关闭弹窗
  };

  /**
   * @description 处理键盘事件，用于 Del 键删除
   * @param {KeyboardEvent} event - 键盘事件对象
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    // 检查是否按下 Del 键
    if (event.key === 'Delete' || event.key === 'Del') {
      // 确保当前焦点不在输入框或文本域中，避免误删
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

      if (!isInputFocused && currentSessionId.value) {
        // 阻止默认的浏览器行为，例如在某些浏览器中可能会后退
        event.preventDefault();
        // 直接删除会话，不再弹出确认框
        deleteSession(currentSessionId.value);
      }
    }
  };

  // 监听键盘事件，用于 Del 键删除
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  // 在组件卸载时移除事件监听器，防止内存泄漏
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  /**
   * @description 在选择会话时，直接选择会话
   * @param {string} id - 要选择的会话 ID
   */
  const handleSelectSession = async (id: string) => {
    // 直接选择会话，useSessions内部会处理本地存储和事件触发
    selectSession(id);

    // 在移动设备上，选择会话后自动收起侧边栏
    if (isMobile.value) {
      setOpenMobile(false);
    }
  };
</script>

<style scoped>
/* 可以在此处添加额外的样式，或者依赖Tailwind CSS */
</style>
