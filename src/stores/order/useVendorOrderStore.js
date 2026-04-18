import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import VendorOrderAPI from '@/api/service/vendorOrder'
import ConstructionAPI from '@/api/house/construction'
import {
  CONSTRUCTION_NODE_STATUS,
  CONSTRUCTION_NODE_STATUS_MAP,
  normalizeConstructionFlow,
} from '@/utils/construction'

const getNodeUploadedImageCount = (node) =>
  (node?.progressRecords || []).reduce((sum, record) => {
    const images = Array.isArray(record?.imageList) ? record.imageList : []
    return (
      sum +
      images.filter((image) => Boolean(image?.imageUrl || image?.url)).length
    )
  }, 0)

const hasNodeUploadedImages = (node) => getNodeUploadedImageCount(node) > 0

const resolveNodeStatusCode = (statusCode, node) => {
  const normalizedStatusCode = Number(statusCode)
  if (
    normalizedStatusCode === CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT &&
    !hasNodeUploadedImages(node)
  ) {
    return CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD
  }
  return normalizedStatusCode
}

const resolveNodeStatusText = (statusCode, statusText, node) => {
  const effectiveStatusCode = resolveNodeStatusCode(statusCode, node)
  return (
    CONSTRUCTION_NODE_STATUS_MAP[effectiveStatusCode] ||
    statusText ||
    '未知状态'
  )
}

const getFlowCurrentNode = (flow) => {
  const nodeDetails = Array.isArray(flow?.nodeDetails) ? flow.nodeDetails : []
  return nodeDetails[Number(flow?.currentNodeIndex) || 0] || null
}

const getFlowCurrentNodeStatusText = (flow) =>
  resolveNodeStatusText(
    flow?.currentNodeStatus,
    flow?.currentNodeStatusText,
    getFlowCurrentNode(flow),
  )

const isNeedHandleConstructionStatus = (statusText) =>
  ['待服务商上传', '审核驳回'].includes(String(statusText || '').trim())

const shouldPinOrderToTop = (row) =>
  Number(row?.orderStatus) === 3 ||
  isNeedHandleConstructionStatus(row?.constructionStatusText)

const countNeedHandleOrders = (rows) =>
  rows.filter(
    (row) =>
      row?.type === 1 &&
      isNeedHandleConstructionStatus(row?.constructionStatusText),
  ).length

