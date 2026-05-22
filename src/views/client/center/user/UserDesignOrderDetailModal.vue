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
            :href="resolveAssetUrl(file.fileUrl)"
            target="_blank"
            rel="noreferrer"
          >
            <span class="design-file-link__icon" aria-hidden="true">
              <n-icon size="34">
                <DocumentAttachOutline />
              </n-icon>
            </span>
            <span class="design-file-link__content">
              <span class="design-file-link__title">
                {{ getDesignFileLabel(file, index, '设计图') }}
              </span>
              <span class="design-file-link__meta">点击查看或下载文件</span>
            </span>
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
            :href="resolveAssetUrl(file.fileUrl)"
            target="_blank"
            rel="noreferrer"
          >
            <span class="design-file-link__icon" aria-hidden="true">
              <n-icon size="34">
                <DocumentAttachOutline />
              </n-icon>
            </span>
            <span class="design-file-link__content">
              <span class="design-file-link__title">
                {{ getDesignFileLabel(file, index, '补充文件') }}
              </span>
              <span class="design-file-link__meta">点击查看或下载文件</span>
            </span>
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
import { DocumentAttachOutline } from '@/icons/ionicons'
import { resolveAssetUrl } from '@/utils/asset'

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

<style scoped>
.design-file-list {
  display: grid;
  gap: 14px;
}

.design-file-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid #d8e7da;
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(39, 110, 61, 0.12) 0%, rgba(39, 110, 61, 0.04) 100%),
    #f8fcf8;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.design-file-link:hover {
  transform: translateY(-1px);
  border-color: #276e3d;
  box-shadow: 0 12px 28px rgba(39, 110, 61, 0.12);
}

.design-file-link__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #eef7f0 100%);
  color: #276e3d;
  box-shadow: inset 0 0 0 1px rgba(39, 110, 61, 0.08);
}

.design-file-link__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.design-file-link__title {
  color: #1f2a22;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
}

.design-file-link__meta {
  color: #5f6f62;
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .design-file-link {
    padding: 14px 16px;
    gap: 14px;
  }

  .design-file-link__icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }
}
</style>
