<template>
  <div :key="forceUpdateKey" class="flex flex-col h-full lg:mx-auto lg:w-2/3">
    <!-- 消息列表区域 -->
    <div ref="messagesContainer" class="flex-1 min-h-0 p-4 space-y-6 mr-2 lg:mr-8">
      <!-- 欢迎消息 - 显示当没有当前会话或当前会话没有消息时 -->
      <div v-if="!currentSessionId || !currentSession?.messages.length" class="flex items-center justify-center h-full">
        <div class="text-center max-w-md mx-auto">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-200/10 rounded-full flex items-center justify-center">
            <img :src="props.selectedProvider.icon" :alt="props.selectedProvider.name"
              class="h-8 w-8 dark:filter dark:invert" />
          </div>
          <h2 class="mb-5 max-w-[75vh] px-12 text-center text-lg font-medium dark:text-white md:px-0 md:text-2xl">
            {{ !currentSessionId ? '请选择一个会话或创建新会话' : '我今天能帮你做什么？' }}</h2>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-for="(message, index) in currentSession?.messages" :key="message.id"
        class="flex mb-10 flex-col items-start">

        <!-- 头像和名称区域 - 放在消息内容框外部左上角 -->
        <div class="flex items-center mb-1 justify-start space-x-2">
          <!-- 用户消息：头像在左侧，名称在右侧 -->
          <div v-if="message.role === 'user'" class="flex items-center space-x-2">
            <!-- 头像 -->
            <Avatar class="w-6 h-6">
              <AvatarFallback class="bg-blue-300 text-white text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </AvatarFallback>
            </Avatar>
            <!-- 名称 -->
            <span class="text-sm select-none font-semibold">
              用户
            </span>
          </div>

          <!-- AI消息：头像在左侧，名称在右侧 -->
          <div v-else class="flex items-center space-x-2">
            <!-- 头像 - 使用消息创建时的厂家图标 -->
            <Avatar class="w-6 h-6">
              <AvatarFallback class="bg-gray-300 text-white text-xs">
                <img :src="getProviderIcon(message.providerId)" :alt="getProviderName(message.providerId)"
                  class="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <!-- 名称 - 使用消息创建时的模型名称 -->
            <span class="text-sm select-none font-semibold">
              {{ getModelName(message.providerId, message.modelId) }}
            </span>
          </div>

          <!-- 加载指示器 -->
          <div v-if="isLoading && message.role === 'assistant'" class="flex justify-start">
            <div
              class="rounded-xl px-4 py-2 mx-2 md:mx-4 lg:mx-8 bg-gray-200/20 dark:bg-gray-800/20 text-gray-800 dark:text-gray-200">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI消息内容框 - 仅在内容不为空时显示 -->
        <div v-if="message.role === 'assistant' && message.content" :class="[
          'w-full max-w-full rounded-sm px-4 py-3 mx-2 md:mx-4 lg:mx-8',
          'bg-gray-200/20 dark:bg-gray-800/20 text-gray-800 dark:text-gray-200'
        ]">
          <div class="break-all break-words overflow-wrap-anywhere markdown-content"
            v-html="renderMarkdown(message.content)">
          </div>
        </div>

        <!-- 用户消息内容框 - 始终显示 -->
        <div v-else-if="message.role === 'user'" :class="[
          'w-full max-w-full rounded-sm px-4 py-3 mx-2 md:mx-4 lg:mx-8',
          'bg-gray-200/50 dark:bg-gray-600/20 text-gray-800 dark:text-gray-200'
        ]">
          <div class="break-all break-words overflow-wrap-anywhere">{{ message.content }}</div>
        </div>

        <!-- 消息操作区域 - 放在消息框外部下方，仅在消息有内容时显示 -->
        <div v-if="message.content"
          class="flex items-center justify-between mt-1 w-full max-w-full px-4 mx-2 md:mx-4 lg:mx-8">
          <!-- 左侧：消息时间和操作按钮 -->
          <div class="flex items-center space-x-2">
            <!-- 消息时间 -->
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTime(message.timestamp) }}
            </span>

            <!-- 复制到剪贴板按钮 -->
            <button @click="copyToClipboard(message.content)"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="复制到剪贴板">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="text-gray-600 dark:text-gray-300">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>

            <!-- 重新生成按钮（仅对AI消息显示） -->
            <button v-if="message.role === 'assistant'" @click="regenerateMessage(index)"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="重新生成">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="text-gray-600 dark:text-gray-300">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>

          <!-- 右侧：统计信息（仅对AI消息显示） -->
          <div v-if="message.role === 'assistant' && message.stats" class="flex items-center space-x-2">
            <div class="text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              <!-- 第一个token时间 -->
              <span class="text-xs" v-if="message.stats.firstTokenTime !== undefined"
                :title="`首字时延${message.stats.firstTokenTime || 0}ms`">
                {{ message.stats.firstTokenTime }}ms
              </span>
              <!-- token统计 -->
              <span class="text-xs" v-if="message.stats.promptTokens !== undefined"
                :title="`输入${message.stats.promptTokens || 0}tokens`">
                {{ message.stats.promptTokens || 0 }}↑
              </span>
              <span class="text-xs" v-if="message.stats.cachedTokens !== undefined"
                :title="`缓存命中${message.stats.cachedTokens || 0}tokens`">
                ↑{{ message.stats.cachedTokens || 0 }}
              </span>
              <span class="text-xs" v-if="message.stats.completionTokens !== undefined"
                :title="`输出${message.stats.completionTokens || 0}tokens`">
                {{ message.stats.completionTokens || 0 }}↓
              </span>
              <!-- 总耗时 -->
              <span class="text-xs" v-if="message.stats.totalTime !== undefined"
                :title="`总耗时${message.stats.totalTime || 0}ms`">
                {{ message.stats.totalTime }}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div
      class="border-t border-gray-200 dark:border-gray-800 p-4 lg:p-4 bg-white dark:bg-gray-950 sticky bottom-0 z-10">
      <form @submit.prevent="handleSendMessage">
        <div class="flex-1 relative overflow-hidden">
          <textarea ref="inputRef" v-model="inputMessage" placeholder="输入您的问题..."
            class="min-h-[40px] max-h-[200px] resize-none pl-8 pr-10 sm:pr-12 py-[10px] break-all break-words overflow-wrap-anywhere border-2 placeholder:text-muted-foreground focus-visible:ring-0 focus:outline-none focus:ring-0 focus:ring-opacity-0 focus:ring-offset-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-2xl bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-md"
            :disabled="isLoading" @keydown="handleKeydown" />
          <Button type="submit" size="icon" class="absolute right-4 bottom-2 h-8 w-8"
            :disabled="!inputMessage.trim() || isLoading">
            <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </Button>
        </div>
      </form>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>

    <!-- Toaster 通知组件 -->
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Toaster, toast } from 'vue-sonner';
import { useSessions, type Message, type Session, type Provider, type Model } from '~/composables/useSessions';
import { marked } from 'marked';

