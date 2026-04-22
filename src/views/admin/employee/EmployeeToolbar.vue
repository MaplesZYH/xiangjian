<template>
  <div class="userManage">
    <div class="left-actions">
      <EditAdmin type="info" title="添加员工" @update="handleAdd" />

      <Delete
        :isBatch="true"
        :checkedIds="checkedIds"
        @delete="emit('batch-delete', $event)"
      />
    </div>

    <div class="search-area search-area--inline">
      <n-input
        :value="searchPhone"
        placeholder="请输入员工手机号"
        clearable
        @update:value="emit('update:search-phone', $event)"
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
import EditAdmin from '@/components/operation/EditAdmin.vue'

defineProps({
  checkedIds: {
    type: Array,
    default: () => [],
  },
  searchPhone: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['add-admin', 'batch-delete', 'update:search-phone', 'reset', 'search'])

const handleAdd = (...args) => emit('add-admin', ...args)
</script>
