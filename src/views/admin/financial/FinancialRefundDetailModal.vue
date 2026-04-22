<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="退款详情"
    style="width: min(760px, calc(100vw - 24px))"
  >
    <n-spin :show="loading">
      <div v-if="detail" class="refund-detail-panel">
        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">订单号：</span>
            <span class="refund-detail-item__value">{{ detail.orderNumber || '--' }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">支付订单号：</span>
            <span class="refund-detail-item__value">{{ detail.paymentRecordId || '--' }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">用户：</span>
            <span class="refund-detail-item__value">{{ detail.userName || '--' }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">电话：</span>
            <span class="refund-detail-item__value">{{ detail.userPhone || '--' }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">退款状态：</span>
            <span class="refund-detail-item__value">
              <n-tag :type="getRefundStatusType(detail.status)">
                {{ getRefundStatusText(detail.status) }}
              </n-tag>
            </span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">支付金额：</span>
            <span class="refund-detail-item__value">¥{{ formatMoney(detail.paymentAmount) }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">退款金额：</span>
            <span class="refund-detail-item__value">¥{{ formatMoney(detail.refundAmount) }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">咨询电话：</span>
            <span class="refund-detail-item__value">
              {{ getRefundAuditOperatorPhone(detail.auditOperator) }}
            </span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">审核时间：</span>
            <span class="refund-detail-item__value">{{ formatDateTime(detail.auditTime) }}</span>
          </div>
          <div class="refund-detail-item">
            <span class="refund-detail-item__label">申请时间：</span>
            <span class="refund-detail-item__value">{{ formatDateTime(detail.createTime) }}</span>
          </div>
        </div>

        <div class="refund-detail-row">
          <div class="refund-detail-item refund-detail-item--full">
            <span class="refund-detail-item__label">更新时间：</span>
            <span class="refund-detail-item__value">{{ formatDateTime(detail.updateTime) }}</span>
          </div>
        </div>

        <div class="refund-detail-block">
          <div class="refund-detail-block__label">用户原因</div>
          <div class="refund-detail-block__value">{{ detail.reason || '--' }}</div>
        </div>

        <div class="refund-detail-block">
          <div class="refund-detail-block__label">审核备注</div>
          <div class="refund-detail-block__value">{{ detail.auditRemark || '--' }}</div>
        </div>
      </div>
    </n-spin>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  detail: {
    type: Object,
    default: null,
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
  getRefundAuditOperatorPhone: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:show'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.refund-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.refund-detail-row {
  display: flex;
  gap: 12px;
}

.refund-detail-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
}

.refund-detail-item--full {
  flex: 1 1 100%;
}

.refund-detail-item__label {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-weight: 600;
  white-space: nowrap;
}

.refund-detail-item__value {
  min-width: 0;
  color: var(--color-text-primary);
  font-weight: 500;
  word-break: break-all;
}

.refund-detail-block {
  padding: 14px 16px;
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, var(--color-surface) 0%, #f8fbf8 100%);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-xs);
}

.refund-detail-block__label {
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.refund-detail-block__value {
  color: var(--color-text-primary);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .refund-detail-row {
    flex-direction: column;
  }
}
</style>
