<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    :title="modalTitle"
    style="width: min(560px, calc(100vw - 24px))"
  >
    <n-alert :type="canManageMaterialDispatch ? 'warning' : 'error'" class="inline-alert-md">
      {{ alertText }}
    </n-alert>
    <n-form label-placement="left" label-width="88">
      <n-form-item label="服务商公司">
        <n-select
          :value="redispatchForm.vendorId"
          :options="redispatchVendorOptions"
          placeholder="请选择新的服务商公司"
          filterable
          clearable
          :loading="redispatchLoading"
          :disabled="!canManageMaterialDispatch"
          @update:value="
            emit('update:redispatch-form-field', { key: 'vendorId', value: $event })
          "
        />
        <div v-if="selectedRedispatchVendorOption?.raw" class="vendor-option-hint">
          {{
            `${selectedRedispatchVendorOption.raw.companyName} · ${getVendorServiceTypeText(selectedRedispatchVendorOption.raw.serviceType)} · ${formatVendorDistance(selectedRedispatchVendorOption.raw.distance)}`
          }}
        </div>
      </n-form-item>
      <n-form-item label="成交价格">
        <n-input-number
          :value="redispatchForm.price"
          placeholder="请输入价格"
          class="full-width-input"
          :min="0"
          :disabled="!canManageMaterialDispatch"
          @update:value="
            emit('update:redispatch-form-field', { key: 'price', value: $event })
          "
        >
          <template #prefix>¥</template>
        </n-input-number>
      </n-form-item>
      <n-form-item label="派单备注">
        <n-input
          :value="redispatchForm.adminNotes"
          type="textarea"
          placeholder="请输入派单备注"
          :disabled="!canManageMaterialDispatch"
          @update:value="
            emit('update:redispatch-form-field', { key: 'adminNotes', value: $event })
          "
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="modal-footer-actions">
        <n-button :disabled="redispatchSubmitting" @click="showModel = false">
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="redispatchSubmitting"
          :disabled="!canManageMaterialDispatch"
          @click="emit('submit')"
        >
          确认重派
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  redispatchTarget: {
    type: Object,
    required: true,
  },
  redispatchForm: {
    type: Object,
    required: true,
  },
  redispatchVendorOptions: {
    type: Array,
    default: () => [],
  },
  selectedRedispatchVendorOption: {
    type: Object,
    default: null,
  },
  redispatchLoading: {
    type: Boolean,
    default: false,
  },
  redispatchSubmitting: {
    type: Boolean,
    default: false,
  },
  canManageMaterialDispatch: {
    type: Boolean,
    default: false,
  },
  getVendorServiceTypeText: {
    type: Function,
    required: true,
  },
  formatVendorDistance: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:show', 'update:redispatch-form-field', 'submit'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const modalTitle = computed(() =>
  props.redispatchTarget.type === 1
    ? '重新指派施工单位'
    : `重新指派供应商 - ${props.redispatchTarget.category || '--'}`,
)

const alertText = computed(() =>
  props.canManageMaterialDispatch
    ? `当前服务商：${props.redispatchTarget.currentVendorName || '未记录'}。请选择新的公司并确认成交价格。`
    : '当前订单不可继续派单。',
)
</script>

<style lang="scss" scoped>
.inline-alert-md {
  margin-bottom: 16px;
}

.full-width-input {
  width: 100%;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.vendor-option-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .modal-footer-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
