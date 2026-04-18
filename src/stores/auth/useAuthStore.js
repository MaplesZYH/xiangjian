import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getAllowedAdminMenus,
  getFirstAllowedAdminPath,
  hasPermission,
} from '@/utils/adminAuth'
import {
  AUTH_SCOPE_EMPLOYEE,
  AUTH_SCOPE_PROVIDER,
  AUTH_SCOPE_USER,
  clearActiveAuthScope,
  getActiveAuthScope,
  getAuthStorage,
  getToken,
  removeAuthStorage,
  removeToken,
  setActiveAuthScope,
  setAuthStorage,
  setToken,
} from '@/utils/auth'

const EMPLOYEE_ROLES_KEY = 'employeeRoles'
const EMPLOYEE_PERMISSIONS_KEY = 'employeePermissions'
const VALID_SCOPES = [
  AUTH_SCOPE_USER,
  AUTH_SCOPE_PROVIDER,
  AUTH_SCOPE_EMPLOYEE,
]

const parseJSON = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const normalizeList = (value) => {
  if (!Array.isArray(value)) return []
  return value.filter((item) => item !== null && item !== undefined && item !== '')
}

const createEmptyScopeState = () => ({
  token: '',
  id: '',
  name: '',
  phone: '',
  address: '',
  roles: [],
  permissions: [],
  menu: [],
  info: null,
  displayName: '',
})

const readEmployeeStorageList = (key) => {
  if (typeof window === 'undefined') return []
  return normalizeList(parseJSON(window.localStorage.getItem(key), []))
}

const readScopedList = (scope, field) =>
  normalizeList(parseJSON(getAuthStorage(scope, field), []))

const createHydrationSignature = () => {
  if (typeof window === 'undefined') return ''

  return JSON.stringify({
    activeScope: getActiveAuthScope() || '',
    user: {
      token: getToken(AUTH_SCOPE_USER),
      id: getAuthStorage(AUTH_SCOPE_USER, 'id'),
      name: getAuthStorage(AUTH_SCOPE_USER, 'name'),
      phone: getAuthStorage(AUTH_SCOPE_USER, 'phone'),
      address: getAuthStorage(AUTH_SCOPE_USER, 'address'),
      roles: getAuthStorage(AUTH_SCOPE_USER, 'roles'),
      permissions: getAuthStorage(AUTH_SCOPE_USER, 'permissions'),
      menu: getAuthStorage(AUTH_SCOPE_USER, 'menu'),
      info: getAuthStorage(AUTH_SCOPE_USER, 'userInfo'),
    },
    provider: {
      token: getToken(AUTH_SCOPE_PROVIDER),
      id: getAuthStorage(AUTH_SCOPE_PROVIDER, 'id'),
      name: getAuthStorage(AUTH_SCOPE_PROVIDER, 'name'),
      phone: getAuthStorage(AUTH_SCOPE_PROVIDER, 'phone'),
      roles: getAuthStorage(AUTH_SCOPE_PROVIDER, 'roles'),
      permissions: getAuthStorage(AUTH_SCOPE_PROVIDER, 'permissions'),
      menu: getAuthStorage(AUTH_SCOPE_PROVIDER, 'menu'),
      info: getAuthStorage(AUTH_SCOPE_PROVIDER, 'vendorInfo'),
    },
    employee: {
      token: getToken(AUTH_SCOPE_EMPLOYEE),
      id: getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'id'),
      name: getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'name'),
      phone: getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'phone'),
      roles:
        typeof window === 'undefined'
          ? ''
          : window.localStorage.getItem(EMPLOYEE_ROLES_KEY),
      permissions:
        typeof window === 'undefined'
          ? ''
          : window.localStorage.getItem(EMPLOYEE_PERMISSIONS_KEY),
    },
  })
}

