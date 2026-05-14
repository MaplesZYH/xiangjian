import { computed, onBeforeUnmount, ref } from 'vue'
import { useDialog, useMessage, useNotification } from 'naive-ui'
import orderAPI from '@/api/user/userOrder.js'
import { AUTH_SCOPE_USER, getAuthStorage } from '@/utils/auth'
import { getOrderPaymentStatus } from '@/utils/orderPayment'
import { useUserOrderConstruction } from '@/views/client/center/user/composables/order/useUserOrderConstruction'
import {
  formatAmount,
  formatCurrencyNumber,
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  getDetailPaymentChannelText,
  getDetailPaymentChannelType,
  getDetailPaymentStageText,
  getPaymentBillDisplayTitle,
  getPaymentBillStatusTagType,
  getPaymentBillStatusText,
  getPaymentBillTypeTagType,
  getPaymentBillTypeText,
  getPaymentStatusType,
  getStatusType,
} from '@/views/client/center/user/composables/order/orderHelpers'
import { useUserOrderListPanel } from '@/views/client/center/user/composables/order/useUserOrderListPanel'
import { useUserOrderOptions } from '@/views/client/center/user/composables/order/useUserOrderOptions'
import { useUserOrderPayments } from '@/views/client/center/user/composables/order/useUserOrderPayments'
import { useUserOrderRefunds } from '@/views/client/center/user/composables/order/useUserOrderRefunds'

