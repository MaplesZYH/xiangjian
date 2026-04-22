<template>
  <div class="userManage">
    <div class="left-actions">
      <Delete
        :isBatch="true"
        :checkedIds="checkedIds"
        @delete="emit('batch-delete', $event)"
      />
    </div>

    <div class="search-area search-area--inline">
      <n-input
        :value="searchName"
        placeholder="请输入公司名称"
        clearable
        @update:value="emit('update:search-name', $event)"
        @clear="emit('reset')"
        @keydown.enter="emit('search')"
        class="search-input"
      />
      <n-button type="primary" @click="emit('search')"> 搜索 </n-button>
    </div>
  </div>
</template>

<script setup>
import Delete from '@/components/operation/Delete.vue'

defineProps({
  checkedIds: {
    type: Array,
    default: () => [],
  },
  searchName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'batch-delete',
  'update:search-name',
  'reset',
  'search',
])
</script>
