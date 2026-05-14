<template>
  <div class="house-list admin-shell-list">
    <div class="house-header">
      <div v-if="showCategorySelector" class="center">
        <n-checkbox
          :checked="isAllCategoryChecked"
          :indeterminate="isCategoryIndeterminate"
          @update:checked="emit('check-all', $event)"
        />
      </div>
      <div v-else></div>
      <div>选配类型</div>
      <div v-if="showActionColumn">操作</div>
      <div v-else></div>
    </div>
    <div v-for="item in categories" :key="item.id" class="house-item">
      <div v-if="showCategorySelector" class="center">
        <n-checkbox
          :checked="checkedCategoryIds.includes(item.id)"
          @update:checked="emit('check-one', { id: item.id, checked: $event })"
        />
      </div>
      <div v-else></div>
      <div class="category-name">{{ item.name }}</div>
      <div class="actions">
        <n-button size="small" type="info" @click="emit('edit-products', item.id)">
          编辑产品
        </n-button>
        <Delete
          v-if="canDeleteCategory"
          :itemId="item.id"
          @delete="emit('delete-category', $event)"
        />
      </div>
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      :page="pageInfo.current"
      :page-count="pageInfo.pageCount"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="emit('page-change', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Delete from '@/components/operation/delete.vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  checkedCategoryIds: {
    type: Array,
    default: () => [],
  },
  isAllCategoryChecked: {
    type: Boolean,
    default: false,
  },
  isCategoryIndeterminate: {
    type: Boolean,
    default: false,
  },
  pageInfo: {
    type: Object,
    required: true,
  },
  canDeleteCategory: {
    type: Boolean,
    default: false,
  },
})

const showCategorySelector = computed(() => props.canDeleteCategory)
const showActionColumn = computed(() => true)

const emit = defineEmits([
  'check-all',
  'check-one',
  'edit-products',
  'delete-category',
  'page-change',
])
</script>

<style lang="scss" scoped>
.house-list {
  border: none;
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

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

.house-header div:first-child,
.house-item div:first-child {
  text-align: center;
}

.house-header div:last-child,
.house-item div:last-child {
  text-align: center;
}

.actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  width: 100%;
  overflow: hidden;

  > * {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
  }

  > :deep(.n-button) {
    width: 100%;
    min-width: 0;
    padding: 0 4px;
  }
}
</style>
