import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import orderAPI from '@/api/user/userOrder'
import HOUSE_API from '@/api/house/house'
import {
  getOrderPaymentStatus,
  normalizeOrderPaymentState,
} from '@/utils/orderPayment'

const defaultOrderPaymentStatementHtml =
  '<p style="text-align: center;"><strong>支付协议（示例）</strong></p><p><strong>1.</strong> 下单后请在规定时间内完成付款。</p><p><strong>2.</strong> 施工节点付款请以系统提示金额为准。</p><p><strong>3.</strong> 如有疑问请联系客服。</p>'

const refundStatusMap = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝',
  3: '处理中',
  4: '退款成功',
  5: '退款失败',
}

const resolveOrderMainProductId = (order) => {
  const candidates = [
    order?.mpId,
    order?.mainProductId,
    order?.productId,
    order?.structureInfo?.mpId,
    order?.structureInfo?.id,
    order?.house?.houseMainStructure?.mpId,
    order?.house?.houseMainStructure?.id,
  ]

  for (const candidate of candidates) {
    const id = Number(candidate)
    if (!Number.isNaN(id) && id > 0) {
      return id
    }
  }

  return null
}

const getPaymentRecordIdFromOrder = (order) => {
  if (!order || typeof order !== 'object') return ''
  const id =
    order.paymentRecordId ||
    order.latestPaymentRecordId ||
    order.lastPaymentRecordId ||
    order.latestPaymentId ||
    ''
  return id ? String(id) : ''
}

const hasUploadedContract = (order) => {
  const contract = order?.orderContract
  if (!contract) return false

  if (typeof contract === 'string') {
    return contract.trim().length > 0
  }
  if (Array.isArray(contract)) {
    return contract.length > 0
  }
  if (typeof contract === 'object') {
    if (typeof contract.fileUrl === 'string') {
      return contract.fileUrl.trim().length > 0
    }
    return Object.keys(contract).length > 0
  }
  return false
}

const hasKnownContractState = (order) => {
  if (!order || typeof order !== 'object') return false
  if (hasUploadedContract(order)) return true
  return Object.prototype.hasOwnProperty.call(order, 'orderContract')
}

const getOrderProductName = (order) => {
  if (!order || typeof order !== 'object') return ''
  return (
    order.structureInfo?.name ||
    order.house?.houseMainStructure?.name ||
    order.house?.name ||
    order.mainProductName ||
    order.houseName ||
    order.name ||
    order.productName ||
    ''
  )
}

const sortPaymentRows = (rows = []) => {
  return [...rows].sort((a, b) => {
    const timeA = a?.payTime ? new Date(a.payTime).getTime() : 0
    const timeB = b?.payTime ? new Date(b.payTime).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return Number(b?.id || 0) - Number(a?.id || 0)
  })
}

const escapeStatementHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildRefundCacheKey = (orderId, paymentRecordId) =>
  `${orderId}:${paymentRecordId}`

const normalizeRefundStatusValue = (value) => {
  if (value === null || value === undefined || value === '') return null
  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? value : numericValue
}

const buildRefundState = (refundInfo = null, { missing = false } = {}) => {
  const status = normalizeRefundStatusValue(
    refundInfo?.status ?? refundInfo?.refundStatus,
  )
  return {
    refundStatus: status,
    refundStatusText:
      status === null
        ? ''
        : refundInfo?.refundStatusText || refundStatusMap[status] || '未知',
    refundDetail: refundInfo,
    refundMissing: Boolean(missing && status === null),
  }
}

const extractEmbeddedRefundInfo = (row = {}) => {
  if (row?.refundDetail && typeof row.refundDetail === 'object') {
    return row.refundDetail
  }
  if (row?.refundInfo && typeof row.refundInfo === 'object') {
    return row.refundInfo
  }
  if (row?.refund && typeof row.refund === 'object') {
    return row.refund
  }

  const status = normalizeRefundStatusValue(row?.refundStatus)
  const hasRefundState =
    status !== null ||
    Boolean(row?.refundStatusText || row?.refundId || row?.auditRemark)

  if (!hasRefundState) return null

  return {
    ...row,
    status,
    refundStatusText: row?.refundStatusText || '',
  }
}

