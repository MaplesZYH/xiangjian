export const ORDER_PAYMENT_STATUS = {
  UNPAID: 0,
  PARTIAL: 1,
  PAID_OFF: 2,
  REFUNDED: 3,
}

const toAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export const getOrderPaymentStatus = (order) => {
  const rawStatus = Number(order?.paymentStatus)
  if (rawStatus === ORDER_PAYMENT_STATUS.REFUNDED) {
    return ORDER_PAYMENT_STATUS.REFUNDED
  }

  const totalAmount = toAmount(order?.totalAmount)
  const paidAmount = toAmount(order?.paidAmount)
  const epsilon = 0.000001

  if (totalAmount > 0) {
    if (paidAmount <= 0) {
      return ORDER_PAYMENT_STATUS.UNPAID
    }

    if (paidAmount + epsilon >= totalAmount) {
      return ORDER_PAYMENT_STATUS.PAID_OFF
    }

    return ORDER_PAYMENT_STATUS.PARTIAL
  }

  if (
    [
      ORDER_PAYMENT_STATUS.UNPAID,
      ORDER_PAYMENT_STATUS.PARTIAL,
      ORDER_PAYMENT_STATUS.PAID_OFF,
    ].includes(rawStatus)
  ) {
    return rawStatus
  }

  return paidAmount > 0
    ? ORDER_PAYMENT_STATUS.PARTIAL
    : ORDER_PAYMENT_STATUS.UNPAID
}

export const normalizeOrderPaymentState = (order) => {
  if (!order || typeof order !== 'object') return order

  return {
    ...order,
    paymentStatus: getOrderPaymentStatus(order),
  }
}
