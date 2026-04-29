<template>
  <n-modal
    :show="show"
    preset="card"
    title="修改入驻信息"
    :style="modalStyle"
    size="huge"
    @update:show="$emit('update:show', $event)"
  >
    <n-form
      ref="formRef"
      :model="editForm"
      :rules="formRules"
      :label-placement="isCompactViewport ? 'top' : 'left'"
      :label-width="isCompactViewport ? undefined : 120"
    >
      <n-alert type="warning" class="client-center-alert">
        {{ editTipText }}
      </n-alert>

      <div class="service-type-card client-center-accent-card">
        <div class="service-type-card__label">服务类型</div>
        <div class="service-type-card__content service-type-card__content--form">
          <n-select
            v-model:value="serviceTypeValue"
            :options="serviceTypeOptions"
            placeholder="请选择服务类型"
            :disabled="!canChangeServiceType"
          />
          <div class="service-type-card__helper">
            <n-tag :type="getServiceTypeTag(editForm.serviceType)" size="small">
              当前选择：{{ getServiceTypeText(editForm.serviceType) }}
            </n-tag>
            <span>
              {{
                canChangeServiceType
                  ? '审核通过后修改服务类型会重新进入平台审核，期间其他服务暂不可用。'
                  : serviceTypeLockReason
              }}
            </span>
          </div>
        </div>
      </div>

      <n-form-item label="账号" path="username">
        <n-input :value="editForm.username" disabled />
      </n-form-item>

      <n-form-item v-if="requiresPasswordOnEdit" label="密码" path="password">
        <n-input
          v-model:value="passwordValue"
          type="password"
          show-password-on="click"
          placeholder="请输入登录密码"
        />
      </n-form-item>

      <n-grid :cols="isCompactViewport ? 1 : 2" :x-gap="24" :y-gap="12">
        <n-grid-item>
          <n-form-item label="公司名称" path="companyName">
            <n-input v-model:value="companyNameValue" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="负责人" path="companyChargerName">
            <n-input v-model:value="companyChargerNameValue" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="联系电话" path="phone">
            <n-input v-model:value="phoneValue" />
          </n-form-item>
        </n-grid-item>
      </n-grid>

      <n-form-item label="公司地址" path="companyAddress">
        <n-space vertical class="client-center-full-width">
          <n-cascader
            :value="selectedCompanyRegionCode"
            :options="companyRegionCascaderOptions"
            check-strategy="child"
            filterable
            clearable
            placeholder="请选择省 / 市 / 区"
            @update:value="handleRegionCodeChange"
          />
          <n-input
            v-model:value="companyAddressDetailValue"
            type="textarea"
            placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
            :rows="2"
            maxlength="120"
            show-count
          />
          <div class="address-preview client-center-preview">
            {{ companyAddressPreview || '请先选择公司行政区并填写详细门牌地址' }}
          </div>
        </n-space>
      </n-form-item>

      <n-form-item
        v-if="[2, 3].includes(editForm.serviceType)"
        label="主营材料"
        path="materialCategoryIds"
      >
        <n-select
          v-model:value="materialCategoryIdsValue"
          :options="categoryOptions"
          multiple
        />
      </n-form-item>

      <n-form-item label="公司介绍" path="companyIntroduction">
        <n-input v-model:value="companyIntroductionValue" type="textarea" />
      </n-form-item>

      <n-form-item label="资质证书">
        <div class="edit-certificate-panel">
          <n-upload
            :custom-request="handleUploadRequest"
            :show-file-list="false"
            accept=".jpg,.png,.pdf,.doc,.docx"
          >
            <n-button type="primary" tertiary>上传新证书</n-button>
          </n-upload>
          <div class="edit-certificate-tip">
            支持 JPG、PNG、PDF、DOC、DOCX，上传后会作为资质材料一并提交。
          </div>

          <div v-if="uploadedFiles.length > 0" class="edit-certificate-grid">
            <div
              v-for="(file, index) in uploadedFiles"
              :key="file.id || file.url || index"
              class="edit-certificate-card client-center-elevated-card"
            >
              <div class="edit-certificate-card__icon">
                <n-icon size="26">
                  <DocumentTextOutline />
                </n-icon>
              </div>
              <div class="edit-certificate-card__meta">
                <div class="edit-certificate-card__type">
                  {{ getFileExt(file.url) }}
                </div>
                <a
                  :href="file.url"
                  target="_blank"
                  class="edit-certificate-card__name"
                  :title="getFileName(file.url)"
                >
                  {{ getFileName(file.url) }}
                </a>
              </div>
              <div class="edit-certificate-card__actions">
                <a
                  :href="file.url"
                  target="_blank"
                  class="edit-certificate-card__action"
                >
                  查看
                </a>
                <button
                  type="button"
                  class="edit-certificate-card__action edit-certificate-card__action--danger"
                  @click="handleRemoveFile(file, index)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>

          <n-empty v-else description="暂无资质证书" size="small" />
        </div>
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space class="service-modal-footer" justify="end">
        <n-button @click="$emit('update:show', false)">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="$emit('submit')">
          提交修改
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { DocumentTextOutline } from '@/icons/ionicons'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  modalStyle: {
    type: Object,
    default: () => ({}),
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  editForm: {
    type: Object,
    required: true,
  },
  formRules: {
    type: Object,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  editTipText: {
    type: String,
    default: '',
  },
  serviceTypeOptions: {
    type: Array,
    default: () => [],
  },
  canChangeServiceType: {
    type: Boolean,
    default: false,
  },
  serviceTypeLockReason: {
    type: String,
    default: '',
  },
  categoryOptions: {
    type: Array,
    default: () => [],
  },
  uploadedFiles: {
    type: Array,
    default: () => [],
  },
  selectedCompanyRegionCode: {
    default: null,
  },
  companyRegionCascaderOptions: {
    type: Array,
    default: () => [],
  },
  companyAddressForm: {
    type: Object,
    required: true,
  },
  companyAddressPreview: {
    type: String,
    default: '',
  },
  requiresPasswordOnEdit: {
    type: Boolean,
    default: false,
  },
  getServiceTypeTag: {
    type: Function,
    required: true,
  },
  getServiceTypeText: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'update:show',
  'update:selected-company-region-code',
  'update:field',
  'update:company-address-detail',
  'upload-certificate',
  'remove-certificate',
  'company-region-update',
  'submit',
])

