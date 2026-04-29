<template>
  <n-modal
    :show="show"
    preset="dialog"
    title="驳回整改"
    positive-text="确认驳回"
    negative-text="取消"
    @positive-click="$emit('submit')"
    @negative-click="$emit('close')"
    @update:show="handleShowUpdate"
  >
    <n-input
      :value="auditRejectReason"
      type="textarea"
      placeholder="请输入驳回原因，服务商将看到此消息..."
      :rows="3"
      @update:value="$emit('update:audit-reject-reason', $event)"
    />
  </n-modal>
</template>

<script setup>
const emit = defineEmits(['close', 'submit', 'update:audit-reject-reason'])

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  auditRejectReason: {
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