// 导入模型数据
import modelData from '~/data/models.json';


// 定义props接收选中的厂家和模型
const props = defineProps<{
  selectedProvider: Provider;
  currentModel: Model;
}>();

const sessionsStore = useSessions();
const sessions = computed(() => sessionsStore?.sessions?.value || []);
const currentSessionId = computed(() => sessionsStore?.currentSessionId?.value || null);
const currentSession = computed(() => sessionsStore?.currentSession?.value || null);
const addMessageToCurrentSession = (message: Message) => sessionsStore?.addMessageToCurrentSession(message);
const selectSession = (sessionId: string) => sessionsStore?.selectSession(sessionId);
const saveSessionsToLocalStorage = () => sessionsStore?.saveSessionsToLocalStorage();
const createMessage = (content: string, role: 'user' | 'assistant', providerId?: string, modelId?: string): Message => {
  const message = sessionsStore?.createMessage(content, role, providerId, modelId);
  if (message) {
    return message;
  }

  // 后备方案：如果 sessionsStore 不可用，创建一个基本的 Message 对象
  return {
    id: Date.now().toString(),
    content,
    role,
    timestamp: new Date().toISOString(),
    providerId,
    modelId
  };
};

const inputMessage = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const messagesContainer = ref<HTMLDivElement | null>(null);
const isLoading = ref(false);
const forceUpdateKey = ref(0); // 用于强制组件重新渲染

/**
 * @description 根据厂家ID获取厂家图标
 * @param {string} providerId - 厂家ID
 * @returns {string} 厂家图标URL
 */
const getProviderIcon = (providerId?: string): string => {
  if (!providerId) return props.selectedProvider.icon;

  const provider = modelData.providers.find(p => p.id === providerId);
  return provider?.icon || props.selectedProvider.icon;
};

/**
 * @description 根据厂家ID获取厂家名称
 * @param {string} providerId - 厂家ID
 * @returns {string} 厂家名称
 */
