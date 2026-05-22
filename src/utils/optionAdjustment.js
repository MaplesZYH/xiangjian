const AMOUNT_EPSILON = 0.000001

export const resolveOptionAdjustmentInfo = (adjustmentAmount) => {
  const amount = Number(adjustmentAmount)
  if (!Number.isFinite(amount) || Math.abs(amount) <= AMOUNT_EPSILON) {
    return {
      visible: false,
      type: '',
      label: '',
      amount: 0,
      amountText: '0.00',
      suffix: '',
    }
  }

  const isCharge = amount > 0
  const absoluteAmount = Math.abs(amount)

  return {
    visible: true,
    type: isCharge ? 'charge' : 'deduction',
    label: isCharge ? '累计补价' : '累计抵扣',
    amount: absoluteAmount,
    amountText: absoluteAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    suffix: isCharge ? '待补价' : '已从后续节点抵扣',
  }
}
