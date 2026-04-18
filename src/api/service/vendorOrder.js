import request from '@/api/request'

export default {
  //查询服务商的订单列表
  getManageOrderList(vendorId, params) {
    return request({
      url: `/vendor/order/${vendorId}`,
      method: 'get',
      params,
    })
  },
  //查询订单详情
  getManageOrderDetail(orderId) {
    return request({
      url: `/vendor/order/info/${orderId}`,
      method: 'get',
    })
  },
  //服务商接单:vendorOrderId:服务商订单id
  getManageOrderAccept(vendorOrderId, data) {
    return request({
      url: `/order/dispatch/vendor/accept/${vendorOrderId}`,
      method: 'post',
      data: {
        vendorNotes: data.vendorNotes,
      },
    })
  },
  //服务商拒单:vendorOrderId:服务商订单id
  getManageOrderReject(vendorOrderId, data) {
    return request({
      url: `/order/dispatch/vendor/reject/${vendorOrderId}`,
      method: 'post',
      data: {
        vendorNotes: data.vendorNotes,
      },
    })
  },
  //服务商取消已接单的订单
  getManageOrderCancel(vendorOrderId, data = {}) {
    return request({
      url: `/order/dispatch/vendor/cancel/${vendorOrderId}`,
      method: 'post',
      data: {
        vendorNotes: data.vendorNotes || '',
      },
    })
  },
}
