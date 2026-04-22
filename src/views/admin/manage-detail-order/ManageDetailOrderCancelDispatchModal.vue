<template>
  <n-modal
    v-model:show="showModel"
    preset="dialog"
    title="取消派单"
    positive-text="确认取消"
    negative-text="暂不取消"
    @positive-click="emit('submit')"
    @negative-click="showModel = false"
  >
    <n-input
      :value="cancelReason"
      type="textarea"
      placeholder="请输入取消理由..."
      :rows="3"
      @update:value="emit('update:cancel-reason', $event)"
    />
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  cancelReason: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:show', 'update:cancel-reason', 'submit'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>
