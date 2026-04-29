<template>
  <n-modal
    :show="show"
    preset="card"
    title="支付协议"
    :style="statementModalStyle"
    @update:show="handleShowUpdate"
  >
    <n-spin :show="orderPaymentStatementLoading">
      <div
        class="order-payment-statement-content client-center-paper"
        v-html="orderPaymentStatementHtml"
      ></div>
    </n-spin>

    <template #footer>
      <n-space justify="end">
        <n-button @click="$emit('close')">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
const emit = defineEmits(['close'])

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  statementModalStyle: {
    type: Object,
    default: () => ({}),
  },
  orderPaymentStatementLoading: {
    type: Boolean,
    default: false,
  },
  orderPaymentStatementHtml: {
    type: String,
    default: '',
  },
})

const handleShowUpdate = (value) => {
  if (!value) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.order-payment-statement-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 14px 16px;
  line-height: 1.75;
  word-break: break-word;
}

.order-payment-statement-content :deep(p) {
  margin: 0 0 10px;
}

.order-payment-statement-content :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
