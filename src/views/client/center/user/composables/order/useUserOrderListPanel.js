import { computed } from 'vue'
import { getOrderPaymentStatus } from '@/utils/orderPayment'
import { usePendingOrderNotification } from '@/views/client/center/user/composables/usePendingOrderNotification'
import {
  buildCurrentOrderContractUrls,
  formatOrderStatus,
  formatPaymentStatus,
  getDetailPaymentChannelText,
  getDetailPaymentChannelType,
  getDetailPaymentStageText,
  getPaymentBillTypeText,
  getPaymentBillTypeTagType,
  getPaymentStatusType,
  paymentChannelOptions,
  getStatusType,
} from '@/views/client/center/user/composables/order/orderHelpers'

export const useUserOrderListPanel = ({
  orderStore,
  orderList,
  currentOrder,
  activeOrderStatusTag,
  orderStatusFilterTagConfigs,
  pagination,
  userName,
  userInfo,
  notification,
  message,
  getStoredUserId,
  currentOrderPaymentStatus,
}) => {
  const getOrderProductName = (order) => orderStore.getOrderProductName(order)
  const hasUploadedContract = (order) => orderStore.hasUploadedContract(order)
  const getPaymentRecordIdFromOrder = (order) =>
    orderStore.getPaymentRecordIdFromOrder(order)

  const currentOrderContactName = computed(
    () => currentOrder.value?.userName || userName.value || '--',
  )
  const currentOrderContactPhone = computed(
    () => currentOrder.value?.userPhone || userInfo.value?.phone || '--',
  )
  const currentOrderContractUrls = computed(() =>
    buildCurrentOrderContractUrls(currentOrder.value),
  )

  const isOrderNeedingAttention = (order) => {
    const status = Number(order?.orderStatus)
    if ([4, 5].includes(status)) return false
    if (status === 3) return true
    return hasUploadedContract(order) && getOrderPaymentStatus(order) === 0
  }

  const orderStatusCountMap = computed(() => {
    const counts = Object.create(null)
    orderList.value.forEach((item) => {
      const statusKey = String(Number(item?.orderStatus))
      counts[statusKey] = Number(counts[statusKey] || 0) + 1
      if (isOrderNeedingAttention(item)) {
        counts.attentionAll = Number(counts.attentionAll || 0) + 1
        counts[`attention:${statusKey}`] =
          Number(counts[`attention:${statusKey}`] || 0) + 1
      }
    })
    return counts
  })

  const visibleOrderList = computed(() => {
    if (activeOrderStatusTag.value === 'all') return orderList.value
    return orderList.value.filter(
      (item) =>
        String(Number(item?.orderStatus)) === activeOrderStatusTag.value,
    )
  })

  const orderStatusFilterTabs = computed(() =>
    orderStatusFilterTagConfigs.map((item) => {
      const badgeCount =
        item.key === 'all'
          ? Number(orderStatusCountMap.value.attentionAll || 0)
          : Number(orderStatusCountMap.value[`attention:${item.key}`] || 0)
      const isSilentTab = ['all', '4', '5'].includes(item.key)

      return {
        ...item,
        badgeCount,
        showBadge: !isSilentTab && badgeCount > 0,
      }
    }),
  )

  const pendingOrderNotificationItems = computed(() =>
    orderStatusFilterTabs.value.filter((item) => item.showBadge),
  )

  const { closePendingOrderNotification, maybeShowPendingOrderNotification } =
    usePendingOrderNotification({
      pendingOrderNotificationItems,
      getStoredUserId,
      notification,
      message,
    })

  const canOpenRefundCenter = (row) => {
    const status = getOrderPaymentStatus(row)
    const hasPaidAmount = Number(row?.paidAmount || 0) > 0
    const hasPaymentRecord = Boolean(getPaymentRecordIdFromOrder(row))
    if (status === 0 && !hasPaidAmount && !hasPaymentRecord) return false
    return true
  }

  const openOrderPaymentStatementModal = async (showOrderPaymentStatementModal) => {
    showOrderPaymentStatementModal.value = true
    try {
      const res = await orderStore.loadOrderPaymentStatement()
      if (res?.code !== 200) {
        message.error(res?.msg || '获取支付协议失败')
      }
    } catch (error) {
      void error
      message.error('获取支付协议失败')
    }
  }

  const handlePageChange = (page, fetchOrders) => {
    pagination.page = page
    fetchOrders()
  }

  const cleanupOrderListPanel = () => {
    closePendingOrderNotification()
  }

  return {
    paymentChannelOptions,
    currentOrderPaymentStatus,
    currentOrderContactName,
    currentOrderContactPhone,
    currentOrderContractUrls,
    orderStatusFilterTabs,
    visibleOrderList,
    pendingOrderNotificationItems,
    getOrderProductName,
    hasUploadedContract,
    canOpenRefundCenter,
    formatOrderStatus,
    formatPaymentStatus,
    getStatusType,
    getPaymentStatusType,
    getDetailPaymentChannelText,
    getDetailPaymentChannelType,
    getDetailPaymentStageText,
    getPaymentBillTypeText,
    getPaymentBillTypeTagType,
    maybeShowPendingOrderNotification,
    openOrderPaymentStatementModal,
    handlePageChange,
    cleanupOrderListPanel,
  }
}
