<template>
  <n-modal
    :show="show"
    preset="card"
    title="退款详情"
    :style="refundDetailModalStyle"
    @update:show="handleShowUpdate"
  >
    <n-spin :show="loadingRefundDetail">
      <n-descriptions
        v-if="refundDetail"
        bordered
        size="small"
        :column="detailDescriptionsColumns"
        :label-placement="descriptionsLabelPlacement"
      >
        <n-descriptions-item label="订单号">
          {{ refundDetail.orderNumber || '--' }}
        </n-descriptions-item>
        <n-descriptions-item label="支付订单号">
          {{ refundDetail.paymentRecordId || '--' }}
        </n-descriptions-item>
        <n-descriptions-item label="退款状态">
          <n-tag :type="getRefundStatusTagType(refundDetail)">
            {{ getRefundStatusText(refundDetail) }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="支付金额">
          ¥{{ formatAmount(refundDetail.paymentAmount) }}
        </n-descriptions-item>
        <n-descriptions-item label="退款金额">
          ¥{{ formatAmount(refundDetail.refundAmount) }}
        </n-descriptions-item>
        <n-descriptions-item label="用户原因" :span="2">
          {{ refundDetail.reason || '--' }}
        </n-descriptions-item>
        <n-descriptions-item label="审核备注" :span="2">
          {{ refundDetail.auditRemark || '--' }}
        </n-descriptions-item>
        <n-descriptions-item label="咨询电话">
          {{ getRefundAuditOperatorPhone(refundDetail.auditOperator) }}
        </n-descriptions-item>
        <n-descriptions-item label="审核时间">
          {{ formatDateTime(refundDetail.auditTime) }}
        </n-descriptions-item>
        <n-descriptions-item label="申请时间">
          {{ formatDateTime(refundDetail.createTime) }}
        </n-descriptions-item>
        <n-descriptions-item label="更新时间">
          {{ formatDateTime(refundDetail.updateTime) }}
        </n-descriptions-item>
      </n-descriptions>
    </n-spin>
  </n-modal>
</template>

<script setup>
const emit = defineEmits(['close'])

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  refundDetailModalStyle: {
    type: Object,
    default: () => ({}),
  },
  loadingRefundDetail: {
    type: Boolean,
    default: false,
  },
  refundDetail: {
    type: Object,
    default: null,
  },
  detailDescriptionsColumns: {
    type: Number,
    default: 2,
  },
  descriptionsLabelPlacement: {
    type: String,
    default: 'left',
  },
  getRefundStatusTagType: {
    type: Function,
    default: () => 'default',
  },
  getRefundStatusText: {
    type: Function,
    default: () => '--',
  },
  formatAmount: {
    type: Function,
    default: (value) => value,
  },
  getRefundAuditOperatorPhone: {
    type: Function,
    default: () => '--',
  },
  formatDateTime: {
    type: Function,
    default: (value) => value,
  },
})

const handleShowUpdate = (value) => {
  if (!value) {
    emit('close')
  }
}
</script>
