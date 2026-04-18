import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import OrderAPI from '@/api/user/detailsOrder'
import CategoryAPI from '@/api/house/categories'
import DispatchAPI from '@/api/service/dispatchOrders'
import ConstructionAPI from '@/api/house/construction'
import {
  CONSTRUCTION_NODE_STATUS,
  normalizeConstructionFlow,
} from '@/utils/construction'
import { normalizeOrderPaymentState } from '@/utils/orderPayment'
import { useStructuredAddressForm } from '@/composables/useStructuredAddressForm'

const CONSTRUCTION_PRICE_LOCK_STORAGE_KEY =
  'admin_construction_price_locked_order_ids'
const CONSTRUCTION_PRICE_PLAN_CACHE_STORAGE_KEY =
  'admin_construction_price_plan_cache'

const vendorServiceTypeMap = {
  1: '建筑商',
  2: '材料商',
  3: '综合服务商',
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

const getVendorServiceTypeText = (type) =>
  vendorServiceTypeMap[Number(type)] || '未知类型'

const formatVendorDistance = (distance) => {
  const value = Number(distance)
  return Number.isFinite(value) ? `距离${value.toFixed(1)}km` : '距离未知'
}

const getVendorMaterialCategoryText = (categories) => {
  if (!Array.isArray(categories) || categories.length === 0) return ''
  return categories
    .map((item) => item?.name)
    .filter(Boolean)
    .join(' / ')
}

const buildVendorOption = (vendor) => {
  const serviceTypeText = getVendorServiceTypeText(vendor?.serviceType)
  const distanceText = formatVendorDistance(vendor?.distance)
  const materialCategoryText = getVendorMaterialCategoryText(
    vendor?.materialCategory,
  )
  const parts = [
    vendor?.companyName || `服务商#${vendor?.id}`,
    serviceTypeText,
    distanceText,
  ]
  if (materialCategoryText) {
    parts.push(`材料:${materialCategoryText}`)
  }
  return {
    label: parts.join(' | '),
    value: vendor.id,
    raw: vendor,
  }
}

const roundCurrencyAmount = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return 0
  return Number(amount.toFixed(2))
}

const loadConstructionPriceLockedOrderIds = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CONSTRUCTION_PRICE_LOCK_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item > 0)
      : []
  } catch {
    return []
  }
}

const loadConstructionPricePlanCache = () => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(
      CONSTRUCTION_PRICE_PLAN_CACHE_STORAGE_KEY,
    )
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const resolveConstructionNodeAmount = (node, fallbackAmount = null) => {
  const candidates = [
    node?.amount,
    node?.price,
    node?.nodeAmount,
    node?.nodePrice,
    fallbackAmount,
  ]

  for (const candidate of candidates) {
    if (candidate === '' || candidate === null || candidate === undefined) {
      continue
    }

    const amount = Number(candidate)
    if (Number.isFinite(amount) && amount >= 0) {
      return roundCurrencyAmount(amount)
    }
  }

  return 0
}

