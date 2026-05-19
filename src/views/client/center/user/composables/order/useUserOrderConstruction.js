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
  const selectedConstructionNodeId = ref(null)

  let constructionPaymentPollTimer = null
  const constructionPaymentTracker = reactive({
    orderId: null,
    nodeId: null,
    billId: null,
  })

  const resolveNodeId = (node) => Number(node?.nodeId || node?.id || 0)

  const findNodeById = (flow, nodeId) => {
    if (!flow?.nodeDetails?.length || !(Number(nodeId) > 0)) return null
    return (
      flow.nodeDetails.find((item) => resolveNodeId(item) === Number(nodeId)) ||
      null
    )
  }

  const resolveCurrentFlowNode = (flow) => {
    if (!flow?.nodeDetails?.length) return null

    const currentIndex = Number(flow.currentNodeIndex)
    if (currentIndex >= 0 && currentIndex < flow.nodeDetails.length) {
      return flow.nodeDetails[currentIndex] || null
    }

    return flow.nodeDetails[0] || null
  }

  const buildNodeDetailFromFlowNode = (node = {}, flow = constructionInfo.value) => ({
    ...node,
    nodeId: node?.nodeId || node?.id || null,
    nodeName: node?.nodeName || node?.name || '',
    status:
      node?.status ??
      (Number(node?.nodeId || node?.id || 0) ===
      Number(
        flow?.nodeDetails?.[Number(flow?.currentNodeIndex || 0)]?.nodeId ||
          flow?.nodeDetails?.[Number(flow?.currentNodeIndex || 0)]?.id ||
          0,
      )
        ? flow?.currentNodeStatus
        : node?.status),
    statusText:
      node?.statusText ||
      (Number(node?.nodeId || node?.id || 0) ===
      Number(
        flow?.nodeDetails?.[Number(flow?.currentNodeIndex || 0)]?.nodeId ||
          flow?.nodeDetails?.[Number(flow?.currentNodeIndex || 0)]?.id ||
          0,
      )
        ? flow?.currentNodeStatusText
        : ''),
    progressRecords: Array.isArray(node?.progressRecords) ? node.progressRecords : [],
  })

  const syncCurrentNodeDetail = (
    flow,
    preferredNodeId = selectedConstructionNodeId.value,
  ) => {
    if (!flow?.nodeDetails?.length) {
      selectedConstructionNodeId.value = null
      currentNodeDetail.value = null
      return
    }

    const targetNode =
      findNodeById(flow, preferredNodeId) || resolveCurrentFlowNode(flow)

    selectedConstructionNodeId.value = resolveNodeId(targetNode) || null
    currentNodeDetail.value = targetNode
      ? buildNodeDetailFromFlowNode(targetNode, flow)
      : null
  }

  const applyConstructionFlowFromOrderDetail = (
    preferredNodeId = selectedConstructionNodeId.value,
  ) => {
    const flow = normalizeConstructionFlow(currentOrder.value?.constructionFlow)
    constructionInfo.value = flow

    if (!flow?.nodeDetails?.length) {
      selectedConstructionNodeId.value = null
      currentNodeDetail.value = null
      return
    }

    syncCurrentNodeDetail(flow, preferredNodeId)
  }

  const handleNodeClick = async (node) => {
    if (!constructionInfo.value?.nodeDetails?.length) return
    const nodeId = resolveNodeId(node)
    const targetNode = findNodeById(constructionInfo.value, nodeId)

    if (!targetNode) {
      currentNodeDetail.value = null
      return
    }

    selectedConstructionNodeId.value = nodeId
    currentNodeDetail.value = buildNodeDetailFromFlowNode(
      targetNode,
      constructionInfo.value,
    )
  }

  const loadConstructionFlow = async (orderId) => {
    const normalizedOrderId = Number(orderId || currentOrder.value?.id || 0)
    if (
      normalizedOrderId > 0 &&
      Number(currentOrder.value?.id || 0) === normalizedOrderId
    ) {
      applyConstructionFlowFromOrderDetail()
      return
    }

    const latestOrder = await syncCurrentOrderFromServer(normalizedOrderId)
    if (latestOrder) {
      applyConstructionFlowFromOrderDetail()
      return
    }

    constructionInfo.value = null
    currentNodeDetail.value = null
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
    const preferredNodeId =
      resolveNodeId(currentNodeDetail.value) || constructionPaymentTracker.nodeId
    await syncCurrentOrderFromServer(orderId)
    await loadPendingPaymentBills(orderId)
    await loadDetailPaymentRecords(orderId)
    applyConstructionFlowFromOrderDetail(preferredNodeId)
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

      const latestOrder = await syncCurrentOrderFromServer(orderId)
      const flow = normalizeConstructionFlow(latestOrder?.constructionFlow)
      if (flow && isConstructionNodePaid(flow, nodeId)) {
        await refreshConstructionAfterNodePayment(orderId, {
          focusPaymentResult: true,
        })
        stopConstructionPaymentPolling(true)
        return
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

    const latestOrder = await syncCurrentOrderFromServer(trackedOrderId)
    const flow = normalizeConstructionFlow(latestOrder?.constructionFlow)
    if (!flow) return

    if (isConstructionNodePaid(flow, trackedNodeId)) {
      await refreshConstructionAfterNodePayment(trackedOrderId, {
        focusPaymentResult: true,
      })
      stopConstructionPaymentPolling(true)
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
    const targetNodeId = resolveNodeId(currentNodeDetail.value)

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
        applyConstructionFlowFromOrderDetail(targetNodeId)
        await loadPendingPaymentBills(currentOrder.value.id)
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
    applyConstructionFlowFromOrderDetail,
  }
}
