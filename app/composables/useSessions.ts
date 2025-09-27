import { ref, computed } from 'vue'

// 本地存储数据结构接口
interface StoredSessionsData {
  sessions: Session[]
  currentSessionId: string | null
}

// 厂家数据接口
export interface Provider {
  id: string;
  name: string;
  icon: string;
  models: Model[];
}

// 模型数据接口
export interface Model {
  id: string;
  name: string;
  pricing: {
    input: number;
    cachedInput: number;
    output: number;
  };
}

// 会话接口定义
export interface Session {
  id: string; // 唯一标识符
  title: string; // 会话标题
  messages: Message[]; // 会话的消息内容
  createdAt: string; // 会话的创建时间，ISO 8601格式
  updatedAt: string; // 会话的更新时间，ISO 8601格式
  providerId: string; // 模型厂家ID
  modelId: string; // 模型ID
}

// 消息统计信息接口
export interface MessageStats {
  firstTokenTime?: number // 第一个token到达时间（毫秒）
  promptTokens?: number // 输入token数
  cachedTokens?: number // 缓存token数
  completionTokens?: number // 输出token数
  totalTime?: number // 总耗时（毫秒）
}

// 消息接口定义
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string // 使用ISO字符串格式确保序列化一致性
  providerId?: string // 消息创建时的厂家ID
  modelId?: string // 消息创建时的模型ID
  stats?: MessageStats // 消息统计信息
}

// 全局状态实例
let sessionsInstance: ReturnType<typeof createSessionsStore> | null = null

