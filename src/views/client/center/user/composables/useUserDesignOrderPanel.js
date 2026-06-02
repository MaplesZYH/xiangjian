import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import designOrderAPI from '@/api/user/designOrder'
import houseAPI from '@/api/house/house'
import { getAuthStorage, AUTH_SCOPE_USER } from '@/utils/auth'
import { getDesignOrderMainProductBinding } from '@/utils/designOrderMainProductStore'
import {
  resolveWechatPayUrl,
  tryOpenPaymentPayload,
} from '@/views/client/center/user/userCenterPaymentPayload'

export const useUserDesignOrderPanel = ({
  paymentBridge,
  fetchOrders,
  viewOrderDetail,
  activeMenu,
  activeOrderStatusTag,
}) => {
  const message = useMessage()
  const dialog = useDialog()

  const loadingDesignOrders = ref(false)
  const designOrderList = ref([])
  const designPagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
  })
  const showDesignDetailModal = ref(false)
  const loadingDesignDetail = ref(false)
  const currentDesignOrder = ref(null)
  const designDecisionSubmitting = ref(false)
  const showDesignRepayModal = ref(false)
  const designRepaySubmitting = ref(false)
  const designMainProductNameMap = reactive({})
  const designOrderListMainProductTextMap = reactive({})
  const designOrderCancelLockMap = reactive({})
  const designRepayForm = reactive({
    channel: 'ALIPAY',
  })

  let designPaymentStatusPollTimer = null
  const designOrderPaymentTracker = reactive({
    orderId: null,
    billId: null,
  })

  const designOrderStatusMap = {
    0: '待支付定金',
    1: '设计中',
    2: '待用户决策',
    3: '已转建房',
    4: '暂不建房',
    5: '已取消',
  }

  const getStoredUserId = () => getAuthStorage(AUTH_SCOPE_USER, 'id')

  const logDesignOrderPaymentDebug = (logMessage, payload = {}) => {
    console.info('[design-order-payment]', logMessage, payload)
  }

  const designRepayAmountText = computed(() => {
    const amount = Number(
      currentDesignOrder.value?.depositAmount ||
        currentDesignOrder.value?.paidAmount ||
        0,
    )
    return Number.isFinite(amount) && amount >= 0
      ? `¥${amount.toLocaleString()}`
      : '¥--'
  })

  const getDesignOrderStatusText = (status) =>
    designOrderStatusMap[Number(status)] || '未知状态'

  const getDesignOrderStatusType = (status) => {
    const numericStatus = Number(status)
    if (numericStatus === 0) return 'warning'
    if (numericStatus === 1) return 'info'
    if (numericStatus === 2) return 'success'
    if (numericStatus === 3) return 'primary'
    if (numericStatus === 4) return 'default'
    if (numericStatus === 5) return 'error'
    return 'default'
  }

  const formatDesignOrderPaymentStatus = (status) => {
    const numericStatus = Number(status)
    if (numericStatus === 0) return '未支付'
    if (numericStatus === 1) return '已支付'
    if (numericStatus === 2) return '已结清'
    if (numericStatus === 3) return '已退款'
    return '未知'
  }

  const getDesignOrderPaymentStatusType = (status) => {
    const numericStatus = Number(status)
    if (numericStatus === 1) return 'info'
    if (numericStatus === 2) return 'success'
    if (numericStatus === 3) return 'error'
    return 'warning'
  }

  const getDesignFileLabel = (file, index, fallbackPrefix = '文件') => {
    const fileUrl = String(file?.fileUrl || '').trim()
    if (!fileUrl) {
      return `${fallbackPrefix}${index + 1}`
    }

    const rawName = fileUrl.split('/').pop() || ''
    return decodeURIComponent(rawName) || `${fallbackPrefix}${index + 1}`
  }

  const canContinueBuildDesignOrder = (order) =>
    Boolean(order?.canConvertToBuild)

  const canCancelDesignOrder = (order) => {
    const orderId = Number(order?.id || 0)
    const designStatus = Number(order?.designStatus)
    const hasDeliveryFiles = Array.isArray(order?.deliveryFiles)
      ? order.deliveryFiles.length > 0
      : Boolean(order?.hasDeliveryFiles)

    if (orderId > 0 && designOrderCancelLockMap[orderId]) {
      return false
    }

    if (hasDeliveryFiles) {
      return false
    }

    return designStatus === 0 || designStatus === 1
  }

  const resolveDesignOrderMainProductId = (order) => {
    const deliveredMpId = Number(order?.deliveredMpId)
    if (Number.isInteger(deliveredMpId) && deliveredMpId > 0) {
      return deliveredMpId
    }

    return getDesignOrderMainProductBinding(order?.id)
  }

  const loadDesignOrderMainProductId = async (order, userId) => {
    const deliveredMpId = Number(order?.deliveredMpId)
    if (Number.isInteger(deliveredMpId) && deliveredMpId > 0) {
      return deliveredMpId
    }

    const orderId = Number(order?.id)
    if (userId && Number.isInteger(orderId) && orderId > 0) {
      try {
        const res = await designOrderAPI.getDetail(orderId, userId)
        const detailDeliveredMpId = Number(res?.data?.deliveredMpId)
        if (
          res?.code === 200 &&
          Number.isInteger(detailDeliveredMpId) &&
          detailDeliveredMpId > 0
        ) {
          return detailDeliveredMpId
        }
      } catch (error) {
        void error
      }
    }

    return getDesignOrderMainProductBinding(order?.id)
  }

  const ensureClientMainProductName = async (mainProductId) => {
    const numericMainProductId = Number(mainProductId)
    if (!Number.isInteger(numericMainProductId) || numericMainProductId <= 0) {
      return ''
    }
    if (designMainProductNameMap[numericMainProductId]) {
      return designMainProductNameMap[numericMainProductId]
    }

    try {
      const res = await houseAPI.getClientHouseDetails(numericMainProductId)
      const productName = String(res?.data?.name || '').trim()
      if (productName) {
        designMainProductNameMap[numericMainProductId] = productName
        return productName
      }
    } catch (error) {
      void error
    }

    return ''
  }

  const getDesignOrderMainProductNameText = (order) => {
    const deliveredMpName = String(order?.deliveredMpName || '').trim()
    if (deliveredMpName) return deliveredMpName

    const mainProductId = resolveDesignOrderMainProductId(order)
    if (!mainProductId) return '--'
    return designMainProductNameMap[mainProductId] || '加载中...'
  }

  const getDesignOrderListMainProductNameText = (order) =>
    designOrderListMainProductTextMap[order?.id] || '--'

  const hydrateDesignOrderListMainProductNames = async (
    rows = [],
    userId = null,
  ) => {
    await Promise.all(
      rows.map(async (row) => {
        const orderId = Number(row?.id)
        if (!Number.isInteger(orderId) || orderId <= 0) return

        const mainProductId = await loadDesignOrderMainProductId(row, userId)
        if (!mainProductId) {
          designOrderListMainProductTextMap[orderId] = '--'
          return
        }

        const productName = await ensureClientMainProductName(mainProductId)
        designOrderListMainProductTextMap[orderId] = productName || '--'
      }),
    )
  }

  const canRepayDesignOrder = (order) =>
    Number(order?.paymentStatus) === 0 && Number(order?.pendingBillId) > 0

  const canMarkDesignOrderNoBuild = (order) =>
    Number(order?.designStatus) === 2 && !order?.buildOrderId

  const syncDesignOrderDetailFromServer = async (
    designOrderId = currentDesignOrder.value?.id,
  ) => {
    const userId = getStoredUserId()
    if (!userId || !designOrderId) return null

    try {
      const res = await designOrderAPI.getDetail(designOrderId, userId)
      logDesignOrderPaymentDebug('sync detail response', {
        designOrderId,
        code: res?.code,
        paymentStatus: res?.data?.paymentStatus,
        designStatus: res?.data?.designStatus,
        pendingBillId: res?.data?.pendingBillId,
      })
      if (res.code === 200 && res.data) {
        return res.data
      }
      return null
    } catch (error) {
      void error
      return null
    }
  }

  const confirmDesignOrderBillPayment = async (billId) => {
    const userId = getStoredUserId()
    if (!userId || !billId) return null

    try {
      const res = await designOrderAPI.confirmBillPayment(billId, userId)
      logDesignOrderPaymentDebug('confirm bill response', {
        billId,
        code: res?.code,
        paid: res?.data?.paid,
        billStatus: res?.data?.billStatus,
        compensated: res?.data?.compensated,
      })
      if (res.code === 200 && res.data) {
        return res.data
      }
      return null
    } catch (error) {
      void error
      return null
    }
  }

  const isDesignOrderPaymentDone = (detail) =>
    !!detail && Number(detail.paymentStatus) >= 1

  const stopDesignPaymentStatusPolling = () => {
    if (designPaymentStatusPollTimer) {
      window.clearTimeout(designPaymentStatusPollTimer)
      designPaymentStatusPollTimer = null
    }
    designOrderPaymentTracker.orderId = null
    designOrderPaymentTracker.billId = null
  }

  const refreshDesignOrderAfterPayment = async (
    designOrderId = designOrderPaymentTracker.orderId || currentDesignOrder.value?.id,
    latestDetail = null,
  ) => {
    if (!designOrderId) return

    await fetchDesignOrders()

    const matchedRow =
      designOrderList.value.find(
        (item) => Number(item?.id) === Number(designOrderId),
      ) || null
    const resolvedDetail =
      latestDetail || (await syncDesignOrderDetailFromServer(designOrderId))
    logDesignOrderPaymentDebug('refresh after payment', {
      designOrderId,
      listPaymentStatus: matchedRow?.paymentStatus,
      detailPaymentStatus: resolvedDetail?.paymentStatus,
      detailDesignStatus: resolvedDetail?.designStatus,
      detailPendingBillId: resolvedDetail?.pendingBillId,
    })

    if (
      currentDesignOrder.value?.id &&
      Number(currentDesignOrder.value.id) === Number(designOrderId)
    ) {
      currentDesignOrder.value = {
        ...currentDesignOrder.value,
        ...(matchedRow || {}),
        ...(resolvedDetail || {}),
      }
    }
  }

  const startDesignPaymentStatusPolling = (
    designOrderId,
    billId = null,
    attempts = 40,
    delay = 3000,
  ) => {
    stopDesignPaymentStatusPolling()
    if (!designOrderId) return
    designOrderPaymentTracker.orderId = designOrderId
    designOrderPaymentTracker.billId = billId

    const poll = async () => {
      let latestDetail = null
      const trackedBillId = Number(billId || 0)

      if (trackedBillId > 0) {
        const confirmResult = await confirmDesignOrderBillPayment(trackedBillId)
        if (confirmResult?.paid) {
          latestDetail = await syncDesignOrderDetailFromServer(designOrderId)
          await refreshDesignOrderAfterPayment(designOrderId, latestDetail)
          stopDesignPaymentStatusPolling()
          return
        }
      }

      latestDetail =
        latestDetail || (await syncDesignOrderDetailFromServer(designOrderId))
      const latestPendingBillId = Number(latestDetail?.pendingBillId || 0)
      if (
        isDesignOrderPaymentDone(latestDetail) ||
        (trackedBillId > 0 && latestPendingBillId !== trackedBillId)
      ) {
        await refreshDesignOrderAfterPayment(designOrderId, latestDetail)
        stopDesignPaymentStatusPolling()
        return
      }

      if (
        currentDesignOrder.value?.id &&
        Number(currentDesignOrder.value.id) === Number(designOrderId) &&
        latestDetail
      ) {
        currentDesignOrder.value = {
          ...currentDesignOrder.value,
          ...latestDetail,
        }
      }

      if (attempts <= 1) {
        stopDesignPaymentStatusPolling()
        return
      }

      attempts -= 1
      designPaymentStatusPollTimer = window.setTimeout(poll, delay)
    }

    designPaymentStatusPollTimer = window.setTimeout(poll, delay)
  }

  const syncPendingDesignOrderPaymentOnFocus = async () => {
    if (!designOrderPaymentTracker.orderId) return

    const trackedBillId = Number(designOrderPaymentTracker.billId || 0)
    if (trackedBillId > 0) {
      const confirmResult = await confirmDesignOrderBillPayment(trackedBillId)
      if (confirmResult?.paid) {
        const latestDetail = await syncDesignOrderDetailFromServer(
          designOrderPaymentTracker.orderId,
        )
        stopDesignPaymentStatusPolling()
        await refreshDesignOrderAfterPayment(
          designOrderPaymentTracker.orderId,
          latestDetail,
        )
        return
      }
    }

    const latestDetail = await syncDesignOrderDetailFromServer(
      designOrderPaymentTracker.orderId,
    )
    if (!latestDetail) return

    await refreshDesignOrderAfterPayment(
      designOrderPaymentTracker.orderId,
      latestDetail,
    )

    const latestPendingBillId = Number(latestDetail.pendingBillId || 0)
    if (
      isDesignOrderPaymentDone(latestDetail) ||
      (trackedBillId > 0 && latestPendingBillId !== trackedBillId)
    ) {
      stopDesignPaymentStatusPolling()
      return
    }

    if (!designPaymentStatusPollTimer) {
      startDesignPaymentStatusPolling(
        designOrderPaymentTracker.orderId,
        designOrderPaymentTracker.billId,
      )
    }
  }

  const initDesignOrderPaymentTracking = async () => {
    stopDesignPaymentStatusPolling()
  }

  const fetchDesignOrders = async () => {
    const userId = getStoredUserId()
    if (!userId) {
      designOrderList.value = []
      designPagination.itemCount = 0
      return
    }

    loadingDesignOrders.value = true
    try {
      const res = await designOrderAPI.getList({
        page: designPagination.page,
        pageSize: designPagination.pageSize,
        userId,
      })

      if (res.code !== 200 || !res.data) {
        designOrderList.value = []
        designPagination.itemCount = 0
        message.error(res?.msg || '获取设计订单失败')
        return
      }

      const rows = Array.isArray(res.data.records)
        ? res.data.records
        : Array.isArray(res.data.rows)
          ? res.data.rows
          : []

      designOrderList.value = rows
      designPagination.itemCount = Number(res.data.total || rows.length)
      await hydrateDesignOrderListMainProductNames(rows, userId)
      const trackedRow = rows.find(
        (item) => Number(item?.id) === Number(designOrderPaymentTracker.orderId),
      )
      logDesignOrderPaymentDebug('fetch design orders', {
        trackedOrderId: designOrderPaymentTracker.orderId,
        trackedPaymentStatus: trackedRow?.paymentStatus,
        trackedDesignStatus: trackedRow?.designStatus,
        trackedPendingBillId: trackedRow?.pendingBillId,
        total: rows.length,
      })

      if (trackedRow && Number(trackedRow.paymentStatus) >= 1) {
        if (
          currentDesignOrder.value?.id &&
          Number(currentDesignOrder.value.id) === Number(trackedRow.id)
        ) {
          currentDesignOrder.value = {
            ...currentDesignOrder.value,
            ...trackedRow,
          }
        }
        stopDesignPaymentStatusPolling()
      }
    } catch (error) {
      void error
      designOrderList.value = []
      designPagination.itemCount = 0
      message.error('获取设计订单失败')
    } finally {
      loadingDesignOrders.value = false
    }
  }

  const openDesignOrderDetail = async (row) => {
    const userId = getStoredUserId()
    if (!userId || !row?.id) {
      message.error('未找到有效的设计订单')
      return
    }

    showDesignDetailModal.value = true
    loadingDesignDetail.value = true
    currentDesignOrder.value = {
      ...row,
    }

    try {
      const res = await designOrderAPI.getDetail(row.id, userId)
      if (res.code === 200 && res.data) {
        currentDesignOrder.value = {
          ...row,
          ...res.data,
        }
        const mainProductId = resolveDesignOrderMainProductId(
          currentDesignOrder.value,
        )
        const productName = await ensureClientMainProductName(mainProductId)
        if (mainProductId) {
          designOrderListMainProductTextMap[row.id] = productName || '--'
        }
        if (
          Number(designOrderPaymentTracker.orderId) === Number(row.id) &&
          !isDesignOrderPaymentDone(res.data) &&
          !designPaymentStatusPollTimer
        ) {
          startDesignPaymentStatusPolling(
            designOrderPaymentTracker.orderId,
            designOrderPaymentTracker.billId,
          )
        }
        return
      }
      message.error(res?.msg || '获取设计订单详情失败')
    } catch (error) {
      void error
      message.error('获取设计订单详情失败')
    } finally {
      loadingDesignDetail.value = false
    }
  }

  const openDesignOrderPaymentModal = async () => {
    if (!currentDesignOrder.value?.id) return

    if (!currentDesignOrder.value?.pendingBillId) {
      const latestDetail = await syncDesignOrderDetailFromServer(
        currentDesignOrder.value.id,
      )
      if (latestDetail) {
        currentDesignOrder.value = {
          ...currentDesignOrder.value,
          ...latestDetail,
        }
      }
    }

    if (!currentDesignOrder.value?.pendingBillId) {
      message.warning('当前设计订单暂无可支付账单')
      return
    }

    designRepayForm.channel = 'ALIPAY'
    showDesignRepayModal.value = true
  }

  const submitDesignOrderRepayment = async () => {
    const userId = getStoredUserId()
    const designOrderId = currentDesignOrder.value?.id
    const billId = currentDesignOrder.value?.pendingBillId
    if (!userId || !designOrderId || !billId) {
      message.error('未找到有效的设计订单支付信息')
      return
    }

    designRepaySubmitting.value = true
    const paymentWindow =
      designRepayForm.channel === 'ALIPAY' ? window.open('', '_blank') : null

    try {
      const res = await designOrderAPI.payBill(
        billId,
        userId,
        designRepayForm.channel,
      )
      logDesignOrderPaymentDebug('repay request response', {
        designOrderId,
        billId,
        code: res?.code,
        channel: designRepayForm.channel,
      })

      if (res.code !== 200) {
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close()
        }
        message.error(res.msg || '支付发起失败')
        return
      }

      const wechatUrl = resolveWechatPayUrl(res.data)
      if (designRepayForm.channel === 'WECHAT' && wechatUrl) {
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close()
        }
        paymentBridge.paymentResultTarget.orderId = null
        paymentBridge.paymentResultTarget.nodeId = null
        paymentBridge.paymentResultTarget.billId = null
        paymentBridge.paymentResultTarget.designOrderId = designOrderId
        paymentBridge.wechatPayUrl.value = wechatUrl
        showDesignRepayModal.value = false
        paymentBridge.showWechatPayModal.value = true
        startDesignPaymentStatusPolling(designOrderId, billId)
        message.success('请使用微信扫码完成设计定金支付')
        return
      }

      const opened = tryOpenPaymentPayload(res.data, new Set(), paymentWindow)
      if (!opened && paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }

      showDesignRepayModal.value = false
      startDesignPaymentStatusPolling(designOrderId, billId)
      message.success(
        opened
          ? '已发起设计定金支付，请在新窗口完成付款'
          : '设计定金支付请求已发起',
      )
    } catch (error) {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }
      void error
      message.error('设计定金支付请求失败')
    } finally {
      designRepaySubmitting.value = false
    }
  }

  // TODO: 测试专用跳过支付入口，正式支付稳定后移除
  const skipDesignOrderPaymentForTest = async () => {
    const userId = getStoredUserId()
    const designOrderId = currentDesignOrder.value?.id
    const billId = currentDesignOrder.value?.pendingBillId
    if (!userId || !designOrderId || !billId) {
      message.error('未找到有效的设计订单支付信息')
      return
    }

    designRepaySubmitting.value = true
    try {
      const res = await designOrderAPI.skipBillPayment(billId, userId)
      if (res?.code !== 200) {
        message.error(res?.msg || '跳过支付失败')
        return
      }

      message.success(res?.msg || '支付已跳过，流程已推进')
      showDesignRepayModal.value = false
      stopDesignPaymentStatusPolling()
      await refreshDesignOrderAfterPayment(designOrderId)
    } catch (error) {
      const msg =
        error?.response?.data?.msg ||
        error?.msg ||
        error?.message ||
        '跳过支付失败'
      message.error(String(msg))
    } finally {
      designRepaySubmitting.value = false
    }
  }

  const handleContinueBuildFromDesign = async () => {
    const userId = getStoredUserId()
    const designOrderId = currentDesignOrder.value?.id
    if (!userId || !designOrderId) return

    designDecisionSubmitting.value = true
    try {
      const res = await designOrderAPI.continueBuild(designOrderId, userId)
      const buildOrderId = Number(res?.data)

      if (res.code === 200 && Number.isInteger(buildOrderId) && buildOrderId > 0) {
        currentDesignOrder.value = {
          ...currentDesignOrder.value,
          buildOrderId,
          designStatus: 3,
        }
        message.success('已从设计订单继续创建建房订单')
        showDesignDetailModal.value = false
        activeMenu.value = 'orders'
        activeOrderStatusTag.value = 'all'
        await fetchDesignOrders()
        await fetchOrders()
        await viewOrderDetail(
          {
            id: buildOrderId,
            orderStatus: 0,
            paymentStatus: 1,
            sourceDesignOrderId: designOrderId,
          },
          'info',
        )
        return
      }
      message.error(res?.msg || '继续建房失败')
    } catch (error) {
      void error
      message.error('继续建房失败')
    } finally {
      designDecisionSubmitting.value = false
    }
  }

  const handleMarkDesignOrderNoBuild = async () => {
    const userId = getStoredUserId()
    const designOrderId = currentDesignOrder.value?.id
    if (!userId || !designOrderId) return

    designDecisionSubmitting.value = true
    try {
      const res = await designOrderAPI.markNoBuildForNow(designOrderId, userId)
      if (res.code === 200) {
        currentDesignOrder.value = {
          ...currentDesignOrder.value,
          ...res.data,
        }
        message.success('该设计订单已标记为暂不建房')
        await fetchDesignOrders()
        return
      }
      message.error(res?.msg || '操作失败')
    } catch (error) {
      void error
      message.error('操作失败')
    } finally {
      designDecisionSubmitting.value = false
    }
  }

  const handleCancelDesignOrder = (row = null) => {
    const userId = getStoredUserId()
    const targetOrder = row || currentDesignOrder.value
    const designOrderId = Number(targetOrder?.id || 0)

    if (!userId || !designOrderId) {
      message.warning('未找到可取消的设计订单')
      return
    }

    if (!canCancelDesignOrder(targetOrder)) {
      message.warning(
        designOrderCancelLockMap[designOrderId]
          ? '该设计订单的退款申请已提交，请等待后台审核'
          : '当前设计订单状态不允许取消',
      )
      return
    }

    const hasPaidAmount = Number(targetOrder?.paymentStatus) > 0

    dialog.warning({
      title: '取消设计订单',
      content: hasPaidAmount
        ? '确定要取消该设计订单吗？提交后将自动发起退款申请，等待后台审核。'
        : '确定要取消该设计订单吗？取消后当前待支付设计定金将失效。',
      positiveText: '确认取消',
      negativeText: '暂不取消',
      onPositiveClick: async () => {
        designDecisionSubmitting.value = true
        try {
          const res = await designOrderAPI.cancelOrder(
            designOrderId,
            userId,
            '用户取消设计订单',
          )
          const successText = String(res?.data || res?.msg || '').trim()
          if (hasPaidAmount || successText.includes('退款')) {
            designOrderCancelLockMap[designOrderId] = true
          }

          await fetchDesignOrders()
          const latestDetail = await syncDesignOrderDetailFromServer(designOrderId)
          if (latestDetail) {
            if (Number(currentDesignOrder.value?.id) === designOrderId) {
              currentDesignOrder.value = {
                ...currentDesignOrder.value,
                ...latestDetail,
              }
            }
          } else if (!hasPaidAmount) {
            if (Number(currentDesignOrder.value?.id) === designOrderId) {
              currentDesignOrder.value = {
                ...currentDesignOrder.value,
                designStatus: 5,
                pendingBillId: null,
              }
            }
          }
          message.success(
            successText || (hasPaidAmount ? '已提交退款审核申请' : '设计订单已取消'),
          )
          return true
        } catch (error) {
          const msg =
            error?.response?.data?.msg ||
            error?.msg ||
            error?.message ||
            '取消设计订单失败'
          if (String(msg).includes('退款申请处理中')) {
            designOrderCancelLockMap[designOrderId] = true
          }
          message.error(String(msg))
          return false
        } finally {
          designDecisionSubmitting.value = false
        }
      },
    })
  }

  const handleDesignPageChange = (page) => {
    designPagination.page = page
    fetchDesignOrders()
  }

  onBeforeUnmount(() => {
    stopDesignPaymentStatusPolling()
  })

  return {
    loadingDesignOrders,
    designOrderList,
    designPagination,
    showDesignDetailModal,
    loadingDesignDetail,
    currentDesignOrder,
    designDecisionSubmitting,
    showDesignRepayModal,
    designRepaySubmitting,
    designRepayForm,
    designRepayAmountText,
    getDesignOrderStatusText,
    getDesignOrderStatusType,
    formatDesignOrderPaymentStatus,
    getDesignOrderPaymentStatusType,
    getDesignFileLabel,
    canContinueBuildDesignOrder,
    canCancelDesignOrder,
    getDesignOrderMainProductNameText,
    getDesignOrderListMainProductNameText,
    canRepayDesignOrder,
    canMarkDesignOrderNoBuild,
    fetchDesignOrders,
    openDesignOrderDetail,
    openDesignOrderPaymentModal,
    submitDesignOrderRepayment,
    skipDesignOrderPaymentForTest,
    handleContinueBuildFromDesign,
    handleMarkDesignOrderNoBuild,
    handleCancelDesignOrder,
    handleDesignPageChange,
    refreshDesignOrderAfterPayment,
    syncPendingDesignOrderPaymentOnFocus,
    initDesignOrderPaymentTracking,
    stopDesignPaymentStatusPolling,
  }
}
