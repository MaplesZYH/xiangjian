<template>
  <n-modal
    :show="show"
    preset="card"
    title="订单详情与施工进度"
    :style="orderModalStyle"
    :bordered="false"
    @update:show="$emit('update:show', $event)"
  >
    <n-spin :show="loading">
      <div v-if="currentOrderDetail">
        <n-descriptions
          bordered
          title="基础信息"
          :column="detailDescriptionsColumns"
          :label-placement="descriptionsLabelPlacement"
          size="small"
        >
          <n-descriptions-item label="订单类型">
            <n-tag :type="currentOrderDetail.type === 1 ? 'info' : 'warning'">
              {{ currentOrderDetail.type === 1 ? '施工单' : '材料单' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="订单金额">
            ¥{{ currentOrderDetail.price }}
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ formatChineseDate(currentOrderDetail.createTime) }}
          </n-descriptions-item>
          <n-descriptions-item v-if="currentOrderDetail.type === 1" label="施工方式">
            {{
              constructionStatus?.processName ||
              getProcessText(
                constructionStatus?.processType,
                constructionStatus?.processName,
              ) ||
              '暂无'
            }}
          </n-descriptions-item>
          <n-descriptions-item
            v-else-if="currentOrderDetail.type === 2"
            label="施工材料"
          >
            {{
              currentOrderDetail.materialCategory &&
              currentOrderDetail.materialName
                ? `${currentOrderDetail.materialName}（${currentOrderDetail.materialCategory}）`
                : currentOrderDetail.materialName ||
                  currentOrderDetail.materialCategory ||
                  '暂无'
            }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            {{ getOrderStatusText(currentOrderDetail.orderStatus) }}
          </n-descriptions-item>
          <n-descriptions-item label="备注">
            {{ currentOrderDetail.adminNotes || '无' }}
          </n-descriptions-item>
        </n-descriptions>

        <div
          v-if="currentOrderDetail.type === 1 && !constructionStatus"
          class="construction-waiting-state"
        >
          <n-card
            size="small"
            class="construction-waiting-card client-center-info-card"
          >
            <n-space vertical size="small" align="center">
              <n-tag type="info" size="large">等待平台处理</n-tag>
              <div class="construction-waiting-title">
                当前订单已接单，平台暂未开启施工流程
              </div>
              <div class="construction-waiting-desc">
                请等待平台完成派单确认、节点金额配置并开启施工后，再在此查看和上传施工照片。
              </div>
            </n-space>
          </n-card>
        </div>

        <div
          v-if="currentOrderDetail.type === 1"
          class="construction-flow-section"
        >
          <n-divider title-placement="left">施工全流程进度</n-divider>

          <div v-if="constructionStatus">
            <div class="service-flow-header">
              当前阶段：
              <span class="service-flow-header__node">
                {{ constructionStatus.currentNodeName }}
              </span>
              <n-tag size="small" class="service-flow-header__tag">
                {{ getFlowCurrentNodeStatusText(constructionStatus) }}
              </n-tag>
              <span class="service-flow-header__meta">
                施工方式：{{
                  getProcessText(
                    constructionStatus.processType,
                    constructionStatus.processName,
                  )
                }}
              </span>
            </div>

            <n-grid :cols="constructionGridCols" :x-gap="16" :y-gap="16">
              <n-grid-item :span="1" class="service-flow-nav">
                <n-steps
                  vertical
                  :current="getConstructionStepsCurrent(constructionStatus)"
                  size="small"
                >
                  <n-step
                    v-for="(node, index) in constructionStatus.nodeDetails"
                    :key="node.nodeId"
                    :title="node.name"
                    :description="
                      getNodeStatusDesc(
                        index,
                        constructionStatus.currentNodeIndex,
                        constructionStatus,
                      )
                    "
                    :status="
                      getNodeStatus(
                        index,
                        constructionStatus.currentNodeIndex,
                        constructionStatus,
                      )
                    "
                    class="service-flow-step"
                    @click="$emit('node-click', node)"
                  />
                </n-steps>
              </n-grid-item>

              <n-grid-item :span="isCompactViewport ? 1 : 2">
                <div v-if="currentNodeDetail">
                  <n-card :title="`节点详情：${currentNodeDetail.nodeName}`" size="small">
                    <template #header-extra>
                      <n-tag type="info" size="small">
                        {{ currentNodeStatusText }}
                      </n-tag>
                    </template>

                    <div class="service-upload-panel">
                      <n-input
                        :value="uploadNodeDescription"
                        type="textarea"
                        :rows="3"
                        maxlength="500"
                        placeholder="请输入本次施工情况描述（选填）"
                        :disabled="!canUploadCurrentNode || nodeUploadSubmitting"
                        class="service-upload-panel__input"
                        @update:value="$emit('update:upload-node-description', $event)"
                      />
                      <n-upload
                        :file-list="uploadNodeFileList"
                        :default-upload="false"
                        :show-file-list="false"
                        accept=".jpg,.jpeg,.png"
                        multiple
                        :disabled="!canUploadCurrentNode || nodeUploadSubmitting"
                        @update:file-list="$emit('update:upload-node-file-list', $event)"
                      >
                        <n-button
                          secondary
                          size="small"
                          :disabled="!canUploadCurrentNode || nodeUploadSubmitting"
                          class="service-upload-panel__trigger"
                        >
                          <template #icon>
                            <n-icon><CloudUploadOutline /></n-icon>
                          </template>
                          选择施工图片
                        </n-button>
                      </n-upload>

                      <div
                        v-if="uploadNodeFileList.length"
                        class="service-upload-panel__preview-list"
                      >
                        <div
                          v-for="file in uploadNodeFileList"
                          :key="file.id"
                          class="service-upload-panel__preview-item"
                        >
                          <div class="service-upload-panel__preview-image-wrap">
                            <n-image
                              :src="getUploadNodePreviewUrl(file)"
                              object-fit="cover"
                              class="service-upload-panel__preview-image"
                            />
                            <n-button
                              circle
                              size="tiny"
                              type="error"
                              class="service-upload-panel__preview-remove"
                              :disabled="nodeUploadSubmitting"
                              @click="$emit('remove-upload-file', file.id)"
                            >
                              <template #icon>
                                <n-icon><CloseCircle /></n-icon>
                              </template>
                            </n-button>
                          </div>
                          <div class="service-upload-panel__preview-name">
                            {{ file.name }}
                          </div>
                        </div>
                      </div>

                      <div class="service-upload-panel__actions">
                        <n-button
                          type="primary"
                          size="small"
                          :loading="nodeUploadSubmitting"
                          :disabled="!canUploadCurrentNode"
                          @click="$emit('submit-node-upload')"
                        >
                          提交并上传
                        </n-button>
                      </div>
                      <div class="service-upload-panel__tip">
                        {{ uploadNodeTipText }}
                      </div>
                    </div>

                    <n-scrollbar class="service-flow-timeline">
                      <n-timeline>
                        <n-timeline-item
                          v-for="record in currentNodeDetail.progressRecords"
                          :key="record.progressId"
                          type="success"
                          :title="record.operateTime?.replace('T', ' ')"
                        >
                          <div
                            v-if="record.description"
                            class="service-flow-record-description"
                          >
                            {{ record.description }}
                          </div>
                          <div class="service-flow-image-group">
                            <n-image-group>
                              <n-space>
                                <div
                                  v-for="img in record.imageList"
                                  :key="img.imageId"
                                  class="service-flow-image-wrap"
                                >
                                  <n-image
                                    width="100"
                                    :src="resolveAssetUrl(img.imageUrl)"
                                    class="service-flow-image"
                                  />
                                  <n-button
                                    circle
                                    type="error"
                                    size="tiny"
                                    :disabled="!canDeleteCurrentNodePhoto"
                                    class="service-flow-image-delete"
                                    @click="$emit('delete-photo', img.imageId)"
                                  >
                                    <template #icon>
                                      <n-icon><CloseCircle /></n-icon>
                                    </template>
                                  </n-button>
                                </div>
                              </n-space>
                            </n-image-group>
                          </div>
                        </n-timeline-item>
                      </n-timeline>
                      <n-empty
                        v-if="!currentNodeDetail.progressRecords?.length"
                        description="暂无上传记录"
                        class="service-flow-empty"
                      />
                    </n-scrollbar>
                  </n-card>
                </div>

                <div v-else class="service-flow-empty-state">
                  <n-empty description="请点击左侧节点查看详情与上传照片" />
                </div>
              </n-grid-item>
            </n-grid>
          </div>

          <div v-else class="construction-progress-placeholder" />
        </div>
      </div>
    </n-spin>
  </n-modal>
</template>

<script setup>
import { CloudUploadOutline, CloseCircle } from '@/icons/ionicons'
import { getProcessText } from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  orderModalStyle: {
    type: Object,
    default: () => ({}),
  },
  detailDescriptionsColumns: {
    type: Number,
    default: 2,
  },
  descriptionsLabelPlacement: {
    type: String,
    default: 'left',
  },
  currentOrderDetail: {
    type: Object,
    default: null,
  },
  constructionStatus: {
    type: Object,
    default: null,
  },
  currentNodeDetail: {
    type: Object,
    default: null,
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  constructionGridCols: {
    type: Number,
    default: 3,
  },
  currentNodeStatusText: {
    type: String,
    default: '',
  },
  canUploadCurrentNode: {
    type: Boolean,
    default: false,
  },
  nodeUploadSubmitting: {
    type: Boolean,
    default: false,
  },
  uploadNodeDescription: {
    type: String,
    default: '',
  },
  uploadNodeFileList: {
    type: Array,
    default: () => [],
  },
  uploadNodeTipText: {
    type: String,
    default: '',
  },
  canDeleteCurrentNodePhoto: {
    type: Boolean,
    default: false,
  },
  getUploadNodePreviewUrl: {
    type: Function,
    required: true,
  },
  formatChineseDate: {
    type: Function,
    required: true,
  },
  getOrderStatusText: {
    type: Function,
    required: true,
  },
  getFlowCurrentNodeStatusText: {
    type: Function,
    required: true,
  },
  getConstructionStepsCurrent: {
    type: Function,
    required: true,
  },
  getNodeStatusDesc: {
    type: Function,
    required: true,
  },
  getNodeStatus: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'update:show',
  'update:upload-node-description',
  'update:upload-node-file-list',
  'node-click',
  'submit-node-upload',
  'remove-upload-file',
  'delete-photo',
])
</script>

