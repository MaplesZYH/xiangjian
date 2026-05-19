import { computed, reactive, ref } from 'vue'
import {
  formatAmount,
  getRefundAuditOperatorPhone,
  resolvePaymentRecordId,
  refundReasonOptions,
} from '@/views/client/center/user/composables/order/orderHelpers'

export const useUserOrderRefunds = ({
  orderStore,
  canApplyRefund,
  canViewRefund,
  currentOrder,
  detailPaymentRecords,
  refundSubmitting,
  getStoredUserId,
  getOrderProductName,
  getDetailPaymentStageText,
  latestOptionalChangeRefundPaymentRecord,
  loadDetailPaymentRecords,
  syncCurrentOrderFromServer,
  fetchOrders,
  message,
  dialog,
  latestOptionalChangeRecord,
}) => {
  const showRefundDetailModal = ref(false)
  const showRefundModal = ref(false)
  const refundTarget = ref({
    orderId: null,
    orderNumber: '',
    productName: '',
    paidAmount: 0,
    paymentRecordId: null,
    paymentStage: '',
    paymentAmount: 0,
  })
  const refundForm = reactive({
    reason: '',
  })
  const refundQuickReason = ref(null)

  const refundStatusMap = orderStore.refundStatusMap

  const handleRefundReasonPresetChange = (value) => {
    refundQuickReason.value = value
    refundForm.reason = value || ''
  }

  const closeRefundModal = () => {
    if (refundSubmitting.value) return
    showRefundModal.value = false
    refundTarget.value = {
      orderId: null,
      orderNumber: '',
      productName: '',
      paidAmount: 0,
      paymentRecordId: null,
      paymentStage: '',
      paymentAmount: 0,
    }
    refundForm.reason = ''
    refundQuickReason.value = null
  }

  const isUserCanceledRefund = (target) =>
    Number(target?.status ?? target?.refundStatus) === 2 &&
    String(
      target?.auditRemark || target?.refundDetail?.auditRemark || '',
    ).trim() === '用户撤销退款申请'

  const getRefundStatusText = (target) => {
    if (isUserCanceledRefund(target)) return '已撤销'
    const status = Number(target?.status ?? target?.refundStatus)
    return refundStatusMap[status] || '未知'
  }

  const getRefundStatusTagType = (target) => {
    const value = Number(target?.status ?? target?.refundStatus ?? target)
    if (isUserCanceledRefund(target)) return 'default'
    if (value === 4) return 'success'
    if (value === 2 || value === 5) return 'error'
    if (value === 1) return 'info'
    return 'warning'
  }

  const isRefundActiveStatus = (status) => {
    if (status === null || status === undefined || status === '') return false
    return [0, 1, 3].includes(Number(status))
  }

  const getPaymentRecordRefundStatus = (record) => {
    if (
      record?.refundStatus === null ||
      record?.refundStatus === undefined ||
      record?.refundStatus === ''
    ) {
      return null
    }

    const status = Number(record.refundStatus)
    return Number.isNaN(status) ? null : status
  }

  const canApplyRefundForPaymentRecord = (record) => {
    if (!record) return false

    const amount = Number(record.amount || 0)
    if (!(amount > 0)) return false

    const refundStatus = getPaymentRecordRefundStatus(record)

    if (isRefundActiveStatus(refundStatus)) {
      return false
    }

    if (refundStatus !== null && ![2, 5].includes(refundStatus)) {
      return false
    }

    return true
  }

  const canCancelRefundForPaymentRecord = (record) => {
    if (!canApplyRefund.value || !record) return false
    return getPaymentRecordRefundStatus(record) === 0
  }

  const canViewRefundDetailForPaymentRecord = (record) =>
    canViewRefund.value && getPaymentRecordRefundStatus(record) === 4

  const getLatestOptionalChangeRefundState = () => {
    const latestRecord = latestOptionalChangeRecord?.value
    if (!latestRecord) return ''
    return String(latestRecord?.status || '').trim().toUpperCase()
  }

  const isLatestOptionalChangeRefundClosed = () =>
    ['REFUNDED', 'REFUND_PENDING'].includes(getLatestOptionalChangeRefundState())

  const canApplyRefundForLatestOptionalChange = computed(() =>
    !isLatestOptionalChangeRefundClosed() &&
    canApplyRefundForPaymentRecord(latestOptionalChangeRefundPaymentRecord.value),
  )

  const canCancelRefundForLatestOptionalChange = computed(() =>
    isLatestOptionalChangeRefundClosed() &&
    canCancelRefundForPaymentRecord(
      latestOptionalChangeRefundPaymentRecord.value,
    ),
  )

  const canViewRefundDetailForLatestOptionalChange = computed(() =>
    isLatestOptionalChangeRefundClosed() &&
    canViewRefundDetailForPaymentRecord(
      latestOptionalChangeRefundPaymentRecord.value,
    ),
  )

  const isLatestOptionalChangeRefundPaymentRecord = (record) => {
    const latestRecordId = resolvePaymentRecordId(
      latestOptionalChangeRefundPaymentRecord.value,
    )
    const currentRecordId = resolvePaymentRecordId(record)
    return Boolean(
      latestRecordId && currentRecordId && latestRecordId === currentRecordId,
    )
  }

  const canApplyRefundForPaymentRecordInList = (record) =>
    isLatestOptionalChangeRefundPaymentRecord(record) &&
    canApplyRefundForPaymentRecord(record)

  const canCancelRefundForPaymentRecordInList = (record) =>
    isLatestOptionalChangeRefundPaymentRecord(record) &&
    canCancelRefundForPaymentRecord(record)

  const canViewRefundDetailForPaymentRecordInList = (record) =>
    isLatestOptionalChangeRefundPaymentRecord(record) &&
    canViewRefundDetailForPaymentRecord(record)

  const hasDetailPaymentRecords = computed(
    () => detailPaymentRecords.value.length > 0,
  )

  const openRefundModal = (
    paymentRecord,
    { paymentStageText = '', productName = '' } = {},
  ) => {
    if (!canApplyRefundForPaymentRecord(paymentRecord)) {
      message.warning('当前订单暂不支持申请退款')
      return
    }

    const paymentRecordId = resolvePaymentRecordId(paymentRecord)

    refundTarget.value = {
      orderId: currentOrder.value?.id || paymentRecord?.orderId || null,
      orderNumber: currentOrder.value?.orderNumber || '--',
      productName: productName || getOrderProductName(currentOrder.value),
      paidAmount: Number(currentOrder.value?.paidAmount || 0),
      paymentRecordId,
      paymentStage:
        paymentStageText || getDetailPaymentStageText(paymentRecord?.paymentStage),
      paymentAmount: Number(paymentRecord?.amount || 0),
    }

    refundForm.reason = ''
    refundQuickReason.value = null
    showRefundModal.value = true
  }

  const openLatestOptionalChangeRefundModal = () => {
    const paymentRecord = latestOptionalChangeRefundPaymentRecord.value
    if (!paymentRecord) {
      message.warning(
        '未获取到当前订单最近一次已支付节点进度款，请先完成节点付款后再重试',
      )
      return
    }

    openRefundModal(paymentRecord, {
      paymentStageText: '当前订单最近一次已支付节点进度款',
    })
  }

  const openRefundDetailModal = async (paymentRecord) => {
    const userId = getStoredUserId()
    const orderId = Number(currentOrder.value?.id || paymentRecord?.orderId || 0)
    const paymentRecordId = resolvePaymentRecordId(paymentRecord)
    if (
      !userId ||
      !orderId ||
      !paymentRecordId ||
      Number.isNaN(paymentRecordId)
    ) {
      message.warning('未获取到退款详情所需的支付流水信息')
      return
    }

    showRefundDetailModal.value = true

    try {
      const res = await orderStore.fetchRefundDetail({
        orderId,
        userId,
        paymentRecordId,
      })
      if (!(res?.code === 200 && res?.data)) {
        message.error(res.msg || '获取退款详情失败')
      }
    } catch (error) {
      const msg =
        error?.response?.data?.msg ||
        error?.msg ||
        error?.message ||
        '获取退款详情失败'
      message.error(String(msg))
    }
  }

  const openLatestOptionalChangeRefundDetailModal = () => {
    const paymentRecord = latestOptionalChangeRefundPaymentRecord.value
    if (!paymentRecord) {
      message.warning(
        '未获取到当前订单最近一次已支付节点进度款，请先完成节点付款后再重试',
      )
      return
    }

    openRefundDetailModal(paymentRecord)
  }

  const submitRefundApply = async () => {
    const userId = getStoredUserId()
    const orderId = refundTarget.value.orderId
    const paymentRecordId = Number(refundTarget.value.paymentRecordId || 0)
    const reason = refundForm.reason.trim()

    if (!userId) {
      message.error('登录状态失效，请重新登录')
      return
    }
    if (!orderId) {
      message.error('未获取到订单信息')
      return
    }
    if (!paymentRecordId || Number.isNaN(paymentRecordId)) {
      message.error('未获取到系统关联的支付流水，请刷新后重试')
      return
    }
    if (!reason) {
      message.error('请填写退款原因')
      return
    }

    closeRefundModal()
    try {
      const res = await orderStore.submitRefundApply({
        userId,
        paymentRecordId,
        reason,
        orderId,
      })
      if (res.code === 200) {
        message.success('退款申请已提交，等待后台审核')
        if (currentOrder.value?.id === orderId) {
          await loadDetailPaymentRecords(orderId)
          await syncCurrentOrderFromServer(orderId)
        }
        await fetchOrders()
      } else {
        message.error(res.msg || '退款申请提交失败')
      }
    } catch (error) {
      const msg =
        error?.response?.data?.msg ||
        error?.msg ||
        error?.message ||
        '退款申请提交失败'
      message.error(String(msg))
    }
  }

  const handleCancelRefundApply = (paymentRecord) => {
    const userId = getStoredUserId()
    const orderId = Number(currentOrder.value?.id || paymentRecord?.orderId || 0)
    const paymentRecordId = resolvePaymentRecordId(paymentRecord)

    if (
      !userId ||
      !orderId ||
      !paymentRecordId ||
      Number.isNaN(paymentRecordId)
    ) {
      message.warning('未获取到取消退款申请所需信息')
      return
    }

    if (!canCancelRefundForPaymentRecord(paymentRecord)) {
      message.warning('当前退款申请不可撤销')
      return
    }

    dialog.warning({
      title: '取消退款申请',
      content: '确定撤销当前待审核的退款申请吗？撤销后可重新发起申请。',
      positiveText: '确认撤销',
      negativeText: '暂不撤销',
      onPositiveClick: async () => {
        try {
          const res = await orderStore.submitRefundCancel({
            userId,
            paymentRecordId,
            orderId,
          })
          if (res.code === 200) {
            message.success(res.msg || '退款申请已撤销')
            await loadDetailPaymentRecords(orderId)
            await syncCurrentOrderFromServer(orderId)
            await fetchOrders()
            return true
          }
          message.error(res.msg || '取消退款申请失败')
          return false
        } catch (error) {
          const msg =
            error?.response?.data?.msg ||
            error?.msg ||
            error?.message ||
            '取消退款申请失败'
          message.error(String(msg))
          return false
        }
      },
    })
  }

  const cancelLatestOptionalChangeRefundApply = () => {
    const paymentRecord = latestOptionalChangeRefundPaymentRecord.value
    if (!paymentRecord) {
      message.warning(
        '未获取到当前订单最近一次已支付节点进度款，请先完成节点付款后再重试',
      )
      return
    }

    handleCancelRefundApply(paymentRecord)
  }

  return {
    showRefundDetailModal,
    showRefundModal,
    refundTarget,
    refundForm,
    refundQuickReason,
    refundReasonOptions,
    hasDetailPaymentRecords,
    canApplyRefundForLatestOptionalChange,
    canCancelRefundForLatestOptionalChange,
    canViewRefundDetailForLatestOptionalChange,
    getRefundAuditOperatorPhone,
    getRefundStatusText,
    getRefundStatusTagType,
    canApplyRefundForPaymentRecordInList,
    canCancelRefundForPaymentRecordInList,
    canViewRefundDetailForPaymentRecordInList,
    getPaymentRecordRefundStatus,
    formatAmount,
    handleRefundReasonPresetChange,
    closeRefundModal,
    openRefundModal,
    openLatestOptionalChangeRefundModal,
    openRefundDetailModal,
    openLatestOptionalChangeRefundDetailModal,
    submitRefundApply,
    handleCancelRefundApply,
    cancelLatestOptionalChangeRefundApply,
  }
}
