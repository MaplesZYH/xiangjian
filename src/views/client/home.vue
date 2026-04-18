<!-- App.vue -->
<template>
  <Navigation />
  <section class="carousel-container" :class="{ 'hero-ready': heroReady }">
    <div
      v-for="(slide, index) in slides"
      :key="index"
      class="carousel-slide"
      :class="{ active: index === currentSlide }"
      :style="{ backgroundImage: `url(${slide.bg})` }"
    >
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <h1>{{ slide.title }}</h1>
        <p>{{ slide.desc }}</p>
      </div>
    </div>
    <div class="fixed-buttons">
      <router-link to="/houseList" class="action-btn primary-btn"
        >浏览户型</router-link
      >
      <button
        class="action-btn secondary-btn"
        type="button"
        @click="handleConsultationClick"
      >
        预约咨询
      </button>
    </div>
  </section>

  <!-- 服务特色 -->
  <section class="content-section scroll-reveal">
    <div class="section-header scroll-reveal">
      <h2>我们的服务特色</h2>
      <p>从设计到入住，我们为您提供全方位的乡村建房服务，让您省心省力</p>
    </div>

    <div class="features scroll-reveal">
      <div v-for="f in features" :key="f.title" class="feature-card scroll-reveal">
        <div class="feature-title">
          <div class="feature-icon">
            <n-icon :component="f.icon" :size="24" />
          </div>
          <h3>{{ f.title }}</h3>
        </div>
        <p>{{ f.desc }}</p>
      </div>
    </div>
  </section>

  <!-- 热门户型 -->
  <section class="content-section house-types scroll-reveal">
    <div class="section-header scroll-reveal">
      <h2>最新户型展示</h2>
      <p>按最新上传时间展示现代、中式、欧式三种风格的代表户型</p>
    </div>

    <div class="type-gallery scroll-reveal">
      <div
        v-for="t in houseTypes"
        :key="t.style"
        class="type-card scroll-reveal"
        :class="{ 'type-card--empty': !t.id }"
        @click="handleHouseTypeClick(t)"
      >
        <div class="type-image">
          <SmartImage
            class="type-image__img"
            :src="t.image"
            :alt="t.title"
            loading="lazy"
            decoding="async"
            :placeholder="DEFAULT_HOUSE_IMAGE"
          />
        </div>
        <div class="type-info">
          <h3>{{ t.title }}</h3>
          <p>{{ t.desc }}</p>
          <div class="type-fixed-copy">
            {{ t.fixedDescription }}
          </div>
          <div class="type-stats">
            <span>面积: {{ t.area }}</span>
            <span>参考价: {{ t.price }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="content-section advantage-section scroll-reveal">
    <div class="section-header scroll-reveal">
      <h2>我们的优势</h2>
      <p>从平台统筹到工厂生产，再到落地施工，提供更完整的一站式乡建服务能力</p>
    </div>

    <div class="advantage-grid scroll-reveal">
      <div
        v-for="item in advantageCards"
        :key="item.title"
        class="advantage-card scroll-reveal"
        :style="{ '--advantage-bg': `url(${item.bg})` }"
      >
        <div class="advantage-index">{{ item.index }}</div>
        <h3>{{ item.title }}</h3>
        <p v-for="line in item.lines" :key="line">{{ line }}</p>
      </div>
    </div>
  </section>

  <!-- 底部 -->
  <Footer></Footer>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick, h, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useNotification } from 'naive-ui'
import {
  ColorPaletteOutline,
  HammerOutline,
  PricetagOutline,
} from '@/icons/ionicons'
import { useProductStore } from '@/stores/product/useProductStore'
import { getAssetPrimaryUrl } from '@/utils/asset'
import SmartImage from '@/components/common/SmartImage.vue'

const notification = useNotification()
const router = useRouter()
const productStore = useProductStore()
const { clientFeaturedProductMap } = storeToRefs(productStore)
const heroReady = ref(false)
let revealObserver = null

