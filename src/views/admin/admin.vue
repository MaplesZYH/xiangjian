<template>
  <div class="admin-layout">
    <div class="header-wrap" :class="{ entered: headerEntered }">
      <CommonHeader
        :show-mobile-menu-btn="isMobile"
        :mobile-menu-open="mobileMenuOpen"
        @toggle-mobile-menu="toggleMobileMenu"
      />
    </div>

    <div class="admin-body">
      <div
        v-if="isMobile && mobileMenuOpen"
        class="mobile-menu-mask"
        @click="closeMobileMenu"
      ></div>

      <!-- 左边内容 -->
      <div
        class="aside-wrap"
        :class="{ entered: asideEntered, 'is-open': mobileMenuOpen }"
      >
        <CommonAside />
      </div>
      <!-- 右边内容 -->
      <div class="admin-body-content">
        <div class="admin-content-inner">
          <router-view></router-view>
        </div>
      </div>
    </div>
    <div class="admin-footer"></div>
    <!-- 底部 -->
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMaxWidth } from '@/composables/useMaxWidth'

const headerEntered = ref(false)
const asideEntered = ref(false)
const mobileMenuOpen = ref(false)
const route = useRoute()

const MOBILE_BREAKPOINT = 992
const isMobile = useMaxWidth(MOBILE_BREAKPOINT)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

watch(
  () => route.path,
  () => {
    if (isMobile.value) {
      closeMobileMenu()
    }
  }
)

watch(isMobile, (mobile) => {
  if (!mobile) {
    mobileMenuOpen.value = false
  }
})

onMounted(() => {
  requestAnimationFrame(() => {
    headerEntered.value = true
  })
  setTimeout(() => {
    asideEntered.value = true
  }, 180)
})
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(86, 183, 106, 0.12), transparent 30%),
    linear-gradient(180deg, #f4f7f4 0%, #eef4ef 100%);

  .admin-body {
    margin: 0 auto;
    width: 100%;
    flex: 1;
    display: flex;
    position: relative;
    background: transparent;

    .admin-body-content {
      flex: 1;
      width: 100%;
      min-width: 0;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.92);
      border-left: 1px solid var(--color-border-soft);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
    }
  }
}

.mobile-menu-mask {
  position: fixed;
  top: 56px;
  right: 0;
  bottom: 48px;
  left: 0;
  background: rgba(37, 54, 43, 0.42);
  z-index: 1090;
}

.admin-content-inner {
  padding: clamp(10px, 2vw, 18px);
}

.admin-footer {
  height: 48px;
  background: linear-gradient(180deg, #25362b 0%, #1d2821 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.header-wrap {
  opacity: 0;
  transform: translateY(-30px);
  transition:
    transform 0.85s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.85s ease;
}

.header-wrap.entered {
  opacity: 1;
  transform: translateY(0);
}

.aside-wrap {
  opacity: 0;
  transform: translateX(-34px);
  width: 252px;
  flex: 0 0 252px;
  transition:
    transform 0.95s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.95s ease;
}

.aside-wrap.entered {
  opacity: 1;
  transform: translateX(0);
}

:deep(.admin-body-sider) {
  background: var(--gradient-panel) !important;
  border-left: none !important;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

:deep(.admin-body-sider .main-panel .menus) {
  color: rgba(255, 255, 255, 0.82);
  border-color: rgba(255, 255, 255, 0.18);
}

:deep(.admin-body-sider .main-panel .menus:hover) {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

@media (max-width: 1200px) {
  .aside-wrap {
    width: 230px;
    flex-basis: 230px;
  }
}

@media (max-width: 992px) {
  .mobile-menu-mask {
    bottom: 44px;
  }

  .aside-wrap {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 44px;
    width: min(300px, 82vw);
    max-width: none;
    flex: none;
    opacity: 1;
    transform: translateX(-100%);
    transition: transform 0.35s ease;
    z-index: 1100;
    box-shadow: var(--shadow-strong);
  }

  .aside-wrap.entered {
    transform: translateX(-100%);
  }

  .aside-wrap.is-open {
    transform: translateX(0);
  }

  .admin-layout .admin-body .admin-body-content {
    border-left: none;
  }

  .admin-content-inner {
    padding: 12px;
  }

  .admin-footer {
    height: 44px;
  }
}
</style>
