<template>
  <div class="navigation-shell">
    <!-- 导航栏 -->
    <nav class="navbar" :class="{ scrolled }">
      <!-- 左侧 logo -->
      <div class="logo">
        <img
          src="https://www.xiangjiancn.cn/static/img/logo.4169042e.png"
          alt="乡建在线"
          class="logo-img"
          decoding="async"
          fetchpriority="high"
        />
      </div>

      <!-- 桌面端导航 -->
      <ul class="nav-links">
        <li v-for="item in menuItems" :key="item.label">
          <router-link :to="item.link">
            <span class="menu-link-content">
              <n-icon size="16">
                <component :is="item.icon" />
              </n-icon>
              <span>{{ item.label }}</span>
            </span>
          </router-link>
        </li>
      </ul>

      <!-- 用户状态区域 -->
      <div class="user-status">
        <!-- 登录状态显示用户名 -->
        <div v-if="isLoggedIn" class="user-name" @click="toAdmin">
          <span class="user-name__icon">
            <n-icon size="18"><component :is="currentUserIcon" /></n-icon>
          </span>
          <span class="user-name__text">{{ userName }}</span>
        </div>
        <!-- 未登录显示登录链接 -->
        <router-link v-else to="/login" class="login-link">
          <n-icon size="16"><PersonCircleOutline /></n-icon>
          <span>登录/注册</span>
        </router-link>
      </div>

      <!-- 移动端：登录/注册 + 汉堡菜单 -->
      <div class="mobile-user-status">
        <div v-if="isLoggedIn" class="user-name" @click="toAdmin">
          <span class="user-name__icon">
            <n-icon size="18"><component :is="currentUserIcon" /></n-icon>
          </span>
          <span class="user-name__text">{{ userName }}</span>
        </div>
        <router-link v-else to="/login" class="login-link" @click="closeMenu">
          <n-icon size="16"><PersonCircleOutline /></n-icon>
          <span>登录/注册</span>
        </router-link>
      </div>
      <button class="hamburger" @click="toggleMenu" aria-label="菜单">
        <span class="bar" :class="{ open: menuOpen }"></span>
        <span class="bar" :class="{ open: menuOpen }"></span>
        <span class="bar" :class="{ open: menuOpen }"></span>
      </button>
    </nav>
    <transition name="slide">
      <div v-show="menuOpen" class="mobile-drawer">
        <ul class="mobile-menu">
          <li v-for="item in menuItems" :key="item.label">
            <router-link :to="item.link" @click="closeMenu">
              <span class="menu-link-content">
                <n-icon size="18">
                  <component :is="item.icon" />
                </n-icon>
                <span>{{ item.label }}</span>
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </transition>
    <div class="navbar-spacer" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { computed, markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  CardOutline,
  HammerOutline,
  HomeOutline,
  LayersOutline,
  PersonCircleOutline,
} from '@/icons/ionicons'
import { AUTH_SCOPE_PROVIDER } from '@/utils/auth'
import registerAPI from '@/api/service/register'
import { useAuthStore } from '@/stores/auth/useAuthStore'

/* ------------------ 导航栏滚动阴影 ------------------ */
const scrolled = ref(false)
const onScroll = () => (scrolled.value = window.scrollY > 50)

/* ------------------ 一级汉堡菜单 ------------------ */
const menuOpen = ref(false)
const menuItems = [
  { label: '首页', link: '/', icon: markRaw(HomeOutline) },
  { label: '户型选择', link: '/houseList', icon: markRaw(LayersOutline) },
  { label: '加入供应链', link: '/service', icon: markRaw(HammerOutline) },
]

// 跳转到管理员页面
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const {
  resolvedClientScope,
  currentClientId,
  currentClientState,
  clientDisplayName,
  isClientLoggedIn,
} =
  storeToRefs(authStore)
const syncingProviderName = ref(false)

