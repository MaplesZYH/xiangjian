import axios from 'axios'
import { createDiscreteApi, zhCN } from 'naive-ui'
import pinia from '@/stores'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { naiveThemeOverrides } from '@/theme/naive'
import {
  AUTH_SCOPE_EMPLOYEE,
  AUTH_SCOPE_PROVIDER,
  AUTH_SCOPE_USER,
  clearActiveAuthScope,
  getActiveAuthScope,
  getToken,
  isAdminPath,
  removeAuthStorage,
  removeToken,
  resolveClientScope,
} from '@/utils/auth'
import { hasEmployeeAllPermissions } from '@/utils/adminAuth'

const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : 'http://116.198.38.236:8080'
const UPLOAD_REQUEST_TIMEOUT = 300000

const service = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
})

const isFormData = (value) =>
  typeof FormData !== 'undefined' && value instanceof FormData

const isUploadRequest = (config = {}) => {
  if (isFormData(config.data)) return true

  const contentType =
    config.headers?.['Content-Type'] ||
    config.headers?.['content-type'] ||
    ''

  return String(contentType).includes('multipart/form-data')
}

const getCurrentHashPath = () => {
  if (typeof window === 'undefined') return ''
  const hash = window.location.hash || ''
  if (!hash) return ''
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  return value.split('?')[0] || ''
}

const resolveRequestScope = (config = {}) => {
  if (config.authScope) return config.authScope
  const path = getCurrentHashPath()
  if (isAdminPath(path)) return AUTH_SCOPE_EMPLOYEE
  const activeScope = getActiveAuthScope()
  if ([AUTH_SCOPE_USER, AUTH_SCOPE_PROVIDER].includes(activeScope)) {
    return activeScope
  }
  return resolveClientScope()
}

service.interceptors.request.use(
  (config) => {
    if (!config.timeout && isUploadRequest(config)) {
      config.timeout = UPLOAD_REQUEST_TIMEOUT
    }

    const authScope = resolveRequestScope(config)
    const token = getToken(authScope)
    if (token) {
      config.headers = config.headers || {}
      config.headers.token = token
    }
    config.__authScope = authScope
    return config
  },
  (error) => Promise.reject(error)
)

const { message } = createDiscreteApi(['message'], {
  configProviderProps: {
    locale: zhCN,
    themeOverrides: naiveThemeOverrides,
  },
})
const NETWORK_ERROR = '网络异常，请稍后重试'
let lastPermissionDeniedToastAt = 0
const PERMISSION_DENIED_TOAST_INTERVAL = 1500

const resolveErrorMessage = (error) => {
  const responseData = error?.response?.data
  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }
  if (responseData?.msg) {
    return String(responseData.msg)
  }
  if (responseData?.message) {
    return String(responseData.message)
  }
  if (error?.msg) {
    return String(error.msg)
  }
  if (error?.message) {
    return String(error.message)
  }
  return NETWORK_ERROR
}

const isPermissionDeniedError = (error) => {
  const responseStatus = Number(error?.response?.status || 0)
  const responseData = error?.response?.data
  const code = Number(responseData?.code || error?.code || 0)
  const messageText = String(
    responseData?.msg ||
      responseData?.message ||
      error?.msg ||
      error?.message ||
      '',
  ).trim()

  if (responseStatus === 403) return true
  if (code === 403) return true
  if (messageText.includes('不允许访问') || messageText.includes('无权限')) {
    return true
  }
  return false
}

service.interceptors.response.use(
  (res) => {
    const { code } = res.data || {}
    if (code === 200 || code === 1) {
      return res.data
    }
    return Promise.reject(res.data || { code: -1, message: NETWORK_ERROR })
  },
  (error) => {
    const failedScope = error?.config?.__authScope || resolveRequestScope(error?.config || {})
    if (error?.response?.status === 401) {
      const authStore = useAuthStore(pinia)
      if (failedScope) {
        removeToken(failedScope)
        removeAuthStorage(failedScope)
        if (getActiveAuthScope() === failedScope) {
          clearActiveAuthScope()
        }
      }
      authStore.hydrateFromStorage()
    }
    if (isPermissionDeniedError(error)) {
      const now = Date.now()
      if (now - lastPermissionDeniedToastAt > PERMISSION_DENIED_TOAST_INTERVAL) {
        message.warning('当前账号没有该功能权限')
        lastPermissionDeniedToastAt = now
      }
      return Promise.reject(error)
    }

    message.error(resolveErrorMessage(error))
    return Promise.reject(error)
  }
)

const request = (options) => {
  const nextOptions = {
    ...options,
    method: options.method || 'get',
  }

  if (
    nextOptions.authScope === AUTH_SCOPE_EMPLOYEE &&
    Array.isArray(nextOptions.requiredEmployeePermissions) &&
    nextOptions.requiredEmployeePermissions.length > 0 &&
    !hasEmployeeAllPermissions(nextOptions.requiredEmployeePermissions)
  ) {
    return Promise.reject({
      code: 403,
      msg: '不允许访问',
      permissionDenied: true,
      requiredEmployeePermissions: nextOptions.requiredEmployeePermissions,
    })
  }

  if (
    isUploadRequest(nextOptions) &&
    !Object.prototype.hasOwnProperty.call(nextOptions, 'timeout')
  ) {
    nextOptions.timeout = UPLOAD_REQUEST_TIMEOUT
  }

  return service(nextOptions)
}

export default request