const buildScopeState = (scope) => {
  const token = getToken(scope)
  const id = getAuthStorage(scope, 'id')
  const name = getAuthStorage(scope, 'name')
  const phone = getAuthStorage(scope, 'phone')
  const address =
    scope === AUTH_SCOPE_USER ? getAuthStorage(scope, 'address') : ''

  const roles =
    scope === AUTH_SCOPE_EMPLOYEE
      ? readEmployeeStorageList(EMPLOYEE_ROLES_KEY)
      : readScopedList(scope, 'roles')

  const permissions =
    scope === AUTH_SCOPE_EMPLOYEE
      ? readEmployeeStorageList(EMPLOYEE_PERMISSIONS_KEY)
      : readScopedList(scope, 'permissions')

  const menu =
    scope === AUTH_SCOPE_EMPLOYEE ? [] : readScopedList(scope, 'menu')

  const info =
    scope === AUTH_SCOPE_USER
      ? parseJSON(getAuthStorage(scope, 'userInfo'), null)
      : scope === AUTH_SCOPE_PROVIDER
        ? parseJSON(getAuthStorage(scope, 'vendorInfo'), null)
        : null

  const displayName =
    scope === AUTH_SCOPE_PROVIDER
      ? info?.companyName || info?.username || name || phone || ''
      : info?.name || name || phone || ''

  return {
    token,
    id,
    name,
    phone,
    address,
    roles,
    permissions,
    menu,
    info,
    displayName,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const hydrated = ref(false)
  const lastHydrationSignature = ref('')
  const activeScope = ref('')
  const userAuth = ref(createEmptyScopeState())
  const providerAuth = ref(createEmptyScopeState())
  const employeeAuth = ref(createEmptyScopeState())

  const setScopeState = (scope, state) => {
    if (scope === AUTH_SCOPE_USER) {
      userAuth.value = state
      return
    }
    if (scope === AUTH_SCOPE_PROVIDER) {
      providerAuth.value = state
      return
    }
    if (scope === AUTH_SCOPE_EMPLOYEE) {
      employeeAuth.value = state
    }
  }

  const markHydrated = () => {
    hydrated.value = true
    lastHydrationSignature.value = createHydrationSignature()
  }

  const hydrateFromStorage = ({ force = false } = {}) => {
    const nextSignature = createHydrationSignature()
    if (!force && hydrated.value && nextSignature === lastHydrationSignature.value) {
      return false
    }

    activeScope.value = getActiveAuthScope() || ''
    setScopeState(AUTH_SCOPE_USER, buildScopeState(AUTH_SCOPE_USER))
    setScopeState(AUTH_SCOPE_PROVIDER, buildScopeState(AUTH_SCOPE_PROVIDER))
    setScopeState(AUTH_SCOPE_EMPLOYEE, buildScopeState(AUTH_SCOPE_EMPLOYEE))
    hydrated.value = true
    lastHydrationSignature.value = nextSignature
    return true
  }

  const getScopeState = (scope) => {
    if (scope === AUTH_SCOPE_USER) return userAuth.value
    if (scope === AUTH_SCOPE_PROVIDER) return providerAuth.value
    if (scope === AUTH_SCOPE_EMPLOYEE) return employeeAuth.value
    return createEmptyScopeState()
  }

  const resolvedClientScope = computed(() => {
    if (
      [AUTH_SCOPE_USER, AUTH_SCOPE_PROVIDER].includes(activeScope.value) &&
      getScopeState(activeScope.value).token
    ) {
      return activeScope.value
    }

    if (userAuth.value.token && !providerAuth.value.token) {
      return AUTH_SCOPE_USER
    }

    if (providerAuth.value.token && !userAuth.value.token) {
      return AUTH_SCOPE_PROVIDER
    }

    return ''
  })

  const currentClientState = computed(() => getScopeState(resolvedClientScope.value))
  const currentClientId = computed(() => currentClientState.value.id || '')
  const currentClientPhone = computed(() => currentClientState.value.phone || '')
  const clientDisplayName = computed(() => currentClientState.value.displayName || '')
  const currentClientPermissions = computed(
    () => currentClientState.value.permissions || [],
  )
  const isClientLoggedIn = computed(
    () => Boolean(resolvedClientScope.value && currentClientState.value.token),
  )
  const isCurrentUser = computed(() => resolvedClientScope.value === AUTH_SCOPE_USER)
  const isCurrentProvider = computed(
    () => resolvedClientScope.value === AUTH_SCOPE_PROVIDER,
  )

  const employeeToken = computed(() => employeeAuth.value.token || '')
  const employeeId = computed(() => employeeAuth.value.id || '')
  const employeeRoles = computed(() => employeeAuth.value.roles || [])
  const employeePermissions = computed(() => employeeAuth.value.permissions || [])
  const employeeDisplayName = computed(
    () => employeeAuth.value.displayName || '员工账号',
  )
  const allowedAdminMenus = computed(() =>
    getAllowedAdminMenus(employeePermissions.value),
  )
  const firstAllowedAdminPath = computed(() =>
    getFirstAllowedAdminPath(employeePermissions.value),
  )

  const setActiveScopeValue = (scope) => {
    const nextScope = VALID_SCOPES.includes(scope) ? scope : ''
    if (nextScope) {
      setActiveAuthScope(nextScope)
    } else {
      clearActiveAuthScope()
    }
    activeScope.value = nextScope
    markHydrated()
  }

  const writeJSONStorage = (scope, field, value) => {
    if (value === undefined) return
    if (value === null) {
      setAuthStorage(scope, field, null)
      return
    }
    setAuthStorage(scope, field, JSON.stringify(value))
  }

  const writeEmployeeList = (key, value) => {
    if (typeof window === 'undefined') return
    const list = normalizeList(value)
    if (list.length === 0) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, JSON.stringify(list))
  }

  const patchScopeProfile = (scope, patch = {}) => {
    if (!VALID_SCOPES.includes(scope) || !patch || typeof patch !== 'object') {
      return
    }

    if (patch.token !== undefined) {
      if (patch.token) {
        setToken(patch.token, scope)
      } else {
        removeToken(scope)
      }
    }

    if (patch.id !== undefined) setAuthStorage(scope, 'id', patch.id)
    if (patch.name !== undefined) setAuthStorage(scope, 'name', patch.name)
    if (patch.phone !== undefined) setAuthStorage(scope, 'phone', patch.phone)

    if (scope === AUTH_SCOPE_USER && patch.address !== undefined) {
      setAuthStorage(scope, 'address', patch.address)
    }

    if (scope === AUTH_SCOPE_EMPLOYEE) {
      if (patch.roles !== undefined) {
        writeEmployeeList(EMPLOYEE_ROLES_KEY, patch.roles)
      }
      if (patch.permissions !== undefined) {
        writeEmployeeList(EMPLOYEE_PERMISSIONS_KEY, patch.permissions)
      }
    } else {
      if (patch.roles !== undefined) {
        writeJSONStorage(scope, 'roles', normalizeList(patch.roles))
      }
      if (patch.permissions !== undefined) {
        writeJSONStorage(scope, 'permissions', normalizeList(patch.permissions))
      }
      if (patch.menu !== undefined) {
        writeJSONStorage(scope, 'menu', normalizeList(patch.menu))
      }
    }

    if (scope === AUTH_SCOPE_USER && patch.userInfo !== undefined) {
      writeJSONStorage(scope, 'userInfo', patch.userInfo)
    }
    if (scope === AUTH_SCOPE_PROVIDER && patch.vendorInfo !== undefined) {
      writeJSONStorage(scope, 'vendorInfo', patch.vendorInfo)
    }

    setScopeState(scope, buildScopeState(scope))
    markHydrated()
  }

  const clearEmployeeStorage = () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(EMPLOYEE_ROLES_KEY)
    window.localStorage.removeItem(EMPLOYEE_PERMISSIONS_KEY)
  }

  const clearScope = (scope, { skipHydrate = false } = {}) => {
    if (!VALID_SCOPES.includes(scope)) return
    removeToken(scope)
    removeAuthStorage(scope)
    if (scope === AUTH_SCOPE_EMPLOYEE) {
      clearEmployeeStorage()
    }
    if (activeScope.value === scope) {
      clearActiveAuthScope()
      activeScope.value = ''
    }
    setScopeState(scope, createEmptyScopeState())
    if (!skipHydrate) {
      markHydrated()
    }
  }

  const clearClientScopes = ({ skipHydrate = false } = {}) => {
    clearScope(AUTH_SCOPE_USER, { skipHydrate: true })
    clearScope(AUTH_SCOPE_PROVIDER, { skipHydrate: true })
    if (!skipHydrate) {
      markHydrated()
    }
  }

  const loginUser = ({ token, userInfo = {}, menu = [], phone = '' } = {}) => {
    clearClientScopes({ skipHydrate: true })
    const userId = userInfo.userId ?? userInfo.id ?? ''
    const displayName =
      userInfo.name ||
      userInfo.phoneNumber ||
      phone ||
      (userId ? `用户${String(userId)}` : '')

    patchScopeProfile(AUTH_SCOPE_USER, {
      token: token || '',
      id: userId ? String(userId) : '',
      name: displayName,
      phone: userInfo.phoneNumber || phone || '',
      address: userInfo.address || '',
      roles: userInfo.roles || [],
      permissions: userInfo.permissions || [],
      menu,
      userInfo,
    })
    setActiveScopeValue(AUTH_SCOPE_USER)
  }

  const loginProvider = ({
    token,
    vendorInfo = {},
    menu = [],
    username = '',
  } = {}) => {
    clearClientScopes({ skipHydrate: true })
    const vendorId = vendorInfo.vendorId ?? vendorInfo.id ?? ''

    patchScopeProfile(AUTH_SCOPE_PROVIDER, {
      token: token || '',
      id: vendorId ? String(vendorId) : '',
      name: vendorInfo.companyName || vendorInfo.username || username || '',
      phone: vendorInfo.phone || vendorInfo.phoneNumber || '',
      roles: vendorInfo.roles || [],
      permissions: vendorInfo.permissions || [],
      menu,
      vendorInfo,
    })
    setActiveScopeValue(AUTH_SCOPE_PROVIDER)
  }

  const loginEmployee = ({ token, empInfo = {}, account = '' } = {}) => {
    clearScope(AUTH_SCOPE_EMPLOYEE, { skipHydrate: true })
    patchScopeProfile(AUTH_SCOPE_EMPLOYEE, {
      token: token || '',
      id: empInfo.empId ? String(empInfo.empId) : '',
      name: empInfo.name || empInfo.empName || '',
      phone: empInfo.phoneNumber || account || '',
      roles: empInfo.roles || [],
      permissions: empInfo.permissions || [],
    })
    setActiveScopeValue(AUTH_SCOPE_EMPLOYEE)
  }

  const logout = (scope = '') => {
    if (VALID_SCOPES.includes(scope)) {
      clearScope(scope)
      return
    }

    clearClientScopes({ skipHydrate: true })
    clearScope(AUTH_SCOPE_EMPLOYEE, { skipHydrate: true })
    clearActiveAuthScope()
    activeScope.value = ''
    markHydrated()
  }

  const hasEmployeePermission = (permission) =>
    hasPermission(employeePermissions.value, permission)

  const hasClientPermission = (
    permission,
    scope = resolvedClientScope.value,
  ) => hasPermission(getScopeState(scope).permissions || [], permission)

  if (typeof window !== 'undefined') {
    hydrateFromStorage()
  }

  return {
    hydrated,
    activeScope,
    userAuth,
    providerAuth,
    employeeAuth,
    resolvedClientScope,
    currentClientState,
    currentClientId,
    currentClientPhone,
    clientDisplayName,
    currentClientPermissions,
    isClientLoggedIn,
    isCurrentUser,
    isCurrentProvider,
    employeeToken,
    employeeId,
    employeeRoles,
    employeePermissions,
    employeeDisplayName,
    allowedAdminMenus,
    firstAllowedAdminPath,
    hydrateFromStorage,
    setActiveScope: setActiveScopeValue,
    patchScopeProfile,
    clearClientScopes,
    loginUser,
    loginProvider,
    loginEmployee,
    clearScope,
    logout,
    hasEmployeePermission,
    hasClientPermission,
  }
})