export const useVendorOrderStore = defineStore('vendorOrder', () => {
  const orderList = ref([])
  const ordersLoading = ref(false)
  const pagination = reactive({ page: 1, pageSize: 10, itemCount: 0 })
  const orderStatusTab = ref('1')
  const unrepliedOrderCount = ref(0)
  const acceptedNeedHandleCount = ref(0)
  const acceptedActiveOrderCount = ref(0)

  const orderDetailLoading = ref(false)
  const currentOrderDetail = ref(null)
  const constructionStatus = ref(null)
  const currentNodeDetail = ref(null)
  const constructionFlowCache = ref({})
  const constructionFlowPromiseMap = ref({})

  const sortedOrderList = computed(() =>
    orderList.value
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const priorityDiff =
          Number(shouldPinOrderToTop(right.item)) -
          Number(shouldPinOrderToTop(left.item))
        if (priorityDiff !== 0) return priorityDiff

        const leftTime = new Date(left.item?.createTime || 0).getTime()
        const rightTime = new Date(right.item?.createTime || 0).getTime()
        if (leftTime !== rightTime) return rightTime - leftTime

        return left.index - right.index
      })
      .map(({ item }) => item),
  )

  const buildConstructionSummary = (flow) => {
    if (!flow) {
      return {
        constructionStage: null,
        constructionStatusText: null,
        needHandle: false,
      }
    }

    const constructionStatusText = getFlowCurrentNodeStatusText(flow)
    return {
      constructionStage: flow.currentNodeName || null,
      constructionStatusText,
      needHandle: isNeedHandleConstructionStatus(constructionStatusText),
    }
  }

  const setConstructionFlowCache = (orderId, flow) => {
    if (!orderId) return
    constructionFlowCache.value = {
      ...constructionFlowCache.value,
      [orderId]: {
        flow,
        summary: buildConstructionSummary(flow),
      },
    }
  }

  const getConstructionFlowCacheEntry = (orderId) =>
    constructionFlowCache.value[orderId] || null

  const invalidateConstructionFlowCache = (orderId) => {
    if (!orderId) return
    const nextCache = { ...constructionFlowCache.value }
    delete nextCache[orderId]
    constructionFlowCache.value = nextCache
  }

  const fetchConstructionFlowData = async (orderId, { force = false } = {}) => {
    if (!orderId) return null

    const cachedEntry = getConstructionFlowCacheEntry(orderId)
    if (!force && cachedEntry?.flow) {
      return cachedEntry.flow
    }

    if (!force && constructionFlowPromiseMap.value[orderId]) {
      return constructionFlowPromiseMap.value[orderId]
    }

    const flowPromise = (async () => {
      const res = await ConstructionAPI.getConstructionStatus(orderId)
      const flow = normalizeConstructionFlow(res?.data)
      if (res.code === 200 && flow) {
        setConstructionFlowCache(orderId, flow)
        return flow
      }
      return null
    })()

    constructionFlowPromiseMap.value = {
      ...constructionFlowPromiseMap.value,
      [orderId]: flowPromise,
    }

    try {
      return await flowPromise
    } finally {
      const nextPromiseMap = { ...constructionFlowPromiseMap.value }
      delete nextPromiseMap[orderId]
      constructionFlowPromiseMap.value = nextPromiseMap
    }
  }

  const fetchConstructionFlowSummary = async (orderId, { force = false } = {}) => {
    if (!orderId) return null

    const flow = await fetchConstructionFlowData(orderId, { force })
    if (flow) {
      return buildConstructionSummary(flow)
    }

    return null
  }

  const applyConstructionSummaryToRow = (row, summary) => {
    row.constructionStage = summary?.constructionStage || null
    row.constructionStatusText = summary?.constructionStatusText || null
  }

  const fetchOrders = async (vendorId) => {
    if (!vendorId) return null
    const requestStatus = Number(orderStatusTab.value)
    ordersLoading.value = true
    try {
      const requestParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: requestStatus,
      }
      const res = await VendorOrderAPI.getManageOrderList(vendorId, requestParams)
      if (res.code === 200 && res.data) {
        const rows = (res.data.rows || []).map((item) => ({
          ...item,
          constructionStage: null,
          constructionStatusText: null,
        }))
        const total = Number(res.data.total) || rows.length
        pagination.itemCount = total

        await Promise.all(
          rows.map(async (row) => {
            if (!(row.type === 1 && [1, 2].includes(row.orderStatus) && row.orderId)) {
              return
            }

            try {
              const summary = await fetchConstructionFlowSummary(row.orderId)
              applyConstructionSummaryToRow(row, summary)
            } catch (error) {
              void error
            }
          }),
        )

        orderList.value = rows
        if (requestStatus === 1) {
          acceptedActiveOrderCount.value = total
          if (total <= rows.length) {
            acceptedNeedHandleCount.value = countNeedHandleOrders(rows)
          }
        }
        if (requestStatus === 3) {
          unrepliedOrderCount.value = total
        }
      }

      return res
    } catch (error) {
      const errorMsg =
        error?.msg ||
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : '') ||
        error?.message ||
        '获取订单列表失败'

      if (String(errorMsg).includes('未查询到订单信息')) {
        orderList.value = []
        pagination.itemCount = 0
        if (requestStatus === 1) {
          acceptedActiveOrderCount.value = 0
          acceptedNeedHandleCount.value = 0
        }
        if (requestStatus === 3) {
          unrepliedOrderCount.value = 0
        }
        return null
      }

      throw error
    } finally {
      ordersLoading.value = false
    }
  }

  const fetchUnrepliedOrderCount = async (vendorId) => {
    if (!vendorId) {
      unrepliedOrderCount.value = 0
      return 0
    }

    try {
      const res = await VendorOrderAPI.getManageOrderList(vendorId, {
        page: 1,
        pageSize: 1,
        status: 3,
      })
      if (res.code === 200 && res.data) {
        unrepliedOrderCount.value = Number(res.data.total) || 0
        return unrepliedOrderCount.value
      }
    } catch (error) {
      void error
    }

    unrepliedOrderCount.value = 0
    return 0
  }

  const fetchAcceptedNeedHandleCount = async (vendorId) => {
    if (!vendorId) {
      acceptedNeedHandleCount.value = 0
      return 0
    }

    try {
      const res = await VendorOrderAPI.getManageOrderList(vendorId, {
        page: 1,
        pageSize: 100,
        status: 1,
      })

      if (res.code !== 200 || !res.data) {
        acceptedNeedHandleCount.value = 0
        return 0
      }

      const rows = Array.isArray(res.data.rows) ? res.data.rows : []
      if (!rows.length) {
        acceptedNeedHandleCount.value = 0
        return 0
      }

      const statusResults = await Promise.all(
        rows.map(async (row) => {
          if (!(row.type === 1 && row.orderId)) return false
          try {
            const summary = await fetchConstructionFlowSummary(row.orderId)
            return Boolean(summary?.needHandle)
          } catch {
            return false
          }
        }),
      )

      acceptedNeedHandleCount.value = statusResults.filter(Boolean).length
      return acceptedNeedHandleCount.value
    } catch {
      acceptedNeedHandleCount.value = 0
      return 0
    }
  }

  const fetchAcceptedActiveOrderCount = async (vendorId) => {
    if (!vendorId) {
      acceptedActiveOrderCount.value = 0
      return 0
    }

    try {
      const res = await VendorOrderAPI.getManageOrderList(vendorId, {
        page: 1,
        pageSize: 1,
        status: 1,
      })

      if (res.code === 200 && res.data) {
        acceptedActiveOrderCount.value = Number(res.data.total) || 0
        return acceptedActiveOrderCount.value
      }
    } catch (error) {
      void error
    }

    acceptedActiveOrderCount.value = 0
    return 0
  }

  const refreshOrderSummary = async (
    vendorId,
    { currentStatus = null } = {},
  ) => {
    if (!vendorId) return

    const normalizedStatus = Number(currentStatus)
    const tasks = []

    if (normalizedStatus !== 3) {
      tasks.push(fetchUnrepliedOrderCount(vendorId))
    }

    if (normalizedStatus === 1 && pagination.itemCount <= orderList.value.length) {
      acceptedNeedHandleCount.value = countNeedHandleOrders(orderList.value)
    } else {
      tasks.push(fetchAcceptedNeedHandleCount(vendorId))
    }

    if (normalizedStatus !== 1) {
      tasks.push(fetchAcceptedActiveOrderCount(vendorId))
    }

    await Promise.all(tasks)
  }

  const loadNodeDetail = async (userOrderId, node) => {
    if (!userOrderId || !node) return null
    const nodeId = node.nodeId || node.id
    const res = await ConstructionAPI.getConstructionDetail(userOrderId, nodeId)
    if (res.code === 200) {
      currentNodeDetail.value = res.data
    }
    return res
  }

  const loadConstructionFlow = async (userOrderId, { force = false } = {}) => {
    if (!userOrderId) return null

    const flow = await fetchConstructionFlowData(userOrderId, { force })

    if (flow) {
      constructionStatus.value = flow
      if (flow.nodeDetails && flow.nodeDetails.length > 0) {
        const targetIndex =
          flow.currentNodeIndex < flow.nodeDetails.length
            ? flow.currentNodeIndex
            : 0
        const targetNode = flow.nodeDetails[targetIndex]
        if (targetNode) {
          await loadNodeDetail(userOrderId, targetNode)
        }
      }
    } else {
      constructionStatus.value = null
      currentNodeDetail.value = null
    }

    return flow ? { code: 200, data: flow } : null
  }

  const openOrderDetail = async (vendorOrderId) => {
    if (!vendorOrderId) return null
    orderDetailLoading.value = true
    currentOrderDetail.value = null
    constructionStatus.value = null
    currentNodeDetail.value = null

    try {
      const res = await VendorOrderAPI.getManageOrderDetail(vendorOrderId)
      if (res.code === 200) {
        currentOrderDetail.value = res.data
        if (res.data.type === 1 && res.data.orderId) {
          await loadConstructionFlow(res.data.orderId)
        }
      }
      return res
    } finally {
      orderDetailLoading.value = false
    }
  }

  const clearOrderDetail = () => {
    currentOrderDetail.value = null
    constructionStatus.value = null
    currentNodeDetail.value = null
  }

  const clearOrderState = () => {
    orderList.value = []
    ordersLoading.value = false
    pagination.page = 1
    pagination.pageSize = 10
    pagination.itemCount = 0
    orderStatusTab.value = '1'
    unrepliedOrderCount.value = 0
    acceptedNeedHandleCount.value = 0
    acceptedActiveOrderCount.value = 0
    constructionFlowCache.value = {}
    constructionFlowPromiseMap.value = {}
    orderDetailLoading.value = false
    clearOrderDetail()
  }

  return {
    orderList,
    ordersLoading,
    pagination,
    orderStatusTab,
    unrepliedOrderCount,
    acceptedNeedHandleCount,
    acceptedActiveOrderCount,
    orderDetailLoading,
    currentOrderDetail,
    constructionStatus,
    currentNodeDetail,
    sortedOrderList,
    resolveNodeStatusCode,
    resolveNodeStatusText,
    getFlowCurrentNode,
    getFlowCurrentNodeStatusText,
    isNeedHandleConstructionStatus,
    shouldPinOrderToTop,
    fetchOrders,
    fetchUnrepliedOrderCount,
    fetchAcceptedNeedHandleCount,
    fetchAcceptedActiveOrderCount,
    refreshOrderSummary,
    invalidateConstructionFlowCache,
    openOrderDetail,
    loadConstructionFlow,
    loadNodeDetail,
    clearOrderDetail,
    clearOrderState,
  }
})
