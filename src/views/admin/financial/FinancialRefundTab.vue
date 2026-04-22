<template>
  <section class="financial-section">
    <div class="financial-section__header">
      <h3 class="financial-section__title">退款管理</h3>
    </div>
    <n-space vertical size="large">
      <div class="financial-filter-row">
        <div class="financial-filter-item financial-filter-item-input">
          <n-input
            :value="orderNumber"
            placeholder="订单号"
            clearable
            @update:value="emit('update:orderNumber', $event)"
            @keydown.enter="emit('search')"
          />
        </div>
        <div class="financial-filter-item financial-filter-item-select">
          <n-select
            :value="status"
            :options="refundStatusOptions"
            placeholder="退款状态"
            @update:value="handleStatusUpdate"
          />
        </div>
        <div class="financial-filter-item financial-filter-item-actions">
          <n-space>
            <n-button type="primary" @click="emit('search')">查询</n-button>
          </n-space>
        </div>
      </div>

      <div class="financial-list admin-shell-list financial-list--refund">
        <div class="financial-table-scroll">
          <div class="financial-table">
            <div class="list-header">
              <div class="header-item">订单号</div>
              <div class="header-item">用户名</div>
              <div class="header-item">手机号</div>
              <div class="header-item">支付金额</div>
              <div class="header-item">退款金额</div>
              <div class="header-item">退款状态</div>
              <div class="header-item">申请时间</div>
              <div class="header-item">操作</div>
            </div>

            <n-spin :show="loading" class="financial-spin">
              <div v-if="records.length > 0" class="list-body">
                <div v-for="item in records" :key="item.id" class="list-row">
                  <div class="list-item" :title="item.orderNumber || '--'">
                    {{ item.orderNumber || '--' }}
                  </div>
                  <div class="list-item" :title="item.userName || '--'">
                    {{ item.userName || '--' }}
                  </div>
                  <div class="list-item" :title="item.userPhone || '--'">
                    {{ item.userPhone || '--' }}
                  </div>
                  <div class="list-item" :title="`¥${formatMoney(item.paymentAmount)}`">
                    ¥{{ formatMoney(item.paymentAmount) }}
                  </div>
                  <div class="list-item" :title="`¥${formatMoney(item.refundAmount)}`">
                    ¥{{ formatMoney(item.refundAmount) }}
                  </div>
                  <div class="list-item">
                    <n-tag :type="getRefundStatusType(item.status)" size="small">
                      {{ getRefundStatusText(item.status) }}
                    </n-tag>
                  </div>
                  <div class="list-item" :title="formatDateTime(item.createTime)">
                    {{ formatDateTime(item.createTime) }}
                  </div>
                  <div class="list-item actions">
                    <n-button
                      v-if="hasRefundViewPermission"
                      size="small"
                      type="info"
                      secondary
                      @click="emit('open-detail', item)"
                    >
                      详情
                    </n-button>
                    <n-button
                      v-if="hasRefundAuditPermission && Number(item.status) === 0"
                      size="small"
                      type="primary"
                      @click="emit('open-audit', item)"
                    >
                      审核
                    </n-button>
                    <n-button
                      v-if="hasRefundAuditPermission && Number(item.status) === 3"
                      size="small"
                      type="warning"
                      ghost
                      @click="emit('sync-status', item)"
                    >
                      同步状态
                    </n-button>
                  </div>
                </div>
              </div>

              <div v-else class="empty-state">
                <n-empty description="暂无退款数据" />
              </div>
            </n-spin>
          </div>
        </div>
      </div>

      <div class="pagination-wrap">
        <n-pagination
          :page="pageInfo.page"
          :page-size="pageInfo.pageSize"
          :item-count="pageInfo.itemCount"
          :page-slot="3"
          show-quick-jumper
          @update:page="emit('page-change', $event)"
        />
      </div>
    </n-space>
  </section>
</template>

<script setup>
defineProps({
  orderNumber: {
    type: String,
    default: '',
  },
  status: {
    type: [Number, String, null],
    default: null,
  },
  refundStatusOptions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  records: {
    type: Array,
    default: () => [],
  },
  pageInfo: {
    type: Object,
    required: true,
  },
  hasRefundViewPermission: {
    type: Boolean,
    default: false,
  },
  hasRefundAuditPermission: {
    type: Boolean,
    default: false,
  },
  getRefundStatusType: {
    type: Function,
    required: true,
  },
  getRefundStatusText: {
    type: Function,
    required: true,
  },
  formatMoney: {
    type: Function,
    required: true,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'update:orderNumber',
  'update:status',
  'search',
  'open-detail',
  'open-audit',
  'sync-status',
  'page-change',
])

const handleStatusUpdate = (value) => {
  emit('update:status', value)
  emit('search')
}
</script>

<style lang="scss" scoped>
.financial-section {
  padding: 18px 14px 16px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.financial-section__header {
  margin-bottom: 18px;
}

.financial-section__title {
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.financial-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  min-width: 720px;
}

.financial-filter-item {
  flex: 0 0 auto;
}

.financial-filter-item-input,
.financial-filter-item-select {
  width: 180px;
}

.financial-filter-item-actions {
  min-width: 120px;
}

.financial-list {
  --financial-grid-columns: minmax(220px, 1.4fr) minmax(120px, 0.7fr) minmax(
      140px,
      0.82fr
    ) minmax(110px, 0.7fr) minmax(110px, 0.7fr) minmax(110px, 0.72fr) minmax(
      180px,
      1fr
    ) 240px;
  --financial-table-min-width: 1320px;

  width: 100%;

  .financial-table {
    min-width: var(--financial-table-min-width);
    width: max-content;
  }

  .financial-spin {
    width: 100%;

    :deep(.n-spin-content) {
      width: 100%;
    }
  }

  .list-header,
  .list-body {
    min-width: var(--financial-table-min-width);
    box-sizing: border-box;
  }

  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: var(--financial-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--financial-table-min-width);
    box-sizing: border-box;
  }

  .header-item,
  .list-item {
    min-width: 0;
  }

  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.financial-table-scroll {
  width: 100%;
  overflow: visible;
  border: none;
  border-radius: inherit;
  background: var(--color-surface);
}

@media (max-width: 768px) {
  .financial-section {
    padding: 16px 0 12px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }

  .financial-section__header {
    margin-bottom: 16px;
    padding-inline: 12px;
  }

  .financial-section__title {
    font-size: 18px;
  }

  .financial-filter-row {
    min-width: 0;
    flex-direction: column;
    align-items: stretch;
    overflow: visible;
    padding-inline: 12px;
  }

  .financial-filter-item,
  .financial-filter-item-input,
  .financial-filter-item-select,
  .financial-filter-item-actions {
    width: 100%;
  }

  .financial-filter-item-actions :deep(.n-space) {
    width: 100%;
  }

  .financial-filter-item-actions :deep(.n-button) {
    width: 100%;
  }

  .pagination-wrap {
    padding-inline: 12px;
  }

  .financial-list {
    .list-header,
    .list-row {
      gap: 12px;
      padding: 12px;
    }
  }
}
</style>
