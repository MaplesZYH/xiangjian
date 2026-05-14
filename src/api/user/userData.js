import request from '@/api/request'

export default {
  getUserData(page, pageSize, phone, requestConfig = {}) {
    return request({
      url: '/user/management',
      method: 'get',
      params: {
        page,
        pageSize,
        phone,
      },
      ...requestConfig,
    })
  },
  getUserDataById(id, requestConfig = {}) {
    return request({
      url: `/user/management/info/${id}`,
      method: 'get',
      ...requestConfig,
    })
  },
  deleteUserData(ids, requestConfig = {}) {
    const deleteIds = Array.isArray(ids) ? ids : [ids]
    return request({
      url: '/user/management',
      method: 'delete',
      data: deleteIds,
      ...requestConfig,
    })
  },
  addUserData(data, requestConfig = {}) {
    return request({
      url: '/user/management',
      method: 'post',
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
      ...requestConfig,
    })
  },
  updateUserData(data, requestConfig = {}) {
    return request({
      url: '/user/management',
      method: 'put',
      data: {
        id: data.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
      ...requestConfig,
    })
  },
}