export const useAdminOrderManageStore = defineStore('adminOrderManage', () => {
  const loadingList = ref(false)
  const loadingMetadata = ref(false)
  const loadingDetail = ref(false)
  const dispatchLoading = ref(false)
  const loadingConstruction = ref(false)
  const loadingVendorOpts = ref(false)
  const submitting = ref(false)
  const redispatchSubmitting = ref(false)
  const redispatchLoading = ref(false)
  const savingNodePriceId = ref(null)

  const pageInfo = reactive({
    page: 1,
    pageSize: 8,
    pageCount: 0,
    count: 0,
  })
  const filters = reactive({
    keyword: '',
    orderStatus: null,
    paymentStatus: null,
  })
  const orderList = ref([])
  const orderContractCache = ref({})
  const dynamicConfigList = ref([])
  const detailOrder = ref({})
  const selectionMap = ref({})
  const currentContractUrl = ref('')

  const {
    addressForm: orderAddressForm,
    selectedRegionCode: selectedOrderRegionCode,
    regionCascaderOptions: orderRegionCascaderOptions,
    addressPreview: orderAddressPreview,
    resetAddressForm: resetOrderAddressForm,
    handleRegionUpdate: handleOrderRegionUpdate,
    hydrateAddressForm,
    validateAddressForm,
  } = useStructuredAddressForm({
    addressLabel: '订单地址',
  })

  const currentDispatchOrder = ref(null)
  const materialDispatchList = ref([])
  const activeConstructionOrder = ref(null)
  const constructionInfo = ref(null)
  const currentNodeDetail = ref(null)
  const constructionForm = reactive({
    vendorId: null,
    price: 0,
    adminNotes: '',
  })
  const constructionVendorOptions = ref([])
  const currentTarget = ref({
    type: 2,
    categoryId: null,
    category: '',
    name: '',
  })
  const materialForm = reactive({
    vendorId: null,
    price: 0,
    adminNotes: '',
  })
  const materialVendorOptions = ref([])
  const redispatchVendorOptions = ref([])
  const redispatchTarget = ref({
    vendorOrderId: null,
    type: 1,
    categoryId: null,
    category: '',
    name: '',
    currentVendorName: '',
  })
  const redispatchForm = reactive({
    vendorId: null,
    price: 0,
    adminNotes: '',
  })
  const showAuditRejectModal = ref(false)
  const auditRejectReason = ref('')
  const showCancelModal = ref(false)
  const cancelReason = ref('')
  const currentCancelId = ref(null)
  const constructionPriceLockedOrderIds = ref(
    loadConstructionPriceLockedOrderIds(),
  )
  const constructionPricePlanCache = ref(loadConstructionPricePlanCache())
  const editableNodePriceMap = reactive({})

  const isOptionalProductsLocked = computed(() =>
    hasUploadedContract(detailOrder.value),
  )

  const canDispatch = computed(
    () =>
      !!currentContractUrl.value &&
      [1, 2].includes(Number(detailOrder.value?.paymentStatus)),
  )

  const currentConstructionOrderId = computed(() =>
    Number(currentDispatchOrder.value?.id || detailOrder.value?.id || 0),
  )

  const currentDispatchStageOrderStatus = computed(() =>
    Number(detailOrder.value?.orderStatus ?? currentDispatchOrder.value?.orderStatus ?? 0),
  )

  const isDispatchStageLocked = computed(
    () => currentDispatchStageOrderStatus.value >= 3,
  )

  const isConstructionPriceLocked = computed(() =>
    constructionPriceLockedOrderIds.value.includes(currentConstructionOrderId.value),
  )

  const assertDispatchStageEditable = () => {
    if (isDispatchStageLocked.value) {
      throw new Error('订单已进入施工阶段，派单信息已锁定')
    }
  }

  const activeConstructionNodeId = computed(() => {
    if (!constructionInfo.value?.nodeDetails?.length) return null
    return (
      constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex]
        ?.nodeId || null
    )
  })

  const activeConstructionNode = computed(() => {
    if (!constructionInfo.value?.nodeDetails?.length) return null
    return (
      constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex] ||
      null
    )
  })

  const currentNodeDetailStatusText = computed(() => {
    if (!currentNodeDetail.value) return '未知状态'
    if (
      activeConstructionNodeId.value &&
      Number(currentNodeDetail.value.nodeId) === Number(activeConstructionNodeId.value)
    ) {
      return (
        constructionInfo.value?.currentNodeStatusText ||
        currentNodeDetail.value.statusText ||
        '未知状态'
      )
    }
    return currentNodeDetail.value.statusText || '未知状态'
  })

  const priceLimitTotal = computed(() =>
    Number(detailOrder.value?.totalAmount || constructionInfo.value?.totalAmount || 0),
  )

  const editableConstructionNodes = computed(() =>
    (constructionInfo.value?.nodeDetails || []).filter((_, index) =>
      !isConstructionPriceLocked.value &&
      Number(index) >= Number(constructionInfo.value?.currentNodeIndex || 0),
    ),
  )

  const lockedNodePriceTotal = computed(() =>
    roundCurrencyAmount(
      (constructionInfo.value?.nodeDetails || []).reduce(
        (sum, node, index) =>
          index < Number(constructionInfo.value?.currentNodeIndex || 0)
            ? sum + Number(node.amount || 0)
            : sum,
        0,
      ),
    ),
  )

  const editableNodeDraftTotal = computed(() =>
    roundCurrencyAmount(
      editableConstructionNodes.value.reduce((sum, node) => {
        const amount = Number(editableNodePriceMap[node.nodeId])
        return sum + (Number.isFinite(amount) ? amount : 0)
      }, 0),
    ),
  )

  const constructionAssignedTotal = computed(() =>
    roundCurrencyAmount(lockedNodePriceTotal.value + editableNodeDraftTotal.value),
  )

  const constructionRemainingAmount = computed(() =>
    roundCurrencyAmount(priceLimitTotal.value - constructionAssignedTotal.value),
  )

  const currentEditableNodeDraftAmount = computed(() => {
    const nodeId = activeConstructionNode.value?.nodeId
    if (!nodeId) return 0
    const amount = Number(editableNodePriceMap[nodeId])
    return Number.isFinite(amount) ? amount : 0
  })

  const constructionPricePlanDirty = computed(() =>
    isConstructionPriceLocked.value
      ? false
      : editableConstructionNodes.value.some((node) => {
          const draftAmount = roundCurrencyAmount(editableNodePriceMap[node.nodeId])
          const savedAmount = roundCurrencyAmount(node.amount || 0)
          return draftAmount !== savedAmount
        }),
  )

  const constructionPricePlanReady = computed(() => {
    if (!constructionInfo.value?.nodeDetails?.length) return false
    if (!editableConstructionNodes.value.length) return true

    const amountsValid = editableConstructionNodes.value.every((node) => {
      const amount = Number(editableNodePriceMap[node.nodeId])
      return Number.isFinite(amount) && amount >= 0
    })
    if (!amountsValid) return false
    if (currentEditableNodeDraftAmount.value <= 0) return false

    return roundCurrencyAmount(constructionRemainingAmount.value) === 0
  })

  const constructionPricePlanStatusText = computed(() => {
    if (isConstructionPriceLocked.value) return '金额已锁定'
    if (constructionPricePlanReady.value) return '金额配置完成'
    if (constructionPricePlanDirty.value) return '草稿待保存'
    return '等待配置'
  })

  const formatCurrencyAmount = (value) =>
    roundCurrencyAmount(value).toLocaleString()

  const constructionPricePlanHint = computed(() => {
    if (isConstructionPriceLocked.value) {
      return '已确认当前价格配置，施工流程开始后节点金额已锁定，不可再修改。'
    }
    if (currentEditableNodeDraftAmount.value <= 0) {
      return '当前节点金额必须大于 0，且所有未锁定节点金额总和需要刚好等于订单总额。'
    }
    if (constructionRemainingAmount.value > 0) {
      return `还有 ¥${formatCurrencyAmount(constructionRemainingAmount.value)} 未分配，请继续补齐后再保存。`
    }
    if (constructionRemainingAmount.value < 0) {
      return `当前分配已超出订单总额 ¥${formatCurrencyAmount(
        Math.abs(constructionRemainingAmount.value),
      )}，请回调节点金额。`
    }
    if (constructionPricePlanDirty.value) {
      return '金额分配已满足要求，但仍有改动未保存，请点击“保存全部节点金额”。'
    }
    return '请为全部未锁定节点分配金额后保存。'
  })

  const resolvedCurrentNodeAmount = computed(() => {
    const flowAmount = Number(activeConstructionNode.value?.amount)
    if (Number.isFinite(flowAmount) && flowAmount > 0) {
      return flowAmount
    }

    const detailAmount = Number(currentNodeDetail.value?.amount)
    if (Number.isFinite(detailAmount) && detailAmount > 0) {
      return detailAmount
    }

    return 0
  })

  const allServicesAccepted = computed(() => {
    if (
      !activeConstructionOrder.value ||
      activeConstructionOrder.value.orderStatus !== 1
    ) {
      return false
    }
    if (materialDispatchList.value.length > 0) {
      const allMaterialsOk = materialDispatchList.value.every(
        (item) => item.statusData && item.statusData.orderStatus === 1,
      )
      if (!allMaterialsOk) return false
    }
    return true
  })

  const persistConstructionPriceLockedOrderIds = () => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      CONSTRUCTION_PRICE_LOCK_STORAGE_KEY,
      JSON.stringify(constructionPriceLockedOrderIds.value),
    )
  }

  const persistConstructionPricePlanCache = () => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      CONSTRUCTION_PRICE_PLAN_CACHE_STORAGE_KEY,
      JSON.stringify(constructionPricePlanCache.value),
    )
  }

  const getConstructionPriceCacheForOrder = (orderId) => {
    const numericOrderId = Number(orderId)
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) return {}
    const cache = constructionPricePlanCache.value?.[numericOrderId]
    return cache && typeof cache === 'object' ? cache : {}
  }

  const saveConstructionPricePlanCache = (orderId, nodePrices = []) => {
    const numericOrderId = Number(orderId)
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) return

    const nextOrderCache = {}
    let hasCacheValue = false

    nodePrices.forEach((item) => {
      const nodeId = Number(item?.nodeId || item?.id)
      if (!Number.isInteger(nodeId) || nodeId <= 0) return
      const amount = resolveConstructionNodeAmount(item)
      nextOrderCache[nodeId] = amount
      if (amount > 0) {
        hasCacheValue = true
      }
    })

    if (!hasCacheValue) return

    constructionPricePlanCache.value = {
      ...constructionPricePlanCache.value,
      [numericOrderId]: nextOrderCache,
    }
    persistConstructionPricePlanCache()
  }

  const mergeConstructionNodeAmounts = (orderId, nodes = []) => {
    const orderCache = getConstructionPriceCacheForOrder(orderId)
    return nodes.map((node) => {
      const nodeId = Number(node?.nodeId || node?.id)
      const cachedAmount = orderCache[nodeId]
      const resolvedAmount = resolveConstructionNodeAmount(node)
      const nextAmount =
        resolvedAmount > 0
          ? resolvedAmount
          : Number.isFinite(Number(cachedAmount))
            ? roundCurrencyAmount(cachedAmount)
            : resolvedAmount

      return {
        ...node,
        amount: nextAmount,
      }
    })
  }

  const markConstructionPriceLocked = (orderId) => {
    const numericOrderId = Number(orderId)
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) return
    if (!constructionPriceLockedOrderIds.value.includes(numericOrderId)) {
      constructionPriceLockedOrderIds.value = [
        ...constructionPriceLockedOrderIds.value,
        numericOrderId,
      ]
      persistConstructionPriceLockedOrderIds()
    }
  }

  const resetFilters = () => {
    filters.keyword = ''
    filters.orderStatus = null
    filters.paymentStatus = null
  }

  const syncDispatchListItem = () => {
    const orderId = detailOrder.value?.id
    if (!orderId) return

    const listItem = orderList.value.find((item) => item.id === orderId)
    if (!listItem) return

    Object.assign(listItem, {
      orderStatus: detailOrder.value.orderStatus,
      paymentStatus: detailOrder.value.paymentStatus,
      orderContract: detailOrder.value.orderContract,
      contractLoaded: true,
    })
    orderContractCache.value = {
      ...orderContractCache.value,
      [orderId]: {
        orderContract: detailOrder.value.orderContract || null,
        contractLoaded: true,
      },
    }
  }

  const initMetadata = async () => {
    loadingMetadata.value = true
    try {
      const categoryRes = await CategoryAPI.getCategoryData(1, 100)
      if (categoryRes.data && categoryRes.data.records) {
        const categories = categoryRes.data.records
        const configList = await Promise.all(
          categories.map(async (cat) => {
            const optionsRes = await CategoryAPI.getOptionsData(1, 100, cat.id, '')
            const options =
              optionsRes.data && optionsRes.data.records
                ? optionsRes.data.records.map((opt) => ({
                    label: opt.name,
                    value: opt.id,
                  }))
                : []
            return {
              label: cat.name,
              key: `cat_${cat.id}`,
              categoryId: cat.id,
              options,
            }
          }),
        )
        dynamicConfigList.value = configList
      }
    } finally {
      loadingMetadata.value = false
    }
  }

  const fetchData = async () => {
    loadingList.value = true
    try {
      const res = await OrderAPI.getUserOrder({
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        ...filters,
      })
      if (res.code === 200) {
        const rows = Array.isArray(res.data.rows) ? res.data.rows : []
        orderList.value = rows.map((item) => {
          const normalizedItem = normalizeOrderPaymentState({
            ...item,
            orderContract: item.orderContract || null,
            contractLoaded: hasKnownContractState(item),
          })
          const cachedContractState = orderContractCache.value[normalizedItem.id]
          return cachedContractState
            ? {
                ...normalizedItem,
                ...cachedContractState,
              }
            : normalizedItem
        })

        const detailTasks = orderList.value.map(async (item) => {
          if (item.contractLoaded || Number(item.orderStatus) >= 4) return
          try {
            const detailRes = await OrderAPI.getUserOrderDetail(item.id)
            if (detailRes.code === 200 && detailRes.data) {
              item.orderContract = detailRes.data.orderContract
              item.contractLoaded = true
              orderContractCache.value = {
                ...orderContractCache.value,
                [item.id]: {
                  orderContract: detailRes.data.orderContract || null,
                  contractLoaded: true,
                },
              }
            }
          } catch (error) {
            console.error(`获取订单${item.id}合同信息失败`, error)
          }
        })
        await Promise.all(detailTasks)

        pageInfo.count = Number(res.data.total || 0)
        pageInfo.pageCount = Math.ceil(pageInfo.count / pageInfo.pageSize)
      }
      return res
    } finally {
      loadingList.value = false
    }
  }

  const fetchOrderDetailInternal = async (id) => {
    loadingDetail.value = true
    currentContractUrl.value = ''

    try {
      const res = await OrderAPI.getUserOrderDetail(id)
      if (res.code === 200) {
        const data = res.data
        orderContractCache.value = {
          ...orderContractCache.value,
          [id]: {
            orderContract: data.orderContract || null,
            contractLoaded: true,
          },
        }
        detailOrder.value = normalizeOrderPaymentState({
          ...data,
          mpId: data.house?.houseMainStructure?.mpId,
          structureInfo: data.house?.houseMainStructure || {},
          customerNotes: data.customerNotes || '',
          adminNotes: data.adminNotes || '',
        })
        hydrateAddressForm(data.orderAddress)

        if (data.orderContract && data.orderContract.fileUrl) {
          currentContractUrl.value = data.orderContract.fileUrl
        }

        selectionMap.value = {}
        const existingProducts = data.house?.houseOptionalProducts || []

        dynamicConfigList.value.forEach((config) => {
          const found = existingProducts.find(
            (item) => item.categoryId === config.categoryId,
          )

          if (found) {
            selectionMap.value[config.key] = found.optionalProductId
            const inOptions = config.options.some(
              (opt) => opt.value === found.optionalProductId,
            )
            if (!inOptions) {
              config.options.push({
                label: found.name || `未知产品(ID:${found.optionalProductId})`,
                value: found.optionalProductId,
              })
            }
          } else {
            selectionMap.value[config.key] = null
          }
        })
      }
      return res
    } finally {
      loadingDetail.value = false
    }
  }

  const updateCurrentOrder = async () => {
    const errorMessage = validateAddressForm()
    if (errorMessage) {
      throw new Error(errorMessage)
    }

    const optionalProductIds = []
    Object.values(selectionMap.value).forEach((value) => {
      if (value) optionalProductIds.push(value)
    })

    const payload = {
      id: detailOrder.value.id,
      orderAddress: orderAddressPreview.value,
      customerNotes: detailOrder.value.customerNotes,
      adminNotes: detailOrder.value.adminNotes,
      mpId: detailOrder.value.mpId,
      optionalProductIds,
    }

    const res = await OrderAPI.updateOrderDetail(payload)
    if (res.code === 200) {
      detailOrder.value.orderAddress = orderAddressPreview.value
    }
    return res
  }

  const uploadContract = async ({ orderId, file }) => {
    const res = await OrderAPI.uploadContract(orderId, file)
    if (res.code === 200 && res.data?.contractUrl) {
      currentContractUrl.value = res.data.contractUrl
      detailOrder.value = {
        ...detailOrder.value,
        orderContract: { fileUrl: res.data.contractUrl },
      }
      syncDispatchListItem()
    }
    return res
  }

  const deleteUserOrder = (id) => OrderAPI.deleteUserOrder(id)

  const resetConstructionForm = () => {
    constructionForm.vendorId = null
    constructionForm.price = 0
    constructionForm.adminNotes = ''
  }

  const resetMaterialDispatchForm = () => {
    materialForm.vendorId = null
    materialForm.price = 0
    materialForm.adminNotes = ''
  }

  const resetRedispatchForm = () => {
    redispatchForm.vendorId = null
    redispatchForm.price = 0
    redispatchForm.adminNotes = ''
    redispatchVendorOptions.value = []
    redispatchTarget.value = {
      vendorOrderId: null,
      type: 1,
      categoryId: null,
      category: '',
      name: '',
      currentVendorName: '',
    }
  }

  const loadDispatchVendors = async ({ type, categoryId = null }) => {
    if (!currentDispatchOrder.value?.id) return []
    const request =
      Number(type) === 1
        ? DispatchAPI.getNearbyBuilders(currentDispatchOrder.value.id)
        : DispatchAPI.getNearbyMaterialSuppliers(
            currentDispatchOrder.value.id,
            categoryId,
          )
    const res = await request
    if (res.code !== 200) return []
    const rows = Array.isArray(res?.data?.rows) ? res.data.rows : []
    return rows.map(buildVendorOption)
  }

  const enrichVendorOrderDetail = async (vendorOrder) => {
    if (!vendorOrder?.vendorOrderId) return vendorOrder
    const res = await DispatchAPI.getVendorOrderStatus(vendorOrder.vendorOrderId)
    if (res.code === 200 && res.data) {
      return {
        ...vendorOrder,
        ...res.data,
        vendorOrderId: vendorOrder.vendorOrderId,
        companyName: vendorOrder.companyName,
      }
    }
    return vendorOrder
  }

  const initDispatchState = async () => {
    if (!currentDispatchOrder.value?.id) return null
    dispatchLoading.value = true
    activeConstructionOrder.value = null
    materialDispatchList.value = []

    try {
      const res = await DispatchAPI.getVendorOrders(currentDispatchOrder.value.id)
      const vendorOrders = await Promise.all(
        (Array.isArray(res.data) ? res.data : []).map(enrichVendorOrderDetail),
      )

      const consOrder = vendorOrders.find(
        (item) => item.type === 1 && [0, 1, 2, 3].includes(item.orderStatus),
      )
      if (consOrder) {
        activeConstructionOrder.value = consOrder
      }

      const existingProducts = detailOrder.value.house?.houseOptionalProducts || []
      existingProducts.forEach((product) => {
        const matchOrder = vendorOrders.find(
          (item) =>
            item.type === 2 &&
            item.materialCategory === product.categoryId &&
            [0, 1, 2, 3].includes(item.orderStatus),
        )

        materialDispatchList.value.push({
          categoryId: product.categoryId,
          category: product.categoryName,
          name: product.name,
          statusData: matchOrder || null,
        })
      })

      return res
    } finally {
      dispatchLoading.value = false
    }
  }

  const loadBuilders = async () => {
    loadingVendorOpts.value = true
    try {
      constructionVendorOptions.value = await loadDispatchVendors({ type: 1 })
      return constructionVendorOptions.value
    } finally {
      loadingVendorOpts.value = false
    }
  }

  const loadMaterialVendors = async (categoryId) => {
    loadingVendorOpts.value = true
    try {
      materialVendorOptions.value = await loadDispatchVendors({
        type: 2,
        categoryId,
      })
      return materialVendorOptions.value
    } finally {
      loadingVendorOpts.value = false
    }
  }

  const prepareMaterialDispatch = async (row) => {
    assertDispatchStageEditable()
    currentTarget.value = {
      type: 2,
      categoryId: row.categoryId,
      category: row.category,
      name: row.name,
    }
    resetMaterialDispatchForm()
    return loadMaterialVendors(row.categoryId)
  }

  const prepareRedispatch = async (vendorOrder) => {
    assertDispatchStageEditable()
    resetRedispatchForm()
    redispatchTarget.value = {
      vendorOrderId: vendorOrder.vendorOrderId,
      type: Number(vendorOrder.type || 1),
      categoryId: vendorOrder.materialCategory || null,
      category:
        materialDispatchList.value.find(
          (item) => item.statusData?.vendorOrderId === vendorOrder.vendorOrderId,
        )?.category || '',
      name:
        vendorOrder.materialName ||
        materialDispatchList.value.find(
          (item) => item.statusData?.vendorOrderId === vendorOrder.vendorOrderId,
        )?.name ||
        '',
      currentVendorName: vendorOrder.companyName || '',
    }
    redispatchForm.price = Number(vendorOrder.price || 0)
    redispatchForm.adminNotes = vendorOrder.adminNotes || ''

    redispatchLoading.value = true
    try {
      redispatchVendorOptions.value = await loadDispatchVendors({
        type: redispatchTarget.value.type,
        categoryId: redispatchTarget.value.categoryId,
      })
      return redispatchVendorOptions.value
    } finally {
      redispatchLoading.value = false
    }
  }

  const createConstructionDispatch = async () => {
    assertDispatchStageEditable()
    if (constructionForm.price <= 0) {
      throw new Error('派单价格必须大于 0')
    }
    if (!constructionForm.vendorId) {
      throw new Error('请选择施工单位')
    }

    return DispatchAPI.createVendorOrder({
      userOrderId: currentDispatchOrder.value.id,
      vendorId: constructionForm.vendorId,
      type: 1,
      price: constructionForm.price,
      adminNotes: constructionForm.adminNotes,
    })
  }

  const createMaterialDispatch = async () => {
    assertDispatchStageEditable()
    if (materialForm.price <= 0) {
      throw new Error('派单价格必须大于 0')
    }
    if (!materialForm.vendorId) {
      throw new Error('请选择供应商')
    }

    return DispatchAPI.createVendorOrder({
      userOrderId: currentDispatchOrder.value.id,
      vendorId: materialForm.vendorId,
      type: 2,
      price: materialForm.price,
      adminNotes: materialForm.adminNotes,
      materialCategory: currentTarget.value.categoryId,
      materialName: currentTarget.value.name,
    })
  }

  const prepareCancelVendorOrder = (vendorOrderId) => {
    currentCancelId.value = vendorOrderId
    cancelReason.value = ''
  }

  const cancelCurrentVendorOrder = async () => {
    assertDispatchStageEditable()
    if (!cancelReason.value) {
      throw new Error('请输入取消理由')
    }
    return DispatchAPI.cancelVendorOrder(
      currentCancelId.value,
      cancelReason.value,
    )
  }

  const submitRedispatch = async () => {
    assertDispatchStageEditable()
    if (!redispatchTarget.value.vendorOrderId) {
      throw new Error('未识别到重派子订单')
    }
    if (!redispatchForm.vendorId) {
      throw new Error('请选择新的服务商公司')
    }
    if (Number(redispatchForm.price) <= 0) {
      throw new Error('派单价格必须大于 0')
    }

    const redispatchRes = await DispatchAPI.redispatchOrder(
      redispatchTarget.value.vendorOrderId,
      redispatchForm.vendorId,
    )
    if (redispatchRes.code !== 200) {
      return redispatchRes
    }

    const updatePayload = {
      vendorOrderId: redispatchTarget.value.vendorOrderId,
      price: Number(redispatchForm.price),
      adminNotes: redispatchForm.adminNotes,
    }
    if (redispatchTarget.value.type === 2) {
      updatePayload.materialName = redispatchTarget.value.name
    }

    return DispatchAPI.updateVendorOrderDetail(updatePayload)
  }

  const syncEditableNodePriceMap = (nodes = []) => {
    Object.keys(editableNodePriceMap).forEach((key) => {
      delete editableNodePriceMap[key]
    })

    nodes.forEach((node) => {
      editableNodePriceMap[node.nodeId] = resolveConstructionNodeAmount(node)
    })
  }

  const resetEditableNodePriceDraft = () => {
    syncEditableNodePriceMap(constructionInfo.value?.nodeDetails || [])
  }

  const applyBalancedNodePricePlan = () => {
    if (!editableConstructionNodes.value.length) {
      throw new Error('当前没有可配置金额的节点')
    }

    const totalCents = Math.round(priceLimitTotal.value * 100)
    const lockedCents = Math.round(lockedNodePriceTotal.value * 100)
    const remainingCents = totalCents - lockedCents
    if (remainingCents < 0) {
      throw new Error('已锁定金额已经超过订单总额，无法自动均分')
    }

    const base = Math.floor(remainingCents / editableConstructionNodes.value.length)
    const residue = remainingCents - base * editableConstructionNodes.value.length

    editableConstructionNodes.value.forEach((node, index) => {
      const extra = index === editableConstructionNodes.value.length - 1 ? residue : 0
      editableNodePriceMap[node.nodeId] = roundCurrencyAmount((base + extra) / 100)
    })

    return {
      code: 200,
      msg: '已按剩余总额均分到未锁定节点，请确认后保存',
    }
  }

  const loadConstructionStatus = async () => {
    if (!currentDispatchOrder.value?.id) return null
    loadingConstruction.value = true
    try {
      const res = await ConstructionAPI.getConstructionStatus(
        currentDispatchOrder.value.id,
      )
      const normalizedFlow = normalizeConstructionFlow(res?.data)
      if (res.code === 200 && normalizedFlow) {
        const mergedNodeDetails = mergeConstructionNodeAmounts(
          currentDispatchOrder.value.id,
          normalizedFlow.nodeDetails || [],
        )
        const nextFlow = {
          ...normalizedFlow,
          nodeDetails: mergedNodeDetails,
        }

        constructionInfo.value = nextFlow
        saveConstructionPricePlanCache(
          currentDispatchOrder.value.id,
          mergedNodeDetails,
        )
        syncEditableNodePriceMap(mergedNodeDetails)
        const activeNode =
          nextFlow.nodeDetails?.[Number(nextFlow.currentNodeIndex) || 0] || null
        if (activeNode) {
          await handleNodeClick(activeNode)
        }
      } else {
        constructionInfo.value = null
        currentNodeDetail.value = null
        syncEditableNodePriceMap([])
      }
      return res
    } catch (error) {
      constructionInfo.value = null
      currentNodeDetail.value = null
      syncEditableNodePriceMap([])
      throw error
    } finally {
      loadingConstruction.value = false
    }
  }

  const startConstructionProcess = (orderId) =>
    ConstructionAPI.startConstruction(orderId)

  const handleNodeClick = async (node) => {
    if (!currentDispatchOrder.value?.id) {
      throw new Error('订单信息缺失')
    }

    const nodeId = node.nodeId || node.id
    const mergedNode =
      mergeConstructionNodeAmounts(currentDispatchOrder.value.id, [node])[0] || node
    const res = await ConstructionAPI.getConstructionDetail(
      currentDispatchOrder.value.id,
      nodeId,
    )
    if (res.code === 200) {
      const fallbackAmount = resolveConstructionNodeAmount(mergedNode)
      const detailAmount = resolveConstructionNodeAmount(res.data)
      currentNodeDetail.value = {
        ...res.data,
        amount:
          Number.isFinite(detailAmount) && detailAmount > 0
            ? detailAmount
            : Number.isFinite(fallbackAmount) && fallbackAmount > 0
              ? fallbackAmount
              : detailAmount,
      }
    }
    return res
  }

  const buildEditableNodePricePayload = () =>
    editableConstructionNodes.value.map((node) => {
      const amount = roundCurrencyAmount(
        editableNodePriceMap[node.nodeId] ?? node.amount,
      )
      return {
        nodeId: node.nodeId,
        amount: Number.isFinite(amount) ? amount : 0,
      }
    })

  const calculateNodePriceTotal = (nodePrices = []) => {
    const lockedTotal = (constructionInfo.value?.nodeDetails || []).reduce(
      (sum, node, index) =>
        index < Number(constructionInfo.value?.currentNodeIndex || 0)
          ? sum + Number(node.amount || 0)
          : sum,
      0,
    )

    return lockedTotal + nodePrices.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }

  const submitConstructionPricePlan = async () => {
    if (!currentDispatchOrder.value?.id) {
      throw new Error('订单信息缺失，无法设置节点金额')
    }
    if (isConstructionPriceLocked.value) {
      throw new Error('当前价格配置已确认，节点金额已锁定')
    }
    if (!editableConstructionNodes.value.length) {
      throw new Error('施工节点尚未加载完成，请稍后重试')
    }

    for (const node of editableConstructionNodes.value) {
      const rawAmount = editableNodePriceMap[node.nodeId]
      if (rawAmount === null || rawAmount === undefined || rawAmount === '') {
        throw new Error(`请输入节点“${node.name}”的金额`)
      }

      const amount = Number(rawAmount)
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`节点“${node.name}”金额不能为负数`)
      }
    }

    if (currentEditableNodeDraftAmount.value <= 0) {
      throw new Error('当前进行中的节点金额必须大于 0')
    }

    const nodePrices = buildEditableNodePricePayload()
    const calculatedTotalAmount = roundCurrencyAmount(
      calculateNodePriceTotal(nodePrices),
    )

    if (calculatedTotalAmount > roundCurrencyAmount(priceLimitTotal.value)) {
      throw new Error(
        `节点金额总和不能超过订单总额（当前 ${formatCurrencyAmount(
          calculatedTotalAmount,
        )}，上限 ${formatCurrencyAmount(priceLimitTotal.value)}）`,
      )
    }

    if (calculatedTotalAmount !== roundCurrencyAmount(priceLimitTotal.value)) {
      throw new Error(
        `请先完成全部节点金额分配，当前已分配 ¥${formatCurrencyAmount(
          calculatedTotalAmount,
        )}，还差 ¥${formatCurrencyAmount(priceLimitTotal.value - calculatedTotalAmount)}`,
      )
    }

    savingNodePriceId.value = '__all__'
    try {
      const res = await ConstructionAPI.setConstructionAmount({
        orderId: currentDispatchOrder.value.id,
        nodePrices,
      })
      if (res.code === 200) {
        saveConstructionPricePlanCache(currentDispatchOrder.value.id, nodePrices)

        if (constructionInfo.value?.nodeDetails?.length) {
          const nodePriceMap = nodePrices.reduce((acc, item) => {
            acc[item.nodeId] = resolveConstructionNodeAmount(item)
            return acc
          }, {})

          constructionInfo.value = {
            ...constructionInfo.value,
            nodeDetails: constructionInfo.value.nodeDetails.map((node) => ({
              ...node,
              amount:
                Object.prototype.hasOwnProperty.call(nodePriceMap, node.nodeId)
                  ? nodePriceMap[node.nodeId]
                  : resolveConstructionNodeAmount(node),
            })),
          }
          syncEditableNodePriceMap(constructionInfo.value.nodeDetails || [])
        }

        if (currentNodeDetail.value?.nodeId) {
          const currentNodeAmount = nodePrices.find(
            (item) =>
              Number(item.nodeId) === Number(currentNodeDetail.value?.nodeId),
          )
          if (currentNodeAmount) {
            currentNodeDetail.value = {
              ...currentNodeDetail.value,
              amount: resolveConstructionNodeAmount(currentNodeAmount),
            }
          }
        }
      }
      return res
    } finally {
      savingNodePriceId.value = null
    }
  }

  const submitAudit = async (pass, reason = '') => {
    if (!currentDispatchOrder.value?.id || !currentNodeDetail.value?.nodeId) {
      throw new Error('当前节点信息缺失')
    }

    return ConstructionAPI.audit(
      currentDispatchOrder.value.id,
      currentNodeDetail.value.nodeId,
      pass,
      typeof reason === 'string' ? reason.trim() : '',
    )
  }

  const clearState = () => {
    resetFilters()
    orderList.value = []
    orderContractCache.value = {}
    detailOrder.value = {}
    currentContractUrl.value = ''
    selectionMap.value = {}
    currentDispatchOrder.value = null
    materialDispatchList.value = []
    activeConstructionOrder.value = null
    constructionInfo.value = null
    currentNodeDetail.value = null
    constructionVendorOptions.value = []
    materialVendorOptions.value = []
    redispatchVendorOptions.value = []
    resetOrderAddressForm()
    resetConstructionForm()
    resetMaterialDispatchForm()
    resetRedispatchForm()
    syncEditableNodePriceMap([])
    showAuditRejectModal.value = false
    auditRejectReason.value = ''
    showCancelModal.value = false
    cancelReason.value = ''
    currentCancelId.value = null
  }

  return {
    loadingList,
    loadingMetadata,
    loadingDetail,
    dispatchLoading,
    loadingConstruction,
    loadingVendorOpts,
    submitting,
    redispatchSubmitting,
    redispatchLoading,
    savingNodePriceId,
    pageInfo,
    filters,
    orderList,
    dynamicConfigList,
    detailOrder,
    selectionMap,
    currentContractUrl,
    orderAddressForm,
    selectedOrderRegionCode,
    orderRegionCascaderOptions,
    orderAddressPreview,
    currentDispatchOrder,
    materialDispatchList,
    activeConstructionOrder,
    constructionInfo,
    currentNodeDetail,
    constructionForm,
    constructionVendorOptions,
    currentTarget,
    materialForm,
    materialVendorOptions,
    redispatchVendorOptions,
    redispatchTarget,
    redispatchForm,
    showAuditRejectModal,
    auditRejectReason,
    showCancelModal,
    cancelReason,
    currentCancelId,
    editableNodePriceMap,
    isOptionalProductsLocked,
    canDispatch,
    currentConstructionOrderId,
    isDispatchStageLocked,
    isConstructionPriceLocked,
    activeConstructionNodeId,
    activeConstructionNode,
    currentNodeDetailStatusText,
    priceLimitTotal,
    editableConstructionNodes,
    lockedNodePriceTotal,
    editableNodeDraftTotal,
    constructionAssignedTotal,
    constructionRemainingAmount,
    currentEditableNodeDraftAmount,
    constructionPricePlanDirty,
    constructionPricePlanReady,
    constructionPricePlanStatusText,
    constructionPricePlanHint,
    resolvedCurrentNodeAmount,
    allServicesAccepted,
    handleOrderRegionUpdate,
    resetOrderAddressForm,
    markConstructionPriceLocked,
    resetFilters,
    syncDispatchListItem,
    initMetadata,
    fetchData,
    fetchOrderDetailInternal,
    updateCurrentOrder,
    uploadContract,
    deleteUserOrder,
    resetConstructionForm,
    resetMaterialDispatchForm,
    resetRedispatchForm,
    loadDispatchVendors,
    initDispatchState,
    loadBuilders,
    loadMaterialVendors,
    prepareMaterialDispatch,
    prepareRedispatch,
    createConstructionDispatch,
    createMaterialDispatch,
    prepareCancelVendorOrder,
    cancelCurrentVendorOrder,
    submitRedispatch,
    resetEditableNodePriceDraft,
    applyBalancedNodePricePlan,
    loadConstructionStatus,
    startConstructionProcess,
    handleNodeClick,
    submitConstructionPricePlan,
    submitAudit,
    clearState,
    CONSTRUCTION_NODE_STATUS,
  }
})