// 创建会话存储
const createSessionsStore = () => {
  // 会话列表
  const sessions = ref<Session[]>([])

  // 当前选中的会话ID
  const currentSessionId = ref<string | null>(null)

  // 当前会话
  const currentSession = computed(() => {
    return sessions.value.find(session => session.id === currentSessionId.value) || null
  })

  /**
   * @description 格式化日期为 ISO 8601 字符串
   * @param {Date} date - 日期对象
   * @returns {string} ISO 8601 格式的日期字符串
   */
  const formatDate = (date: Date): string => {
    return date.toISOString()
  }

  /**
   * @description 创建消息对象
   * @param {string} content - 消息内容
   * @param {'user' | 'assistant'} role - 消息角色
   * @param {string} providerId - 消息创建时的厂家ID
   * @param {string} modelId - 消息创建时的模型ID
   * @returns {Message} 消息对象
   */
  const createMessage = (content: string, role: 'user' | 'assistant', providerId?: string, modelId?: string): Message => {
    return {
      id: generateId(),
      content,
      role,
      timestamp: new Date().toISOString(),
      providerId,
      modelId
    }
  }

  /**
   * @description 创建新的空会话
   * @returns {string} 新创建的会话ID
   */
  const createNewSession = (): string => {
    const now = new Date()
    const newSession: Session = {
      id: generateId(),
      title: '新会话',
      messages: [],
      createdAt: formatDate(now),
      updatedAt: formatDate(now),
      providerId: 'meta', // 默认厂家：DeepSeek
      modelId: 'deepseek-v3.1' // 默认模型：deepseek-chat
    }

    // 使用响应式方式更新数组，确保触发重新渲染
    sessions.value = [newSession, ...sessions.value]
    currentSessionId.value = newSession.id

    // 保存到本地存储
    saveSessionsToLocalStorage()

    return newSession.id
  }

  /**
   * @description 选择会话
   * @param {string} sessionId - 要选择的会话ID
   */
  const selectSession = (sessionId: string): void => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      currentSessionId.value = sessionId
      // 保存到本地存储
      saveSessionsToLocalStorage()
    }
  }

  /**
   * @description 删除会话
   * @param {string} sessionId - 要删除的会话ID
   */
  const deleteSession = (sessionId: string): void => {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      // 使用响应式方式更新数组，确保触发重新渲染
      sessions.value = sessions.value.filter(s => s.id !== sessionId)

      // 如果删除的是当前会话，将当前会话ID设为null
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
      }

      // 保存到本地存储
      saveSessionsToLocalStorage()

      // 如果删除后没有会话了，自动创建一个新会话
      if (sessions.value.length === 0) {
        createNewSession()
      }
    }
  }

  /**
   * @description 向当前会话添加消息
   * @param {Message} message - 要添加的消息
   */
  const addMessageToCurrentSession = (message: Message): void => {
    if (!currentSessionId.value) {
      const newSessionId = createNewSession()
      currentSessionId.value = newSessionId
    }

    const sessionIndex = sessions.value.findIndex(s => s.id === currentSessionId.value)
    if (sessionIndex !== -1) {
      const session = sessions.value[sessionIndex]
      // 确保会话对象存在
      if (!session) {
        return
      }

      // 创建新的会话对象以确保响应式更新
      const updatedSession = {
        ...session,
        messages: [...session.messages, message],
        updatedAt: formatDate(new Date())
      }

      // 如果这是第一条消息，更新会话标题
      if (updatedSession.messages.length === 1 && message.role === 'user') {
        updatedSession.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      }

      // 使用响应式方式更新数组
      sessions.value = [
        ...sessions.value.slice(0, sessionIndex),
        updatedSession,
        ...sessions.value.slice(sessionIndex + 1)
      ]

      // 保存到本地存储
      saveSessionsToLocalStorage()
    }
  }

  /**
   * @description 从本地存储加载会话
   */
  const loadSessionsFromLocalStorage = (): void => {
    try {
      const stored = localStorage.getItem('chat_sessions')
      if (stored) {
        const parsed: StoredSessionsData = JSON.parse(stored)

        // 验证数据格式
        if (parsed.sessions && Array.isArray(parsed.sessions)) {
          sessions.value = parsed.sessions.map(session => ({
            ...session,
            // 确保消息时间戳是字符串格式
            messages: session.messages.map(message => ({
              ...message,
              timestamp: typeof message.timestamp === 'string'
                ? message.timestamp
                : new Date(message.timestamp).toISOString(),
              // 确保统计信息被正确保留
              stats: message.stats ? {
                firstTokenTime: message.stats.firstTokenTime,
                promptTokens: message.stats.promptTokens,
                cachedTokens: message.stats.cachedTokens,
                completionTokens: message.stats.completionTokens,
                totalTime: message.stats.totalTime
              } : undefined
            })),
            // 为现有会话添加默认的 providerId 和 modelId（数据迁移）
            providerId: session.providerId || 'meta',
            modelId: session.modelId || 'deepseek-v3.1'
          }))

          // 验证当前会话ID是否存在于会话列表中
          if (parsed.currentSessionId) {
            const sessionExists = sessions.value.some(s => s.id === parsed.currentSessionId)
            currentSessionId.value = sessionExists ? parsed.currentSessionId : null
          } else {
            currentSessionId.value = null
          }
        }
      }
    } catch (error) {
      console.error('加载会话数据失败:', error)
      // 仅在完全没有会话数据时才创建新会话
      // 避免在解析失败时覆盖现有数据
      if (sessions.value.length === 0) {
        createNewSession()
        saveSessionsToLocalStorage()
      }
    }
  }

  /**
   * @description 保存会话到本地存储
   */
  const saveSessionsToLocalStorage = (): void => {
    const data: StoredSessionsData = {
      sessions: sessions.value,
      currentSessionId: currentSessionId.value
    }
    localStorage.setItem('chat_sessions', JSON.stringify(data))
  }

  /**
   * @description 生成唯一ID
   * @returns {string} 唯一ID
   */
  const generateId = (): string => {
    const randomPart = Math.random().toString(36).substring(2, 14)
    return `session-id-${randomPart}`
  }

  // 初始化时从本地存储加载会话（仅在客户端执行）
  if (typeof window !== 'undefined') {
    // 确保在加载完成后再检查是否需要创建新会话
    loadSessionsFromLocalStorage()

    // 如果没有会话，创建一个新的（在加载完成后检查）
    if (sessions.value.length === 0) {
      createNewSession()
    }
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    createNewSession,
    selectSession,
    deleteSession,
    addMessageToCurrentSession,
    createMessage,
    saveSessionsToLocalStorage
  }
}

// 会话状态管理（单例模式）
export const useSessions = () => {
  // 确保在客户端才创建实例
  if (typeof window !== 'undefined') {
    if (!sessionsInstance) {
      sessionsInstance = createSessionsStore()
    }
  } else if (!sessionsInstance) {
    // 在服务器端返回一个空实现的 mock 对象
    sessionsInstance = {
      sessions: ref([]),
      currentSessionId: ref(null),
      currentSession: computed(() => null),
      createNewSession: () => '',
      selectSession: () => { },
      deleteSession: () => { },
      addMessageToCurrentSession: () => { },
      createMessage: (content: string, role: 'user' | 'assistant') => ({
        id: '',
        content,
        role,
        timestamp: new Date().toISOString()
      }),
      saveSessionsToLocalStorage: () => { }
    } as ReturnType<typeof createSessionsStore>
  }
  return sessionsInstance
}
