<template>
  <div class="dispatch-panel">
    <n-alert type="info" class="inline-alert-md">
      这里仅处理后端真实返回的选配变更申请。审核通过后可直接通过、生成补价账单或发起退款。
    </n-alert>

    <n-spin :show="optionalChangeLoading">
      <div
        v-if="visibleOptionalChangeRecords.length > 0"
        class="admin-optional-change-list"
      >
        <div
          v-for="record in visibleOptionalChangeRecords"
          :key="record.id"
          class="admin-optional-change-card client-center-soft-card"
        >
          <div class="admin-optional-change-card__header">
            <div class="admin-optional-change-card__title">申请 #{{ record.id }}</div>
            <n-space size="small" wrap>
              <n-tag size="small" :bordered="false" type="info">
                {{ record.changeTypeLabel || '--' }}
              </n-tag>
              <n-tag
                size="small"
                :bordered="false"
                :type="getOptionalChangeStatusTagType(record.status)"
              >
                {{ record.statusLabel || record.status || '--' }}
              </n-tag>
            </n-space>
          </div>

          <div class="admin-optional-change-card__meta">
            <div>申请时间：{{ formatDateTime(record.createTime) }}</div>
            <div>订单阶段：{{ record.orderStatusSnapshotLabel || '--' }}</div>
            <div>理论差额：¥{{ formatCurrencyAmount(record.theoreticalDiffAmount) }}</div>
            <div
              v-if="record.finalChargeAmount !== null && record.finalChargeAmount !== undefined"
            >
              最终补价：¥{{ formatCurrencyAmount(record.finalChargeAmount) }}
            </div>
            <div
              v-if="record.finalRefundAmount !== null && record.finalRefundAmount !== undefined"
            >
              最终退款：¥{{ formatCurrencyAmount(record.finalRefundAmount) }}
            </div>
            <div v-if="record.linkedBillTitle">
              关联账单：{{ record.linkedBillTitle }} / {{ record.linkedBillStatusLabel || '--' }}
              <template
                v-if="record.linkedBillAmount !== null && record.linkedBillAmount !== undefined"
              >
                / ¥{{ formatCurrencyAmount(record.linkedBillAmount) }}
              </template>
            </div>
            <div v-if="record.linkedRefundStatusLabel">
              退款状态：{{ record.linkedRefundStatusLabel }}
            </div>
            <div v-if="record.paymentRecordId">关联支付流水：#{{ record.paymentRecordId }}</div>
            <div v-if="record.auditOperator || record.auditTime">
              审核信息：{{ record.auditOperator || '--' }} / {{ formatDateTime(record.auditTime) }}
            </div>
          </div>

          <div class="admin-optional-change-card__snapshots">
            <div class="admin-optional-change-card__snapshot">
              <span class="admin-optional-change-card__snapshot-label">变更前</span>
              <span class="admin-optional-change-card__snapshot-text">
                {{ formatAdminOptionalChangeSnapshot(record.oldOptionsSnapshot) }}
              </span>
            </div>
            <div class="admin-optional-change-card__snapshot">
              <span class="admin-optional-change-card__snapshot-label">目标选配</span>
              <span class="admin-optional-change-card__snapshot-text">
                {{ formatAdminOptionalChangeSnapshot(record.targetOptionsSnapshot) }}
              </span>
            </div>
          </div>

          <div
            v-if="canAuditOptionalChange && record.status === 'PENDING'"
            class="admin-optional-change-card__actions"
          >
            <n-button size="small" type="primary" @click="openOptionalChangeAuditModal(record)">
              审核处理
            </n-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-flow">
        <n-empty description="当前订单暂无选配变更申请" />
      </div>
    </n-spin>
  </div>
</template>

<script setup>
defineProps({
  optionalChangeLoading: {
    type: Boolean,
    default: false,
  },
  visibleOptionalChangeRecords: {
    type: Array,
    default: () => [],
  },
  canAuditOptionalChange: {
    type: Boolean,
    default: false,
  },
  getOptionalChangeStatusTagType: {
    type: Function,
    required: true,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
  formatCurrencyAmount: {
    type: Function,
    required: true,
  },
  formatAdminOptionalChangeSnapshot: {
    type: Function,
    required: true,
  },
  openOptionalChangeAuditModal: {
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

.admin-optional-change-list {
  display: grid;
  gap: 16px;
  padding: 0 4px 4px;
}

.admin-optional-change-card {
  padding: 16px 18px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfa 100%);
}

.admin-optional-change-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.admin-optional-change-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.admin-optional-change-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.admin-optional-change-card__snapshots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.admin-optional-change-card__snapshot {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
}

.admin-optional-change-card__snapshot-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.admin-optional-change-card__snapshot-text {
  font-size: 13px;
  color: var(--color-text-primary);
  line-height: 1.7;
  word-break: break-word;
}

.admin-optional-change-card__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 768px) {
  .dispatch-panel {
    padding: 4px 2px 8px;
    max-height: calc(85vh - 180px);
  }

  .admin-optional-change-card {
    padding: 14px;
  }

  .admin-optional-change-card__header {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-optional-change-card__snapshots {
    grid-template-columns: 1fr;
  }
}
</style>
