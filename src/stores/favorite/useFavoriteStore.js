import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import collectAPI from '@/api/user/collect'
import { resolveAssetUrl } from '@/utils/asset'
import { useAuthStore } from '@/stores/auth/useAuthStore'

const defaultFavoriteImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><rect x="110" y="92" width="180" height="116" rx="16" fill="#d7dde5"/><path d="M135 184l42-46 35 34 25-28 28 40H135z" fill="#9aa4b2"/><circle cx="170" cy="130" r="16" fill="#eef2f7"/><text x="200" y="242" text-anchor="middle" font-size="20" fill="#6b7280" font-family="Arial, sans-serif">暂无户型图</text></svg>',
)}`

const resolveCollectStatus = (payload) => {
  if (typeof payload === 'boolean') return payload
  if (typeof payload === 'number') return payload === 1
  if (typeof payload === 'string') {
    return ['1', 'true', 'collected', 'favorited'].includes(
      payload.toLowerCase(),
    )
  }

  if (payload && typeof payload === 'object') {
    const candidates = [
      payload.collected,
      payload.isCollected,
      payload.favorite,
      payload.favorited,
      payload.status,
      payload.data,
    ]

    for (const candidate of candidates) {
      if (candidate !== undefined) {
        return resolveCollectStatus(candidate)
      }
    }
  }

  return false
}

const getFavoriteSource = (item) =>
  item?.product || item?.productInfo || item?.favoriteProduct || item

const getFavoriteId = (item) => {
  const source = getFavoriteSource(item)
  return source?.id ?? item?.productId ?? item?.favoriteId ?? item?.id
}

const getFavoriteImage = (item) => {
  const source = getFavoriteSource(item)
  if (source?.coverImageUrl) return resolveAssetUrl(source.coverImageUrl)
  if (source?.image) return resolveAssetUrl(source.image)
  if (source?.renderings?.length) return resolveAssetUrl(source.renderings[0].url)
  return defaultFavoriteImage
}

const normalizeFavoriteItem = (item) => {
  const source = getFavoriteSource(item)
  return {
    ...(source || {}),
    raw: item,
    id: getFavoriteId(item),
    name: source?.name || item?.productName || '未命名户型',
    image: getFavoriteImage(item),
    style: source?.style || item?.style || '',
    area:
      source?.buildArea || source?.baseArea || item?.buildArea || item?.area,
    buildArea: source?.buildArea || item?.buildArea || null,
    baseArea: source?.baseArea || item?.baseArea || null,
  }
}

const removeFavoriteFromList = (list = [], productId) =>
  list.filter((item) => Number(item?.id) !== Number(productId))

export const useFavoriteStore = defineStore('favorite', () => {
  const authStore = useAuthStore()

  const favoriteStatusMap = ref({})
  const favoriteLoadingMap = ref({})
  const favoriteList = ref([])
  const favoriteListLoading = ref(false)
  const activeFavoriteUserId = ref('')
  const favoritePagination = reactive({
    page: 1,
    pageSize: 3,
    itemCount: 0,
    pageCount: 0,
  })

  const currentUserId = computed(() => {
    if (!authStore.isCurrentUser) return ''
    return authStore.currentClientId || ''
  })

  const currentPermissions = computed(() =>
    Array.isArray(authStore.currentClientPermissions)
      ? authStore.currentClientPermissions
      : [],
  )

  const hasCollectPermission = (permission) =>
    currentPermissions.value.includes(permission)

  const canQueryCollectStatus = computed(() =>
    hasCollectPermission('product:favorite:status'),
  )
  const canAddCollect = computed(() =>
    hasCollectPermission('product:favorite:add'),
  )
  const canRemoveCollect = computed(() =>
    hasCollectPermission('product:favorite:remove'),
  )
  const shouldShowCollectButton = computed(() => {
    if (!currentUserId.value) return true
    return (
      canQueryCollectStatus.value ||
      canAddCollect.value ||
      canRemoveCollect.value
    )
  })

  const ensureUserContext = (userId = currentUserId.value) => {
    const normalizedUserId = userId ? String(userId) : ''

    if (
      activeFavoriteUserId.value &&
      normalizedUserId &&
      activeFavoriteUserId.value !== normalizedUserId
    ) {
      favoriteStatusMap.value = {}
      favoriteLoadingMap.value = {}
      favoriteList.value = []
      favoritePagination.page = 1
      favoritePagination.itemCount = 0
      favoritePagination.pageCount = 0
    }

    activeFavoriteUserId.value = normalizedUserId
  }

  const isCollected = (productId) => {
    if (!currentUserId.value) return false
    return !!favoriteStatusMap.value[productId]
  }

  const setFavoriteLoading = (productId, loading) => {
    favoriteLoadingMap.value = {
      ...favoriteLoadingMap.value,
      [productId]: loading,
    }
  }

  const syncFavoriteStatus = async (productId, userId = currentUserId.value) => {
    ensureUserContext(userId)
    const numericId = Number(productId)
    if (!Number.isInteger(numericId) || numericId <= 0) return false

    if (!userId || !canQueryCollectStatus.value) {
      favoriteStatusMap.value = {
        ...favoriteStatusMap.value,
        [numericId]: false,
      }
      return false
    }

    try {
      const res = await collectAPI.getCollectStatus(numericId, userId)
      const collected = resolveCollectStatus(res?.data)
      favoriteStatusMap.value = {
        ...favoriteStatusMap.value,
        [numericId]: collected,
      }
      return collected
    } catch (error) {
      favoriteStatusMap.value = {
        ...favoriteStatusMap.value,
        [numericId]: false,
      }
      throw error
    }
  }

  const syncFavoriteStatuses = async (productIds = [], userId = currentUserId.value) => {
    ensureUserContext(userId)
    const ids = [...new Set(productIds.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))]

    if (!ids.length) return {}

    if (!userId || !canQueryCollectStatus.value) {
      const resetMap = ids.reduce((acc, id) => {
        acc[id] = false
        return acc
      }, {})
      favoriteStatusMap.value = {
        ...favoriteStatusMap.value,
        ...resetMap,
      }
      return resetMap
    }

    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const collected = await syncFavoriteStatus(id, userId)
          return [id, collected]
        } catch {
          favoriteStatusMap.value = {
            ...favoriteStatusMap.value,
            [id]: false,
          }
          return [id, false]
        }
      }),
    )

    return entries.reduce((acc, [id, collected]) => {
      acc[id] = collected
      return acc
    }, {})
  }

  const toggleFavorite = async (productId, userId = currentUserId.value) => {
    ensureUserContext(userId)
    const numericId = Number(productId)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new Error('invalid product id')
    }

    setFavoriteLoading(numericId, true)
    try {
      if (isCollected(numericId)) {
        await collectAPI.cancelCollect(numericId, userId)
        favoriteStatusMap.value = {
          ...favoriteStatusMap.value,
          [numericId]: false,
        }
        favoriteList.value = removeFavoriteFromList(favoriteList.value, numericId)
        if (favoritePagination.itemCount > 0) {
          favoritePagination.itemCount -= 1
        }
        favoritePagination.pageCount =
          Math.ceil(favoritePagination.itemCount / favoritePagination.pageSize) || 0
        return { collected: false, action: 'removed' }
      }

      await collectAPI.collecProjects(numericId, userId)
      favoriteStatusMap.value = {
        ...favoriteStatusMap.value,
        [numericId]: true,
      }
      return { collected: true, action: 'added' }
    } finally {
      setFavoriteLoading(numericId, false)
    }
  }

  const fetchFavoriteList = async ({
    page = favoritePagination.page,
    pageSize = favoritePagination.pageSize,
    userId = currentUserId.value,
  } = {}) => {
    ensureUserContext(userId)
    favoritePagination.page = page
    favoritePagination.pageSize = pageSize

    if (!userId) {
      favoriteList.value = []
      favoritePagination.itemCount = 0
      favoritePagination.pageCount = 0
      return []
    }

    favoriteListLoading.value = true
    try {
      const res = await collectAPI.getCollectList(userId, page, pageSize)
      const pageData = res?.data || {}
      const records = pageData.records || pageData.rows || pageData.list || []
      const normalizedRecords = records
        .map(normalizeFavoriteItem)
        .filter((item) => item.id)

      favoriteList.value = normalizedRecords
      favoritePagination.itemCount = pageData.total || records.length || 0
      favoritePagination.pageCount =
        pageData.pages ||
        Math.ceil(favoritePagination.itemCount / favoritePagination.pageSize) ||
        0

      favoriteStatusMap.value = normalizedRecords.reduce(
        (acc, item) => {
          acc[item.id] = true
          return acc
        },
        { ...favoriteStatusMap.value },
      )

      return normalizedRecords
    } finally {
      favoriteListLoading.value = false
    }
  }

  const clearFavoriteState = () => {
    activeFavoriteUserId.value = ''
    favoriteStatusMap.value = {}
    favoriteLoadingMap.value = {}
    favoriteList.value = []
    favoritePagination.page = 1
    favoritePagination.itemCount = 0
    favoritePagination.pageCount = 0
  }

  return {
    favoriteStatusMap,
    favoriteLoadingMap,
    favoriteList,
    favoriteListLoading,
    favoritePagination,
    currentUserId,
    canQueryCollectStatus,
    canAddCollect,
    canRemoveCollect,
    shouldShowCollectButton,
    normalizeFavoriteItem,
    isCollected,
    syncFavoriteStatus,
    syncFavoriteStatuses,
    toggleFavorite,
    fetchFavoriteList,
    clearFavoriteState,
    defaultFavoriteImage,
  }
})
