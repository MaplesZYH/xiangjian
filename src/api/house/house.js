import request from '@/api/request'

export default {
  // 用户端分页查询主体产品
  getClientHouseData (current, size, data = {}) {
    return request({
      url: '/user/products/page',
      method: 'get',
      params: {
        pageNum: current,
        pageSize: size,
        keyword: data.keyword,
        name: data.name,
        style: data.style,
        constructionMethod: data.constructionMethod,
        floors: data.floors,
        roomCount: data.roomCount,
        livingRoomCount: data.livingRoomCount,
        bathroomCount: data.bathroomCount,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        minBaseArea: data.minBaseArea,
        maxBaseArea: data.maxBaseArea,
        minBuildArea: data.minBuildArea,
        maxBuildArea: data.maxBuildArea,
      },
    })
  },
  // 用户端获取主体产品详情
  getClientHouseDetails (id) {
    return request({
      url: '/user/products/detail',
      method: 'get',
      params: { id },
    })
  },
  // 查询产品信息
  getHouseData (current, size, data = {}) {
    return request({
      url: '/admin/products/page', // 1. 去掉 URL 后面的拼接参数
      method: 'get',
      // 2. 将 data 改为 params，因为是 GET 请求
      params: {
        pageNum: current,
        pageSize: size,

        // 筛选条件直接映射
        name: data.name, // 产品名称
        style: data.style, // 建筑风格
        constructionMethod: data.constructionMethod, // 施工方式
        floors: data.floors, // 层数 (后端根据这个数字筛选)

        roomCount: data.roomCount, // 室数量
        livingRoomCount: data.livingRoomCount, // 厅数量
        bathroomCount: data.bathroomCount, // 卫数量

        minPrice: data.minPrice, // 最低价格
        maxPrice: data.maxPrice, // 最高价格

        minBaseArea: data.minBaseArea, // 最小占地面积
        maxBaseArea: data.maxBaseArea, // 最大占地面积
        minBuildArea: data.minBuildArea, // 最小建设面积
        maxBuildArea: data.maxBuildArea, // 最大建设面积
      },
    })
  },
  //获取主体产品详细信息
  getHouseDetails (id) {
    return request({
      url: `/admin/products/${id}`,
      method: 'get',
    })
  },
  //创建主体产品
  addHouseData (data) {
    return request({
      url: '/admin/products',
      method: 'post',
      data,
    })
  },
  //更新产品
  updateHouseData (data, id) {
    return request({
      url: `/admin/products/${id}`,
      method: 'put',
      data,
    })
  },
  // 管理端批量删除主体产品
  deleteHouseData (ids) {
    //支持批量删除
    return request({
      url: `/admin/products/batch-delete`,
      method: 'post',//后端就是设置的post
      data: ids
    })
  },
  // 添加3d图 - 修改后支持FormData和进度回调
  add3dHouse (productId, formData, onUploadProgress, timeout = 900000) {
    return request({
      url: `/admin/products/${productId}/upload-model3d`,
      method: 'post',
      data: formData,
      timeout, // 默认 15 分钟，覆盖“上传 + 后端优化”总耗时
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress, // 添加上传进度回调
    })
  },

  // 修改效果图上传接口，支持多文件
  addEffectImage (productId, formData, onUploadProgress) {
    return request({
      url: `/admin/products/${productId}/renderings`,
      method: 'post',
      data: formData,
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
    })
  },
  // 修改平面图上传接口，支持多文件
  addPlanImage (productId, formData, onUploadProgress) {
    return request({
      url: `/admin/products/${productId}/floor-plans`, // 确认后端路径
      method: 'post',
      data: formData,
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
    })
  },

  // 删除3d图
  delete3dHouse (productId) {
    return request({
      url: `/admin/products/${productId}/model3d`,
      method: 'delete',
    })
  },

  // 删除效果图
  deleteEffectImage (renderingId) {
    return request({
      url: `/admin/products/renderings/${renderingId}`,
      method: 'delete',
    })
  },

  // 删除平面图
  deletePlanImage (floorPlanId) {
    return request({
      url: `/admin/products/floor-plans/${floorPlanId}`,
      method: 'delete',
    })
  },
  // --- 修改开始 ---
  // 上传产品封面图
  // 修改：使其接受 FormData
  uploadCover (productId, formData, onUploadProgress) {
    return request({
      url: `/admin/products/${productId}/cover-image`,
      method: 'post',
      data: formData, // data 应该是 FormData
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
    })
  },
  // --- 修改结束 ---

  // 删除产品封面图
  deleteCover (productId) {
    return request({
      url: `/admin/products/${productId}/cover-image`,
      method: 'delete',
    })
  },
}
