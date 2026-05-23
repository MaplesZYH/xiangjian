<template>
  <div class="dispatch-panel">
    <n-spin :show="loadingConstruction">
      <n-alert v-if="!canViewConstruction" type="warning" class="inline-alert-md">
        当前账号缺少施工流程查看权限 `construction:view`，无法查看施工节点和进度详情。
      </n-alert>

      <div v-if="constructionInfo">
        <n-alert type="info" class="inline-alert-md">
          当前流程顺序：服务商上传施工照片 -> 平台审核 -> 用户审核 -> 进入待支付 -> 用户在第 5 步“支付账单”中完成支付 -> 自动进入下一节点。
        </n-alert>

        <n-alert
          v-if="constructionAdjustmentInfo.visible"
          type="warning"
          class="inline-alert-md"
        >
          因定金、选配变更或节点金额调整，节点金额合计与订单总额存在 ¥{{ constructionAdjustmentInfo.amountText }} 差异，{{ constructionAdjustmentFlowText }}
        </n-alert>

        <n-card
          v-if="shouldShowWaitUploadHighlight"
          size="small"
          :bordered="false"
          class="flow-highlight-card flow-highlight-card--upload"
        >
          <div class="flow-highlight-card__body">
            <div class="flow-highlight-card__icon">
              <n-icon size="24"><CloudUploadOutline /></n-icon>
            </div>
            <div>
              <div class="flow-highlight-card__title">
                当前节点正等待服务商上传施工照片
              </div>
              <div class="flow-highlight-card__desc">
                当前施工节点“{{ activeConstructionNode?.name || currentNodeDetail?.nodeName || '未命名节点' }}”
                已进入上传阶段，请通知服务商尽快上传现场图片和施工说明。上传完成后，平台才能继续审核。
              </div>
            </div>
          </div>
        </n-card>

        <n-card
          v-if="shouldShowWaitUserAuditHighlight"
          size="small"
          :bordered="false"
          class="flow-highlight-card flow-highlight-card--audit"
        >
          <div class="flow-highlight-card__body">
            <div class="flow-highlight-card__icon">
              <n-icon size="24"><CheckmarkCircleOutline /></n-icon>
            </div>
            <div>
              <div class="flow-highlight-card__title">
                当前节点平台已通过，正等待用户审核
              </div>
              <div class="flow-highlight-card__desc">
                当前施工节点“{{ activeConstructionNode?.name || currentNodeDetail?.nodeName || '未命名节点' }}”
                已完成平台审核，请等待用户确认当前施工内容。用户审核通过后，系统才会进入支付或下一步流程。
              </div>
            </div>
          </div>
        </n-card>

        <n-card
          v-if="shouldShowWaitBillPaymentHighlight"
          size="small"
          :bordered="false"
          class="flow-highlight-card flow-highlight-card--payment"
        >
          <div class="flow-highlight-card__body">
            <div class="flow-highlight-card__icon">
              <n-icon size="24"><DocumentAttachOutline /></n-icon>
            </div>
            <div>
              <div class="flow-highlight-card__title">
                当前节点正等待用户支付
              </div>
              <div class="flow-highlight-card__desc">
                当前施工节点“{{ activeConstructionNode?.name || currentNodeDetail?.nodeName || '未命名节点' }}”
                已审核通过，当前节点已进入待支付状态。请切换到第 5 步“支付账单”查看对应账单信息；用户支付完成后，流程会自动推进到下一节点。
              </div>
            </div>
          </div>
        </n-card>

        <div class="flow-steps">
          <n-grid cols="1 s:3" responsive="screen">
            <n-grid-item span="1 s:1" class="flow-steps__nav">
              <div class="flow-timeline">
                <button
                  v-for="(node, index) in constructionInfo.nodeDetails"
                  :key="node.nodeId"
                  type="button"
                  :class="[
                    'flow-timeline__item',
                    `flow-timeline__item--${getConstructionStepStatus(index, constructionInfo.currentNodeIndex, constructionInfo)}`,
                  ]"
                  @click="handleNodeClick(node)"
                >
                  <span class="flow-timeline__rail">
                    <span class="flow-timeline__dot" />
                  </span>
                  <span class="flow-timeline__content">
                    <span class="flow-timeline__title">{{ node.name }}</span>
                    <span class="flow-timeline__summary">
                      {{ getConstructionStepSummary(node, index, constructionInfo) }}
                    </span>
                    <div
                      v-if="node.subSteps?.length"
                      class="flow-step-sub-steps"
                    >
                      <span
                        v-for="subStep in node.subSteps"
                        :key="subStep.key"
                        :class="[
                          'flow-step-sub-steps__item',
                          subStep.done && 'flow-step-sub-steps__item--done',
                        ]"
                      >
                        {{ subStep.name }}
                      </span>
                    </div>
                  </span>
                </button>
              </div>
            </n-grid-item>

            <n-grid-item span="1 s:2" class="flow-steps__detail">
              <div v-if="currentNodeDetail">
                <n-card :title="`节点详情：${currentNodeDetail.nodeName}`" size="small">
                  <template #header-extra>
                    <n-tag type="info" size="small">
                      {{ currentNodeDetailStatusText }}
                    </n-tag>
                  </template>

                  <n-descriptions
                    bordered
                    size="small"
                    :column="2"
                    class="flow-node-detail-desc"
                  />

                  <n-scrollbar class="flow-node-timeline">
                    <n-timeline>
                      <n-timeline-item
                        v-for="record in currentNodeDetail.progressRecords"
                        :key="record.progressId"
                        type="success"
                        :title="record.operateTime?.replace('T', ' ')"
                      >
                        <div
                          v-if="record.description"
                          class="flow-node-record-description"
                        >
                          {{ record.description }}
                        </div>
                        <div class="timeline-images">
                          <n-image-group>
                            <n-space>
                              <n-image
                                v-for="img in record.imageList"
                                :key="img.imageId"
                                width="100"
                                :src="resolveAssetUrl(img.imageUrl)"
                                class="timeline-image"
                              />
                            </n-space>
                          </n-image-group>
                        </div>
                      </n-timeline-item>
                    </n-timeline>
                    <n-empty
                      v-if="!currentNodeDetail.progressRecords?.length"
                      description="暂无服务商上传记录"
                    />
                  </n-scrollbar>

                  <div v-if="isPendingAudit && canAuditConstruction" class="node-audit-actions">
                    <n-space justify="end">
                      <n-button type="error" @click="handleAuditReject">
                        <template #icon>
                          <n-icon><CloseCircleOutline /></n-icon>
                        </template>
                        驳回整改
                      </n-button>
                      <n-button type="success" @click="handleAuditPass">
                        <template #icon>
                          <n-icon><CheckmarkCircleOutline /></n-icon>
                        </template>
                        审核通过
                      </n-button>
                    </n-space>
                  </div>
                  <n-alert
                    v-else-if="isPendingAudit && !canAuditConstruction"
                    type="warning"
                    class="node-audit-permission-alert"
                  >
                    当前节点正在等待平台审核，但当前账号缺少施工审核权限 `construction:admin:audit`。
                  </n-alert>
                </n-card>
              </div>
              <div v-else class="flow-detail-empty">
                请点击左侧节点查看详细记录
              </div>
            </n-grid-item>
          </n-grid>
        </div>
      </div>

      <div v-else class="empty-flow">
        <n-empty description="请先在第 3 步“确认开工节点金额”中完成同步并开启施工" />
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  CloudUploadOutline,
  DocumentAttachOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
} from '@/icons/ionicons'
import { CONSTRUCTION_NODE_STATUS } from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'
import { resolveOptionAdjustmentInfo } from '@/utils/optionAdjustment'