export const useUserOrderStore = defineStore('userOrder', () => {
  const loadingOrders = ref(false)
  const orderList = ref([])
  const latestOrderListRequestId = ref(0)
  const currentOrder = ref(null)
  const loadingDetail = ref(false)
  const detailPaymentRecordsLoading = ref(false)
  const detailPaymentRecords = ref([])
  const orderPaymentStatementLoading = ref(false)
  const orderPaymentStatementHtml = ref(defaultOrderPaymentStatementHtml)
  const refundDetailLoading = ref(false)
  const refundDetail = ref(null)
  const refundSubmitting = ref(false)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
  })
  const clientHouseNameMap = ref({})
  const clientHouseNameMapLoaded = ref(false)
  let clientHouseNameMapPromise = null
  const orderListDetailCache = ref({})
  const refundDetailCache = ref({})
  const orderPaymentStatementLoaded = ref(false)

  const getClientHouseNameById = (id) => {
    if (!id) return ''
    return clientHouseNameMap.value[String(id)] || ''
  }

  const resolveOrderProductName = (order) => {
    const directName = getOrderProductName(order)
    if (directName) return directName

    const mpId = resolveOrderMainProductId(order)
    return getClientHouseNameById(mpId)
  }

  const normalizeOrderWithDetail = (originOrder, detailData) => {
    const detail = detailData || {}
    return normalizeOrderPaymentState({
      ...(originOrder || {}),
      ...detail,
      structureInfo: detail.house?.houseMainStructure || detail.structureInfo,
      productName:
        resolveOrderProductName(detail) || resolveOrderProductName(originOrder),
      paymentRecordId:
        getPaymentRecordIdFromOrder(detail) ||
        getPaymentRecordIdFromOrder(originOrder),
    })
  }

  const getOrderListDetailCacheEntry = (orderId) =>
    orderListDetailCache.value[orderId] || null

  const buildOrderListDetailPatch = (originOrder, detailData) => {
    const merged = normalizeOrderWithDetail(originOrder, detailData)
    return {
      house: merged.house,
      structureInfo: merged.structureInfo,
      productName: resolveOrderProductName(merged),
      paymentRecordId: getPaymentRecordIdFromOrder(merged),
      orderContract: merged.orderContract,
      contractLoaded: true,
    }
  }

  const setOrderListDetailCacheEntry = (orderId, originOrder, detailData) => {
    if (!orderId) return null
    const patch = buildOrderListDetailPatch(originOrder, detailData)
    orderListDetailCache.value = {
      ...orderListDetailCache.value,
      [orderId]: patch,
    }
    return patch
  }

  const shouldPrefetchOrderListDetail = (order) => {
    if (!order?.id) return false
    const needsContractState =
      !order.contractLoaded && ![4, 5].includes(Number(order.orderStatus))
    const needsProductName = !resolveOrderProductName(order)
    return needsContractState || needsProductName
  }

  const getRefundDetailCacheEntry = (orderId, paymentRecordId) =>
    refundDetailCache.value[buildRefundCacheKey(orderId, paymentRecordId)] || null

  const setRefundDetailCacheEntry = (
    orderId,
    paymentRecordId,
    refundInfo,
    options = {},
  ) => {
    if (!orderId || !paymentRecordId) return null
    const nextEntry = buildRefundState(refundInfo, options)
    refundDetailCache.value = {
      ...refundDetailCache.value,
      [buildRefundCacheKey(orderId, paymentRecordId)]: nextEntry,
    }
    return nextEntry
  }

  const invalidateRefundDetailCache = (orderId, paymentRecordId) => {
    if (!orderId || !paymentRecordId) return
    const nextCache = { ...refundDetailCache.value }
    delete nextCache[buildRefundCacheKey(orderId, paymentRecordId)]
    refundDetailCache.value = nextCache
  }

  const isRefundedOrder = (order) => getOrderPaymentStatus(order) === 3

  const ensureClientHouseNameMap = async () => {
    if (clientHouseNameMapLoaded.value) return
    if (clientHouseNameMapPromise) {
      await clientHouseNameMapPromise
      return
    }

    clientHouseNameMapPromise = (async () => {
      const pageSize = 100
      const houseMap = {}
      let page = 1
      let totalPages = 1

      try {
        while (page <= totalPages) {
          const res = await HOUSE_API.getClientHouseData(page, pageSize)
          if (res.code !== 200 || !res.data) break

          const records = Array.isArray(res.data.records) ? res.data.records : []
          records.forEach((item) => {
            const id = Number(item?.id)
            if (!Number.isNaN(id) && id > 0) {
              houseMap[String(id)] = item?.name || ''
            }
          })

          totalPages =
            Number(res.data.pages) ||
            Math.ceil(Number(res.data.total || 0) / pageSize) ||
            1

          if (!records.length) break
          page += 1
        }
      } catch (error) {
        console.error('Load client house list failed', error)
      } finally {
        clientHouseNameMap.value = houseMap
        clientHouseNameMapLoaded.value = true
        clientHouseNameMapPromise = null
      }
    })()

    await clientHouseNameMapPromise
  }

  const tryLoadOrderDetail = async ({ userId, orderId }) => {
    if (!userId || !orderId) return null

    try {
      const res = await orderAPI.getOrderDetail(userId, orderId)
      if (res.code === 200 && res.data) {
        return res.data
      }
    } catch (error) {
      console.error('load order detail failed', error)
    }

    return null
  }

  const fetchOrders = async ({ userId }) => {
    if (!userId) {
      orderList.value = []
      pagination.itemCount = 0
      return null
    }

    const requestId = latestOrderListRequestId.value + 1
    latestOrderListRequestId.value = requestId
    loadingOrders.value = true

    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        userId,
      }

      const res = await orderAPI.getOrderList(params)
      if (requestId !== latestOrderListRequestId.value) return res

      if (res.code === 200 && res.data) {
        const list = res.data.records || res.data.rows || []
        const baseList = list
          .filter((item) => !isRefundedOrder(item))
          .map((item) => {
            const normalizedItem = normalizeOrderPaymentState({
              ...item,
              productName: resolveOrderProductName(item),
              paymentRecordId: getPaymentRecordIdFromOrder(item),
              contractLoaded: hasKnownContractState(item),
              paying: false,
            })
            const cachedPatch = getOrderListDetailCacheEntry(normalizedItem.id)
            return cachedPatch
              ? {
                  ...normalizedItem,
                  ...cachedPatch,
                }
              : normalizedItem
          })

        const shouldLoadHouseNameMap =
          !clientHouseNameMapLoaded.value &&
          baseList.some(
            (item) =>
              !resolveOrderProductName(item) &&
              Boolean(resolveOrderMainProductId(item)),
          )

        if (shouldLoadHouseNameMap) {
          await ensureClientHouseNameMap()
          if (requestId !== latestOrderListRequestId.value) return res

          baseList.forEach((item) => {
            if (!item.productName) {
              item.productName = resolveOrderProductName(item)
            }
          })
        }

        await Promise.all(
          baseList.map(async (item) => {
            if (!shouldPrefetchOrderListDetail(item)) return

            const detail = await tryLoadOrderDetail({
              userId,
              orderId: item.id,
            })
            if (!detail) return

            const patch = setOrderListDetailCacheEntry(item.id, item, detail)
            if (patch) {
              Object.assign(item, patch)
            }
          }),
        )

        if (requestId !== latestOrderListRequestId.value) return res

        orderList.value = baseList
        pagination.itemCount = Number(
          res.data.total || res.data.count || baseList.length,
        )
      } else {
        if (requestId !== latestOrderListRequestId.value) return res
        orderList.value = []
        pagination.itemCount = 0
      }

      return res
    } finally {
      if (requestId === latestOrderListRequestId.value) {
        loadingOrders.value = false
      }
    }
  }

  const loadDetailPaymentRecords = async ({
    orderId,
    userId,
    canViewRefund = false,
  }) => {
    if (!orderId || !userId) {
      detailPaymentRecords.value = []
      return []
    }

    detailPaymentRecordsLoading.value = true
    try {
      const res = await orderAPI.getUserPaymentRecords(orderId, userId)

      if (!(res.code === 200 && res.data)) {
        detailPaymentRecords.value = []
        return []
      }

      const rows = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.rows)
          ? res.data.rows
          : Array.isArray(res.data.records)
            ? res.data.records
            : []

      const sortedRows = sortPaymentRows(rows)

      if (!canViewRefund) {
        detailPaymentRecords.value = sortedRows.map((row) => ({
          ...row,
          orderId,
          refundStatus: null,
          refundStatusText: '',
          refundDetail: null,
        }))
        return detailPaymentRecords.value
      }

      detailPaymentRecords.value = await Promise.all(
        sortedRows.map(async (row) => {
          const paymentRecordId = Number(row?.id || row?.paymentRecordId || 0)
          const cachedRefundState = getRefundDetailCacheEntry(orderId, paymentRecordId)
          if (cachedRefundState) {
            return {
              ...row,
              orderId,
              ...cachedRefundState,
            }
          }

          const embeddedRefundInfo = extractEmbeddedRefundInfo(row)
          if (embeddedRefundInfo) {
            const embeddedRefundState = setRefundDetailCacheEntry(
              orderId,
              paymentRecordId,
              embeddedRefundInfo,
            )
            return {
              ...row,
              orderId,
              ...embeddedRefundState,
            }
          }

          try {
            const refundRes = await orderAPI.getUserRefundDetail(orderId, userId, row.id)
            const refundInfo =
              refundRes.code === 200 && refundRes.data ? refundRes.data : null
            const refundState = refundInfo
              ? setRefundDetailCacheEntry(orderId, paymentRecordId, refundInfo)
              : setRefundDetailCacheEntry(orderId, paymentRecordId, null, {
                  missing: true,
                })

            return {
              ...row,
              orderId,
              ...refundState,
            }
          } catch (error) {
            const errorMsg =
              error?.response?.data?.msg || error?.msg || error?.message || ''
            if (String(errorMsg).includes('退款记录不存在')) {
              const refundState = setRefundDetailCacheEntry(
                orderId,
                paymentRecordId,
                null,
                { missing: true },
              )
              return {
                ...row,
                orderId,
                ...refundState,
              }
            }

            return {
              ...row,
              orderId,
              refundStatus: null,
              refundStatusText: '',
              refundDetail: null,
              refundError: error,
            }
          }
        }),
      )

      return detailPaymentRecords.value
    } finally {
      detailPaymentRecordsLoading.value = false
    }
  }

  const loadOrderDetail = async ({
    row,
    userId,
    canViewRefund = false,
  }) => {
    if (!row?.id || !userId) return null

    loadingDetail.value = true
    currentOrder.value = null
    detailPaymentRecords.value = []

    try {
      const res = await orderAPI.getOrderDetail(userId, row.id)
      if (res.code === 200 && res.data) {
        currentOrder.value = normalizeOrderWithDetail(row, res.data)
        if (!currentOrder.value.house) currentOrder.value.house = {}
        if (!currentOrder.value.house.houseMainStructure) {
          currentOrder.value.house.houseMainStructure = {}
        }
        currentOrder.value.structureInfo =
          currentOrder.value.house.houseMainStructure ||
          currentOrder.value.structureInfo
        currentOrder.value.productName = resolveOrderProductName(currentOrder.value)

        const listItem = orderList.value.find((item) => item.id === row.id)
        if (listItem) {
          listItem.house = currentOrder.value.house
          listItem.structureInfo = currentOrder.value.structureInfo
          listItem.productName = resolveOrderProductName(currentOrder.value)
          listItem.paymentRecordId = getPaymentRecordIdFromOrder(currentOrder.value)
          listItem.orderContract = currentOrder.value.orderContract
          listItem.contractLoaded = true
        }
        setOrderListDetailCacheEntry(row.id, row, res.data)

        await loadDetailPaymentRecords({
          orderId: row.id,
          userId,
          canViewRefund,
        })
      } else {
        currentOrder.value = row
      }

      return res
    } finally {
      loadingDetail.value = false
    }
  }

  const syncCurrentOrderFromServer = async ({ userId, orderId }) => {
    if (!userId || !orderId) return null

    try {
      const res = await orderAPI.getOrderDetail(userId, orderId)
      if (res.code !== 200 || !res.data) return null

      const latestOrder = res.data

      if (currentOrder.value?.id === latestOrder.id) {
        const mergedCurrentOrder = normalizeOrderWithDetail(
          currentOrder.value,
          latestOrder,
        )
        currentOrder.value = {
          ...mergedCurrentOrder,
          paying: currentOrder.value.paying || false,
        }
      }

      const listItem = orderList.value.find((item) => item.id === latestOrder.id)
      if (listItem) {
        const mergedListItem = normalizeOrderWithDetail(listItem, latestOrder)
        Object.assign(listItem, {
          ...mergedListItem,
          contractLoaded: true,
          paying: listItem.paying || false,
        })
      }
      setOrderListDetailCacheEntry(latestOrder.id, currentOrder.value, latestOrder)

      return latestOrder
    } catch (error) {
      console.error('Sync order status failed', error)
      return null
    }
  }

  const loadOrderPaymentStatement = async () => {
    if (orderPaymentStatementLoaded.value) {
      return { code: 200, data: orderPaymentStatementHtml.value }
    }

    orderPaymentStatementLoading.value = true
    try {
      const res = await orderAPI.getPaymentStatement()
      if (res.code === 200) {
        const raw = String(res.data || '').trim()
        if (!raw) {
          orderPaymentStatementHtml.value = defaultOrderPaymentStatementHtml
        } else if (/[<][^>]+[>]/.test(raw)) {
          orderPaymentStatementHtml.value = raw
        } else {
          const lines = raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
          orderPaymentStatementHtml.value = lines.length
            ? lines.map((line) => `<p>${escapeStatementHtml(line)}</p>`).join('')
            : defaultOrderPaymentStatementHtml
        }
        orderPaymentStatementLoaded.value = true
      } else {
        orderPaymentStatementHtml.value = defaultOrderPaymentStatementHtml
      }
      return res
    } finally {
      orderPaymentStatementLoading.value = false
    }
  }

  const fetchRefundDetail = async ({ orderId, userId, paymentRecordId }) => {
    if (!orderId || !userId || !paymentRecordId) return null

    const cachedRefundState = getRefundDetailCacheEntry(orderId, paymentRecordId)
    if (cachedRefundState?.refundDetail) {
      refundDetail.value = cachedRefundState.refundDetail
      return { code: 200, data: cachedRefundState.refundDetail }
    }

    refundDetailLoading.value = true
    refundDetail.value = null
    try {
      const res = await orderAPI.getUserRefundDetail(orderId, userId, paymentRecordId)
      if (res.code === 200 && res.data) {
        refundDetail.value = res.data
        setRefundDetailCacheEntry(orderId, paymentRecordId, res.data)
      }
      return res
    } finally {
      refundDetailLoading.value = false
    }
  }

  const submitRefundApply = async ({
    userId,
    paymentRecordId,
    reason,
    orderId,
  }) => {
    refundSubmitting.value = true
    try {
      const res = await orderAPI.userCancelOrder(
        userId,
        paymentRecordId,
        reason,
        orderId,
      )
      if (res?.code === 200) {
        invalidateRefundDetailCache(orderId, paymentRecordId)
      }
      return res
    } finally {
      refundSubmitting.value = false
    }
  }

  const submitRefundCancel = async ({ userId, paymentRecordId, orderId }) => {
    refundSubmitting.value = true
    try {
      const res = await orderAPI.cancelRefund(orderId, userId, paymentRecordId)
      if (res?.code === 200) {
        invalidateRefundDetailCache(orderId, paymentRecordId)
      }
      return res
    } finally {
      refundSubmitting.value = false
    }
  }

  const clearCurrentOrder = () => {
    currentOrder.value = null
    detailPaymentRecords.value = []
  }

  const clearRefundDetail = () => {
    refundDetail.value = null
  }

  const clearOrderState = () => {
    loadingOrders.value = false
    orderList.value = []
    latestOrderListRequestId.value = 0
    currentOrder.value = null
    loadingDetail.value = false
    detailPaymentRecordsLoading.value = false
    detailPaymentRecords.value = []
    orderPaymentStatementLoading.value = false
    orderPaymentStatementHtml.value = defaultOrderPaymentStatementHtml
    orderPaymentStatementLoaded.value = false
    refundDetailLoading.value = false
    refundDetail.value = null
    refundSubmitting.value = false
    pagination.page = 1
    pagination.pageSize = 10
    pagination.itemCount = 0
    clientHouseNameMap.value = {}
    clientHouseNameMapLoaded.value = false
    clientHouseNameMapPromise = null
    orderListDetailCache.value = {}
    refundDetailCache.value = {}
  }

  return {
    loadingOrders,
    orderList,
    currentOrder,
    loadingDetail,
    detailPaymentRecordsLoading,
    detailPaymentRecords,
    orderPaymentStatementLoading,
    orderPaymentStatementHtml,
    refundDetailLoading,
    refundDetail,
    refundSubmitting,
    pagination,
    refundStatusMap,
    getPaymentRecordIdFromOrder,
    hasUploadedContract,
    getOrderProductName,
    resolveOrderProductName,
    normalizeOrderWithDetail,
    fetchOrders,
    loadOrderDetail,
    loadDetailPaymentRecords,
    syncCurrentOrderFromServer,
    loadOrderPaymentStatement,
    fetchRefundDetail,
    submitRefundApply,
    submitRefundCancel,
    invalidateRefundDetailCache,
    clearCurrentOrder,
    clearRefundDetail,
    clearOrderState,
  }
})
