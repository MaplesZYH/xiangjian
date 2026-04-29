<template>
  <n-modal
    :show="show"
    preset="card"
    title="申请退款"
    :style="refundModalStyle"
    :mask-closable="!refundSubmitting"
    :closable="!refundSubmitting"
    @update:show="handleShowUpdate"
  >
    <n-space vertical size="large">
      <n-descriptions bordered size="small" :column="1" label-placement="left">
        <n-descriptions-item label="订单号">
          {{ refundTarget.orderNumber || '--' }}
        </n-descriptions-item>
        <n-descriptions-item label="产品名称">
          {{ refundTarget.productName || '--' }}
        </n-descriptions-item>
        <n-descriptions-item label="已支付金额">
          ¥{{ Number(refundTarget.paidAmount || 0).toLocaleString() }}
        </n-descriptions-item>
      </n-descriptions>

      <n-card
        size="small"
        class="refund-info-card client-center-soft-card"
        :bordered="false"
      >
        <n-space justify="space-between" align="center">
          <div class="refund-info-card__item">
            <div class="refund-info-card__label">系统关联流水</div>
            <div class="refund-info-card__value">
              #{{ refundTarget.paymentRecordId || '--' }}
            </div>
          </div>
          <div class="refund-info-card__item">
            <div class="refund-info-card__label">支付阶段</div>
            <div class="refund-info-card__value">
              {{ refundTarget.paymentStage || '--' }}
            </div>
          </div>
          <div class="refund-info-card__item refund-info-card__item--amount">
            <div class="refund-info-card__label">可退金额</div>
            <div class="refund-info-card__value">
              ¥{{ formatAmount(refundTarget.paymentAmount) }}
            </div>
          </div>
        </n-space>
      </n-card>

      <n-form
        :label-placement="formLabelPlacement"
        :label-width="isCompactViewport ? undefined : 90"
      >
        <n-form-item label="快捷原因">
          <n-select
            :value="refundQuickReason"
            :options="refundReasonOptions"
            clearable
            placeholder="请选择常见原因，可继续修改下方内容"
            @update:value="$emit('preset-change', $event)"
          />
        </n-form-item>
        <n-form-item label="退款原因" required>
          <n-input
            :value="refundReason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-count
            placeholder="请填写退款原因，也可以先选择上方常见原因"
            @update:value="$emit('update:refund-reason', $event)"
          />
        </n-form-item>
      </n-form>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button :disabled="refundSubmitting" @click="$emit('close')">
          取消
        </n-button>
        <n-button
          type="error"
          :loading="refundSubmitting"
          @click="$emit('submit')"
        >
          提交退款申请
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
const emit = defineEmits([
  'close',
  'submit',
  'preset-change',
  'update:refund-reason',
])

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  refundModalStyle: {
    type: Object,
    default: () => ({}),
  },
  refundSubmitting: {
    type: Boolean,
    default: false,
  },
  refundTarget: {
    type: Object,
    default: () => ({}),
  },
  formLabelPlacement: {
    type: String,
    default: 'left',
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  refundQuickReason: {
    type: String,
    default: null,
  },
  refundReasonOptions: {
    type: Array,
    default: () => [],
  },
  refundReason: {
    type: String,
    default: '',
  },
  formatAmount: {
    type: Function,
    default: (value) => value,
  },
})

const handleShowUpdate = (value) => {
  if (!value) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.refund-info-card__item {
  min-width: 0;
}

.refund-info-card__item--amount {
  text-align: right;
}

.refund-info-card__label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.refund-info-card__value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

@media (max-width: 768px) {
  .refund-info-card :deep(.n-space) {
    width: 100%;
  }

  .refund-info-card__item--amount {
    text-align: left;
  }
}
</style>
