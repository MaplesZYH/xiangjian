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
            <span class="design-file-link__icon" aria-hidden="true">
              <n-icon size="34">
                <DocumentAttachOutline />
              </n-icon>
            </span>
            <span class="design-file-link__content">
              <span class="design-file-link__title">
                {{ file.displayName || `${fileLabelPrefix}${index + 1}` }}
              </span>
              <span class="design-file-link__meta">点击查看或下载文件</span>
            </span>
          </a>
          <div class="design-upload-preview-meta">
            <n-tag size="small" :type="file.isLocal ? 'warning' : 'success'">
              {{ file.isLocal ? '待上传' : '已保存' }}
            </n-tag>
            <n-button v-if="!readonly" text type="error" @click="emit('remove-file', file.key)">
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
        :disabled="readonly"
        @change="handleFileChange"
      />
      <n-space v-if="!readonly">
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
import { DocumentAttachOutline } from '@/icons/ionicons'

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
  readonly: {
    type: Boolean,
    default: false,
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
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;
  padding: 14px 16px;
  border: 1px solid #d8e7da;
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(39, 110, 61, 0.12) 0%, rgba(39, 110, 61, 0.04) 100%),
    #f8fcf8;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.design-file-link:hover {
  transform: translateY(-1px);
  border-color: #276e3d;
  box-shadow: 0 12px 28px rgba(39, 110, 61, 0.12);
}

.design-file-link__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #eef7f0 100%);
  color: #276e3d;
  box-shadow: inset 0 0 0 1px rgba(39, 110, 61, 0.08);
}

.design-file-link__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.design-file-link__title {
  color: #1f2a22;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
}

.design-file-link__meta {
  color: #5f6f62;
  font-size: 12px;
  line-height: 1.4;
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

  .design-file-link {
    width: 100%;
    padding: 14px;
  }

  .design-file-link__icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }

  .design-upload-preview-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
