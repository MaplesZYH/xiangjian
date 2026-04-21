const DESIGN_ORDER_PAYMENT_TRACKER_STORAGE_KEY =
  'client_design_order_payment_tracker'

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export const loadDesignOrderPaymentTracker = () => {
  const storage = getStorage()
  if (!storage) {
    return {
      orderId: null,
      billId: null,
    }
  }

  try {
    const raw = storage.getItem(DESIGN_ORDER_PAYMENT_TRACKER_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const orderId = Number(parsed?.orderId)
    const billId = Number(parsed?.billId)

    return {
      orderId: Number.isInteger(orderId) && orderId > 0 ? orderId : null,
      billId: Number.isInteger(billId) && billId > 0 ? billId : null,
    }
  } catch {
    return {
      orderId: null,
      billId: null,
    }
  }
}

export const saveDesignOrderPaymentTracker = (orderId, billId = null) => {
  const storage = getStorage()
  if (!storage) return

  const normalizedOrderId = Number(orderId)
  const normalizedBillId = Number(billId)
  if (!Number.isInteger(normalizedOrderId) || normalizedOrderId <= 0) {
    return
  }

  storage.setItem(
    DESIGN_ORDER_PAYMENT_TRACKER_STORAGE_KEY,
    JSON.stringify({
      orderId: normalizedOrderId,
      billId:
        Number.isInteger(normalizedBillId) && normalizedBillId > 0
          ? normalizedBillId
          : null,
    }),
  )
}

export const clearDesignOrderPaymentTracker = () => {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(DESIGN_ORDER_PAYMENT_TRACKER_STORAGE_KEY)
}
