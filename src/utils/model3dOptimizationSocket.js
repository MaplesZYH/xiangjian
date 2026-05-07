import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { AUTH_SCOPE_EMPLOYEE, getToken } from '@/utils/auth'

const MODEL3D_OPTIMIZED_QUEUE = '/user/queue/model3d-optimized'
const PROD_WS_ENDPOINT = 'http://116.198.38.236:8080/ws'

let stompClient = null
let subscription = null
const listeners = new Set()

const resolveWebSocketEndpoint = () =>
  import.meta.env.DEV ? '/api/ws' : PROD_WS_ENDPOINT

const parseMessageBody = (message) => {
  try {
    return JSON.parse(message.body)
  } catch (error) {
    console.warn('解析3D模型优化通知失败:', error)
    return null
  }
}

const notifyListeners = (payload) => {
  listeners.forEach((listener) => {
    try {
      listener(payload)
    } catch (error) {
      console.warn('处理3D模型优化通知失败:', error)
    }
  })
}

const subscribeModel3dQueue = () => {
  if (!stompClient?.connected || subscription) return

  subscription = stompClient.subscribe(MODEL3D_OPTIMIZED_QUEUE, (message) => {
    const payload = parseMessageBody(message)
    if (payload) {
      notifyListeners(payload)
    }
  })
}

const createModel3dOptimizationClient = () => {
  const token = getToken(AUTH_SCOPE_EMPLOYEE)

  return new Client({
    connectHeaders: token ? { token } : {},
    debug: () => {},
    reconnectDelay: 5000,
    webSocketFactory: () => new SockJS(resolveWebSocketEndpoint()),
    onConnect: () => {
      subscribeModel3dQueue()
    },
    onDisconnect: () => {
      subscription = null
    },
    onWebSocketClose: () => {
      subscription = null
    },
    onStompError: (frame) => {
      console.warn('3D模型优化通知连接错误:', frame.headers?.message || frame.body)
    },
  })
}

export const ensureModel3dOptimizationSocket = () => {
  if (typeof window === 'undefined') return null

  if (!stompClient) {
    stompClient = createModel3dOptimizationClient()
  }

  if (!stompClient.active) {
    stompClient.activate()
  } else {
    subscribeModel3dQueue()
  }

  return stompClient
}

export const onModel3dOptimized = (listener) => {
  if (typeof listener !== 'function') {
    return () => {}
  }

  listeners.add(listener)
  ensureModel3dOptimizationSocket()

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && stompClient?.active) {
      subscription?.unsubscribe()
      subscription = null
      stompClient.deactivate()
      stompClient = null
    }
  }
}
