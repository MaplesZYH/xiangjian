<template>
  <div class="admin-list admin-shell-list">
    <div class="list-header">
      <div class="header-item center">
        <n-checkbox
          :checked="isAllChecked"
          :indeterminate="isIndeterminate"
          @update:checked="emit('check-all', $event)"
        />
      </div>
      <div class="header-item">角色</div>
      <div class="header-item">姓名</div>
      <div class="header-item">手机号</div>
      <div class="header-item">操作</div>
    </div>

    <div v-if="adminList.length > 0">
      <div v-for="item in adminList" :key="item.id" class="list-row">
        <div class="list-item center">
          <n-checkbox
            :checked="checkedIds.includes(item.id)"
            @update:checked="emit('check-one', { checked: $event, id: item.id })"
          />
        </div>
        <div class="list-item" :title="roleMap[item.roleId] || '未知角色'">
          {{ roleMap[item.roleId] || '未知角色' }}
        </div>
        <div class="list-item" :title="item.name">{{ item.name }}</div>
        <div class="list-item" :title="item.phone">{{ item.phone }}</div>

        <div class="list-item actions">
          <EditAdmin
            type="info"
            title="编辑员工"
            :itemData="item"
            @update="(...args) => emit('update-admin', ...args)"
          />
          <Delete :itemId="item.id" @delete="emit('delete-admin', $event)" />
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <n-empty description="暂无管理员数据" />
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      :page="pageinfo.page"
      :page-count="pageinfo.pageCount"
      :page-size="pageinfo.pageSize"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="emit('page-change', $event)"
    />
  </div>
</template>

<script setup>
import Delete from '@/components/operation/Delete.vue'
import EditAdmin from '@/components/operation/EditAdmin.vue'

defineProps({
  adminList: {
    type: Array,
    default: () => [],
  },
  checkedIds: {
    type: Array,
    default: () => [],
  },
  isAllChecked: {
    type: Boolean,
    default: false,
  },
  isIndeterminate: {
    type: Boolean,
    default: false,
  },
  roleMap: {
    type: Object,
    required: true,
  },
  pageinfo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'check-all',
  'check-one',
  'update-admin',
  'delete-admin',
  'page-change',
])
</script>

<style lang="scss" scoped>
.admin-list {
  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: 50px minmax(90px, 1fr) minmax(90px, 1fr) minmax(
        140px,
        1.5fr
      ) 210px;
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: 680px;
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .admin-list {
    .list-header,
    .list-row {
      min-width: 680px;
      gap: 12px;
      padding: 12px;
    }
  }
}
</style>
