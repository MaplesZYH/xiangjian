<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="审核选配变更"
    style="width: min(560px, calc(100vw - 24px))"
  >
    <n-form label-placement="left" label-width="90">
      <n-form-item label="申请编号">
        <span>#{{ currentRecord?.id || '--' }}</span>
      </n-form-item>
      <n-form-item label="理论差额">
        <span>
          {{
            currentRecord
              ? `¥${formatCurrencyAmount(currentRecord.theoreticalDiffAmount)}`
              : '--'
          }}
        </span>
      </n-form-item>
      <n-form-item label="处理结果">
        <n-radio-group
          :value="auditForm.approved"
          @update:value="emit('update:audit-form-field', { key: 'approved', value: $event })"
        >
          <n-space>
            <n-radio :value="true">审核通过</n-radio>
            <n-radio :value="false">审核驳回</n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>

      <template v-if="auditForm.approved">
        <n-form-item label="结算方式">
          <n-radio-group
            :value="auditForm.mode"
            @update:value="emit('update:audit-form-field', { key: 'mode', value: $event })"
          >
            <n-space vertical>
              <n-radio
                v-for="item in modeOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </n-radio>
            </n-space>
          </n-radio-group>
          <div class="vendor-option-hint">
            {{ modeHint }}
          </div>
        </n-form-item>

        <n-form-item v-if="auditForm.mode === 'charge'" label="补价金额">
            <n-input-number
              :value="auditForm.finalChargeAmount"
              :min="0"
              :precision="2"
              class="full-width-input"
              placeholder="请输入最终补价金额"
              @update:value="
                emit('update:audit-form-field', {
                  key: 'finalChargeAmount',
                  value: $event,
                })
              "
            >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>

        <template v-if="auditForm.mode === 'refund'">
          <n-form-item label="退款金额">
            <n-input-number
              :value="auditForm.finalRefundAmount"
              :min="0"
              :precision="2"
              class="full-width-input"
              placeholder="请输入最终退款金额"
              @update:value="
                emit('update:audit-form-field', {
                  key: 'finalRefundAmount',
                  value: $event,
                })
              "
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-form-item>

          <n-form-item label="支付流水">
            <n-input
              :value="resolvedPaymentRecordText || ''"
              class="full-width-input"
              :placeholder="
                paymentRecordLoading
                  ? '系统正在识别最近一次已支付节点进度款...'
                  : '系统将自动关联最近一次已支付节点进度款'
              "
              disabled
            />
          </n-form-item>

          <n-alert
            v-if="resolvedPaymentRecordMissing"
            type="warning"
            class="inline-alert-md"
          >
            系统暂未识别到最近一次已支付节点进度款。请先确认上一笔节点账单已支付，再发起退款审核。
          </n-alert>
          <n-alert
            v-else
            type="info"
            class="inline-alert-md"
          >
            退款会自动关联系统识别的最近一次已支付节点进度款，无需手动填写支付流水。
          </n-alert>
        </template>
      </template>
    </n-form>

    <template #footer>
      <div class="optional-change-audit-modal__footer">
        <n-button @click="showModel = false">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="emit('submit')">
          确认提交
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
  currentRecord: {
    type: Object,
    default: null,
  },
  auditForm: {
    type: Object,
    required: true,
  },
  modeOptions: {
    type: Array,
    default: () => [],
  },
  modeHint: {
    type: String,
    default: '',
  },
  canViewPaymentRecordList: {
    type: Boolean,
    default: false,
  },
  paymentRecordOptions: {
    type: Array,
    default: () => [],
  },
  paymentRecordLoading: {
    type: Boolean,
    default: false,
  },
  resolvedPaymentRecordText: {
    type: String,
    default: '',
  },
  resolvedPaymentRecordMissing: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  formatCurrencyAmount: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:show', 'update:audit-form-field', 'submit'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.inline-alert-md {
  margin-bottom: 16px;
}

.full-width-input {
  width: 100%;
}

.vendor-option-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.optional-change-audit-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .optional-change-audit-modal__footer {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
