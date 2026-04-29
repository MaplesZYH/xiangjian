<template>
  <n-card title="我的订单">
    <template #header-extra>
      <n-button
        size="small"
        type="info"
        secondary
        @click="$emit('open-payment-statement')"
      >
        支付协议
      </n-button>
    </template>

    <n-tabs
      :value="activeOrderStatusTag"
      type="line"
      animated
      class="user-order-tabs"
      @update:value="$emit('update:active-order-status-tag', $event)"
    >
      <n-tab-pane
        v-for="item in orderStatusFilterTabs"
        :key="item.key"
        :name="item.key"
      >
        <template #tab>
          <span class="user-order-tab-label">
            <span>{{ item.label }}</span>
            <n-badge
              v-if="item.showBadge"
              :value="item.badgeCount"
              :max="999"
              color="#d03050"
              class="user-order-tab-badge"
            />
          </span>
        </template>
      </n-tab-pane>
    </n-tabs>

    <div class="order-table-wrap">
      <n-spin :show="loadingOrders">
        <div
          v-if="visibleOrderList.length > 0"
          class="order-list-table client-center-paper"
        >
          <div class="order-list-table__head">
            <div>订单号</div>
            <div>产品名称</div>
            <div>订单状态</div>
            <div>支付状态</div>
            <div>操作</div>
          </div>
          <div
            v-for="row in visibleOrderList"
            :key="row.id"
            class="order-list-table__row"
          >
            <div class="order-list-table__cell">
              <span class="order-list-table__label">订单号</span>
              <span>{{ row.orderNumber || '生成中...' }}</span>
            </div>
            <div class="order-list-table__cell">
              <span class="order-list-table__label">产品名称</span>
              <span>{{ getOrderProductName(row) || '--' }}</span>
            </div>
            <div class="order-list-table__cell">
              <span class="order-list-table__label">订单状态</span>
              <n-tag :type="getStatusType(row.orderStatus)" size="small">
                {{ formatOrderStatus(row.orderStatus) }}
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
                  @click="$emit('open-detail', { row, initialTab: 'info' })"
                >
                  详情
                </n-button>
                <n-button
                  v-if="canOpenRefundCenter(row)"
                  size="small"
                  type="warning"
                  secondary
                  @click="$emit('open-detail', { row, initialTab: 'payments' })"
                >
                  退款处理
                </n-button>
                <n-button
                  v-if="
                    row.contractLoaded &&
                    !hasUploadedContract(row) &&
                    ![4, 5].includes(Number(row.orderStatus))
                  "
                  size="small"
                  type="error"
                  secondary
                  @click="$emit('cancel-order', row)"
                >
                  取消
                </n-button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="client-center-empty-card">
          <n-empty description="当前暂无订单数据" />
        </div>
      </n-spin>
    </div>

    <div
      v-if="pagination.itemCount > 0"
      class="order-pagination client-center-pagination"
    >
      <n-pagination
        :page="pagination.page"
        :page-size="pagination.pageSize"
        :item-count="pagination.itemCount"
        :page-slot="3"
        show-quick-jumper
        @update:page="$emit('page-change', $event)"
      />
    </div>
  </n-card>
</template>

<script setup>
defineProps({
  activeOrderStatusTag: {
    type: String,
    default: 'all',
  },
  orderStatusFilterTabs: {
    type: Array,
    default: () => [],
  },
  loadingOrders: {
    type: Boolean,
    default: false,
  },
  visibleOrderList: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    required: true,
  },
  getOrderProductName: {
    type: Function,
    required: true,
  },
  getStatusType: {
    type: Function,
    required: true,
  },
  formatOrderStatus: {
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
  canOpenRefundCenter: {
    type: Function,
    required: true,
  },
  hasUploadedContract: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'update:active-order-status-tag',
  'open-payment-statement',
  'open-detail',
  'cancel-order',
  'page-change',
])
</script>
