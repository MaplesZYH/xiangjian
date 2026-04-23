import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import OrderAPI from '@/api/user/detailsOrder'
import CategoryAPI from '@/api/house/categories'
import DispatchAPI from '@/api/service/dispatchOrders'
import ConstructionAPI from '@/api/house/construction'
import {
  CONSTRUCTION_NODE_STATUS,
  getConstructionStageDefinitions,
  getConstructionStageLabel,
  getConstructionStageRatioText,
  getProcessText,
  normalizeConstructionFlow,
} from '@/utils/construction'
import { normalizeOrderPaymentState } from '@/utils/orderPayment'
import { useStructuredAddressForm } from '@/composables/useStructuredAddressForm'

const CONSTRUCTION_PRICE_LOCK_STORAGE_KEY =
  'admin_construction_price_locked_order_ids'
const CONSTRUCTION_PRICE_PLAN_CACHE_STORAGE_KEY =
  'admin_construction_price_plan_cache'
const CONSTRUCTION_DEPOSIT_DRAFT_STORAGE_KEY =
  'admin_construction_deposit_draft_cache'

const vendorServiceTypeMap = {
  1: '建筑商',
  2: '材料商',
  3: '综合服务商',
}

const CONSTRUCTION_STAGE_PAYMENT_RATIO_MAP = {
  2: 0.2,
  3: 0.5,
  4: 0.28,
  5: 0.02,
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

const resolveConstructionBaseAmount = (totalAmount, depositAmount = 0) => {
  const total = roundCurrencyAmount(totalAmount)
  const deposit = roundCurrencyAmount(depositAmount)
  return total > deposit
    ? roundCurrencyAmount(total - deposit)
    : 0
}

const resolveConstructionMilestoneAmount = (
  totalAmount,
  sortOrder,
  depositAmount = 0,
) => {
  const normalizedDepositAmount = roundCurrencyAmount(depositAmount)
  const constructionBaseAmount = resolveConstructionBaseAmount(
    totalAmount,
    normalizedDepositAmount,
  )
  if (Number(sortOrder) === 1) {
    return normalizedDepositAmount
  }

  const ratio = CONSTRUCTION_STAGE_PAYMENT_RATIO_MAP[Number(sortOrder)]
  if (!ratio) return 0

  return roundCurrencyAmount(constructionBaseAmount * ratio)
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

const loadConstructionDepositDraftCache = () => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(
      CONSTRUCTION_DEPOSIT_DRAFT_STORAGE_KEY,
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

const resolveConstructionNodeStatusSummary = ({
  node,
  index,
  currentNodeIndex,
  currentNodeStatus,
}) => {
  if (Number(node?.isPaid) === 1) {
    return {
      text: '已支付',
      type: 'success',
    }
  }

  if (index < Number(currentNodeIndex)) {
    return {
      text: '已完成',
      type: 'default',
    }
  }

  if (index === Number(currentNodeIndex)) {
    if (Number(currentNodeStatus) === CONSTRUCTION_NODE_STATUS.WAIT_PAYMENT) {
      return {
        text: '待支付',
        type: 'warning',
      }
    }

    return {
      text: '进行中',
      type: 'info',
    }
  }

  return {
    text: '待开始',
    type: 'default',
  }
}

const resolveBuildDepositSeedAmount = ({
  pendingPaymentBills = [],
  paymentStatus,
  paidAmount,
  draftAmount = 0,
} = {}) => {
  const pendingDepositBill = Array.isArray(pendingPaymentBills)
    ? pendingPaymentBills.find((item) => item?.billType === 'BUILD_DEPOSIT')
    : null

  const pendingAmount = Number(pendingDepositBill?.amount)
  if (Number.isFinite(pendingAmount) && pendingAmount > 0) {
    return roundCurrencyAmount(pendingAmount)
  }

  const paid = Number(paidAmount)
  if ([1, 2].includes(Number(paymentStatus)) && Number.isFinite(paid) && paid > 0) {
    return roundCurrencyAmount(paid)
  }

  const draft = Number(draftAmount)
  if (Number.isFinite(draft) && draft > 0) {
    return roundCurrencyAmount(draft)
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
  const constructionDepositDraftCache = ref(loadConstructionDepositDraftCache())
  const editableNodePriceMap = reactive({})

  const isAddressLocked = computed(() =>
    hasUploadedContract(detailOrder.value),
  )

  const canDispatch = computed(
    () => !!currentContractUrl.value,
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

  const isConstructionPriceLocked = computed(() => false)

  const assertDispatchAvailable = () => {
    if (!canDispatch.value) {
      throw new Error('请先上传合同后再派单')
    }
    if (Number(detailOrder.value?.orderStatus ?? currentDispatchOrder.value?.orderStatus ?? 0) === 5) {
      throw new Error('已取消订单无法继续派单')
    }
  }

  const assertConstructionDispatchEditable = () => {
    assertDispatchAvailable()
    if (isDispatchStageLocked.value) {
      throw new Error('订单已进入施工阶段，施工单位派单已锁定')
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

  const draftDepositCacheAmount = computed(() => {
    const orderId = currentConstructionOrderId.value
    if (!orderId) return 0
    const amount = Number(constructionDepositDraftCache.value?.[orderId])
    return Number.isFinite(amount) ? roundCurrencyAmount(amount) : 0
  })

  const depositNode = computed(() => constructionInfo.value?.nodeDetails?.[0] || null)

  const buildDepositSeedAmount = computed(() =>
    resolveBuildDepositSeedAmount({
      pendingPaymentBills: detailOrder.value?.pendingPaymentBills,
      paymentStatus: detailOrder.value?.paymentStatus,
      paidAmount: detailOrder.value?.paidAmount,
      draftAmount: draftDepositCacheAmount.value,
    }),
  )

  const editableConstructionNodes = computed(() => [])

  const depositDraftAmount = computed(() => {
    if (!constructionInfo.value?.nodeDetails?.length) {
      return buildDepositSeedAmount.value
    }
    const nodeId = depositNode.value?.nodeId
    if (!nodeId) return buildDepositSeedAmount.value
    const amount = Number(editableNodePriceMap[nodeId])
    return Number.isFinite(amount)
      ? roundCurrencyAmount(amount)
      : buildDepositSeedAmount.value
  })

  const stagePaymentAutoTotal = computed(() =>
    roundCurrencyAmount(
      Object.values(CONSTRUCTION_STAGE_PAYMENT_RATIO_MAP).reduce(
        (sum, ratio) =>
          sum +
          resolveConstructionBaseAmount(
            priceLimitTotal.value,
            depositDraftAmount.value,
          ) *
            ratio,
        0,
      ),
    ),
  )

  const constructionBillPlanTotal = computed(() =>
    roundCurrencyAmount(stagePaymentAutoTotal.value),
  )

  const constructionBaseAmount = computed(() =>
    resolveConstructionBaseAmount(priceLimitTotal.value, depositDraftAmount.value),
  )

  const currentEditableNodeDraftAmount = computed(() => {
    return depositDraftAmount.value
  })

  const constructionPricePlanDirty = computed(() => {
    const nodes = constructionInfo.value?.nodeDetails || []
    if (!nodes.length) return false

    return nodes.some((node, index) => {
      const expectedAmount = resolveConstructionMilestoneAmount(
        priceLimitTotal.value,
        index + 1,
        depositDraftAmount.value,
      )
      return resolveConstructionNodeAmount(node) !== expectedAmount
    })
  })

  const constructionPricePlanReady = computed(() => {
    if (!currentConstructionOrderId.value) return false
    if (!constructionInfo.value?.nodeDetails?.length) return false
    if (!depositNode.value) return false
    return buildDepositSeedAmount.value > 0 && !constructionPricePlanDirty.value
  })

  const constructionPricePlanStatusText = computed(() => {
    if (!constructionInfo.value?.nodeDetails?.length) return '待开启施工'
    if (constructionPricePlanReady.value) return '同步方案已就绪'
    if (constructionPricePlanDirty.value) return '待同步'
    return '等待同步'
  })

  const constructionPricePlanHint = computed(() => {
    if (!constructionInfo.value?.nodeDetails?.length) {
      return '请先在第 3 步点击“开启施工”，由后端初始化施工节点后再同步节点金额。'
    }
    if (buildDepositSeedAmount.value <= 0) {
      return '暂未识别到首笔建房定金金额，请先确认订单已完成首笔支付。'
    }
    if (constructionPricePlanDirty.value) {
      return '首节点定金将按当前首笔支付金额作为基准；第 2-5 节点金额会按后端当前规则，基于“订单总价 - 首笔定金”计算 20% / 50% / 28% / 2%。'
    }
    return '当前剩余未支付节点金额已与后端规则对齐。'
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

  const buildDepositPendingBill = computed(() => {
    const rows = Array.isArray(detailOrder.value?.pendingPaymentBills)
      ? detailOrder.value.pendingPaymentBills
      : []
    return rows.find((item) => item?.billType === 'BUILD_DEPOSIT') || null
  })

  const canEditConstructionDeposit = computed(() => {
    if (Number(detailOrder.value?.orderStatus) >= 3) return false
    return Boolean(buildDepositPendingBill.value?.id)
  })

  const hasConstructionNodeInstances = computed(
    () => Array.isArray(constructionInfo.value?.nodeDetails) && constructionInfo.value.nodeDetails.length > 0,
  )

  const constructionPricingProcessText = computed(() =>
    getProcessText(
      detailOrder.value?.processType,
      constructionInfo.value?.processName,
      detailOrder.value?.structureInfo?.constructionMethod,
    ),
  )

  const constructionPricingStageRows = computed(() => {
    if (hasConstructionNodeInstances.value) {
      const currentIndex = Number(constructionInfo.value?.currentNodeIndex || 0)
      const currentStatus = Number(constructionInfo.value?.currentNodeStatus || 0)
      return (constructionInfo.value?.nodeDetails || []).map((node, index) => {
        const targetAmount = resolveConstructionMilestoneAmount(
          priceLimitTotal.value,
          index + 1,
          depositDraftAmount.value,
        )
        const nodeAmount = resolveConstructionNodeAmount(
          node,
          targetAmount,
        )
        const statusSummary = resolveConstructionNodeStatusSummary({
          node,
          index,
          currentNodeIndex: currentIndex,
          currentNodeStatus: currentStatus,
        })

        return {
          key: Number(node?.nodeId || node?.id || index),
          nodeId: Number(node?.nodeId || node?.id || 0),
          sortOrder: Number(node?.sortOrder || index + 1),
          stageLabel: getConstructionStageLabel(index + 1),
          nodeName: node?.name || node?.nodeName || `节点${index + 1}`,
          ratioText: getConstructionStageRatioText(index + 1),
          amount: nodeAmount,
          targetAmount,
          isPaid: Number(node?.isPaid) === 1,
          statusText: node?.statusText || statusSummary.text,
          statusType: statusSummary.type,
          subSteps: Array.isArray(node?.subSteps) ? node.subSteps : [],
        }
      })
    }

    return getConstructionStageDefinitions(
      detailOrder.value?.processType,
      constructionInfo.value?.processName,
      detailOrder.value?.structureInfo?.constructionMethod,
    ).map((item) => ({
      key: item.sortOrder,
      nodeId: 0,
      sortOrder: item.sortOrder,
      stageLabel: item.stageLabel,
      nodeName: item.nodeName,
      ratioText: item.ratioText,
      amount: resolveConstructionMilestoneAmount(
        priceLimitTotal.value,
        item.sortOrder,
        depositDraftAmount.value,
      ),
      targetAmount: resolveConstructionMilestoneAmount(
        priceLimitTotal.value,
        item.sortOrder,
        depositDraftAmount.value,
      ),
      isPaid: false,
      statusText: '待确认',
      statusType: 'default',
    }))
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

  const persistConstructionDepositDraftCache = () => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      CONSTRUCTION_DEPOSIT_DRAFT_STORAGE_KEY,
      JSON.stringify(constructionDepositDraftCache.value),
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

  const saveConstructionDepositDraftCache = (orderId, amount) => {
    const numericOrderId = Number(orderId)
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) return

    constructionDepositDraftCache.value = {
      ...constructionDepositDraftCache.value,
      [numericOrderId]: roundCurrencyAmount(amount),
    }
    persistConstructionDepositDraftCache()
  }

  const setConstructionDepositDraft = (amount) => {
    const normalizedAmount = roundCurrencyAmount(amount)
    const orderId = currentConstructionOrderId.value
    if (!orderId) return

    saveConstructionDepositDraftCache(orderId, normalizedAmount)

    const nodeId = Number(depositNode.value?.nodeId || 0)
    if (nodeId > 0) {
      editableNodePriceMap[nodeId] = normalizedAmount
    }
  }

  const mergeConstructionNodeAmounts = (orderId, nodes = []) => {
    return nodes.map((node) => {
      const resolvedAmount = resolveConstructionNodeAmount(node)

      return {
        ...node,
        amount: resolvedAmount,
      }
    })
  }

  const markConstructionPriceLocked = () => {}

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

        pageInfo.count = Number(res.data.total || 0)
        pageInfo.pageCount = Math.ceil(pageInfo.count / pageInfo.pageSize)

        const pendingContractStateOrderIds = orderList.value
          .filter((item) => {
            const orderStatus = Number(item?.orderStatus)
            return orderStatus === 0 && !item?.contractLoaded
          })
          .map((item) => item.id)

        if (pendingContractStateOrderIds.length > 0) {
          const detailResults = await Promise.allSettled(
            pendingContractStateOrderIds.map((id) => OrderAPI.getUserOrderDetail(id)),
          )

          const nextContractCache = {
            ...orderContractCache.value,
          }
          const contractStateMap = new Map()

          detailResults.forEach((result, index) => {
            if (result.status !== 'fulfilled') return
            if (result.value?.code !== 200) return

            const orderId = pendingContractStateOrderIds[index]
            const contractState = {
              orderContract: result.value.data?.orderContract || null,
              contractLoaded: true,
            }

            nextContractCache[orderId] = contractState
            contractStateMap.set(orderId, contractState)
          })

          orderContractCache.value = nextContractCache

          if (contractStateMap.size > 0) {
            orderList.value = orderList.value.map((item) =>
              contractStateMap.has(item.id)
                ? {
                    ...item,
                    ...contractStateMap.get(item.id),
                  }
                : item,
            )
          }
        }
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
    assertDispatchAvailable()
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
    assertDispatchAvailable()
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
    assertConstructionDispatchEditable()
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
    assertDispatchAvailable()
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
    assertDispatchAvailable()
    if (!cancelReason.value) {
      throw new Error('请输入取消理由')
    }
    return DispatchAPI.cancelVendorOrder(
      currentCancelId.value,
      cancelReason.value,
    )
  }

  const submitRedispatch = async () => {
    assertDispatchAvailable()
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

    const depositAmount = buildDepositSeedAmount.value
    nodes.forEach((node) => {
      const nodeId = Number(node?.nodeId || node?.id)
      if (!Number.isInteger(nodeId) || nodeId <= 0) return

      const index = nodes.findIndex(
        (item) => Number(item?.nodeId || item?.id) === nodeId,
      )
      const resolvedAmount = resolveConstructionNodeAmount(node)
      editableNodePriceMap[nodeId] =
        index === 0
          ? depositAmount
          : resolvedAmount > 0
            ? resolvedAmount
            : resolveConstructionMilestoneAmount(
                priceLimitTotal.value,
                index + 1,
                depositAmount,
              )
    })
  }

  const resetEditableNodePriceDraft = () => {
    if (!constructionInfo.value?.nodeDetails?.length) return
    syncEditableNodePriceMap(constructionInfo.value?.nodeDetails || [])
  }

  const applyBalancedNodePricePlan = () => {
    resetEditableNodePriceDraft()
    return {
      code: 200,
      msg: '已恢复为当前后端节点金额同步结果',
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
        const nextFlow = {
          ...normalizedFlow,
          nodeDetails: normalizedFlow.nodeDetails || [],
        }

        constructionInfo.value = nextFlow
        syncEditableNodePriceMap(nextFlow.nodeDetails || [])
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
    const res = await ConstructionAPI.getConstructionDetail(
      currentDispatchOrder.value.id,
      nodeId,
    )
    if (res.code === 200) {
      const fallbackAmount = resolveConstructionNodeAmount(node)
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

  const buildEditableNodePricePayload = () => {
    const nodes = constructionInfo.value?.nodeDetails || []
    const depositAmount = depositDraftAmount.value

    return nodes.map((node, index) => ({
      nodeId: node.nodeId,
      // 后端 /construction/admin/price 当前语义是：
      // 仅以首节点传入的定金为同步种子，后续节点金额由后端按 20/50/28/2 自动落值。
      amount: index === 0 ? depositAmount : 0,
    }))
  }

  const submitConstructionPricePlan = async () => {
    if (!currentDispatchOrder.value?.id) {
      throw new Error('订单信息缺失，无法同步节点金额')
    }
    const rawAmount =
      constructionInfo.value?.nodeDetails?.length && depositNode.value?.nodeId
        ? editableNodePriceMap[depositNode.value.nodeId]
        : buildDepositSeedAmount.value

    const amount = Number(rawAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('未识别到有效的首笔建房定金金额')
    }

    if (!constructionInfo.value?.nodeDetails?.length) {
      throw new Error('请先开启施工，由后端初始化施工节点后再同步节点金额')
    }

    const nodePrices = buildEditableNodePricePayload()

    savingNodePriceId.value = '__all__'
    try {
      const res = await ConstructionAPI.setConstructionAmount({
        orderId: currentDispatchOrder.value.id,
        nodePrices,
      })
      return res
    } finally {
      savingNodePriceId.value = null
    }
  }

  const submitConstructionDepositAmount = async (amount) => {
    if (!currentDispatchOrder.value?.id) {
      throw new Error('订单信息缺失，无法修改定金')
    }

    const normalizedAmount = Number(amount)
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error('请输入有效的定金金额')
    }

    const res = await ConstructionAPI.updateDepositAmount({
      orderId: currentDispatchOrder.value.id,
      depositAmount: normalizedAmount,
    })

    if (res.code === 200) {
      setConstructionDepositDraft(normalizedAmount)
    }

    return res
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
    isAddressLocked,
    canDispatch,
    currentConstructionOrderId,
    isDispatchStageLocked,
    isConstructionPriceLocked,
    activeConstructionNodeId,
    activeConstructionNode,
    currentNodeDetailStatusText,
    priceLimitTotal,
    depositNode,
    editableConstructionNodes,
    depositDraftAmount,
    stagePaymentAutoTotal,
    constructionBillPlanTotal,
    constructionBaseAmount,
    currentEditableNodeDraftAmount,
    constructionPricePlanDirty,
    constructionPricePlanReady,
    constructionPricePlanStatusText,
    constructionPricePlanHint,
    resolvedCurrentNodeAmount,
    allServicesAccepted,
    canEditConstructionDeposit,
    hasConstructionNodeInstances,
    constructionPricingProcessText,
    constructionPricingStageRows,
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
    submitConstructionDepositAmount,
    setConstructionDepositDraft,
    submitAudit,
    clearState,
    CONSTRUCTION_NODE_STATUS,
  }
})