<style lang="scss" scoped>
.construction-waiting-state {
  padding: 8px 0 4px;
}

.construction-progress-placeholder {
  height: 4px;
}

.construction-flow-section {
  margin-top: 24px;
}

.service-flow-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.service-flow-header__node {
  color: var(--color-brand-700);
}

.service-flow-header__tag {
  margin-left: 8px;
}

.service-flow-header__meta {
  margin-left: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.service-flow-nav {
  border-right: 1px solid var(--color-border-soft);
  padding-right: 8px;
}

.service-flow-step {
  cursor: pointer;
  border-radius: 12px;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(4px);
  }

  &:hover :deep(.n-step-content) {
    background: var(--color-surface-soft);
    border-radius: 12px;
  }

  &:hover :deep(.n-step-content__title) {
    color: var(--color-brand-700);
  }
}

.service-upload-panel {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 4px;
}

.service-upload-panel__input {
  margin-bottom: 12px;
}

.service-upload-panel__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.service-upload-panel__trigger {
  white-space: nowrap;
}

.service-upload-panel__preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.service-upload-panel__preview-item {
  min-width: 0;
}

.service-upload-panel__preview-image-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  background: #fff;
}

.service-upload-panel__preview-image {
  width: 100%;
  height: 120px;
  display: block;
}

