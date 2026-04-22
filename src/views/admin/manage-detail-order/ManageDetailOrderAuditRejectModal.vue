<template>
  <n-modal
    v-model:show="showModel"
    preset="dialog"
    title="审核驳回"
    positive-text="确认驳回"
    negative-text="取消"
    @positive-click="emit('submit')"
    @negative-click="showModel = false"
  >
    <div class="audit-reject-wrap">
      <n-input
        :value="auditRejectReason"
        type="textarea"
        placeholder="请输入驳回整改的原因，服务商将看到此信息..."
        :rows="3"
        @update:value="emit('update:audit-reject-reason', $event)"
      />
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
  auditRejectReason: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:show', 'update:audit-reject-reason', 'submit'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.audit-reject-wrap {
  margin-top: 10px;
}
</style>
