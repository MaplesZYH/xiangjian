<template>
  <div class="userManage">
    <div class="left-actions">
      <EditUser title="添加用户" @add-user="handleAddUser" />

      <Delete
        :isBatch="true"
        :checkedIds="checkedIds"
        @delete="emit('batch-delete', $event)"
      />
    </div>

    <div class="search-area search-area--inline">
      <n-input
        :value="searchPhone"
        placeholder="请输入手机号查询"
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
import EditUser from '@/components/operation/EditUser.vue'

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

const emit = defineEmits([
  'add-user',
  'batch-delete',
  'update:search-phone',
  'reset',
  'search',
])

const handleAddUser = (...args) => emit('add-user', ...args)
</script>
