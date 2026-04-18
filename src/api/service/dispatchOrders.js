import request from '@/api/request'

export default {
  // --- 派单相关接口 ---

  // 1. 获取附近的建筑商 (用于施工派单)
  getNearbyBuilders(userOrderId) {
    return request({
      url: `/order/dispatch/construction/${userOrderId}`,
      method: 'get',
    })
  },

  // 2. 获取附近的材料供应商 (用于材料派单)
  getNearbyMaterialSuppliers(userOrderId, categoryId) {
    return request({
      url: `/order/dispatch/material/${userOrderId}`,
      method: 'get',
      params: {
        category: categoryId, // 传入材料大类ID
      },
    })
  },
  // 后台创建服务商订单 (派单)
  createVendorOrder(data) {
    return request({
      url: '/order/dispatch',
      method: 'post',
      data,
    })
  },
  //查询用户订单关联的所有服务商订单（拆分详情）
  getVendorOrders(userOrderId) {
    return request({
      url: `/order/dispatch/split/${userOrderId}`,
      method: 'get',
    })
  },

  // 获取服务商订单状态
  getVendorOrderStatus(vendorOrderId) {
    return request({
      url: `/order/dispatch/info/${vendorOrderId}`,
      method: 'get',
    })
  },

  // 更新子订单价格/备注等
  updateVendorOrderDetail(data) {
    return request({
      url: '/order/dispatch/info',
      method: 'put',
      data,
    })
  },

  // 重新指派服务商
  redispatchOrder(vendorOrderId, newVendorId) {
    return request({
      url: `/order/dispatch/redispatch/${vendorOrderId}`,
      method: 'put',
      params: {
        newVendorId,
      },
    })
  },

  // 后台取消服务商订单
  cancelVendorOrder(vendorOrderId, message) {
    return request({
      url: `/order/dispatch/info/${vendorOrderId}`,
      method: 'put',
      params: {
        message,
      },
    })
  },
}
