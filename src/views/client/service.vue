<template>
  <Navigation />
  <div class="nav-placeholder" :style="{ height: navHeight + 'px' }"></div>

  <main class="service-page">
    <section class="hero-section">
      <div class="hero-content">
        <p class="hero-kicker">SUPPLY CHAIN PARTNER</p>
        <h1>加入供应链</h1>
        <p>成为我们的合作伙伴，共建乡村建设新生态</p>
      </div>
    </section>

    <section class="form-container">
      <div class="form-header">
        <h2>资质申请</h2>
      </div>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="top"
        require-mark-placement="right-hanging"
        size="large"
        class="service-form"
      >
        <section class="form-section">
          <div class="section-title">
            <span class="section-badge">01</span>
            <span>账号注册</span>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <n-form-item label="登录账号" path="username">
                <n-input
                  v-model:value="formData.username"
                  placeholder="设置登录账号"
                  clearable
                />
              </n-form-item>
            </div>

            <div class="form-group">
              <n-form-item label="登录密码" path="password">
                <n-input
                  v-model:value="formData.password"
                  type="password"
                  show-password-on="click"
                  placeholder="设置登录密码（8-20位，包含字母、数字和特殊字符）"
                  clearable
                />
              </n-form-item>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">
            <span class="section-badge">02</span>
            <span>详细信息</span>
          </div>
          <div class="form-grid">
            <div class="form-group full-width">
              <n-form-item label="公司名称" path="companyName">
                <n-input
                  v-model:value="formData.companyName"
                  placeholder="请输入营业执照上的完整公司名称"
                  clearable
                />
              </n-form-item>
            </div>

            <div class="form-group full-width">
              <n-form-item label="公司地址" path="companyAddress" required>
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
                    placeholder="请输入详细街道门牌，例如：科华北路88号A栋1201"
                    :rows="2"
                    maxlength="120"
                    show-count
                  />
                </div>
              </n-form-item>
            </div>

            <div class="form-group">
              <n-form-item label="联系人" path="companyChargerName">
                <n-input
                  v-model:value="formData.companyChargerName"
                  placeholder="请输入负责人姓名"
                  clearable
                />
              </n-form-item>
            </div>

            <div class="form-group">
              <n-form-item label="联系电话" path="phone">
                <n-input
                  v-model:value="formData.phone"
                  placeholder="请输入 11 位手机号"
                  clearable
                />
              </n-form-item>
            </div>

            <div class="form-group full-width">
              <n-form-item label="服务类型" path="serviceType">
                <div class="radio-cards">
                  <label
                    v-for="option in serviceTypeCards"
                    :key="option.value"
                    class="radio-card"
                  >
                    <input
                      type="radio"
                      name="serviceType"
                      :value="option.value"
                      :checked="formData.serviceType === option.value"
                      @change="formData.serviceType = option.value"
                    />
                    <span class="radio-card-content">
                      <span class="radio-card-mark">
                        <n-icon size="22" :component="option.icon" />
                      </span>
                      <span class="radio-card-title">{{ option.label }}</span>
                      <span class="radio-card-desc">{{ option.desc }}</span>
                    </span>
                  </label>
                </div>
              </n-form-item>
            </div>

            <div
              v-if="[2, 3].includes(formData.serviceType)"
              class="form-group full-width"
            >
              <n-form-item label="主营材料品类" path="materialCategoryIds">
                <n-select
                  v-model:value="formData.materialCategoryIds"
                  placeholder="请选择主营材料品类（可多选）"
                  :options="categoryOptions"
                  multiple
                  clearable
                  filterable
                />
              </n-form-item>
            </div>

            <div class="form-group full-width">
              <n-form-item label="公司介绍（选填）" path="companyIntroduction">
                <n-input
                  v-model:value="formData.companyIntroduction"
                  type="textarea"
                  :rows="4"
                  placeholder="简要介绍您的公司业务、核心优势及过往案例..."
                  clearable
                />
              </n-form-item>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">
            <span class="section-badge">03</span>
            <span>资质证书上传</span>
          </div>
          <div class="form-grid">
            <div class="form-group full-width">
              <n-form-item
                label="营业执照及相关资质"
                path="certificateFiles"
                required
                class="certificate-upload-item"
              >
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  class="native-file-input"
                  @change="handleFileSelect"
                />
                <div class="upload-zone" @click="triggerFileInput">
                  <div class="upload-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 16V8M12 8L8.5 11.5M12 8l3.5 3.5M20 16.5a3.5 3.5 0 0 1-3.5 3.5h-9A4.5 4.5 0 0 1 7 11.08 5.5 5.5 0 0 1 17.74 9 4 4 0 0 1 20 16.5Z"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div class="upload-text">点击或将文件拖拽到此处上传</div>
                  <div class="upload-hint">
                    支持 .jpg, .png, .pdf, .doc, .docx 格式，每个文件不超过
                    100MB
                  </div>
                </div>

                <div v-if="uploadedFiles.length > 0" class="file-list">
                  <div
                    v-for="(file, index) in uploadedFiles"
                    :key="`${file.name}-${index}`"
                    class="file-item"
                  >
                    <div class="file-info">
                      <span class="file-icon">FILE</span>
                      <div class="file-meta">
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      </div>
                      <span
                        class="file-status"
                        :class="{
                          pending: file.status === 'pending',
                          success: file.status === 'success',
                          error: file.status === 'error',
                        }"
                      >
                        {{
                          file.status === 'pending'
                            ? '等待上传'
                            : file.status === 'success'
                            ? '已准备'
                            : file.status === 'error'
                            ? '上传失败'
                            : '上传中...'
                        }}
                      </span>
                    </div>
                    <button
                      type="button"
                      class="file-delete"
                      @click="removeFile(index)"
                      :disabled="file.status === 'uploading'"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </n-form-item>
            </div>
          </div>
        </section>

        <div class="submit-section">
          <n-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="submitting || uploading"
            :disabled="uploadedFiles.length === 0"
            @click="handleSubmit"
          >
            提交资质申请
          </n-button>
          <p class="agreement-tip">
            点击"提交资质申请"即表示已阅读并同意
            <a href="#">《平台供应商服务协议》</a>
            及
            <a href="#">《隐私政策》</a>
          </p>
        </div>
      </n-form>
    </section>
  </main>

  <Footer></Footer>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import chinaAreaData from 'china-area-data'