const toAdmin = () => {
  const scope = resolvedClientScope.value
  if (scope) {
    authStore.setActiveScope(scope)
  }
  router.push('/adminCenter')
}

const isLoggedIn = computed(() => isClientLoggedIn.value)
const userName = computed(() => clientDisplayName.value)
const currentScope = computed(() => resolvedClientScope.value)

const currentUserIcon = computed(() => {
  return currentScope.value === AUTH_SCOPE_PROVIDER
    ? markRaw(CardOutline)
    : markRaw(PersonCircleOutline)
})

const syncProviderCompanyName = async () => {
  if (
    syncingProviderName.value ||
    !isLoggedIn.value ||
    currentScope.value !== AUTH_SCOPE_PROVIDER ||
    !currentClientId.value
  ) {
    return
  }

  const storedCompanyName = currentClientState.value?.info?.companyName
  if (storedCompanyName && clientDisplayName.value === storedCompanyName) {
    return
  }

  syncingProviderName.value = true
  try {
    const res = await registerAPI.registerInfo(currentClientId.value)
    if (res?.code === 200 && res.data?.companyName) {
      authStore.patchScopeProfile(AUTH_SCOPE_PROVIDER, {
        name: res.data.companyName,
        vendorInfo: {
          ...(currentClientState.value?.info || {}),
          ...res.data,
          vendorId: currentClientId.value,
        },
      })
    }
  } catch (error) {
    console.warn('同步服务商公司名称失败', error)
  } finally {
    syncingProviderName.value = false
  }
}

const AUTH_STORAGE_PREFIXES = [
  'auth:token:',
  'auth:user:',
  'auth:provider:',
  'auth:employee:',
]
const AUTH_STORAGE_KEYS = ['employeeRoles', 'employeePermissions']

const handleStorageChange = (event) => {
  const changedKey = String(event?.key || '')
  if (
    changedKey &&
    !AUTH_STORAGE_KEYS.includes(changedKey) &&
    !AUTH_STORAGE_PREFIXES.some((prefix) => changedKey.startsWith(prefix))
  ) {
    return
  }

  authStore.hydrateFromStorage()
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  }
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  window.addEventListener('storage', handleStorageChange)
  syncProviderCompanyName()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('storage', handleStorageChange)
})

watch(
  () => [isLoggedIn.value, currentScope.value, currentClientId.value],
  () => {
    syncProviderCompanyName()
  },
  { immediate: true },
)

const toggleMenu = () => (menuOpen.value = !menuOpen.value)
const closeMenu = () => (menuOpen.value = false)
</script>

<style lang="scss" scoped>
.navigation-shell {
  --navbar-reserved-height: 78px;
  --navbar-inline-padding: clamp(16px, 4vw, 5%);
}

