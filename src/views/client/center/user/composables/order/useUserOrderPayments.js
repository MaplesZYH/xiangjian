import { computed, reactive, ref } from 'vue'
import orderAPI from '@/api/user/userOrder.js'
import ConstructionAPI from '@/api/house/construction.js'
import {
  resolvePaymentPayloadMeta,
  resolveWechatPayUrl,
  tryOpenPaymentPayload,
} from '@/views/client/center/user/userCenterPaymentPayload'
import {
  extractPaymentBillRows,
  findPendingBillById,
  findPendingStageBillByNodeId,
  getPaymentBillDisplayTitle,
  isPayingPaymentBillStatus,
  isPendingPaymentBillStatus,
  paymentChannelOptions,
  sortPendingPaymentBills,
} from '@/views/client/center/user/composables/order/orderHelpers'

export const useUserOrderPayments = ({
  currentOrder,
  paymentBridge,
  pendingPaymentBills,
  constructionInfo,
  getStoredUserId,
  message,
  fetchOrders,
  syncCurrentOrderFromServer,
  loadDetailPaymentRecords,
  hydrateUserOptionSelection,
  loadUserOptionalChangeRecords,
  startConstructionPaymentPolling,
  refreshConstructionAfterNodePayment,
}) => {
  const pendingPaymentBillsLoading = ref(false)
  const showPaymentModal = ref(false)
  const paymentSubmitting = ref(false)
  const paymentForm = reactive({
    channel: 'ALIPAY',
  })
  const paymentTarget = reactive({
    orderId: null,
    billId: null,
    billType: '',
    nodeId: null,
    amount: 0,
    amountText: '',
    title: '',
    description: '',
  })
  const showOrderPaymentStatementModal = ref(false)

  let paymentStatusPollTimer = null
  const orderPaymentTracker = reactive({
    orderId: null,
    billId: null,
    billType: '',
  })

  const paymentModalTitle = computed(() => '账单支付')

  const isOptionChangeBill = (bill) =>
    String(bill?.billType || '').trim().toUpperCase() === 'OPTION_CHANGE'

  const canRepayBill = (bill) =>
    bill && (isPendingPaymentBillStatus(bill.status) || isPayingPaymentBillStatus(bill.status))

  const canCancelPendingOptionChangeBill = (bill) =>
    Boolean(
      bill &&
        isOptionChangeBill(bill) &&
        isPendingPaymentBillStatus(bill.status) &&
        Number(bill?.id || 0) > 0,
    )

  const getPendingBillActionText = (bill) =>
    isPayingPaymentBillStatus(bill?.status) ? '继续支付' : '去支付'

  const syncPendingPaymentBillsState = (rows = []) => {
    const nextRows = sortPendingPaymentBills(rows)
    pendingPaymentBills.value = nextRows
    if (currentOrder.value) {
      currentOrder.value.pendingPaymentBills = nextRows
    }
    return nextRows
  }

  const loadPendingPaymentBills = async (orderId = currentOrder.value?.id) => {
    const userId = getStoredUserId()
    if (!orderId || !userId) {
      pendingPaymentBills.value = []
      return []
    }

    pendingPaymentBillsLoading.value = true
    try {
      const res = await orderAPI.getUserPaymentBills(orderId, userId)
      if (res.code === 200) {
        return syncPendingPaymentBillsState(extractPaymentBillRows(res.data))
      }
      return pendingPaymentBills.value
    } catch (error) {
      void error
      return pendingPaymentBills.value
    } finally {
      pendingPaymentBillsLoading.value = false
    }
  }

  const resolveConstructionPaymentBillId = async (orderId, nodeId) => {
    if (!orderId || !nodeId) return null
    const latestBills = await loadPendingPaymentBills(orderId)
    return findPendingStageBillByNodeId(latestBills, nodeId)?.id || null
  }

  const confirmUserBillPayment = async (orderId, billId) => {
    const userId = getStoredUserId()
    if (!userId || !billId) return null

    try {
      const res = await orderAPI.confirmBillPayment(billId, userId)
      if (res.code === 200 && res.data) {
        return res.data
      }
      return null
    } catch (error) {
      void error
      return null
    }
  }

  const refreshOrderAfterPayment = async () => {
    if (!currentOrder.value?.id) return
    stopPaymentStatusPolling()
    await syncCurrentOrderFromServer(currentOrder.value.id)
    await loadUserOptionalChangeRecords(currentOrder.value.id)
    await loadPendingPaymentBills(currentOrder.value.id)
    await loadDetailPaymentRecords(currentOrder.value.id)
    hydrateUserOptionSelection()
    await fetchOrders()
  }

  const cancelPendingBill = async (bill) => {
    const userId = getStoredUserId()
    const orderId = Number(currentOrder.value?.id || 0)
    const billId = Number(bill?.id || 0)

    if (!userId || !orderId || !billId) {
      message.error('账单信息缺失，请刷新后重试')
      return false
    }

    if (!canCancelPendingOptionChangeBill(bill)) {
      message.warning('当前账单状态不允许取消')
      return false
    }

    pendingPaymentBillsLoading.value = true
    try {
      const res = await orderAPI.cancelBill(billId, userId)
      if (res?.code !== 200) {
        message.error(res?.msg || '取消账单失败')
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
      message.success(res?.msg || '账单已取消')
      return true
    } catch (error) {
      const msg =
        error?.response?.data?.msg ||
        error?.msg ||
        error?.message ||
        '取消账单失败'
      message.error(String(msg))
      return false
    } finally {
      pendingPaymentBillsLoading.value = false
    }
  }

  const confirmCancelPendingBill = (bill, dialog) => {
    if (!dialog) {
      return cancelPendingBill(bill)
    }

    const billTitle =
      bill?.billTitle || paymentTarget.title || '当前选配补价账单'

    dialog.warning({
      title: '取消账单',
      content: `确认取消“${billTitle}”吗？取消后当前未支付的选配补价流程会同步撤销。`,
      positiveText: '确认取消',
      negativeText: '暂不取消',
      onPositiveClick: () => cancelPendingBill(bill),
    })
  }

  const stopPaymentStatusPolling = () => {
    if (paymentStatusPollTimer) {
      window.clearTimeout(paymentStatusPollTimer)
      paymentStatusPollTimer = null
    }
    orderPaymentTracker.orderId = null
    orderPaymentTracker.billId = null
    orderPaymentTracker.billType = ''
  }

  const isInitialOrderPaymentDone = (status) =>
    [1, 2, 3].includes(Number(status))

  const startPaymentStatusPolling = (
    orderId,
    billId = null,
    billType = '',
    attempts = 40,
    delay = 3000,
  ) => {
    stopPaymentStatusPolling()
    if (!orderId) return
    orderPaymentTracker.orderId = orderId
    orderPaymentTracker.billId = billId
    orderPaymentTracker.billType = billType || ''

    const poll = async () => {
      if (billId) {
        const confirmResult = await confirmUserBillPayment(orderId, billId)
        let paid = !!confirmResult?.paid

        if (!paid) {
          const latestBills = await loadPendingPaymentBills(orderId)
          paid = !findPendingBillById(latestBills, billId)
        }

        if (paid) {
          await refreshOrderAfterPayment()
          stopPaymentStatusPolling()
          return
        }
      }

      const latestOrder = await syncCurrentOrderFromServer(orderId)

      if (!latestOrder) {
        if (attempts <= 1) {
          stopPaymentStatusPolling()
          return
        }
        attempts -= 1
        paymentStatusPollTimer = window.setTimeout(poll, delay)
        return
      }

      if (!billId && isInitialOrderPaymentDone(latestOrder.paymentStatus)) {
        orderPaymentTracker.orderId = null
        await fetchOrders()
        stopPaymentStatusPolling()
        return
      }

      if (attempts <= 1) {
        stopPaymentStatusPolling()
        return
      }

      attempts -= 1
      paymentStatusPollTimer = window.setTimeout(poll, delay)
    }

    paymentStatusPollTimer = window.setTimeout(poll, delay)
  }

  const syncPendingOrderPaymentOnFocus = async () => {
    if (!orderPaymentTracker.orderId) return

    if (orderPaymentTracker.billId) {
      const confirmResult = await confirmUserBillPayment(
        orderPaymentTracker.orderId,
        orderPaymentTracker.billId,
      )
      let paid = !!confirmResult?.paid

      if (!paid) {
        const latestBills = await loadPendingPaymentBills(
          orderPaymentTracker.orderId,
        )
        paid = !findPendingBillById(latestBills, orderPaymentTracker.billId)
      }

      if (paid) {
        stopPaymentStatusPolling()
        await refreshOrderAfterPayment()
        return
      }
    }

    const latestOrder = await syncCurrentOrderFromServer(
      orderPaymentTracker.orderId,
    )
    if (!latestOrder) return

    if (
      !orderPaymentTracker.billId &&
      isInitialOrderPaymentDone(latestOrder.paymentStatus)
    ) {
      orderPaymentTracker.orderId = null
      stopPaymentStatusPolling()
      await fetchOrders()
      return
    }

    if (!paymentStatusPollTimer) {
      startPaymentStatusPolling(
        orderPaymentTracker.orderId,
        orderPaymentTracker.billId,
        orderPaymentTracker.billType,
      )
    }
  }

  const closePaymentModal = () => {
    if (!paymentSubmitting.value) {
      showPaymentModal.value = false
      resetPaymentTarget()
    }
  }

  const resetPaymentTarget = () => {
    paymentForm.channel = 'ALIPAY'
    paymentTarget.orderId = null
    paymentTarget.billId = null
    paymentTarget.billType = ''
    paymentTarget.nodeId = null
    paymentTarget.amount = 0
    paymentTarget.amountText = ''
    paymentTarget.title = ''
    paymentTarget.description = ''
  }

  const openPendingBillPaymentModal = (bill) => {
    if (!currentOrder.value?.id || !bill) return
    if (!bill.id && !bill.isVirtualConstructionBill) {
      message.warning('当前账单尚未生成，请刷新后重试')
      return
    }

    paymentForm.channel = 'ALIPAY'
    paymentTarget.orderId = currentOrder.value.id
    paymentTarget.billId = bill.id || null
    paymentTarget.billType = bill.billType || ''
    paymentTarget.nodeId = bill.relatedNodeId || null
    paymentTarget.amount = Number(bill.amount || 0)
    paymentTarget.amountText = `¥${Number(bill.amount || 0).toLocaleString()}`
    paymentTarget.title = getPaymentBillDisplayTitle(
      bill,
      constructionInfo.value,
    )
    paymentTarget.description =
      bill.remark || `订单号：${currentOrder.value.orderNumber || '--'}`
    showPaymentModal.value = true
  }

  const submitPayment = async () => {
    const userId = getStoredUserId()
    const pollingOrderId = paymentTarget.orderId
    const pollingNodeId = paymentTarget.nodeId
    const pollingBillId = paymentTarget.billId
    if (!userId || !paymentTarget.orderId) {
      message.error('登录状态失效，请重新登录')
      return
    }
    if (!paymentTarget.billId && !paymentTarget.nodeId) {
      message.error('未找到待支付账单')
      return
    }

    paymentSubmitting.value = true
    if (currentOrder.value) {
      currentOrder.value.paying = true
    }

    const paymentWindow =
      paymentForm.channel === 'ALIPAY' ? window.open('', '_blank') : null

    try {
      const isConstructionStagePayment =
        paymentTarget.billType === 'STAGE_PAYMENT' &&
        Number(paymentTarget.nodeId || 0) > 0

      const res = isConstructionStagePayment
        ? await ConstructionAPI.payNode(
            paymentTarget.orderId,
            userId,
            paymentTarget.nodeId,
            paymentForm.channel,
          )
        : paymentTarget.billId
          ? await orderAPI.payBill(
              paymentTarget.billId,
              userId,
              paymentForm.channel,
            )
          : await ConstructionAPI.payNode(
              paymentTarget.orderId,
              userId,
              paymentTarget.nodeId,
              paymentForm.channel,
            )

      const paymentPayloadMeta = resolvePaymentPayloadMeta(res?.data)
      if (
        !pollingNodeId &&
        Number.isFinite(paymentPayloadMeta?.totalAmount) &&
        paymentPayloadMeta.totalAmount >= 0
      ) {
        paymentTarget.amount = paymentPayloadMeta.totalAmount
        paymentTarget.amountText = `¥${paymentPayloadMeta.totalAmount.toLocaleString()}`
      }
      if (res.code !== 200) {
        message.error(res.msg || '支付失败')
        return
      }

      const paymentLabel =
        paymentChannelOptions.find((item) => item.value === paymentForm.channel)
          ?.label || '支付'
      const paymentSubject = paymentTarget.title || '账单支付'
      const trackedConstructionBillId = pollingNodeId
        ? pollingBillId ||
          (await resolveConstructionPaymentBillId(pollingOrderId, pollingNodeId))
        : null
      const wechatUrl = resolveWechatPayUrl(res.data)
      if (paymentForm.channel === 'WECHAT' && wechatUrl) {
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close()
        }
        paymentBridge.paymentResultTarget.orderId = pollingOrderId
        paymentBridge.paymentResultTarget.nodeId = pollingNodeId
        paymentBridge.paymentResultTarget.billId =
          pollingBillId || trackedConstructionBillId
        paymentBridge.wechatPayUrl.value = wechatUrl
        showPaymentModal.value = false
        paymentBridge.showWechatPayModal.value = true
        if (pollingNodeId) {
          startConstructionPaymentPolling(
            pollingOrderId,
            pollingNodeId,
            trackedConstructionBillId,
          )
        } else {
          startPaymentStatusPolling(
            pollingOrderId,
            pollingBillId,
            paymentTarget.billType,
          )
        }
        message.success(`请使用微信扫码完成${paymentSubject}`)
        return
      }

      const opened = tryOpenPaymentPayload(res.data, new Set(), paymentWindow, {
        allowSameWindowFallback: paymentForm.channel === 'ALIPAY',
      })
      if (!opened && paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }

      message.success(
        opened
          ? `已发起${paymentLabel}${paymentSubject}，请在新窗口完成付款`
          : `${paymentSubject}请求已发起`,
      )

      showPaymentModal.value = false
      if (pollingNodeId) {
        startConstructionPaymentPolling(
          pollingOrderId,
          pollingNodeId,
          trackedConstructionBillId,
        )
      } else {
        startPaymentStatusPolling(
          pollingOrderId,
          pollingBillId,
          paymentTarget.billType,
        )
      }
    } catch (error) {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }
      void error
      message.error('支付请求发生错误')
    } finally {
      paymentSubmitting.value = false
      if (currentOrder.value) {
        currentOrder.value.paying = false
      }
      resetPaymentTarget()
    }
  }

  const closeWechatPayModal = async (onRefreshDesignOrderAfterPayment) => {
    const resultOrderId = paymentBridge.paymentResultTarget.orderId
    const resultNodeId = paymentBridge.paymentResultTarget.nodeId
    const resultBillId = paymentBridge.paymentResultTarget.billId
    const resultDesignOrderId = paymentBridge.paymentResultTarget.designOrderId
    paymentBridge.showWechatPayModal.value = false
    paymentBridge.wechatPayUrl.value = ''
    paymentBridge.paymentResultTarget.orderId = null
    paymentBridge.paymentResultTarget.nodeId = null
    paymentBridge.paymentResultTarget.billId = null
    paymentBridge.paymentResultTarget.designOrderId = null
    if (resultDesignOrderId) {
      await onRefreshDesignOrderAfterPayment(resultDesignOrderId)
      return
    }
    if (resultNodeId) {
      if (resultBillId) {
        await confirmUserBillPayment(resultOrderId, resultBillId)
      }
      await refreshConstructionAfterNodePayment(resultOrderId, {
        focusPaymentResult: true,
      })
      return
    }
    if (resultBillId) {
      await confirmUserBillPayment(resultOrderId, resultBillId)
    }
    await refreshOrderAfterPayment()
  }

  return {
    pendingPaymentBillsLoading,
    showPaymentModal,
    paymentSubmitting,
    paymentForm,
    paymentTarget,
    showOrderPaymentStatementModal,
    paymentModalTitle,
    paymentChannelOptions,
    canRepayBill,
    canCancelPendingOptionChangeBill,
    getPendingBillActionText,
    loadPendingPaymentBills,
    confirmUserBillPayment,
    cancelPendingBill,
    confirmCancelPendingBill,
    stopPaymentStatusPolling,
    syncPendingOrderPaymentOnFocus,
    openPendingBillPaymentModal,
    closePaymentModal,
    submitPayment,
    closeWechatPayModal,
  }
}
