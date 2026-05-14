import request from '@/api/request'

export default {
  // 1. 分页查询服务商信息（支持按名称模糊匹配）
  getVendorList(page, pageSize, status, companyName) {
    return request({
      url: '/vendor/management/info',
      method: 'get',
      authScope: 'employee',
      requiredEmployeePermissions: ['vendor:list'],
      params: {
        page,
        pageSize,
        status, // 0-未通过, 1-已通过, 2-待审核
        companyName,
      },
    })
  },

  // 2. 后台根据ID查询服务商详情
  getVendorById(id) {
    return request({
      url: `/vendor/management/info/${id}`,
      method: 'get',
      authScope: 'employee',
      requiredEmployeePermissions: ['vendor:view'],
    })
  },

  // 3. 后台服务商信息编辑
  updateService(data) {
    return request({
      url: '/vendor/management/info',
      method: 'put',
      authScope: 'employee',
      requiredEmployeePermissions: ['vendor:update'],
      data,
    })
  },

  // 4. 后台根据键值删除服务商（支持单个/批量逻辑删除)
  deleteService(ids) {
    return request({
      url: '/vendor/management/info',
      method: 'delete',
      authScope: 'employee',
      requiredEmployeePermissions: ['vendor:delete'],
      data: ids, // 直接传数组 [1, 2]
    })
  },

  // 5. 服务商资质审核（通过：audit=1、驳回：audit=0）
  auditService(id, audit, message = '') {
    return request({
      url: `/vendor/management/info/${id}`,
      method: 'put',
      authScope: 'employee',
      requiredEmployeePermissions: ['vendor:audit'],
      params: {
        audit,
        message,
      },
    })
  },
}
