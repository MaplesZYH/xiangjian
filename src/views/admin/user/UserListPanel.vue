<template>
  <div class="user-list admin-shell-list">
    <div class="user-table">
      <div class="list-header">
        <div class="header-item center">
          <n-checkbox
            :checked="isAllChecked"
            :indeterminate="isIndeterminate"
            @update:checked="emit('check-all', $event)"
          />
        </div>
        <div class="header-item">姓名</div>
        <div class="header-item">手机号</div>
        <div class="header-item">地址</div>
        <div class="header-item">操作</div>
      </div>

      <div v-if="userList.length > 0" class="list-body">
        <div v-for="item in userList" :key="item.id" class="list-row">
          <div class="list-item center">
            <n-checkbox
              :checked="checkedIds.includes(item.id)"
              @update:checked="emit('check-one', { checked: $event, id: item.id })"
            />
          </div>
          <div class="list-item" :title="item.name">{{ item.name }}</div>
          <div class="list-item" :title="item.phoneNumber">{{ item.phoneNumber }}</div>
          <div class="list-item" :title="item.address || '用户暂未填写'">
            {{ item.address || '用户暂未填写' }}
          </div>
          <div class="list-item actions">
            <EditUser
              title="编辑用户"
              :userData="item"
              :isEdit="true"
              @update-user="(...args) => emit('update-user', item.id, ...args)"
            />
            <Delete :itemId="item.id" @delete="emit('delete-user', $event)" />
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <n-empty description="暂无用户数据" />
      </div>
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      :page="pageinfo.page"
      :page-count="pageinfo.pageCount"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="emit('page-change', $event)"
    />
  </div>
</template>

<script setup>
import Delete from '@/components/operation/Delete.vue'
import EditUser from '@/components/operation/EditUser.vue'

defineProps({
  userList: {
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
  pageinfo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'check-all',
  'check-one',
  'update-user',
  'delete-user',
  'page-change',
])
</script>

<style lang="scss" scoped>
.user-list {
  --user-grid-columns: 50px minmax(90px, 1fr) minmax(120px, 1fr) minmax(
      160px,
      1.5fr
    ) 210px;
  --user-table-min-width: 730px;

  width: 100%;

  .user-table {
    min-width: var(--user-table-min-width);
    width: 100%;
  }

  .list-header,
  .list-body {
    min-width: var(--user-table-min-width);
    box-sizing: border-box;
  }

  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: var(--user-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--user-table-min-width);
    box-sizing: border-box;
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
  .user-list {
    --user-table-min-width: 730px;

    .list-header,
    .list-row {
      gap: 12px;
      padding: 12px;
    }
  }
}
</style>
