<template>
  <n-form-item :label="props.label">
    <div class="photo-wall">
      <div v-for="(image, index) in displayImages" :key="getImageKey(image, index)" class="photo-item">
        <div class="photo-wrapper">
          <SmartImage
            :src="getImageUrl(image)"
            class="photo-image"
            alt="上传图片"
            loading="lazy"
            decoding="async"
            @click="handlePreview(image)"
          />
          <n-button circle size="small" type="error" class="delete-btn" @click="handleMarkDelete(image)">
            ×
          </n-button>
          <div v-if="isMarkedForDelete(image)" class="delete-overlay">
            <span>待删除</span>
          </div>
        </div>
      </div>

      <div v-for="(file, index) in previewFiles" :key="'preview-' + file.id" class="photo-item">
        <div class="photo-wrapper">
          <SmartImage
            :src="file.previewUrl"
            class="photo-image"
            alt="新上传图片"
            loading="lazy"
            decoding="async"
            @click="handlePreview(file)"
          />
          <n-button circle size="small" type="warning" class="delete-btn" @click="handleRemovePreview(index)">
            ×
          </n-button>
          <div class="preview-overlay">
            <span>新图片</span>
          </div>
        </div>
      </div>

      <div v-if="showUploadButton" class="upload-item" @click="$refs.fileInput.click()">
        <n-icon size="30" color="#ccc">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </n-icon>
        <span>{{ props.uploadText }}</span>
      </div>

      <input type="file" ref="fileInput" @change="handleFileUpload" :accept="props.accept" :multiple="props.multiple"
        class="photo-wall-input" />
    </div>

    <n-modal v-model:show="showPreviewModal" preset="card" title="图片预览">
      <div class="preview-modal-body">
        <SmartImage
          :src="previewImageUrl"
          class="preview-modal-image"
          alt="图片预览"
          loading="eager"
          decoding="async"
        />
      </div>
    </n-modal>

    <div v-if="hasPendingOperations" class="operation-hint">
      <n-alert type="info" :show-icon="false">
        有 {{ pendingDeleteCount }} 张图片待删除，{{ previewFiles.length }}
        张新图片待上传
        <n-button size="tiny" @click="handleCancelAll" class="operation-hint__action">
          取消所有操作
        </n-button>
      </n-alert>
    </div>
  </n-form-item>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useMessage } from 'naive-ui'
import { compressImage } from '@/utils/imageCompress'
import { resolveAssetUrl } from '@/utils/asset'
import SmartImage from '@/components/common/SmartImage.vue'

const message = useMessage()

