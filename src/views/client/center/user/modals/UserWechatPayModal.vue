<template>
  <n-modal
    :show="show"
    preset="card"
    title="微信扫码支付"
    :style="paymentModalStyle"
    @update:show="handleShowUpdate"
  >
    <n-space vertical align="center" size="large">
      <n-qr-code
        v-if="wechatPayUrl"
        :value="wechatPayUrl"
        :size="220"
        error-correction-level="M"
      />
      <n-empty v-else description="未获取到微信支付二维码" />
      <div class="wechat-pay-tip">
        请使用微信扫一扫完成支付，支付完成后返回当前页面刷新订单状态。
      </div>
    </n-space>

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
  paymentModalStyle: {
    type: Object,
    default: () => ({}),
  },
  wechatPayUrl: {
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
.wechat-pay-tip {
  text-align: center;
  color: #6b7280;
  line-height: 1.6;
}
</style>