import Footer from '@/components/client/Footer.vue'
import {
  HammerOutline,
  LayersOutline,
  HomeOutline,
} from '@/icons/ionicons'
import API from '@/api/service/register'
import { validateStructuredAddress } from '@/utils/address'
import { useOptionCatalogStore } from '@/stores/option/useOptionCatalogStore'

const router = useRouter()
const message = useMessage()
const optionCatalogStore = useOptionCatalogStore()
const formRef = ref(null)
const fileInput = ref(null)
const strongPasswordPattern =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/
const mainlandMobilePattern = /^1[3-9]\d{9}$/
const CERTIFICATE_MAX_SIZE_MB = 100

// 获取导航栏高度
const navHeight = ref(0)
let navResizeObserver = null
const updateNavHeight = () => {
  const nav = document.querySelector('.navbar')
  if (nav) navHeight.value = nav.offsetHeight
}

const observeNavHeight = () => {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
    return
  }

  const nav = document.querySelector('.navbar')
  if (!nav) return

  navResizeObserver?.disconnect()
  navResizeObserver = new ResizeObserver(() => {
    updateNavHeight()
  })
  navResizeObserver.observe(nav)
}

// 选配产品分类选项
const categoryOptions = ref([])
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

const normalizeOptionLabel = (value = '') =>
  String(value === undefined || value === null ? '' : value).trim()

const normalizeRegionPart = (value = '') =>
  String(value || '').replace(/\s+/g, '').trim()

const normalizeDetailPart = (value = '') =>
  String(value || '').replace(/\s+/g, ' ').trim()

