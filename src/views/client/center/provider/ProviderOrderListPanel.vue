<template>
  <n-space vertical>
    <div class="client-center-header">
      <n-h2>我的订单</n-h2>
    </div>

    <n-tabs
      :value="orderStatusTab"
      type="segment"
      animated
      class="vendor-order-tabs"
      @update:value="$emit('update:order-status-tab', $event)"
    >
      <n-tab-pane name="1">
        <template #tab>
          <span class="vendor-order-tab-label">
            <span>已接受</span>
            <n-badge
              v-if="acceptedNeedHandleCount > 0"
              :value="acceptedNeedHandleCount"
              :max="999"
              color="#d03050"
              class="vendor-order-tab-badge"
            />
          </span>
        </template>
      </n-tab-pane>
      <n-tab-pane name="3">
        <template #tab>
          <span class="vendor-order-tab-label">
            <span>未回复</span>
            <n-badge
              v-if="unrepliedOrderCount > 0"
              :value="unrepliedOrderCount"
              :max="999"
              color="#d03050"
              class="vendor-order-tab-badge"
            />
          </span>
        </template>
      </n-tab-pane>
      <n-tab-pane name="2" tab="已完成" />
    </n-tabs>

    <div
      v-if="!ordersLoading && !orderList.length"
      class="vendor-order-empty client-center-empty-card"
    >
      <n-empty description="当前暂无订单数据" size="large" />
    </div>

    <div v-else class="vendor-order-table">
      <n-spin :show="ordersLoading">
        <div
          v-if="sortedOrderList.length > 0"
          class="vendor-order-table__inner client-center-paper"
        >
          <div class="vendor-order-table__head">
            <div>处理状态</div>
            <div>类型</div>
            <div>内容/材料</div>
            <div>价格</div>
            <div>操作</div>
          </div>

          <div
            v-for="row in sortedOrderList"
            :key="row.id"
            class="vendor-order-table__row"
          >
            <div class="vendor-order-table__cell">
              <span class="vendor-order-table__label">处理状态</span>
              <n-tag
                :type="
                  isNeedHandleConstructionStatus(row.constructionStatusText)
                    ? 'success'
                    : 'info'
                "
              >
                {{
                  isNeedHandleConstructionStatus(row.constructionStatusText)
                    ? '需要处理'
                    : '等待处理'
                }}
              </n-tag>
            </div>

            <div class="vendor-order-table__cell">
              <span class="vendor-order-table__label">类型</span>
              <span>{{ row.type === 1 ? '施工单' : '材料单' }}</span>
            </div>

            <div class="vendor-order-table__cell">
              <span class="vendor-order-table__label">内容/材料</span>
              <span>
                {{
                  row.type === 1
                    ? '建筑施工'
                    : `${row.materialName} (${row.materialCategory})`
                }}
              </span>
            </div>

            <div
              class="vendor-order-table__cell vendor-order-table__cell--price"
            >
              <span class="vendor-order-table__label">价格</span>
              <span>¥{{ row.price }}</span>
            </div>

            <div
              class="vendor-order-table__cell vendor-order-table__cell--actions"
            >
              <span class="vendor-order-table__label">操作</span>
              <div class="vendor-order-table__actions">
                <n-button
                  v-if="Number(row.orderStatus) === 3"
                  size="small"
                  type="success"
                  @click="$emit('accept', row)"
                >
                  接单
                </n-button>
                <n-button
                  v-if="Number(row.orderStatus) === 3"
                  size="small"
                  type="error"
                  @click="$emit('reject', row)"
                >
                  拒单
                </n-button>
                <n-button
                  v-if="canCancelVendorOrder(row)"
                  size="small"
                  type="warning"
                  @click="$emit('cancel', row)"
                >
                  取消
                </n-button>
                <n-button
                  size="small"
                  type="primary"
                  @click="$emit('open-detail', row)"
                >
                  详情/进度
                </n-button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="vendor-order-empty client-center-empty-card">
          <n-empty description="当前暂无订单数据" size="large" />
        </div>
      </n-spin>
    </div>

    <div
      v-if="pagination.itemCount > 0"
      class="vendor-order-pagination client-center-pagination"
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
  </n-space>
</template>

<script setup>
defineProps({
  orderStatusTab: {
    type: String,
    default: '1',
  },
  unrepliedOrderCount: {
    type: Number,
    default: 0,
  },
  acceptedNeedHandleCount: {
    type: Number,
    default: 0,
  },
  ordersLoading: {
    type: Boolean,
    default: false,
  },
  orderList: {
    type: Array,
    default: () => [],
  },
  sortedOrderList: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    required: true,
  },
  isNeedHandleConstructionStatus: {
    type: Function,
    required: true,
  },
  canCancelVendorOrder: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'update:order-status-tab',
  'accept',
  'reject',
  'cancel',
  'open-detail',
  'page-change',
])
</script>

<style lang="scss" scoped>
.vendor-order-tabs {
  margin-bottom: 4px;
}

.vendor-order-tab-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 40px;
}

.vendor-order-tab-badge {
  display: inline-flex;
  align-items: center;
}

.vendor-order-tab-badge :deep(.n-badge-sup) {
  position: static;
  transform: none;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  border-radius: 999px;
}

.vendor-order-table {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.vendor-order-table__inner {
  min-width: 1180px;
  overflow: hidden;
}

.vendor-order-table__head,
.vendor-order-table__row {
  display: grid;
  grid-template-columns: 120px 120px minmax(240px, 1.2fr) 120px minmax(260px, 1fr);
  align-items: center;
}

.vendor-order-table__head {
  padding: 14px 18px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.vendor-order-table__row {
  padding: 16px 18px;
  border-top: 1px solid var(--color-border-soft);
}

.vendor-order-table__cell {
  min-width: 0;
  text-align: center;
  color: var(--color-text-primary);
}

.vendor-order-table__cell--price {
  color: #d03050;
  font-weight: 700;
}

.vendor-order-table__cell--actions {
  justify-self: stretch;
}

.vendor-order-table__label {
  display: none;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.vendor-order-table__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.vendor-order-table__actions :deep(.n-button) {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .vendor-order-table__inner {
    min-width: 0;
  }

  .vendor-order-table__head {
    display: none;
  }

  .vendor-order-table__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .vendor-order-table__cell {
    text-align: left;
  }

  .vendor-order-table__label {
    display: block;
  }

  .vendor-order-table__actions {
    justify-content: flex-start;
    flex-direction: column;
    align-items: stretch;
  }

  .vendor-order-table__actions :deep(.n-button) {
    width: 100%;
  }

  .vendor-order-tabs {
    width: 100%;
  }

  .vendor-order-tabs :deep(.n-tabs-nav),
  .vendor-order-tabs :deep(.n-tabs-nav-scroll-wrapper),
  .vendor-order-tabs :deep(.n-tabs-nav-scroll-content) {
    width: 100%;
  }

  .vendor-order-tabs :deep(.n-tabs-tab) {
    flex: 1 1 0;
    min-width: 0;
    justify-content: center;
  }
}
</style>
