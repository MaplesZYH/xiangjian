<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="审核选配变更"
    style="width: min(560px, calc(100vw - 24px))"
  >
    <n-form class="optional-change-audit-form" label-placement="left" label-width="108">
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
      <n-form-item label="处理结果" class="optional-change-audit-form__radio-item">
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
        <n-form-item label="结算方式" class="optional-change-audit-form__radio-item">
          <div class="optional-change-mode-field">
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
            <div class="vendor-option-hint optional-change-mode-hint">
              {{ modeHint }}
            </div>
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

          <n-form-item label="关联支付记录">
            <n-input
              :value="resolvedPaymentRecordText || ''"
              class="full-width-input"
              :placeholder="
                paymentRecordLoading
                  ? '正在匹配最近一次已支付节点款...'
                  : '将自动关联最近一次已支付节点款'
              "
              disabled
            />
          </n-form-item>

          <n-alert
            v-if="resolvedPaymentRecordMissing"
            type="warning"
            class="inline-alert-md"
          >
            暂未匹配到最近一次已支付节点款。请先确认上一笔节点账单已支付，再发起退款审核。
          </n-alert>
          <n-alert
            v-else
            type="info"
            class="inline-alert-md"
          >
            退款会自动关联最近一次已支付节点款，无需手动填写支付流水码。
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

  :deep(.n-input__input-el) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.optional-change-audit-form {
  :deep(.n-form-item-label) {
    white-space: nowrap;
  }

  :deep(.n-form-item-blank) {
    min-width: 0;
  }
}

.optional-change-audit-form__radio-item {
  :deep(.n-form-item-label) {
    align-items: flex-start;
    padding-top: 1px;
  }
}

.vendor-option-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.optional-change-mode-field {
  width: 100%;
}

.optional-change-mode-hint {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(195, 142, 44, 0.28);
  border-left: 4px solid #c38e2c;
  border-radius: 8px;
  background: #fff9ec;
  color: #7a4b00;
  font-weight: 600;
}

.optional-change-audit-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .optional-change-audit-form {
    :deep(.n-form-item-label) {
      flex: 0 0 108px;
      width: 108px;
      min-width: 108px;
      max-width: 108px;
    }

    :deep(.n-form-item-blank) {
      flex: 1 1 auto;
    }
  }

  .optional-change-audit-modal__footer {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .optional-change-audit-form {
    :deep(.n-form-item-label) {
      flex-basis: 96px;
      width: 96px;
      min-width: 96px;
      max-width: 96px;
    }
  }
}
</style>
