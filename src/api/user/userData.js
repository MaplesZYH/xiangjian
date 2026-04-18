import request from '@/api/request'

export default {
  getUserData(page, pageSize, phone) {
    return request({
      url: '/user/management',
      method: 'get',
      params: {
        page,
        pageSize,
        phone,
      },
    })
  },
  getUserDataById(id) {
    return request({
      url: `/user/management/info/${id}`,
      method: 'get',
    })
  },
  deleteUserData(ids) {
    const deleteIds = Array.isArray(ids) ? ids : [ids]
    return request({
      url: '/user/management',
      method: 'delete',
      data: deleteIds,
    })
  },
  addUserData(data) {
    return request({
      url: '/user/management',
      method: 'post',
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
    })
  },
  updateUserData(data) {
    return request({
      url: '/user/management',
      method: 'put',
      data: {
        id: data.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
    })
  },
}
