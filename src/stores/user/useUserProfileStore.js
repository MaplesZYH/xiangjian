import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import chinaAreaData from 'china-area-data'
import userAPI from '@/api/user/userData'
import { AUTH_SCOPE_USER, getAuthStorage } from '@/utils/auth'
import { useAuthStore } from '@/stores/auth/useAuthStore'

const rawRegionData = chinaAreaData?.default || chinaAreaData || {}
const regionRootMap = rawRegionData['86'] || {}
const regionNameByCodeMap = new Map()
const provinceCodeByNameMap = new Map()
const cityCodesByProvinceMap = new Map()
const districtCodesByCityMap = new Map()

const cityOptionalProvinceSet = new Set([
  '北京市',
  '天津市',
  '上海市',
  '重庆市',
  '香港特别行政区',
  '澳门特别行政区',
])

const provinceAliasMap = {
  北京: '北京市',
  天津: '天津市',
  上海: '上海市',
  重庆: '重庆市',
  内蒙古: '内蒙古自治区',
  广西: '广西壮族自治区',
  西藏: '西藏自治区',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区',
}

const normalizeRegionName = (value = '') =>
  String(value || '').replace(/\s+/g, '').trim()

const normalizeRegionPart = (value = '') =>
  String(value || '').replace(/\s+/g, '').trim()

const normalizeDetailPart = (value = '') =>
  String(value || '').replace(/\s+/g, ' ').trim()

const normalizeOptionLabel = (value = '') =>
  String(value === undefined || value === null ? '' : value).trim()

const buildProfileRegionCascaderOptions = () => {
  const provinceEntries = Object.entries(regionRootMap)
  return provinceEntries.map(([provinceCode, provinceName]) => {
    regionNameByCodeMap.set(provinceCode, provinceName)
    provinceCodeByNameMap.set(provinceName, provinceCode)

    const cityMap = rawRegionData[provinceCode] || {}
    const cityEntries = Object.entries(cityMap)
    cityCodesByProvinceMap.set(
      provinceCode,
      cityEntries.map(([cityCode]) => cityCode),
    )

    return {
      label: provinceName,
      value: provinceCode,
      children: cityEntries.map(([cityCode, cityName]) => {
        regionNameByCodeMap.set(cityCode, cityName)

        const districtMap = rawRegionData[cityCode] || {}
        const districtEntries = Object.entries(districtMap)
        districtCodesByCityMap.set(
          cityCode,
          districtEntries.map(([districtCode]) => districtCode),
        )

        return {
          label: cityName,
          value: cityCode,
          children: districtEntries.map(([districtCode, districtName]) => {
            regionNameByCodeMap.set(districtCode, districtName)
            return {
              label: districtName,
              value: districtCode,
            }
          }),
        }
      }),
    }
  })
}

const profileRegionCascaderOptions = buildProfileRegionCascaderOptions()

const getRegionNameByCode = (code) =>
  regionNameByCodeMap.get(String(code || '')) || ''

const findProvinceFromAddress = (text) => {
  if (!text) return ''
  const exactMatch = Array.from(provinceCodeByNameMap.keys()).find((name) =>
    text.includes(name),
  )
  if (exactMatch) return exactMatch
  return (
    Object.entries(provinceAliasMap).find(([alias]) => text.includes(alias))?.[1] ||
    ''
  )
}

const pickBestCodeByName = (codes = [], name = '') => {
  const normalizedName = normalizeRegionName(name)
  if (!codes.length || !normalizedName) return ''

  const exact = codes.find(
    (code) => normalizeRegionName(getRegionNameByCode(code)) === normalizedName,
  )
  if (exact) return exact

  return (
    codes.find((code) =>
      normalizeRegionName(getRegionNameByCode(code)).includes(normalizedName),
    ) || ''
  )
}

const resolveRegionCodesByNames = ({ province = '', city = '', district = '' }) => {
  const provinceCode = provinceCodeByNameMap.get(province) || ''
  if (!provinceCode) return []

  const cityCodes = cityCodesByProvinceMap.get(provinceCode) || []
  let cityCode = pickBestCodeByName(cityCodes, city)
  if (!cityCode && cityOptionalProvinceSet.has(province)) {
    cityCode = cityCodes[0] || ''
  }
  if (!cityCode) return [provinceCode]

  const districtCodes = districtCodesByCityMap.get(cityCode) || []
  const districtCode = pickBestCodeByName(districtCodes, district)
  if (!districtCode) return [provinceCode, cityCode]

  return [provinceCode, cityCode, districtCode]
}

