<template>
  <div class="admin-body-sider">
    <div class="main-panel">
      <div
        class="menus"
        :class="{ active: isActive(menu.path) }"
        v-for="menu in menuList"
        :key="menu.id"
        @click="toPage(menu.path)"
      >
        <n-icon size="18" class="menu-icon">
          <component :is="getMenuIcon(menu.path)" />
        </n-icon>
        <span>{{ menu.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import {
  CardOutline,
  ColorPaletteOutline,
  DocumentTextOutline,
  HammerOutline,
  HomeOutline,
  LayersOutline,
  PersonCircleOutline,
  PricetagOutline,
} from '@/icons/ionicons'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { allowedAdminMenus } = storeToRefs(authStore)

const menuIconMap = {
  '/manageAdmin': PersonCircleOutline,
  '/manageUser': CardOutline,
  '/manageUser-DetailsOrder': DocumentTextOutline,
  '/manageDesignOrder': ColorPaletteOutline,
  '/manageServer': HomeOutline,
  '/manageHouse': LayersOutline,
  '/manageOption': HammerOutline,
  '/manageFinancial': PricetagOutline,
}

const menuList = allowedAdminMenus

const getMenuIcon = (path) => menuIconMap[path] || HomeOutline
const isActive = (path) => route.path === path

const toPage = (path) => {
  router.push(path)
}
</script>

<style lang="scss" scoped>
.admin-body-sider {
  max-width: none;
  width: 100%;
  min-height: 100%;

  .main-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    padding: 12px 10px;
    overflow-y: auto;

    .menus {
      padding: 12px 14px;
      border-radius: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.84);
      transition: all 0.2s;

      &:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.14);
        transform: translateX(2px);
      }

      &.active {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.18);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
      }

      .menu-icon {
        flex-shrink: 0;
      }

      span {
        text-align: left;
        line-height: 1.5;
      }
    }
  }
}

@media (max-width: 768px) {
  .admin-body-sider {
    .main-panel {
      padding: 14px 12px 18px;
    }

    .main-panel .menus {
      min-height: 48px;
      padding: 12px 14px;
    }
  }
}
</style>
