<template>
  <div class="design-order-list admin-shell-list">
    <div class="design-order-table">
      <div class="list-header">
        <div class="header-item">设计单号</div>
        <div class="header-item">设计地址</div>
        <div class="header-item">产品名称</div>
        <div class="header-item">设计状态</div>
        <div class="header-item">支付状态</div>
        <div class="header-item actions-header">操作</div>
      </div>

      <n-spin :show="loading" class="design-order-spin">
        <div v-if="orderList.length > 0" class="list-body">
          <div v-for="item in orderList" :key="item.id" class="list-row">
            <div class="list-item" :title="item.designOrderNo || '--'">
              {{ item.designOrderNo || '--' }}
            </div>
            <div class="list-item" :title="item.orderAddress || '--'">
              {{ item.orderAddress || '--' }}
            </div>
            <div class="list-item" :title="getDesignOrderListMainProductText(item)">
              {{ getDesignOrderListMainProductText(item) }}
            </div>
            <div class="list-item">
              <n-tag :type="getDesignStatusType(item.designStatus)">
                {{ getDesignStatusText(item.designStatus) }}
              </n-tag>
            </div>
            <div class="list-item">
              <n-tag :type="getPaymentType(item.paymentStatus)">
                {{ getPaymentText(item.paymentStatus) }}
              </n-tag>
            </div>
            <div class="list-item actions">
              <n-button type="info" size="small" @click="emit('open-detail', item)">
                详情/上传
              </n-button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <n-empty description="当前暂无设计订单" />
        </div>
      </n-spin>
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      :page="pageInfo.page"
      :page-size="pageInfo.pageSize"
      :item-count="pageInfo.itemCount"
      :page-slot="3"
      show-quick-jumper
      @update:page="emit('page-change', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  orderList: {
    type: Array,
    default: () => [],
  },
  pageInfo: {
    type: Object,
    required: true,
  },
  getDesignOrderListMainProductText: {
    type: Function,
    required: true,
  },
  getDesignStatusType: {
    type: Function,
    required: true,
  },
  getDesignStatusText: {
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
})

const emit = defineEmits(['open-detail', 'page-change'])
</script>

<style lang="scss" scoped>
.design-order-list {
  --design-order-grid-columns: minmax(140px, 1.2fr) minmax(220px, 1.9fr) minmax(
      180px,
      1.2fr
    ) minmax(120px, 1fr) minmax(110px, 0.9fr) 180px;
  --design-order-table-min-width: 1000px;

  width: 100%;

  .design-order-table {
    min-width: var(--design-order-table-min-width);
    width: max-content;
  }

  .design-order-spin {
    width: 100%;

    :deep(.n-spin-content) {
      width: 100%;
    }
  }

  .list-header,
  .list-body {
    min-width: var(--design-order-table-min-width);
    box-sizing: border-box;
  }

  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: var(--design-order-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--design-order-table-min-width);
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

  .actions-header,
  .actions {
    text-align: center;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .design-order-list {
    --design-order-table-min-width: 1000px;

    .list-header,
    .list-row {
      gap: 12px;
      padding: 12px;
    }
  }
}
</style>