// 1. 轮播图
const slides = [
  {
    bg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80',
    title: '乡建在线 - 乡村建房好帮手',
    desc: '专业团队为您提供一站式乡村建房解决方案，从设计到施工，全程无忧，打造您梦想中的家园',
    primaryIcon: 'bi bi-house-door',
    primaryText: '浏览户型',
    secondaryIcon: 'bi bi-calendar-check',
    secondaryText: '预约咨询',
  },
  {
    bg: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80',
    title: '专业设计，品质施工',
    desc: '拥有十年乡村建房经验的设计施工团队，结合传统与现代元素，打造既美观又实用的乡村住宅',
    primaryIcon: 'bi bi-images',
    primaryText: '查看案例',
    secondaryIcon: 'bi bi-chat-dots',
    secondaryText: '在线咨询',
  },
  {
    bg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80',
    title: '透明报价，全程无忧',
    desc: '从地基到屋顶，每一项费用清晰透明，无隐藏消费，专业监理全程监督，确保施工质量',
    primaryIcon: 'bi bi-calculator',
    primaryText: '费用计算',
    secondaryIcon: 'bi bi-telephone',
    secondaryText: '联系客服',
  },
]
const currentSlide = ref(0)
let timer = null
const preloadedHeroImages = new Set()

const preloadHeroImage = (index) => {
  const slide = slides[index]
  if (!slide?.bg || preloadedHeroImages.has(slide.bg) || typeof Image === 'undefined') {
    return
  }

  const img = new Image()
  img.decoding = 'async'
  img.src = slide.bg
  preloadedHeroImages.add(slide.bg)
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}
onMounted(() => {
  timer = setInterval(nextSlide, 5000)
})
onUnmounted(() => clearInterval(timer))

// 2. 导航栏滚动 + 移动端菜单
const scrolled = ref(false)
const handleScroll = () => {
  scrolled.value = window.scrollY > 50
}
onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 3. 服务特色
const features = [
  {
    icon: ColorPaletteOutline,
    title: '专业设计',
    desc: '由资深设计师团队为您量身定制，结合当地特色与现代审美，打造独一无二的乡村住宅。',
  },
  {
    icon: HammerOutline,
    title: '品质施工',
    desc: '经验丰富的施工团队，严格的质量管控体系，确保每一处细节都完美呈现。',
  },
  {
    icon: PricetagOutline,
    title: '透明报价',
    desc: '清晰透明的费用明细，无隐藏消费，让您对每一分钱的花费都心中有数。',
  },
]