const props = defineProps({
  label: {
    type: String,
    default: '图片',
  },
  uploadText: {
    type: String,
    default: '添加图片',
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  accept: {
    type: String,
    default: 'image/*',
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  maxSize: {
    type: Number,
    default: 1000,
  },
  // --- 新增：max 属性 ---
  max: {
    type: Number,
    default: Infinity, // 默认无限
  },
  // ---
})

const emit = defineEmits([
  'update:modelValue',
  'pending-delete',
  'pending-upload',
  'cancel-operations',
])

const fileInput = ref(null)
const showPreviewModal = ref(false)
const previewImageUrl = ref('')

const pendingDeleteIds = ref(new Set())
const previewFiles = ref([])

const revokePreviewFileUrl = (file) => {
  if (file?.previewUrl) {
    URL.revokeObjectURL(file.previewUrl)
  }
}

const clearPreviewFiles = () => {
  previewFiles.value.forEach(revokePreviewFileUrl)
  previewFiles.value = []
}

const getImageKey = (image, index) => {
  if (image && typeof image === 'object') {
    return image.id || image.url || `image-${index}`
  }
  return `image-${index}`
}

const getImageId = (image) => {
  if (image && typeof image === 'object') {
    return image.id || image.url
  }
  return image
}

const displayImages = computed(() => {
  return props.modelValue.filter((image) => {
    const imageId = getImageId(image)
    return !pendingDeleteIds.value.has(imageId)
  })
})

const pendingDeleteCount = computed(() => pendingDeleteIds.value.size)

const hasPendingOperations = computed(() => {
  return pendingDeleteCount.value > 0 || previewFiles.value.length > 0
})

// --- 新增：计算属性，用于控制上传按钮的显示 ---
const totalImageCount = computed(() => {
  return displayImages.value.length + previewFiles.value.length
})

const showUploadButton = computed(() => {
  return totalImageCount.value < props.max
})
// ---

const getImageUrl = (image) => {
  if (typeof image === 'string') {
    return resolveAssetUrl(image)
  }
  return resolveAssetUrl(image.url || image.path || '')
}

const handleMarkDelete = (image) => {
  const imageId = getImageId(image)
  pendingDeleteIds.value.add(imageId)
  emitPendingOperations()
}

const isMarkedForDelete = (image) => {
  const imageId = getImageId(image)
  return pendingDeleteIds.value.has(imageId)
}

const getPendingDeleteImages = () => {
  const deleteList = []
  props.modelValue.forEach((image, index) => {
    const imageId = getImageId(image)
    if (pendingDeleteIds.value.has(imageId)) {
      deleteList.push({
        index: index,
        image: image,
        id: imageId,
      })
    }
  })
  return deleteList
}

// 处理文件选择
const handleFileUpload = async (event) => {
  let files = Array.from(event.target.files)
  if (files.length === 0) {
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  // --- 检查 max 数量限制 ---
  const currentCount = totalImageCount.value
  const remainingSlots = props.max - currentCount

  if (remainingSlots <= 0) {
    message.error(`已达到 ${props.max} 张图片上限。`)
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  if (files.length > remainingSlots) {
    message.warn(
      `最多只能再添加 ${remainingSlots} 张图片，已自动截取前 ${remainingSlots} 张。`
    )
    files = files.slice(0, remainingSlots)
  }

  // 检查文件类型
  const invalidFiles = files.filter((file) => !file.type.startsWith('image/'))
  if (invalidFiles.length) {
    message.error('请选择图片文件')
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  // 检查初始文件大小
  const maxSizeBytes = props.maxSize * 1024 * 1024
  const oversizedFiles = files.filter((file) => file.size > maxSizeBytes)
  if (oversizedFiles.length) {
    message.error(`有文件原图大小超过 ${props.maxSize}MB`)
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  // 开启异步压缩处理
  const compressingMessage = message.loading('图片处理中, 请稍候...', {
    duration: 0
  })
  
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          // 对大图进行压缩
          const compressedFile = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.8 })
          return compressedFile
        } catch (e) {
          console.error('图片压缩失败, 回退到原图', e)
          return file
        }
      })
    )

    // 为每个文件生成预览URL并添加到预览列表
    processedFiles.forEach((file) => {
      const previewUrl = URL.createObjectURL(file)
      previewFiles.value.push({
        id: `preview-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        name: file.name,
      })
    })

    emitPendingOperations()
    message.success(`成功载入 ${processedFiles.length} 个文件，将在点击确定后上传`)
  } catch (error) {
    console.error('上传图片处理出错', error)
    message.error('图片加载失败')
  } finally {
    compressingMessage.destroy()
    // 清空input值，允许重复选择相同文件
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// 移除预览文件
const handleRemovePreview = (index) => {
  revokePreviewFileUrl(previewFiles.value[index])
  previewFiles.value.splice(index, 1)
  emitPendingOperations()
}

// 图片预览
const handlePreview = (image) => {
  previewImageUrl.value =
    typeof image === 'object'
      ? image.previewUrl || resolveAssetUrl(image.url || image.path || '')
      : resolveAssetUrl(image)
  showPreviewModal.value = true
}

// 获取待上传的文件
const getPendingUploadFiles = () => {
  return previewFiles.value.map((item) => item.file)
}

// 提交所有操作（在父组件点击确定时调用）
const submitOperations = () => {
  const operations = {
    delete: getPendingDeleteImages(),
    upload: getPendingUploadFiles(),
  }

  // 清空预览文件和待删除标记
  clearPreviewFiles()
  pendingDeleteIds.value.clear()

  return operations
}

// 取消所有操作
const handleCancelAll = () => {
  clearPreviewFiles()
  pendingDeleteIds.value.clear()
  emit('cancel-operations')
}

// 在 ImgUpload.vue 中，确保只在有真实变化时才触发事件
const emitPendingOperations = () => {
  // 添加检查，避免空操作
  const deleteList = getPendingDeleteImages()
  const uploadList = getPendingUploadFiles()

  if (deleteList.length > 0 || uploadList.length > 0) {
    emit('pending-delete', deleteList)
    emit('pending-upload', uploadList)
  }
}

// 清空所有操作
const clearPendingOperations = () => {
  handleCancelAll()
}

// 暴露方法给父组件
defineExpose({
  submitOperations,
  clearPendingOperations,
  getPendingDeleteImages,
  getPendingUploadFiles,
})

onBeforeUnmount(() => {
  clearPreviewFiles()
})
</script>

<style lang="scss" scoped>
.photo-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.photo-item {
  width: 100px;
  height: 100px;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  overflow: hidden;
  position: relative;

  .photo-wrapper {
    width: 100%;
    height: 100%;
    position: relative;

    .photo-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
      transition: opacity 0.3s;

      &:hover {
        opacity: 0.8;
      }
    }

    .delete-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 20px;
      height: 20px;
      min-width: 20px;
      font-size: 14px;
      font-weight: bold;
      z-index: 2;
    }

    .delete-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 255, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
  }
}

.upload-item {
  width: 100px;
  height: 100px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #ccc;

  &:hover {
    border-color: #409eff;
    color: #409eff;
  }

  span {
    margin-top: 5px;
    font-size: 12px;
  }
}

.operation-hint {
  margin-top: 10px;
}

.operation-hint__action {
  margin-left: 10px;
}

.photo-wall-input {
  display: none;
}

.preview-modal-body {
  text-align: center;
}

.preview-modal-image {
  max-width: 100%;
  max-height: 70vh;
}

.selected-files {
  margin-top: 10px;

  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    border: 1px solid #eaeaea;
    border-radius: 4px;
    margin-bottom: 5px;

    span {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
