import request from '@/api/request'

export default {
  createAndPay(userId, data, channel) {
    return request({
      url: '/user/design-order/create-and-pay',
      method: 'post',
      params: {
        userId,
        channel,
      },
      data,
    })
  },

  payBill(billId, userId, channel) {
    return request({
      url: `/payment/bill/${billId}`,
      method: 'post',
      params: {
        userId,
        channel,
      },
    })
  },

  confirmBillPayment(billId, userId) {
    return request({
      url: `/payment/bill/${billId}/confirm`,
      method: 'get',
      params: {
        userId,
      },
    })
  },

  // TODO: 测试专用跳过支付接口，正式支付稳定后移除
  skipBillPayment(billId, userId) {
    return request({
      url: `/payment/bill/${billId}/skip`,
      method: 'post',
      params: {
        userId,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },

  getList(params) {
    return request({
      url: '/user/design-order/list',
      method: 'get',
      params,
    })
  },

  getDetail(designOrderId, userId) {
    return request({
      url: `/user/design-order/detail/${designOrderId}`,
      method: 'get',
      params: {
        userId,
      },
    })
  },

  cancelOrder(designOrderId, userId, reason) {
    return request({
      url: `/user/design-order/cancel/${designOrderId}`,
      method: 'post',
      params: {
        userId,
        reason,
      },
    })
  },

  continueBuild(designOrderId, userId) {
    return request({
      url: '/user/design-order/continue-build',
      method: 'post',
      params: {
        userId,
      },
      data: {
        designOrderId,
      },
    })
  },

  markNoBuildForNow(designOrderId, userId) {
    return request({
      url: '/user/design-order/mark-no-build-for-now',
      method: 'post',
      params: {
        userId,
      },
      data: {
        designOrderId,
      },
    })
  },
}
