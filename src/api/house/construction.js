import request from '@/api/request'

export default {
  //1.开启施工流程
  startConstruction(orderId) {
    return request({
      url: '/construction/admin/start',
      method: 'post',
      data: {
        orderId,
      },
    })
  },
  //获取施工流程状态
  getConstructionStatus(orderId) {
    return request({
      url: `/construction/status/${orderId}`,
      method: 'get',
    })
  },
  //预设施工节点金额
  setConstructionAmount(data) {
    return request({
      url: '/construction/admin/price',
      method: 'post',
      data: {
        orderId: data.orderId,
        nodePrices: data.nodePrices,
      },
    })
  },
  // 5. 服务商上传节点照片 (修复：参数放 params，文件放 body 且 key 为 files)
  uploadNodePhoto(params) {
    const formData = new FormData()
    formData.append('files', params.file) // 后端要求 Key 为 'files'

    return request({
      url: '/construction/upload',
      method: 'post',
      // 关键修改：这些字段放入 params (Query String)
      params: {
        orderId: params.orderId,
        nodeId: params.nodeId,
        vendorId: params.vendorId,
        description: params.description || '',
      },
      data: formData, // 文件放入 Body
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // 6. 服务商删除节点照片 (修复：参数放 params)
  deleteNodePhoto(orderId, vendorId, nodeId, imageId) {
    return request({
      url: `/construction/vendor/photo/${imageId}`,
      method: 'delete', // 通常删除用 DELETE 方法
      // 关键修改：vendorId 和 nodeId 放入 params (Query String)
      params: {
        orderId,
        vendorId,
        nodeId,
      },
    })
  },

  //获取特定施工阶段详情
  getConstructionDetail(orderId, nodeId) {
    return request({
      url: `/construction/node/${orderId}/${nodeId}`,
      method: 'get',
    })
  },

  //平台审核
  audit(orderId, nodeId, pass, reason) {
    return request({
      url: '/construction/admin/audit',
      method: 'post',
      data: {
        nodeId,
        orderId,
        pass, //boolean:true:通过 false:不通过
        reason,
      },
    })
  },
  //用户审核
  userAudit(userId, orderId, nodeId, pass, reason) {
    return request({
      url: '/construction/user/audit',
      method: 'post',
      params: {
        userId,
      },
      data: {
        nodeId,
        orderId,
        pass, //boolean:true:通过 false:不通过
        reason,
      },
    })
  },
  //用户支付当前节点费用
  payNode(orderId, userId, nodeId) {
    return request({
      url: '/construction/user/pay',
      method: 'post',
      params: {
        orderId,
        userId,
        nodeId,
      },
    })
  },
}