const getProviderName = (providerId?: string): string => {
  if (!providerId) return props.selectedProvider.name;

  const provider = modelData.providers.find(p => p.id === providerId);
  return provider?.name || props.selectedProvider.name;
};

/**
 * @description 根据厂家ID和模型ID获取模型名称
 * @param {string} providerId - 厂家ID
 * @param {string} modelId - 模型ID
 * @returns {string} 模型名称
 */
const getModelName = (providerId?: string, modelId?: string): string => {
  if (!providerId || !modelId) return props.currentModel.name;

  const provider = modelData.providers.find(p => p.id === providerId);
  const model = provider?.models.find(m => m.id === modelId);
  return model?.name || props.currentModel.name;
};

/**
 * @description 格式化日期为 ISO 8601 字符串格式
 * @param {Date} date - 日期对象
 * @returns {string} ISO 8601 格式的日期字符串
 */
const formatDate = (date: Date): string => {
  return date.toISOString()
}

/**
 * @description 格式化时间显示为 YYYY-MM-DD HH-MM-SS 格式
 * @param {string} timestamp - ISO 8601 格式的时间字符串
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * @description 渲染Markdown内容为HTML
 * @param {string} content - Markdown格式的文本内容
 * @returns {string} 渲染后的HTML内容
 */
const renderMarkdown = (content: string): string => {
  if (!content) return '';

  try {
    // 配置marked选项，禁用不安全的HTML渲染
    marked.setOptions({
      breaks: true, // 将换行符转换为<br>
      gfm: true,    // 启用GitHub风格的Markdown
    });

    // marked.parse可能返回Promise，需要同步处理
    const result = marked.parse(content);

    // 如果是Promise，返回占位符，实际项目中应该使用异步处理
    if (result instanceof Promise) {
      return content; // 暂时返回原始内容
    }

    return result as string;
  } catch (error) {
    return content; // 如果渲染失败，返回原始文本
  }
};

/**
 * @description 处理键盘事件
 * @param {KeyboardEvent} event - 键盘事件对象
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  }
};

/**
 * @description 调用AI API获取回复（共享的API调用逻辑）
 * @param {Message[]} messages - 要发送的消息数组
 * @param {Function} onContentUpdate - 内容更新回调函数
 * @param {Function} onStatsUpdate - 统计信息更新回调函数
 * @returns {Promise<void>}
 */
const callAIApi = async (messages: Message[], onContentUpdate: (content: string) => void, onStatsUpdate: (stats: any) => void) => {
  // 从本地存储获取设置
  let customApiConfig = {};
  let temperatureValue = 0.3; // 默认温度值
  let systemPromptValue = ''; // 默认系统提示词

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('chat_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.providerSettings) {
          customApiConfig = settings.providerSettings;
        }
        if (settings.temperature !== undefined) {
          temperatureValue = settings.temperature;
        }
        if (settings.systemPrompt !== undefined) {
          systemPromptValue = settings.systemPrompt;
        }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }

  // 调用后端API获取AI回复（启用流式传输）
  const response = await fetch('/api/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: props.selectedProvider.id,
      model: props.currentModel.id,
      messages: messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: temperatureValue,
      max_tokens: 4096,
      customApiConfig: customApiConfig,
      systemPrompt: systemPromptValue,
      stream: true // 启用流式传输
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // 处理流式响应
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let accumulatedContent = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // 处理流式响应格式 - 正确的SSE格式使用单个换行符分割
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          // 处理流结束标记
          if (data === '[DONE]') {
            // 流结束，继续处理下一个数据块
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            // 处理服务端发送的统计信息数据块（包含usage字段的数据块）
            if (parsed.usage !== null && parsed.usage !== undefined) {
              // 直接从服务端响应中提取统计信息
              const stats = {
                firstTokenTime: parsed.stats?.firstTokenTime || 0,
                totalTime: parsed.stats?.totalTime || 0,
                promptTokens: parsed.usage.prompt_tokens || 0,
                cachedTokens: parsed.usage.prompt_tokens_details?.cached_tokens || 0,
                completionTokens: parsed.usage.completion_tokens || 0
              };

              // 立即调用统计信息更新回调
              onStatsUpdate(stats);

              // 统计信息数据块不需要更新消息内容，继续处理下一个数据块
              continue;
            }

            // 处理OpenAI兼容的流式响应内容
            if (parsed.choices && parsed.choices[0]?.delta?.content !== undefined) {
              const contentChunk = parsed.choices[0].delta.content || '';
              accumulatedContent += contentChunk;
              onContentUpdate(accumulatedContent);
            }
          } catch (e) {
            console.warn('Failed to parse stream data:', e, 'Data:', data);
          }
        }
      }
    }
  }
};

