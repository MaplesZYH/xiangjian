<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    :title="modalTitle"
    style="width: min(500px, calc(100vw - 24px))"
  >
    <n-alert type="info" class="inline-alert-md">
      {{ alertText }}
    </n-alert>
    <n-form label-placement="left" label-width="80">
      <n-form-item label="推荐供应商">
        <n-select
          :value="materialForm.vendorId"
          :options="materialVendorOptions"
          placeholder="请选择推荐的供应商"
          filterable
          clearable
          :loading="loadingVendorOpts"
          :disabled="!canManageMaterialDispatch"
          @update:value="
            emit('update:material-form-field', { key: 'vendorId', value: $event })
          "
        />
        <div v-if="selectedMaterialVendorOption?.raw" class="vendor-option-hint">
          {{
            `${selectedMaterialVendorOption.raw.companyName} · ${getVendorServiceTypeText(selectedMaterialVendorOption.raw.serviceType)} · ${formatVendorDistance(selectedMaterialVendorOption.raw.distance)}`
          }}
        </div>
      </n-form-item>
      <n-form-item label="价格">
        <n-input-number
          :value="materialForm.price"
          placeholder="请输入价格"
          class="full-width-input"
          :min="0"
          :disabled="!canManageMaterialDispatch"
          @update:value="
            emit('update:material-form-field', { key: 'price', value: $event })
          "
        >
          <template #prefix>¥</template>
        </n-input-number>
      </n-form-item>
      <n-form-item label="备注">
        <n-input
          :value="materialForm.adminNotes"
          type="textarea"
          placeholder="备注 (可选)"
          :disabled="!canManageMaterialDispatch"
          @update:value="
            emit('update:material-form-field', { key: 'adminNotes', value: $event })
          "
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="modal-footer-actions">
        <n-button @click="showModel = false">取消</n-button>
        <n-button
          type="primary"
          :disabled="!canManageMaterialDispatch"
          @click="emit('submit')"
        >
          确认派单
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
  materialDispatchReplacingVendorOrderId: {
    type: [Number, String],
    default: null,
  },
  currentTarget: {
    type: Object,
    required: true,
  },
  materialForm: {
    type: Object,
    required: true,
  },
  materialVendorOptions: {
    type: Array,
    default: () => [],
  },
  selectedMaterialVendorOption: {
    type: Object,
    default: null,
  },
  loadingVendorOpts: {
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

const emit = defineEmits(['update:show', 'update:material-form-field', 'submit'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const modalTitle = computed(() =>
  props.materialDispatchReplacingVendorOrderId
    ? `更换供应商 - ${props.currentTarget.category} (${props.currentTarget.name})`
    : `指派供应商 - ${props.currentTarget.category} (${props.currentTarget.name})`,
)

const alertText = computed(() =>
  props.materialDispatchReplacingVendorOrderId
    ? '当前分类下的选配产品已变更。确认派单时会先取消旧服务商订单，再创建新的材料派单。'
    : '可选择“材料商”或“综合服务商”类型的公司，价格为本次材料子单的成交价。施工中如发生增项或同类改项，也可继续在此补派或重派。',
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