.navbar-spacer {
  height: var(--navbar-reserved-height);
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 15px var(--navbar-inline-padding);
  background: rgba(244, 247, 244, 0.88);
  border-bottom: 1px solid rgba(37, 54, 43, 0.08);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(16px);
  z-index: 1000;
  transition:
    padding 0.3s ease,
    background-color 0.3s ease,
    box-shadow 0.3s ease;

  &.scrolled {
    padding: 10px var(--navbar-inline-padding);
    background: rgba(255, 255, 255, 0.94);
    box-shadow: var(--shadow-medium);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;

    .logo-img {
      height: 36px;
      width: auto;
    }
  }

  .nav-links {
    display: flex;
    margin: 0;
    padding: 0;

    li {
      margin: 0 10px;
    }

    a {
      display: inline-flex;
      align-items: center;
      padding: 9px 14px;
      border-radius: 999px;
      color: var(--color-text-secondary);
      font-weight: 700;
      text-decoration: none;
      transition: all 0.25s ease;

      .menu-link-content {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      &:hover {
        background: var(--color-brand-soft);
        color: var(--color-brand-700);
      }
    }

    :deep(.router-link-active) {
      color: var(--color-brand-700);
      background: rgba(86, 183, 106, 0.14);
      box-shadow: inset 0 0 0 1px rgba(39, 110, 61, 0.08);
    }
  }

  .user-status {
    .login-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--color-text-secondary);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s ease;

      &:hover {
        color: var(--color-brand-700);
      }
    }

    .user-name {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 999px;
      font-weight: 700;
      color: var(--color-text-primary);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(231, 240, 233, 0.96));
      border: 1px solid rgba(39, 110, 61, 0.14);
      cursor: pointer;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(238, 244, 239, 1));
        box-shadow: var(--shadow-sm);
      }
    }
  }

  .hamburger {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 40px;
    height: 40px;
    margin-left: 10px;
    padding: 0;
    border: 1px solid rgba(39, 110, 61, 0.12);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.86);
    box-shadow: var(--shadow-sm);
    cursor: pointer;

    .bar {
      display: block;
      width: 18px;
      height: 2px;
      border-radius: 999px;
      background: var(--color-brand-700);
      transition: 0.3s;

      &.open:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
      }

      &.open:nth-child(2) {
        opacity: 0;
      }

      &.open:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
      }
    }
  }

  .mobile-user-status {
    display: none;
    margin-left: auto;
    min-width: 0;
    max-width: calc(100% - 124px);

    .login-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--color-text-secondary);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s ease;

      &:hover {
        color: var(--color-brand-700);
      }
    }

    .user-name {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      min-width: 0;
      border-radius: 999px;
      font-weight: 600;
      color: var(--color-text-primary);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(231, 240, 233, 0.96));
      border: 1px solid rgba(39, 110, 61, 0.14);
      cursor: pointer;
    }
  }

  .user-name__icon {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-brand-700);
    background: rgba(39, 110, 61, 0.1);
    flex-shrink: 0;
  }

  .user-name__text {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

}

.mobile-drawer {
  position: fixed;
  top: var(--navbar-reserved-height);
  right: 0;
  bottom: 0;
  left: 0;
  min-height: calc(100vh - var(--navbar-reserved-height));
  min-height: calc(100dvh - var(--navbar-reserved-height));
  background: rgba(244, 247, 244, 0.98);
  z-index: 999;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px var(--navbar-inline-padding)
    calc(24px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);

  .mobile-menu {
    margin: 0;
    padding: 0;

    li {
      border-bottom: 1px solid var(--color-border-soft);
    }

    a {
      display: block;
      padding: 14px 0;
      color: var(--color-text-secondary);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s ease;

      .menu-link-content {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      &:hover {
        color: var(--color-brand-700);
      }
    }
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
}

@media (max-width: 992px) {
  .navigation-shell {
    --navbar-reserved-height: 70px;
    --navbar-inline-padding: clamp(14px, 4vw, 20px);
  }

  .navbar {
    .nav-links,
    .user-status {
      display: none !important;
    }

    .hamburger,
    .mobile-user-status {
      display: flex;
      align-items: center;
    }
  }
}

@media (max-width: 576px) {
  .navigation-shell {
    --navbar-reserved-height: 64px;
  }

  .navbar {
    gap: 10px;
    padding-top: 12px;
    padding-bottom: 12px;

    &.scrolled {
      padding-top: 10px;
      padding-bottom: 10px;
    }

    .logo .logo-img {
      height: 30px;
    }

    .mobile-user-status {
      max-width: calc(100% - 96px);

      .login-link,
      .user-name {
        padding: 6px 9px;
        font-size: 13px;
      }
    }

    .user-name__icon {
      width: 24px;
      height: 24px;
    }

    .user-name__text {
      max-width: 90px;
    }

    .hamburger {
      width: 38px;
      height: 38px;
      margin-left: 0;
    }

    .mobile-drawer {
      padding-top: 16px;
    }
  }
}

@media (min-width: 993px) {
  .navbar {
    .hamburger,
    .mobile-drawer,
    .mobile-user-status {
      display: none !important;
    }
  }
}
</style>