.service-upload-panel__preview-remove {
  position: absolute;
  top: 6px;
  right: 6px;
}

.service-upload-panel__preview-name {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  word-break: break-all;
}

.service-upload-panel :deep(.n-button) {
  min-height: 42px;
}

.service-upload-panel__tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 6px;
}

.service-flow-timeline {
  max-height: 400px;
}

.service-flow-record-description {
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

.service-flow-image-group {
  margin-top: 8px;
}

.service-flow-image-wrap {
  position: relative;
  display: inline-block;
}

.service-flow-image {
  border-radius: 4px;
  border: 1px solid var(--color-border-soft);
}

.service-flow-image-delete {
  position: absolute;
  top: -5px;
  right: -5px;
  z-index: 10;
}

.service-flow-empty {
  margin-top: 20px;
}

.service-flow-empty-state {
  text-align: center;
  margin-top: 50px;
  color: var(--color-text-muted);
}

.construction-waiting-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f3b63;
  text-align: center;
}

.construction-waiting-desc {
  max-width: 560px;
  line-height: 1.8;
  color: #5b6b84;
  text-align: center;
}

@media (max-width: 768px) {
  .service-flow-header__tag,
  .service-flow-header__meta {
    margin-left: 0;
    display: inline-flex;
  }

  .service-flow-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .service-flow-nav {
    border-right: none;
    border-bottom: 1px solid var(--color-border-soft);
    padding-right: 0;
    padding-bottom: 12px;
  }

  .service-upload-panel :deep(.n-button) {
    width: 100%;
  }

  .service-upload-panel__actions {
    justify-content: stretch;
  }

  .service-flow-image-group :deep(.n-space) {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 576px) {
  .construction-waiting-title {
    font-size: 15px;
  }

  .construction-waiting-desc {
    font-size: 13px;
  }
}
</style>
