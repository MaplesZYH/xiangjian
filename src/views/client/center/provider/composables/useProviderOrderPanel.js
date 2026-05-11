import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDialog, useMessage } from 'naive-ui'
import VendorOrderAPI from '@/api/service/vendorOrder'
import { useVendorOrderStore } from '@/stores/order/useVendorOrderStore'
import { useVendorProfileStore } from '@/stores/vendor/useVendorProfileStore'
import {
  canCancelVendorOrder,
  getProviderCenterErrorMessage,
  isDispatchStageLockedForVendor,
} from '@/views/client/center/provider/composables/providerCenterHelpers'

export const useProviderOrderPanel = () => {
  const message = useMessage()
  const dialog = useDialog()
  const vendorOrderStore = useVendorOrderStore()
  const vendorProfileStore = useVendorProfileStore()

  const {
    orderList,
    ordersLoading,
    orderStatusTab,
    unrepliedOrderCount,
    acceptedNeedHandleCount,
    sortedOrderList,
  } = storeToRefs(vendorOrderStore)
  const { vendorInfo } = storeToRefs(vendorProfileStore)

  const pagination = vendorOrderStore.pagination
  const currentOrderId = ref(null)
  const showNoteModal = ref(false)
  const noteModalTitle = ref('')
  const noteModalActionText = ref('')
  const noteModalPlaceholder = ref('')
  const actionNote = ref('')

  const fetchOrders = async () => {
    const vendorId = vendorInfo.value?.id
    if (!vendorId) return

    try {
      await vendorOrderStore.fetchOrders(vendorId)
    } catch (error) {
      message.error(getProviderCenterErrorMessage(error, '获取订单列表失败'))
    }
  }

  const refreshVendorOrders = async () => {
    const vendorId = vendorInfo.value?.id
    if (!vendorId) return
    await fetchOrders()
    await vendorOrderStore.refreshOrderSummary(vendorId, {
      currentStatus: Number(orderStatusTab.value),
    })
  }

  const handleOrderTabChange = (value) => {
    orderStatusTab.value = String(value)
    pagination.page = 1
    refreshVendorOrders()
  }

  const handlePageChange = (page) => {
    pagination.page = page
    fetchOrders()
  }

  const handleAcceptConfirm = (row) => {
    dialog.success({
      title: '确认接单',
      content: '确定接下该订单吗？系统不会再提示备注。',
      positiveText: '确认接单',
      negativeText: '再想想',
      onPositiveClick: async () => {
        try {
          const res = await VendorOrderAPI.getManageOrderAccept(row.id, {
            vendorNotes: '',
          })
          if (res.code === 200) {
            message.success('接单成功')
            row.orderStatus = 1
            await refreshVendorOrders()
          } else {
            message.error(res.msg || '接单失败')
          }
        } catch {
          message.error('接单请求异常')
        }
      },
    })
  }

  const handleRejectConfirm = (row) => {
    currentOrderId.value = row.id
    noteModalTitle.value = '确认拒单'
    noteModalActionText.value = '确认拒单'
    noteModalPlaceholder.value = '请输入拒单理由（建议填写）'
    actionNote.value = ''
    showNoteModal.value = true
  }

  const submitOrderAction = async () => {
    try {
      const res = await VendorOrderAPI.getManageOrderReject(currentOrderId.value, {
        vendorNotes: actionNote.value,
      })
      if (res.code === 200) {
        message.success('操作成功')
        showNoteModal.value = false
        refreshVendorOrders()
      } else {
        message.error(res.msg || '操作失败')
      }
    } catch {
      message.error('网络请求异常')
    }
  }

  const handleCancelOrder = (row) => {
    if (isDispatchStageLockedForVendor(row)) {
      message.warning('订单已进入施工阶段，当前派单已锁定，不能取消')
      return
    }

    dialog.warning({
      title: '取消订单',
      content: '确定要取消这个正在进行中的订单吗？此操作不可逆。',
      positiveText: '确定取消',
      negativeText: '暂不取消',
      onPositiveClick: async () => {
        try {
          const res = await VendorOrderAPI.getManageOrderCancel(row.id, {
            vendorNotes: '',
          })
          if (res.code === 200) {
            message.success('订单已取消')
            row.orderStatus = 4
            await refreshVendorOrders()
          } else {
            message.error(res.msg || '取消失败')
          }
        } catch {
          message.error('请求异常')
        }
      },
    })
  }

  return {
    orderList,
    ordersLoading,
    orderStatusTab,
    unrepliedOrderCount,
    acceptedNeedHandleCount,
    sortedOrderList,
    pagination,
    currentOrderId,
    showNoteModal,
    noteModalTitle,
    noteModalActionText,
    noteModalPlaceholder,
    actionNote,
    fetchOrders,
    refreshVendorOrders,
    handleOrderTabChange,
    handlePageChange,
    handleAcceptConfirm,
    handleRejectConfirm,
    submitOrderAction,
    handleCancelOrder,
    isNeedHandleConstructionStatus:
      vendorOrderStore.isNeedHandleConstructionStatus,
    canCancelVendorOrder,
  }
}