const DEFAULT_HOUSE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#eef2f7"/><rect x="145" y="90" width="350" height="200" rx="20" fill="#d3dbe6"/><path d="M190 250l82-88 70 67 52-58 56 79H190z" fill="#95a3b8"/><circle cx="270" cy="150" r="26" fill="#f8fbff"/><text x="320" y="345" text-anchor="middle" font-size="28" fill="#667085" font-family="Arial, sans-serif">暂无户型图片</text></svg>',
)}`

const houseTypeMetaMap = {
  modern: {
    style: 'modern',
    title: '现代风格',
    emptyTitle: '现代风格最新户型',
    emptyDesc: '当前暂无现代风格户型数据',
    fixedDescription:
      '强调通透采光与高效动线，适合偏好简洁生活方式的家庭。',
  },
  chinese: {
    style: 'chinese',
    title: '中式风格',
    emptyTitle: '中式风格最新户型',
    emptyDesc: '当前暂无中式风格户型数据',
    fixedDescription:
      '突出庭院秩序与东方居住氛围，兼顾礼序感与日常舒适度。',
  },
  european: {
    style: 'european',
    title: '欧式风格',
    emptyTitle: '欧式风格最新户型',
    emptyDesc: '当前暂无欧式风格户型数据',
    fixedDescription:
      '更注重立面层次和空间仪式感，适合追求经典气质的居住需求。',
  },
}

const trimTrailingZeros = (value) => String(value).replace(/\.?0+$/, '')

const formatPriceDisplay = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return '--'
  if (num >= 10000) {
    return `${trimTrailingZeros((num / 10000).toFixed(2))}万`
  }
  return `${trimTrailingZeros(num.toFixed(2))}元`
}

const getHouseImageSource = (house) => {
  if (house?.coverImageUrl && String(house.coverImageUrl).startsWith('http')) {
    return getAssetPrimaryUrl(house.coverImageUrl)
  }
  if (house?.renderings?.length > 0) {
    return getAssetPrimaryUrl(house.renderings[0]?.url) || ''
  }
  return ''
}

const getHouseLayout = (house) => {
  if (Array.isArray(house?.roomLayout)) {
    const [room, hall, bath] = house.roomLayout
    return `${room || 0}室${hall || 0}厅${bath || 0}卫`
  }
  return '户型信息待完善'
}

const buildHouseTypeCard = (style, house) => {
  const meta = houseTypeMetaMap[style]
  if (!house) {
    return {
      style: meta.style,
      id: null,
      image: '',
      title: meta.emptyTitle,
      desc: meta.emptyDesc,
      fixedDescription: meta.fixedDescription,
      area: '--',
      price: '--',
    }
  }

  return {
    style: meta.style,
    id: house.id,
    image: getHouseImageSource(house),
    title: house.name || meta.title,
    desc: `${house.constructionMethod || '施工方式待定'} · ${getHouseLayout(house)}`,
    fixedDescription: meta.fixedDescription,
    area: house.buildArea ? `${house.buildArea}m²` : '--',
    price: formatPriceDisplay(house.price),
  }
}

const advantageCards = [
  {
    index: '01',
    title: '平台综合服务',
    bg: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    lines: [
      '通过线上网络和线下基地整合多家专业机构',
      '集成咨询、规划、设计、建设、运营等多种服务',
      '为政府打造示范村',
      '为群众乡村自建房提供便捷、高效、优质的综合一站服务',
    ],
  },
  {
    index: '02',
    title: '工厂标准生产',
    bg: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
    lines: [
      '平台根据大数据梳理需求',
      '输出符合当地特征的产品',
      '提供专业规范的设计',
      '工厂根据图纸标准化生产构件',
    ],
  },
  {
    index: '03',
    title: '现场规范施工',
    bg: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    lines: [
      '平台制定施工规范',
      '认证的供应商根据规范现场施工',
      '平台派专人监督实施',
      '验收后交付安全舒适的成品',
    ],
  },
]

const houseTypes = computed(() => {
  const latestByStyle = {
    modern: clientFeaturedProductMap.value?.modern || null,
    chinese: clientFeaturedProductMap.value?.chinese || null,
    european: clientFeaturedProductMap.value?.european || null,
  }

  return ['modern', 'chinese', 'european'].map((style) =>
    buildHouseTypeCard(style, latestByStyle[style] || null),
  )
})

const handleHouseTypeClick = (house) => {
  if (!house?.id) return
  router.push(`/houseDetail/${house.id}`)
}

const handleConsultationClick = () => {
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

const observeRevealElements = async () => {
  await nextTick()

  if (typeof window === 'undefined') return
  const elements = Array.from(document.querySelectorAll('.scroll-reveal'))

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'))
    return
  }

  revealObserver?.disconnect()
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      })
    },
    {
      threshold: 0.04,
      rootMargin: '0px 0px 18% 0px',
    },
  )

  elements.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${index * 40}ms`)
    revealObserver?.observe(element)
  })
}

onMounted(() => {
  productStore
    .fetchClientFeaturedProducts(['modern', 'chinese', 'european'])
    .catch((error) => {
    console.error('获取首页最新户型失败:', error)
  })
  observeRevealElements()
  requestAnimationFrame(() => {
    heroReady.value = true
  })
  preloadHeroImage(0)
  preloadHeroImage(1)
})

onUnmounted(() => {
  revealObserver?.disconnect()
})

