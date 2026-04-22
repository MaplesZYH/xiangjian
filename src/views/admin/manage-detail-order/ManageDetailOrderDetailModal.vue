<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="订单基础详情"
    size="huge"
    :style="{ width: 'min(900px, calc(100vw - 24px))' }"
  >
    <n-spin v-if="loadingDetail" size="large" />
    <div v-else-if="detailOrder">
      <div class="info-header">
        <div><strong>订单号：</strong>{{ detailOrder.orderNumber }}</div>
        <div class="status-row">
          <n-tag size="small" :type="getStatusType(detailOrder.orderStatus)">
            {{ getStatusText(detailOrder.orderStatus) }}
          </n-tag>
          <n-tag size="small" :type="getPaymentType(detailOrder.paymentStatus)">
            {{ getPaymentText(detailOrder.paymentStatus) }}
          </n-tag>
        </div>
      </div>

      <n-alert v-if="isReadOnly" type="warning" class="inline-alert-sm">
        当前订单状态为“{{ getStatusText(detailOrder.orderStatus) }}”，当前仅支持查看，不可再修改基础信息和选配。
      </n-alert>
      <n-alert
        v-else-if="isAddressLocked"
        type="warning"
        class="inline-alert-sm"
      >
        合同已上传，订单地址无法再修改，但选配产品仍可继续调整。
      </n-alert>

      <n-divider dashed />

      <n-form label-placement="left" label-width="90">
        <n-form-item label="订单地址">
          <n-space vertical class="full-width">
            <div class="order-address-editor">
              <n-cascader
                :value="selectedOrderRegionCode"
                :options="orderRegionCascaderOptions"
                check-strategy="child"
                filterable
                clearable
                :disabled="isReadOnly || isAddressLocked"
                placeholder="请选择省 / 市 / 区"
                @update:value="handleRegionValueUpdate"
              />
              <n-input
                :value="orderAddressForm.detail"
                type="textarea"
                :rows="2"
                maxlength="120"
                show-count
                :disabled="isReadOnly || isAddressLocked"
                placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
                @update:value="emit('update:orderAddressDetail', $event)"
              />
            </div>
          </n-space>
        </n-form-item>
        <n-form-item label="地址预览">
          <div class="address-preview">
            {{ orderAddressPreview || '请先选择施工行政区并填写详细门牌地址' }}
          </div>
        </n-form-item>
        <n-form-item label="客户备注">
          <n-input
            :value="detailOrder.customerNotes"
            type="textarea"
            :rows="2"
            :disabled="isReadOnly"
            placeholder="客户备注信息"
            @update:value="emit('update:customerNotes', $event)"
          />
        </n-form-item>
      </n-form>

      <n-divider title-placement="left">选配产品 (修改配置)</n-divider>

      <n-spin :show="loadingMetadata">
        <n-grid cols="2 s:3" responsive="screen" :x-gap="12" :y-gap="16">
          <n-grid-item v-for="config in dynamicConfigList" :key="config.key">
            <div class="select-wrapper">
              <span class="label">{{ config.label }}：</span>
              <n-select
                :value="selectionMap[config.key]"
                :options="config.options"
                :disabled="isReadOnly"
                size="small"
                clearable
                filterable
                placeholder="请选择"
                @update:value="handleSelectionItemUpdate(config.key, $event)"
              />
            </div>
          </n-grid-item>
        </n-grid>
      </n-spin>

      <div v-if="detailOrder.structureInfo" class="house-info-section">
        <n-divider title-placement="left">房屋基础信息</n-divider>
        <n-descriptions bordered label-placement="left" size="small" :column="2">
          <n-descriptions-item label="产品名称">
            <span class="accent-text-strong">
              {{ detailOrder.structureInfo.name }}
            </span>
          </n-descriptions-item>
          <n-descriptions-item label="参考价格">
            {{ detailOrder.structureInfo.price }} 万
          </n-descriptions-item>
          <n-descriptions-item label="建筑风格">
            {{ getStyleLabel(detailOrder.structureInfo.style) }}
          </n-descriptions-item>
          <n-descriptions-item label="施工方式">
            {{ detailOrder.structureInfo.constructionMethod }}
          </n-descriptions-item>
          <n-descriptions-item label="户型布局" :span="2">
            <n-tag type="info" size="small" class="tag-gap-right">
              {{ detailOrder.structureInfo.roomCount }} 室
            </n-tag>
            <n-tag type="info" size="small" class="tag-gap-right">
              {{ detailOrder.structureInfo.livingRoomCount }} 厅
            </n-tag>
            <n-tag type="info" size="small">
              {{ detailOrder.structureInfo.bathroomCount }} 卫
            </n-tag>
          </n-descriptions-item>
        </n-descriptions>
      </div>

      <n-divider />
      <div v-if="!isReadOnly" class="modal-footer-actions">
        <n-button type="primary" :loading="submitting" @click="emit('save')">
          保存基础信息修改
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loadingDetail: {
    type: Boolean,
    default: false,
  },
  detailOrder: {
    type: Object,
    default: null,
  },
  getStatusType: {
    type: Function,
    required: true,
  },
  getStatusText: {
    type: Function,
    required: true,
  },
  getPaymentType: {
    type: Function,
    required: true,
  },
  getPaymentText: {
    type: Function,
    required: true,
  },
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  isAddressLocked: {
    type: Boolean,
    default: false,
  },
  selectedOrderRegionCode: {
    type: [String, Number, Array],
    default: null,
  },
  orderRegionCascaderOptions: {
    type: Array,
    default: () => [],
  },
  orderAddressForm: {
    type: Object,
    required: true,
  },
  orderAddressPreview: {
    type: String,
    default: '',
  },
  loadingMetadata: {
    type: Boolean,
    default: false,
  },
  dynamicConfigList: {
    type: Array,
    default: () => [],
  },
  selectionMap: {
    type: Object,
    required: true,
  },
  getStyleLabel: {
    type: Function,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:show',
  'update:selectedOrderRegionCode',
  'update:orderAddressDetail',
  'update:customerNotes',
  'update:selectionItem',
  'order-region-update',
  'save',
])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const handleRegionValueUpdate = (...args) => {
  emit('update:selectedOrderRegionCode', args[0] ?? null)
  emit('order-region-update', ...args)
}

const handleSelectionItemUpdate = (key, value) => {
  emit('update:selectionItem', {
    key,
    value,
  })
}
</script>

<style lang="scss" scoped>
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-row {
  display: flex;
  gap: 10px;
}

.inline-alert-sm {
  margin-bottom: 10px;
}

.full-width {
  width: 100%;
}

.accent-text-strong {
  font-weight: 700;
  color: var(--color-brand-700);
}

.tag-gap-right {
  margin-right: 8px;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.house-info-section {
  background-color: var(--color-surface-soft);
  padding: 15px;
  border-radius: var(--radius-sm);
  margin: 15px 0;
  border: 1px solid var(--color-border-soft);
}

.order-address-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.address-preview {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  line-height: 1.6;
  word-break: break-all;
}

.select-wrapper {
  display: flex;
  align-items: center;

  .label {
    width: 90px;
    font-size: 13px;
    color: var(--color-text-secondary);
    text-align: right;
    margin-right: 8px;
  }
}

@media (max-width: 768px) {
  .info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .status-row,
  .modal-footer-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .modal-footer-actions {
    justify-content: stretch;
  }

  .modal-footer-actions > * {
    flex: 1 1 100%;
  }

  .select-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;

    .label {
      width: auto;
      text-align: left;
      margin-right: 0;
    }
  }

  .house-info-section {
    padding: 14px;
  }
}
</style>