/**
 * @description 发送消息处理
 */
const handleSendMessage = async () => {
  const message = inputMessage.value.trim();
  if (!message || isLoading.value) return;

  // 添加用户消息（使用 createMessage 函数确保类型正确）
  const userMessage = createMessage(message, 'user', props.selectedProvider.id, props.currentModel.id);
  addMessageToCurrentSession(userMessage);

  inputMessage.value = '';
  isLoading.value = true;

  // 滚动到底部
  scrollToBottom();

  try {
    // 创建AI消息占位符用于流式显示
    const aiMessage = createMessage(
      '', // 初始为空内容
      'assistant',
      props.selectedProvider.id,
      props.currentModel.id
    );
    addMessageToCurrentSession(aiMessage);

    // 滚动到底部
    scrollToBottom();

    // 构建要发送的消息（使用除最后一个消息外的所有消息，避免重复添加当前用户消息）
    const messagesToSend = (currentSession.value?.messages.slice(0, -1) || []);

    // 调用共享的API函数
    await callAIApi(
      messagesToSend,
      (content) => {
        // 更新消息内容
        if (currentSession.value && currentSession.value.messages.length > 0) {
          const lastMessage = currentSession.value.messages[currentSession.value.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = content;
            // 强制重新渲染以显示更新
            forceUpdateKey.value++;
          }
        }
      },
      (stats) => {
        // 更新统计信息
        if (currentSession.value && currentSession.value.messages.length > 0) {
          const lastMessage = currentSession.value.messages[currentSession.value.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.stats = stats;
            // 保存到本地存储
            saveSessionsToLocalStorage();
            // 强制重新渲染
            forceUpdateKey.value++;
          }
        }
      }
    );
  } catch (error: any) {
    console.error('API调用失败:', error);

    // 显示错误信息
    const errorMessage = error.message || 'AI服务暂时不可用';
    toast.error(errorMessage, {
      position: 'top-center',
      duration: 3000,
    });

    // 如果AI消息已经创建但内容为空，更新为错误消息
    if (currentSession.value && currentSession.value.messages.length > 0) {
      const lastMessage = currentSession.value.messages[currentSession.value.messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content === '') {
        lastMessage.content = `抱歉，AI服务暂时不可用。错误信息: ${errorMessage}`;
        // 保存到本地存储
        saveSessionsToLocalStorage();
        // 强制重新渲染
        forceUpdateKey.value++;
      }
    }
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

/**
 * @description 滚动到页面底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  });
};

/**
 * @description 复制文本到剪贴板
 * @param {string} text - 要复制的文本内容
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // 显示复制成功提示
    toast.success('内容已复制到剪贴板', {
      position: 'top-center',
      duration: 2000,
    });
  } catch (err) {
    // 降级方案：使用document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      // 显示降级复制成功提示
      toast.success('内容已复制到剪贴板', {
        position: 'top-center',
        duration: 2000,
      });
    } catch (fallbackErr) {
      // 显示复制失败提示
      toast.error('复制失败，请重试', {
        position: 'top-center',
        duration: 2000,
      });
    }
    document.body.removeChild(textArea);
  }
};

/**
 * @description 重新生成AI消息
 * @param {number} messageIndex - 要重新生成的消息索引
 */
const regenerateMessage = async (messageIndex: number) => {
  if (!currentSession.value || isLoading.value) return;

  const messages = currentSession.value.messages;
  if (messageIndex < 0 || messageIndex >= messages.length) return;

  const aiMessage = messages[messageIndex];
  if (aiMessage.role !== 'assistant') return;

  // 找到对应的用户消息（通常是前一条）
  const userMessageIndex = messageIndex - 1;
  if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return;

  // 删除当前的AI消息
  messages.splice(messageIndex, 1);

  // 更新会话
  currentSession.value.updatedAt = formatDate(new Date());

  // 保存到本地存储
  saveSessionsToLocalStorage();

  // 开始重新生成
  isLoading.value = true;

  try {
    // 创建AI消息占位符用于流式显示
    const newAiMessage = createMessage(
      '', // 初始为空内容
      'assistant',
      props.selectedProvider.id,
      props.currentModel.id
    );
    addMessageToCurrentSession(newAiMessage);

    // 滚动到底部
    scrollToBottom();

    // 构建要发送的消息（使用到用户消息为止的所有消息）
    const messagesToSend = messages.slice(0, userMessageIndex + 1);

    // 调用共享的API函数
    await callAIApi(
      messagesToSend,
      (content) => {
        // 更新消息内容
        if (currentSession.value && currentSession.value.messages.length > 0) {
          const lastMessage = currentSession.value.messages[currentSession.value.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = content;
            // 强制重新渲染以显示更新
            forceUpdateKey.value++;
          }
        }
      },
      (stats) => {
        // 更新统计信息
        if (currentSession.value && currentSession.value.messages.length > 0) {
          const lastMessage = currentSession.value.messages[currentSession.value.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.stats = stats;
            // 保存到本地存储
            saveSessionsToLocalStorage();
            // 强制重新渲染
            forceUpdateKey.value++;
          }
        }
      }
    );
  } catch (error: any) {
    console.error('API调用失败:', error);

    // 显示错误信息
    const errorMessage = error.message || 'AI服务暂时不可用';
    toast.error(errorMessage, {
      position: 'top-center',
      duration: 3000,
    });

    // 如果AI消息已经创建但内容为空，更新为错误消息
    if (currentSession.value && currentSession.value.messages.length > 0) {
      const lastMessage = currentSession.value.messages[currentSession.value.messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content === '') {
        lastMessage.content = `抱歉，AI服务暂时不可用。错误信息: ${errorMessage}`;
        // 保存到本地存储
        saveSessionsToLocalStorage();
        // 强制重新渲染
        forceUpdateKey.value++;
      }
    }
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// 监听当前会话变化，强制重新渲染
watch(currentSessionId, () => {
  forceUpdateKey.value++;
});

// 监听选中的厂家和模型变化，更新当前会话的厂家和模型
watch(() => [props.selectedProvider, props.currentModel], ([newProvider, newModel]) => {
  if (currentSession.value) {
    // 更新当前会话的厂家和模型
    currentSession.value.providerId = newProvider.id;
    currentSession.value.modelId = newModel.id;
    currentSession.value.updatedAt = formatDate(new Date());

    // 保存到本地存储
    saveSessionsToLocalStorage();

    // 强制重新渲染
    forceUpdateKey.value++;
  }
}, { deep: true });

onMounted(() => {
  // 组件挂载后自动聚焦到输入框
  if (inputRef.value) {
    inputRef.value.focus();
  }
});
</script>

<style scoped>
/* Markdown内容样式 */
.markdown-content :deep() h1,
.markdown-content :deep() h2,
.markdown-content :deep() h3,
.markdown-content :deep() h4,
.markdown-content :deep() h5,
.markdown-content :deep() h6 {
  font-weight: 600;
  margin-top: 0.1rem;
  margin-bottom: 0.1rem;
  line-height: 1.25;
}

.markdown-content :deep() h1 {
  font-size: 1.5rem;
}

.markdown-content :deep() h2 {
  font-size: 1.25rem;
}

.markdown-content :deep() h3 {
  font-size: 1.125rem;
}

.markdown-content :deep() p {
  line-height: 1.6;
}

.markdown-content :deep() ul,
.markdown-content :deep() ol {
  padding-left: 2rem;
}

.markdown-content :deep() li {
  margin-bottom: 0.25rem;
}

.markdown-content :deep() blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #6b7280;
}

.markdown-content :deep() code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875em;
}

.markdown-content :deep() pre {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.markdown-content :deep() pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
}

.markdown-content :deep() a {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-content :deep() a:hover {
  color: #2563eb;
}

.markdown-content :deep() strong {
  font-weight: 600;
}

.markdown-content :deep() em {
  font-style: italic;
}

.markdown-content :deep() table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.markdown-content :deep() th,
.markdown-content :deep() td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.markdown-content :deep() th {
  background-color: #f9fafb;
  font-weight: 600;
}

/* 暗色模式适配 */
.dark .markdown-content :deep() h1,
.dark .markdown-content :deep() h2 {
  border-bottom-color: #374151;
}

.dark .markdown-content :deep() blockquote {
  border-left-color: #374151;
  color: #9ca3af;
}

.dark .markdown-content :deep() code {
  background-color: #374151;
  color: #e5e7eb;
}

.dark .markdown-content :deep() pre {
  background-color: #111827;
}

.dark .markdown-content :deep() th,
.dark .markdown-content :deep() td {
  border-color: #374151;
}

.dark .markdown-content :deep() th {
  background-color: #1f2937;
}
</style>
