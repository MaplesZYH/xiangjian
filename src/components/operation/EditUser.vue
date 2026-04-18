<template>
  <n-button size="small" type="info" @click="handleOpenModal">
    {{ props.title }}
  </n-button>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="props.title"
    size="huge"
    :style="{ width: 'min(600px, calc(100vw - 24px))' }"
    :bordered="false"
    :mask-closable="false"
  >
    <n-form :model="userForm" label-placement="left" label-width="80">
      <n-form-item label="姓名：">
        <n-input v-model:value="userForm.name" placeholder="请输入姓名" />
      </n-form-item>
      <n-form-item label="手机号：">
        <n-input
          v-model:value="userForm.phoneNumber"
          placeholder="请输入手机号"
        />
      </n-form-item>
      <n-form-item label="地址：">
        <div class="address-field">
          <n-cascader
            v-model:value="selectedRegionCode"
            :options="regionCascaderOptions"
            check-strategy="child"
            filterable
            clearable
            placeholder="请选择省 / 市 / 区"
            @update:value="handleRegionUpdate"
          />
          <n-input
            v-model:value="addressForm.detail"
            type="textarea"
            placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="120"
            show-count
          />
          <div class="address-preview">
            {{ fullAddress || '请先选择省 / 市 / 区并填写详细地址' }}
          </div>
        </div>
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="edit-user-actions responsive-actions">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="success" :loading="loading" @click="handleConfirm">
          {{ confirmButtonText }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import chinaAreaData from 'china-area-data'
import { validateStructuredAddress } from '@/utils/address'

const props = defineProps({
  title: {
    type: String,
    default: '编辑',
  },
  userData: {
    type: Object,
    default: () => ({}),
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add-user', 'update-user'])
const message = useMessage()

const showModal = ref(false)
const loading = ref(false) // 新增：控制按钮加载状态

const userForm = ref({
  name: '',
  phoneNumber: '',
  address: '',
})
const addressForm = reactive({
  province: '',
  city: '',
  district: '',
  detail: '',
})
const selectedRegionCode = ref(null)
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

const normalizeDetailPart = (value = '') =>
  String(value).replace(/\s+/g, ' ').trim()

const buildRegionCascaderOptions = () => {
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

const regionCascaderOptions = buildRegionCascaderOptions()

const fullAddress = computed(() => {
  const detail = normalizeDetailPart(addressForm.detail)
  return [
    normalizeRegionName(addressForm.province),
    normalizeRegionName(addressForm.city),
    normalizeRegionName(addressForm.district),
    detail,
  ]
    .filter(Boolean)
    .join('')
})

const confirmButtonText = computed(() => (props.isEdit ? '更新' : '添加'))

const resetAddressForm = () => {
  selectedRegionCode.value = null
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
}

const pickBestCodeByName = (codes = [], name = '') => {
  const normalizedName = normalizeRegionName(name)
  if (!codes.length || !normalizedName) return ''

  const exact = codes.find(
    (code) => normalizeRegionName(regionNameByCodeMap.get(code)) === normalizedName,
  )
  if (exact) return exact

  return (
    codes.find((code) =>
      normalizeRegionName(regionNameByCodeMap.get(code)).includes(normalizedName),
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
    cityNameRaw === '市辖区' || cityNameRaw === '县' ? provinceName : cityNameRaw

  addressForm.province = provinceName
  addressForm.city = cityName
  addressForm.district = districtName
}

const validateAddress = () => {
  const errorMessage = validateStructuredAddress({
    province: addressForm.province,
    city: addressForm.city,
    district: addressForm.district,
    detail: addressForm.detail,
    fullAddress: fullAddress.value,
    addressLabel: '地址',
    detailRequiredMessage: '请填写详细地址',
  })
  if (errorMessage) {
    message.warning(errorMessage)
    return false
  }
  return true
}

const handleOpenModal = () => {
  if (props.isEdit && props.userData) {
    userForm.value = {
      name: props.userData.name || '',
      phoneNumber: props.userData.phoneNumber || '',
      address: props.userData.address || '',
    }
    hydrateAddressForm(props.userData.address || '')
  } else {
    userForm.value = {
      name: '',
      phoneNumber: '',
      address: '',
    }
    resetAddressForm()
  }
  showModal.value = true
  loading.value = false // 重置 loading 状态
}

const handleConfirm = () => {
  // 1. 前端基础校验（可选项，防止空数据提交）
  if (!userForm.value.name.trim()) {
    message.warning('请输入姓名')
    return
  }
  if (!userForm.value.phoneNumber.trim()) {
    message.warning('请输入手机号')
    return
  }
  if (!validateAddress()) {
    return
  }

  userForm.value.address = fullAddress.value

  // 2. 开启 Loading 状态
  loading.value = true

  // 3. 定义回调函数：由父组件调用，告诉子组件是成功了还是失败了
  // success (boolean): true 代表成功，false 代表失败
  const done = (success) => {
    loading.value = false // 无论成功失败，都停止转圈
    if (success) {
      showModal.value = false // 只有成功才关闭弹窗
    }
    // 如果失败（success为false），弹窗保持打开，用户可以修改后再次提交
  }

  // 4. 将数据和回调函数一起发送给父组件
  if (props.isEdit) {
    const updateData = {
      ...userForm.value,
      id: props.userData.id,
    }
    // 传递两个参数：数据对象 + 完成回调
    emit('update-user', updateData, done)
  } else {
    emit('add-user', userForm.value, done)
  }
}
</script>

<style scoped>
.address-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-preview {
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  line-height: 1.6;
  word-break: break-all;
}

.edit-user-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