const parseJSON = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const createDefaultUserInfo = () => ({
  id: '',
  name: '',
  phone: '',
  email: '',
  address: '',
})

export const useUserProfileStore = defineStore('userProfile', () => {
  const authStore = useAuthStore()
  const saving = ref(false)
  const userInfo = ref(createDefaultUserInfo())
  const selectedProfileRegionCode = ref(null)

  const profileAddressForm = reactive({
    province: '',
    city: '',
    district: '',
    detail: '',
  })

  const permissions = computed(() => authStore.currentClientPermissions || [])
  const canViewUserProfile = computed(
    () =>
      permissions.value.includes('user:view') ||
      permissions.value.includes('user:view:self'),
  )
  const canUpdateUserProfile = computed(
    () =>
      permissions.value.includes('user:update') ||
      permissions.value.includes('user:update:self'),
  )
  const canApplyRefund = computed(() =>
    permissions.value.includes('user:refund:apply'),
  )
  const canViewRefund = computed(() =>
    permissions.value.includes('user:refund:view'),
  )
  const saveProfileButtonText = computed(() =>
    canUpdateUserProfile.value ? '保存信息' : '本地保存',
  )
  const displayName = computed(
    () => userInfo.value.name || authStore.userAuth?.name || '用户',
  )

  const profileAddressPreview = computed(() => {
    const province = normalizeRegionPart(profileAddressForm.province)
    const city = normalizeRegionPart(profileAddressForm.city)
    const district = normalizeRegionPart(profileAddressForm.district)
    const detail = normalizeDetailPart(profileAddressForm.detail)
    return [province, city, district, detail].filter(Boolean).join('')
  })

  const syncUserAddressFromForm = () => {
    userInfo.value.address = profileAddressPreview.value
  }

  watch(profileAddressPreview, () => {
    syncUserAddressFromForm()
  })

  const resetProfileAddressForm = () => {
    selectedProfileRegionCode.value = null
    profileAddressForm.province = ''
    profileAddressForm.city = ''
    profileAddressForm.district = ''
    profileAddressForm.detail = ''
  }

  const handleProfileRegionUpdate = (_value, _option, path) => {
    if (!Array.isArray(path) || path.length < 3) {
      profileAddressForm.province = ''
      profileAddressForm.city = ''
      profileAddressForm.district = ''
      return
    }

    const provinceName = normalizeOptionLabel(path[0]?.label)
    const cityNameRaw = normalizeOptionLabel(path[1]?.label)
    const districtName = normalizeOptionLabel(path[2]?.label)
    const cityName =
      cityNameRaw === '市辖区' || cityNameRaw === '县' ? provinceName : cityNameRaw

    profileAddressForm.province = provinceName
    profileAddressForm.city = cityName
    profileAddressForm.district = districtName
  }

  const hydrateProfileAddressForm = (rawAddress = '') => {
    resetProfileAddressForm()
    const normalized = String(rawAddress || '').replace(/\s+/g, '').trim()
    if (!normalized) return

    let rest = normalized
    const province = findProvinceFromAddress(normalized)
    if (province) {
      profileAddressForm.province = province
      const index = normalized.indexOf(province)
      rest = index >= 0 ? normalized.slice(index + province.length) : normalized
    }

    const cityMatch = rest.match(/^(.+?(?:市|自治州|地区|盟))/)
    if (cityMatch) {
      profileAddressForm.city = cityMatch[1]
      rest = rest.slice(cityMatch[1].length)
    }

    const districtMatch = rest.match(/^(.+?(?:区|县|旗|市))/)
    if (districtMatch) {
      profileAddressForm.district = districtMatch[1]
      rest = rest.slice(districtMatch[1].length)
    }

    if (
      !profileAddressForm.city &&
      cityOptionalProvinceSet.has(profileAddressForm.province)
    ) {
      profileAddressForm.city = profileAddressForm.province
    }

    profileAddressForm.detail = rest || normalized

    const matchedCodes = resolveRegionCodesByNames({
      province: profileAddressForm.province,
      city: profileAddressForm.city,
      district: profileAddressForm.district,
    })
    if (matchedCodes.length > 0) {
      selectedProfileRegionCode.value = matchedCodes[matchedCodes.length - 1]
    }
  }

  const getStoredUserId = () =>
    authStore.userAuth?.id || authStore.currentClientId || getAuthStorage(AUTH_SCOPE_USER, 'id')

  const parseStoredClientUserInfo = () => {
    const scopedInfo = authStore.userAuth?.info
    if (scopedInfo && typeof scopedInfo === 'object') {
      return scopedInfo
    }
    return parseJSON(getAuthStorage(AUTH_SCOPE_USER, 'userInfo'), {})
  }

  const persistLocalProfile = () => {
    syncUserAddressFromForm()
    const profile = {
      userId: Number(userInfo.value.id) || undefined,
      name: userInfo.value.name || '',
      phoneNumber: userInfo.value.phone || '',
      address: userInfo.value.address || '',
    }

    authStore.patchScopeProfile(AUTH_SCOPE_USER, {
      id: profile.userId ? String(profile.userId) : userInfo.value.id || '',
      name: userInfo.value.name || displayName.value || '用户',
      phone: userInfo.value.phone || '',
      address: userInfo.value.address || '',
      userInfo: profile,
    })
  }

  const hydrateProfileFromStorage = () => {
    const uid = getStoredUserId() || ''
    const localProfile = parseStoredClientUserInfo()
    const name =
      localProfile.name ||
      authStore.userAuth?.name ||
      localProfile.phoneNumber ||
      localProfile.phone ||
      authStore.userAuth?.phone ||
      '用户'
    const phone =
      localProfile.phoneNumber ||
      localProfile.phone ||
      authStore.userAuth?.phone ||
      ''
    const address = localProfile.address || authStore.userAuth?.address || ''

    userInfo.value.id = String(localProfile.userId || localProfile.id || uid || '')
    userInfo.value.name = name
    userInfo.value.phone = phone
    userInfo.value.address = address
    hydrateProfileAddressForm(address)

    authStore.patchScopeProfile(AUTH_SCOPE_USER, {
      id: userInfo.value.id || '',
      name,
      phone,
      address,
      userInfo: {
        userId: Number(userInfo.value.id) || undefined,
        name,
        phoneNumber: phone,
        address,
      },
    })
  }

  const fetchUserInfo = async () => {
    const uid = getStoredUserId()
    if (!uid) {
      throw new Error('登录状态异常，请重新登录')
    }

    if (!canViewUserProfile.value) {
      hydrateProfileFromStorage()
      return { code: 200, data: userInfo.value, localOnly: true }
    }

    try {
      const res = await userAPI.getUserDataById(uid)
      const profile = res?.data

      if (!profile) {
        hydrateProfileFromStorage()
        return res
      }

      const fallbackPhone = authStore.userAuth?.phone || ''
      userInfo.value.id = String(profile.id || uid)
      userInfo.value.name =
        profile.name || authStore.userAuth?.name || fallbackPhone || '用户'
      userInfo.value.phone =
        profile.phoneNumber || profile.phone || authStore.userAuth?.phone || ''
      userInfo.value.address = profile.address || authStore.userAuth?.address || ''
      hydrateProfileAddressForm(userInfo.value.address)

      persistLocalProfile()
      return res
    } catch (error) {
      console.error('获取用户信息失败', error)
      hydrateProfileFromStorage()
      return null
    }
  }

  const saveUserInfo = async () => {
    if (!userInfo.value.id) return null
    syncUserAddressFromForm()

    if (!canUpdateUserProfile.value) {
      persistLocalProfile()
      return {
        code: 200,
        data: userInfo.value,
        localOnly: true,
        msg: '已本地保存个人信息',
      }
    }

    saving.value = true
    try {
      const updateData = {
        id: userInfo.value.id,
        name: userInfo.value.name,
        phoneNumber: userInfo.value.phone,
        address: userInfo.value.address,
      }

      const res = await userAPI.updateUserData(updateData)
      if (res.code === 200) {
        persistLocalProfile()
      }
      return res
    } finally {
      saving.value = false
    }
  }

  const initializeProfile = async () => {
    hydrateProfileFromStorage()
    return fetchUserInfo()
  }

  const clearProfileState = () => {
    saving.value = false
    userInfo.value = createDefaultUserInfo()
    resetProfileAddressForm()
  }

  return {
    saving,
    userInfo,
    selectedProfileRegionCode,
    profileAddressForm,
    profileRegionCascaderOptions,
    profileAddressPreview,
    permissions,
    canViewUserProfile,
    canUpdateUserProfile,
    canApplyRefund,
    canViewRefund,
    saveProfileButtonText,
    displayName,
    handleProfileRegionUpdate,
    hydrateProfileAddressForm,
    persistLocalProfile,
    hydrateProfileFromStorage,
    fetchUserInfo,
    saveUserInfo,
    initializeProfile,
    clearProfileState,
  }
})
