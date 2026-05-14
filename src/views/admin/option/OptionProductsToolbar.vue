<template>
  <div class="userManage optionManage">
    <div class="left-actions">
      <n-button
        v-if="canCreateOption"
        size="small"
        type="info"
        @click="emit('open-add-option')"
      >
        添加产品
      </n-button>
      <Delete
        v-if="canDeleteOption"
        :checkedIds="checkedOptionIds"
        :isBatch="true"
        @delete="emit('batch-delete-option', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import Delete from '@/components/operation/delete.vue'

defineProps({
  checkedOptionIds: {
    type: Array,
    default: () => [],
  },
  canCreateOption: {
    type: Boolean,
    default: false,
  },
  canDeleteOption: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open-add-option', 'batch-delete-option'])
</script>

<style lang="scss" scoped>
.userManage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  white-space: nowrap;
  padding: 15px;
  overflow-x: auto;

  .left-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: 0 0 auto;
  }
}

.optionManage {
  margin-bottom: 15px;

  .left-actions {
    min-height: 28px;

    > :deep(.n-button) {
      height: 28px;
    }
  }
}
</style>
