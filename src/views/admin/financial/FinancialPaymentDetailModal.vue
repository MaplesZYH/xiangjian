<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="支付流水详情"
    style="width: min(760px, calc(100vw - 24px))"
  >
    <n-spin :show="loading">
      <div v-if="detail" class="refund-detail-panel">
        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">支付流水ID：</span>
            <span class="refund-detail-item__value">{{ detail.id || '--' }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">订单ID：</span>
            <span class="refund-detail-item__value">{{ detail.orderId || '--' }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">订单号：</span>
            <span class="refund-detail-item__value">{{ detail.orderNumber || '--' }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">交易流水号：</span>
            <span class="refund-detail-item__value">{{ detail.transactionId || '--' }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">用户：</span>
            <span class="refund-detail-item__value">{{ detail.userName || '--' }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">电话：</span>
            <span class="refund-detail-item__value">{{ detail.phoneNumber || '--' }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">支付阶段：</span>
            <span class="refund-detail-item__value">{{ getPaymentStageText(detail.paymentStage) }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">支付渠道：</span>
            <span class="refund-detail-item__value">{{ getPaymentChannelText(detail.paymentChannel) }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">支付金额：</span>
            <span class="refund-detail-item__value">¥{{ formatMoney(detail.amount) }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">支付时间：</span>
            <span class="refund-detail-item__value">{{ formatDateTime(detail.payTime) }}</span>
          </div>
        </div>
      </div>
      <n-empty v-else description="暂无支付流水详情" />
    </n-spin>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  detail: {
    type: Object,
    default: null,
  },
  getPaymentStageText: {
    type: Function,
    required: true,
  },
  getPaymentChannelText: {
    type: Function,
    required: true,
  },
  formatMoney: {
    type: Function,
    required: true,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:show'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.refund-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.refund-detail-row {
  display: flex;
  gap: 12px;
}

.refund-detail-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
}

.refund-detail-item__label {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-weight: 600;
  white-space: nowrap;
}

.refund-detail-item__value {
  min-width: 0;
  color: var(--color-text-primary);
  font-weight: 500;
  word-break: break-all;
}

@media (max-width: 768px) {
  .refund-detail-row {
    flex-direction: column;
  }
}
</style>
