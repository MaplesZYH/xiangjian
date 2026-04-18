<template>
  <Navigation />
  <main class="house-detail-page">
    <section class="breadcrumb-section">
      <div class="container">
        <n-breadcrumb>
          <n-breadcrumb-item @click="$router.push('/')">首页</n-breadcrumb-item>
          <n-breadcrumb-item @click="$router.push('/houseList')"
            >户型选择</n-breadcrumb-item
          >
          <n-breadcrumb-item>{{ houseData.name }}</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
    </section>

    <section class="house-main-section">
      <div class="container">
        <section class="gallery-grid">
          <SmartImage
            class="gallery-item gallery-main"
            :src="houseData.images?.[0]"
            :alt="`${houseData.name || '户型'}-主图`"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            :placeholder="defaultDetailImage"
            @click="currentImageIndex = 0; showImagePreview = true"
          />
          <SmartImage
            class="gallery-item"
            :src="
              houseData.images?.[1] ||
              houseData.images?.[0]
            "
            :alt="`${houseData.name || '户型'}-副图1`"
            loading="lazy"
            decoding="async"
            :placeholder="defaultDetailImage"
            @click="currentImageIndex = Math.min(1, Math.max(totalImages - 1, 0)); showImagePreview = true"
          />
          <SmartImage
            class="gallery-item"
            :src="
              houseData.images?.[2] ||
              houseData.images?.[1] ||
              houseData.images?.[0]
            "
            :alt="`${houseData.name || '户型'}-副图2`"
            loading="lazy"
            decoding="async"
            :placeholder="defaultDetailImage"
            @click="currentImageIndex = Math.min(2, Math.max(totalImages - 1, 0)); showImagePreview = true"
          />
          <button
            class="gallery-btn"
            type="button"
            @click="currentImageIndex = 0; showImagePreview = true"
          >
            查看全部 {{ totalImages || 1 }} 张图片
          </button>
        </section>

        <div class="main-layout">
          <div class="content-left">
            <div class="house-header">
              <div class="house-header-copy">
                <h1 class="house-title">{{ houseData.name }}</h1>
                <p class="house-subtitle">{{ houseData.description }}</p>
              </div>
              <button
                v-if="shouldShowCollectButton"
                class="btn-favorite"
                :class="{ active: isCurrentCollected }"
                type="button"
                :disabled="collectLoading"
                @click="toggleCollectCurrent"
              >
                <n-icon size="20">
                  <heart-icon v-if="isCurrentCollected" />
                  <heart-outline-icon v-else />
                </n-icon>
              </button>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <div class="meta-info">
                  <h4>建筑面积</h4>
                  <p>{{ houseData.buildArea || '--' }} ㎡</p>
                </div>
              </div>
              <div class="meta-item">
                <div class="meta-info">
                  <h4>户型结构</h4>
                  <p>
                    {{ houseData.roomLayout?.[0] || 0 }}室
                    {{ houseData.roomLayout?.[1] || 0 }}厅
                    {{ houseData.roomLayout?.[2] || 0 }}卫
                  </p>
                </div>
              </div>
              <div class="meta-item">
                <div class="meta-info">
                  <h4>建筑层数</h4>
                  <p>{{ houseData.floors || '--' }} 层</p>
                </div>
              </div>
              <div class="meta-item">
                <div class="meta-info">
                  <h4>施工方式</h4>
                  <p>{{ houseData.constructionMethod || '--' }}</p>
                </div>
              </div>
            </div>

            <section class="content-section">
              <h2 class="section-title">设计理念与特点</h2>
              <p class="desc-text">{{ houseData.details }}</p>
              <p class="desc-text">{{ houseData.designConcept }}</p>
            </section>

            <section class="content-section detail-sections-panel">
              <div class="detail-sections-header">
                <h2 class="section-title">户型资料</h2>
                <div class="detail-tags" role="tablist" aria-label="户型资料分类">
                  <button
                    v-for="tag in detailSectionTags"
                    :key="tag.value"
                    type="button"
                    class="detail-tag-button"
                    :class="{ active: activeDetailSection === tag.value }"
                    @click="activeDetailSection = tag.value"
                  >
                    {{ tag.label }}
                  </button>
                </div>
              </div>

              <div
                v-if="activeDetailSection === 'params'"
                class="detail-panel-content"
              >
                <table class="params-table tech-table">
                  <tbody>
                    <tr>
                      <th>占地面积</th>
                      <td>{{ houseData.baseArea || '--' }} ㎡</td>
                    </tr>
                    <tr>
                      <th>建筑面积</th>
                      <td>{{ houseData.buildArea || '--' }} ㎡</td>
                    </tr>
                    <tr>
                      <th>建筑风格</th>
                      <td>{{ formatStyle(houseData.style) }}</td>
                    </tr>
                    <tr>
                      <th>施工方式</th>
                      <td>{{ houseData.constructionMethod || '--' }}</td>
                    </tr>
                    <tr>
                      <th>建筑层数</th>
                      <td>{{ houseData.floors || '--' }} 层</td>
                    </tr>
                    <tr>
                      <th>户型结构</th>
                      <td>
                        {{ houseData.roomLayout?.[0] || 0 }}室
                        {{ houseData.roomLayout?.[1] || 0 }}厅
                        {{ houseData.roomLayout?.[2] || 0 }}卫
                      </td>
                    </tr>
                    <tr
                      v-for="(param, index) in houseData.parameters || []"
                      :key="`param-${index}`"
                    >
                      <th>{{ param.name }}</th>
                      <td>{{ param.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-else-if="activeDetailSection === 'optional'"
                class="detail-panel-content"
              >
                <n-spin :show="loadingConfigs">
                  <p class="desc-text optional-intro">
                    您可以在右侧订单卡片中勾选以下配置，升级您的居住体验。具体价格以实际生成订单为准。
                  </p>

                  <div
                    v-if="optionalConfigRows.length > 0"
                    class="optional-list-panel"
                  >
                    <div class="optional-filter-bar">
                      <div class="optional-filter-field">
                        <span class="optional-filter-field__label">配置分类</span>
                        <n-select
                          v-model:value="selectedOptionalCategoryId"
                          :options="optionalCategoryOptions"
                          size="small"
                          class="optional-filter-select"
                        />
                      </div>
                    </div>

                    <div class="optional-list-meta">
                      <span class="optional-list-meta__count">
                        当前分类共 {{ filteredOptionalConfigRows.length }} 项选配
                      </span>
                      <span class="optional-list-meta__page">
                        第 {{ optionalCurrentPage }} / {{ optionalPageCount }} 页
                      </span>
                    </div>

                    <div class="optional-config-table-wrap">
                      <n-table
                        class="params-table optional-table"
                        size="small"
                        :single-line="false"
                      >
                        <thead>
                          <tr>
                            <th class="opt-name">选配产品</th>
                            <th class="opt-price">加购价格</th>
                            <th class="opt-desc">详细描述</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="option in pagedOptionalConfigRows"
                            :key="`${option.categoryId}-${option.value}`"
                          >
                            <td class="opt-name">{{ option.name }}</td>
                            <td class="opt-price">
                              {{ formatCurrencyDisplay(option.price) }}
                            </td>
                            <td class="opt-desc">
                              {{ option.description || '暂无产品描述' }}
                            </td>
                          </tr>
                        </tbody>
                      </n-table>
                    </div>

                    <div
                      v-if="shouldShowOptionalPagination"
                      class="optional-pagination"
                    >
                      <n-pagination
                        v-model:page="optionalCurrentPage"
                        :page-size="optionalPageSize"
                        :item-count="filteredOptionalConfigRows.length"
                        :page-slot="5"
                      />
                    </div>
                  </div>
                  <n-empty
                    v-else-if="!loadingConfigs"
                    description="暂无选配产品说明"
                  />
                </n-spin>
              </div>

              <div v-else class="detail-panel-content">
                <div v-if="houseData.cases?.length > 0" class="floor-plan-list">
                  <div
                  v-for="(caseItem, index) in houseData.cases"
                    :key="index"
                    class="floor-plan-card"
                  >
                    <SmartImage
                      :src="caseItem.image"
                      :alt="caseItem.title"
                      loading="lazy"
                      decoding="async"
                      :placeholder="defaultDetailImage"
                    />
                    <div class="floor-plan-info">
                      <h4>{{ caseItem.title }}</h4>
                      <p>{{ caseItem.location }}</p>
                    </div>
                  </div>
                </div>
                <n-empty v-else description="暂无平面图纸" />
              </div>
            </section>
          </div>

          <div class="action-right">
            <div class="order-card">
              <div class="price-wrap">
                <div class="price-label">参考总价</div>
                <div class="price-value price-value--hero">
                  {{ formatCurrencyDisplay(houseData.price) }}
                </div>
              </div>

              <div class="action-buttons">
                <n-button
                  type="primary"
                  size="large"
                  class="reserve-btn"
                  @click="handleAction"
                >
                  直接下单
                </n-button>

                <n-button
                  v-if="houseData.model3d"
                  type="info"
                  size="large"
                  ghost
                  class="order-btn"
                  @click="handleShow3D"
                >
                  查看 3D 模型
                </n-button>
              </div>

              <div class="guarantee-list">
                <span>品质保障</span>
                <span>透明报价</span>
                <span>标准化工期</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <n-modal v-model:show="showImagePreview" transform-origin="center">
      <n-card
        class="detail-preview-modal-card"
        :bordered="false"
        size="huge"
        :style="previewModalStyle"
        role="dialog"
        aria-modal="true"
      >
        <n-carousel
          v-if="totalImages > 0"
          v-model:current-index="currentImageIndex"
          class="house-preview-carousel"
          :show-arrow="totalImages > 1"
          :draggable="totalImages > 1"
          :loop="totalImages > 1"
        >
          <SmartImage
            v-for="(imgUrl, index) in houseData.images"
            :key="index"
            :src="imgUrl"
            :alt="`${houseData.name}-${index + 1}`"
            class="preview-carousel-image"
            loading="lazy"
            decoding="async"
            :placeholder="defaultDetailImage"
          />
        </n-carousel>
        <SmartImage
          v-else
          src=""
          :alt="houseData.name"
          class="preview-carousel-image"
          :placeholder="defaultDetailImage"
        />
      </n-card>
    </n-modal>

    <n-modal
      v-model:show="show3DModal"
      preset="card"
      title="3D 模型预览"
      :style="modelModalStyle"
      class="glb-modal"
    >
      <div class="glb-modal-body">
        <GlbHouse
          v-if="show3DModal && houseData.model3d"
          :URL="houseData.model3d"
        />
      </div>
    </n-modal>

    <n-modal
      v-model:show="showConfigModal"
      preset="card"
      title="确认下单 - 个性化选配"
      size="huge"
      :style="configModalStyle"
    >
      <div class="config-container">
        <n-alert type="info" class="config-alert">
          请确认您的施工地址并选择建材配置，精准的配置有助于我们为您提供更准确的报价。
        </n-alert>

        <div v-if="loadingConfigs" class="config-loading-state">
          <n-spin size="medium" />
          <p class="config-loading-text">正在加载配置信息...</p>
        </div>

        <n-form
          v-else
          :label-placement="isCompactViewport ? 'top' : 'left'"
          :label-width="isCompactViewport ? undefined : 100"
        >
          <n-form-item label="施工地址" required>
            <n-cascader
              v-model:value="selectedRegionCode"
              @update:value="handleRegionUpdate"
              :options="regionCascaderOptions"
              check-strategy="child"
              filterable
              clearable
              placeholder="请选择省 / 市 / 区"
            />
          </n-form-item>

          <n-form-item label="详细地址" required>
            <n-input
              v-model:value="addressForm.detail"
              type="textarea"
              placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
              :rows="2"
              maxlength="120"
              show-count
            />
          </n-form-item>

          <n-form-item label="预览地址：">
            <div class="address-preview">
              {{ orderAddress || '请先选择施工行政区并填写详细门牌地址' }}
            </div>
          </n-form-item>

          <n-grid :cols="isCompactViewport ? 1 : 2" :x-gap="20" :y-gap="20">
            <n-grid-item v-for="category in dynamicConfigs" :key="category.id">
              <div class="config-item">
                <div class="config-label-row">
                  <div class="config-label">{{ category.name }}</div>
                  <span class="config-label-tip">单选，可不选</span>
                </div>
                <n-select
                  :key="`${category.key}-${selectedConfig[category.key] ?? 'empty'}`"
                  :value="selectedConfig[category.key]"
                  :options="buildCategorySelectOptions(category)"
                  placeholder="请选择"
                  clearable
                  @update:value="(value) => handleConfigChange(category.key, value)"
                />
                <div
                  v-if="getSelectedOptionDetail(category)"
                  class="config-option-preview"
                >
                  <div class="config-option-preview__price">
                    {{ formatCurrencyDisplay(getSelectedOptionDetail(category).price) }}
                  </div>
                  <div class="config-option-preview__desc">
                    {{ getSelectedOptionDetail(category).description || '暂无产品描述' }}
                  </div>
                </div>
              </div>
            </n-grid-item>
          </n-grid>

          <n-divider />

          <n-form-item label="备注需求">
            <n-input
              type="textarea"
              v-model:value="submitNote"
              placeholder="请输入其他特殊需求..."
            />
          </n-form-item>
        </n-form>
      </div>

      <template #footer>
          <n-space class="config-footer-actions" justify="end">
            <div class="order-total-price">
              <span class="order-total-price__label">总价</span>
              <span class="order-total-price__value">
              {{ formatCurrencyDisplay(orderTotalPrice) }}
            </span>
          </div>
          <n-button @click="showConfigModal = false">取消</n-button>
          <n-button
            type="primary"
            @click="confirmSubmission"
            :loading="submitting"
            :disabled="loadingConfigs"
          >
            提交订单
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </main>
  <Footer></Footer>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  Heart as HeartIcon,
  HeartOutline as HeartOutlineIcon,
} from '@/icons/ionicons'
import userAPI from '@/api/user/userData' // 引入用户API获取地址
import orderAPI from '@/api/user/userOrder'
import chinaAreaData from 'china-area-data'
import { validateStructuredAddress } from '@/utils/address'
import { getAssetPrimaryUrl } from '@/utils/asset'
import { resolveModelAssetUrl, warmModelAsset } from '@/utils/modelAsset'
import { useProductStore } from '@/stores/product/useProductStore'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useFavoriteStore } from '@/stores/favorite/useFavoriteStore'
import { useMaxWidth } from '@/composables/useMaxWidth'
import { useOptionCatalogStore } from '@/stores/option/useOptionCatalogStore'
import GlbHouse from '@/components/operation/GlbHouse.vue'
import SmartImage from '@/components/common/SmartImage.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const productStore = useProductStore()
const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()
const optionCatalogStore = useOptionCatalogStore()
const { isClientLoggedIn, isCurrentProvider } = storeToRefs(authStore)
const {
  currentUserId,
  favoriteLoadingMap,
  canAddCollect,
  canRemoveCollect,
  shouldShowCollectButton,
} = storeToRefs(favoriteStore)
const getCurrentUserId = () => currentUserId.value

