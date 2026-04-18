import request from '@/api/request'

export default {
  // 管理端分页查询选配产品
  getCategoryData(pageNum, pageSize) {
    return request({
      url: `/admin/opt-categories?pageNum=${pageNum}&pageSize=${pageSize}`,
      method: 'get',
    })
  },
  // 添加分类名称
  addCategoryName(name) {
    return request({
      url: `/admin/opt-categories`,
      method: 'post',
      data: { name },
    })
  },
  // 修改分类名称
  updateCategoryName(id, name) {
    return request({
      url: `/admin/opt-categories/${id}`,
      method: 'put',
      data: { name },
    })
  },
  // 删除分类名称
  deleteCategoryName(id) {
    const ids = Array.isArray(id) ? id : [id]
    return request({
      url: '/admin/opt-categories/batch-delete',
      method: 'post',
      data: ids,
    })
  },
  /**--------------------------------------------------------------------------------------- */
  // 获取选项内容
  getOptionsData(pageNum, pageSize, categoryId, name) {
    return request({
      url: '/admin/optionProducts/page',
      method: 'get',
      params: {
        pageNum,
        pageSize,
        categoryId,
        name,
      },
    })
  },
  // 添加选配子内容
  addOptionsData(data) {
    return request({
      url: '/admin/optionProducts',
      method: 'post',
      data,
    })
  },
  // 修改选配子内容
  updateOptionsData(data) {
    return request({
      url: `/admin/optionProducts/${data.id}`,
      method: 'put',
      data,
    })
  },
  // 删除选配子内容
  deleteOptionsData(id) {
    const ids = Array.isArray(id) ? id : [id]
    return request({
      url: '/admin/optionProducts/batch-delete',
      method: 'post',
      data: ids,
    })
  },
  /**---------------------------------------------------------*/
  // 用户端查询所有选配分类
  getCategoriesData() {
    return request({
      url: '/user/optionProducts/categories',
      method: 'get',
    })
  },
  // 用户端根据分类查询选配产品
  getCategoryOptionsData(categoryId) {
    return request({
      url: '/user/optionProducts/list',
      method: 'get',
      params: { categoryId },
    })
  },
  // 用户端一次性查询全部分类及产品
  getAllCategoriesWithProducts() {
    return request({
      url: '/user/optionProducts/allWithProducts',
      method: 'get',
    })
  },
}
