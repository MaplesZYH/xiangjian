<template>
  <n-form class="design-upload-form" label-placement="top">
    <n-alert :type="tipType" class="design-upload-tip">
      {{ tipText }}
    </n-alert>

    <n-form-item label="文件预览">
      <div v-if="files.length" class="design-upload-preview-list">
        <div
          v-for="(file, index) in files"
          :key="file.key"
          class="design-upload-preview-item"
        >
          <a
            class="design-file-link"
            :href="getDraftFileHref(file)"
            target="_blank"
            rel="noreferrer"
          >
            {{ file.displayName || `${fileLabelPrefix}${index + 1}` }}
          </a>
          <div class="design-upload-preview-meta">
            <n-tag size="small" :type="file.isLocal ? 'warning' : 'success'">
              {{ file.isLocal ? '待上传' : '已保存' }}
            </n-tag>
            <n-button text type="error" @click="emit('remove-file', file.key)">
              移除
            </n-button>
          </div>
        </div>
      </div>
      <n-empty v-else :description="emptyDescription" />
    </n-form-item>

    <div class="design-upload-block">
      <input
        ref="fileInputRef"
        class="design-upload-input"
        type="file"
        multiple
        :accept="accept"
        @change="handleFileChange"
      />
      <n-space>
        <n-button :type="selectButtonType" secondary @click="openFileSelector">
          {{ selectButtonText }}
        </n-button>
        <n-button tertiary :disabled="!files.length" @click="emit('clear-files')">
          清空列表
        </n-button>
      </n-space>
    </div>
  </n-form>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  tipType: {
    type: String,
    default: 'info',
  },
  tipText: {
    type: String,
    default: '',
  },
  files: {
    type: Array,
    default: () => [],
  },
  emptyDescription: {
    type: String,
    default: '暂无文件',
  },
  selectButtonType: {
    type: String,
    default: 'primary',
  },
  selectButtonText: {
    type: String,
    default: '选择文件',
  },
  accept: {
    type: String,
    default: '',
  },
  fileLabelPrefix: {
    type: String,
    default: '文件',
  },
  getDraftFileHref: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['files-selected', 'remove-file', 'clear-files'])

const fileInputRef = ref(null)

const openFileSelector = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event) => {
  const fileList = Array.from(event?.target?.files || [])
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  if (!fileList.length) return
  emit('files-selected', fileList)
}
</script>

<style lang="scss" scoped>
.design-file-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background: #f3f7f4;
  color: #276e3d;
  font-weight: 600;
  text-decoration: none;
}

.design-upload-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.design-upload-tip {
  margin-bottom: 4px;
}

.design-upload-preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.design-upload-preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5efe8;
  border-radius: 10px;
  background: #fafcfb;
}

.design-upload-preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.design-upload-block {
  margin-top: 12px;
}

.design-upload-input {
  display: none;
}

@media (max-width: 768px) {
  .design-upload-preview-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .design-upload-preview-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
