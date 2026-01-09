/**
 * 停止AI聊天生成的API端点
 * 用于中断正在进行的流式响应
 */

// 存储活跃的流式响应控制器和对应的请求元数据
interface ActiveStream {
  controller: AbortController
  sessionId: string
  requestId?: string
  provider?: string
  model?: string
  startTime: number
}

let activeStreams: Map<string, ActiveStream> = new Map()

/**
 * 注册活跃的流式响应控制器
 * @param sessionId - 会话唯一标识符
 * @param controller - AbortController实例
 * @param requestId - 请求ID（可选）
 * @param provider - 服务提供商名称（可选）
 * @param model - 使用的模型名称（可选）
 */
export function registerStreamController(
  controller: AbortController,
  sessionId?: string,
  requestId?: string,
  provider?: string,
  model?: string
) {
  // 如果没有提供sessionId，生成一个唯一ID
  const streamId = sessionId || `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const stream: ActiveStream = {
    controller,
    sessionId: streamId,
    requestId,
    provider,
    model,
    startTime: Date.now()
  }

  activeStreams.set(streamId, stream)
  console.log(`[Stop] Registered stream: ${streamId}, provider: ${provider || 'unknown'}, model: ${model || 'unknown'}, total active: ${activeStreams.size}`)

  // 当控制器被中止时，从集合中移除
  controller.signal.addEventListener('abort', () => {
    activeStreams.delete(streamId)
    const duration = Date.now() - stream.startTime
    console.log(`[Stop] Stream ${streamId} aborted after ${duration}ms, remaining active: ${activeStreams.size}`)
  })

  return streamId
}

/**
 * 停止指定会话的流式响应
 * @param sessionId - 要停止的会话ID
 * @returns 是否成功停止
 */
async function stopStream(sessionId: string): Promise<boolean> {
  const stream = activeStreams.get(sessionId)
  if (!stream) {
    console.log(`[Stop] Stream ${sessionId} not found or already stopped`)
    return false
  }

  try {
    const duration = Date.now() - stream.startTime
    console.log(`[Stop] Stopping stream ${sessionId}, provider: ${stream.provider || 'unknown'}, duration: ${duration}ms`)

    // 1. 中止本地请求
    stream.controller.abort()

    // 2. 通知服务端停止生成（如果有 requestId）
    if (stream.requestId) {
      try {
        const config = useRuntimeConfig()
        const apiKey = config.defaultApiKey
        const baseUrl = config.defaultBaseUrl
        
        if (apiKey) {
          console.log(`[Stop] Notifying provider to cancel request: ${stream.requestId}`)

          const cancelUrl = `${baseUrl.replace(/\/v1$/, '')}/v1/generation/cancel`
          
          await $fetch(cancelUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: {
              id: stream.requestId
            },
            timeout: 3000 // 3秒超时
          })
          
          console.log(`[Stop] Provider cancellation request sent successfully for ${stream.requestId}`)
        } else {
          console.warn(`[Stop] Cannot notify provider: API key not available`)
        }
      } catch (error) {
        const err = error as Error
        console.warn(`[Stop] Failed to notify provider for ${stream.requestId}:`, err.message)
        // 即使通知失败也继续，因为本地已经中止了
      }
    }

    activeStreams.delete(sessionId)
    console.log(`[Stop] ✓ Stream ${sessionId} stopped successfully, remaining active: ${activeStreams.size}`)
    return true
  } catch (error) {
    const err = error as Error
    console.error(`[Stop] ✗ Failed to stop stream ${sessionId}:`, err.message)
    return false
  }
}

/**
 * 停止所有活跃的流式响应
 * @returns 停止的流数量
 */
export async function stopAllActiveStreams(): Promise<number> {
  const count = activeStreams.size
  if (count === 0) {
    console.log('[Stop] No active streams to stop')
    return 0
  }

  console.log(`[Stop] Stopping all ${count} active stream(s)...`)
  
  const stopPromises = Array.from(activeStreams.keys()).map(id => stopStream(id))
  const results = await Promise.all(stopPromises)
  const stoppedCount = results.filter(r => r).length
  
  activeStreams.clear()
  console.log(`[Stop] ✓ All streams stopped: ${stoppedCount}/${count} successful`)
  
  return stoppedCount
}

/**
 * 获取当前活跃的流信息（用于调试）
 */
export function getActiveStreams() {
  return Array.from(activeStreams.entries()).map(([id, stream]) => ({
    sessionId: id,
    provider: stream.provider,
    duration: Date.now() - stream.startTime,
    hasRequestId: !!stream.requestId
  }))
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const sessionId = body?.sessionId

    let stoppedCount = 0
    let message = ''

    if (sessionId) {
      // 停止指定会话
      console.log(`[Stop] Request to stop specific session: ${sessionId}`)
      const stopped = await stopStream(sessionId)
      if (stopped) {
        stoppedCount = 1
        message = `Stream ${sessionId} stopped successfully`
      } else {
        message = `Stream ${sessionId} not found or already stopped`
      }
    } else {
      // 停止所有会话
      console.log('[Stop] Request to stop all active streams')
      stoppedCount = await stopAllActiveStreams()
      message = `Stopped ${stoppedCount} active stream(s)`
    }

    console.log(`[Stop] ✓ Operation completed: ${message}`)

    return {
      success: true,
      message,
      stoppedCount,
      remainingStreams: activeStreams.size,
      timestamp: new Date().toISOString()
    }
  } catch (error: unknown) {
    console.error('[Stop] ✗ Error:', error)

    const err = error as Error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: err.message || 'Failed to stop chat generation'
    })
  }
})
