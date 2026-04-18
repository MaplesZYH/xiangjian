import request from '@/api/request'
import { AUTH_SCOPE_USER, getActiveAuthScope, getAuthStorage } from '@/utils/auth'

const getCurrentUserId = () => {
  if (getActiveAuthScope() !== AUTH_SCOPE_USER) return ''
  return getAuthStorage(AUTH_SCOPE_USER, 'id')
}

const createUserParams = (userId) => ({
  userId: userId ?? getCurrentUserId(),
})

export default {
  // 用户收藏主体产品
  collecProjects (productId, userId) {
    return request({
      url: `/user/products/favorite/${productId}`,
      method: 'post',
      params: createUserParams(userId),
    })
  },

  // 取消收藏主体产品
  cancelCollect (productId, userId) {
    return request({
      url: `/user/products/favorite/${productId}`,
      method: 'delete',
      params: createUserParams(userId),
    })
  },

  // 查询主体产品收藏状态
  getCollectStatus (productId, userId) {
    return request({
      url: `/user/products/favorite/status/${productId}`,
      method: 'get',
      params: createUserParams(userId),
    })
  },

  // 分页查询用户收藏主体产品
  getCollectList (userId, pageNum, pageSize) {
    return request({
      url: `/user/products/favorite/page`,
      method: 'get',
      params: {
        ...createUserParams(userId),
        pageNum,
        pageSize,
      },
    })
  },
}
