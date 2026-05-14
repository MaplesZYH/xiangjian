import request from '@/api/request'

export default {
  getAdminData(page, pageSize, phone) {
    return request({
      url: '/emp/management/info',
      method: 'get',
      authScope: 'employee',
      requiredEmployeePermissions: ['emp:list'],
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
      authScope: 'employee',
      requiredEmployeePermissions: ['emp:view'],
    })
  },

  addAdminData(data) {
    return request({
      url: '/emp/management/info',
      method: 'post',
      authScope: 'employee',
      requiredEmployeePermissions: ['emp:add'],
      data,
    })
  },

  updateAdminData(data) {
    return request({
      url: '/emp/management/info',
      method: 'put',
      authScope: 'employee',
      requiredEmployeePermissions: ['emp:update'],
      data,
    })
  },

  deleteAdminData(ids) {
    const deleteIds = Array.isArray(ids) ? ids : [ids]
    return request({
      url: '/emp/management/info',
      method: 'delete',
      authScope: 'employee',
      requiredEmployeePermissions: ['emp:delete'],
      data: deleteIds,
    })
  },
}
