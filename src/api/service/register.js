import request from '@/api/request'

export default {
  //注册信息上传
  registerService(data) {
    return request({
      url: '/vendor/audit',
      method: 'post',
      data,
    })
  },
  //资质文件上传
  registerCertificate(file) {
    return request({
      url: '/file/upload',
      data: file,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      method: 'post',
    })
  },
  //资质文件删除:vendorId:服务商id,certificateId:资质id
  registerCertificateDelete(vendorId, certificateId) {
    return request({
      url: `/vendor/certificate/${vendorId}/${certificateId}`,
      method: 'delete',
    })
  },

  //未成为服务商前的信息修改（待审核/驳回状态下）
  registerEdit(data) {
    return request({
      url: '/vendor/info/pre-approval',
      method: 'put',
      data,
    })
  },
  //成为服务商后的信息修改（审核通过状态下）
  registerEditAfter(data) {
    return request({
      url: '/vendor/info/post-approval',
      method: 'put',
      data,
    })
  },
  /** -------------------------------------------------------------- */
  //前台根据ID查看服务商信息
  registerInfo(id) {
    return request({
      url: `/vendor/info/${id}`,
      method: 'get',
    })
  },
  //服务商账号注销
  registerDelete(id) {
    return request({
      url: `/vendor/${id}`,
      method: 'delete',
    })
  },
}
