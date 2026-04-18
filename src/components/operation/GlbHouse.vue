<template>
  <div ref="container" class="glb-container">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中... {{ loadingPercent.toFixed(0) }}%</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { resolveModelAssetUrl, warmModelAsset } from '@/utils/modelAsset'

// 接收父容器尺寸
const props = defineProps({
  // URL 仍然需要
  URL: { type: String, default: '' },
  // *** 移除 width 和 height props ***
})

const container = ref(null)
// *** 新增: 加载状态 ***
const isLoading = ref(true)
const loadingPercent = ref(0)

let renderer, camera, scene
let controls
let mixer
let modelRoot = null
let modelMaxDim = 1
let minFramingDistance = 0
let clock = new THREE.Clock()
let isUnmounted = false

let animationFrameId = null
// *** 新增: 监听器实例 ***
let resizeObserver = null

const initScene = () => {
  scene = new THREE.Scene()
  // 偏中性灰蓝背景，突出模型边界
  scene.background = new THREE.Color(0xe1e6ee)
}

const initCamera = () => {
  // *** 修改: 宽高比先用 1，稍后在 resizeCanvas 中更新 ***
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000)
  camera.position.set(40, 30, 60) //相机位置
}

const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  })
  // 优化帧率稳定性，减少高 DPI 设备上的渲染压力
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

  // *** 修改: 初始尺寸设为容器尺寸 ***
  // (我们将在 onMounted 中调用 resizeCanvas 来设置正确尺寸)
  if (container.value) {
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.82
  if (container.value) {
    container.value.appendChild(renderer.domElement)
  }
}

const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.rotateSpeed = 0.72
  controls.zoomSpeed = 0.9
  controls.minDistance = 18
  controls.maxDistance = 220
  controls.maxPolarAngle = Math.PI * 0.495
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.65
  controls.target.set(0, 0, 0)
  controls.update()
  controls.enablePan = false
  
  // 按需渲染: 仅在相机视角发生变化时触发 render，大幅节省 GPU 开销
  controls.addEventListener('change', renderScene)
}

const centerModelToOrigin = (model) => {
  if (!model || !camera || !controls) return

  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())

  // 把模型几何中心对齐到场景原点，确保旋转轴心是模型本体中心
  model.position.sub(center)
}

const cacheModelBounds = (model) => {
  if (!model) return
  const normalizedBox = new THREE.Box3().setFromObject(model)
  const size = normalizedBox.getSize(new THREE.Vector3())
  modelMaxDim = Math.max(size.x, size.y, size.z) || 1
}

const fitCameraToModel = (preserveDirection = true) => {
  if (!camera || !controls) return

  const fov = THREE.MathUtils.degToRad(camera.fov)
  const fitHeightDistance = modelMaxDim / (2 * Math.tan(fov / 2))
  const fitWidthDistance = fitHeightDistance / Math.max(camera.aspect, 0.1)
  const computedDistance = 1.22 * Math.max(fitHeightDistance, fitWidthDistance)
  if (!minFramingDistance) {
    minFramingDistance = computedDistance
  }
  // 防止窗口从窄恢复到宽时相机过度靠近，导致模型看起来突然变大
  const distance = Math.max(computedDistance, minFramingDistance)

  // 视角保持略有透视，但高度以模型中线为主，避免“俯拍过高”
  let viewDirection
  if (preserveDirection) {
    viewDirection = camera.position.clone().sub(controls.target)
    if (viewDirection.lengthSq() < 1e-6) {
      viewDirection = new THREE.Vector3(1, 0.08, 1)
    }
    viewDirection.normalize()
  } else {
    viewDirection = new THREE.Vector3(1, 0.08, 1).normalize()
  }

  camera.position.copy(viewDirection.multiplyScalar(distance))
  camera.near = Math.max(distance / 120, 0.1)
  camera.far = distance * 24
  camera.updateProjectionMatrix()

  controls.target.set(0, 0, 0)
  controls.minDistance = distance * 0.55
  controls.maxDistance = distance * 3
  controls.update()
}

