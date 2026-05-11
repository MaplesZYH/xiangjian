import { onBeforeUnmount, onMounted, watch } from 'vue'
import { AUTH_SCOPE_PROVIDER } from '@/utils/auth'

export const useProviderCenterViewLifecycle = ({
  authStore,
  activeMenu,
  pagination,
  fetchVendorInfo,
  refreshVendorOrders,
  vendorInfo,
  acceptedNeedHandleCount,
  unrepliedOrderCount,
  maybeShowPendingOrderNotification,
  closePendingOrderNotification,
}) => {
  onMounted(() => {
    authStore.setActiveScope(AUTH_SCOPE_PROVIDER)
    fetchVendorInfo()
  })

  watch(activeMenu, (menu) => {
    if (menu === 'orders') {
      pagination.page = 1
      refreshVendorOrders()
    }
  })

  watch(
    () => [
      vendorInfo.value?.id,
      acceptedNeedHandleCount.value,
      unrepliedOrderCount.value,
    ],
    () => {
      maybeShowPendingOrderNotification()
    },
    { flush: 'post' },
  )

  onBeforeUnmount(() => {
    closePendingOrderNotification()
  })
}
