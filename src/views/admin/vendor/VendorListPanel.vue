<template>
  <div class="house-list admin-shell-list">
    <div class="house-table">
      <div class="house-header">
        <div class="header-item center">
          <n-checkbox
            :checked="isAllChecked"
            :indeterminate="isIndeterminate"
            @update:checked="emit('check-all', $event)"
          />
        </div>
        <div class="header-item">公司名称</div>
        <div class="header-item">负责人/电话</div>
        <div class="header-item">地址</div>
        <div class="header-item">服务类型</div>
        <div class="header-item">状态</div>
        <div class="header-item">操作</div>
      </div>

      <n-spin :show="loading" class="house-spin">
        <div v-if="serviceList.length > 0" class="house-body">
          <div v-for="item in serviceList" :key="item.id" class="house-item">
            <div class="list-item center">
              <n-checkbox
                :checked="checkedIds.includes(item.id)"
                @update:checked="emit('check-one', { checked: $event, id: item.id })"
              />
            </div>
            <div class="list-item" :title="item.companyName">
              {{ item.companyName || 'N/A' }}
            </div>
            <div class="list-item">
              {{ item.companyChargerName }} <br />
              <span class="vendor-phone">{{ item.phone }}</span>
            </div>
            <div class="list-item" :title="item.companyAddress">
              {{ item.companyAddress || 'N/A' }}
            </div>

            <div class="list-item">
              <n-tag :bordered="false" type="info" size="small">
                {{ getServiceTypeName(item.serviceType) }}
              </n-tag>
            </div>

            <div class="list-item">
              <n-tag :type="formatStatus(item.status ?? currentStatus).type" size="small">
                {{ formatStatus(item.status ?? currentStatus).text }}
              </n-tag>
            </div>

            <div class="list-item actions">
              <n-button
                size="small"
                type="info"
                @click="handlePrimaryAction(item)"
              >
                {{ getPrimaryActionText(currentStatus) }}
              </n-button>
              <Delete
                size="small"
                :itemId="item.id"
                @delete="emit('delete-service', $event)"
              />
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <n-empty description="暂无相关服务商数据" />
        </div>
      </n-spin>
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      :page="pageInfo.page"
      :page-count="pageInfo.pageCount"
      :page-size="pageInfo.pageSize"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="emit('page-change', $event)"
    />
  </div>
</template>

<script setup>
import Delete from '@/components/operation/Delete.vue'

const props = defineProps({
  serviceList: {
    type: Array,
    default: () => [],
  },
  checkedIds: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isAllChecked: {
    type: Boolean,
    default: false,
  },
  isIndeterminate: {
    type: Boolean,
    default: false,
  },
  currentStatus: {
    type: Number,
    default: 1,
  },
  pageInfo: {
    type: Object,
    required: true,
  },
  getServiceTypeName: {
    type: Function,
    required: true,
  },
  formatStatus: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'check-all',
  'check-one',
  'open-audit',
  'view-detail',
  'delete-service',
  'page-change',
])

const getPrimaryActionText = (status) => {
  if (status === 2) return '审核'
  if (status === 1) return '查看'
  return '详情'
}

const handlePrimaryAction = (item) => {
  if (props.currentStatus === 2) {
    emit('open-audit', item)
    return
  }
  emit('view-detail', item)
}
</script>

<style lang="scss" scoped>
.house-list {
  --house-grid-columns: 50px minmax(140px, 1.35fr) minmax(130px, 1.2fr)
    minmax(140px, 1.35fr) minmax(80px, 0.72fr) minmax(72px, 0.62fr) 270px;
  --house-table-min-width: 1020px;

  width: 100%;

  .house-table {
    min-width: var(--house-table-min-width);
    width: 100%;
  }

  .house-spin {
    width: 100%;

    :deep(.n-spin-content) {
      width: 100%;
    }
  }

  .house-header,
  .house-body {
    min-width: var(--house-table-min-width);
    box-sizing: border-box;
  }

  .house-header,
  .house-item {
    display: grid;
    grid-template-columns: var(--house-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--house-table-min-width);
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

.vendor-phone {
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>
