<template>
  <!-- <n-modal-provider></n-modal-provider> -->
  <n-config-provider :locale="zhCN" :theme-overrides="naiveThemeOverrides">
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <router-view />
          <n-back-top
            v-if="showClientBackTop"
            :listen-to="backTopTarget"
            :right="24"
            :bottom="28"
            :visibility-height="120"
            style="z-index: 1200"
          />
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { zhCN } from 'naive-ui'
import { useRoute } from 'vue-router'
import { naiveThemeOverrides } from '@/theme/naive'

const route = useRoute()
const backTopTarget = () =>
  (typeof document !== 'undefined'
    ? document.scrollingElement || document.documentElement
    : null)

const showClientBackTop = computed(() => {
  const path = route.path || ''
  return path !== '/adminLogin' && !path.startsWith('/admin') && !path.startsWith('/manage')
})
</script>

<style lang="scss" scoped></style>
