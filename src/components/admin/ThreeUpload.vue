<template>
  <div>
    <div v-if="previewModelUrl" class="preview-container">
      <n-button @click="showPreviewModal = true">
        {{ localPreviewUrl ? '预览当前选择' : '预览' }}
      </n-button>

      <n-text v-if="localPreviewUrl" depth="3">
        已生成本地预览，可先检查效果再上传。
      </n-text>
      <n-text v-else-if="warmingRemoteModel" depth="3">
        正在后台预热 3D 模型，打开预览会更快。
      </n-text>

      <n-modal
        v-model:show="showPreviewModal"
        preset="card"
        title="3D模型预览"
        size="huge"
        :style="{ width: '800px', height: '70vh' }"
        :bordered="false"
        class="glb-preview-modal"
      >
        <GlbHouse v-if="showPreviewModal" :URL="previewModelUrl" />
      </n-modal>

      <n-button v-if="current3DUrl" @click="handleDelete" size="small" type="error">
        删除3D模型
      </n-button>
    </div>

    <div class="upload-3d-container">
      <div class="upload-3d-title">
        {{ current3DUrl ? '重新上传3D文件' : '上传3D文件（建议优先使用 `.glb`）' }}
      </div>
      <input
        type="file"
        ref="fileInput"
        @change="handleFileSelect"
        accept=".glb,.gltf"
        class="upload-3d-input"
      />

      <n-progress
        v-if="uploading && uploadPhase === 'uploading'"
        type="line"
        :percentage="uploadProgress"
        :indicator-placement="'inside'"
        class="upload-3d-progress"
      />

      <div v-if="uploading && uploadPhase === 'processing'" class="processing-tip">
        <n-spin size="small" />
        <span>文件已上传，服务器正在优化3D模型，请稍候...</span>
      </div>

      <n-button
        @click="handleUpload"
        :loading="uploading"
        :disabled="!selectedFile || !canUpload"
        type="primary"
      >
        {{ uploading ? uploadButtonText : '上传3D文件' }}
      </n-button>

      <n-text v-if="!canUpload" depth="3" class="upload-tip">
        请先点击“提交”保存产品，生成产品ID后再上传3D文件。
      </n-text>

      <div v-if="selectedFile" class="file-info">
        <n-text depth="3">文件: {{ selectedFile.name }}</n-text>
        <br />
        <n-text depth="3">大小: {{ formatFileSize(selectedFile.size) }}</n-text>
        <br />
        <n-text depth="3">上传上限: {{ MAX_FILE_SIZE_MB }}MB</n-text>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import API from '@/api/house/house'
// *** 导入 GlbHouse ***
import GlbHouse from '@/components/operation/GlbHouse.vue' // (请确认 GlbHouse.vue 的实际路径)
import {
  forgetWarmedModelAsset,
  resolveModelAssetUrl,
  warmModelAsset,
} from '@/utils/modelAsset'

const message = useMessage()
const props = defineProps({
  productId: {
    type: Number,
    required: true,
  },
  initialUrl: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelUrl', 'delete'])

// 状态管理
const showPreviewModal = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const uploadProgress = ref(0)
const current3DUrl = ref(resolveModelAssetUrl(props.initialUrl))
const fileInput = ref(null)
const uploadPhase = ref('idle') // idle | uploading | processing
const localPreviewUrl = ref('')
const warmingRemoteModel = ref(false)

const MAX_FILE_SIZE_MB = 100
const canUpload = computed(() => Number(props.productId) > 0)
const uploadButtonText = computed(() =>
  uploadPhase.value === 'processing' ? '服务器优化中...' : '上传中...',
)
const previewModelUrl = computed(
  () => localPreviewUrl.value || current3DUrl.value || '',
)

const clearLocalPreview = () => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = ''
  }
}

const warmRemotePreview = async (url) => {
  const normalizedUrl = resolveModelAssetUrl(url)
  if (!normalizedUrl || normalizedUrl.startsWith('blob:')) return

  warmingRemoteModel.value = true
  try {
    await warmModelAsset(normalizedUrl)
  } catch (error) {
    console.warn('3D 模型预热失败，预览时将直接加载原始地址:', error)
  } finally {
    if (current3DUrl.value === normalizedUrl) {
      warmingRemoteModel.value = false
    }
  }
}

