import { computed } from 'vue'

export const useManageDetailOrderPaymentBills = ({
  detailOrder,
  constructionInfo,
  constructionNodeStatus,
}) => {
  const shouldShowWaitUploadHighlight = computed(
    () =>
      Number(constructionInfo.value?.currentNodeStatus) ===
      constructionNodeStatus.WAIT_UPLOAD,
  )

  const shouldShowWaitUserAuditHighlight = computed(
    () =>
      Number(constructionInfo.value?.currentNodeStatus) ===
      constructionNodeStatus.WAIT_USER_AUDIT,
  )

  const shouldShowWaitBillPaymentHighlight = computed(
    () =>
      Number(constructionInfo.value?.currentNodeStatus) ===
      constructionNodeStatus.WAIT_PAYMENT,
  )

  const formatCurrencyAmount = (value) => Number(value || 0).toLocaleString()

  const formatDateTime = (value) => {
    if (!value) return '--'
    return String(value).replace('T', ' ')
  }

  const paymentBillTypeMap = {
    BUILD_DEPOSIT: '建房定金',
    ADJUSTMENT: '补差账单',
    OPTION_CHANGE: '选配变更补价',
    STAGE_PAYMENT: '节点进度款',
  }

  const getPaymentBillTypeText = (billType) =>
    paymentBillTypeMap[billType] || billType || '待支付账单'

  const getPaymentBillTypeTagType = (billType) => {
    if (billType === 'BUILD_DEPOSIT') return 'warning'
    if (billType === 'ADJUSTMENT') return 'error'
    if (billType === 'OPTION_CHANGE') return 'warning'
    if (billType === 'STAGE_PAYMENT') return 'info'
    return 'default'
  }

  const sortAdminPaymentBills = (rows = []) =>
    [...rows].sort((left, right) => {
      const leftTime = left?.createTime ? new Date(left.createTime).getTime() : 0
      const rightTime = right?.createTime
        ? new Date(right.createTime).getTime()
        : 0
      if (leftTime !== rightTime) return rightTime - leftTime
      return Number(right?.id || 0) - Number(left?.id || 0)
    })

  const getBuildDepositPendingBill = () => {
    const pendingRows = Array.isArray(detailOrder.value?.pendingPaymentBills)
      ? detailOrder.value.pendingPaymentBills
      : []
    return pendingRows.find((bill) => bill?.billType === 'BUILD_DEPOSIT') || null
  }

  const getBuildDepositBillAmount = () => {
    const pendingBill = getBuildDepositPendingBill()
    const pendingAmount = Number(pendingBill?.amount)
    if (Number.isFinite(pendingAmount) && pendingAmount > 0) {
      return pendingAmount
    }

    const paidAmount = Number(detailOrder.value?.paidAmount)
    if (Number.isFinite(paidAmount) && paidAmount > 0) {
      return paidAmount
    }

    return null
  }

  const getBuildDepositBillCreateTime = () => {
    const pendingBill = getBuildDepositPendingBill()
    return (
      pendingBill?.createTime ||
      detailOrder.value?.createTime ||
      detailOrder.value?.payTime ||
      detailOrder.value?.paymentTime ||
      null
    )
  }

  const resolveAdminBillStatus = (bill) => {
    const rawStatus = String(bill?.status || '').trim().toUpperCase()
    if (rawStatus === 'PAID') return 'PAID'
    if (rawStatus === 'REFUNDED') return 'REFUNDED'
    if (rawStatus === 'CANCELLED') return 'CANCELLED'
    if (rawStatus === 'EXPIRED') return 'EXPIRED'
    return 'PENDING'
  }

  const adminPendingPaymentBillRows = computed(() => {
    const rows = Array.isArray(detailOrder.value?.pendingPaymentBills)
      ? detailOrder.value.pendingPaymentBills
      : []
    const latestOptionChangeBill = sortAdminPaymentBills(
      rows.filter((bill) => bill?.billType === 'OPTION_CHANGE'),
    )[0]
    const latestOptionChangeBillId = Number(latestOptionChangeBill?.id || 0)

    return sortAdminPaymentBills(
      rows.filter((bill) => {
        if (bill?.billType !== 'OPTION_CHANGE') return true
        return latestOptionChangeBillId > 0 && Number(bill?.id || 0) === latestOptionChangeBillId
      }),
    )
  })

  const buildDepositAdminStatus = computed(() => {
    if (getBuildDepositPendingBill()) return 'PENDING'
    const paymentStatus = Number(detailOrder.value?.paymentStatus)
    if (paymentStatus === 3) return 'REFUNDED'
    if ([1, 2].includes(paymentStatus)) return 'PAID'
    return 'PENDING'
  })

  const adminPaymentBillRows = computed(() => {
    const rows = [...adminPendingPaymentBillRows.value]
    const hasBuildDepositBill = rows.some((bill) => bill?.billType === 'BUILD_DEPOSIT')

    if (!hasBuildDepositBill && detailOrder.value?.id) {
      rows.unshift({
        id: `build-deposit-${detailOrder.value.id}`,
        billType: 'BUILD_DEPOSIT',
        status: buildDepositAdminStatus.value,
        amount: getBuildDepositBillAmount(),
        remark: '--',
        relatedNodeId: null,
        billTitle: '建房定金',
        createTime: getBuildDepositBillCreateTime(),
      })
    }

    return sortAdminPaymentBills(rows)
  })

  const hasAdminPaymentBillRows = computed(() => adminPaymentBillRows.value.length > 0)

  const getAdminBillStatusText = (bill) => {
    const status = resolveAdminBillStatus(bill)
    const statusMap = {
      PENDING: '待支付',
      PAID: '已支付',
      REFUNDED: '已退款',
      CANCELLED: '已取消',
      EXPIRED: '已失效',
    }
    return statusMap[status] || '待支付'
  }

  const getAdminBillStatusTagType = (bill) => {
    const status = resolveAdminBillStatus(bill)
    if (status === 'PAID') return 'success'
    if (status === 'REFUNDED') return 'error'
    if (status === 'CANCELLED' || status === 'EXPIRED') return 'default'
    return 'warning'
  }

  const resolveStagePaymentNodeName = (bill) => {
    const relatedNodeId = Number(bill?.relatedNodeId || 0)
    if (relatedNodeId > 0) {
      const relatedNode = (constructionInfo.value?.nodeDetails || []).find(
        (node) => Number(node?.nodeId || node?.id) === relatedNodeId,
      )
      if (relatedNode?.name) return relatedNode.name
    }

    const rawTitle = String(bill?.billTitle || '').trim()
    if (!rawTitle) return ''
    const titleParts = rawTitle.split(/[:：]/)
    if (titleParts.length > 1) {
      const nodeName = titleParts[titleParts.length - 1].trim()
      if (nodeName) return nodeName
    }
    return rawTitle
  }

  const getAdminBillDisplayTitle = (bill) => {
    if (bill?.billType === 'BUILD_DEPOSIT') return '建房定金'
    if (bill?.billType === 'STAGE_PAYMENT') {
      return resolveStagePaymentNodeName(bill) || '--'
    }
    return bill?.billTitle || '--'
  }

  const getBillRelatedNodeName = (bill) => {
    const relatedNodeId = Number(bill?.relatedNodeId || 0)
    if (!relatedNodeId) return '--'

    const relatedNode = (constructionInfo.value?.nodeDetails || []).find(
      (node) => Number(node?.nodeId || node?.id) === relatedNodeId,
    )

    return relatedNode?.name || '--'
  }

  return {
    shouldShowWaitUploadHighlight,
    shouldShowWaitUserAuditHighlight,
    shouldShowWaitBillPaymentHighlight,
    formatCurrencyAmount,
    formatDateTime,
    getPaymentBillTypeText,
    getPaymentBillTypeTagType,
    adminPaymentBillRows,
    hasAdminPaymentBillRows,
    getAdminBillStatusText,
    getAdminBillStatusTagType,
    getAdminBillDisplayTitle,
    getBillRelatedNodeName,
  }
}
