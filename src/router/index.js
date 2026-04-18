import { createRouter, createWebHashHistory } from 'vue-router'
import pinia from '@/stores'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { AUTH_SCOPE_EMPLOYEE, isAdminPath } from '@/utils/auth'
import { getMenuByPath } from '@/utils/adminAuth'

const routes = [
  {
    path: '/adminLogin',
    name: 'adminLogin',
    component: () => import('@/views/admin/login.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/admin.vue'),
    children: [
      {
        path: '/manageUser',
        name: 'manageUser',
        component: () => import('@/views/admin/manage/manageUser.vue'),
      },
      {
        path: '/manageUser-DetailsOrder',
        name: 'manageUser-DetailsOrder',
        component: () =>
          import('@/views/admin/manage/manageUser-DetailsOrder.vue'),
      },
      {
        path: '/manageServer',
        name: 'manageServer',
        component: () => import('@/views/admin/manage/manageServer.vue'),
      },
      {
        path: '/manageAdmin',
        name: 'manageAdmin',
        component: () => import('@/views/admin/manage/manageAdmin.vue'),
      },
      {
        path: '/manageHouse',
        name: 'manageHouse',
        component: () => import('../views/admin/manage/manageHouse.vue'),
      },
      {
        path: '/manageOption',
        name: 'manageOption',
        component: () => import('@/views/admin/manage/manageOption.vue'),
      },
      {
        path: '/manageFinancial',
        name: 'manageFinancial',
        component: () => import('@/views/admin/manage/manageFinancial.vue'),
      },
    ],
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/client/home.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/client/login.vue'),
  },
  {
    path: '/adminCenter',
    name: 'adminCenter',
    component: () => import('@/views/client/center/adminCenter.vue'),
  },
  {
    path: '/houseList',
    name: 'houseList',
    component: () => import('@/views/client/house/houseList.vue'),
  },
  {
    path: '/houseDetail/:id',
    name: 'houseDetail',
    component: () => import('@/views/client/house/houseDetail.vue'),
  },
  {
    path: '/service',
    name: 'service',
    component: () => import('@/views/client/service.vue'),
  },
]

const router = createRouter({
  routes,
  history: createWebHashHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0, left: 0 }
  },
})

const ADMIN_LOGIN_PATH = '/adminLogin'
const CLIENT_LOGIN_PATH = '/login'
const CLIENT_CENTER_PATH = '/adminCenter'

const createReplaceRedirect = (path) => ({ path, replace: true })

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)
  if (!authStore.hydrated) {
    authStore.hydrateFromStorage()
  }

  const clientScope = authStore.resolvedClientScope
  const hasClientToken = authStore.isClientLoggedIn
  const token = authStore.employeeToken
  const firstAllowedPath = authStore.firstAllowedAdminPath

  if (to.path === ADMIN_LOGIN_PATH) {
    authStore.setActiveScope(AUTH_SCOPE_EMPLOYEE)
    if (token && firstAllowedPath) {
      return createReplaceRedirect(firstAllowedPath)
    }
    return true
  }

  if (!isAdminPath(to.path)) {
    if (to.path === CLIENT_LOGIN_PATH && hasClientToken) {
      authStore.setActiveScope(clientScope)
      return createReplaceRedirect(CLIENT_CENTER_PATH)
    }

    if (to.path === CLIENT_CENTER_PATH) {
      if (!hasClientToken) {
        return createReplaceRedirect(CLIENT_LOGIN_PATH)
      }
      authStore.setActiveScope(clientScope)
    }

    return true
  }

  authStore.setActiveScope(AUTH_SCOPE_EMPLOYEE)

  if (!token) {
    return createReplaceRedirect(ADMIN_LOGIN_PATH)
  }

  if (to.path === '/admin') {
    if (!firstAllowedPath) {
      authStore.logout(AUTH_SCOPE_EMPLOYEE)
      return createReplaceRedirect(ADMIN_LOGIN_PATH)
    }
    return createReplaceRedirect(firstAllowedPath)
  }

  const currentMenu = getMenuByPath(to.path)
  if (!currentMenu) {
    return true
  }

  if (!authStore.hasEmployeePermission(currentMenu.permission)) {
    if (firstAllowedPath) {
      return createReplaceRedirect(firstAllowedPath)
    }
    authStore.logout(AUTH_SCOPE_EMPLOYEE)
    return createReplaceRedirect(ADMIN_LOGIN_PATH)
  }

  return true
})

export default router