// 监听初始URL变化
watch(
  () => props.initialUrl,
  (newUrl) => {
    current3DUrl.value = resolveModelAssetUrl(newUrl)
  },
  { immediate: true },
)

watch(
  current3DUrl,
  (newUrl) => {
    if (newUrl) {
      warmRemotePreview(newUrl)
      return
    }
    warmingRemoteModel.value = false
  },
  { immediate: true },
)

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploadProgress.value = 0
  uploadPhase.value = 'idle'

  // 检查文件类型
  const lowerName = file.name.toLowerCase()
  if (!lowerName.endsWith('.glb') && !lowerName.endsWith('.gltf')) {
    message.error('请选择GLB或GLTF格式的文件')
    return
  }

  // 检查文件大小（与后端限制对齐为100MB）
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    message.error(`文件大小不能超过${MAX_FILE_SIZE_MB}MB`)
    return
  }

  clearLocalPreview()
  selectedFile.value = file
  localPreviewUrl.value = URL.createObjectURL(file)
}

// 处理上传
const handleUpload = async () => {
  if (!selectedFile.value) {
    message.error('请先选择3D文件')
    return
  }
  if (!canUpload.value) {
    message.warning('请先保存产品基础信息后再上传3D文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadPhase.value = 'uploading'

  try {
    const formData = new FormData()
    formData.append('model3dFile', selectedFile.value)

    const res = await API.add3dHouse(
      props.productId,
      formData,
      (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          if (uploadProgress.value >= 100) {
            uploadPhase.value = 'processing'
          }
        }
      }
    )

    // *** --- 这是修复 --- ***
    let modelUrl = ''
    // 检查 res.data.url (移除多余的 .data)
    if (res.data && res.data.url) {
      modelUrl = res.data.url
    }
    // *** --- 修复结束 --- ***

    if (modelUrl) {
      current3DUrl.value = resolveModelAssetUrl(modelUrl)
      emit('update:modelUrl', current3DUrl.value)
      clearLocalPreview()
      message.success('3D模型上传成功')

      // 重置状态
      selectedFile.value = null
      uploadProgress.value = 0
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    } else {
      // 这里的 res 包含了完整的响应对象，是正确的
      console.error('无法从响应中获取URL，响应结构:', res)
      message.error('无法获取上传后的URL，请检查响应结构')
    }
  } catch (error) {
    console.error('3D模型上传失败:', error)
    let errorMsg = '3D模型上传失败'

    if (error.code === 'ECONNABORTED') {
      errorMsg = '上传超时，建议稍后重试或压缩模型后再上传'
    } else if (error.response?.data?.msg) {
      errorMsg = error.response.data.msg
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    } else if (typeof error.response?.data === 'string' && error.response.data) {
      errorMsg = error.response.data
    }

    message.error(errorMsg)
  } finally {
    uploading.value = false
    uploadPhase.value = 'idle'
  }
}

// 处理删除
const handleDelete = async () => {
  try {
    await API.delete3dHouse(props.productId)
    forgetWarmedModelAsset(current3DUrl.value)
    current3DUrl.value = ''
    emit('update:modelUrl', '')
    emit('delete')
    message.success('3D模型删除成功')
  } catch (error) {
    console.error('3D模型删除失败:', error)
    message.error(
      '3D模型删除失败: ' +
        (error.response?.data?.msg ||
          error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : '') ||
          '未知错误')
    )
  }
}

onBeforeUnmount(() => {
  clearLocalPreview()
})
</script>

<style lang="scss" scoped>
.preview-container {
  margin-top: 10px;
  border: 1px solid #eaeaea;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.upload-3d-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-3d-title {
  margin-bottom: 10px;
}

.upload-3d-input {
  margin-bottom: 10px;
}

.upload-3d-progress {
  margin-bottom: 10px;
}

.file-info {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
}

.processing-tip {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.upload-tip {
  margin-top: 6px;
}

/* :deep 样式来穿透 n-modal */
:deep(.glb-preview-modal.n-card.n-modal) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.glb-preview-modal .n-card__content) {
  flex-grow: 1; /* 占据所有剩余空间 */
  padding: 0 !important; /* 移除内边距 */
  overflow: hidden; /* 防止 GlbHouse 溢出 */
}
</style>
