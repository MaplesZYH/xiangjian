<template>
  <div class="dispatch-panel">
    <n-alert type="info" class="inline-alert-md">
      这里仅展示后端真实返回的支付数据。建房定金支付状态按订单支付状态展示，施工节点账单按后端返回的待支付账单展示。
    </n-alert>

    <div v-if="hasAdminPaymentBillRows" class="admin-payment-bills">
      <div class="admin-payment-bills-table client-center-paper">
        <div class="admin-payment-bills-head">
          <div>账单标题</div>
          <div>账单类型</div>
          <div>支付状态</div>
          <div>关联节点</div>
          <div>应付金额</div>
          <div>账单说明</div>
          <div>创建时间</div>
        </div>
        <div
          v-for="bill in adminPaymentBillRows"
          :key="bill.id"
          class="admin-payment-bills-row"
        >
          <div class="admin-payment-bills-cell">
            <span class="admin-payment-bills-label">账单标题</span>
            <span>{{ getAdminBillDisplayTitle(bill) }}</span>
          </div>
          <div class="admin-payment-bills-cell">
            <span class="admin-payment-bills-label">账单类型</span>
            <n-tag
              :type="getPaymentBillTypeTagType(bill.billType)"
              size="small"
              :bordered="false"
            >
              {{ getPaymentBillTypeText(bill.billType) }}
            </n-tag>
          </div>
          <div class="admin-payment-bills-cell">
            <span class="admin-payment-bills-label">支付状态</span>
            <n-tag
              :type="getAdminBillStatusTagType(bill)"
              size="small"
              :bordered="false"
            >
              {{ getAdminBillStatusText(bill) }}
            </n-tag>
          </div>
          <div class="admin-payment-bills-cell">
            <span class="admin-payment-bills-label">关联节点</span>
            <span>{{ getBillRelatedNodeName(bill) }}</span>
          </div>
          <div class="admin-payment-bills-cell">
            <span class="admin-payment-bills-label">应付金额</span>
            <span>
              {{
                bill.amount === null || bill.amount === undefined
                  ? '--'
                  : `¥${formatCurrencyAmount(bill.amount)}`
              }}
            </span>
          </div>
          <div class="admin-payment-bills-cell">
            <span class="admin-payment-bills-label">账单说明</span>
            <span class="admin-payment-bills-text">
              {{ bill.remark || '--' }}
            </span>
          </div>
          <div class="admin-payment-bills-cell">
            <span class="admin-payment-bills-label">创建时间</span>
            <span>{{ formatDateTime(bill.createTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-flow">
      <n-empty description="当前订单暂无支付账单" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  hasAdminPaymentBillRows: {
    type: Boolean,
    default: false,
  },
  adminPaymentBillRows: {
    type: Array,
    default: () => [],
  },
  getAdminBillDisplayTitle: {
    type: Function,
    required: true,
  },
  getPaymentBillTypeTagType: {
    type: Function,
    required: true,
  },
  getPaymentBillTypeText: {
    type: Function,
    required: true,
  },
  getAdminBillStatusTagType: {
    type: Function,
    required: true,
  },
  getAdminBillStatusText: {
    type: Function,
    required: true,
  },
  getBillRelatedNodeName: {
    type: Function,
    required: true,
  },
  formatCurrencyAmount: {
    type: Function,
    required: true,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.dispatch-panel {
  padding: 10px;
  min-height: 400px;
  max-height: calc(85vh - 220px);
  overflow-y: auto;
  overflow-x: hidden;
  margin-right: -4px;
}

.dispatch-panel::-webkit-scrollbar {
  width: 6px;
}

.dispatch-panel::-webkit-scrollbar-thumb {
  background-color: rgba(16, 102, 58, 0.35);
  border-radius: 3px;
}

.dispatch-panel::-webkit-scrollbar-track {
  background: transparent;
}

.inline-alert-md {
  margin-bottom: 16px;
}

.empty-flow {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.admin-payment-bills {
  padding: 0 20px 20px;
}

.admin-payment-bills-table {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #fff;
}

.admin-payment-bills-head,
.admin-payment-bills-row {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr 1fr 0.8fr 1.2fr 1fr 0.8fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
}

.admin-payment-bills-head {
  background: var(--color-surface-soft);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.admin-payment-bills-row {
  border-top: 1px solid var(--color-border-soft);
}

.admin-payment-bills-cell {
  min-width: 0;
  font-size: 13px;
  color: var(--color-text-primary);
}

.admin-payment-bills-label {
  display: none;
}

.admin-payment-bills-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

@media (max-width: 992px) {
  .admin-payment-bills-head,
  .admin-payment-bills-row {
    grid-template-columns: 1.2fr 0.9fr 0.9fr 0.8fr 1fr 0.9fr 0.8fr;
  }
}

@media (max-width: 768px) {
  .dispatch-panel {
    padding: 4px 2px 8px;
    max-height: calc(85vh - 180px);
  }

  .admin-payment-bills {
    padding-left: 0;
    padding-right: 0;
  }

  .admin-payment-bills-head {
    display: none;
  }

  .admin-payment-bills-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .admin-payment-bills-label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}
</style>
