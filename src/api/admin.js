import request from '@/api/request'

export default {
  getAdminData(page, pageSize, phone) {
    return request({
      url: '/emp/management/info',
      method: 'get',
      params: {
        page,
        pageSize,
        phone,
      },
    })
  },

  getAdminDataById(id) {
    return request({
      url: `/emp/management/info/${id}`,
      method: 'get',
    })
  },

  addAdminData(data) {
    return request({
      url: '/emp/management/info',
      method: 'post',
      data,
    })
  },

  updateAdminData(data) {
    return request({
      url: '/emp/management/info',
      method: 'put',
      data,
    })
  },

  deleteAdminData(ids) {
    const deleteIds = Array.isArray(ids) ? ids : [ids]
    return request({
      url: '/emp/management/info',
      method: 'delete',
      data: deleteIds,
    })
  },
}
