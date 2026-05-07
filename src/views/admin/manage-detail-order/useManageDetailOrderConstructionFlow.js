import { computed } from 'vue'

export const useManageDetailOrderConstructionFlow = ({
  constructionInfo,
  currentNodeDetail,
  currentDispatchOrder,
  showAuditRejectModal,
  auditRejectReason,
  orderManageStore,
  message,
  dialog,
  getErrorMessage,
  constructionNodeStatus,
  canViewConstruction,
  canAuditConstruction,
}) => {
  const loadConstructionStatus = async () => {
    if (!canViewConstruction.value) {
      message.warning('当前账号缺少施工流程查看权限')
      return
    }
    try {
      await orderManageStore.loadConstructionStatus()
    } catch (e) {
      console.error('加载施工状态失败', e)
      message.error(getErrorMessage(e, '加载施工状态失败'))
    }
  }

  const handleNodeClick = async (node) => {
    if (!canViewConstruction.value) {
      message.warning('当前账号缺少施工流程查看权限')
      return
    }
    try {
      await orderManageStore.handleNodeClick(node)
    } catch (e) {
      console.error('加载节点详情失败', e)
      message.error(getErrorMessage(e, '加载节点详情失败'))
    }
  }

  const isPendingAudit = computed(() => {
    if (!constructionInfo.value || !constructionInfo.value.nodeDetails) return false
    if (
      Number(constructionInfo.value.currentNodeStatus) !==
      constructionNodeStatus.WAIT_PLATFORM_AUDIT
    ) {
      return false
    }

    const activeNodeId =
      constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex]
        ?.nodeId
    if (!currentNodeDetail.value) return false

    return currentNodeDetail.value.nodeId === activeNodeId
  })

  const submitAudit = async (pass, reason = '') => {
    if (!canAuditConstruction.value) {
      message.warning('当前账号缺少施工审核权限')
      return
    }
    try {
      const res = await orderManageStore.submitAudit(pass, reason)
      if (res.code === 200) {
        message.success(pass ? '审核通过' : '已驳回')
        showAuditRejectModal.value = false
        await loadConstructionStatus()
        await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
        orderManageStore.syncDispatchListItem()
        await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
      } else {
        message.error(res.msg || '操作失败')
      }
    } catch (e) {
      console.error(e)
      message.error(getErrorMessage(e, '审核请求异常'))
    }
  }

  const handleAuditPass = () => {
    dialog.success({
      title: '审核通过',
      content: '确定通过当前施工节点的验收吗？',
      positiveText: '通过',
      negativeText: '取消',
      onPositiveClick: async () => {
        await submitAudit(true)
      },
    })
  }

  const handleAuditReject = () => {
    auditRejectReason.value = ''
    showAuditRejectModal.value = true
  }

  return {
    loadConstructionStatus,
    handleNodeClick,
    isPendingAudit,
    submitAudit,
    handleAuditPass,
    handleAuditReject,
  }
}
