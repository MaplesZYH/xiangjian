<template>
  <div class="userManage">
    <div class="action-bar left-actions">
      <EditHouse title="添加户型" @saved="emit('saved')" />
      <n-button
        size="small"
        type="error"
        :disabled="selectedIds.length === 0"
        @click="emit('batch-delete')"
      >
        批量删除
      </n-button>
    </div>

    <div class="search-area search-area--inline">
      <n-input
        :value="searchHouseName"
        placeholder="请输入户型名称"
        clearable
        @update:value="emit('update:search-house-name', $event)"
        @clear="emit('search')"
        @keydown.enter="emit('search')"
        class="search-input"
      />
      <n-button type="primary" @click="emit('search')"> 搜索 </n-button>
    </div>
  </div>
</template>

<script setup>
import EditHouse from '@/components/operation/EditHouse.vue'

defineProps({
  selectedIds: {
    type: Array,
    default: () => [],
  },
  searchHouseName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['saved', 'batch-delete', 'update:search-house-name', 'search'])
</script>

<style lang="scss" scoped>
.userManage {
  padding: 15px;

  .action-bar {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .userManage {
    padding: 0;
  }
}
</style>
