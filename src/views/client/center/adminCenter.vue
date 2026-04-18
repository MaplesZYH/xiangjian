<template>
  <Navigation />
  <div class="nav-placeholder" :style="{ height: `${navHeight}px` }"></div>

  <div class="admin-header">
    <div class="admin-header-content">
      <h1>乡建在线管理平台</h1>
      <p>专业乡村建房服务平台，为您提供高效便捷的管理体验</p>

      <div class="user-info">
        <n-icon :component="PersonCircleOutline" size="24" />
        <span>{{ userName }}（{{ userRoleText }}）</span>
      </div>
    </div>
  </div>

  <div class="main-content">
    <UserAdmin
      v-if="userRole === 'user'"
      @updateName="handleUserInfoUpdate"
    />
    <ServiceAdmin
      v-else-if="userRole === 'provider'"
      @updateName="handleUserInfoUpdate"
    />
    <div v-else class="no-role">
      <n-result status="403" title="未登录" description="请先登录后访问个人中心">
        <template #footer>
          <n-button type="primary" @click="goToLogin">去登录</n-button>
        </template>
      </n-result>
    </div>
  </div>

  <Footer />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { PersonCircleOutline } from '@/icons/ionicons'
import Navigation from '@/components/client/Navigation.vue'
import UserAdmin from '@/components/client/UserAdmin.vue'
import ServiceAdmin from '@/components/client/ServiceAdmin.vue'
import Footer from '@/components/client/Footer.vue'
import { useAuthStore } from '@/stores/auth/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()
const { resolvedClientScope, clientDisplayName, isClientLoggedIn } =
  storeToRefs(authStore)
const navHeight = ref(0)
let navResizeObserver = null

const userRole = computed(() => resolvedClientScope.value)
const userName = computed(() => clientDisplayName.value || '访客')

const userRoleText = computed(() => {
  if (userRole.value === 'user') return '用户'
  if (userRole.value === 'provider') return '服务商'
  return '未登录'
})

const handleUserInfoUpdate = (newName) => {
  if (newName && userRole.value) {
    authStore.patchScopeProfile(userRole.value, { name: newName })
  }
}

const updateNavHeight = () => {
  const nav = document.querySelector('.navbar')
  if (nav) {
    navHeight.value = nav.offsetHeight
  }
}

const observeNavHeight = () => {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
    return
  }

  const nav = document.querySelector('.navbar')
  if (!nav) return

  navResizeObserver?.disconnect()
  navResizeObserver = new ResizeObserver(() => {
    updateNavHeight()
  })
  navResizeObserver.observe(nav)
}

const initUserInfo = () => {
  if (!isClientLoggedIn.value || !userRole.value) {
    router.replace('/login')
    return
  }

  authStore.setActiveScope(userRole.value)
}

const goToLogin = () => {
  router.replace('/login')
}

onMounted(() => {
  updateNavHeight()
  observeNavHeight()
  initUserInfo()
})

onBeforeUnmount(() => {
  navResizeObserver?.disconnect()
  navResizeObserver = null
})
</script>

<style lang="scss" scoped>
.nav-placeholder {
  transition: height 0.3s ease;
}

.admin-header {
  position: relative;
  height: 280px;
  background: linear-gradient(rgba(26, 107, 60, 0.85), rgba(26, 107, 60, 0.9)),
    url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1950&q=80')
      center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.admin-header-content {
  max-width: 900px;
  width: 100%;
  z-index: 2;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.8rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  p {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 1.5rem;
  }
}

.user-info {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 1.1rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 10px 24px rgba(37, 54, 43, 0.12);
}

.main-content {
  min-height: calc(100vh - 280px - 60px);
  width: min(calc(100% - (var(--page-gutter) * 2)), 1280px);
  margin: 0 auto;
  padding: 30px 0 40px;
  background: var(--color-page);
}

.no-role {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

@media (max-width: 768px) {
  .admin-header {
    padding: 30px 15px;
    height: 240px;
  }

  .admin-header-content {
    h1 {
      font-size: 2rem;
    }

    p {
      font-size: 1rem;
    }
  }

  .main-content {
    width: min(calc(100% - (var(--page-gutter) * 2)), 100%);
    padding: 20px 0 32px;
  }
}
</style>