const initMeshes = async () => {
  // 开启全局缓存，当重复预览时直接从内存读取，实现“按需极速加载”
  THREE.Cache.enabled = true

  const modelUrl = resolveModelAssetUrl(props.URL)
  if (!modelUrl) {
    isLoading.value = false
    return
  }

  let resolvedLoaderUrl = modelUrl
  try {
    resolvedLoaderUrl = await warmModelAsset(modelUrl)
  } catch (error) {
    console.warn('模型预热失败，回退直接加载原始地址:', error)
  }

  if (isUnmounted) return

  const loader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
  dracoLoader.preload()
  loader.setDRACOLoader(dracoLoader)

  loader.load(
    resolvedLoaderUrl,
    (data) => {
      // 成功加载完成
      isLoading.value = false

      const model = data.scene
      model.scale.set(3.25, 3.25, 3.25)

      const tuneStudioMaterial = (material) => {
        if (!material || !material.isMaterial) return

        if ('envMapIntensity' in material) {
          material.envMapIntensity = 0.12
        }
        if ('metalness' in material && typeof material.metalness === 'number') {
          material.metalness = Math.min(material.metalness, 0.12)
        }
        if ('roughness' in material && typeof material.roughness === 'number') {
          material.roughness = Math.max(material.roughness, 0.72)
        }
        if ('clearcoat' in material && typeof material.clearcoat === 'number') {
          material.clearcoat = Math.min(material.clearcoat, 0.02)
        }
        if (
          'emissiveIntensity' in material &&
          typeof material.emissiveIntensity === 'number'
        ) {
          material.emissiveIntensity = Math.min(material.emissiveIntensity * 0.55, 0.55)
        }
        if ('emissive' in material && material.emissive?.isColor) {
          material.emissive.multiplyScalar(0.75)
        }

        material.needsUpdate = true
      }

      model.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => tuneStudioMaterial(mat))
          } else {
            tuneStudioMaterial(obj.material)
          }
        }
      })
      scene.add(model)
      modelRoot = model
      centerModelToOrigin(modelRoot)
      cacheModelBounds(modelRoot)
      fitCameraToModel(false)
      renderScene()

      if (data.animations?.length) {
        mixer = new THREE.AnimationMixer(model)
        const action = mixer.clipAction(data.animations[0])
        action.play()
      } else {
        // 如果没有动画，触发一次静态渲染
        renderScene()
      }
    },
    (xhr) => {
      // 核心修复: 利用真实下载字节计算百分比，解决一直在 0% 转圈圈的问题
      if (xhr.lengthComputable) {
        loadingPercent.value = (xhr.loaded / xhr.total) * 100
      }
    },
    (error) => {
      isLoading.value = false
      console.error('模型加载失败:', error)
    }
  )
}

const initLight = () => {
  // 基础环境光，抬亮阴影区域
  const ambientLight = new THREE.HemisphereLight(0xf5f8fd, 0xc5cedb, 0.52)
  scene.add(ambientLight)

  // 主光源，提供形体层次
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.72)
  keyLight.position.set(28, 36, 18)
  scene.add(keyLight)

  // 辅助光，弱化背面死黑
  const fillLight = new THREE.DirectionalLight(0xd4deef, 0.18)
  fillLight.position.set(-24, 16, -22)
  scene.add(fillLight)

  // 背光提轮廓，避免模型边缘糊成一片
  const rimLight = new THREE.DirectionalLight(0xf2f6ff, 0.12)
  rimLight.position.set(10, 22, -30)
  scene.add(rimLight)

  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  scene.environment = pmremGenerator.fromScene(
    new RoomEnvironment(),
    0.04
  ).texture
  pmremGenerator.dispose()
}

const renderScene = () => {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)

  let delta = clock.getDelta()
  if (mixer) {
    mixer.update(delta)
    renderScene() // 只有在有动画时才每帧渲染
  }
  
  if (controls) {
    controls.update() // update会处理阻尼缓动，如果视角发生变化会自动触发 'change' 事件去 renderScene
  }
}

const resizeCanvas = () => {
  if (!container.value || !renderer || !camera) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight
  if (width <= 0 || height <= 0) return

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  // 更新渲染器
  renderer.setSize(width, height, false)

  // 更新相机
  camera.aspect = width / height
  camera.updateProjectionMatrix()

  // 尺寸变化后重新取景，避免模型出现“越缩放越大”观感
  if (modelRoot) {
    fitCameraToModel()
    return
  }
  renderScene()
}

onMounted(() => {
  if (!container.value) return

  isUnmounted = false
  initScene()
  initCamera()
  initRenderer()
  initControls()
  initMeshes()
  initLight()
  animate()

  // *** 新增: 使用 ResizeObserver ***
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
  })
  // 观察容器
  resizeObserver.observe(container.value)

  // 立即执行一次以匹配初始大小
  resizeCanvas()
})

onBeforeUnmount(() => {
  isUnmounted = true
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  // *** 新增: 停止观察 ***
  if (resizeObserver && container.value) {
    resizeObserver.unobserve(container.value)
  }
  resizeObserver = null

  if (controls) controls.dispose()
  if (renderer) renderer.dispose()
  modelRoot = null
  modelMaxDim = 1
  minFramingDistance = 0

  // 清理场景
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
  }

  if (container.value && renderer.domElement) {
    container.value.removeChild(renderer.domElement)
  }
})
</script>

<style lang="scss" scoped>
/* *** 新增: 确保容器占满父元素 *** */
.glb-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 确保 canvas 不会溢出 */
  position: relative;
  /* 为叠加层定位 */
  background: radial-gradient(circle at 50% 15%, #e7edf5 0%, #d9e1ec 55%, #ccd5e3 100%);
}

.glb-container :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

/* 新增: 加载器样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(242, 246, 252, 0.82);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 8px;
  /* 匹配 n-card */
}

.loading-text {
  margin-top: 10px;
  font-size: 16px;
  color: #333;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1d6fe3;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