watch(currentSlide, (value) => {
  preloadHeroImage(value)
  preloadHeroImage((value + 1) % slides.length)
})
</script>

<style>
/* 固定按钮容器 */
.fixed-buttons {
  position: absolute;
  left: 50%;
  bottom: clamp(40px, 8vh, 80px);
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  width: min(calc(100% - 32px), 640px);
  justify-content: center;
  z-index: 10;
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .fixed-buttons {
    flex-direction: column;
    width: min(calc(100% - 32px), 320px);
  }
}
/* 轮播图样式 */
.carousel-container {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 70px);
  height: calc(100vh - 70px);
  overflow: hidden;
  background: #08140d;
}

.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 1.5s ease-in-out;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(1.08);
  will-change: transform, opacity;
}

.carousel-slide.active {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 1.5s ease-in-out,
    transform 5.2s ease-out;
}

.carousel-container.hero-ready .carousel-slide.active {
  animation: heroBackgroundReveal 1.4s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.slide-content {
  text-align: center;
  color: white;
  width: min(calc(100% - 32px), 800px);
  padding: 20px 16px;
  z-index: 2;
  opacity: 0;
  transform: translateY(26px);
}

.carousel-container.hero-ready .slide-content {
  animation: heroContentReveal 0.9s ease-out 0.18s both;
}

.carousel-container.hero-ready .fixed-buttons {
  animation: heroButtonsReveal 0.85s ease-out 0.32s both;
}

.slide-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.slide-content h1 {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.slide-content p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.action-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.action-btn i {
  margin-right: 8px;
}

.primary-btn {
  background: var(--color-brand-500);
  color: white;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.action-btn:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-medium);
}

/* 内容区域样式 */
.content-section {
  padding: 80px var(--page-gutter);
  background: var(--color-surface);
}

.scroll-reveal {
  opacity: 0;
  transform: translateY(38px);
  transition:
    opacity 0.75s ease,
    transform 0.75s ease;
  transition-delay: var(--reveal-delay, 0ms);
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-header h2 {
  font-size: 2.5rem;
  color: var(--color-brand-900);
  margin-bottom: 15px;
}

.section-header p {
  color: #666;
  font-size: 1.1rem;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 50px;
}

.feature-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 30px;
  transition: all 0.3s ease;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-xs);
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-sm);
  border-color: var(--color-brand-500);
}

.feature-title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.feature-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 1.6rem;
  color: var(--color-brand-500);
  background: rgba(39, 110, 61, 0.1);
}

.feature-card h3 {
  margin: 0;
  font-size: 1.35rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* 户型展示 */
.house-types {
  background: var(--color-page);
}

.type-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.type-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-xs);
  transition: all 0.3s ease;
  cursor: pointer;
}

.type-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-soft);
}

.type-card--empty {
  cursor: default;
}

.type-card--empty:hover {
  transform: none;
  box-shadow: var(--shadow-xs);
}

.type-image {
  height: 250px;
  overflow: hidden;
  background: #eef2f7;
}

.type-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.type-info {
  padding: 25px;
}

.type-info h3 {
  font-size: 1.4rem;
  margin-bottom: 10px;
  color: var(--color-brand-900);
}

.type-info p {
  color: #666;
  margin-bottom: 12px;
  line-height: 1.6;
}

.type-fixed-copy {
  min-height: 52px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--gradient-soft);
  color: var(--color-text-secondary);
  line-height: 1.7;
  font-size: 0.95rem;
}

.type-stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #eee;
  padding-top: 15px;
  margin-top: 15px;
  color: var(--color-brand-500);
  font-weight: 500;
}

