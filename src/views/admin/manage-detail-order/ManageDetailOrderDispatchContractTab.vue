<template>
  <div class="dispatch-panel">
    <n-alert type="info" class="inline-alert-lg">
      当前流程为：平台上传合同后即可进入派单；支付状态用于财务跟进，但不再作为合同上传或派单的前置条件。重新上传将覆盖原有合同。
    </n-alert>
    <n-alert v-if="!currentContractUrl" type="warning" class="inline-alert-md">
      请先上传合同，上传完成后即可进入派单。
    </n-alert>
    <n-alert v-else type="success" class="inline-alert-md">
      合同已上传，可继续派单。当前支付状态：{{ getPaymentText(detailOrder?.paymentStatus) }}
    </n-alert>

    <div class="contract-section">
      <div v-if="currentContractUrl" class="preview-area">
        <div class="preview-title">当前生效合同：</div>
        <div class="preview-content">
          <div v-if="isImage(currentContractUrl)" class="image-preview">
            <n-image
              width="200"
              :src="currentContractUrl"
              :preview-src="currentContractUrl"
              object-fit="contain"
              class="contract-preview-image"
            />
          </div>
          <div v-else class="file-link-card">
            <n-icon size="40" color="#2080f0">
              <DocumentAttachOutline />
            </n-icon>
            <div class="contract-link-actions">
              <n-button
                tag="a"
                :href="currentContractUrl"
                target="_blank"
                type="primary"
                text
              >
                下载/查看合同
              </n-button>
            </div>
          </div>
        </div>

        <n-divider />

        <div class="center-text">
          <n-upload
            :custom-request="handleUploadContract"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          >
            <n-button type="warning" size="medium">
              <template #icon>
                <n-icon><CloudUploadOutline /></n-icon>
              </template>
              修改/重新上传合同
            </n-button>
          </n-upload>
        </div>
      </div>

      <div v-else class="upload-area">
        <n-upload
          :custom-request="handleUploadContract"
          :show-file-list="false"
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        >
          <n-upload-dragger>
            <div class="upload-dragger-icon">
              <n-icon size="48" :depth="3">
                <CloudUploadOutline />
              </n-icon>
            </div>
            <n-text class="upload-dragger-text">
              点击或拖拽上传合同文件 (JPG/PDF/Word)
            </n-text>
          </n-upload-dragger>
        </n-upload>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CloudUploadOutline, DocumentAttachOutline } from '@/icons/ionicons'

defineProps({
  currentContractUrl: {
    type: String,
    default: '',
  },
  detailOrder: {
    type: Object,
    default: null,
  },
  getPaymentText: {
    type: Function,
    required: true,
  },
  isImage: {
    type: Function,
    required: true,
  },
  handleUploadContract: {
    type: Function,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.dispatch-panel {
  padding: 10px;
  min-height: 400px;
  max-height: calc(85vh - 220px);
  overflow-y: auto;
  overflow-x: hidden;
  margin-right: -4px;
}

.dispatch-panel::-webkit-scrollbar {
  width: 6px;
}

.dispatch-panel::-webkit-scrollbar-thumb {
  background-color: rgba(16, 102, 58, 0.35);
  border-radius: 3px;
}

.dispatch-panel::-webkit-scrollbar-track {
  background: transparent;
}

.inline-alert-md {
  margin-bottom: 16px;
}

.inline-alert-lg {
  margin-bottom: 20px;
}

.center-text {
  text-align: center;
}

.upload-dragger-icon {
  margin-bottom: 12px;
}

.upload-dragger-text {
  font-size: 16px;
}

.contract-section {
  min-height: 250px;
  padding: 10px;
}

.contract-preview-image {
  border: 1px solid var(--color-border-soft);
  padding: 4px;
  border-radius: 4px;
  background: var(--color-surface);
}

.contract-link-actions {
  margin-top: 8px;
  text-align: center;
}

.preview-area {
  margin-bottom: 20px;
  background: var(--color-surface-soft);
  padding: 15px;
  border-radius: var(--radius-sm);
  border: 1px dashed rgba(39, 110, 61, 0.26);
}

.preview-title {
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--color-text-primary);
}

.file-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  width: 250px;
}

@media (max-width: 768px) {
  .dispatch-panel {
    padding: 4px 2px 8px;
    max-height: calc(85vh - 180px);
  }

  .contract-section {
    padding: 14px;
  }

  .file-link-card {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .upload-dragger-text {
    font-size: 14px;
  }
}
</style>
