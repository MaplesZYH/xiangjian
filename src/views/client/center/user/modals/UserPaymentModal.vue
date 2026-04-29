<template>
  <n-modal
    :show="show"
    preset="card"
    :title="paymentModalTitle"
    :mask-closable="!paymentSubmitting"
    :closable="!paymentSubmitting"
    :style="paymentModalStyle"
    @update:show="handleShowUpdate"
  >
    <n-space vertical size="large">
      <div class="payment-summary client-center-soft-card">
        <div class="payment-summary__title">{{ paymentTarget.title }}</div>
        <div class="payment-summary__desc">
          {{ paymentTarget.description }}
        </div>
        <div class="payment-summary__amount">
          {{
            paymentTarget.amountText ||
            `¥${paymentTarget.amount?.toLocaleString?.() || 0}`
          }}
        </div>
      </div>

      <n-radio-group
        :value="paymentChannel"
        @update:value="$emit('update:payment-channel', $event)"
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
        <n-button :disabled="paymentSubmitting" @click="$emit('close')">
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="paymentSubmitting"
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
  paymentModalTitle: {
    type: String,
    default: '',
  },
  paymentModalStyle: {
    type: Object,
    default: () => ({}),
  },
  paymentSubmitting: {
    type: Boolean,
    default: false,
  },
  paymentTarget: {
    type: Object,
    default: () => ({}),
  },
  paymentChannelOptions: {
    type: Array,
    default: () => [],
  },
  paymentChannel: {
    type: String,
    default: 'ALIPAY',
  },
})

const emit = defineEmits(['close', 'submit', 'update:payment-channel'])

const handleShowUpdate = (value) => {
  if (!value) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.payment-summary {
  padding: 16px;
}

.payment-summary__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.payment-summary__desc {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
}

.payment-summary__amount {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #d03050;
}

@media (max-width: 768px) {
  .payment-summary {
    padding: 14px;
  }

  .payment-summary__amount {
    font-size: 22px;
  }
}
</style>
