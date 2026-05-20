import { computed, reactive, ref } from 'vue'
import orderAPI from '@/api/user/userOrder.js'
import { normalizeConstructionFlow } from '@/utils/construction'
import {
  normalizeOptionSelectionValue,
  resolvePaymentRecordId,
  isConstructionStagePaymentRecord,
} from '@/views/client/center/user/composables/order/orderHelpers'

export const useUserOrderOptions = ({
  optionCatalogStore,
  currentOrder,
  detailPaymentRecords,
  constructionInfo,
  getStoredUserId,
  fetchOrders,
  message,
  syncCurrentOrderFromServer,
  loadPendingPaymentBills,
  loadDetailPaymentRecords,
  openPendingBillPaymentModal,
  detailTab,
}) => {
  const userOptionConfigLoading = ref(false)
  const userOptionConfigList = ref([])
  const userOptionSelectionMap = reactive({})
  const userOptionInitialSelectionSignature = ref('')
  const userOptionSubmitting = ref(false)
  const userOptionalChangeLoading = ref(false)
  const userOptionalChangeRecords = ref([])
  const optionalChangeCancellableStatusSet = new Set([
    'PENDING',
    'APPROVED',
    'AUTO_APPROVED',
    'REJECTED',
    'PAYMENT_PENDING',
  ])

  const getOptionalCategoryLabel = (categoryId) => {
    const normalizedCategoryId = Number(categoryId)
    const config = userOptionConfigList.value.find(
      (item) => Number(item.categoryId) === normalizedCategoryId,
    )
    if (config?.label) return config.label

    const storeConfig = (optionCatalogStore.userCategoryConfigs || []).find(
      (item) => Number(item?.id) === normalizedCategoryId,
    )
    return storeConfig?.name || `分类${normalizedCategoryId || '--'}`
  }

  const normalizeOptionSnapshotItem = (item = {}) => {
    const categoryId = Number(
      item?.categoryId ?? item?.optionalCategoryId ?? item?.category?.id ?? 0,
    )
    const optionId = normalizeOptionSelectionValue(
      item?.optionalProductId ?? item?.id ?? item?.productId ?? item?.value,
    )
    const categoryName =
      item?.categoryName || item?.categoryLabel || getOptionalCategoryLabel(categoryId)

    return {
      categoryId,
      categoryName,
      optionalProductId: optionId,
      name: item?.name || item?.optionalProductName || item?.label || '',
      price: item?.price,
    }
  }

  const resolveLatestRecordSnapshot = (field) => {
    const snapshot = latestUserOptionalChangeRecord.value?.[field]
    if (!Array.isArray(snapshot)) return []
    return snapshot.map((item) => normalizeOptionSnapshotItem(item))
  }

  const buildCurrentOrderOptionSnapshot = () => {
    const rows = currentOrder.value?.house?.houseOptionalProducts || []
    return rows.map((item) => normalizeOptionSnapshotItem(item))
  }

  const currentEffectiveOptionSnapshot = computed(() => {
    return buildCurrentOrderOptionSnapshot()
  })

  const pendingTargetOptionSnapshot = computed(() => {
    const latestRows = resolveLatestRecordSnapshot('pendingTargetOptions')
    if (latestRows.length > 0) return latestRows

    const latestRecord = latestUserOptionalChangeRecord.value
    const status = String(latestRecord?.status || '').trim()
    if (!isPendingOptionalChangeStatus(status)) return []
    return resolveLatestRecordSnapshot('targetOptionsSnapshot')
  })

  const hasPendingUserOptionalChange = computed(() => {
    const latestRecord = latestUserOptionalChangeRecord.value
    if (!latestRecord) return false

    if (latestRecord?.hasPendingOptionChange === true) return true
    return isPendingOptionalChangeStatus(latestRecord?.status)
  })

  const buildCurrentOptionalSelectionMap = () => {
    const result = new Map()
    const existingProducts = currentEffectiveOptionSnapshot.value
    existingProducts.forEach((item) => {
      const categoryId = Number(item?.categoryId)
      const optionId = normalizeOptionSelectionValue(
        item?.optionalProductId ?? item?.id,
      )
      if (categoryId > 0 && optionId) {
        result.set(categoryId, optionId)
      }
    })
    return result
  }

  const buildTargetOptionalSelectionMap = () => {
    const result = new Map()
    userOptionConfigList.value.forEach((config) => {
      const optionId = normalizeOptionSelectionValue(
        userOptionSelectionMap[config.key],
      )
      if (optionId) {
        result.set(Number(config.categoryId), optionId)
      }
    })
    return result
  }

  const buildTargetOptionalProductIds = () =>
    userOptionConfigList.value
      .map((config) =>
        normalizeOptionSelectionValue(userOptionSelectionMap[config.key]),
      )
      .filter(Boolean)

  const classifyUserOptionSelectionChange = () => {
    const currentSelectionMap = buildCurrentOptionalSelectionMap()
    const targetSelectionMap = buildTargetOptionalSelectionMap()
    let hasAdd = false
    let hasReplace = false
    let hasRemove = false

    targetSelectionMap.forEach((targetId, categoryId) => {
      const currentId = currentSelectionMap.get(categoryId)
      if (!currentId) {
        hasAdd = true
        return
      }
      if (currentId !== targetId) {
        hasReplace = true
      }
    })

    currentSelectionMap.forEach((_, categoryId) => {
      if (!targetSelectionMap.has(categoryId)) {
        hasRemove = true
      }
    })

    const typeCount = Number(hasAdd) + Number(hasReplace) + Number(hasRemove)

    if (typeCount > 1) return 'MIXED'
    if (hasReplace) return 'REPLACE'
    if (hasRemove) return 'REMOVE'
    if (hasAdd) return 'ADD_ONLY'
    return 'UNCHANGED'
  }

  const resetUserOptionSelectionMap = () => {
    Object.keys(userOptionSelectionMap).forEach((key) => {
      delete userOptionSelectionMap[key]
    })
  }

  const buildUserOptionSelectionSignature = () =>
    JSON.stringify(
      userOptionConfigList.value.map((config) => [
        config.key,
        normalizeOptionSelectionValue(userOptionSelectionMap[config.key]),
      ]),
    )

  const buildUserOptionConfigList = (configs = []) =>
    configs.map((category) => ({
      label: category.name,
      key: `cat_${category.id}`,
      categoryId: Number(category.id),
      options: (category.options || []).map((opt) => ({
        label: opt.name || opt.label || `产品${opt.value ?? ''}`,
        value: normalizeOptionSelectionValue(opt.value),
      })),
    }))

  const loadUserOptionConfigList = async () => {
    if (userOptionConfigList.value.length > 0) {
      return userOptionConfigList.value
    }

    userOptionConfigLoading.value = true
    try {
      const res = await optionCatalogStore.fetchUserCategoryConfigs()
      if (res?.code === 200 && Array.isArray(res.data)) {
        userOptionConfigList.value = buildUserOptionConfigList(res.data)
      }
      return userOptionConfigList.value
    } catch (error) {
      void error
      return []
    } finally {
      userOptionConfigLoading.value = false
    }
  }

  const hydrateUserOptionSelection = () => {
    resetUserOptionSelectionMap()
    const existingProducts = hasPendingUserOptionalChange.value
      ? pendingTargetOptionSnapshot.value
      : currentEffectiveOptionSnapshot.value
    const baseConfigList =
      Array.isArray(optionCatalogStore.userCategoryConfigs) &&
      optionCatalogStore.userCategoryConfigs.length > 0
        ? buildUserOptionConfigList(optionCatalogStore.userCategoryConfigs)
        : buildUserOptionConfigList(userOptionConfigList.value)

    userOptionConfigList.value = baseConfigList.map((config) => {
      const found = existingProducts.find(
        (item) => Number(item?.categoryId) === Number(config.categoryId),
      )
      const options = [...config.options]
      const optionValue = normalizeOptionSelectionValue(
        found?.optionalProductId ?? found?.id,
      )

      if (
        found &&
        optionValue &&
        !options.some((item) => Number(item.value) === optionValue)
      ) {
        options.push({
          label: found.name || `未知产品(ID:${optionValue})`,
          value: optionValue,
        })
      }

      userOptionSelectionMap[config.key] = optionValue
      return {
        ...config,
        options,
      }
    })

    userOptionInitialSelectionSignature.value =
      buildUserOptionSelectionSignature()
  }

  const getSelectedUserOptionRows = () =>
    userOptionConfigList.value
      .map((config) => {
        const selectedValue = normalizeOptionSelectionValue(
          userOptionSelectionMap[config.key],
        )
        if (!selectedValue) return null
        const option = config.options.find(
          (item) => Number(item.value) === selectedValue,
        )
        return option
          ? `${config.label}：${option.label}`
          : `${config.label}：产品ID ${selectedValue}`
      })
      .filter(Boolean)

  const formatOptionalChangeSnapshot = (snapshot = []) => {
    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      return '无'
    }
    return snapshot
      .map((item) => {
        const normalizedItem = normalizeOptionSnapshotItem(item)
        const categoryLabel =
          normalizedItem.categoryName ||
          getOptionalCategoryLabel(normalizedItem.categoryId)
        const name = item?.name || `产品${item?.id || '--'}`
        return `${categoryLabel}：${name}`
      })
      .join('；')
  }

  const userOptionChangeTypeLabelMap = {
    ADD_ONLY: '纯追加',
    REMOVE: '减少',
    REPLACE: '替换',
    MIXED: '混合调整',
    UNCHANGED: '未变更',
  }

  const sortOptionalChangeRecords = (records = []) =>
    [...records].sort((a, b) => {
      const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
      const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })

  const loadUserOptionalChangeRecords = async (
    orderId = currentOrder.value?.id,
  ) => {
    const userId = getStoredUserId()
    if (!orderId || !userId) {
      userOptionalChangeRecords.value = []
      return []
    }

    userOptionalChangeLoading.value = true
    try {
      const res = await orderAPI.getOptionalChangeList(orderId, userId)
      if (res?.code === 200 && Array.isArray(res.data)) {
        userOptionalChangeRecords.value = res.data
        return userOptionalChangeRecords.value
      }
      userOptionalChangeRecords.value = []
      return []
    } catch (error) {
      void error
      userOptionalChangeRecords.value = []
      return []
    } finally {
      userOptionalChangeLoading.value = false
    }
  }

  const sortedUserOptionalChangeRecords = computed(() =>
    sortOptionalChangeRecords(userOptionalChangeRecords.value),
  )
  const latestUserOptionalChangeRecord = computed(
    () => sortedUserOptionalChangeRecords.value[0] || null,
  )

  function isPendingOptionalChangeStatus(status) {
    return ['PENDING', 'AUTO_APPROVED', 'PAYMENT_PENDING', 'REFUND_PENDING'].includes(
      String(status || '').trim(),
    )
  }

  const hasCurrentOrderConstructionStarted = computed(
    () =>
      Boolean(constructionInfo.value?.nodeDetails?.length) ||
      Boolean(
        normalizeConstructionFlow(currentOrder.value?.constructionFlow || null)
          ?.nodeDetails?.length,
      ),
  )

  const hasPaidConstructionStagePaymentRecord = computed(() =>
    detailPaymentRecords.value.some((record) =>
      isConstructionStagePaymentRecord(record),
    ),
  )

  const canAdjustUserOptions = computed(() => {
    const orderId = Number(currentOrder.value?.id || 0)
    if (!(orderId > 0)) return false

    const orderStatus = Number(currentOrder.value?.orderStatus ?? -1)
    if (!(orderStatus >= 0 && orderStatus < 4)) return false

    return !hasPendingUserOptionalChange.value
  })

  const userOptionAdjustmentHintText = computed(() => {
    if (!currentOrder.value?.id) {
      return '请先打开订单详情后查看当前选配。'
    }

    const orderStatus = Number(currentOrder.value?.orderStatus ?? -1)
    if (orderStatus >= 4) {
      return '当前订单已完结或已取消，选配内容仅支持查看，不可再提交变更。'
    }

    const latestRecord = latestUserOptionalChangeRecord.value
    const latestStatus = String(latestRecord?.status || '').trim()
    if (['PENDING'].includes(latestStatus)) {
      return '当前订单已有待审核的选配变更申请。审核完成或取消申请前，不能再次提交新的选配变更。'
    }
    if (['AUTO_APPROVED', 'PAYMENT_PENDING'].includes(latestStatus)) {
      return '当前订单已有未完成的选配变更，请先完成补价或取消变更后再继续修改。'
    }
    if (latestStatus === 'REFUND_PENDING') {
      return '当前订单已有退款中的选配变更，请等待退款完成后再继续修改。'
    }

    if (!hasCurrentOrderConstructionStarted.value) {
      return '当前订单尚未开启施工。纯追加会直接生效并重算总价与节点金额；减少、替换或混合调整会提交后台审核。'
    }

    if (!hasPaidConstructionStagePaymentRecord.value) {
      return '当前订单已开启施工，但尚未支付任何施工节点款。纯追加会直接生效并重算总价，不生成选配补价账单；减少、替换或混合调整会提交后台审核。'
    }

    return '当前订单已存在已支付施工节点款。纯追加会先生成选配补价账单，支付成功后目标选配才正式生效；减少、替换或混合调整会提交后台审核，审核后按净差价进入补价、退款或直接生效。'
  })

  const hasUserOptionSelectionChanges = computed(
    () =>
      userOptionConfigList.value.length > 0 &&
      buildUserOptionSelectionSignature() !==
        userOptionInitialSelectionSignature.value,
  )

  const userOptionChangeType = computed(() =>
    hasUserOptionSelectionChanges.value
      ? classifyUserOptionSelectionChange()
      : 'UNCHANGED',
  )

  const userOptionChangeTypeLabel = computed(
    () => userOptionChangeTypeLabelMap[userOptionChangeType.value] || '未变更',
  )

  const userOptionChangeSummaryText = computed(() => {
    const selectedRows = getSelectedUserOptionRows()
    return selectedRows.length > 0 ? selectedRows.join('；') : '未选择任何选配'
  })

  const getUserOptionalChangeStatusTagType = (status) => {
    switch (status) {
      case 'PAID':
      case 'APPROVED':
      case 'REFUNDED':
        return 'success'
      case 'AUTO_APPROVED':
      case 'PAYMENT_PENDING':
      case 'REFUND_PENDING':
        return 'warning'
      case 'REJECTED':
      case 'CANCELLED':
        return 'error'
      default:
        return 'info'
    }
  }

  const findPendingPaymentBillById = (pendingPaymentBills, billId) => {
    const normalizedBillId = Number(billId || 0)
    if (!(normalizedBillId > 0)) return null

    return (
      pendingPaymentBills.value.find(
        (item) => Number(item?.id || 0) === normalizedBillId,
      ) || null
    )
  }

  const shouldShowOptionalChangePendingBillTag = (pendingPaymentBills, record) => {
    if (!record) return false
    const changeStatus = String(record?.status || '').trim()
    if (changeStatus !== 'PAYMENT_PENDING') return false

    const linkedBillStatus = String(record?.linkedBillStatus || '').trim()
    if (linkedBillStatus && !['PENDING', 'PAYING'].includes(linkedBillStatus)) {
      return false
    }

    const pendingBill = findPendingPaymentBillById(
      pendingPaymentBills,
      record?.linkedBillId,
    )
    if (!pendingBill) return false

    const pendingBillStatus = String(pendingBill?.status || '').trim()
    return !pendingBillStatus || ['PENDING', 'PAYING'].includes(pendingBillStatus)
  }

  const latestPendingOptionalChangeBill = computed(() => null)

  const resolveOptionalChangePaymentRecordId = (record) => {
    const candidates = [
      record?.paymentRecordId,
      record?.linkedPaymentRecordId,
      record?.refundDetail?.paymentRecordId,
    ]

    for (const candidate of candidates) {
      const resolvedId = Number(candidate || 0)
      if (resolvedId > 0) {
        return resolvedId
      }
    }

    return null
  }

  const resolveOptionalChangeRefundRecordId = (record) => {
    const candidates = [
      record?.linkedRefundRecordId,
      record?.refundRecordId,
      record?.refundId,
      record?.refundDetail?.id,
      record?.refundDetail?.refundId,
    ]

    for (const candidate of candidates) {
      const resolvedId = Number(candidate || 0)
      if (resolvedId > 0) return resolvedId
    }

    return null
  }

  const resolveOptionalChangeRefundPaymentRecord = (record) => {
    if (!record) return null

    const linkedPaymentRecordId = resolveOptionalChangePaymentRecordId(record)
    if (linkedPaymentRecordId) {
      return (
        detailPaymentRecords.value.find(
          (item) => resolvePaymentRecordId(item) === linkedPaymentRecordId,
        ) || {
          id: linkedPaymentRecordId,
          paymentRecordId: linkedPaymentRecordId,
          orderId: currentOrder.value?.id || record?.orderId || null,
        }
      )
    }

    const linkedRefundRecordId = resolveOptionalChangeRefundRecordId(record)
    if (linkedRefundRecordId) {
      return (
        detailPaymentRecords.value.find(
          (item) =>
            Number(item?.refundDetail?.id || item?.refundDetail?.refundId || item?.refundId || 0) ===
            linkedRefundRecordId,
        ) || null
      )
    }

    return null
  }

  const isOptionalChangeRefundRelated = (record) => {
    const status = String(record?.status || '').trim()
    return (
      ['REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED'].includes(status) ||
      Boolean(resolveOptionalChangePaymentRecordId(record)) ||
      Boolean(resolveOptionalChangeRefundRecordId(record)) ||
      Boolean(record?.linkedRefundStatusLabel)
    )
  }

  const visibleUserOptionalChangeRecords = computed(() =>
    sortedUserOptionalChangeRecords.value.map((record, index) => {
      const refundPaymentRecord = resolveOptionalChangeRefundPaymentRecord(record)
      const hasRefundDetail = isOptionalChangeRefundRelated(record) &&
        (
          Boolean(resolveOptionalChangeRefundRecordId(record)) ||
          Number(refundPaymentRecord?.refundStatus) === 4
        )

      return {
        ...record,
        isLatestRecord: index === 0,
        refundPaymentRecord,
        canViewRefundDetail: hasRefundDetail && Boolean(refundPaymentRecord),
        refundPaymentRecordMissing:
          isOptionalChangeRefundRelated(record) &&
          !refundPaymentRecord,
      }
    }),
  )

  const latestOptionalChangeNeedsRefundSource = computed(() => {
    const latestRecord = latestUserOptionalChangeRecord.value
    if (!latestRecord) return false

    const status = String(latestRecord?.status || '').trim()

    return (
      ['REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED'].includes(status) ||
      Boolean(resolveOptionalChangePaymentRecordId(latestRecord)) ||
      Boolean(latestRecord?.linkedRefundStatusLabel)
    )
  })

  const getLatestConstructionStagePaymentRecord = (records = []) =>
    [...records]
      .filter((record) => isConstructionStagePaymentRecord(record))
      .sort((a, b) => {
        const timeA = a?.payTime ? new Date(a.payTime).getTime() : 0
        const timeB = b?.payTime ? new Date(b.payTime).getTime() : 0
        if (timeA !== timeB) return timeB - timeA
        return Number(b?.id || 0) - Number(a?.id || 0)
      })[0] || null

  const latestOptionalChangeRefundPaymentRecord = computed(() => {
    if (!latestOptionalChangeNeedsRefundSource.value) {
      return null
    }

    const linkedPaymentRecordId = resolveOptionalChangePaymentRecordId(
      latestUserOptionalChangeRecord.value,
    )

    if (linkedPaymentRecordId) {
      return (
        detailPaymentRecords.value.find(
          (item) => resolvePaymentRecordId(item) === linkedPaymentRecordId,
        ) || getLatestConstructionStagePaymentRecord(detailPaymentRecords.value)
      )
    }

    return getLatestConstructionStagePaymentRecord(detailPaymentRecords.value)
  })

  const latestOptionalChangeRefundPaymentRecordMissing = computed(() => {
    if (!latestOptionalChangeNeedsRefundSource.value) return false
    if (latestOptionalChangeRefundPaymentRecord.value) return false
    return true
  })

  const canCancelLatestOptionalChange = computed(() => {
    const latestRecord = latestUserOptionalChangeRecord.value
    if (!latestRecord?.id) return false

    return optionalChangeCancellableStatusSet.has(
      String(latestRecord?.status || '').trim(),
    )
  })

  const handleUserOptionSelectionUpdate = ({ key, value }) => {
    if (!key) return
    userOptionSelectionMap[key] = value
  }

  const resetUserOptionalChangeRecords = () => {
    userOptionalChangeRecords.value = []
  }

  const resetUserOptionSelectionChanges = () => {
    hydrateUserOptionSelection()
  }

  const cancelLatestOptionalChange = async () => {
    const userId = getStoredUserId()
    const orderId = Number(currentOrder.value?.id || 0)
    const requestId = Number(latestUserOptionalChangeRecord.value?.id || 0)

    if (!userId || !orderId || !requestId) {
      message.error('当前申请信息缺失，请刷新后重试')
      return false
    }

    userOptionSubmitting.value = true
    try {
      const res = await orderAPI.cancelOptionalChange(requestId, userId)
      if (res?.code !== 200) {
        message.error(res?.msg || '取消选配变更失败')
        return false
      }

      await syncCurrentOrderFromServer(orderId)
      await Promise.all([
        loadUserOptionalChangeRecords(orderId),
        loadPendingPaymentBills(orderId),
        loadDetailPaymentRecords(orderId),
      ])
      hydrateUserOptionSelection()
      await fetchOrders()
      message.success('选配变更申请已取消')
      return true
    } catch (error) {
      void error
      message.error('取消选配变更失败')
      return false
    } finally {
      userOptionSubmitting.value = false
    }
  }

  const submitUserOptionSelectionChanges = async (pendingPaymentBills) => {
    if (!canAdjustUserOptions.value) {
      message.warning('订单信息缺失，请刷新后重试')
      return
    }

    if (!hasUserOptionSelectionChanges.value) {
      message.info('当前没有新的选配调整')
      return
    }

    if (hasPendingUserOptionalChange.value) {
      message.warning('当前订单已有未完成的选配变更，请先完成当前流程后再提交')
      return
    }

    const userId = getStoredUserId()
    const orderId = Number(currentOrder.value?.id || 0)
    if (!userId || !orderId) {
      message.error('订单信息缺失，请刷新后重试')
      return
    }

    const changeType = classifyUserOptionSelectionChange()
    const optionalProductIds = buildTargetOptionalProductIds()

    userOptionSubmitting.value = true
    try {
      const res = await orderAPI.updateOrderProducts(userId, {
        id: orderId,
        optionalProductIds,
      })

      if (res?.code !== 200) {
        message.error(res?.msg || '提交选配变更失败')
        return
      }

      await syncCurrentOrderFromServer(orderId)
      await Promise.all([
        loadUserOptionalChangeRecords(orderId),
        loadPendingPaymentBills(orderId),
        loadDetailPaymentRecords(orderId),
      ])
      hydrateUserOptionSelection()
      await fetchOrders()

      const latestRecord = latestUserOptionalChangeRecord.value
      if (shouldShowOptionalChangePendingBillTag(pendingPaymentBills, latestRecord)) {
        detailTab.value = 'bills'
      }

      if (changeType === 'ADD_ONLY') {
        const latestOptionChangeBill = findPendingPaymentBillById(
          pendingPaymentBills,
          latestRecord?.linkedBillId,
        )
        if (latestOptionChangeBill) {
          detailTab.value = 'bills'
          openPendingBillPaymentModal(latestOptionChangeBill)
          message.success('选配已调整，补价账单已生成，请在账单支付中完成付款')
        } else {
          message.success('选配已调整成功')
        }
        return
      }

      message.success('选配变更申请已提交，等待后台审核')
    } catch (error) {
      void error
      message.error('提交选配变更失败')
    } finally {
      userOptionSubmitting.value = false
    }
  }

  return {
    userOptionConfigLoading,
    userOptionConfigList,
    userOptionSelectionMap,
    userOptionSubmitting,
    userOptionalChangeLoading,
    visibleUserOptionalChangeRecords,
    canAdjustUserOptions,
    userOptionAdjustmentHintText,
    hasUserOptionSelectionChanges,
    userOptionChangeTypeLabel,
    userOptionChangeSummaryText,
    currentEffectiveOptionSnapshot,
    pendingTargetOptionSnapshot,
    hasPendingUserOptionalChange,
    canCancelLatestOptionalChange,
    latestOptionalChangeRefundPaymentRecord,
    latestOptionalChangeRefundPaymentRecordMissing,
    latestUserOptionalChangeRecord,
    getUserOptionalChangeStatusTagType,
    formatOptionalChangeSnapshot,
    handleUserOptionSelectionUpdate,
    resetUserOptionalChangeRecords,
    resetUserOptionSelectionChanges,
    loadUserOptionConfigList,
    hydrateUserOptionSelection,
    loadUserOptionalChangeRecords,
    cancelLatestOptionalChange,
    submitUserOptionSelectionChanges,
    shouldShowOptionalChangePendingBillTag,
  }
}
