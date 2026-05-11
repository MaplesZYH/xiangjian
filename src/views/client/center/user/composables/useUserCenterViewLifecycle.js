import { onBeforeUnmount, onMounted, watch } from 'vue'
import { AUTH_SCOPE_USER } from '@/utils/auth'

export const useUserCenterViewLifecycle = ({
  emit,
  userName,
  pendingOrderNotificationItems,
  maybeShowPendingOrderNotification,
  detailTab,
  showDetailModal,
  currentOrder,
  loadPendingPaymentBills,
  activeMenu,
  pagination,
  fetchOrders,
  designPagination,
  fetchDesignOrders,
  initDesignOrderPaymentTracking,
  favoritePagination,
  fetchFavorites,
  authStore,
  initializeProfile,
  message,
  router,
  handleVisibilityChange,
  handleWindowFocus,
  cleanupOrderPanel,
  stopDesignPaymentStatusPolling,
}) => {
  watch(
    userName,
    (name) => {
      emit('updateName', name || '用户')
    },
    { immediate: true },
  )

  watch(
    () =>
      pendingOrderNotificationItems.value
        .map((item) => `${item.key}:${item.badgeCount}`)
        .join('|'),
    () => {
      maybeShowPendingOrderNotification()
    },
    { flush: 'post' },
  )

  watch(detailTab, (value) => {
    if (value === 'bills' && showDetailModal.value && currentOrder.value?.id) {
      loadPendingPaymentBills(currentOrder.value.id)
    }
  })

  onMounted(() => {
    authStore.setActiveScope(AUTH_SCOPE_USER)
    initializeProfile().catch((error) => {
      message.error(error?.message || '登录状态异常，请重新登录')
      router.push('/login')
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    initDesignOrderPaymentTracking()
    if (activeMenu.value === 'orders') {
      fetchOrders()
    }
    if (activeMenu.value === 'designOrders') {
      fetchDesignOrders()
    }
    if (activeMenu.value === 'favorites') {
      fetchFavorites()
    }
  })

  watch(activeMenu, (newVal) => {
    if (newVal === 'orders') {
      pagination.page = 1
      fetchOrders()
    }
    if (newVal === 'designOrders') {
      designPagination.page = 1
      fetchDesignOrders()
      initDesignOrderPaymentTracking()
    }
    if (newVal === 'favorites') {
      favoritePagination.page = 1
      fetchFavorites()
    }
  })

  onBeforeUnmount(() => {
    cleanupOrderPanel()
    stopDesignPaymentStatusPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleWindowFocus)
  })
}
