<template>
  <div class="filter-container">
    <div class="filter-row">
      <div class="filter-item filter-item-keyword">
        <n-input
          :value="filters.keyword"
          placeholder="请输入订单号/姓名/手机号"
          clearable
          @update:value="handleFilterFieldUpdate('keyword', $event)"
          @keydown.enter="emit('search')"
        />
      </div>
      <div class="filter-item filter-item-select">
        <n-select
          :value="filters.orderStatus"
          placeholder="订单状态 (全部)"
          :options="orderStatusOptions"
          clearable
          @update:value="handleFilterFieldUpdate('orderStatus', $event, true)"
        />
      </div>
      <div class="filter-item filter-item-select">
        <n-select
          :value="filters.paymentStatus"
          placeholder="支付状态 (全部)"
          :options="paymentStatusOptions"
          clearable
          @update:value="handleFilterFieldUpdate('paymentStatus', $event, true)"
        />
      </div>
      <div class="filter-item filter-item-action">
        <n-button type="primary" @click="emit('search')">查询</n-button>
      </div>
    </div>
  </div>

  <div class="todo-overview">
    <button
      v-for="card in todoCards"
      :key="card.key"
      type="button"
      class="todo-filter-tag"
      :class="{ 'is-active': activeTodoFilter === card.key }"
      @click="emit('update:activeTodoFilter', card.key)"
    >
      <span class="todo-filter-tag__text">{{ card.label }}</span>
      <span v-if="card.key === 'all'" class="todo-filter-tag__count">
        {{ formatTodoBadgeCount(card.count) }}
      </span>
      <span v-else-if="card.count > 0" class="todo-filter-tag__badge">
        {{ formatTodoBadgeCount(card.count) }}
      </span>
    </button>
  </div>

  <div class="todo-toolbar">
    <div class="todo-toolbar__summary">
      <span class="todo-toolbar__label">当前消息视图</span>
      <n-tag
        size="small"
        :type="activeTodoFilter === 'all' ? 'default' : 'info'"
        :bordered="false"
      >
        {{ activeTodoFilterLabel }}
      </n-tag>
    </div>
    <n-button
      v-if="activeTodoFilter !== 'all'"
      text
      type="primary"
      @click="emit('update:activeTodoFilter', 'all')"
    >
      查看全部订单
    </n-button>
  </div>

  <div class="order-list admin-shell-list">
    <div class="list-header">
      <div class="header-item">订单号</div>
      <div class="header-item">姓名</div>
      <div class="header-item">手机号</div>
      <div class="header-item">订单状态</div>
      <div class="header-item">支付状态</div>
      <div class="header-item actions-header">操作</div>
    </div>

    <n-spin :show="loadingList">
      <div v-if="visibleOrderList.length > 0">
        <div v-for="item in visibleOrderList" :key="item.id" class="list-row">
          <div class="list-item">{{ item.orderNumber }}</div>
          <div class="list-item">{{ item.userName }}</div>
          <div class="list-item">{{ item.userPhone }}</div>
          <div class="list-item">
            <n-tag :type="getStatusType(item.orderStatus)">
              {{ getStatusText(item.orderStatus) }}
            </n-tag>
          </div>
          <div class="list-item">
            <n-tag :type="getPaymentType(item.paymentStatus)">
              {{ getPaymentText(item.paymentStatus) }}
            </n-tag>
          </div>
          <div class="list-item actions">
            <n-button
              type="info"
              size="small"
              @click="emit('open-detail', item)"
            >
              详情/编辑
            </n-button>

            <n-button
              type="primary"
              size="small"
              :disabled="!canOpenDispatchEntry(item)"
              @click="emit('open-dispatch', item)"
            >
              处理/派单
            </n-button>

            <Delete
              :item-id="item.id"
              confirm-text="确定删除该订单吗？"
              @delete="emit('delete-order', $event)"
            />
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <n-empty :description="emptyOrderListDescription" />
      </div>
    </n-spin>
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

