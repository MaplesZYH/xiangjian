import request from '@/api/request'

export default {
  getPage(params) {
    return request({
      url: '/order/design/admin/page',
      method: 'get',
      authScope: 'employee',
      requiredEmployeePermissions: ['order:list'],
      params,
    })
  },

  getDetail(designOrderId) {
    return request({
      url: `/order/design/admin/${designOrderId}`,
      method: 'get',
      authScope: 'employee',
      requiredEmployeePermissions: ['order:view'],
    })
  },

  cancelOrder(designOrderId, reason) {
    return request({
      url: `/order/design/admin/${designOrderId}/cancel`,
      method: 'put',
      authScope: 'employee',
      requiredEmployeePermissions: ['design-order:cancel'],
      params: {
        reason,
      },
    })
  },

  uploadDeliveryFiles(data) {
    return request({
      url: '/order/design/admin/delivery-files',
      method: 'post',
      authScope: 'employee',
      requiredEmployeePermissions: ['design-order:delivery'],
      data,
    })
  },

  uploadFeedbackFiles(data) {
    return request({
      url: '/order/design/admin/feedback-files',
      method: 'post',
      authScope: 'employee',
      requiredEmployeePermissions: ['design-order:delivery'],
      data,
    })
  },
}
