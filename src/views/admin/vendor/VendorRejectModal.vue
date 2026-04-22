<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="驳回申请"
    style="width: min(520px, calc(100vw - 24px))"
    :bordered="false"
  >
    <div class="reject-input-wrap">
      <n-input
        :value="rejectMessage"
        type="textarea"
        placeholder="请输入驳回的具体原因..."
        :autosize="{ minRows: 3 }"
        @update:value="emit('update:reject-message', $event)"
      />
    </div>

    <div class="modal-actions">
      <n-button @click="showModel = false">取消</n-button>
      <n-button type="error" @click="emit('confirm')">确认驳回</n-button>
    </div>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  rejectMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:show', 'update:reject-message', 'confirm'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.reject-input-wrap {
  margin-top: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .modal-actions {
    width: 100%;
    justify-content: stretch;
  }

  .modal-actions > * {
    flex: 1 1 100%;
  }
}
</style>
