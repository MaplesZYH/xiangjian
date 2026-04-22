<template>
  <div class="house-list admin-shell-list">
    <div class="house-header">
      <div>
        <n-checkbox
          :checked="isAllSelected"
          :indeterminate="isIndeterminate"
          @update:checked="emit('select-all', $event)"
        />
      </div>
      <div>产品名称</div>
      <div>操作</div>
    </div>

    <div v-for="item in houseList" :key="item.id" class="house-item">
      <div>
        <n-checkbox
          :checked="selectedIds.includes(item.id)"
          @update:checked="emit('select-one', { id: item.id, checked: $event })"
        />
      </div>
      <div :title="item.name">{{ item.name }}</div>
      <div class="actions">
        <EditHouse title="编辑户型" :itemId="item.id" @saved="emit('saved')" />
        <Delete :itemId="item.id" @delete="emit('delete-house', $event)" />
      </div>
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      :page="pageinfo.current"
      :page-count="pageinfo.pageCount"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="emit('page-change', $event)"
    />
  </div>
</template>

<script setup>
import Delete from '@/components/operation/delete.vue'
import EditHouse from '@/components/operation/EditHouse.vue'

defineProps({
  houseList: {
    type: Array,
    default: () => [],
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
  isAllSelected: {
    type: Boolean,
    default: false,
  },
  isIndeterminate: {
    type: Boolean,
    default: false,
  },
  pageinfo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select-all', 'select-one', 'saved', 'delete-house', 'page-change'])
</script>

<style lang="scss" scoped>
.house-header,
.house-item {
  display: grid;
  grid-template-columns: 50px minmax(240px, 1fr) 220px;
  gap: 30px;
  padding: 15px;
  align-items: center;
  min-width: 600px;
}

.house-header {
  div {
    text-align: center;
  }
}

.house-item {
  div {
    text-align: center;
  }
}

.actions {
  justify-content: center;
}

@media (max-width: 768px) {
  .house-header,
  .house-item {
    min-width: 600px;
    gap: 16px;
    padding: 12px;
  }
}
</style>
