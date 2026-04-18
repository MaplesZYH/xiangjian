import { computed, reactive, ref } from 'vue'
import chinaAreaData from 'china-area-data'
import { validateStructuredAddress } from '@/utils/address'

const rawRegionData = chinaAreaData?.default || chinaAreaData || {}
const regionRootMap = rawRegionData['86'] || {}
const regionNameByCodeMap = new Map()
const provinceCodeByNameMap = new Map()
const cityCodesByProvinceMap = new Map()
const districtCodesByCityMap = new Map()

const normalizeOptionLabel = (value = '') =>
  String(value === undefined || value === null ? '' : value).trim()

const normalizeRegionName = (value = '') =>
  String(value || '').replace(/\s+/g, '').trim()

const normalizeRegionPart = (value = '') =>
  String(value || '').replace(/\s+/g, '').trim()

const normalizeDetailPart = (value = '') =>
  String(value || '').replace(/\s+/g, ' ').trim()

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

const buildRegionCascaderOptions = () =>
  Object.entries(regionRootMap).map(([provinceCode, provinceName]) => {
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

const regionCascaderOptions = buildRegionCascaderOptions()

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

const getRegionNameByCode = (code) =>
  regionNameByCodeMap.get(String(code || '')) || ''

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

export const useStructuredAddressForm = ({
  addressLabel = '地址',
  detailRequiredMessage = '请填写详细地址（街道门牌）',
  maxLength = 200,
} = {}) => {
  const addressForm = reactive({
    province: '',
    city: '',
    district: '',
    detail: '',
  })
  const selectedRegionCode = ref(null)

  const addressPreview = computed(() => {
    const province = normalizeRegionPart(addressForm.province)
    const city = normalizeRegionPart(addressForm.city)
    const district = normalizeRegionPart(addressForm.district)
    const detail = normalizeDetailPart(addressForm.detail)
    return [province, city, district, detail].filter(Boolean).join('')
  })

  const resetAddressForm = () => {
    selectedRegionCode.value = null
    addressForm.province = ''
    addressForm.city = ''
    addressForm.district = ''
    addressForm.detail = ''
  }

  const handleRegionUpdate = (_value, _option, path) => {
    if (!Array.isArray(path) || path.length < 3) {
      addressForm.province = ''
      addressForm.city = ''
      addressForm.district = ''
      return
    }

    const provinceName = normalizeOptionLabel(path[0]?.label)
    const cityNameRaw = normalizeOptionLabel(path[1]?.label)
    const districtName = normalizeOptionLabel(path[2]?.label)
    const cityName =
      cityNameRaw === '市辖区' || cityNameRaw === '县'
        ? provinceName
        : cityNameRaw

    addressForm.province = provinceName
    addressForm.city = cityName
    addressForm.district = districtName
  }

  const hydrateAddressForm = (rawAddress = '') => {
    resetAddressForm()
    const normalized = String(rawAddress || '').replace(/\s+/g, '').trim()
    if (!normalized) return

    let rest = normalized
    const province = findProvinceFromAddress(normalized)
    if (province) {
      addressForm.province = province
      const index = normalized.indexOf(province)
      rest = index >= 0 ? normalized.slice(index + province.length) : normalized
    }

    const cityMatch = rest.match(/^(.+?(?:市|自治州|地区|盟))/)
    if (cityMatch) {
      addressForm.city = cityMatch[1]
      rest = rest.slice(cityMatch[1].length)
    }

    const districtMatch = rest.match(/^(.+?(?:区|县|旗|市))/)
    if (districtMatch) {
      addressForm.district = districtMatch[1]
      rest = rest.slice(districtMatch[1].length)
    }

    if (!addressForm.city && cityOptionalProvinceSet.has(addressForm.province)) {
      addressForm.city = addressForm.province
    }

    addressForm.detail = rest || normalized

    const matchedCodes = resolveRegionCodesByNames({
      province: addressForm.province,
      city: addressForm.city,
      district: addressForm.district,
    })
    if (matchedCodes.length > 0) {
      selectedRegionCode.value = matchedCodes[matchedCodes.length - 1]
    }
  }

  const validateAddressForm = () =>
    validateStructuredAddress({
      province: addressForm.province,
      city: addressForm.city,
      district: addressForm.district,
      detail: addressForm.detail,
      fullAddress: addressPreview.value,
      addressLabel,
      detailRequiredMessage,
      maxLength,
    })

  return {
    addressForm,
    selectedRegionCode,
    regionCascaderOptions,
    addressPreview,
    resetAddressForm,
    handleRegionUpdate,
    hydrateAddressForm,
    validateAddressForm,
  }
}
