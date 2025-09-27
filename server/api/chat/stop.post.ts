/**
 * 停止AI聊天生成的API端点
 * 用于中断正在进行的流式响应
 */

// 全局变量用于存储当前活跃的流式响应控制器
let activeStreamControllers: Set<AbortController> = new Set()

/**
 * 注册活跃的流式响应控制器
 * @param controller - AbortController实例
 */
export function registerStreamController(controller: AbortController) {
  activeStreamControllers.add(controller)

  // 当控制器被中止时，从集合中移除
  controller.signal.addEventListener('abort', () => {
    activeStreamControllers.delete(controller)
  })
}

/**
 * 停止所有活跃的流式响应
 */
export function stopAllActiveStreams() {
  for (const controller of activeStreamControllers) {
    try {
      controller.abort()
    } catch (error) {
      console.warn('Failed to abort stream controller:', error)
    }
  }
  activeStreamControllers.clear()
}

export default defineEventHandler(async (_event) => {
  try {
    // 停止所有活跃的流式响应
    stopAllActiveStreams()

    return {
      success: true,
      message: 'All active streams have been stopped'
    }
  } catch (error: unknown) {
    console.error('Stop chat error:', error)

    const err = error as Error & { message?: string }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: err.message || 'Failed to stop chat generation'
    })
  }
})