export const useUserOrderPanel = ({
  orderStore,
  optionCatalogStore,
  canApplyRefund,
  canViewRefund,
  orderList,
  currentOrder,
  detailPaymentRecords,
  refundSubmitting,
  activeOrderStatusTag,
  orderStatusFilterTagConfigs,
  pagination,
  userName,
  userInfo,
  paymentBridge,
  fetchOrders,
  onOpenOrderDetail,
  onRefreshDesignOrderAfterPayment,
}) => {
  const message = useMessage()
  const notification = useNotification()
  const dialog = useDialog()

  const getStoredUserId = () => getAuthStorage(AUTH_SCOPE_USER, 'id')

  const showDetailModal = ref(false)
  const detailTab = ref('info')
  const pendingPaymentBills = ref([])

  const orderPanelBridge = {
    loadPendingPaymentBills: async () => [],
    loadDetailPaymentRecords: async () => {},
    confirmUserBillPayment: async () => null,
    hydrateUserOptionSelection: () => {},
    loadUserOptionalChangeRecords: async () => [],
    openPendingBillPaymentModal: () => {},
    cancelPendingBill: async () => false,
  }

  const currentOrderPaymentStatus = computed(() =>
    getOrderPaymentStatus(currentOrder.value),
  )

  const syncCurrentOrderFromServer = async (orderId = currentOrder.value?.id) => {
    const userId = getStoredUserId()
    return orderStore.syncCurrentOrderFromServer({ userId, orderId })
  }

  const listPanel = useUserOrderListPanel({
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
  })

  const constructionPanel = useUserOrderConstruction({
    currentOrder,
    detailTab,
    showDetailModal,
    pendingPaymentBills,
    getStoredUserId,
    message,
    dialog,
    fetchOrders,
    syncCurrentOrderFromServer,
    loadPendingPaymentBills: (...args) =>
      orderPanelBridge.loadPendingPaymentBills(...args),
    loadDetailPaymentRecords: (...args) =>
      orderPanelBridge.loadDetailPaymentRecords(...args),
    confirmUserBillPayment: (...args) =>
      orderPanelBridge.confirmUserBillPayment(...args),
  })

  const paymentsPanel = useUserOrderPayments({
    currentOrder,
    paymentBridge,
    pendingPaymentBills,
    constructionInfo: constructionPanel.constructionInfo,
    getStoredUserId,
    message,
    fetchOrders,
    syncCurrentOrderFromServer,
    loadDetailPaymentRecords: (...args) =>
      orderPanelBridge.loadDetailPaymentRecords(...args),
    hydrateUserOptionSelection: (...args) =>
      orderPanelBridge.hydrateUserOptionSelection(...args),
    loadUserOptionalChangeRecords: (...args) =>
      orderPanelBridge.loadUserOptionalChangeRecords(...args),
    startConstructionPaymentPolling:
      constructionPanel.startConstructionPaymentPolling,
    refreshConstructionAfterNodePayment:
      constructionPanel.refreshConstructionAfterNodePayment,
  })

  const optionsPanel = useUserOrderOptions({
    optionCatalogStore,
    currentOrder,
    detailPaymentRecords,
    constructionInfo: constructionPanel.constructionInfo,
    getStoredUserId,
    fetchOrders,
    message,
    syncCurrentOrderFromServer,
    loadPendingPaymentBills: (...args) =>
      orderPanelBridge.loadPendingPaymentBills(...args),
    loadDetailPaymentRecords: (...args) =>
      orderPanelBridge.loadDetailPaymentRecords(...args),
    openPendingBillPaymentModal: (...args) =>
      orderPanelBridge.openPendingBillPaymentModal(...args),
    detailTab,
  })

  const loadDetailPaymentRecords = async (orderId) => {
    const userId = getStoredUserId()
    try {
      await orderStore.loadDetailPaymentRecords({
        orderId,
        userId,
        canViewRefund: canViewRefund.value,
      })
    } catch (error) {
      void error
    }
  }

  const refundsPanel = useUserOrderRefunds({
    orderStore,
    canApplyRefund,
    canViewRefund,
    currentOrder,
    detailPaymentRecords,
    refundSubmitting,
    getStoredUserId,
    getOrderProductName: listPanel.getOrderProductName,
    getDetailPaymentStageText,
    latestOptionalChangeRefundPaymentRecord:
      optionsPanel.latestOptionalChangeRefundPaymentRecord,
    loadDetailPaymentRecords,
    syncCurrentOrderFromServer,
    fetchOrders,
    message,
    dialog,
  })

  orderPanelBridge.loadDetailPaymentRecords = loadDetailPaymentRecords
  orderPanelBridge.hydrateUserOptionSelection =
    optionsPanel.hydrateUserOptionSelection
  orderPanelBridge.loadUserOptionalChangeRecords =
    optionsPanel.loadUserOptionalChangeRecords
  orderPanelBridge.openPendingBillPaymentModal =
    paymentsPanel.openPendingBillPaymentModal
  orderPanelBridge.confirmUserBillPayment = paymentsPanel.confirmUserBillPayment
  orderPanelBridge.cancelPendingBill = paymentsPanel.cancelPendingBill

  const originalLoadPendingPaymentBills = paymentsPanel.loadPendingPaymentBills
  orderPanelBridge.loadPendingPaymentBills = async (
    orderId = currentOrder.value?.id,
  ) => {
    const rows = await originalLoadPendingPaymentBills(orderId)
    pendingPaymentBills.value = rows
    return rows
  }

  const shouldShowOptionalChangePendingBillTag = (record) =>
    optionsPanel.shouldShowOptionalChangePendingBillTag(
      pendingPaymentBills,
      record,
    )

  const latestPendingOptionalChangeBill = computed(() => {
    const latestRecord = optionsPanel.latestUserOptionalChangeRecord.value
    if (!latestRecord) return null
    return (
      pendingPaymentBills.value.find(
        (item) => Number(item?.id || 0) === Number(latestRecord?.linkedBillId),
      ) || null
    )
  })

  const pendingPaymentBillRows = computed(() => {
    const rows = pendingPaymentBills.value.filter((item) => {
      if (item?.billType !== 'OPTION_CHANGE') return true
      const latestBillId = Number(latestPendingOptionalChangeBill.value?.id || 0)
      return latestBillId > 0 && Number(item?.id || 0) === latestBillId
    })
    if (
      constructionPanel.currentConstructionPayableBill.value &&
      !constructionPanel.currentConstructionPayableBill.value.id
    ) {
      rows.unshift(constructionPanel.currentConstructionPayableBill.value)
    }
    return rows.sort((a, b) => {
      const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
      const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })
  })

  const hasPendingPaymentBills = computed(
    () => pendingPaymentBillRows.value.length > 0,
  )

  const handleCancelOrder = (row) => {
    const orderStatus = Number(row?.orderStatus)

    if (orderStatus === 4) {
      message.warning('已完成订单不能取消')
      return
    }

    if (orderStatus === 5) {
      message.warning('该订单已取消')
      return
    }

    if (listPanel.hasUploadedContract(row)) {
      message.warning('合同已上传，订单不能在线取消')
      return
    }

    const hasPaidAmount = getOrderPaymentStatus(row) !== 0

    dialog.warning({
      title: '取消订单',
      content: hasPaidAmount
        ? '确定要取消该订单吗？订单取消后将自动提交退款申请，等待后台审核。'
        : '确定要取消该订单吗？此操作无法恢复。',
      positiveText: '确认取消',
      negativeText: '暂不取消',
      onPositiveClick: async () => {
        const userId = getStoredUserId()
        if (!userId || !row?.id) {
          message.error('登录状态失效，请重新登录')
          return false
        }

        try {
          const res = await orderAPI.cancelOrder(row.id, userId, '用户取消订单')
          if (res.code === 200) {
            message.success(
              hasPaidAmount
                ? '订单已取消，已自动提交退款申请，请等待后台审核'
                : '订单已取消',
            )
            await fetchOrders()
            if (currentOrder.value?.id === row.id) {
              await viewOrderDetail({ ...row, orderStatus: 5 }, detailTab.value)
            }
            return true
          }
          message.error(res.msg || '取消失败')
        } catch (error) {
          const msg =
            error?.response?.data?.msg ||
            error?.msg ||
            error?.message ||
            '取消订单失败'
          message.error(String(msg))
        }
        return false
      },
    })
  }

  const getOrderBusinessFlowSteps = (order) => {
    const paymentStatus = getOrderPaymentStatus(order)
    const contractUploaded = listPanel.hasUploadedContract(order)
    const orderStatus = Number(order?.orderStatus)

    const depositDescription =
      paymentStatus > 0 ? '已完成首笔定金支付' : '待支付首笔定金'
    const contractDescription = contractUploaded
      ? '后台已上传合同'
      : '等待后台上传合同'

    let dispatchDescription = '等待平台派单'
    if (orderStatus === 1) {
      dispatchDescription = '平台正在分配服务商'
    } else if (orderStatus >= 2) {
      dispatchDescription = '服务商已接单'
    }

    let pricingDescription = '待后台确认整单金额方案'
    if (orderStatus >= 3) {
      pricingDescription = '已确认开工金额方案'
    } else if (orderStatus === 2) {
      pricingDescription = '派单完成后由后台确认'
    }

    let loopDescription = '待进入节点循环'
    if (orderStatus === 3) {
      if (
        Number(constructionPanel.constructionInfo.value?.currentNodeStatus) === 6
      ) {
        loopDescription = '当前节点待支付'
      } else {
        loopDescription =
          constructionPanel.constructionInfo.value?.currentNodeStatusText ||
          '施工进行中'
      }
    } else if (orderStatus >= 4) {
      loopDescription = '全部节点已结束'
    }

    return [
      { key: 'submit', title: '用户下单', description: '主体产品 + 选配产品' },
      { key: 'deposit', title: '支付定金', description: depositDescription },
      { key: 'contract', title: '上传合同', description: contractDescription },
      { key: 'dispatch', title: '派单接单', description: dispatchDescription },
      {
        key: 'pricing',
        title: '施工金额',
        description: pricingDescription,
      },
      { key: 'loop', title: '节点循环', description: loopDescription },
    ]
  }

  const getCurrentBusinessFlowStep = (order) => {
    const paymentStatus = getOrderPaymentStatus(order)
    const contractUploaded = listPanel.hasUploadedContract(order)
    const orderStatus = Number(order?.orderStatus)

    if (orderStatus >= 4) return 6
    if (orderStatus >= 3) return 6
    if (orderStatus >= 2) return 5
    if (orderStatus >= 1) return 4
    if (contractUploaded) return 3
    if (paymentStatus > 0) return 2
    return 1
  }

  async function viewOrderDetail(row, initialTab = 'info') {
    detailTab.value = initialTab
    const userId = getStoredUserId()
    showDetailModal.value = true
    orderStore.clearCurrentOrder()
    constructionPanel.constructionInfo.value = null
    constructionPanel.currentNodeDetail.value = null
    pendingPaymentBills.value = []
    optionsPanel.resetUserOptionalChangeRecords()
    optionsPanel.resetUserOptionSelectionChanges()

    try {
      const res = await orderStore.loadOrderDetail({
        row,
        userId,
        canViewRefund: canViewRefund.value,
      })

      if (res?.code === 200 && currentOrder.value) {
        await optionsPanel.loadUserOptionConfigList()
        pendingPaymentBills.value = currentOrder.value.pendingPaymentBills || []
        if ([3, 4].includes(currentOrder.value.orderStatus)) {
          await constructionPanel.loadConstructionFlow(currentOrder.value.id)
        }
        await orderPanelBridge.loadPendingPaymentBills(currentOrder.value.id)
        await optionsPanel.loadUserOptionalChangeRecords(currentOrder.value.id)
        optionsPanel.hydrateUserOptionSelection()
      } else {
        message.error('获取详情失败')
        currentOrder.value = row
      }
    } catch (error) {
      void error
      message.error('网络错误，无法获取详情')
    }
  }

  if (typeof onOpenOrderDetail === 'function') {
    onOpenOrderDetail(viewOrderDetail)
  }

  const handleReturnToPage = () => {
    paymentsPanel.syncPendingOrderPaymentOnFocus()
    if (typeof onRefreshDesignOrderAfterPayment === 'function') {
      onRefreshDesignOrderAfterPayment()
    }
    constructionPanel.syncPendingConstructionPaymentOnFocus()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      handleReturnToPage()
    }
  }

  const handleWindowFocus = () => {
    handleReturnToPage()
  }

  const cleanup = () => {
    listPanel.cleanupOrderListPanel()
    paymentsPanel.stopPaymentStatusPolling()
    constructionPanel.stopConstructionPaymentPolling(true)
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    userOptionConfigLoading: optionsPanel.userOptionConfigLoading,
    userOptionConfigList: optionsPanel.userOptionConfigList,
    userOptionSelectionMap: optionsPanel.userOptionSelectionMap,
    userOptionSubmitting: optionsPanel.userOptionSubmitting,
    userOptionalChangeLoading: optionsPanel.userOptionalChangeLoading,
    visibleUserOptionalChangeRecords: optionsPanel.visibleUserOptionalChangeRecords,
    constructionInfo: constructionPanel.constructionInfo,
    currentNodeDetail: constructionPanel.currentNodeDetail,
    pendingPaymentBillsLoading: paymentsPanel.pendingPaymentBillsLoading,
    showAuditRejectModal: constructionPanel.showAuditRejectModal,
    auditRejectReason: constructionPanel.auditRejectReason,
    showPaymentModal: paymentsPanel.showPaymentModal,
    paymentSubmitting: paymentsPanel.paymentSubmitting,
    paymentForm: paymentsPanel.paymentForm,
    paymentTarget: paymentsPanel.paymentTarget,
    showDetailModal,
    detailTab,
    showOrderPaymentStatementModal: paymentsPanel.showOrderPaymentStatementModal,
    showRefundDetailModal: refundsPanel.showRefundDetailModal,
    showRefundModal: refundsPanel.showRefundModal,
    refundTarget: refundsPanel.refundTarget,
    refundForm: refundsPanel.refundForm,
    refundQuickReason: refundsPanel.refundQuickReason,
    refundReasonOptions: refundsPanel.refundReasonOptions,
    paymentChannelOptions: paymentsPanel.paymentChannelOptions,
    paymentModalTitle: paymentsPanel.paymentModalTitle,
    currentOrderPaymentStatus,
    currentOrderContactName: listPanel.currentOrderContactName,
    currentOrderContactPhone: listPanel.currentOrderContactPhone,
    currentOrderContractUrls: listPanel.currentOrderContractUrls,
    orderStatusFilterTabs: listPanel.orderStatusFilterTabs,
    visibleOrderList: listPanel.visibleOrderList,
    getOrderProductName: listPanel.getOrderProductName,
    hasUploadedContract: listPanel.hasUploadedContract,
    formatOrderStatus,
    formatPaymentStatus,
    getDetailPaymentChannelText,
    getDetailPaymentChannelType,
    getDetailPaymentStageText,
    getPaymentBillTypeText,
    getPaymentBillTypeTagType,
    getPaymentBillStatusTagType,
    getPaymentBillStatusText,
    getPaymentBillDisplayTitle: (bill) =>
      getPaymentBillDisplayTitle(bill, constructionPanel.constructionInfo.value),
    getPaymentStatusType,
    canRepayBill: paymentsPanel.canRepayBill,
    canCancelPendingOptionChangeBill:
      paymentsPanel.canCancelPendingOptionChangeBill,
    getPendingBillActionText: paymentsPanel.getPendingBillActionText,
    handleRefundReasonPresetChange: refundsPanel.handleRefundReasonPresetChange,
    closeRefundModal: refundsPanel.closeRefundModal,
    formatAmount,
    formatCurrencyNumber,
    formatDateTime,
    canAdjustUserOptions: optionsPanel.canAdjustUserOptions,
    userOptionAdjustmentHintText: optionsPanel.userOptionAdjustmentHintText,
    hasUserOptionSelectionChanges: optionsPanel.hasUserOptionSelectionChanges,
    userOptionChangeTypeLabel: optionsPanel.userOptionChangeTypeLabel,
    userOptionChangeSummaryText: optionsPanel.userOptionChangeSummaryText,
    currentEffectiveOptionSnapshot: optionsPanel.currentEffectiveOptionSnapshot,
    pendingTargetOptionSnapshot: optionsPanel.pendingTargetOptionSnapshot,
    hasPendingUserOptionalChange: optionsPanel.hasPendingUserOptionalChange,
    canCancelLatestOptionalChange: optionsPanel.canCancelLatestOptionalChange,
    getUserOptionalChangeStatusTagType:
      optionsPanel.getUserOptionalChangeStatusTagType,
    formatOptionalChangeSnapshot: optionsPanel.formatOptionalChangeSnapshot,
    latestOptionalChangeRefundPaymentRecordMissing:
      optionsPanel.latestOptionalChangeRefundPaymentRecordMissing,
    canApplyRefundForLatestOptionalChange:
      refundsPanel.canApplyRefundForLatestOptionalChange,
    canCancelRefundForLatestOptionalChange:
      refundsPanel.canCancelRefundForLatestOptionalChange,
    canViewRefundDetailForLatestOptionalChange:
      refundsPanel.canViewRefundDetailForLatestOptionalChange,
    getRefundAuditOperatorPhone: refundsPanel.getRefundAuditOperatorPhone,
    getRefundStatusText: refundsPanel.getRefundStatusText,
    getRefundStatusTagType: refundsPanel.getRefundStatusTagType,
    canOpenRefundCenter: listPanel.canOpenRefundCenter,
    canApplyRefundForPaymentRecordInList:
      refundsPanel.canApplyRefundForPaymentRecordInList,
    canCancelRefundForPaymentRecordInList:
      refundsPanel.canCancelRefundForPaymentRecordInList,
    canViewRefundDetailForPaymentRecordInList:
      refundsPanel.canViewRefundDetailForPaymentRecordInList,
    getPaymentRecordRefundStatus: refundsPanel.getPaymentRecordRefundStatus,
    hasDetailPaymentRecords: refundsPanel.hasDetailPaymentRecords,
    openRefundModal: refundsPanel.openRefundModal,
    openLatestOptionalChangeRefundModal:
      refundsPanel.openLatestOptionalChangeRefundModal,
    openRefundDetailModal: refundsPanel.openRefundDetailModal,
    openLatestOptionalChangeRefundDetailModal:
      refundsPanel.openLatestOptionalChangeRefundDetailModal,
    submitRefundApply: refundsPanel.submitRefundApply,
    handleCancelRefundApply: refundsPanel.handleCancelRefundApply,
    cancelLatestOptionalChangeRefundApply:
      refundsPanel.cancelLatestOptionalChangeRefundApply,
    handleCancelOrder,
    closePaymentModal: paymentsPanel.closePaymentModal,
    submitPayment: paymentsPanel.submitPayment,
    handleUserOptionSelectionUpdate:
      optionsPanel.handleUserOptionSelectionUpdate,
    resetUserOptionSelectionChanges:
      optionsPanel.resetUserOptionSelectionChanges,
    cancelLatestOptionalChange: optionsPanel.cancelLatestOptionalChange,
    submitUserOptionSelectionChanges: () =>
      optionsPanel.submitUserOptionSelectionChanges(pendingPaymentBills),
    viewOrderDetail,
    handleNodeClick: constructionPanel.handleNodeClick,
    currentNodeDetailStatusText: constructionPanel.currentNodeDetailStatusText,
    isPendingConstructionPaymentForCurrentNode:
      constructionPanel.isPendingConstructionPaymentForCurrentNode,
    currentConstructionPayableBill:
      constructionPanel.currentConstructionPayableBill,
    isPendingUserAudit: constructionPanel.isPendingUserAudit,
    hasPendingPaymentBills,
    pendingPaymentBillRows,
    openCurrentConstructionPayment:
      constructionPanel.openCurrentConstructionPayment,
    handleUserAuditPass: constructionPanel.handleUserAuditPass,
    submitUserAudit: constructionPanel.submitUserAudit,
    getStatusType,
    getOrderBusinessFlowSteps,
    getCurrentBusinessFlowStep,
    getConstructionStepsCurrent: constructionPanel.getConstructionStepsCurrent,
    getNodeStepStatus: constructionPanel.getNodeStepStatus,
    getNodeStepDescription: constructionPanel.getNodeStepDescription,
    handlePageChange: (page) => listPanel.handlePageChange(page, fetchOrders),
    openOrderPaymentStatementModal: () =>
      listPanel.openOrderPaymentStatementModal(
        paymentsPanel.showOrderPaymentStatementModal,
      ),
    closeWechatPayModal: () =>
      paymentsPanel.closeWechatPayModal(onRefreshDesignOrderAfterPayment),
    loadPendingPaymentBills: paymentsPanel.loadPendingPaymentBills,
    maybeShowPendingOrderNotification: listPanel.maybeShowPendingOrderNotification,
    pendingOrderNotificationItems: listPanel.pendingOrderNotificationItems,
    syncPendingOrderPaymentOnFocus: paymentsPanel.syncPendingOrderPaymentOnFocus,
    syncPendingConstructionPaymentOnFocus:
      constructionPanel.syncPendingConstructionPaymentOnFocus,
    handleVisibilityChange,
    handleWindowFocus,
    openPendingBillPaymentModal: paymentsPanel.openPendingBillPaymentModal,
    cancelPendingBill: paymentsPanel.cancelPendingBill,
    shouldShowOptionalChangePendingBillTag,
    cleanup,
  }
}
