<template>
  <div class="userManage">
    <div class="left-actions">
      <n-button
        v-if="canCreateCategory"
        size="small"
        type="info"
        @click="emit('open-add-category')"
      >
        添加选配分类
      </n-button>
      <Delete
        v-if="canDeleteCategory"
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
  canCreateCategory: {
    type: Boolean,
    default: false,
  },
  canDeleteCategory: {
    type: Boolean,
    default: false,
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
