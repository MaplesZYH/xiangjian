<template>
  <n-card title="设计订单">
    <div class="client-center-toolbar-end">
      <n-button size="small" @click="$emit('refresh')">刷新列表</n-button>
    </div>

    <div class="order-table-wrap">
      <n-spin :show="loadingDesignOrders">
        <div
          v-if="designOrderList.length > 0"
          class="order-list-table design-order-list-table client-center-paper"
        >
          <div class="order-list-table__head">
            <div>设计单号</div>
            <div>设计地址</div>
            <div>产品名称</div>
            <div>设计状态</div>
            <div>支付状态</div>
            <div>操作</div>
          </div>
          <div
            v-for="row in designOrderList"
            :key="row.id"
            class="order-list-table__row"
          >
            <div class="order-list-table__cell">
              <span class="order-list-table__label">设计单号</span>
              <span>{{ row.designOrderNo || '--' }}</span>
            </div>
            <div class="order-list-table__cell">
              <span class="order-list-table__label">设计地址</span>
              <span>{{ row.orderAddress || '--' }}</span>
            </div>
            <div class="order-list-table__cell">
              <span class="order-list-table__label">产品名称</span>
              <span>{{ getDesignOrderListMainProductNameText(row) }}</span>
            </div>
            <div class="order-list-table__cell">
              <span class="order-list-table__label">设计状态</span>
              <n-tag :type="getDesignOrderStatusType(row.designStatus)" size="small">
                {{ getDesignOrderStatusText(row.designStatus) }}
              </n-tag>
            </div>
            <div class="order-list-table__cell">
              <span class="order-list-table__label">支付状态</span>
              <n-tag
                :type="getDesignOrderPaymentStatusType(row.paymentStatus)"
                size="small"
                :bordered="false"
              >
                {{ formatDesignOrderPaymentStatus(row.paymentStatus) }}
              </n-tag>
            </div>
            <div class="order-list-table__cell order-list-table__cell--actions">
              <span class="order-list-table__label">操作</span>
              <div class="order-list-table__actions">
                <n-button
                  size="small"
                  type="info"
                  @click="$emit('open-detail', row)"
                >
                  详情
                </n-button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="client-center-empty-card">
          <n-empty description="当前暂无设计订单" />
        </div>
      </n-spin>
    </div>

    <div
      v-if="designPagination.itemCount > 0"
      class="order-pagination client-center-pagination"
    >
      <n-pagination
        :page="designPagination.page"
        :page-size="designPagination.pageSize"
        :item-count="designPagination.itemCount"
        :page-slot="3"
        show-quick-jumper
        @update:page="$emit('page-change', $event)"
      />
    </div>
  </n-card>
</template>

<script setup>
defineProps({
  loadingDesignOrders: {
    type: Boolean,
    default: false,
  },
  designOrderList: {
    type: Array,
    default: () => [],
  },
  designPagination: {
    type: Object,
    required: true,
  },
  getDesignOrderListMainProductNameText: {
    type: Function,
    required: true,
  },
  getDesignOrderStatusType: {
    type: Function,
    required: true,
  },
  getDesignOrderStatusText: {
    type: Function,
    required: true,
  },
  getDesignOrderPaymentStatusType: {
    type: Function,
    required: true,
  },
  formatDesignOrderPaymentStatus: {
    type: Function,
    required: true,
  },
})

defineEmits(['refresh', 'open-detail', 'page-change'])
</script>
