<template>
  <section class="financial-section">
    <div class="financial-section__header">
      <h3 class="financial-section__title">支付流水管理</h3>
    </div>
    <n-space vertical size="large">
      <div class="financial-filter-row">
        <div class="financial-filter-item financial-filter-item-keyword">
          <n-input
            :value="keyword"
            placeholder="订单号 / 用户名 / 手机号"
            clearable
            @update:value="emit('update:keyword', $event)"
            @keydown.enter="emit('search')"
          />
        </div>
        <div class="financial-filter-item financial-filter-item-actions">
          <n-space>
            <n-button type="primary" @click="emit('search')">查询</n-button>
            <n-button type="warning" secondary @click="emit('open-deposit-setting')">
              定金设置
            </n-button>
            <n-button type="info" secondary @click="emit('open-payment-statement')">
              支付协议
            </n-button>
          </n-space>
        </div>
      </div>

      <div class="financial-list admin-shell-list financial-list--payment">
        <div class="financial-table-scroll">
          <div class="financial-table">
            <div class="list-header">
              <div class="header-item">支付流水ID</div>
              <div class="header-item">订单号</div>
              <div class="header-item">用户名</div>
              <div class="header-item">手机号</div>
              <div class="header-item">支付阶段</div>
              <div class="header-item">支付渠道</div>
              <div class="header-item">支付金额</div>
              <div class="header-item">交易流水号</div>
              <div class="header-item">支付时间</div>
              <div class="header-item">操作</div>
            </div>

            <n-spin :show="loading" class="financial-spin">
              <div v-if="records.length > 0" class="list-body">
                <div v-for="item in records" :key="item.id" class="list-row">
                  <div class="list-item" :title="String(item.id || '--')">
                    {{ item.id || '--' }}
                  </div>
                  <div class="list-item" :title="item.orderNumber || '--'">
                    {{ item.orderNumber || '--' }}
                  </div>
                  <div class="list-item" :title="item.userName || '--'">
                    {{ item.userName || '--' }}
                  </div>
                  <div class="list-item" :title="item.phoneNumber || '--'">
                    {{ item.phoneNumber || '--' }}
                  </div>
                  <div class="list-item" :title="getPaymentStageText(item.paymentStage)">
                    {{ getPaymentStageText(item.paymentStage) }}
                  </div>
                  <div class="list-item">
                    <n-tag :type="getPaymentChannelType(item.paymentChannel)" size="small">
                      {{ getPaymentChannelText(item.paymentChannel) }}
                    </n-tag>
                  </div>
                  <div class="list-item" :title="`¥${formatMoney(item.amount)}`">
                    ¥{{ formatMoney(item.amount) }}
                  </div>
                  <div class="list-item" :title="item.transactionId || '--'">
                    {{ item.transactionId || '--' }}
                  </div>
                  <div class="list-item" :title="formatDateTime(item.payTime)">
                    {{ formatDateTime(item.payTime) }}
                  </div>
                  <div class="list-item actions">
                    <n-button
                      v-if="hasPaymentViewPermission"
                      size="small"
                      type="info"
                      secondary
                      @click="emit('open-detail', item)"
                    >
                      详情
                    </n-button>
                    <span v-else>--</span>
                  </div>
                </div>
              </div>

              <div v-else class="empty-state">
                <n-empty description="暂无支付流水数据" />
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
  keyword: {
    type: String,
    default: '',
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
  hasPaymentViewPermission: {
    type: Boolean,
    default: false,
  },
  getPaymentStageText: {
    type: Function,
    required: true,
  },
  getPaymentChannelType: {
    type: Function,
    required: true,
  },
  getPaymentChannelText: {
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
  'update:keyword',
  'search',
  'open-deposit-setting',
  'open-payment-statement',
  'open-detail',
  'page-change',
])
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

.financial-filter-item-keyword {
  width: 240px;
}

.financial-filter-item-actions {
  min-width: 220px;
}

.financial-list {
  --financial-grid-columns: minmax(120px, 0.72fr) minmax(220px, 1.4fr) minmax(
      120px,
      0.85fr
    ) minmax(150px, 0.95fr) minmax(110px, 0.82fr) minmax(100px, 0.72fr) minmax(
      110px,
      0.78fr
    ) minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(96px, 0.64fr);
  --financial-table-min-width: 1540px;

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
  .financial-filter-item-keyword,
  .financial-filter-item-actions {
    width: 100%;
  }

  .financial-filter-item-actions :deep(.n-space) {
    width: 100%;
  }

  .financial-filter-item-actions :deep(.n-space > .n-space-item) {
    flex: 1 1 100%;
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
