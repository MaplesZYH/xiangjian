import request from '@/api/request'

export default {
  // 用户创建订单
  createOrder(userId, data) {
    let resolvedUserId = userId
    let resolvedData = data

    // 兼容旧调用: createOrder(data)
    if (typeof userId === 'object' && userId !== null) {
      resolvedData = userId
      resolvedUserId = userId.userId
    }

    return request({
      url: '/user/order/create',
      method: 'post',
      params: resolvedUserId ? { userId: resolvedUserId } : undefined,
      data: resolvedData,
    })
  },

  //用户支付初次下单订单
  /**
   * @param {*} userId 用户id
   * @param {*} channel string类型 支付渠道:枚举值:ALIPAY,WECHAT
   * @param {*} orderId 订单id
   */
  payOrder(userId, channel, orderId) {
    return request({
      url: `/user/order/pay/${orderId}`,
      method: 'post',
      params: {
        userId,
        channel,
      },
    })
  },
  //用户支付下单后的节点订单
  /**
   * @param {*} userId 用户id
   * @param {*} channel string类型 支付渠道:ALIPAY（支付宝支付）或WECHAT（微信支付）
   * @param {*} orderId 订单id
   * @param {*} nodeId 施工节点id
   */
  payOrderNode(orderId, userId, channel, nodeId) {
    return request({
      url: `/construction/user/pay`,
      method: 'post',
      params: {
        orderId,
        userId,
        channel,
        nodeId,
      },
    })
  },

  // 用户在合同未上传前取消订单
  cancelOrder(orderId, userId, reason) {
    return request({
      url: `/user/order/cancel/${orderId}`,
      method: 'post',
      params: {
        userId,
        reason,
      },
    })
  },

  //当整个流程走完后用户确认订单完成
  userConfirmOrder(userId, orderId) {
    return request({
      url: `/user/order/confirm/${orderId}`,
      method: 'post',
      params: {
        userId,
      },
    })
  },
  /**----------------------------------------------------------------------------- */
  // 用户查询订单列表
  getOrderList(params) {
    return request({
      url: '/user/order/list',
      method: 'get',
      params,
    })
  },
  // 用户查询订单详情
  getOrderDetail(userId, id) {
    return request({
      url: `/user/order/detail/${id}`,
      method: 'get',
      params: {
        userId: userId,
      },
    })
  },

  // 用户查询当前订单的支付流水
  getUserPaymentRecords(orderId, userId) {
    return request({
      url: `/user/order/payment-records/${orderId}`,
      method: 'get',
      params: {
        userId,
      },
    })
  },

  /**----------------------------------------------------------------------------- */
  //用户申请退款
  /**
   *
   * @param {*} userId  用户ID
   * @param {*} paymentRecordId 支付流水ID
   * @param {*} reason 原因
   * @param {*} orderId 订单id
   * @returns
   */
  applyRefund(userId, paymentRecordId, reason, orderId) {
    return request({
      url: `/order/refund/user/apply/${orderId}`,
      method: 'post',
      params: {
        userId,
        paymentRecordId, // paymentRecordId: 支付流水ID
        reason, // reason: 退款原因（用户自己输入）
      },
    })
  },

  //用户查看退款详情
  getUserRefundDetail(orderId, userId, paymentRecordId) {
    return request({
      url: `/order/refund/user/detail/${orderId}`,
      method: 'get',
      params: {
        userId,
        paymentRecordId,
      },
    })
  },

  cancelRefund(orderId, userId, paymentRecordId) {
    return request({
      url: `/order/refund/user/cancel/${orderId}`,
      method: 'post',
      params: {
        userId,
        paymentRecordId,
      },
    })
  },

  //后台管理员审核退款申请
  auditRefund(
    orderId,
    refundAmount,
    reason,
    approved,
    paymentRecordId,
    operator,
  ) {
    return request({
      url: `/order/refund/admin/audit`,
      method: 'post',
      params: {
        operator,
      },
      data: {
        orderId, // orderId: 订单ID
        reason, // reason: 退款原因/审核备注
        refundAmount, // refundAmount: 退款金额(后台人员输入)
        approved, // approved: 是否同意退款(true:同意,false:拒绝)
        paymentRecordId, // paymentRecordId: 支付流水ID
      },
    })
  },
  //后台退款列表分页查询
  getRefundList(page, pageSize, orderId, orderNumber, status, paymentRecordId) {
    return request({
      url: `/order/refund/admin`,
      method: 'get',
      params: {
        page,
        pageSize,
        orderId,
        orderNumber, // orderNumber: 订单号
        status, // status:退款状态 (0待审核,1通过,2拒绝,3处理中,4成功,5失败)
        paymentRecordId, // 支付流水ID
      },
    })
  },

  //退款详情；refundId:退款申请ID
  getRefundDetail(refundId) {
    return request({
      url: `/order/refund/admin/${refundId}`,
      method: 'get',
    })
  },

  syncRefundStatus(refundId, operator) {
    return request({
      url: `/order/refund/admin/sync/${refundId}`,
      method: 'post',
      params: {
        operator,
      },
    })
  },

  // 兼容旧调用
  userCancelOrder(userId, paymentRecordId, reason, orderId) {
    return this.applyRefund(userId, paymentRecordId, reason, orderId)
  },

  userRefundDetail(orderId, userId, paymentRecordId) {
    return this.getUserRefundDetail(orderId, userId, paymentRecordId)
  },

  adminCheckRefund(
    orderId,
    refundAmount,
    reason,
    approved,
    paymentRecordId,
    operator,
  ) {
    return this.auditRefund(
      orderId,
      refundAmount,
      reason,
      approved,
      paymentRecordId,
      operator,
    )
  },

  adminCheckRefundList(
    page,
    pageSize,
    orderId,
    orderNumber,
    status,
    paymentRecordId,
  ) {
    return this.getRefundList(
      page,
      pageSize,
      orderId,
      orderNumber,
      status,
      paymentRecordId,
    )
  },

  adminCheckRefundListDetail(refundId) {
    return this.getRefundDetail(refundId)
  },

  // 支付流水分页查询
  getPaymentRecordList(params = {}) {
    return request({
      url: `/payment/record`,
      method: 'get',
      params: {
        page: params.page,
        pageSize: params.pageSize,
        orderId: params.orderId,
        keyword: params.keyword,
      },
    })
  },

  // 支付流水详情
  getPaymentRecordDetail(paymentRecordId) {
    return request({
      url: `/payment/record/${paymentRecordId}`,
      method: 'get',
    })
  },

  // 获取支付声明（用户侧读取接口）
  getPaymentStatement(config = {}) {
    return request({
      url: '/user/order/payment-statement',
      method: 'get',
      ...config,
    })
  },

  // 管理端修改支付声明
  updatePaymentStatement(statement) {
    return request({
      url: '/order/management/payment-statement',
      method: 'put',
      data: {
        statement,
      },
    })
  },

  // 兼容旧调用
  paymentRecordList(page, pageSize, orderId, keyword) {
    return this.getPaymentRecordList({
      page,
      pageSize,
      orderId,
      keyword,
    })
  },

  paymentRecordDetails(paymentRecordId) {
    return this.getPaymentRecordDetail(paymentRecordId)
  },
}
