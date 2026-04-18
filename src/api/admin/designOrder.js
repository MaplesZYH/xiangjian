import request from '@/api/request'

export default {
  getPage(params) {
    return request({
      url: '/order/design/admin/page',
      method: 'get',
      params,
    })
  },

  getDetail(designOrderId) {
    return request({
      url: `/order/design/admin/${designOrderId}`,
      method: 'get',
    })
  },

  uploadDeliveryFiles(data) {
    return request({
      url: '/order/design/admin/delivery-files',
      method: 'post',
      data,
    })
  },

  uploadFeedbackFiles(data) {
    return request({
      url: '/order/design/admin/feedback-files',
      method: 'post',
      data,
    })
  },
}