const props = defineProps({
  constructionInfo: {
    type: Object,
    default: null,
  },
  loadingConstruction: {
    type: Boolean,
    default: false,
  },
  shouldShowWaitUploadHighlight: {
    type: Boolean,
    default: false,
  },
  shouldShowWaitUserAuditHighlight: {
    type: Boolean,
    default: false,
  },
  shouldShowWaitBillPaymentHighlight: {
    type: Boolean,
    default: false,
  },
  activeConstructionNode: {
    type: Object,
    default: null,
  },
  currentNodeDetail: {
    type: Object,
    default: null,
  },
  currentNodeDetailStatusText: {
    type: String,
    default: '',
  },
  isPendingAudit: {
    type: Boolean,
    default: false,
  },
  canViewConstruction: {
    type: Boolean,
    default: false,
  },
  canAuditConstruction: {
    type: Boolean,
    default: false,
  },
  handleNodeClick: {
    type: Function,
    required: true,
  },
  handleAuditReject: {
    type: Function,
    required: true,
  },
  handleAuditPass: {
    type: Function,
    required: true,
  },
})

const constructionAdjustmentInfo = computed(() =>
  resolveOptionAdjustmentInfo(props.constructionInfo?.adjustmentAmount),
)

const constructionAdjustmentFlowText = computed(() =>
  constructionAdjustmentInfo.value.type === 'charge'
    ? '差额将通过补价账单处理，请以支付账单为准。'
    : '差额已通过原路退款或未付节点抵扣处理，不影响实际支付。',
)

const isConstructionFlowCompleted = (flow) => {
  if (!flow?.nodeDetails?.length) return false

  const lastIndex = flow.nodeDetails.length - 1
  const currentIndex = Number(flow.currentNodeIndex)
  if (currentIndex !== lastIndex) return false

  return Number(flow.currentNodeStatus) === CONSTRUCTION_NODE_STATUS.FINISHED
}

const getConstructionStepsCurrent = (flow) => {
  if (!flow?.nodeDetails?.length) return 0
  return isConstructionFlowCompleted(flow)
    ? flow.nodeDetails.length
    : Number(flow.currentNodeIndex)
}

const getConstructionStepStatus = (index, currentIndex, flow) => {
  if (isConstructionFlowCompleted(flow)) return 'finish'
  if (index === Number(currentIndex)) return 'process'
  if (index < Number(currentIndex)) return 'finish'
  return 'wait'
}