defineProps({
  filters: {
    type: Object,
    required: true,
  },
  orderStatusOptions: {
    type: Array,
    default: () => [],
  },
  paymentStatusOptions: {
    type: Array,
    default: () => [],
  },
  todoCards: {
    type: Array,
    default: () => [],
  },
  activeTodoFilter: {
    type: String,
    default: 'all',
  },
  activeTodoFilterLabel: {
    type: String,
    default: '全部订单',
  },
  visibleOrderList: {
    type: Array,
    default: () => [],
  },
  loadingList: {
    type: Boolean,
    default: false,
  },
  emptyOrderListDescription: {
    type: String,
    default: '暂无订单数据',
  },
  pageInfo: {
    type: Object,
    required: true,
  },
  formatTodoBadgeCount: {
    type: Function,
    required: true,
  },
  getStatusType: {
    type: Function,
    required: true,
  },
  getStatusText: {
    type: Function,
    required: true,
  },
  getPaymentType: {
    type: Function,
    required: true,
  },
  getPaymentText: {
    type: Function,
    required: true,
  },
  canOpenDispatchEntry: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'search',
  'update:filterField',
  'update:activeTodoFilter',
  'open-detail',
  'open-dispatch',
  'delete-order',
  'page-change',
])

const handleFilterFieldUpdate = (key, value, shouldSearch = false) => {
  emit('update:filterField', {
    key,
    value,
  })

  if (shouldSearch) {
    emit('search')
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  margin-bottom: 16px;
  overflow-x: auto;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 760px;
}

.filter-item {
  flex: 0 0 auto;
}

.filter-item-keyword {
  width: 280px;
}

.filter-item-select {
  width: 180px;
}

.filter-item-action {
  width: 96px;
}

.todo-overview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.todo-filter-tag {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(39, 110, 61, 0.16);
  background: #f6faf7;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.todo-filter-tag:hover {
  border-color: rgba(39, 110, 61, 0.34);
  color: var(--color-brand-700);
}

.todo-filter-tag.is-active {
  background: linear-gradient(135deg, #276e3d 0%, #1f5a31 100%);
  border-color: #276e3d;
  color: #fff;
  box-shadow: 0 8px 18px rgba(39, 110, 61, 0.18);
}

.todo-filter-tag__text {
  line-height: 1;
}

.todo-filter-tag__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(39, 110, 61, 0.1);
  color: var(--color-brand-700);
  font-size: 11px;
  font-weight: 700;
}

.todo-filter-tag.is-active .todo-filter-tag__count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.todo-filter-tag__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #d03050;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0 0 2px #fff;
}

.todo-filter-tag.is-active .todo-filter-tag__badge {
  box-shadow: 0 0 0 2px rgba(39, 110, 61, 0.9);
}

.todo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.todo-toolbar__summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.todo-toolbar__label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.order-list {
  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: minmax(180px, 1.5fr) minmax(90px, 1fr) minmax(
        120px,
        1.2fr
      ) minmax(100px, 1fr) minmax(100px, 1fr) 330px;
    gap: 12px;
    padding: 14px 20px;
    align-items: center;
    min-width: 1030px;
  }

  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-secondary);
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.empty-state {
  padding: 40px;
  display: flex;
  justify-content: center;
}

@media (max-width: 992px) {
  .filter-row {
    min-width: 0;
    flex-wrap: wrap;
  }

  .filter-item-keyword,
  .filter-item-select,
  .filter-item-action {
    width: calc(50% - 6px);
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .filter-container {
    overflow: visible;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filter-item-keyword,
  .filter-item-select,
  .filter-item-action {
    width: 100%;
  }

  .filter-item-action :deep(.n-button) {
    width: 100%;
  }

  .order-list {
    .list-header,
    .list-row {
      min-width: 1030px;
    }
  }

  .todo-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 576px) {
  .todo-filter-tag {
    min-height: 32px;
    padding: 0 12px;
    font-size: 12px;
  }
}
</style>
