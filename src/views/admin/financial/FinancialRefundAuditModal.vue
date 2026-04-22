<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="退款审核"
    style="width: min(560px, calc(100vw - 24px))"
    :mask-closable="!submitting"
    :closable="!submitting"
  >
    <n-form label-placement="left" label-width="96">
      <n-form-item label="订单号">
        <n-input :value="form.orderNumber" disabled />
      </n-form-item>
      <n-form-item label="支付流水ID">
        <n-input :value="String(form.paymentRecordId || '')" disabled />
      </n-form-item>
      <n-form-item label="审核结果">
        <n-radio-group
          :value="form.approved"
          @update:value="updateField('approved', $event)"
        >
          <n-space>
            <n-radio :value="true">通过</n-radio>
            <n-radio :value="false">拒绝</n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>
      <n-form-item label="退款金额" required>
        <n-input-number
          :value="form.refundAmount"
          :min="0.01"
          :precision="2"
          :step="1"
          :disabled="!form.approved"
          style="width: 100%"
          placeholder="请输入退款金额"
          @update:value="updateField('refundAmount', $event)"
        />
      </n-form-item>
      <n-form-item label="审核备注" required>
        <n-input
          :value="form.reason"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-count
          :placeholder="form.approved ? '请输入通过备注' : '请输入拒绝原因（将回传给用户）'"
          @update:value="updateField('reason', $event)"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="financial-modal-actions financial-modal-actions--end">
        <n-button :disabled="submitting" @click="emit('cancel')">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="emit('submit')">
          确认审核
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
  submitting: {
    type: Boolean,
    default: false,
  },
  form: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:show', 'update:field', 'cancel', 'submit'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const updateField = (key, value) => {
  emit('update:field', {
    key,
    value,
  })
}
</script>

<style lang="scss" scoped>
.financial-modal-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .financial-modal-actions {
    width: 100%;
    justify-content: stretch;
  }

  .financial-modal-actions > * {
    flex: 1 1 100%;
  }
}
</style>
