import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import chinaAreaData from 'china-area-data'
import registerAPI from '@/api/service/register'
import { validateStructuredAddress } from '@/utils/address'
import { useOptionCatalogStore } from '@/stores/option/useOptionCatalogStore'

const serviceTypeOptions = [
  { label: '建造商', value: 1 },
  { label: '材料商', value: 2 },
  { label: '综合服务商', value: 3 },
]

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

const normalizeOptionLabel = (value = '') =>
  String(value === undefined || value === null ? '' : value).trim()

const normalizeRegionPart = (value = '') =>
  String(value).replace(/\s+/g, '').trim()

const normalizeDetailPart = (value = '') =>
  String(value).replace(/\s+/g, ' ').trim()

const buildCompanyRegionCascaderOptions = () => {
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

const companyRegionCascaderOptions = buildCompanyRegionCascaderOptions()

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

export const useVendorProfileStore = defineStore('vendorProfile', () => {
  const optionCatalogStore = useOptionCatalogStore()
  const loading = ref(false)
  const vendorInfo = ref({})
  const categoryOptions = computed(() => optionCatalogStore.userCategoryOptions)
  const uploadedFiles = ref([])
  const certificateChanged = ref(false)
  const submitting = ref(false)
  const selectedCompanyRegionCode = ref(null)

  const editForm = reactive({
    id: null,
    username: '',
    password: '',
    companyName: '',
    companyChargerName: '',
    phone: '',
    serviceType: null,
    companyAddress: '',
    companyIntroduction: '',
    materialCategoryIds: [],
  })

  const companyAddressForm = reactive({
    province: '',
    city: '',
    district: '',
    detail: '',
  })

  const companyAddressPreview = computed(() => {
    const province = normalizeRegionPart(companyAddressForm.province)
    const city = normalizeRegionPart(companyAddressForm.city)
    const district = normalizeRegionPart(companyAddressForm.district)
    const detail = normalizeDetailPart(companyAddressForm.detail)
    return [province, city, district, detail].filter(Boolean).join('')
  })

  const canEditVendorInfo = computed(() =>
    [0, 1, 2].includes(Number(vendorInfo.value?.status)),
  )

  const editTipText = computed(() => {
    const status = Number(vendorInfo.value?.status)
    if (status === 1) {
      return '审核通过后可修改企业基础信息和服务类型；如变更服务类型或资质证书，提交后会重新进入审核流程。'
    }
    if (status === 2) {
      return '当前申请正在审核中，如需调整资料或服务类型，可修改后重新提交。'
    }
    return '请根据驳回原因修改您的申请信息，修改后将重新提交审核。'
  })

  const resetCompanyAddressForm = () => {
    selectedCompanyRegionCode.value = null
    companyAddressForm.province = ''
    companyAddressForm.city = ''
    companyAddressForm.district = ''
    companyAddressForm.detail = ''
  }

  const handleCompanyRegionUpdate = (_value, _option, path) => {
    if (!Array.isArray(path) || path.length < 3) {
      companyAddressForm.province = ''
      companyAddressForm.city = ''
      companyAddressForm.district = ''
      return
    }

    const provinceName = normalizeOptionLabel(path[0]?.label)
    const cityNameRaw = normalizeOptionLabel(path[1]?.label)
    const districtName = normalizeOptionLabel(path[2]?.label)
    const cityName =
      cityNameRaw === '市辖区' || cityNameRaw === '县' ? provinceName : cityNameRaw

    companyAddressForm.province = provinceName
    companyAddressForm.city = cityName
    companyAddressForm.district = districtName
  }

  const hydrateCompanyAddressForm = (rawAddress = '') => {
    resetCompanyAddressForm()
    const normalized = String(rawAddress || '').replace(/\s+/g, '').trim()
    if (!normalized) return

    let rest = normalized
    const province = findProvinceFromAddress(normalized)
    if (province) {
      companyAddressForm.province = province
      const index = normalized.indexOf(province)
      rest = index >= 0 ? normalized.slice(index + province.length) : normalized
    }

    const cityMatch = rest.match(/^(.+?(?:市|自治州|地区|盟))/)
    if (cityMatch) {
      companyAddressForm.city = cityMatch[1]
      rest = rest.slice(cityMatch[1].length)
    }

    const districtMatch = rest.match(/^(.+?(?:区|县|旗|市))/)
    if (districtMatch) {
      companyAddressForm.district = districtMatch[1]
      rest = rest.slice(districtMatch[1].length)
    }

    if (
      !companyAddressForm.city &&
      cityOptionalProvinceSet.has(companyAddressForm.province)
    ) {
      companyAddressForm.city = companyAddressForm.province
    }

    companyAddressForm.detail = rest || normalized

    const matchedCodes = resolveRegionCodesByNames({
      province: companyAddressForm.province,
      city: companyAddressForm.city,
      district: companyAddressForm.district,
    })
    if (matchedCodes.length > 0) {
      selectedCompanyRegionCode.value = matchedCodes[matchedCodes.length - 1]
    }
  }

  const getEditValidationError = () => {
    if (uploadedFiles.value.length === 0) {
      return '请至少上传一份资质证书'
    }
    if (
      [2, 3].includes(editForm.serviceType) &&
      editForm.materialCategoryIds.length === 0
    ) {
      return '请选择主营材料'
    }

    return validateStructuredAddress({
      province: companyAddressForm.province,
      city: companyAddressForm.city,
      district: companyAddressForm.district,
      detail: companyAddressForm.detail,
      fullAddress: companyAddressPreview.value,
      addressLabel: '公司地址',
    })
  }

  const fetchVendorInfo = async (providerId) => {
    if (!providerId) return null
    loading.value = true
    try {
      const res = await registerAPI.registerInfo(providerId)
      if (res.code === 200 && res.data) {
        vendorInfo.value = res.data
      }
      return res
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async () => {
    return optionCatalogStore.fetchUserCategoryOptions()
  }

  const prepareEditForm = async () => {
    await fetchCategories()
    const info = vendorInfo.value
    editForm.id = info.id
    editForm.username = info.username
    editForm.password = ''
    editForm.companyName = info.companyName
    editForm.companyChargerName = info.companyChargerName
    editForm.phone = info.phone
    editForm.serviceType = info.serviceType
    editForm.companyAddress = info.companyAddress
    editForm.companyIntroduction = info.companyIntroduction
    hydrateCompanyAddressForm(info.companyAddress)

    if (info.materialCategory) {
      editForm.materialCategoryIds = info.materialCategory.map((m) => m.id)
    } else {
      editForm.materialCategoryIds = []
    }

    if (info.certificate) {
      uploadedFiles.value = info.certificate.map((c) => ({
        url: c.fileUrl,
        id: c.id,
      }))
    } else {
      uploadedFiles.value = []
    }

    certificateChanged.value = false
  }

  const uploadCertificate = async (rawFile) => {
    const fd = new FormData()
    fd.append('file', rawFile)
    const res = await registerAPI.registerCertificate(fd)
    if (res.code === 200 && res.data) {
      uploadedFiles.value.push({ url: res.data, id: null })
      certificateChanged.value = true
    }
    return res
  }

  const deleteCertificate = async (file, index) => {
    if (file?.id) {
      const res = await registerAPI.registerCertificateDelete(
        vendorInfo.value.id,
        file.id,
      )
      if (res.code === 200) {
        uploadedFiles.value.splice(index, 1)
        certificateChanged.value = true
      }
      return res
    }

    uploadedFiles.value.splice(index, 1)
    certificateChanged.value = true
    return { code: 200, data: null, msg: '操作成功' }
  }

  const submitEdit = async () => {
    submitting.value = true
    try {
      const certList = uploadedFiles.value.map((f) => ({
        id: f.id,
        fileUrl: f.url,
      }))

      let matList = []
      if ([2, 3].includes(editForm.serviceType)) {
        matList = editForm.materialCategoryIds.map((id) => {
          const opt = categoryOptions.value.find((o) => o.value === id)
          return { id, name: opt ? opt.label : '' }
        })
      }

      const payload = {
        id: editForm.id,
        username: editForm.username,
        companyName: editForm.companyName,
        phone: editForm.phone,
        companyChargerName: editForm.companyChargerName,
        companyAddress: companyAddressPreview.value,
        serviceType: editForm.serviceType,
        companyIntroduction: editForm.companyIntroduction,
        materialCategory: matList,
        longitude: vendorInfo.value.longitude || 0,
        latitude: vendorInfo.value.latitude || 0,
      }

      if (Number(vendorInfo.value.status) !== 1) {
        payload.password = editForm.password
      }

      if (
        Number(vendorInfo.value.status) !== 1 ||
        certificateChanged.value
      ) {
        payload.certificate = certList
      }

      return Number(vendorInfo.value.status) === 1
        ? await registerAPI.registerEditAfter(payload)
        : await registerAPI.registerEdit(payload)
    } finally {
      submitting.value = false
    }
  }

  const clearProfileState = () => {
    loading.value = false
    vendorInfo.value = {}
    uploadedFiles.value = []
    certificateChanged.value = false
    submitting.value = false
    selectedCompanyRegionCode.value = null
    editForm.id = null
    editForm.username = ''
    editForm.password = ''
    editForm.companyName = ''
    editForm.companyChargerName = ''
    editForm.phone = ''
    editForm.serviceType = null
    editForm.companyAddress = ''
    editForm.companyIntroduction = ''
    editForm.materialCategoryIds = []
    resetCompanyAddressForm()
  }

  return {
    loading,
    vendorInfo,
    categoryOptions,
    uploadedFiles,
    certificateChanged,
    submitting,
    editForm,
    companyAddressForm,
    selectedCompanyRegionCode,
    companyRegionCascaderOptions,
    companyAddressPreview,
    canEditVendorInfo,
    editTipText,
    serviceTypeOptions,
    handleCompanyRegionUpdate,
    hydrateCompanyAddressForm,
    getEditValidationError,
    fetchVendorInfo,
    fetchCategories,
    prepareEditForm,
    uploadCertificate,
    deleteCertificate,
    submitEdit,
    clearProfileState,
  }
})
