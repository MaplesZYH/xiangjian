<template>
  <Navigation />
  <main class="house-page">
    <section
      ref="searchSectionRef"
      class="search-section reveal-section"
      :class="{ 'is-visible': revealStates.search, 'is-ready': introReady }"
    >
      <div class="search-container">
        <h1>探索理想户型</h1>
        <p>输入关键词或使用下方筛选器，快速找到适合您的乡建方案</p>
        <div class="search-box">
          <n-input
            v-model:value="searchParams.keyword"
            placeholder="搜索关键词（如：现代别墅 / 中式庭院 / 轻钢结构）"
            round
            clearable
            size="large"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <n-icon size="20" color="#999">
                <search-icon />
              </n-icon>
            </template>
          </n-input>
          <n-button type="primary" size="large" round @click="handleSearch">
            搜索
          </n-button>
        </div>
      </div>
    </section>

    <section
      ref="filterSectionRef"
      class="filter-section reveal-section"
      :class="{ 'is-visible': revealStates.filter }"
    >
      <div class="filter-container">
        <div class="filter-header">
          <h2>筛选条件</h2>
          <n-button text type="primary" @click="resetFilters">
            <template #icon>
              <n-icon><refresh-icon /></n-icon>
            </template>
            重置所有条件
          </n-button>
        </div>

        <div class="filter-row">
          <span class="label">建筑风格：</span>
          <div class="content">
            <n-radio-group v-model:value="searchParams.style" name="styleGroup">
              <n-space>
                <n-radio-button value="">全部</n-radio-button>
                <n-radio-button value="modern">现代风格</n-radio-button>
                <n-radio-button value="chinese">中式风格</n-radio-button>
                <n-radio-button value="european">欧式风格</n-radio-button>
              </n-space>
            </n-radio-group>
          </div>
        </div>

        <div class="filter-row">
          <span class="label">占地面积：</span>
          <div class="content">
            <n-radio-group v-model:value="baseAreaRange" name="baseAreaGroup">
              <n-space>
                <n-radio-button value="">不限</n-radio-button>
                <n-radio-button value="0-90">90m²以下</n-radio-button>
                <n-radio-button value="90-120">90-120m²</n-radio-button>
                <n-radio-button value="120-150">120-150m²</n-radio-button>
                <n-radio-button value="150-max">150m²以上</n-radio-button>
              </n-space>
            </n-radio-group>
          </div>
        </div>

        <div class="filter-row">
          <span class="label">建筑面积：</span>
          <div class="content">
            <n-radio-group v-model:value="buildAreaRange" name="buildAreaGroup">
              <n-space>
                <n-radio-button value="">不限</n-radio-button>
                <n-radio-button value="0-180">180m²以下</n-radio-button>
                <n-radio-button value="180-240">180-240m²</n-radio-button>
                <n-radio-button value="240-300">240-300m²</n-radio-button>
                <n-radio-button value="300-max">300m²以上</n-radio-button>
              </n-space>
            </n-radio-group>
          </div>
        </div>
      </div>
    </section>

    <section
      class="house-showcase reveal-section"
      :class="{ 'is-visible': revealStates.showcase }"
      ref="showcaseRef"
    >
      <div class="showcase-container">
        <div class="result-info">
          <h2>
            共找到
            <span class="highlight">{{ pageinfo.count }}</span>
            个符合条件的户型
          </h2>
        </div>

        <div class="house-masonry">
          <div
            v-for="(house, index) in houseList"
            :key="house.id"
            class="house-card"
            :style="{ '--card-delay': `${Math.min(index, 7) * 80}ms` }"
            @click="viewHouseDetail(house.id)"
          >
            <div class="house-image">
              <SmartImage
                :src="getHouseImageSource(house)"
                :alt="house.name"
                loading="eager"
                decoding="async"
                :fetchpriority="index < 2 ? 'high' : undefined"
                :placeholder="DEFAULT_HOUSE_IMAGE"
              />
              <div class="tags">
                <span class="tag-style" v-if="house.style">
                  {{ getStyleLabel(house.style) }}
                </span>
                <span class="tag-floor" v-if="house.floors">
                  {{ house.floors }}层
                </span>
              </div>
            </div>

            <div class="house-info">
              <h3>{{ house.name }}</h3>

              <div class="house-meta">
                <div class="meta-item">
                  <span class="label">建面</span>
                  <span class="value">{{ formatArea(house.buildArea) }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">占地</span>
                  <span class="value">{{ formatArea(house.baseArea) }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">格局</span>
                  <span class="value">{{ getLayoutString(house) }}</span>
                </div>
              </div>

              <div class="house-price">
                <span class="price-text">
                  参考造价:
                  <span class="amount">{{ formatPriceDisplay(house.price) }}</span>
                </span>
                <div class="house-actions">
                  <n-button
                    type="primary"
                    ghost
                    size="small"
                    @click.stop="inquire(house.id)"
                  >
                    咨询
                  </n-button>
                  <n-button
                    v-if="shouldShowCollectButton"
                    :type="isCollected(house) ? 'error' : 'default'"
                    secondary
                    size="small"
                    :loading="!!favoriteLoadingMap[getHouseId(house)]"
                    @click.stop="toggleCollect(house)"
                  >
                    <template #icon>
                      <n-icon>
                        <heart-icon v-if="isCollected(house)" />
                        <heart-outline-icon v-else />
                      </n-icon>
                    </template>
                    {{ isCollected(house) ? '已收藏' : '收藏' }}
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="houseList.length === 0 && !loading" class="empty-state">
          <n-empty description="未找到符合条件的户型" size="large">
            <template #extra>
              <n-button size="small" @click="resetFilters">
                清空筛选条件
              </n-button>
            </template>
          </n-empty>
        </div>

        <div class="pagination-container" v-if="pageinfo.pageCount > 1">
          <n-pagination
            v-model:page="pageinfo.current"
            :page-count="pageinfo.pageCount"
            :page-slot="3"
            :size="isCompactViewport ? 'small' : 'medium'"
            :show-quick-jumper="!isCompactViewport"
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </section>
  </main>
  <Footer />
</template>

<script setup>
import {
  computed,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useMessage, useNotification } from 'naive-ui'
import {
  Heart as HeartIcon,
  HeartOutline as HeartOutlineIcon,
  RefreshOutline as RefreshIcon,
  SearchOutline as SearchIcon,
} from '@/icons/ionicons'
import { getAssetPrimaryUrl } from '@/utils/asset'
import { useProductStore } from '@/stores/product/useProductStore'
import { useFavoriteStore } from '@/stores/favorite/useFavoriteStore'
import { useMaxWidth } from '@/composables/useMaxWidth'
import SmartImage from '@/components/common/SmartImage.vue'

const router = useRouter()
const message = useMessage()
const notification = useNotification()
const productStore = useProductStore()
const favoriteStore = useFavoriteStore()
const { clientProductList, clientProductListLoading } = storeToRefs(productStore)
const {
  favoriteLoadingMap,
  currentUserId,
  canAddCollect,
  canRemoveCollect,
  shouldShowCollectButton,
} = storeToRefs(favoriteStore)
const loading = computed(() => clientProductListLoading.value)
const showcaseRef = ref(null)
const searchSectionRef = ref(null)
const filterSectionRef = ref(null)
const introReady = ref(false)
const isCompactViewport = useMaxWidth(576)
const revealStates = reactive({
  search: false,
  filter: false,
  showcase: false,
})
let revealObserver = null

const styleMap = {
  modern: '现代风格',
  chinese: '中式风格',
  european: '欧式风格',
}

const baseAreaRange = ref('')
const buildAreaRange = ref('')

const searchParams = reactive({
  keyword: '',
  style: '',
  minBuildArea: null,
  maxBuildArea: null,
  minBaseArea: null,
  maxBaseArea: null,
})

const pageinfo = reactive({
  current: 1,
  size: 8,
  pageCount: 0,
  count: 0,
})

const houseList = computed(() => clientProductList.value || [])
const DEFAULT_HOUSE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><rect x="110" y="92" width="180" height="116" rx="16" fill="#d7dde5"/><path d="M135 184l42-46 35 34 25-28 28 40H135z" fill="#9aa4b2"/><circle cx="170" cy="130" r="16" fill="#eef2f7"/><text x="200" y="242" text-anchor="middle" font-size="20" fill="#6b7280" font-family="Arial, sans-serif">暂无户型图</text></svg>',
)}`

const getHouseId = (house) => house?.id ?? house?.productId

const parseRangeToParams = (rangeStr, minKey, maxKey) => {
  if (!rangeStr) {
    searchParams[minKey] = null
    searchParams[maxKey] = null
    return
  }

  const [min, max] = rangeStr.split('-')
  searchParams[minKey] = min ? Number(min) : null
  searchParams[maxKey] = max && max !== 'max' ? Number(max) : null
}

const normalizeKeywordSearch = (rawKeyword) => {
  const text = String(rawKeyword || '').trim()
  if (!text) {
    return {
      keyword: '',
      inferredStyle: '',
    }
  }

  const styleRules = [
    { aliases: ['现代风格', '现代'], style: 'modern' },
    { aliases: ['中式风格', '中式'], style: 'chinese' },
    { aliases: ['欧式风格', '欧式'], style: 'european' },
  ]

  let keyword = text
  let inferredStyle = ''

  for (const rule of styleRules) {
    const hit = rule.aliases.find((alias) => keyword.includes(alias))
    if (!hit) continue
    inferredStyle = rule.style
    keyword = keyword.split(hit).join(' ').trim()
    break
  }

  return {
    keyword: keyword.replace(/\s+/g, ' ').trim(),
    inferredStyle,
  }
}

const isCollected = (house) => favoriteStore.isCollected(getHouseId(house))

const handleGetHouse = async () => {
  try {
    parseRangeToParams(baseAreaRange.value, 'minBaseArea', 'maxBaseArea')
    parseRangeToParams(buildAreaRange.value, 'minBuildArea', 'maxBuildArea')

    const paramsToSend = {}
    for (const key in searchParams) {
      const value = searchParams[key]
      if (value !== '' && value !== null && value !== undefined) {
        paramsToSend[key] = value
      }
    }

    const { keyword, inferredStyle } = normalizeKeywordSearch(searchParams.keyword)
    if (keyword) {
      paramsToSend.keyword = keyword
    } else {
      delete paramsToSend.keyword
    }
    if (!searchParams.style && inferredStyle) {
      paramsToSend.style = inferredStyle
    }

    await productStore.fetchClientProductList(paramsToSend, {
      page: pageinfo.current,
      pageSize: pageinfo.size,
    })

    pageinfo.current = productStore.clientProductListMeta.current
    pageinfo.count = productStore.clientProductListMeta.total
    pageinfo.pageCount = productStore.clientProductListMeta.pages

    if (pageinfo.count === 0) {
      return
    }

    await favoriteStore.syncFavoriteStatuses(
      houseList.value.map((item) => getHouseId(item)),
    )
  } catch (error) {
    void error
    message.error('获取户型数据失败')
  }
}

const handleSearch = () => {
  pageinfo.current = 1
  handleGetHouse()
}

const handlePageChange = (page) => {
  pageinfo.current = page
  handleGetHouse().then(() => {
    nextTick(() => {
      if (showcaseRef.value) {
        showcaseRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}

const resetFilters = () => {
  searchParams.keyword = ''
  searchParams.style = ''
  baseAreaRange.value = ''
  buildAreaRange.value = ''
  handleSearch()
}

const viewHouseDetail = (id) => {
  router.push(`/houseDetail/${id}`)
}

const inquire = () => {
  notification.info({
    title: '预约咨询联系方式',
    duration: 7000,
    content: () =>
      h('div', { style: 'line-height: 1.8;' }, [
        h('div', '公司名称：乡建在线'),
        h('div', '公司地址：成都高新区府城大道西段399号天府新谷7号楼C座'),
        h('div', '客服热线：131 0130 8866'),
        h('div', '服务时间：09:00-19:00'),
        h(
          'div',
          { style: 'margin-top: 8px; text-align: center;' },
          h('img', {
            src: '/info/公众号二维码.jpg',
            alt: '公众号二维码',
            style:
              'width: 140px; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;',
          }),
        ),
      ]),
  })
}

const toggleCollect = async (house) => {
  const userId = currentUserId.value
  if (!userId) {
    message.warning('请先登录后再收藏户型')
    router.push('/login')
    return
  }

  const productId = getHouseId(house)
  if (!productId) {
    message.error('未找到有效的户型ID')
    return
  }

  if (isCollected(house) && !canRemoveCollect.value) {
    message.warning('当前账号没有取消收藏权限')
    return
  }

  if (!isCollected(house) && !canAddCollect.value) {
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
    void error
    message.error('收藏操作失败')
  }
}

const formatArea = (value) => (value ? `${value}m²` : '--')

const trimTrailingZeros = (value) =>
  String(value).replace(/\.?0+$/, '')

const formatPriceDisplay = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return '--'
  if (num >= 10000) {
    return `${trimTrailingZeros((num / 10000).toFixed(2))}万`
  }
  return `${trimTrailingZeros(num.toFixed(2))}元`
}

const getHouseImageSource = (house) => {
  if (house.coverImageUrl && house.coverImageUrl.startsWith('http')) {
    return getAssetPrimaryUrl(house.coverImageUrl)
  }
  if (house.renderings?.length > 0) {
    return getAssetPrimaryUrl(house.renderings[0].url)
  }
  return ''
}

const getStyleLabel = (value) => styleMap[value] || value || '默认风格'

const getLayoutString = (house) => {
  if (Array.isArray(house.roomLayout)) {
    const [room, hall, bath] = house.roomLayout
    return `${room || 0}室${hall || 0}厅${bath || 0}卫`
  }
  if (house.roomCount || house.livingRoomCount || house.bathroomCount) {
    return `${house.roomCount || 0}室${house.livingRoomCount || 0}厅${
      house.bathroomCount || 0
    }卫`
  }
  return '暂无格局信息'
}

watch([() => searchParams.style, baseAreaRange, buildAreaRange], () => {
  handleSearch()
})

watch(
  houseList,
  async () => {
    await nextTick()
  },
  { flush: 'post' },
)

const setupRevealObserver = () => {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    revealStates.search = true
    revealStates.filter = true
    revealStates.showcase = true
    return
  }

  revealObserver?.disconnect()
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        if (entry.target === searchSectionRef.value) {
          revealStates.search = true
        }
        if (entry.target === filterSectionRef.value) {
          revealStates.filter = true
        }
        if (entry.target === showcaseRef.value) {
          revealStates.showcase = true
        }

        revealObserver?.unobserve(entry.target)
      })
    },
    {
      threshold: 0.03,
      rootMargin: '0px 0px 20% 0px',
    },
  )

  ;[searchSectionRef.value, filterSectionRef.value, showcaseRef.value]
    .filter(Boolean)
    .forEach((element) => revealObserver.observe(element))
}

onMounted(() => {
  requestAnimationFrame(() => {
    introReady.value = true
    revealStates.search = true
  })
  setupRevealObserver()
  handleGetHouse()
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
})
</script>

<style lang="scss" scoped>
.house-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(32, 128, 240, 0.14), transparent 34%),
    linear-gradient(180deg, #f7fbff 0%, #f4f7f8 45%, #f9fbfa 100%);
}

.reveal-section {
  opacity: 0;
  transform: translateY(34px);
  transition:
    opacity 0.8s ease,
    transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.reveal-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.search-section {
  padding: 50px 0 40px;
  background:
    linear-gradient(135deg, rgba(11, 70, 47, 0.8), rgba(20, 78, 132, 0.62)),
    url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80')
      center/cover no-repeat;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    filter: blur(6px);
    pointer-events: none;
  }

  &::before {
    width: 280px;
    height: 280px;
    top: -90px;
    left: -60px;
  }

  &::after {
    width: 220px;
    height: 220px;
    right: -40px;
    bottom: -70px;
  }

  .search-container {
    width: min(calc(100% - (var(--page-gutter) * 2)), 800px);
    margin: 0 auto;
    padding: 0;
    position: relative;
    z-index: 1;
    opacity: 0;
    transform: translateY(18px) scale(0.985);
    transition:
      opacity 0.85s ease,
      transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);

    h1 {
      font-size: 2.2rem;
      margin-bottom: 10px;
      font-weight: 600;
    }

    p {
      margin-bottom: 25px;
      opacity: 0.9;
      font-size: 1.1rem;
    }
  }

  .search-box {
    display: flex;
    gap: 12px;
    width: min(100%, 600px);
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 10px;
    border-radius: 50px;
    backdrop-filter: blur(5px);
    box-shadow: var(--shadow-medium);
  }
}

.search-section.is-ready {
  .search-container {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.filter-section {
  background: var(--color-surface);
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);

  .filter-container {
    width: min(calc(100% - (var(--page-gutter) * 2)), 1200px);
    margin: 0 auto;
    padding: 30px 0;
  }

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 1.2rem;
      color: var(--color-text-primary);
      margin: 0;
      border-left: 4px solid var(--color-brand-700);
      padding-left: 10px;
    }
  }

  .filter-row {
    display: flex;
    align-items: center;
    margin-bottom: 15px;

    .content {
      min-width: 0;
      flex: 1;
    }

    .label {
      width: 90px;
      color: var(--color-text-secondary);
      font-weight: 500;
      flex-shrink: 0;
    }
  }
}

.house-showcase {
  padding-bottom: 60px;

  .showcase-container {
    width: min(calc(100% - (var(--page-gutter) * 2)), 1200px);
    margin: 0 auto;
    padding: 0;
  }

  .result-info {
    margin-bottom: 20px;
    opacity: 0;
    transform: translateY(18px);
    transition:
      opacity 0.6s ease 0.1s,
      transform 0.6s ease 0.1s;

    h2 {
      font-size: 1.1rem;
      color: var(--color-text-secondary);
      font-weight: normal;
    }

    .highlight {
      color: var(--color-brand-700);
      font-weight: bold;
      font-size: 1.3rem;
      margin: 0 5px;
    }
  }

  .house-masonry {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: clamp(18px, 2vw, 25px);
    margin-bottom: 40px;
  }

  .empty-state {
    padding: 60px 0;
    text-align: center;
    opacity: 0;
    transform: translateY(18px);
    transition:
      opacity 0.6s ease 0.18s,
      transform 0.6s ease 0.18s;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    overflow-x: auto;
    padding-top: 20px;
    padding-inline: 4px;
    -webkit-overflow-scrolling: touch;
    opacity: 0;
    transform: translateY(18px);
    transition:
      opacity 0.6s ease 0.24s,
      transform 0.6s ease 0.24s;

    :deep(.n-pagination) {
      flex-wrap: wrap;
      justify-content: center;
      row-gap: 10px;
    }
  }
}

.house-showcase.is-visible {
  .result-info,
  .empty-state,
  .pagination-container {
    opacity: 1;
    transform: translateY(0);
  }
}

.house-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--color-border-soft);
  opacity: 0;
  transform: translateY(22px) scale(0.985);
  animation: house-card-enter 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--card-delay, 0ms);

  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-soft);
  }

  .house-image {
    height: 200px;
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }

    .tags {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      gap: 5px;

      span {
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: white;
        backdrop-filter: blur(4px);
      }

      .tag-style {
        background: rgba(24, 160, 88, 0.9);
      }

      .tag-floor {
        background: rgba(32, 128, 240, 0.9);
      }
    }
  }

  .house-info {
    padding: 16px;

    h3 {
      font-size: 1.15rem;
      margin: 0 0 8px;
      color: #333;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .house-meta {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 5px;
      background: #f9f9f9;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 15px;

      .meta-item {   
        display: flex;
        flex-direction: column;
        align-items: center;

        .label {
          font-size: 12px;
          color: #999;
          margin-bottom: 2px;
        }

        .value {
          font-size: 13px;
          color: #333;
          font-weight: 500;
          text-align: center;
          word-break: break-word;
        }
      }
    }

    .house-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      border-top: 1px solid #eee;
      padding-top: 12px;

      .price-text {
        font-size: 0.9rem;
        color: #666;

        .amount {
          font-size: 1.3rem;
          color: #d03050;
          font-weight: bold;
          margin: 0 2px;
        }
      }

      .house-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

@keyframes house-card-enter {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.975);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .search-section {
    padding-top: 42px;
    padding-bottom: 34px;

    .search-container {
      h1 {
        font-size: 1.9rem;
      }

      p {
        margin-bottom: 20px;
        font-size: 1rem;
      }
    }

    .search-box {
      flex-direction: column;

      :deep(.n-input) {
        min-width: 0;
      }

      button {
        width: 100%;
      }
    }
  }

  .filter-section {
    .filter-container {
      padding-top: 24px;
      padding-bottom: 20px;
    }

    .filter-header,
    .filter-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }

    .filter-header {
      margin-bottom: 18px;
    }

    .filter-row .label,
    .filter-row .content {
      width: 100%;
    }

    .filter-row .label {
      font-size: 14px;
    }

    .filter-row .content {
      overflow-x: auto;
      padding-bottom: 4px;
      -webkit-overflow-scrolling: touch;
    }

    .filter-row :deep(.n-space) {
      flex-wrap: nowrap;
    }
  }

  .house-showcase {
    padding-bottom: 48px;

    .house-masonry {
      grid-template-columns: 1fr;
      gap: 18px;
      margin-bottom: 28px;
    }
  }

  .house-card {
    .house-info {
      .house-price {
        align-items: flex-start;
        flex-direction: column;

        .house-actions {
          width: 100%;
          flex-wrap: wrap;

          :deep(.n-button) {
            flex: 1;
            min-height: 40px;
          }
        }
      }
    }
  }
}

@media (max-width: 576px) {
  .search-section {
    .search-container {
      h1 {
        font-size: 1.7rem;
      }
    }

    .search-box {
      padding: 8px;
      border-radius: 22px;
    }
  }

  .filter-section {
    .filter-header h2 {
      font-size: 1.05rem;
    }
  }

  .pagination-container {
    padding-top: 16px;

    :deep(.n-pagination) {
      width: 100%;
    }
  }

  .house-card {
    .house-image {
      height: 190px;
    }

    .house-info {
      padding: 14px;

      h3 {
        font-size: 1.05rem;
      }
    }
  }
}
</style>
