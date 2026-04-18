import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import orderAPI from '@/api/user/userOrder'

const REFUND_FETCH_BATCH_SIZE = 100
const REFUND_ALL_STATUSES = [0, 1, 2, 3, 4, 5]

const sortFinancialRows = (rows = []) => {
  return [...rows].sort((a, b) => {
    const timeA = a?.createTime || a?.payTime || a?.updateTime
    const timeB = b?.createTime || b?.payTime || b?.updateTime
    const timestampA = timeA ? new Date(timeA).getTime() : 0
    const timestampB = timeB ? new Date(timeB).getTime() : 0

    if (timestampA !== timestampB) return timestampB - timestampA

    return Number(b?.id || 0) - Number(a?.id || 0)
  })
}

const updateVisibleRows = (targetRef, pageInfo, rows = []) => {
  const start = (pageInfo.page - 1) * pageInfo.pageSize
  const end = start + pageInfo.pageSize
  targetRef.value = rows.slice(start, end)
}

const isAllRefundStatus = (status) => status === null || status === undefined

export const usePaymentStore = defineStore('payment', () => {
  const paymentLoading = ref(false)
  const paymentRecordList = ref([])
  const paymentPageInfo = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
  })
  const paymentFilters = reactive({
    keyword: '',
  })

  const refundLoading = ref(false)
  const refundList = ref([])
  const refundAllRows = ref([])
  const refundPageInfo = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
  })
  const refundFilters = reactive({
    orderNumber: '',
    status: null,
  })
  const refundDetailCache = ref({})
  const refundDetailPromiseMap = ref({})

  const refreshVisibleRefundRows = () => {
    updateVisibleRows(refundList, refundPageInfo, refundAllRows.value)
  }

  const fetchPaymentRecordList = async () => {
    paymentLoading.value = true
    try {
      const query = {
        page: paymentPageInfo.page,
        pageSize: paymentPageInfo.pageSize,
        keyword: String(paymentFilters.keyword || '').trim() || undefined,
      }
      const res = await orderAPI.getPaymentRecordList(query)

      if (res.code === 200 && res.data) {
        const rows = res.data.rows || res.data.records || []
        paymentRecordList.value = rows
        paymentPageInfo.itemCount = Number(res.data.total || 0)

        if (paymentPageInfo.itemCount === 0) {
          return
        }

        const paymentPageCount = Math.max(
          1,
          Math.ceil(paymentPageInfo.itemCount / paymentPageInfo.pageSize),
        )
        if (paymentPageInfo.page > paymentPageCount) {
          paymentPageInfo.page = paymentPageCount
          return await fetchPaymentRecordList()
        }
      } else {
        paymentRecordList.value = []
        paymentPageInfo.itemCount = 0
      }
    } finally {
      paymentLoading.value = false
    }
  }

  const fetchRefundRowsByStatus = async (status) => {
    const firstRes = await orderAPI.adminCheckRefundList(
      1,
      REFUND_FETCH_BATCH_SIZE,
      undefined,
      refundFilters.orderNumber || undefined,
      status,
      undefined,
    )

    if (firstRes.code !== 200 || !firstRes.data) {
      return []
    }

    const total = Number(firstRes.data.total || 0)
    let allRows = firstRes.data.rows || firstRes.data.records || []

    if (total <= allRows.length) {
      return allRows
    }

    const backendFetchPageCount = Math.ceil(total / REFUND_FETCH_BATCH_SIZE)
    if (backendFetchPageCount <= 1) {
      return allRows
    }

    const restResults = await Promise.all(
      Array.from({ length: backendFetchPageCount - 1 }, (_, index) =>
        orderAPI.adminCheckRefundList(
          index + 2,
          REFUND_FETCH_BATCH_SIZE,
          undefined,
          refundFilters.orderNumber || undefined,
          status,
          undefined,
        ),
      ),
    )

    allRows = allRows.concat(
      restResults.flatMap((result) => result.data?.rows || result.data?.records || []),
    )

    return allRows
  }

  const fetchPagedRefundList = async (status) => {
    const res = await orderAPI.adminCheckRefundList(
      refundPageInfo.page,
      refundPageInfo.pageSize,
      undefined,
      refundFilters.orderNumber || undefined,
      status,
      undefined,
    )

    if (!(res.code === 200 && res.data)) {
      refundList.value = []
      refundPageInfo.itemCount = 0
      return res
    }

    refundList.value = res.data.rows || res.data.records || []
    refundPageInfo.itemCount = Number(res.data.total || 0)

    if (refundPageInfo.itemCount === 0) {
      return res
    }

    const refundPageCount = Math.max(
      1,
      Math.ceil(refundPageInfo.itemCount / refundPageInfo.pageSize),
    )
    if (refundPageInfo.page > refundPageCount) {
      refundPageInfo.page = refundPageCount
      return fetchPagedRefundList(status)
    }

    return res
  }

  const fetchRefundList = async () => {
    refundLoading.value = true
    try {
      if (!isAllRefundStatus(refundFilters.status)) {
        refundAllRows.value = []
        return await fetchPagedRefundList(Number(refundFilters.status))
      }

      const queryStatuses = REFUND_ALL_STATUSES

      const statusResults = await Promise.all(
        queryStatuses.map(async (status) => ({
          status,
          rows: await fetchRefundRowsByStatus(status),
        })),
      )

      const mergedMap = new Map()
      statusResults.forEach(({ rows }) => {
        rows.forEach((row) => {
          if (row?.id !== undefined && row?.id !== null) {
            mergedMap.set(row.id, row)
          }
        })
      })

      refundAllRows.value = sortFinancialRows(Array.from(mergedMap.values()))
      refundPageInfo.itemCount = refundAllRows.value.length

      if (refundPageInfo.itemCount === 0) {
        refundList.value = []
        return
      }

      const refundPageCount = Math.ceil(
        refundPageInfo.itemCount / refundPageInfo.pageSize,
      )
      if (refundPageInfo.page > refundPageCount) {
        refundPageInfo.page = refundPageCount
      }

      refreshVisibleRefundRows()
    } finally {
      refundLoading.value = false
    }
  }

  const fetchRefundDetail = async (refundId, { force = false } = {}) => {
    const normalizedId = Number(refundId)
    if (!normalizedId) return null

    if (!force && refundDetailCache.value[normalizedId]) {
      return refundDetailCache.value[normalizedId]
    }

    if (!force && refundDetailPromiseMap.value[normalizedId]) {
      return refundDetailPromiseMap.value[normalizedId]
    }

    const detailPromise = (async () => {
      const res = await orderAPI.getRefundDetail(normalizedId)
      if (res.code === 200) {
        refundDetailCache.value = {
          ...refundDetailCache.value,
          [normalizedId]: res.data || null,
        }
        return res.data || null
      }

      return null
    })()

    refundDetailPromiseMap.value = {
      ...refundDetailPromiseMap.value,
      [normalizedId]: detailPromise,
    }

    try {
      return await detailPromise
    } finally {
      const nextPromiseMap = { ...refundDetailPromiseMap.value }
      delete nextPromiseMap[normalizedId]
      refundDetailPromiseMap.value = nextPromiseMap
    }
  }

  const clearFinanceState = () => {
    paymentRecordList.value = []
    paymentPageInfo.page = 1
    paymentPageInfo.pageSize = 10
    paymentPageInfo.itemCount = 0
    paymentFilters.keyword = ''

    refundAllRows.value = []
    refundList.value = []
    refundPageInfo.page = 1
    refundPageInfo.pageSize = 10
    refundPageInfo.itemCount = 0
    refundFilters.orderNumber = ''
    refundFilters.status = null
    refundDetailCache.value = {}
    refundDetailPromiseMap.value = {}
  }

  return {
    paymentLoading,
    paymentRecordList,
    paymentPageInfo,
    paymentFilters,
    refundLoading,
    refundList,
    refundPageInfo,
    refundFilters,
    refreshVisibleRefundRows,
    fetchPaymentRecordList,
    fetchRefundList,
    fetchRefundDetail,
    clearFinanceState,
  }
})
