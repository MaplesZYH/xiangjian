import { computed, reactive, ref, watch } from 'vue'
import adminOrderAPI from '@/api/user/detailsOrder'
import paymentAPI from '@/api/user/userOrder'

export const useManageDetailOrderOptionalChange = ({
  detailOrder,
  currentDispatchOrder,
  canViewPaymentRecordList,
  orderManageStore,
  operatorName,
  message,
  formatCurrencyAmount,
  formatDateTime,
  getErrorMessage,
  loadConstructionStatus,
}) => {
  const optionalChangeLoading = ref(false)
  const optionalChangeSubmitting = ref(false)
  const optionalChangeRecords = ref([])
  const showOptionalChangeAuditModal = ref(false)
  const currentOptionalChangeAuditRecord = ref(null)
  const optionalChangePaymentRecordLoading = ref(false)
  const optionalChangePaymentRecords = ref([])
  const optionalChangePaymentRecordOptions = ref([])
  const optionalChangeAuditForm = reactive({
    approved: true,
    mode: 'direct',
    finalChargeAmount: null,
    finalRefundAmount: null,
    paymentRecordId: null,
  })

  const OPTIONAL_CHANGE_AUDIT_MODE_LABEL_MAP = {
    direct: '直接通过',
    charge: '生成补价账单',
    refund: '发起退款',
  }

  const sortOptionalChangeRecords = (records = []) =>
    [...records].sort((a, b) => {
      const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
      const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })

  const sortPaymentRecords = (records = []) =>
    [...records].sort((a, b) => {
      const timeA = a?.payTime ? new Date(a.payTime).getTime() : 0
      const timeB = b?.payTime ? new Date(b.payTime).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })

  const isConstructionStagePaymentRecord = (record) => {
    const stage = String(record?.paymentStage || '').trim()
    if (!stage) return false
    return stage.includes('施工进度款') || stage === 'NODE'
  }

  const formatPaymentRecordOptionLabel = (record) =>
    `#${record?.id || '--'} | ${record?.paymentStage || '--'} | ¥${formatCurrencyAmount(record?.amount)} | ${formatDateTime(record?.payTime)}`

  const resolveOptionalChangePaymentRecordId = (record) => {
    const candidates = [
      record?.paymentRecordId,
      record?.linkedPaymentRecordId,
      record?.refundDetail?.paymentRecordId,
    ]

    for (const candidate of candidates) {
      const resolvedId = Number(candidate || 0)
      if (resolvedId > 0) return resolvedId
    }

    return null
  }

  const resolveAutoPaymentRecord = (
    record = currentOptionalChangeAuditRecord.value,
    paymentRecords = optionalChangePaymentRecords.value,
  ) => {
    void record
    const rows = sortPaymentRecords(paymentRecords)
    if (!rows.length) return null

    return rows.find((item) => isConstructionStagePaymentRecord(item)) || null
  }

  const visibleOptionalChangeRecords = computed(() => {
    if (!optionalChangeRecords.value.length) return []
    return sortOptionalChangeRecords(optionalChangeRecords.value).slice(0, 1)
  })

  const getOptionalChangeStatusTagType = (status) => {
    switch (status) {
      case 'PAID':
      case 'APPROVED':
      case 'AUTO_APPROVED':
      case 'REFUNDED':
        return 'success'
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

  const formatAdminOptionalChangeSnapshot = (snapshot = []) => {
    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      return '无'
    }

    return snapshot
      .map((item) => {
        const categoryLabel =
          item?.categoryName || item?.categoryLabel || `分类${item?.categoryId || '--'}`
        const name = item?.name || `产品${item?.id || '--'}`
        return `${categoryLabel}：${name}`
      })
      .join('；')
  }

  const resolveOptionalChangeAllowedModes = (record) => {
    const diff = Number(record?.theoreticalDiffAmount || 0)
    const changeType = String(record?.changeType || '').trim()

    if (changeType === 'ADD_ONLY') {
      return diff > 0 ? ['charge'] : ['direct']
    }

    if (changeType === 'REMOVE') {
      return diff < 0 ? ['refund'] : ['direct']
    }

    if (['REPLACE', 'MIXED'].includes(changeType)) {
      if (diff > 0) return ['charge']
      if (diff < 0) return ['refund']
      return ['direct']
    }

    if (diff > 0) return ['charge']
    if (diff < 0) return ['refund']
    return ['direct']
  }

  const currentOptionalChangeAllowedModes = computed(() =>
    resolveOptionalChangeAllowedModes(currentOptionalChangeAuditRecord.value),
  )

  const currentOptionalChangeAuditModeOptions = computed(() =>
    currentOptionalChangeAllowedModes.value.map((value) => ({
      value,
      label: OPTIONAL_CHANGE_AUDIT_MODE_LABEL_MAP[value] || value,
    })),
  )

  const currentOptionalChangeAuditModeHint = computed(() => {
    const changeTypeLabel =
      currentOptionalChangeAuditRecord.value?.changeTypeLabel || '当前变更'
    const firstMode = currentOptionalChangeAuditModeOptions.value[0]
    if (!firstMode) return `${changeTypeLabel}仅支持审核驳回。`
    return `${changeTypeLabel}仅支持“${firstMode.label}”处理，已限制错误操作。`
  })

  const resolveOptionalChangeAuditMode = (record) =>
    resolveOptionalChangeAllowedModes(record)[0] || 'direct'

  const resolvedOptionalChangePaymentRecord = computed(() =>
    resolveAutoPaymentRecord(),
  )

  const resolvedOptionalChangePaymentRecordText = computed(() => {
    if (optionalChangePaymentRecordLoading.value) {
      return '系统正在识别最近一次已支付节点进度款...'
    }

    if (!resolvedOptionalChangePaymentRecord.value) return ''
    return formatPaymentRecordOptionLabel(resolvedOptionalChangePaymentRecord.value)
  })

  const resolvedOptionalChangePaymentRecordMissing = computed(() => {
    if (!showOptionalChangeAuditModal.value) return false
    if (optionalChangeAuditForm.mode !== 'refund') return false
    if (optionalChangePaymentRecordLoading.value) return false
    return !resolvedOptionalChangePaymentRecord.value
  })

  const resetOptionalChangeAuditForm = () => {
    optionalChangeAuditForm.approved = true
    optionalChangeAuditForm.mode = 'direct'
    optionalChangeAuditForm.finalChargeAmount = null
    optionalChangeAuditForm.finalRefundAmount = null
    optionalChangeAuditForm.paymentRecordId = null
  }

  const syncResolvedOptionalChangePaymentRecord = (
    record = currentOptionalChangeAuditRecord.value,
  ) => {
    const resolvedRecord = resolveAutoPaymentRecord(
      record,
      optionalChangePaymentRecords.value,
    )
    optionalChangeAuditForm.paymentRecordId = Number(resolvedRecord?.id || 0) || null
    return resolvedRecord
  }

  const loadAdminOptionalChangeList = async (
    orderId = currentDispatchOrder.value?.id || detailOrder.value?.id,
  ) => {
    if (!orderId) {
      optionalChangeRecords.value = []
      return []
    }

    optionalChangeLoading.value = true
    try {
      const res = await adminOrderAPI.getAdminOptionalChangeList(orderId)
      if (res?.code === 200 && Array.isArray(res.data)) {
        optionalChangeRecords.value = res.data
        return optionalChangeRecords.value
      }
      optionalChangeRecords.value = []
      return []
    } catch (error) {
      console.error(error)
      optionalChangeRecords.value = []
      return []
    } finally {
      optionalChangeLoading.value = false
    }
  }

  const loadOptionalChangePaymentRecordOptions = async (
    orderId = currentDispatchOrder.value?.id || detailOrder.value?.id,
  ) => {
    if (!orderId || !canViewPaymentRecordList.value) {
      optionalChangePaymentRecords.value = []
      optionalChangePaymentRecordOptions.value = []
      return []
    }

    optionalChangePaymentRecordLoading.value = true
    try {
      const res = await paymentAPI.getPaymentRecordList({
        page: 1,
        pageSize: 100,
        orderId,
      })
      if (res?.code !== 200 || !res.data) {
        optionalChangePaymentRecords.value = []
        optionalChangePaymentRecordOptions.value = []
        return []
      }

      const rows = sortPaymentRecords(res.data.rows || res.data.records || [])
      optionalChangePaymentRecords.value = rows
      optionalChangePaymentRecordOptions.value = rows.map((item) => ({
        label: formatPaymentRecordOptionLabel(item),
        value: Number(item.id),
      }))
      return optionalChangePaymentRecordOptions.value
    } catch (error) {
      console.error(error)
      optionalChangePaymentRecords.value = []
      optionalChangePaymentRecordOptions.value = []
      return []
    } finally {
      optionalChangePaymentRecordLoading.value = false
    }
  }

  const closeOptionalChangeAuditModal = () => {
    if (optionalChangeSubmitting.value) return
    showOptionalChangeAuditModal.value = false
  }

  const setOptionalChangeAuditModalVisible = (value) => {
    if (value) {
      showOptionalChangeAuditModal.value = true
      return
    }
    closeOptionalChangeAuditModal()
  }

  const handleOptionalChangeAuditFieldChange = ({ key, value }) => {
    if (!key) return
    optionalChangeAuditForm[key] = value
  }

  const openOptionalChangeAuditModal = async (record) => {
    currentOptionalChangeAuditRecord.value = record
    resetOptionalChangeAuditForm()
    optionalChangeAuditForm.mode = resolveOptionalChangeAuditMode(record)

    const diffAmount = Math.abs(Number(record?.theoreticalDiffAmount || 0))
    if (optionalChangeAuditForm.mode === 'charge' && diffAmount > 0) {
      optionalChangeAuditForm.finalChargeAmount = diffAmount
    }
    if (optionalChangeAuditForm.mode === 'refund' && diffAmount > 0) {
      optionalChangeAuditForm.finalRefundAmount = diffAmount
    }

    showOptionalChangeAuditModal.value = true

    if (optionalChangeAuditForm.mode === 'refund') {
      await loadOptionalChangePaymentRecordOptions()
      syncResolvedOptionalChangePaymentRecord(record)
    }
  }

  const refreshDispatchContext = async (
    orderId = currentDispatchOrder.value?.id || detailOrder.value?.id,
  ) => {
    if (!orderId) return
    await orderManageStore.fetchOrderDetailInternal(orderId)
    orderManageStore.syncDispatchListItem()
    await orderManageStore.initDispatchState()
    await loadAdminOptionalChangeList(orderId)
    if (Number(detailOrder.value?.orderStatus) >= 3) {
      await loadConstructionStatus()
    }
  }

  const submitOptionalChangeAudit = async () => {
    const requestId = Number(currentOptionalChangeAuditRecord.value?.id || 0)
    if (!requestId) {
      message.error('未找到选配变更申请')
      return
    }

    const payload = {
      requestId,
      approved: optionalChangeAuditForm.approved,
    }

    if (optionalChangeAuditForm.approved) {
      if (
        !currentOptionalChangeAllowedModes.value.includes(optionalChangeAuditForm.mode)
      ) {
        message.warning('当前变更类型不支持所选结算方式')
        optionalChangeAuditForm.mode = resolveOptionalChangeAuditMode(
          currentOptionalChangeAuditRecord.value,
        )
        return
      }

      if (optionalChangeAuditForm.mode === 'charge') {
        const amount = Number(optionalChangeAuditForm.finalChargeAmount)
        if (!(amount > 0)) {
          message.warning('请输入有效的补价金额')
          return
        }
        payload.finalChargeAmount = amount
      }

      if (optionalChangeAuditForm.mode === 'refund') {
        const refundAmount = Number(optionalChangeAuditForm.finalRefundAmount)
        const paymentRecordId = Number(optionalChangeAuditForm.paymentRecordId)
        if (!(refundAmount > 0)) {
          message.warning('请输入有效的退款金额')
          return
        }
        if (!(paymentRecordId > 0)) {
          message.warning('系统未识别到最近一次已支付节点进度款，请先确认节点账单已完成支付')
          return
        }
        payload.finalRefundAmount = refundAmount
        payload.paymentRecordId = paymentRecordId
      }
    }

    optionalChangeSubmitting.value = true
    try {
      const res = await adminOrderAPI.auditAdminOptionalChange(
        payload,
        operatorName.value,
      )
      if (res?.code !== 200) {
        message.error(res?.msg || '选配变更审核失败')
        return
      }

      message.success(res.msg || '选配变更审核成功')
      closeOptionalChangeAuditModal()
      await refreshDispatchContext()
    } catch (error) {
      console.error(error)
      message.error(getErrorMessage(error, '选配变更审核失败'))
    } finally {
      optionalChangeSubmitting.value = false
    }
  }

  watch(showOptionalChangeAuditModal, (show) => {
    if (!show) {
      currentOptionalChangeAuditRecord.value = null
      optionalChangePaymentRecords.value = []
      optionalChangePaymentRecordOptions.value = []
      resetOptionalChangeAuditForm()
    }
  })

  watch(
    () => optionalChangeAuditForm.mode,
    async (mode) => {
      if (mode === 'refund' && showOptionalChangeAuditModal.value) {
        await loadOptionalChangePaymentRecordOptions()
        syncResolvedOptionalChangePaymentRecord()
        return
      }

      if (mode !== 'refund') {
        optionalChangeAuditForm.paymentRecordId = null
        optionalChangePaymentRecords.value = []
        optionalChangePaymentRecordOptions.value = []
      }
    },
  )

  watch(
    () => currentOptionalChangeAllowedModes.value.join('|'),
    () => {
      if (!showOptionalChangeAuditModal.value) return
      if (
        !currentOptionalChangeAllowedModes.value.includes(
          optionalChangeAuditForm.mode,
        )
      ) {
        optionalChangeAuditForm.mode = resolveOptionalChangeAuditMode(
          currentOptionalChangeAuditRecord.value,
        )
      }
    },
  )

  return {
    optionalChangeLoading,
    optionalChangeSubmitting,
    optionalChangeRecords,
    showOptionalChangeAuditModal,
    currentOptionalChangeAuditRecord,
    optionalChangePaymentRecordLoading,
    optionalChangePaymentRecordOptions,
    optionalChangeAuditForm,
    visibleOptionalChangeRecords,
    currentOptionalChangeAuditModeOptions,
    currentOptionalChangeAuditModeHint,
    resolvedOptionalChangePaymentRecordText,
    resolvedOptionalChangePaymentRecordMissing,
    getOptionalChangeStatusTagType,
    formatAdminOptionalChangeSnapshot,
    loadAdminOptionalChangeList,
    setOptionalChangeAuditModalVisible,
    handleOptionalChangeAuditFieldChange,
    closeOptionalChangeAuditModal,
    openOptionalChangeAuditModal,
    submitOptionalChangeAudit,
  }
}
