<template>
  <n-modal
    :show="show"
    preset="card"
    title="设计订单支付"
    :style="paymentModalStyle"
    :mask-closable="!designRepaySubmitting"
    :closable="!designRepaySubmitting"
    @update:show="handleShowUpdate"
  >
    <n-space vertical size="large">
      <div class="payment-summary-card">
        <div class="payment-summary-card__title">设计定金支付</div>
        <div class="payment-summary-card__desc">
          请选择支付方式继续完成当前设计订单定金支付。
        </div>
        <div class="payment-summary-card__amount">
          {{ designRepayAmountText }}
        </div>
      </div>

      <n-radio-group
        :value="designRepayChannel"
        @update:value="$emit('update:design-repay-channel', $event)"
      >
        <n-space vertical>
          <n-radio
            v-for="option in paymentChannelOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button :disabled="designRepaySubmitting" @click="$emit('close')">
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="designRepaySubmitting"
          @click="$emit('submit')"
        >
          确认支付
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  paymentModalStyle: {
    type: Object,
    default: () => ({}),
  },
  designRepaySubmitting: {
    type: Boolean,
    default: false,
  },
  designRepayAmountText: {
    type: String,
    default: '',
  },
  designRepayChannel: {
    type: String,
    default: 'ALIPAY',
  },
  paymentChannelOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'submit', 'update:design-repay-channel'])

const handleShowUpdate = (value) => {
  if (!value) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.payment-summary-card {
  padding: 16px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: #f7faf7;
}

.payment-summary-card__title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.payment-summary-card__desc {
  margin-top: 8px;
  color: #6b7280;
  line-height: 1.6;
}

.payment-summary-card__amount {
  margin-top: 14px;
  font-size: 28px;
  font-weight: 700;
  color: #d03050;
}
</style>