const getConstructionStepSummary = (node, index, flow) => {
  if (node?.statusText) return node.statusText
  if (isConstructionFlowCompleted(flow)) return '已完成'
  if (index === Number(flow?.currentNodeIndex)) {
    return flow?.currentNodeStatusText || '进行中'
  }
  if (index < Number(flow?.currentNodeIndex)) return '已完成'
  return '待进行'
}
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

.node-audit-permission-alert {
  margin-top: 16px;
}

.empty-flow {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.flow-highlight-card {
  margin: 0 20px 20px;
}

.flow-highlight-card--upload {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%) !important;
  box-shadow: 0 10px 24px rgba(250, 173, 20, 0.18) !important;
}

.flow-highlight-card--audit {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%) !important;
  box-shadow: 0 10px 24px rgba(82, 196, 26, 0.18) !important;
}

.flow-highlight-card--payment {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.16) !important;
}

.flow-highlight-card__body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.flow-highlight-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.flow-highlight-card--upload .flow-highlight-card__icon {
  background: #fa8c16;
}

.flow-highlight-card--audit .flow-highlight-card__icon {
  background: #52c41a;
}

.flow-highlight-card--payment .flow-highlight-card__icon {
  background: #2563eb;
}

.flow-highlight-card__title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
}

.flow-highlight-card--upload .flow-highlight-card__title {
  color: #ad4e00;
}

.flow-highlight-card--audit .flow-highlight-card__title {
  color: #237804;
}

.flow-highlight-card--payment .flow-highlight-card__title {
  color: #1d4ed8;
}

.flow-highlight-card__desc {
  font-size: 14px;
  line-height: 1.8;
}

.flow-highlight-card--upload .flow-highlight-card__desc {
  color: #7c4300;
}

.flow-highlight-card--audit .flow-highlight-card__desc {
  color: #386b0b;
}

.flow-highlight-card--payment .flow-highlight-card__desc {
  color: #1e40af;
}

.flow-steps {
  padding: 0 20px;
}

.flow-steps__nav {
  border-right: 1px solid var(--color-border-soft);
  padding-right: 16px;
}

.flow-steps__detail {
  padding-left: 16px;
}

.flow-timeline {
  display: flex;
  flex-direction: column;
}

.flow-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  min-height: 58px;
  padding: 0 8px 18px 0;
  border: 0;
  background: transparent;
  color: #9a9a9a;
  text-align: left;
  cursor: pointer;

  &:last-child {
    min-height: 28px;
    padding-bottom: 0;
  }

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 18px;
    bottom: 2px;
    width: 2px;
    background: #d6d6d6;
  }

  &:hover .flow-timeline__title {
    color: var(--color-brand-700);
  }
}

.flow-timeline__rail {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-start;
  padding-top: 5px;
}

.flow-timeline__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #c2c2c2;
  background: #fff;
}

.flow-timeline__content {
  min-width: 0;
}

.flow-timeline__title,
.flow-timeline__summary {
  display: block;
}

.flow-timeline__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: inherit;
}

.flow-timeline__summary {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.45;
  color: #888;
}

.flow-timeline__item--finish,
.flow-timeline__item--process {
  color: var(--color-text-primary);
}

.flow-timeline__item--finish::after {
  background: var(--color-brand-700) !important;
}

.flow-timeline__item--finish .flow-timeline__dot,
.flow-timeline__item--process .flow-timeline__dot {
  border-color: var(--color-brand-700);
  background: var(--color-brand-700);
}

.flow-timeline__item--process .flow-timeline__title,
.flow-timeline__item--process .flow-timeline__summary {
  color: var(--color-brand-700);
}

.flow-step-sub-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.flow-step-sub-steps__item {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.flow-step-sub-steps__item--done {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.flow-node-detail-desc {
  margin-bottom: 16px;
}

.flow-node-timeline {
  max-height: 400px;
  margin-bottom: 20px;
}

.flow-node-record-description {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.timeline-images {
  margin-top: 8px;
}

.timeline-image {
  border-radius: 4px;
  border: 1px solid var(--color-border-soft);
}

.node-audit-actions {
  border-top: 1px solid var(--color-border-soft);
  padding-top: 16px;
  text-align: right;
}

.flow-detail-empty {
  text-align: center;
  margin-top: 50px;
  color: var(--color-text-muted);
}

@media (max-width: 992px) {
  .flow-steps {
    padding: 0 8px;
  }
}

@media (max-width: 768px) {
  .flow-highlight-card__body {
    flex-direction: column;
    align-items: stretch;
  }

  .flow-steps {
    padding-left: 0;
    padding-right: 0;
  }

  .flow-highlight-card {
    margin-left: 0;
    margin-right: 0;
  }

  .flow-steps__nav {
    border-right: none;
    border-bottom: 1px solid var(--color-border-soft);
    padding-right: 0;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }

  .flow-steps__detail {
    padding-left: 0;
  }

  .dispatch-panel {
    padding: 4px 2px 8px;
    max-height: calc(85vh - 180px);
  }

  .flow-node-timeline {
    max-height: 320px;
  }
}

@media (max-width: 576px) {
  .flow-highlight-card__title {
    font-size: 17px;
  }
}
</style>