.advantage-section {
  background: linear-gradient(180deg, #ffffff 0%, #f7faf8 100%);
}

.advantage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.advantage-card {
  position: relative;
  padding: 32px 26px 28px;
  border-radius: var(--radius-3xl);
  background:
    linear-gradient(180deg, rgba(14, 31, 22, 0.32), rgba(14, 31, 22, 0.78)),
    var(--advantage-bg) center/cover no-repeat;
  border: 1px solid rgba(39, 110, 61, 0.1);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.advantage-card:first-child {
  animation: advantageFirstCardReveal 0.9s ease-out both;
  transform-origin: center bottom;
}

.advantage-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: linear-gradient(90deg, var(--color-brand-700) 0%, var(--color-brand-500) 100%);
}

.advantage-index {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(228, 244, 233, 0.88);
  margin-bottom: 16px;
}

.advantage-card h3 {
  margin: 0 0 16px;
  font-size: 1.5rem;
  color: #ffffff;
}

.advantage-card p {
  margin: 0 0 10px;
  color: rgba(244, 248, 245, 0.88);
  line-height: 1.75;
}

.advantage-card p:last-child {
  margin-bottom: 0;
}

@keyframes advantageFirstCardReveal {
  0% {
    opacity: 0;
    transform: translateY(28px) scale(0.96);
    box-shadow: 0 26px 40px rgba(37, 54, 43, 0.05);
  }
  60% {
    opacity: 1;
    transform: translateY(-4px) scale(1.01);
    box-shadow: var(--shadow-medium);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    box-shadow: var(--shadow-soft);
  }
}

@keyframes heroBackgroundReveal {
  0% {
    opacity: 0;
    transform: scale(1.12);
    filter: blur(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

@keyframes heroContentReveal {
  0% {
    opacity: 0;
    transform: translateY(32px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heroButtonsReveal {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(24px);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 底部样式 */
footer {
  background: var(--color-brand-900);
  color: white;
  padding: 60px 5% 30px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-column h3 {
  font-size: 1.4rem;
  margin-bottom: 25px;
  position: relative;
  padding-bottom: 10px;
}

.footer-column h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: var(--color-brand-500);
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: #bbb;
  text-decoration: none;
  transition: all 0.3s ease;
  display: block;
}

.footer-links a:hover {
  color: var(--color-brand-500);
  transform: translateX(5px);
}

.contact-info {
  color: #bbb;
  line-height: 1.8;
}

.social-links {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  transition: all 0.3s ease;
}

.social-links a:hover {
  background: var(--color-brand-500);
  transform: translateY(-5px);
}

.copyright {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #bbb;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .carousel-container {
    min-height: calc(100vh - 70px);
    height: auto;
  }

  .slide-content h1 {
    font-size: 2.8rem;
  }

  .section-header {
    margin-bottom: 40px;
  }

  .features,
  .type-gallery {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 22px;
  }

  .advantage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .carousel-container {
    min-height: calc(100vh - 64px);
  }

  .slide-content {
    width: min(calc(100% - 28px), 560px);
  }

  .slide-content h1 {
    font-size: 2.2rem;
    margin-bottom: 14px;
  }

  .slide-content p {
    margin-bottom: 22px;
    font-size: 1.05rem;
  }

  .action-btn {
    width: 100%;
    min-height: 48px;
  }

  .section-header h2 {
    font-size: 2rem;
  }

  .section-header p {
    font-size: 1rem;
  }

  .content-section {
    padding-top: 64px;
    padding-bottom: 64px;
  }

  .feature-card,
  .type-info,
  .advantage-card {
    padding: 22px 18px;
  }

  .type-image {
    height: 220px;
  }

  .type-stats {
    flex-direction: column;
    align-items: flex-start;
  }

  .advantage-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .carousel-container {
    min-height: max(560px, calc(100vh - 64px));
  }

  .slide-content h1 {
    font-size: 1.8rem;
  }

  .slide-content p {
    font-size: 1rem;
  }

  .fixed-buttons {
    bottom: 28px;
    width: calc(100% - 24px);
  }

  .content-section {
    padding: 56px var(--page-gutter);
  }

  .features,
  .type-gallery {
    grid-template-columns: 1fr;
  }

  .feature-icon {
    width: 46px;
    height: 46px;
    font-size: 1.4rem;
  }

  .type-image {
    height: 200px;
  }
}
</style>
