import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDialog, useMessage } from 'naive-ui'
import ConstructionAPI from '@/api/house/construction'
import { useVendorOrderStore } from '@/stores/order/useVendorOrderStore'
import { useVendorProfileStore } from '@/stores/vendor/useVendorProfileStore'
import { CONSTRUCTION_NODE_STATUS } from '@/utils/construction'
import {
  formatProviderChineseDate,
  getProviderOrderStatusText,
} from '@/views/client/center/provider/composables/providerCenterHelpers'

export const useProviderOrderDetailPanel = ({ refreshVendorOrders }) => {
  const message = useMessage()
  const dialog = useDialog()
  const vendorOrderStore = useVendorOrderStore()
  const vendorProfileStore = useVendorProfileStore()

  const {
    orderDetailLoading,
    currentOrderDetail,
    constructionStatus,
    currentNodeDetail,
    constructionFlowState,
    constructionFlowErrorMessage,
  } = storeToRefs(vendorOrderStore)
  const { vendorInfo } = storeToRefs(vendorProfileStore)

  const showOrderModal = ref(false)
  const uploadNodeDescription = ref('')
  const uploadNodeFileList = ref([])
  const uploadNodePreviewUrlMap = ref({})
  const nodeUploadSubmitting = ref(false)

  const resolveNodeStatusCode = (statusCode, node) =>
    vendorOrderStore.resolveNodeStatusCode(statusCode, node)
  const resolveNodeStatusText = (statusCode, statusText, node) =>
    vendorOrderStore.resolveNodeStatusText(statusCode, statusText, node)
  const getFlowCurrentNode = (flow) => vendorOrderStore.getFlowCurrentNode(flow)
  const getFlowCurrentNodeStatusText = (flow) =>
    vendorOrderStore.getFlowCurrentNodeStatusText(flow)

  const activeConstructionNodeId = computed(() => {
    if (!constructionStatus.value?.nodeDetails?.length) return null
    return (
      constructionStatus.value.nodeDetails[
        constructionStatus.value.currentNodeIndex
      ]?.nodeId || null
    )
  })

  const isViewingActiveNode = computed(() => {
    if (!currentNodeDetail.value?.nodeId || !activeConstructionNodeId.value) {
      return false
    }
    return (
      Number(currentNodeDetail.value.nodeId) ===
      Number(activeConstructionNodeId.value)
    )
  })

  const currentNodeStatusCode = computed(() => {
    if (isViewingActiveNode.value) {
      return resolveNodeStatusCode(
        constructionStatus.value?.currentNodeStatus,
        currentNodeDetail.value || getFlowCurrentNode(constructionStatus.value),
      )
    }
    return resolveNodeStatusCode(
      currentNodeDetail.value?.status,
      currentNodeDetail.value,
    )
  })

  const currentNodeStatusText = computed(() => {
    if (isViewingActiveNode.value) {
      return resolveNodeStatusText(
        constructionStatus.value?.currentNodeStatus,
        constructionStatus.value?.currentNodeStatusText ||
          currentNodeDetail.value?.statusText,
        currentNodeDetail.value || getFlowCurrentNode(constructionStatus.value),
      )
    }

    return resolveNodeStatusText(
      currentNodeDetail.value?.status,
      currentNodeDetail.value?.statusText,
      currentNodeDetail.value,
    )
  })

  const canUploadCurrentNode = computed(() => {
    if (!isViewingActiveNode.value) return false
    return [
      CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD,
      CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT,
      CONSTRUCTION_NODE_STATUS.AUDIT_REJECTED,
    ].includes(currentNodeStatusCode.value)
  })

  const canDeleteCurrentNodePhoto = computed(() => {
    if (!isViewingActiveNode.value) return false
    return [
      CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD,
      CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT,
      CONSTRUCTION_NODE_STATUS.AUDIT_REJECTED,
    ].includes(currentNodeStatusCode.value)
  })

  const uploadNodeTipText = computed(() => {
    if (!currentNodeDetail.value) {
      return '请先选择当前施工节点，再上传现场施工照片（支持 JPG/PNG）'
    }

    if (!isViewingActiveNode.value) {
      return '仅当前施工阶段可上传照片，请选择正在进行中的节点'
    }

    if (canUploadCurrentNode.value) {
      if (
        currentNodeStatusCode.value ===
        CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT
      ) {
        return '当前节点已提交待审核，如需替换图片或补充说明，可删除原记录后重新提交'
      }
      return '请先选择施工阶段图片进行预览，再选填情况描述，最后统一提交'
    }

    return `当前节点状态为“${currentNodeStatusText.value}”，暂不可继续上传`
  })

  const openOrderDetail = async (row) => {
    showOrderModal.value = true

    try {
      const res = await vendorOrderStore.openOrderDetail(row.id)
      if (res?.code !== 200) {
        message.error(res?.msg || '获取详情失败')
      }
    } catch {
      message.error('获取详情失败')
    }
  }

  const loadConstructionFlow = async (userOrderId, options = {}) => {
    try {
      await vendorOrderStore.loadConstructionFlow(userOrderId, options)
    } catch {
      // ignore detail refresh failure here and keep current modal state
    }
  }

  const handleNodeClick = async (node) => {
    if (!currentOrderDetail.value) {
      message.error('订单详情未加载')
      return
    }

    const userOrderId = currentOrderDetail.value.orderId
    try {
      const res = await vendorOrderStore.loadNodeDetail(userOrderId, node)
      if (res?.code !== 200) {
        message.error(res?.msg || '加载节点详情失败')
      }
    } catch {
      message.error('加载节点详情失败')
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

  const getNodeStatus = (
    index,
    currentIndex,
    flow = constructionStatus.value,
  ) => {
    if (isConstructionFlowCompleted(flow)) return 'finish'
    if (index === currentIndex) return 'process'
    if (index < currentIndex) return 'finish'
    return 'wait'
  }

  const getNodeStatusDesc = (
    index,
    currentIndex,
    flow = constructionStatus.value,
  ) => {
    if (isConstructionFlowCompleted(flow)) return '已完成'
    if (index === currentIndex) return '进行中'
    if (index < currentIndex) return '已完成'
    return '待开始'
  }

  const resetNodeUploadForm = () => {
    uploadNodeDescription.value = ''
    uploadNodeFileList.value = []
  }

  const syncUploadNodePreviewUrls = () => {
    const nextMap = {}

    uploadNodeFileList.value.forEach((item) => {
      const fileId = String(item?.id || '')
      if (!fileId) return

      const resolvedUrl = item.thumbnailUrl || item.url
      if (resolvedUrl) {
        const previous = uploadNodePreviewUrlMap.value[fileId]
        if (previous?.isObjectUrl) {
          URL.revokeObjectURL(previous.url)
        }
        nextMap[fileId] = {
          url: resolvedUrl,
          isObjectUrl: false,
        }
        return
      }

      if (item.file instanceof File) {
        const previous = uploadNodePreviewUrlMap.value[fileId]
        nextMap[fileId] =
          previous || {
            url: URL.createObjectURL(item.file),
            isObjectUrl: true,
          }
      }
    })

    Object.entries(uploadNodePreviewUrlMap.value).forEach(([fileId, entry]) => {
      if (!nextMap[fileId] && entry?.isObjectUrl) {
        URL.revokeObjectURL(entry.url)
      }
    })

    uploadNodePreviewUrlMap.value = nextMap
  }

  const getUploadNodePreviewUrl = (file) =>
    uploadNodePreviewUrlMap.value[String(file?.id || '')]?.url || ''

  const revokeUploadNodePreviewUrls = () => {
    Object.values(uploadNodePreviewUrlMap.value).forEach((entry) => {
      if (entry?.isObjectUrl) {
        URL.revokeObjectURL(entry.url)
      }
    })
    uploadNodePreviewUrlMap.value = {}
  }

  const removeUploadNodeFile = (fileId) => {
    uploadNodeFileList.value = uploadNodeFileList.value.filter(
      (item) => String(item?.id || '') !== String(fileId),
    )
  }

  const submitNodeUpload = async () => {
    if (!currentNodeDetail.value || !vendorInfo.value?.id) return
    if (!canUploadCurrentNode.value) {
      message.warning(uploadNodeTipText.value)
      return
    }

    const files = uploadNodeFileList.value
      .map((item) => item.file)
      .filter((file) => file instanceof File)

    if (files.length === 0) {
      message.warning('请先选择至少一张施工图片')
      return
    }

    const params = {
      orderId: currentOrderDetail.value.orderId,
      nodeId: currentNodeDetail.value.nodeId,
      vendorId: vendorInfo.value.id,
      description: String(uploadNodeDescription.value || '').trim(),
      files,
    }

    nodeUploadSubmitting.value = true
    try {
      const res = await ConstructionAPI.uploadNodePhoto(params)
      if (res.code === 200) {
        message.success('上传成功')
        resetNodeUploadForm()
        vendorOrderStore.invalidateConstructionFlowCache(
          currentOrderDetail.value.orderId,
        )
        await loadConstructionFlow(currentOrderDetail.value.orderId)
        await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
        await refreshVendorOrders()
      } else {
        message.error(res.msg || '上传失败')
      }
    } catch {
      message.error('上传异常')
    } finally {
      nodeUploadSubmitting.value = false
    }
  }

  const handleDeletePhoto = (imageId) => {
    if (!canDeleteCurrentNodePhoto.value) {
      message.warning('当前节点状态下不允许删除施工照片')
      return
    }

    dialog.warning({
      title: '删除照片',
      content: '确定要删除这张施工照片吗？',
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const orderId = currentOrderDetail.value.orderId
          const vendorId = vendorInfo.value.id
          const nodeId = currentNodeDetail.value.nodeId
          const res = await ConstructionAPI.deleteNodePhoto(
            orderId,
            vendorId,
            nodeId,
            imageId,
          )
          if (res.code === 200) {
            message.success('删除成功')
            vendorOrderStore.invalidateConstructionFlowCache(orderId)
            await loadConstructionFlow(orderId)
            await handleNodeClick({ nodeId })
            await refreshVendorOrders()
          } else {
            message.error(res.msg || '删除失败')
          }
        } catch {
          message.error('删除请求异常')
        }
      },
    })
  }

  watch(
    () => currentNodeDetail.value?.nodeId,
    () => {
      resetNodeUploadForm()
    },
  )

  watch(
    uploadNodeFileList,
    () => {
      syncUploadNodePreviewUrls()
    },
    { deep: true },
  )

  watch(
    () => showOrderModal.value,
    (show) => {
      if (!show) {
        resetNodeUploadForm()
      }
    },
  )

  onBeforeUnmount(() => {
    revokeUploadNodePreviewUrls()
  })

  return {
    orderDetailLoading,
    currentOrderDetail,
    constructionStatus,
    currentNodeDetail,
    constructionFlowState,
    constructionFlowErrorMessage,
    showOrderModal,
    uploadNodeDescription,
    uploadNodeFileList,
    nodeUploadSubmitting,
    currentNodeStatusText,
    canUploadCurrentNode,
    uploadNodeTipText,
    canDeleteCurrentNodePhoto,
    getFlowCurrentNodeStatusText,
    openOrderDetail,
    handleNodeClick,
    getConstructionStepsCurrent,
    getNodeStatus,
    getNodeStatusDesc,
    getUploadNodePreviewUrl,
    removeUploadNodeFile,
    submitNodeUpload,
    handleDeletePhoto,
    formatChineseDate: formatProviderChineseDate,
    getOrderStatusText: getProviderOrderStatusText,
  }
}
