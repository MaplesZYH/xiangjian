<template>
  <n-modal
    :show="show"
    preset="card"
    title="设计订单详情"
    :style="detailModalStyle"
    @update:show="$emit('update:show', $event)"
  >
    <n-spin :show="loadingDesignDetail">
      <div v-if="currentDesignOrder" class="design-detail-panel">
        <n-descriptions
          bordered
          size="small"
          :column="detailDescriptionsColumns"
          :label-placement="descriptionsLabelPlacement"
        >
          <n-descriptions-item label="设计单号">
            {{ currentDesignOrder.designOrderNo || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="设计状态">
            <n-tag
              :type="getDesignOrderStatusType(currentDesignOrder.designStatus)"
              size="small"
            >
              {{ getDesignOrderStatusText(currentDesignOrder.designStatus) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="支付状态">
            <n-tag
              :type="
                getDesignOrderPaymentStatusType(currentDesignOrder.paymentStatus)
              "
              size="small"
              :bordered="false"
            >
              {{ formatDesignOrderPaymentStatus(currentDesignOrder.paymentStatus) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="设计地址">
            {{ currentDesignOrder.orderAddress || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="产品名称">
            {{ getDesignOrderMainProductNameText(currentDesignOrder) }}
          </n-descriptions-item>
          <n-descriptions-item label="设计定金">
            ¥{{ formatAmount(currentDesignOrder.depositAmount) }}
          </n-descriptions-item>
          <n-descriptions-item label="已支付金额">
            ¥{{ formatAmount(currentDesignOrder.paidAmount) }}
          </n-descriptions-item>
          <n-descriptions-item label="关联建房订单">
            {{ currentDesignOrder.buildOrderId || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ formatDateTime(currentDesignOrder.createTime) }}
          </n-descriptions-item>
        </n-descriptions>

        <n-divider title-placement="left">设计交付文件</n-divider>
        <div
          v-if="currentDesignOrder.deliveryFiles?.length"
          class="design-file-list"
        >
          <a
            v-for="(file, index) in currentDesignOrder.deliveryFiles"
            :key="`delivery-${file.fileUrl || index}`"
            class="design-file-link"
            :href="file.fileUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{ getDesignFileLabel(file, index, '设计图') }}
          </a>
        </div>
        <n-empty v-else description="暂未上传设计交付文件" />

        <n-divider title-placement="left">补充反馈文件</n-divider>
        <div
          v-if="currentDesignOrder.finalFeedbackFiles?.length"
          class="design-file-list"
        >
          <a
            v-for="(file, index) in currentDesignOrder.finalFeedbackFiles"
            :key="`feedback-${file.fileUrl || index}`"
            class="design-file-link"
            :href="file.fileUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{ getDesignFileLabel(file, index, '补充文件') }}
          </a>
        </div>
        <n-empty v-else description="暂无补充反馈文件" />
      </div>
    </n-spin>

    <template #footer>
      <n-space justify="end">
        <n-button
          v-if="canRepayDesignOrder(currentDesignOrder)"
          type="warning"
          @click="$emit('open-payment-modal')"
        >
          继续支付
        </n-button>
        <n-button
          v-if="canMarkDesignOrderNoBuild(currentDesignOrder)"
          :loading="designDecisionSubmitting"
          @click="$emit('mark-no-build')"
        >
          暂不建造
        </n-button>
        <n-button
          v-if="canContinueBuildDesignOrder(currentDesignOrder)"
          type="primary"
          :loading="designDecisionSubmitting"
          @click="$emit('continue-build')"
        >
          继续建房
        </n-button>
        <n-button @click="$emit('update:show', false)">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  loadingDesignDetail: { type: Boolean, default: false },
  currentDesignOrder: { type: Object, default: null },
  detailModalStyle: { type: Object, default: () => ({}) },
  detailDescriptionsColumns: { type: Number, default: 2 },
  descriptionsLabelPlacement: { type: String, default: 'left' },
  designDecisionSubmitting: { type: Boolean, default: false },
  getDesignOrderStatusType: { type: Function, required: true },
  getDesignOrderStatusText: { type: Function, required: true },
  getDesignOrderPaymentStatusType: { type: Function, required: true },
  formatDesignOrderPaymentStatus: { type: Function, required: true },
  getDesignOrderMainProductNameText: { type: Function, required: true },
  formatAmount: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
  getDesignFileLabel: { type: Function, required: true },
  canRepayDesignOrder: { type: Function, required: true },
  canMarkDesignOrderNoBuild: { type: Function, required: true },
  canContinueBuildDesignOrder: { type: Function, required: true },
})

defineEmits([
  'update:show',
  'open-payment-modal',
  'mark-no-build',
  'continue-build',
])
</script>
