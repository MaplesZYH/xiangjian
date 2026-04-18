import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import houseAPI from '@/api/house/house'

const buildQueryKey = (params = {}) => {
  const normalized = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const value = params[key]
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {})

  return JSON.stringify(normalized)
}

export const useProductStore = defineStore('product', () => {
  const clientProductList = ref([])
  const clientProductListLoading = ref(false)
  const clientProductQueryKey = ref('')
  let clientProductListPromise = null
  let clientProductListRequestKey = ''
  const clientFeaturedProductMap = ref({})
  const clientFeaturedProductQueryKey = ref('')
  const clientFeaturedProductLoading = ref(false)
  let clientFeaturedProductPromise = null
  let clientFeaturedProductRequestKey = ''
  const clientProductDetailMap = ref({})
  const clientProductDetailLoadingMap = ref({})
  const clientProductDetailPromiseMap = ref({})
  const clientProductListMeta = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
  })

  const syncClientProductMeta = (pageResult = {}, page, pageSize) => {
    clientProductListMeta.current = page
    clientProductListMeta.pageSize = pageSize
    clientProductListMeta.total = Number(pageResult?.total || 0)
    clientProductListMeta.pages =
      Math.ceil(clientProductListMeta.total / pageSize) || 0
  }

  const applyClientProductPageRecords = (records = []) => {
    clientProductList.value = [...records]
  }

  const resolveReversePageRecords = async ({
    metadataResult,
    page,
    pageSize,
    total,
    params,
  }) => {
    const startAscIndex = Math.max(1, total - page * pageSize + 1)
    const endAscIndex = total - (page - 1) * pageSize

    if (startAscIndex > endAscIndex) return []

    const startBackendPage = Math.ceil(startAscIndex / pageSize)
    const endBackendPage = Math.ceil(endAscIndex / pageSize)
    const backendPages = Array.from(
      { length: endBackendPage - startBackendPage + 1 },
      (_, index) => startBackendPage + index,
    )

    const pageResults = await Promise.all(
      backendPages.map((backendPage) =>
        backendPage === 1
          ? metadataResult
          : houseAPI.getClientHouseData(backendPage, pageSize, params),
      ),
    )

    const mergedRecords = pageResults.flatMap(
      (result) => result.data?.records || [],
    )
    const mergedStartAscIndex = (startBackendPage - 1) * pageSize + 1
    const sliceStart = Math.max(0, startAscIndex - mergedStartAscIndex)
    const sliceLength = endAscIndex - startAscIndex + 1

    return mergedRecords.slice(sliceStart, sliceStart + sliceLength).reverse()
  }

  const resolveAllReverseRecords = async ({
    metadataResult,
    pageSize,
    total,
    params,
  }) => {
    if (!total || total <= 0) return []

    const totalPages = Math.ceil(total / pageSize)
    const backendPages = Array.from({ length: totalPages }, (_, index) => index + 1)

    const pageResults = await Promise.all(
      backendPages.map((backendPage) =>
        backendPage === 1
          ? metadataResult
          : houseAPI.getClientHouseData(backendPage, pageSize, params),
      ),
    )

    return pageResults
      .flatMap((result) => result.data?.records || [])
      .reverse()
  }

  const fetchClientProductList = async (
    params = {},
    { page = 1, pageSize = 10, force = false } = {},
  ) => {
    const queryKey = buildQueryKey(params)
    const requestKey = JSON.stringify({ queryKey, page, pageSize })

    if (
      !force &&
      clientProductQueryKey.value === requestKey &&
      clientProductList.value.length > 0
    ) {
      return clientProductList.value
    }

    if (
      !force &&
      clientProductListLoading.value &&
      clientProductListPromise &&
      clientProductListRequestKey === requestKey
    ) {
      return clientProductListPromise
    }

    clientProductListLoading.value = true
    clientProductListRequestKey = requestKey
    clientProductListPromise = (async () => {
      console.log('[fetchClientProductList] request:', {
        params,
        page,
        pageSize,
        force,
        requestKey,
      })

      const metadataResult = await houseAPI.getClientHouseData(1, pageSize, params)

      console.log('[fetchClientProductList] metadata result:', metadataResult)

      if (!(metadataResult.code === 200 && metadataResult.data)) {
        clientProductList.value = []
        syncClientProductMeta({}, 1, pageSize)
        clientProductQueryKey.value = requestKey
        return []
      }

      syncClientProductMeta(metadataResult.data, page, pageSize)

      if (clientProductListMeta.total === 0) {
        clientProductList.value = []
        clientProductQueryKey.value = requestKey
        return []
      }

      const frontPage = Math.min(
        Math.max(1, page),
        clientProductListMeta.pages || 1,
      )

      if (frontPage !== clientProductListMeta.current) {
        clientProductListMeta.current = frontPage
      }

      const allReverseRecords = await resolveAllReverseRecords({
        metadataResult,
        pageSize,
        total: clientProductListMeta.total,
        params,
      })

      const reversePageRecords = await resolveReversePageRecords({
        metadataResult,
        page: clientProductListMeta.current,
        pageSize,
        total: clientProductListMeta.total,
        params,
      })

      console.log('[fetchClientProductList] all matched records:', allReverseRecords)
      console.log('[fetchClientProductList] all matched records meta:', {
        matchedCount: allReverseRecords.length,
        current: clientProductListMeta.current,
        pageSize,
        total: clientProductListMeta.total,
        pages: clientProductListMeta.pages,
      })

      applyClientProductPageRecords(reversePageRecords)
      clientProductQueryKey.value = requestKey
      return clientProductList.value
    })()

    try {
      return await clientProductListPromise
    } finally {
      clientProductListLoading.value = false
      clientProductListPromise = null
      clientProductListRequestKey = ''
    }
  }

  const fetchClientFeaturedProducts = async (
    styles = ['modern', 'chinese', 'european'],
    { force = false } = {},
  ) => {
    const normalizedStyles = [...new Set(styles.filter(Boolean))]
    const queryKey = JSON.stringify(normalizedStyles)

    if (
      !force &&
      clientFeaturedProductQueryKey.value === queryKey &&
      normalizedStyles.every((style) =>
        Object.prototype.hasOwnProperty.call(clientFeaturedProductMap.value, style),
      )
    ) {
      return clientFeaturedProductMap.value
    }

    if (
      !force &&
      clientFeaturedProductLoading.value &&
      clientFeaturedProductPromise &&
      clientFeaturedProductRequestKey === queryKey
    ) {
      return clientFeaturedProductPromise
    }

    clientFeaturedProductLoading.value = true
    clientFeaturedProductRequestKey = queryKey
    clientFeaturedProductPromise = (async () => {
      const entries = await Promise.all(
        normalizedStyles.map(async (style) => {
          const metadataResult = await houseAPI.getClientHouseData(1, 1, { style })
          if (!(metadataResult.code === 200 && metadataResult.data)) {
            return [style, null]
          }

          const total = Number(metadataResult.data.total || 0)
          if (total <= 0) {
            return [style, null]
          }

          const latestPage = total
          const pageResult =
            latestPage === 1
              ? metadataResult
              : await houseAPI.getClientHouseData(latestPage, 1, { style })

          return [style, pageResult.data?.records?.[0] || null]
        }),
      )

      clientFeaturedProductMap.value = Object.fromEntries(entries)
      clientFeaturedProductQueryKey.value = queryKey
      return clientFeaturedProductMap.value
    })()

    try {
      return await clientFeaturedProductPromise
    } finally {
      clientFeaturedProductLoading.value = false
      clientFeaturedProductPromise = null
      clientFeaturedProductRequestKey = ''
    }
  }

  const fetchClientProductDetail = async (
    productId,
    { force = false } = {},
  ) => {
    const numericId = Number(productId)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null
    }

    if (!force && clientProductDetailMap.value[numericId]) {
      return clientProductDetailMap.value[numericId]
    }

    if (
      !force &&
      clientProductDetailLoadingMap.value[numericId] &&
      clientProductDetailPromiseMap.value[numericId]
    ) {
      return clientProductDetailPromiseMap.value[numericId]
    }

    clientProductDetailLoadingMap.value = {
      ...clientProductDetailLoadingMap.value,
      [numericId]: true,
    }
    const detailPromise = (async () => {
      const result = await houseAPI.getClientHouseDetails(numericId)
      if (result.code === 200 && result.data) {
        clientProductDetailMap.value = {
          ...clientProductDetailMap.value,
          [numericId]: result.data,
        }
        return result.data
      }
      return null
    })()

    clientProductDetailPromiseMap.value = {
      ...clientProductDetailPromiseMap.value,
      [numericId]: detailPromise,
    }

    try {
      return await detailPromise
    } finally {
      const nextPromiseMap = { ...clientProductDetailPromiseMap.value }
      delete nextPromiseMap[numericId]
      clientProductDetailPromiseMap.value = nextPromiseMap
      clientProductDetailLoadingMap.value = {
        ...clientProductDetailLoadingMap.value,
        [numericId]: false,
      }
    }
  }

  const getClientProductDetail = (productId) => {
    const numericId = Number(productId)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null
    }
    return clientProductDetailMap.value[numericId] || null
  }

  const resetClientProductList = () => {
    clientProductList.value = []
    clientProductListMeta.current = 1
    clientProductListMeta.pageSize = 10
    clientProductListMeta.total = 0
    clientProductListMeta.pages = 0
    clientProductQueryKey.value = ''
    clientProductListPromise = null
    clientProductListRequestKey = ''
    clientFeaturedProductMap.value = {}
    clientFeaturedProductQueryKey.value = ''
    clientFeaturedProductPromise = null
    clientFeaturedProductRequestKey = ''
  }

  return {
    clientProductList,
    clientProductListLoading,
    clientProductQueryKey,
    clientFeaturedProductMap,
    clientFeaturedProductQueryKey,
    clientFeaturedProductLoading,
    clientProductListMeta,
    clientProductDetailMap,
    clientProductDetailLoadingMap,
    fetchClientProductList,
    fetchClientFeaturedProducts,
    fetchClientProductDetail,
    getClientProductDetail,
    resetClientProductList,
  }
})