const formRef = ref(null)

const createFieldModel = (key) =>
  computed({
    get: () => props.editForm[key],
    set: (value) => emit('update:field', { key, value }),
  })

const serviceTypeValue = createFieldModel('serviceType')
const passwordValue = createFieldModel('password')
const companyNameValue = createFieldModel('companyName')
const companyChargerNameValue = createFieldModel('companyChargerName')
const phoneValue = createFieldModel('phone')
const materialCategoryIdsValue = createFieldModel('materialCategoryIds')
const companyIntroductionValue = createFieldModel('companyIntroduction')
const companyAddressDetailValue = computed({
  get: () => props.companyAddressForm.detail,
  set: (value) => emit('update:company-address-detail', value),
})

const getFileName = (url) => {
  if (!url) return '未知文件'
  return url.split('/').pop()
}

const getFileExt = (url) => {
  const fileName = getFileName(url)
  const ext = fileName.includes('.') ? fileName.split('.').pop() : ''
  return ext ? ext.toUpperCase() : 'FILE'
}

const handleUploadRequest = (options) => {
  emit('upload-certificate', options)
}

const handleRegionCodeChange = (value, option, path) => {
  emit('update:selected-company-region-code', value)
  emit('company-region-update', value, option, path)
}

const handleRemoveFile = (file, index) => {
  emit('remove-certificate', { file, index })
}

const validate = async () => formRef.value?.validate()

defineExpose({
  validate,
})
</script>

<style lang="scss" scoped>
.address-preview {
  color: #4b5563;
  word-break: break-all;
}

.service-type-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 14px 16px;
}

.service-type-card__label {
  font-size: 14px;
  font-weight: 600;
  color: #1f5131;
}

.service-type-card__content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-type-card__content--form {
  flex: 1;
  align-items: stretch;
  flex-direction: column;
}

.service-type-card__helper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: #4b5563;
  font-size: 13px;
}

.edit-certificate-panel {
  width: 100%;
}

.edit-certificate-tip {
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
}

.edit-certificate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.edit-certificate-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}

.edit-certificate-card__icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-brand-700);
  background: rgba(39, 110, 61, 0.12);
  flex: 0 0 auto;
}

.edit-certificate-card__meta {
  flex: 1;
  min-width: 0;
}

.edit-certificate-card__type {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-brand-700);
}

.edit-certificate-card__name {
  display: block;
  margin-top: 4px;
  color: #374151;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-certificate-card__name:hover {
  color: var(--color-brand-700);
}

.edit-certificate-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex: 0 0 auto;
}

.edit-certificate-card__action {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-brand-700);
  font-size: 12px;
  text-decoration: none;
}

.edit-certificate-card__action--danger {
  color: #d03050;
}

@media (max-width: 768px) {
  .service-type-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .service-modal-footer {
    width: 100%;
    justify-content: stretch !important;
  }

  .service-modal-footer > * {
    flex: 1 1 100%;
  }

  .edit-certificate-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .edit-certificate-card__actions {
    align-items: flex-start;
    flex-direction: row;
  }
}
</style>