const buildRegionCascaderOptions = () => {
  const provinceEntries = Object.entries(regionRootMap)
  return provinceEntries.map(([provinceCode, provinceName]) => {
    const cityMap = rawRegionData[provinceCode] || {}
    const cityEntries = Object.entries(cityMap)

    return {
      label: provinceName,
      value: provinceCode,
      children: cityEntries.map(([cityCode, cityName]) => {
        regionNameByCodeMap.set(cityCode, cityName)

        const districtMap = rawRegionData[cityCode] || {}
        const districtEntries = Object.entries(districtMap)

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
const companyAddressPreview = computed(() => {
  const province = normalizeRegionPart(addressForm.province)
  const city = normalizeRegionPart(addressForm.city)
  const district = normalizeRegionPart(addressForm.district)
  const detail = normalizeDetailPart(addressForm.detail)
  return [province, city, district, detail].filter(Boolean).join('')
})

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

const resetAddressForm = () => {
  selectedRegionCode.value = null
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
}

// 表单数据
const formData = ref({
  username: '',
  password: '',
  companyName: '',
  companyAddress: '',
  certificateFiles: [],
  companyChargerName: '', //联系人
  phone: '', //联系电话
  serviceType: null,
  materialCategoryIds: [], // 存储选中的材料ID
  companyIntroduction: '',
})

// 文件相关状态
const uploadedFiles = ref([]) // 选择的文件列表
const uploading = ref(false) // 上传中状态
const submitting = ref(false) // 提交中状态

// 服务类型选项
const serviceTypeCards = [
  {
    label: '建造商',
    value: 1,
    icon: HammerOutline,
    desc: '施工建造与现场执行',
  },
  {
    label: '材料商',
    value: 2,
    icon: LayersOutline,
    desc: '主营建材供应与配送',
  },
  {
    label: '综合服务商',
    value: 3,
    icon: HomeOutline,
    desc: '建造与材料一体协同',
  },
]

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入账号', trigger: ['blur', 'input'] },
    {
      min: 4,
      max: 24,
      message: '账号长度必须在 4-24 位之间',
      trigger: ['blur', 'input'],
    },
    {
      pattern: /^[A-Za-z0-9_]+$/,
      message: '账号只能包含字母、数字和下划线',
      trigger: ['blur', 'input'],
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
    {
      min: 8,
      max: 20,
      message: '密码长度必须在 8-20 位之间',
      trigger: ['blur', 'input'],
    },
    {
      pattern: strongPasswordPattern,
      message: '密码必须包含字母、数字和特殊字符',
      trigger: ['blur', 'input'],
    },
  ],
  companyName: [
    { required: true, message: '请输入公司名称', trigger: ['blur', 'input'] },
  ],
  companyAddress: [
    {
      required: true,
      validator: () => {
        const errorMessage = validateStructuredAddress({
          province: addressForm.province,
          city: addressForm.city,
          district: addressForm.district,
          detail: addressForm.detail,
          fullAddress: companyAddressPreview.value,
          addressLabel: '公司地址',
        })
        if (errorMessage) {
          return new Error(errorMessage)
        }
        return true
      },
      trigger: ['blur', 'change', 'input'],
    },
  ],
  certificateFiles: [
    {
      validator: () => {
        if (!uploadedFiles.value.length) {
          return new Error('请至少上传一份资质证书')
        }
        return true
      },
      trigger: ['change', 'blur'],
    },
  ],
  companyChargerName: [
    { required: true, message: '请输入联系人姓名', trigger: ['blur', 'input'] },
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: ['blur', 'input'] },
    {
      pattern: mainlandMobilePattern,
      message: '联系电话必须是 11 位中国大陆手机号',
      trigger: ['blur', 'input'],
    },
  ],
  serviceType: [
    {
      type: 'number',
      required: true,
      message: '请选择服务类型',
      trigger: ['blur', 'change'],
    },
  ],
  materialCategoryIds: [
    {
      validator: (rule, value) => {
        // 如果服务类型是 2 或 3，则必须选择材料
        if ([2, 3].includes(formData.value.serviceType)) {
          if (!value || value.length === 0) {
            return new Error('请选择至少一种主营材料品类')
          }
        }
        return true
      },
      trigger: ['blur', 'change'],
    },
  ],
}

// 监听服务类型变化，如果切换到非材料商（1），清空已选材料
watch(
  () => formData.value.serviceType,
  (newVal) => {
    if (newVal === 1) {
      formData.value.materialCategoryIds = []
    }
  }
)

watch(
  companyAddressPreview,
  (value) => {
    formData.value.companyAddress = value
  },
  { immediate: true },
)

watch(
  uploadedFiles,
  (files) => {
    formData.value.certificateFiles = Array.isArray(files) ? [...files] : []
  },
  { deep: true, immediate: true },
)

// 获取选配产品分类
const fetchCategories = async () => {
  try {
    const res = await optionCatalogStore.fetchUserCategoryOptions()
    if (res.code === 200) {
      categoryOptions.value = optionCatalogStore.userCategoryOptions
    }
  } catch (error) {
    console.error('获取材料分类失败', error)
    // 可以选择不提示，因为这不是主要阻断性错误，或者提示用户刷新
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择 - 只添加文件到列表，不立即上传
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)

  files.forEach((file) => {
    // 验证文件大小
    if (file.size > CERTIFICATE_MAX_SIZE_MB * 1024 * 1024) {
      message.error(
        `文件 ${file.name} 大小超过 ${CERTIFICATE_MAX_SIZE_MB}MB`,
      )
      return
    }

    // 添加到文件列表，状态为 pending（等待上传）
    uploadedFiles.value.push({
      file: file,
      name: file.name,
      size: file.size,
      status: 'pending', // 初始状态为等待上传
    })
  })

  // 清空文件输入
  event.target.value = ''
}

// 上传单个文件
const uploadFile = async (fileItem, index) => {
  try {
    const fd = new FormData()
    fd.append('file', fileItem.file)

    // 调用文件上传接口
    const result = await API.registerCertificate(fd)

    // 检查响应：后端返回的文件URL在 result.data 中
    if (result.code === 200 && result.data) {
      // 更新状态为成功，并保存URL
      uploadedFiles.value[index].url = result.data
      uploadedFiles.value[index].status = 'success'
      return { success: true, url: result.data }
    } else {
      uploadedFiles.value[index].status = 'error'
      return { success: false, error: result.msg || '上传接口返回错误' }
    }
  } catch (error) {
    uploadedFiles.value[index].status = 'error'
    console.error(`文件 ${index} 上传异常:`, error)
    return { success: false, error: error.message }
  }
}

// 批量上传所有文件
const uploadAllFiles = async () => {
  uploading.value = true

  // 遍历文件列表，只上传未成功的
  for (let i = 0; i < uploadedFiles.value.length; i++) {
    const fileItem = uploadedFiles.value[i]
    if (fileItem.status === 'pending' || fileItem.status === 'error') {
      uploadedFiles.value[i].status = 'uploading'
      // 串行或并行均可，这里用 await 串行方便调试，如果需要更快可用 Promise.all
      const res = await uploadFile(fileItem, i)
      if (!res.success) {
        uploading.value = false
        return false // 只要有一个失败就中断
      }
    }
  }

  uploading.value = false
  return true
}

// 删除文件
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

// 表单提交
const handleSubmit = async (e) => {
  e.preventDefault()

  formRef.value?.validate(async (errors) => {
    if (!errors) {
      // 1. 检查是否有文件
      if (uploadedFiles.value.length === 0) {
        message.warning('请至少上传一份资质证书')
        return
      }

      submitting.value = true

      try {
        // 2. 先执行所有文件的上传
        message.loading('正在上传资质文件...')
        const uploadSuccess = await uploadAllFiles()

        if (!uploadSuccess) {
          message.error('部分文件上传失败，请重试')
          submitting.value = false
          return
        }

        // 3. 构建 certificate 数组结构
        const certificateList = uploadedFiles.value
          .filter((f) => f.status === 'success' && f.url)
          .map((f, index) => ({
            id: index + 1, // 递增ID
            fileUrl: f.url,
          }))

        if (certificateList.length === 0) {
          message.error('文件信息获取失败')
          submitting.value = false
          return
        }

        // 4. 构建 materialCategory 数组
        let materialCategoryList = []
        if ([2, 3].includes(formData.value.serviceType)) {
          materialCategoryList = formData.value.materialCategoryIds.map(
            (id) => {
              const opt = categoryOptions.value.find((o) => o.value === id)
              return {
                id: id,
                name: opt ? opt.label : '',
              }
            }
          )
        }

        // 5. 构建提交数据
        const submitData = {
          username: formData.value.username,
          password: formData.value.password,
          companyName: formData.value.companyName,
          phone: formData.value.phone,
          companyChargerName: formData.value.companyChargerName,
          companyAddress: companyAddressPreview.value,
          serviceType: formData.value.serviceType, // 1, 2, or 3
          companyIntroduction: formData.value.companyIntroduction || '',
          certificate: certificateList,
          materialCategory: materialCategoryList, // 新增字段
          // 可选参数
          longitude: 0,
          latitude: 0,
        }

        // 6. 调用注册接口
        const result = await API.registerService(submitData)

        if (result.code === 200) {
          message.success('申请提交成功，请等待审核！')
          // 重置表单
          formRef.value?.restoreValidation()
          Object.keys(formData.value).forEach((key) => {
            if (key === 'serviceType') {
              formData.value[key] = null
            } else if (key === 'materialCategoryIds') {
              formData.value[key] = []
            } else if (key === 'certificateFiles') {
              formData.value[key] = []
            } else {
              formData.value[key] = ''
            }
          })
          resetAddressForm()
          uploadedFiles.value = []
          router.push('/') // 跳转回首页或登录页
        } else {
          message.error(result.msg || '提交失败，请重试')
        }
      } catch (error) {
        console.error('提交错误:', error)
        message.error('网络请求失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    } else {
      message.error('请完善表单必填信息')
    }
  })
}

onMounted(() => {
  updateNavHeight()
  observeNavHeight()
  fetchCategories() // 加载选配分类数据
})

onBeforeUnmount(() => {
  navResizeObserver?.disconnect()
  navResizeObserver = null
})
</script>

<style lang="scss" scoped>
.service-page {
  --brand-color: #276e3d;
  --brand-hover: #1e5931;
  --brand-light: #eefdf2;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --bg-page: #f4f7f6;
  --bg-surface: #ffffff;
  --border-color: #e5e7eb;
  --border-focus: #4ade80;
  --radius-md: 8px;
  --radius-lg: 16px;
  --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  --shadow-lg:
    0 20px 25px -5px rgba(0, 0, 0, 0.05),
    0 10px 10px -5px rgba(0, 0, 0, 0.02);
  background-color: var(--bg-page);
  color: var(--text-main);
}

.nav-placeholder {
  transition: height 0.3s ease;
}

.hero-section {
  min-height: 320px;
  padding: 40px 20px;
  background:
    linear-gradient(rgba(18, 54, 35, 0.54), rgba(20, 65, 43, 0.62)),
    url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80')
      center 58%/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #ffffff;
}

.hero-content {
  max-width: 900px;
}

.hero-kicker {
  margin: 0 0 18px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 3px;
  opacity: 0.82;
}

.hero-content h1 {
  margin: 0 0 16px;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 2px;
}

.hero-content p:last-child {
  margin: 0;
  font-size: 18px;
  opacity: 0.92;
}

.form-container {
  position: relative;
  z-index: 2;
  width: min(calc(100% - 32px), 900px);
  margin: -60px auto 60px;
  padding: 48px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
}

.form-header {
  margin-bottom: 40px;
  text-align: center;
}

.form-header h2 {
  position: relative;
  display: inline-block;
  margin: 0;
  font-size: 24px;
  color: var(--text-main);
}

.form-header h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  border-radius: 2px;
  background: var(--brand-color);
}

.service-form {
  :deep(.n-form-item) {
    margin-bottom: 0;
  }

  :deep(.n-form-item-feedback-wrapper) {
    min-height: 24px;
  }

  :deep(.n-form-item-label) {
    padding-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
  }

  :deep(.certificate-upload-item .n-form-item-blank),
  :deep(.certificate-upload-item .n-form-item-blank__content) {
    width: 100%;
  }

  :deep(.n-input),
  :deep(.n-base-selection) {
    border-radius: var(--radius-md);
  }

  :deep(.n-input .n-input__border),
  :deep(.n-base-selection .n-base-selection__border) {
    border-color: var(--border-color);
  }

  :deep(.n-input.n-input--focus),
  :deep(.n-base-selection.n-base-selection--active) {
    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
  }
}

.form-section {
  margin-bottom: 40px;
}

.form-section:last-of-type {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--brand-light);
  color: var(--brand-color);
  font-size: 12px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-group {
  min-width: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.address-field {
  display: grid;
  gap: 12px;
  width: 100%;
}

.radio-cards {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.radio-card {
  position: relative;
  display: block;
  cursor: pointer;
  min-width: 0;
}

.radio-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-card-content {
  display: flex;
  width: 100%;
  min-height: 148px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 16px;
  text-align: center;
  box-sizing: border-box;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.radio-card:hover .radio-card-content {
  transform: translateY(-1px);
  border-color: rgba(39, 110, 61, 0.35);
}

.radio-card-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

.radio-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.radio-card-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.radio-card input:checked + .radio-card-content {
  border-color: var(--brand-color);
  background: var(--brand-light);
  box-shadow: 0 0 0 1px var(--brand-color);
}

.radio-card input:checked + .radio-card-content .radio-card-mark {
  background: var(--brand-color);
  color: #ffffff;
}

.radio-card input:checked + .radio-card-content .radio-card-title,
.radio-card input:checked + .radio-card-content .radio-card-desc {
  color: var(--brand-color);
}

.upload-label {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.native-file-input {
  display: none;
}

.upload-zone {
  width: 100%;
  box-sizing: border-box;
  padding: 40px 20px;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  background: #fcfcfc;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.upload-zone:hover {
  border-color: var(--brand-color);
  background: var(--brand-light);
  transform: translateY(-1px);
}

.upload-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  color: var(--brand-color);
}

.upload-text {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 500;
}

.upload-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-page);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.file-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 30px;
  padding: 0 8px;
  border-radius: 999px;
  background: #e5e7eb;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: #9ca3af;
}

.file-status {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--text-muted);
}

.file-status.success {
  color: #16a34a;
}

.file-status.error {
  color: #dc2626;
}

.file-delete {
  flex: 0 0 auto;
  border: none;
  background: none;
  padding: 4px;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.file-delete:hover:not(:disabled) {
  opacity: 0.72;
}

.file-delete:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.submit-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.submit-btn {
  min-width: 260px;
  height: 52px;
  padding: 0 40px;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
}

:deep(.submit-btn.n-button) {
  --n-color: var(--brand-color);
  --n-color-hover: var(--brand-hover);
  --n-color-pressed: #194b2a;
  --n-color-focus: var(--brand-hover);
  --n-border: 1px solid var(--brand-color);
  box-shadow: 0 4px 6px rgba(39, 110, 61, 0.2);
}

.agreement-tip {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.8;
}

.agreement-tip a {
  color: var(--brand-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 260px;
    padding: 32px 16px;
  }

  .hero-content h1 {
    font-size: 28px;
  }

  .hero-content p:last-child {
    font-size: 16px;
  }

  .form-container {
    width: auto;
    margin: -30px 16px 40px;
    padding: 24px 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .radio-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .radio-card-content {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 14px;
    padding: 16px 14px;
    text-align: left;
  }

  .radio-card-mark {
    min-width: 42px;
    height: 42px;
    padding: 0;
    flex: 0 0 42px;
  }

  .radio-card-title {
    font-size: 14px;
  }

  .radio-card-desc {
    font-size: 12px;
    line-height: 1.45;
  }

  .file-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .file-info {
    width: 100%;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .file-status {
    margin-left: 56px;
  }

  .submit-btn {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 576px) {
  .service-form :deep(.n-form-item-label) {
    font-size: 13px;
  }

  .radio-cards {
    gap: 10px;
  }

  .radio-card-content {
    gap: 12px;
    padding: 14px 12px;
    border-radius: 12px;
  }

  .radio-card-mark {
    min-width: 38px;
    height: 38px;
    flex-basis: 38px;
  }

  .radio-card-mark :deep(.n-icon) {
    font-size: 18px;
  }

  .radio-card-title {
    font-size: 13px;
  }

  .radio-card-desc {
    font-size: 11px;
  }
}
</style>
