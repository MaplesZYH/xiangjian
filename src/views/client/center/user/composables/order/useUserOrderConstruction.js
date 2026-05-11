import { computed, reactive, ref } from 'vue'
import ConstructionAPI from '@/api/house/construction.js'
import {
  CONSTRUCTION_NODE_STATUS,
  normalizeConstructionFlow,
} from '@/utils/construction'
import {
  findPendingStageBillByNodeId,
  resolveConstructionNodeAmount,
} from '@/views/client/center/user/composables/order/orderHelpers'

export const useUserOrderConstruction = ({
  currentOrder,
  detailTab,
  showDetailModal,
  pendingPaymentBills,
  getStoredUserId,
  message,
  dialog,
  fetchOrders,
  syncCurrentOrderFromServer,
  loadPendingPaymentBills,
  loadDetailPaymentRecords,
  confirmUserBillPayment,
}) => {
  const constructionInfo = ref(null)
  const currentNodeDetail = ref(null)
  const showAuditRejectModal = ref(false)
  const auditRejectReason = ref('')

  let constructionPaymentPollTimer = null
  const constructionPaymentTracker = reactive({
    orderId: null,
    nodeId: null,
    billId: null,
  })

  const handleNodeClick = async (node) => {
    if (!currentOrder.value) return
    const orderId = currentOrder.value.id
    try {
      const nodeId = node.nodeId || node.id
      const res = await ConstructionAPI.getConstructionDetail(orderId, nodeId)
      if (res.code === 200) {
        currentNodeDetail.value = res.data
      }
    } catch (error) {
      void error
      message.error('加载节点详情失败')
    }
  }

  const applyConstructionStatus = async (statusData) => {
    const flow = normalizeConstructionFlow(statusData)
    constructionInfo.value = flow

    if (!flow?.nodeDetails?.length) {
      currentNodeDetail.value = null
      return
    }

    const targetIndex =
      flow.currentNodeIndex < flow.nodeDetails.length ? flow.currentNodeIndex : 0
    const targetNode = flow.nodeDetails[targetIndex]
    if (targetNode) {
      await handleNodeClick(targetNode)
    }
  }

  const loadConstructionFlow = async (orderId) => {
    try {
      const res = await ConstructionAPI.getConstructionStatus(orderId)
      if (res.code === 200 && res.data) {
        await applyConstructionStatus(res.data)
      } else {
        constructionInfo.value = null
        currentNodeDetail.value = null
      }
    } catch (error) {
      void error
      constructionInfo.value = null
      currentNodeDetail.value = null
    }
  }

  const showConstructionPaymentResult = () => {
    if (!showDetailModal.value || !currentOrder.value?.id) return
    if (detailTab.value === 'bills') {
      detailTab.value = 'payments'
    }
  }

  const refreshConstructionAfterNodePayment = async (
    orderId = constructionPaymentTracker.orderId || currentOrder.value?.id,
    options = {},
  ) => {
    if (!orderId) return
    await syncCurrentOrderFromServer(orderId)
    await loadPendingPaymentBills(orderId)
    await loadDetailPaymentRecords(orderId)
    await loadConstructionFlow(orderId)
    await fetchOrders()
    if (options.focusPaymentResult) {
      showConstructionPaymentResult()
    }
  }

  const clearConstructionPaymentTracking = () => {
    constructionPaymentTracker.orderId = null
    constructionPaymentTracker.nodeId = null
    constructionPaymentTracker.billId = null
  }

  const stopConstructionPaymentPolling = (clearTracking = false) => {
    if (constructionPaymentPollTimer) {
      window.clearTimeout(constructionPaymentPollTimer)
      constructionPaymentPollTimer = null
    }
    if (clearTracking) {
      clearConstructionPaymentTracking()
    }
  }

  const isConstructionNodePaid = (statusData, nodeId) => {
    if (!statusData?.nodeDetails || !nodeId) return false
    const targetNode = statusData.nodeDetails.find(
      (node) => Number(node.nodeId || node.id) === Number(nodeId),
    )
    return Number(targetNode?.isPaid) === 1
  }

  const startConstructionPaymentPolling = (
    orderId,
    nodeId,
    billId = null,
    attempts = 20,
    delay = 3000,
  ) => {
    stopConstructionPaymentPolling(true)
    if (!orderId || !nodeId) return

    constructionPaymentTracker.orderId = orderId
    constructionPaymentTracker.nodeId = nodeId
    constructionPaymentTracker.billId = billId

    const poll = async () => {
      if (billId) {
        const confirmResult = await confirmUserBillPayment(orderId, billId)
        if (confirmResult?.paid) {
          await refreshConstructionAfterNodePayment(orderId, {
            focusPaymentResult: true,
          })
          stopConstructionPaymentPolling(true)
          return
        }
      }

      try {
        const res = await ConstructionAPI.getConstructionStatus(orderId)
        const flow = normalizeConstructionFlow(res?.data)
        if (res.code === 200 && flow) {
          if (isConstructionNodePaid(flow, nodeId)) {
            await refreshConstructionAfterNodePayment(orderId, {
              focusPaymentResult: true,
            })
            stopConstructionPaymentPolling(true)
            return
          }
        }
      } catch (error) {
        console.error('Poll construction payment status failed', error)
      }

      if (attempts <= 1) {
        stopConstructionPaymentPolling()
        return
      }

      attempts -= 1
      constructionPaymentPollTimer = window.setTimeout(poll, delay)
    }

    constructionPaymentPollTimer = window.setTimeout(poll, delay)
  }

  const syncPendingConstructionPaymentOnFocus = async () => {
    const trackedOrderId = constructionPaymentTracker.orderId
    const trackedNodeId = constructionPaymentTracker.nodeId
    const trackedBillId = constructionPaymentTracker.billId

    if (!trackedOrderId || !trackedNodeId) return

    if (trackedBillId) {
      const confirmResult = await confirmUserBillPayment(
        trackedOrderId,
        trackedBillId,
      )
      if (confirmResult?.paid) {
        await refreshConstructionAfterNodePayment(trackedOrderId, {
          focusPaymentResult: true,
        })
        stopConstructionPaymentPolling(true)
        return
      }
    }

    try {
      const res = await ConstructionAPI.getConstructionStatus(trackedOrderId)
      const flow = normalizeConstructionFlow(res?.data)
      if (!(res.code === 200 && flow)) return

      if (isConstructionNodePaid(flow, trackedNodeId)) {
        await refreshConstructionAfterNodePayment(trackedOrderId, {
          focusPaymentResult: true,
        })
        stopConstructionPaymentPolling(true)
        return
      }
    } catch (error) {
      console.error('Sync construction payment status on focus failed', error)
      return
    }

    if (!constructionPaymentPollTimer) {
      startConstructionPaymentPolling(
        trackedOrderId,
        trackedNodeId,
        trackedBillId,
      )
    }
  }

  const isConstructionFlowCompleted = (flow) => {
    if (!flow?.nodeDetails?.length) return false

    const lastIndex = flow.nodeDetails.length - 1
    const currentIndex = Number(flow.currentNodeIndex)
    if (currentIndex !== lastIndex) return false

    const currentStatus = Number(flow.currentNodeStatus)
    const detailStatus = Number(currentNodeDetail.value?.status)
    return (
      currentStatus === CONSTRUCTION_NODE_STATUS.FINISHED ||
      detailStatus === CONSTRUCTION_NODE_STATUS.FINISHED
    )
  }

  const getConstructionStepsCurrent = (flow) => {
    if (!flow?.nodeDetails?.length) return 0
    return isConstructionFlowCompleted(flow)
      ? flow.nodeDetails.length
      : flow.currentNodeIndex
  }

  const getNodeStepStatus = (
    index,
    currentIndex,
    flow = constructionInfo.value,
  ) => {
    if (isConstructionFlowCompleted(flow)) return 'finish'
    if (index === currentIndex) return 'process'
    if (index < currentIndex) return 'finish'
    return 'wait'
  }

  const getNodeStepDescription = (
    index,
    currentIndex,
    flow = constructionInfo.value,
  ) => {
    const node = flow?.nodeDetails?.[index] || null
    if (node?.statusText) return node.statusText
    if (isConstructionFlowCompleted(flow)) return '已完成'
    if (index === currentIndex) return flow?.currentNodeStatusText || '进行中'
    if (index < currentIndex) return '已完成'
    return '待开始'
  }

  const isPendingUserAudit = computed(() => {
    if (!constructionInfo.value || !constructionInfo.value.nodeDetails) {
      return false
    }
    if (
      Number(constructionInfo.value.currentNodeStatus) !==
      CONSTRUCTION_NODE_STATUS.WAIT_USER_AUDIT
    ) {
      return false
    }

    const activeNodeId =
      constructionInfo.value.nodeDetails[
        constructionInfo.value.currentNodeIndex
      ]?.nodeId
    if (!currentNodeDetail.value) return false

    return currentNodeDetail.value.nodeId === activeNodeId
  })

  const activeConstructionNodeId = computed(() => {
    if (!constructionInfo.value?.nodeDetails?.length) return 0
    const activeNode =
      constructionInfo.value.nodeDetails[
        constructionInfo.value.currentNodeIndex
      ] || null
    return Number(activeNode?.nodeId || activeNode?.id || 0)
  })

  const currentConstructionPayableBill = computed(() => {
    if (!currentOrder.value || !constructionInfo.value?.nodeDetails?.length) {
      return null
    }

    if (
      Number(constructionInfo.value.currentNodeStatus) !==
      CONSTRUCTION_NODE_STATUS.WAIT_PAYMENT
    ) {
      return null
    }

    const activeNode =
      constructionInfo.value.nodeDetails[
        constructionInfo.value.currentNodeIndex
      ] || null
    const activeNodeId = activeConstructionNodeId.value
    if (!activeNodeId) return null

    const existingStageBill = findPendingStageBillByNodeId(
      pendingPaymentBills.value,
      activeNodeId,
    )
    if (existingStageBill) return existingStageBill

    const resolvedAmount = resolveConstructionNodeAmount(
      currentNodeDetail.value,
      activeNode,
    )
    if (!(resolvedAmount > 0)) return null

    return {
      virtualKey: `construction-node-${currentOrder.value.id}-${activeNodeId}`,
      isVirtualConstructionBill: true,
      billType: 'STAGE_PAYMENT',
      relatedNodeId: activeNodeId,
      amount: resolvedAmount,
      billTitle:
        activeNode?.name || currentNodeDetail.value?.nodeName || '当前施工节点',
      remark:
        '当前施工阶段待支付，支付时若后端尚未生成账单，将按当前节点自动拉起支付。',
      createTime:
        currentOrder.value?.updateTime ||
        currentOrder.value?.orderTime ||
        currentOrder.value?.createTime ||
        null,
    }
  })

  const isPendingConstructionPaymentForCurrentNode = computed(() => {
    if (!currentConstructionPayableBill.value) return false
    if (!currentNodeDetail.value) return false
    return (
      Number(currentNodeDetail.value.nodeId || 0) ===
      activeConstructionNodeId.value
    )
  })

  const currentNodeDetailStatusText = computed(() => {
    if (!currentNodeDetail.value) return '--'
    if (
      Number(currentNodeDetail.value.nodeId || 0) ===
      Number(activeConstructionNodeId.value || 0)
    ) {
      return (
        constructionInfo.value?.currentNodeStatusText ||
        currentNodeDetail.value.statusText ||
        '--'
      )
    }

    return currentNodeDetail.value.statusText || '--'
  })

  const openCurrentConstructionPayment = async () => {
    if (!currentOrder.value?.id) return

    await loadPendingPaymentBills(currentOrder.value.id)

    const payableBill = currentConstructionPayableBill.value
    if (!payableBill) {
      message.warning('当前阶段暂未生成待支付账单，请稍后重试')
      return
    }

    detailTab.value = 'bills'
  }

  const submitUserAudit = async (pass, reason = '') => {
    const userIdStr = getStoredUserId()
    if (
      !userIdStr ||
      !currentOrder.value?.id ||
      !currentNodeDetail.value?.nodeId
    ) {
      return
    }
    const userId = Number(userIdStr)

    try {
      const res = await ConstructionAPI.userAudit(
        userId,
        currentOrder.value.id,
        currentNodeDetail.value.nodeId,
        pass,
        reason,
      )
      if (res.code === 200) {
        message.success(pass ? '验收通过' : '已驳回')
        showAuditRejectModal.value = false
        auditRejectReason.value = ''
        await syncCurrentOrderFromServer(currentOrder.value.id)
        await loadConstructionFlow(currentOrder.value.id)
        await loadPendingPaymentBills(currentOrder.value.id)
        await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
        if (pass) {
          detailTab.value = 'bills'
        }
      } else {
        message.error(res.msg || '操作失败')
      }
    } catch (error) {
      void error
      message.error('审核请求异常')
    }
  }

  const handleUserAuditPass = () => {
    dialog.success({
      title: '验收通过',
      content: '确定该施工节点已符合您的要求并验收通过吗？',
      positiveText: '通过',
      negativeText: '取消',
      onPositiveClick: async () => {
        await submitUserAudit(true)
      },
    })
  }

  return {
    constructionInfo,
    currentNodeDetail,
    showAuditRejectModal,
    auditRejectReason,
    handleNodeClick,
    loadConstructionFlow,
    refreshConstructionAfterNodePayment,
    stopConstructionPaymentPolling,
    startConstructionPaymentPolling,
    syncPendingConstructionPaymentOnFocus,
    currentNodeDetailStatusText,
    isPendingConstructionPaymentForCurrentNode,
    currentConstructionPayableBill,
    isPendingUserAudit,
    openCurrentConstructionPayment,
    submitUserAudit,
    handleUserAuditPass,
    getConstructionStepsCurrent,
    getNodeStepStatus,
    getNodeStepDescription,
  }
}