// 状态管理
const currentImageIndex = ref(0)
const showImagePreview = ref(false)
const show3DModal = ref(false)
const showConfigModal = ref(false)
const isCompactViewport = useMaxWidth(768)
const activeDetailSection = ref('params')

// 表单数据
const submitNote = ref('')
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
const normalizeRegionName = (value = '') =>
  String(value || '').replace(/\s+/g, '').trim()

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

const getRegionNameByCode = (code) => regionNameByCodeMap.get(String(code || '')) || ''

const normalizeOptionLabel = (value = '') =>
  String(value === undefined || value === null ? '' : value).trim()

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
const submitting = ref(false)
const loadingConfigs = ref(false)
const collectLoading = computed(
  () => !!favoriteLoadingMap.value[Number(houseData.value?.id || 0)],
)
const isCurrentCollected = computed(() =>
  favoriteStore.isCollected(Number(houseData.value?.id || 0)),
)

const houseData = ref({})
const dynamicConfigs = ref([]) // 选配分类及产品
const selectedConfig = reactive({}) // { categoryId: optionProductId }
let fetchOptionsPromise = null
const defaultDetailImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="#f3f4f6"/><rect x="255" y="180" width="490" height="280" rx="28" fill="#d7dde5"/><path d="M325 420l120-132 100 96 72-82 80 118H325z" fill="#98a3b3"/><circle cx="430" cy="260" r="38" fill="#eef2f7"/><text x="500" y="560" text-anchor="middle" font-size="42" fill="#6b7280" font-family="Arial, sans-serif">暂无户型图片</text></svg>',
)}`
const detailSectionTags = [
  { label: '建筑参数', value: 'params' },
  { label: '可选配清单', value: 'optional' },
  { label: '平面图纸', value: 'plans' },
]
const optionalCurrentPage = ref(1)
const selectedOptionalCategoryId = ref('all')
const optionalPageSize = computed(() => (isCompactViewport.value ? 5 : 8))
const optionalConfigRows = computed(() =>
  dynamicConfigs.value
    .map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      options: (category.options || []).map((option) => ({
        value: option.value,
        name: option.name,
        price: option.price,
        description: option.description,
      })),
    }))
    .flatMap((category) =>
      category.options.map((option) => ({
        ...option,
        categoryId: category.categoryId,
        categoryName: category.categoryName,
      })),
    ),
)
const optionalCategoryOptions = computed(() => [
  { label: '全部分类', value: 'all' },
  ...dynamicConfigs.value
    .filter((category) => Array.isArray(category.options) && category.options.length > 0)
    .map((category) => ({
      label: category.name,
      value: String(category.id),
    })),
])
const filteredOptionalConfigRows = computed(() => {
  if (selectedOptionalCategoryId.value === 'all') {
    return optionalConfigRows.value
  }

  return optionalConfigRows.value.filter(
    (item) => String(item.categoryId) === String(selectedOptionalCategoryId.value),
  )
})
const optionalPageCount = computed(() =>
  Math.max(1, Math.ceil(filteredOptionalConfigRows.value.length / optionalPageSize.value)),
)
const pagedOptionalConfigRows = computed(() => {
  const start = (optionalCurrentPage.value - 1) * optionalPageSize.value
  return filteredOptionalConfigRows.value.slice(start, start + optionalPageSize.value)
})
const shouldShowOptionalPagination = computed(
  () => filteredOptionalConfigRows.value.length > optionalPageSize.value,
)
const previewModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(88vw, 1000px)',
}))
const modelModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(90vw, 1200px)',
}))
const configModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 800px)',
}))

const normalizeRegionPart = (value = '') =>
  String(value).replace(/\s+/g, '').trim()

const normalizeDetailPart = (value = '') =>
  String(value).replace(/\s+/g, ' ').trim()

const orderAddress = computed(() => {
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

const validateOrderAddressForm = () => {
  const errorMessage = validateStructuredAddress({
    province: addressForm.province,
    city: addressForm.city,
    district: addressForm.district,
    detail: addressForm.detail,
    fullAddress: orderAddress.value,
    addressLabel: '施工地址',
  })
  if (errorMessage) {
    message.warning(errorMessage)
    return false
  }
  return true
}

// 初始化配置
const initConfig = () => {
  submitNote.value = ''
  resetAddressForm()

  // 重置选配
  dynamicConfigs.value.forEach((cat) => {
    selectedConfig[cat.key] = null
  })
}

const toggleCollectCurrent = async () => {
  const userId = getCurrentUserId()
  if (!userId) {
    message.warning('请先登录后再收藏户型')
    router.push('/login')
    return
  }

  const productId = houseData.value.id
  if (!productId) {
    message.error('未找到有效的户型ID')
    return
  }

  if (isCurrentCollected.value && !canRemoveCollect.value) {
    message.warning('当前账号没有取消收藏权限')
    return
  }

  if (!isCurrentCollected.value && !canAddCollect.value) {
    message.warning('当前账号没有收藏权限')
    return
  }

  try {
    const result = await favoriteStore.toggleFavorite(productId, userId)
    if (result.action === 'removed') {
      message.success('已取消收藏')
    } else {
      message.success('收藏成功')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    message.error('收藏操作失败')
  }
}

// 获取选配选项
const fetchOptions = async () => {
  if (dynamicConfigs.value.length > 0) {
    console.log('[houseDetail] option configs cache hit:', dynamicConfigs.value)
    syncSelectedConfigKeys()
    return dynamicConfigs.value
  }

  if (fetchOptionsPromise) {
    return fetchOptionsPromise
  }

  loadingConfigs.value = true
  fetchOptionsPromise = (async () => {
    try {
      const configRes = await optionCatalogStore.fetchUserCategoryConfigs()
      console.log('[houseDetail] option config response:', configRes)
      if (configRes.code === 200 && Array.isArray(configRes.data)) {
        dynamicConfigs.value = configRes.data.map((category) => ({
          id: category.id,
          key: category.key,
          name: category.name,
          options: (category.options || []).map((opt) => ({
            ...opt,
            label: `${opt.name} (${formatCurrencyDisplay(opt.price)})`,
            value: Number(opt.value),
          })),
        }))
        console.log('[houseDetail] normalized dynamicConfigs:', dynamicConfigs.value)
        syncSelectedConfigKeys()
      }
      return dynamicConfigs.value
    } catch (error) {
      console.error('加载选配信息失败', error)
      return []
    } finally {
      loadingConfigs.value = false
      fetchOptionsPromise = null
    }
  })()

  return fetchOptionsPromise
}

// 点击预定/下单
const handleAction = async () => {
  const userId = getCurrentUserId()
  if (isCurrentProvider.value || (isClientLoggedIn.value && !userId)) {
    message.warning('请选择用户登录后执行下单操作')
    return
  }
  if (!userId) {
    message.warning('请先登录后再进行操作')
    router.push('/login')
    return
  }

  if (dynamicConfigs.value.length === 0) {
    await fetchOptions()
  } else {
    syncSelectedConfigKeys()
  }
  console.log('[houseDetail] open order modal with dynamicConfigs:', dynamicConfigs.value)
  console.log('[houseDetail] open order modal with selectedConfig:', {
    ...selectedConfig,
  })
  initConfig()
  showConfigModal.value = true

  // 核心逻辑：获取用户信息并回填地址
  try {
    const res = await userAPI.getUserDataById(userId)
    if (res.code === 200 && res.data) {
      if (res.data.address) {
        hydrateAddressForm(res.data.address)
      }
    }
  } catch (error) {
    console.error('获取用户地址失败', error)
  }

}

// 提交逻辑
const confirmSubmission = async () => {
  const userId = getCurrentUserId()
  if (isCurrentProvider.value || (isClientLoggedIn.value && !userId)) {
    message.warning('请选择用户登录后执行下单操作')
    return
  }
  if (!userId) {
    router.push('/login')
    return
  }

  if (!validateOrderAddressForm()) {
    return
  }

  submitting.value = true
  try {
    const optionalProductIds = Object.values(selectedConfig)
      .map((id) => normalizeOptionValue(id))
      .filter((id) => id)

    // 构造请求体
    const bodyData = {
      orderAddress: orderAddress.value,
      customerNotes: submitNote.value || '无特别说明',
      mpId: houseData.value.id,
      optionalProductIds: optionalProductIds,
      // paymentMethod: '未支付', // 后端可能自行处理默认值
    }

    const res = await orderAPI.createOrder(userId, bodyData)

    if (res.code === 200) {
      message.success('下单成功！')
      showConfigModal.value = false
      router.push('/adminCenter') // 跳转到个人中心查看订单
    } else {
      message.error(res.msg || '提交失败')
    }
  } catch (error) {
    console.error('提交订单失败', error)
    const fallbackMessage = error?.msg || error?.message || '提交订单失败，请稍后重试'
    message.error(fallbackMessage)
  } finally {
    submitting.value = false
  }
}

// 辅助逻辑
const formatStyle = (style) => {
  const map = {
    modern: '现代风格',
    chinese: '中式风格',
    european: '欧式风格',
    american: '美式风格',
    minimalist: '简约风格',
    other: '其他',
  }
  return map[style] || style || '未知'
}

const trimTrailingZeros = (value) =>
  String(value).replace(/\.?0+$/, '')

const formatPriceDisplay = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return '--'
  if (num >= 10000) {
    return `${trimTrailingZeros((num / 10000).toFixed(2))}万`
  }
  return trimTrailingZeros(num.toFixed(2))
}

const formatCurrencyDisplay = (value) => {
  const text = formatPriceDisplay(value)
  return text === '--' ? text : `¥${text}`
}

const buildDisplayImages = (data = {}) => {
  const imageSet = new Set()
  const images = []

  const pushImage = (url) => {
    if (!url || typeof url !== 'string') return
    const normalizedUrl = getAssetPrimaryUrl(url)
    if (!normalizedUrl || imageSet.has(normalizedUrl)) return
    imageSet.add(normalizedUrl)
    images.push(normalizedUrl)
  }

  pushImage(data.coverImageUrl)
  ;(data.renderings || []).forEach((item) => {
    pushImage(item?.url)
  })

  return images
}

const normalizeOptionValue = (value) => {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

const syncSelectedConfigKeys = () => {
  const activeKeys = new Set(dynamicConfigs.value.map((cat) => cat.key))
  Object.keys(selectedConfig).forEach((key) => {
    if (!activeKeys.has(key)) {
      delete selectedConfig[key]
    }
  })
  dynamicConfigs.value.forEach((cat) => {
    if (!(cat.key in selectedConfig)) {
      selectedConfig[cat.key] = null
    } else {
      selectedConfig[cat.key] = normalizeOptionValue(selectedConfig[cat.key])
    }
  })
}

const handleConfigChange = (categoryKey, value) => {
  selectedConfig[categoryKey] = normalizeOptionValue(value)
}

const buildCategorySelectOptions = (category) => [
  {
    label: '默认配置（不选择）',
    value: null,
  },
  ...(category.options || []).map((option) => ({
    label: `${option.name}（${formatCurrencyDisplay(option.price)}）`,
    value: option.value,
  })),
]

const getSelectedOptionDetail = (category) => {
  const selectedOptionId = normalizeOptionValue(selectedConfig[category.key])
  if (!selectedOptionId) return null
  return (
    category.options.find((option) => option.value === selectedOptionId) || null
  )
}

watch(
  activeDetailSection,
  (value) => {
    if (value === 'optional' && dynamicConfigs.value.length === 0) {
      fetchOptions().catch(() => {})
    }
    if (value === 'optional') {
      optionalCurrentPage.value = 1
      selectedOptionalCategoryId.value = 'all'
    }
  },
  { immediate: true },
)

watch(optionalPageSize, () => {
  optionalCurrentPage.value = 1
})

watch(filteredOptionalConfigRows, (rows) => {
  const maxPage = Math.max(1, Math.ceil(rows.length / optionalPageSize.value))
  if (optionalCurrentPage.value > maxPage) {
    optionalCurrentPage.value = maxPage
  }
})

watch(selectedOptionalCategoryId, () => {
  optionalCurrentPage.value = 1
})

const orderTotalPrice = computed(() => {
  const basePrice = Number(houseData.value?.price) || 0
  const optionalPrice = dynamicConfigs.value.reduce((sum, category) => {
    const selectedOptionId = normalizeOptionValue(selectedConfig[category.key])
    if (!selectedOptionId) return sum

    const selectedOption = category.options.find(
      (option) => option.value === selectedOptionId,
    )

    return sum + (Number(selectedOption?.price) || 0)
  }, 0)

  return basePrice + optionalPrice
})

const totalImages = computed(() => houseData.value.images?.length || 0)

const handleShow3D = () => {
  if (houseData.value.model3d) {
    warmModelAsset(houseData.value.model3d).catch(() => {})
    show3DModal.value = true
  } else {
    message.error('3D 模型文件不存在')
  }
}

const fetchHouseDetail = async (id) => {
  try {
    const data = await productStore.fetchClientProductDetail(id)

    if (data) {
      houseData.value = {
        id: data.id,
        name: data.name,
        buildArea: data.buildArea,
        baseArea: data.baseArea,
        floors: data.floors,
        roomLayout: data.roomLayout || [0, 0, 0],
        price: data.price,
        style: data.style,
        constructionMethod: data.constructionMethod,
        model3d: resolveModelAssetUrl(data.model3d),
        images: buildDisplayImages(data),
        cases: data.floorPlans
          ? data.floorPlans.map((plan, index) => ({
              image: getAssetPrimaryUrl(plan.url),
              title: `平面图纸 ${index + 1}`,
            }))
          : [],
        description:
          data.description ||
          `这是一款${formatStyle(data.style)}的${data.floors}层户型...`,
        details: data.details || `本户型布局合理，动静分区明确。`,
        designConcept: data.designConcept || `以人为本的设计理念。`,
        parameters: [
          { name: '建筑风格', value: formatStyle(data.style) },
          { name: '施工方式', value: data.constructionMethod || '--' },
          { name: '建筑层数', value: `${data.floors} 层` },
        ],
      }
      if (data.model3d) {
        warmModelAsset(data.model3d).catch(() => {})
      }
      await favoriteStore.syncFavoriteStatus(data.id)
    }
  } catch (error) {
    message.error('无法加载户型详情')
  }
}

onMounted(() => {
  const houseId = route.params.id
  if (houseId) {
    fetchHouseDetail(houseId)
    fetchOptions().catch(() => {})
  } else {
    router.push('/houseList')
  }
})
</script>

<style lang="scss" scoped>
.house-detail-page {
  --detail-primary: #276e3d;
  --detail-primary-hover: #1e5931;
  --detail-accent: #f24219;
  --detail-text-main: #1f2937;
  --detail-text-secondary: #6b7280;
  --detail-bg-page: #f9fafb;
  --detail-bg-surface: #ffffff;
  --detail-border: #e5e7eb;
  --detail-radius-lg: 16px;
  --detail-radius-md: 12px;
  --detail-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --detail-shadow-md:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --detail-shadow-lg:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-height: 100vh;
  padding-top: 28px;
  padding-bottom: 60px;
  background-color: var(--detail-bg-page);
  color: var(--detail-text-main);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.breadcrumb-section {
  margin-bottom: 24px;
  padding: 16px 0;
  background: var(--detail-bg-surface);
  border-bottom: 1px solid var(--detail-border);
  box-shadow: var(--detail-shadow-sm);

  :deep(.n-breadcrumb) {
    font-size: 14px;
  }

  :deep(.n-breadcrumb-item) {
    color: var(--detail-text-secondary);
    font-weight: 500;
  }

  :deep(.n-breadcrumb-item:hover) {
    color: var(--detail-primary);
  }

  :deep(.n-breadcrumb-item:last-child) {
    color: var(--detail-text-main);
    font-weight: 600;
  }
}

.house-main-section {
  padding-bottom: 24px;
}

.gallery-grid {
  position: relative;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 250px 250px;
  gap: 16px;
  margin-bottom: 40px;
  overflow: hidden;
  border-radius: var(--detail-radius-lg);
}

.gallery-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: filter 0.3s ease;

  &:hover {
    filter: brightness(0.95);
  }
}

.gallery-main {
  grid-row: 1 / 3;
}

.gallery-btn {
  position: absolute;
  right: 24px;
  bottom: 24px;
  z-index: 2;
  border: 1px solid var(--detail-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  padding: 8px 16px;
  color: var(--detail-text-main);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--detail-shadow-sm);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    color: var(--detail-primary);
    border-color: var(--detail-primary);
    background: #ffffff;
  }
}

.main-layout {
  display: flex;
  align-items: flex-start;
  gap: 48px;
  padding-bottom: 10px;
}

.content-left {
  flex: 1;
  min-width: 0;
}

.action-right {
  width: 380px;
  position: sticky;
  top: 102px;
}

.house-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 16px;
}

.house-header-copy {
  min-width: 0;
}

.house-title {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--detail-text-main);
}

.house-subtitle {
  margin: 0;
  color: var(--detail-text-secondary);
  font-size: 16px;
}

.btn-favorite {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--detail-border);
  border-radius: 50%;
  background: transparent;
  color: var(--detail-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.active {
    color: var(--detail-accent);
    border-color: var(--detail-accent);
    background: rgba(242, 66, 25, 0.05);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.meta-grid {
  display: flex;
  gap: 16px;
  margin: 32px 0;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--detail-border);
}

.meta-item {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid var(--detail-border);
  border-radius: var(--detail-radius-md);
  background: var(--detail-bg-surface);
}

.meta-info h4 {
  margin: 0 0 4px;
  color: var(--detail-text-secondary);
  font-size: 12px;
  font-weight: 400;
}

.meta-info p {
  margin: 0;
  color: var(--detail-text-main);
  font-size: 16px;
  font-weight: 600;
}

.content-section {
  margin-bottom: 40px;
}

.detail-sections-panel {
  padding: 28px;
  border: 1px solid var(--detail-border);
  border-radius: var(--detail-radius-lg);
  background: var(--detail-bg-surface);
  box-shadow: var(--detail-shadow-sm);
}

.detail-sections-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-sections-header .section-title {
  margin-bottom: 0;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-tag-button {
  min-width: 116px;
  padding: 10px 18px;
  border: 1px solid #d9e2d9;
  border-radius: 999px;
  background: #f6f8f4;
  color: var(--detail-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.detail-tag-button:hover {
  color: var(--detail-primary);
  border-color: rgba(39, 110, 61, 0.3);
  background: rgba(39, 110, 61, 0.08);
}

.detail-tag-button.active {
  color: #ffffff;
  border-color: var(--detail-primary);
  background: var(--detail-primary);
  box-shadow: 0 10px 20px rgba(39, 110, 61, 0.18);
}

.detail-panel-content {
  min-height: 120px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  color: var(--detail-text-main);
  font-size: 24px;
  font-weight: 700;
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 20px;
  border-radius: 2px;
  background-color: var(--detail-primary);
}

.desc-text {
  margin: 0 0 12px;
  color: var(--detail-text-secondary);
  font-size: 16px;
  line-height: 1.8;
}

.optional-intro {
  margin-bottom: 16px;
  font-size: 14px;
}

.params-table {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--detail-border);
  border-radius: var(--detail-radius-md);
  border-collapse: collapse;
  background: var(--detail-bg-surface);
}

.params-table :deep(th),
.params-table :deep(td),
.params-table th,
.params-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--detail-border);
}

.params-table :deep(tr:last-child th),
.params-table :deep(tr:last-child td),
.params-table tr:last-child th,
.params-table tr:last-child td {
  border-bottom: none;
}

.tech-table th {
  width: 150px;
  background-color: #f3f4f6;
  color: var(--detail-text-secondary);
  font-weight: 500;
}

.tech-table td {
  font-weight: 500;
  color: var(--detail-text-main);
}

.optional-list-panel {
  overflow: hidden;
  border: 1px solid var(--detail-border);
  border-radius: var(--detail-radius-md);
  background: var(--detail-bg-surface);
}

.optional-filter-bar {
  display: flex;
  justify-content: flex-end;
  padding: 16px 18px;
  border-bottom: 1px solid var(--detail-border);
  background: linear-gradient(180deg, #f9fbf8 0%, #ffffff 100%);
}

.optional-filter-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.optional-filter-field__label {
  color: var(--detail-text-secondary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.optional-filter-select {
  width: 220px;
}

.optional-list-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--detail-border);
  background: #f9fafb;
  color: var(--detail-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.optional-config-table-wrap {
  overflow-x: auto;
}

.optional-table :deep(th) {
  background-color: #ffffff;
  color: var(--detail-text-secondary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.optional-table :deep(td) {
  font-size: 14px;
  line-height: 1.6;
}

.opt-name {
  width: 26%;
  color: var(--detail-text-main);
  font-weight: 600;
}

.opt-price {
  width: 14%;
  white-space: nowrap;
  color: var(--detail-accent);
  font-weight: 700;
}

.opt-desc {
  color: var(--detail-text-secondary);
}

.optional-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 18px 18px;
  border-top: 1px solid var(--detail-border);
  background: #fff;
}

.floor-plan-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.floor-plan-card {
  overflow: hidden;
  border: 1px solid var(--detail-border);
  border-radius: var(--detail-radius-md);
  background: var(--detail-bg-surface);
}

.floor-plan-card img {
  width: 100%;
  height: 300px;
  object-fit: contain;
  background: #f3f4f6;
}

.floor-plan-info {
  padding: 16px;
}

.floor-plan-info h4 {
  margin: 0 0 4px;
  color: var(--detail-text-main);
  font-size: 16px;
}

.floor-plan-info p {
  margin: 0;
  color: var(--detail-text-secondary);
  font-size: 14px;
}

.order-card {
  padding: 24px;
  border: 1px solid var(--detail-border);
  border-radius: var(--detail-radius-lg);
  background: var(--detail-bg-surface);
  box-shadow: var(--detail-shadow-lg);
}

.price-wrap {
  margin-bottom: 24px;
}

.price-label {
  margin-bottom: 4px;
  color: var(--detail-text-secondary);
  font-size: 14px;
}

.price-value {
  color: var(--detail-accent);
  font-weight: 800;
}

.price-value--hero {
  font-size: 36px;
  line-height: 1.15;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-buttons .reserve-btn,
.action-buttons .order-btn {
  width: 100%;
  height: 54px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
}

:deep(.reserve-btn.n-button) {
  --n-color: var(--detail-primary);
  --n-color-hover: var(--detail-primary-hover);
  --n-color-pressed: #194c2a;
  --n-color-focus: var(--detail-primary-hover);
  --n-border: 1px solid var(--detail-primary);
}

:deep(.order-btn.n-button) {
  --n-color: transparent;
  --n-color-hover: rgba(39, 110, 61, 0.05);
  --n-color-pressed: rgba(39, 110, 61, 0.08);
  --n-text-color: var(--detail-primary);
  --n-text-color-hover: var(--detail-primary-hover);
  --n-text-color-pressed: var(--detail-primary-hover);
  --n-border: 1px solid var(--detail-primary);
  --n-border-hover: 1px solid var(--detail-primary-hover);
  --n-border-pressed: 1px solid var(--detail-primary-hover);
  --n-border-focus: 1px solid var(--detail-primary-hover);
}

.guarantee-list {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--detail-text-secondary);
  font-size: 12px;
}

.guarantee-list span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-container {
  padding: 12px;
}

.config-alert {
  margin-bottom: 20px;
}

.config-loading-state {
  padding: 20px 0;
  text-align: center;
}

.config-loading-text {
  margin-top: 8px;
  color: var(--detail-text-secondary);
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.config-label {
  font-weight: 600;
  color: #2f3d32;
}

.config-label-tip {
  font-size: 12px;
  color: var(--detail-text-secondary);
}

.config-option-preview {
  padding: 12px 14px;
  border-radius: var(--detail-radius-md);
  background: #f7faf7;
  border: 1px solid rgba(39, 110, 61, 0.12);
}

.config-option-preview__price {
  margin-bottom: 6px;
  color: var(--detail-accent);
  font-size: 14px;
  font-weight: 700;
}

.config-option-preview__desc {
  color: var(--detail-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.address-preview {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-xl);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  line-height: 1.6;
  word-break: break-all;
}

.order-total-price {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-right: 8px;
  color: #1f2937;
}

.order-total-price__label {
  font-size: 14px;
  color: #6b7280;
}

.order-total-price__value {
  font-size: 20px;
  font-weight: 700;
  color: var(--detail-accent);
}

.detail-preview-modal-card {
  width: 100%;
  max-width: 100%;
}

.house-preview-carousel {
  width: 100%;
  height: min(70vh, 720px);
}

.preview-carousel-image {
  width: 100%;
  height: min(70vh, 720px);
  object-fit: contain;
  background: #f3f4f6;
}

.glb-modal-body {
  width: 100%;
  height: min(68vh, 760px);
  max-height: min(68vh, 760px);
  min-height: 300px;
  overflow: hidden;
}

.glb-modal {
  :deep(.n-card) {
    overflow: hidden;
    border-radius: var(--detail-radius-lg);
  }

  :deep(.n-card__content) {
    padding: 0;
    overflow: hidden;
  }
}

:deep(.n-modal .n-card) {
  border-radius: var(--detail-radius-lg);
  box-shadow: var(--detail-shadow-lg);
}

.config-footer-actions {
  row-gap: 10px;

  :deep(.n-button) {
    min-height: 44px;
  }
}

@media (max-width: 992px) {
  .main-layout {
    flex-direction: column;
  }

  .action-right {
    width: 100%;
    position: static;
  }

  .meta-grid {
    flex-wrap: wrap;
  }

  .meta-item {
    min-width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .house-detail-page {
    padding-top: 18px;
    padding-bottom: 40px;
  }

  .container {
    padding: 0 16px;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 250px;
  }

  .gallery-grid img:not(.gallery-main) {
    display: none;
  }

  .gallery-btn {
    right: 16px;
    bottom: 16px;
  }

  .house-title {
    font-size: 24px;
  }

  .detail-sections-panel {
    padding: 20px 16px;
  }

  .detail-sections-header {
    align-items: flex-start;
  }

  .detail-tags {
    width: 100%;
    gap: 10px;
  }

  .detail-tag-button {
    flex: 1 1 calc(50% - 5px);
    min-width: 0;
  }

  .optional-table :deep(th) {
    display: none;
  }

  .optional-table :deep(td) {
    display: block;
    width: 100%;
    padding: 8px 16px;
  }

  .optional-table :deep(tr) {
    display: block;
    padding: 10px 0;
    border-bottom: 1px solid var(--detail-border);
  }

  .optional-table :deep(tr:last-child) {
    border-bottom: none;
  }

  .optional-filter-bar {
    justify-content: stretch;
    padding: 14px 14px 12px;
  }

  .optional-filter-field {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .optional-filter-select {
    width: 100%;
  }

  .optional-list-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .opt-price {
    padding-top: 0 !important;
  }

  .optional-pagination {
    justify-content: center;
    padding: 14px 12px 16px;
  }

  .config-container {
    padding: 4px 0 0;
  }

  .config-footer-actions {
    width: 100%;
    justify-content: stretch !important;
  }

  .config-footer-actions > *,
  .config-footer-actions :deep(.n-space-item) {
    flex: 1 1 100%;
    width: 100%;
  }

  .order-total-price {
    justify-content: space-between;
    width: 100%;
    margin-right: 0;
  }

  .glb-modal-body {
    min-height: 260px;
    height: min(54vh, 520px);
    max-height: min(54vh, 520px);
  }
}

@media (max-width: 576px) {
  .house-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-item {
    min-width: 100%;
  }

  .order-card {
    padding: 18px 16px;
  }

  .detail-tag-button {
    flex-basis: 100%;
  }

  .action-buttons .reserve-btn,
  .action-buttons .order-btn {
    height: 50px;
    font-size: 15px;
  }
}
</style>
