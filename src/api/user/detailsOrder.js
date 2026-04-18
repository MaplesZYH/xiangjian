import request from '@/api/request'

export default {
  // 1. 获取订单列表
  getUserOrder(params) {
    return request({
      url: '/order/management',
      method: 'get',
      params: {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword || undefined,
        orderStatus: params.orderStatus,
        paymentStatus: params.paymentStatus,
      },
    })
  },

  // 2. 根据订单ID查询订单详情
  getUserOrderDetail(id) {
    return request({
      url: `/order/management/info/${id}`,
      method: 'get',
    })
  },

  // 3. 修改订单详情
  updateOrderDetail(updateData) {
    return request({
      url: '/order/management/info',
      method: 'put',
      data: updateData,
    })
  },

  // 4. 删除订单
  deleteUserOrder(id) {
    return request({
      url: `/order/management/info/${id}`,
      method: 'delete',
    })
  },

  // 5. 合同上传 (修改：orderId 为 Query 参数)
  uploadContract(orderId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return request({
      url: '/order/management/contract/upload',
      method: 'post',
      params: { orderId }, // Query 参数
      data: formData, // Body 参数
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
