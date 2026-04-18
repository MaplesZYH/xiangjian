export const ADMIN_MENU_CONFIG = [
  { id: 1, name: '员工管理', path: '/manageAdmin', permission: 'emp:list' },
  { id: 2, name: '用户管理', path: '/manageUser', permission: 'user:list' },
  {
    id: 3,
    name: '订单管理',
    path: '/manageUser-DetailsOrder',
    permission: 'order:list',
  },
  {
    id: 8,
    name: '设计订单',
    path: '/manageDesignOrder',
    permission: 'order:list',
  },
  { id: 4, name: '商户管理', path: '/manageServer', permission: 'vendor:list' },
  {
    id: 5,
    name: '产品管理',
    path: '/manageHouse',
    permission: 'product:admin:list',
  },
  {
    id: 6,
    name: '选配管理',
    path: '/manageOption',
    permission: ['optional:admin:list', 'category:admin:list'],
  },
  {
    id: 7,
    name: '财务管理',
    path: '/manageFinancial',
    permission: ['payment:list', 'refund:list'],
  },
]

export const getEmployeePermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('employeePermissions') || '[]')
  } catch {
    return []
  }
}

export const hasPermission = (permissions, requiredPermission) => {
  if (!requiredPermission) {
    return true
  }
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false
  }
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some((item) => permissions.includes(item))
  }
  return permissions.includes(requiredPermission)
}

export const getAllowedAdminMenus = (permissions) => {
  return ADMIN_MENU_CONFIG.filter((item) =>
    hasPermission(permissions, item.permission)
  )
}

export const getFirstAllowedAdminPath = (permissions) => {
  const allowedMenus = getAllowedAdminMenus(permissions)
  return allowedMenus.length > 0 ? allowedMenus[0].path : ''
}

export const getMenuByPath = (path) => {
  return ADMIN_MENU_CONFIG.find((item) => item.path === path)
}
