export const AUTH_SCOPE_USER = 'user'
export const AUTH_SCOPE_PROVIDER = 'provider'
export const AUTH_SCOPE_EMPLOYEE = 'employee'

const AUTH_SCOPES = [
  AUTH_SCOPE_USER,
  AUTH_SCOPE_PROVIDER,
  AUTH_SCOPE_EMPLOYEE,
]

const ACTIVE_SCOPE_KEY = 'auth:activeScope'
const TOKEN_KEY_LEGACY = 'token'

const normalizeScope = (scope) => {
  const value = String(scope || '').trim().toLowerCase()
  return AUTH_SCOPES.includes(value) ? value : ''
}

const buildTokenKey = (scope) => `auth:token:${scope}`
const buildStorageKey = (scope, field) => `auth:${scope}:${field}`

export const isAdminPath = (path = '') => {
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path.startsWith('/manage')
  )
}

export const setActiveAuthScope = (scope) => {
  const normalized = normalizeScope(scope)
  if (!normalized) return
  sessionStorage.setItem(ACTIVE_SCOPE_KEY, normalized)
}

export const getActiveAuthScope = () => {
  return normalizeScope(sessionStorage.getItem(ACTIVE_SCOPE_KEY))
}

export const clearActiveAuthScope = () => {
  sessionStorage.removeItem(ACTIVE_SCOPE_KEY)
}

export const setToken = (token, scope) => {
  const targetScope = normalizeScope(scope) || getActiveAuthScope()
  if (!targetScope || !token) return
  localStorage.setItem(buildTokenKey(targetScope), String(token))
}

export const getToken = (scope) => {
  const targetScope = normalizeScope(scope) || getActiveAuthScope()
  if (targetScope) {
    return localStorage.getItem(buildTokenKey(targetScope)) || ''
  }
  return ''
}

export const removeToken = (scope) => {
  const targetScope = normalizeScope(scope)
  if (targetScope) {
    localStorage.removeItem(buildTokenKey(targetScope))
    return
  }

  AUTH_SCOPES.forEach((item) => {
    localStorage.removeItem(buildTokenKey(item))
  })
  localStorage.removeItem(TOKEN_KEY_LEGACY)
}

export const setAuthStorage = (scope, field, value) => {
  const targetScope = normalizeScope(scope)
  if (!targetScope || !field) return

  const key = buildStorageKey(targetScope, field)
  if (value === undefined || value === null || value === '') {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, String(value))
}

export const getAuthStorage = (scope, field) => {
  const targetScope = normalizeScope(scope)
  if (!targetScope || !field) return ''
  return localStorage.getItem(buildStorageKey(targetScope, field)) || ''
}

export const removeAuthStorage = (scope, fields = []) => {
  const targetScope = normalizeScope(scope)
  if (!targetScope) return

  if (!Array.isArray(fields) || fields.length === 0) {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`auth:${targetScope}:`)) {
        localStorage.removeItem(key)
      }
    })
    return
  }

  fields.forEach((field) => {
    if (!field) return
    localStorage.removeItem(buildStorageKey(targetScope, field))
  })
}

export const resolveClientScope = () => {
  const active = getActiveAuthScope()
  if (
    [AUTH_SCOPE_USER, AUTH_SCOPE_PROVIDER].includes(active) &&
    getToken(active)
  ) {
    return active
  }

  const hasUserToken = !!getToken(AUTH_SCOPE_USER)
  const hasProviderToken = !!getToken(AUTH_SCOPE_PROVIDER)

  if (hasUserToken && !hasProviderToken) {
    return AUTH_SCOPE_USER
  }

  if (hasProviderToken && !hasUserToken) {
    return AUTH_SCOPE_PROVIDER
  }

  return ''
}
