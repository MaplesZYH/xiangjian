<template>
  <div class="userManage">
    <div class="left-actions">
      <n-button size="small" type="info" @click="emit('open-add-category')">
        添加选配分类
      </n-button>
      <Delete
        :checkedIds="checkedCategoryIds"
        :isBatch="true"
        @delete="emit('batch-delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import Delete from '@/components/operation/delete.vue'

defineProps({
  checkedCategoryIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['open-add-category', 'batch-delete'])
</script>

<style lang="scss" scoped>
.userManage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  white-space: nowrap;
  margin-bottom: 20px;
  padding: 15px;
  overflow-x: auto;

  .left-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: 0 0 auto;
  }
}
</style>
