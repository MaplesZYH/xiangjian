import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { AUTH_SCOPE_USER, getAuthStorage } from '@/utils/auth'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useFavoriteStore } from '@/stores/favorite/useFavoriteStore'
import { useUserOrderStore } from '@/stores/order/useUserOrderStore'
import { useUserProfileStore } from '@/stores/user/useUserProfileStore'
import { clearPendingOrderNotificationRead } from '@/views/client/center/user/composables/usePendingOrderNotification'

export const useUserProfilePanel = () => {
  const router = useRouter()
  const message = useMessage()
  const authStore = useAuthStore()
  const favoriteStore = useFavoriteStore()
  const orderStore = useUserOrderStore()
  const userProfileStore = useUserProfileStore()

  const {
    saving,
    userInfo,
    selectedProfileRegionCode,
    profileAddressPreview,
    canViewUserProfile,
    canUpdateUserProfile,
    canApplyRefund,
    canViewRefund,
    saveProfileButtonText,
    displayName: userName,
  } = storeToRefs(userProfileStore)

  const profileAddressForm = userProfileStore.profileAddressForm
  const profileRegionCascaderOptions =
    userProfileStore.profileRegionCascaderOptions

  const getStoredUserId = () => getAuthStorage(AUTH_SCOPE_USER, 'id')

  const handleProfileRegionUpdate = (...args) =>
    userProfileStore.handleProfileRegionUpdate(...args)

  const handleUserInfoFieldChange = ({ key, value }) => {
    if (!key) return
    userInfo.value[key] = value
  }

  const handleProfileAddressDetailChange = (value) => {
    profileAddressForm.detail = value
  }

  const fetchUserInfo = async () => {
    try {
      return await userProfileStore.fetchUserInfo()
    } catch (error) {
      message.error(error?.message || '登录状态异常，请重新登录')
      router.push('/login')
      return null
    }
  }

  const saveUserInfo = async () => {
    try {
      const res = await userProfileStore.saveUserInfo()
      if (!res) return

      if (res.code === 200) {
        message.success(res.localOnly ? '已本地保存个人信息' : '个人信息已保存')
        return
      }

      message.error(res.msg || '保存失败')
    } catch (error) {
      void error
      message.error('保存失败，请稍后重试')
    }
  }

  const logout = (closePendingOrderNotification = () => {}) => {
    clearPendingOrderNotificationRead(getStoredUserId())
    closePendingOrderNotification()
    userProfileStore.clearProfileState()
    favoriteStore.clearFavoriteState()
    orderStore.clearOrderState()
    authStore.logout(AUTH_SCOPE_USER)
    router.replace('/login')
    message.success('您已成功退出登录')
  }

  const styleLabelMap = {
    modern: '现代风格',
    chinese: '中式风格',
    european: '欧式风格',
  }

  const formatFavoriteStyle = (style) =>
    styleLabelMap[style] || style || '未分类'

  const formatFavoriteArea = (item) => {
    const area = item?.buildArea || item?.area || item?.baseArea
    return area ? `${area} m²` : '面积待补充'
  }

  return {
    saving,
    userInfo,
    selectedProfileRegionCode,
    profileAddressPreview,
    canViewUserProfile,
    canUpdateUserProfile,
    canApplyRefund,
    canViewRefund,
    saveProfileButtonText,
    userName,
    profileAddressForm,
    profileRegionCascaderOptions,
    handleProfileRegionUpdate,
    handleUserInfoFieldChange,
    handleProfileAddressDetailChange,
    fetchUserInfo,
    saveUserInfo,
    logout,
    formatFavoriteStyle,
    formatFavoriteArea,
    initializeProfile: () => userProfileStore.initializeProfile(),
  }
}
