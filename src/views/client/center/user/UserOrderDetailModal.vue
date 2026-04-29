<template>
  <n-modal
    :show="show"
    preset="card"
    title="订单中心"
    size="huge"
    :style="detailModalStyle"
    @update:show="$emit('update:show', $event)"
  >
    <n-spin :show="loadingDetail">
      <n-tabs
        :value="detailTab"
        type="segment"
        animated
        @update:value="$emit('update:detail-tab', $event)"
      >
        <n-tab-pane name="info" tab="订单详情">
          <div v-if="currentOrder">
            <div class="p-4 mb-4 bg-gray-50 rounded order-progress-card">
              <n-steps
                :current="getCurrentBusinessFlowStep(currentOrder)"
                :status="
                  Number(currentOrder.orderStatus) === 5 ? 'error' : 'process'
                "
              >
                <n-step
                  v-for="step in getOrderBusinessFlowSteps(currentOrder)"
                  :key="step.key"
                  :title="step.title"
                  :description="step.description"
                />
              </n-steps>
            </div>

            <n-divider title-placement="left">基础信息</n-divider>
            <n-descriptions
              bordered
              :label-placement="descriptionsLabelPlacement"
              :column="detailDescriptionsColumns"
            >
              <n-descriptions-item label="订单号">
                {{ currentOrder.orderNumber }}
              </n-descriptions-item>
              <n-descriptions-item label="当前状态">
                <n-tag :type="getStatusType(currentOrder.orderStatus)">
                  {{ formatOrderStatus(currentOrder.orderStatus) }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="产品名称">
                {{ getOrderProductName(currentOrder) }}
              </n-descriptions-item>
              <n-descriptions-item label="订单金额">
                <span class="order-amount-strong">
                  ¥{{ formatCurrencyNumber(currentOrder.totalAmount) || '待定' }}
                </span>
              </n-descriptions-item>
              <n-descriptions-item label="支付状态">
                <n-tag :type="getPaymentStatusType(currentOrderPaymentStatus)">
                  {{ formatPaymentStatus(currentOrderPaymentStatus) }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="收货人">
                {{ currentOrderContactName }}
              </n-descriptions-item>
              <n-descriptions-item label="联系电话">
                {{ currentOrderContactPhone }}
              </n-descriptions-item>
              <n-descriptions-item label="施工合同" :span="2">
                <div
                  v-if="currentOrderContractUrls.length > 0"
                  class="order-contract-actions"
                >
                  <n-button
                    v-for="(url, index) in currentOrderContractUrls"
                    :key="`${url}-${index}`"
                    tag="a"
                    :href="url"
                    target="_blank"
                    type="primary"
                    secondary
                    size="small"
                  >
                    {{
                      currentOrderContractUrls.length > 1
                        ? `查看合同 ${index + 1}`
                        : '查看合同'
                    }}
                  </n-button>
                </div>
                <span v-else>--</span>
              </n-descriptions-item>
              <n-descriptions-item label="施工地址" :span="2">
                {{ currentOrder.orderAddress }}
              </n-descriptions-item>
              <n-descriptions-item label="备注信息" :span="2">
                {{ currentOrder.customerNotes || '--' }}
              </n-descriptions-item>
            </n-descriptions>

            <n-divider title-placement="left">房屋详情</n-divider>
            <n-descriptions
              bordered
              :label-placement="descriptionsLabelPlacement"
              :column="detailDescriptionsColumns"
              size="small"
            >
              <n-descriptions-item label="房屋价格">
                ¥{{ formatCurrencyNumber(currentOrder.house?.houseMainStructure?.price) }}
              </n-descriptions-item>
              <n-descriptions-item label="建筑层数">
                {{ currentOrder.house?.houseMainStructure?.floors || 0 }} 层
              </n-descriptions-item>
              <n-descriptions-item label="户型格局" :span="2">
                <n-space>
                  <n-tag type="info" size="small">
                    {{ currentOrder.house?.houseMainStructure?.roomCount || 0 }} 室
                  </n-tag>
                  <n-tag type="info" size="small">
                    {{ currentOrder.house?.houseMainStructure?.livingRoomCount || 0 }} 厅
                  </n-tag>
                  <n-tag type="info" size="small">
                    {{ currentOrder.house?.houseMainStructure?.bathroomCount || 0 }} 卫
                  </n-tag>
                </n-space>
              </n-descriptions-item>
            </n-descriptions>

            <n-divider
              v-if="currentOrder.house?.houseOptionalProducts"
              title-placement="left"
            >
              选配详情
            </n-divider>
            <div
              v-if="currentOrder.house?.houseOptionalProducts?.length > 0"
              class="option-detail-table client-center-paper"
            >
              <div class="option-detail-table__head">
                <div>选配类别</div>
                <div>选配项目</div>
                <div>价格</div>
              </div>
              <div
                v-for="(opt, index) in currentOrder.house.houseOptionalProducts"
                :key="index"
                class="option-detail-table__row"
              >
                <div class="option-detail-table__cell">
                  <span class="option-detail-table__label">选配类别</span>
                  <span>{{ opt.categoryName || '--' }}</span>
                </div>
                <div class="option-detail-table__cell">
                  <span class="option-detail-table__label">选配项目</span>
                  <span>{{ opt.name || '--' }}</span>
                </div>
                <div class="option-detail-table__cell option-detail-table__cell--amount">
                  <span class="option-detail-table__label">价格</span>
                  <span>¥{{ formatCurrencyNumber(opt.price) }}</span>
                </div>
              </div>
            </div>

            <n-divider title-placement="left">修改选配</n-divider>
            <div
              :class="[
                'user-option-adjust-panel',
                'client-center-soft-card',
                !canAdjustUserOptions && 'user-option-adjust-panel--disabled',
              ]"
            >
              <div class="user-option-adjust-panel__hint">
                {{ userOptionAdjustmentHintText }}
              </div>
              <n-spin :show="userOptionConfigLoading">
                <n-grid cols="1 s:2" responsive="screen" :x-gap="12" :y-gap="16">
                  <n-grid-item
                    v-for="config in userOptionConfigList"
                    :key="config.key"
                  >
                    <div class="select-wrapper">
                      <span class="label">{{ config.label }}：</span>
                      <n-select
                        :value="userOptionSelectionMap[config.key]"
                        :options="config.options"
                        size="small"
                        clearable
                        filterable
                        placeholder="请选择"
                        :disabled="!canAdjustUserOptions || userOptionSubmitting"
                        @update:value="
                          $emit('update:user-option-selection', {
                            key: config.key,
                            value: $event,
                          })
                        "
                      />
                    </div>
                  </n-grid-item>
                </n-grid>
              </n-spin>
              <n-empty
                v-if="
                  !userOptionConfigLoading && userOptionConfigList.length === 0
                "
                description="暂无可调整的选配分类"
              />
              <div
                v-if="hasUserOptionSelectionChanges"
                class="user-option-adjust-panel__summary"
              >
                <div class="user-option-adjust-panel__summary-title">
                  本次变更类型：{{ userOptionChangeTypeLabel }}
                </div>
                <div class="user-option-adjust-panel__summary-text">
                  {{ userOptionChangeSummaryText }}
                </div>
              </div>
              <div
                v-if="hasUserOptionSelectionChanges"
                class="user-option-adjust-panel__actions"
              >
                <n-button @click="$emit('reset-user-option-selection-changes')">
                  撤销更改
                </n-button>
                <n-button
                  type="primary"
                  :loading="userOptionSubmitting"
                  :disabled="!canAdjustUserOptions"
                  @click="$emit('submit-user-option-selection-changes')"
                >
                  提交变更
                </n-button>
              </div>
            </div>

            <n-divider title-placement="left">选配变更记录</n-divider>
            <n-spin :show="userOptionalChangeLoading">
              <div
                v-if="visibleUserOptionalChangeRecords.length > 0"
                class="user-option-change-history"
              >
                <div
                  v-for="record in visibleUserOptionalChangeRecords"
                  :key="record.id"
                  class="user-option-change-history__item client-center-soft-card"
                >
                  <div class="user-option-change-history__header">
                    <div class="user-option-change-history__title">
                      申请 #{{ record.id }}
                    </div>
                    <n-space size="small" wrap>
                      <n-tag size="small" :bordered="false" type="info">
                        {{ record.changeTypeLabel || '--' }}
                      </n-tag>
                      <n-tag
                        size="small"
                        :bordered="false"
                        :type="getUserOptionalChangeStatusTagType(record.status)"
                      >
                        {{ record.statusLabel || record.status || '--' }}
                      </n-tag>
                    </n-space>
                  </div>

                  <div class="user-option-change-history__meta">
                    <div>申请时间：{{ formatDateTime(record.createTime) }}</div>
                    <div>订单阶段：{{ record.orderStatusSnapshotLabel || '--' }}</div>
                    <div>
                      理论差额：¥{{ formatAmount(record.theoreticalDiffAmount) }}
                    </div>
                    <div v-if="record.linkedBillTitle">
                      关联账单：{{ record.linkedBillTitle }} /
                      {{ record.linkedBillStatusLabel || '--' }}
                      <template
                        v-if="
                          record.linkedBillAmount !== null &&
                          record.linkedBillAmount !== undefined
                        "
                      >
                        / ¥{{ formatAmount(record.linkedBillAmount) }}
                      </template>
                    </div>
                    <div v-if="record.linkedRefundStatusLabel">
                      退款状态：{{ record.linkedRefundStatusLabel }}
                    </div>
                    <div v-if="record.auditRemark">
                      审核备注：{{ record.auditRemark }}
                    </div>
                  </div>

                  <div class="user-option-change-history__snapshots">
                    <div class="user-option-change-history__snapshot">
                      <span class="user-option-change-history__snapshot-label">
                        变更前
                      </span>
                      <span class="user-option-change-history__snapshot-text">
                        {{ formatOptionalChangeSnapshot(record.oldOptionsSnapshot) }}
                      </span>
                    </div>
                    <div class="user-option-change-history__snapshot">
                      <span class="user-option-change-history__snapshot-label">
                        目标选配
                      </span>
                      <span class="user-option-change-history__snapshot-text">
                        {{ formatOptionalChangeSnapshot(record.targetOptionsSnapshot) }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="
                      shouldShowOptionalChangePendingBillTag(record) ||
                      canApplyRefundForLatestOptionalChange ||
                      canCancelRefundForLatestOptionalChange ||
                      canViewRefundDetailForLatestOptionalChange ||
                      latestOptionalChangeRefundPaymentRecordMissing
                    "
                    class="user-option-change-history__actions"
                  >
                    <n-space size="small" wrap>
                      <n-tag
                        v-if="shouldShowOptionalChangePendingBillTag(record)"
                        size="small"
                        type="warning"
                        :bordered="false"
                      >
                        待支付补价已移至“账单支付”
                      </n-tag>
                      <n-tag
                        v-if="latestOptionalChangeRefundPaymentRecordMissing"
                        size="small"
                        type="default"
                        :bordered="false"
                      >
                        未找到关联选配支付流水
                      </n-tag>
                      <n-button
                        v-if="canApplyRefundForLatestOptionalChange"
                        size="small"
                        type="error"
                        ghost
                        @click="$emit('open-latest-optional-change-refund-modal')"
                      >
                        申请退款
                      </n-button>
                      <n-button
                        v-if="canCancelRefundForLatestOptionalChange"
                        size="small"
                        type="warning"
                        secondary
                        @click="$emit('cancel-latest-optional-change-refund-apply')"
                      >
                        取消退款申请
                      </n-button>
                      <n-button
                        v-if="canViewRefundDetailForLatestOptionalChange"
                        size="small"
                        type="primary"
                        secondary
                        @click="
                          $emit('open-latest-optional-change-refund-detail-modal')
                        "
                      >
                        退款详情
                      </n-button>
                    </n-space>
                  </div>
                </div>
              </div>
              <n-empty v-else description="当前订单暂无选配变更记录" />
            </n-spin>
          </div>
        </n-tab-pane>

        <n-tab-pane
          name="progress"
          tab="施工进度"
          :disabled="!currentOrder || currentOrder.orderStatus < 3"
        >
          <div v-if="constructionInfo">
            <div class="construction-progress-header">
              <div>
                <strong>当前阶段：</strong>
                <span class="construction-progress-header__node">
                  {{ constructionInfo.currentNodeName }}
                </span>
                <n-tag size="small" type="info">
                  {{ constructionInfo.currentNodeStatusText }}
                </n-tag>
              </div>
              <div class="construction-progress-header__meta">
                施工方式：{{
                  getProcessText(
                    constructionInfo.processType,
                    constructionInfo.processName,
                    currentOrder?.structureInfo?.constructionMethod,
                  )
                }}
              </div>
            </div>

            <n-grid :cols="3" :x-gap="20">
              <n-grid-item :span="1" class="construction-progress-nav">
                <n-steps
                  vertical
                  :current="getConstructionStepsCurrent(constructionInfo)"
                  size="small"
                >
                  <n-step
                    v-for="(node, index) in constructionInfo.nodeDetails"
                    :key="node.nodeId"
                    :title="node.name"
                    :status="getNodeStepStatus(index, constructionInfo.currentNodeIndex)"
                    class="construction-progress-step"
                    @click="$emit('node-click', node)"
                  >
                    <template #description>
                      <div class="construction-progress-step__meta">
                        <span class="construction-progress-step__desc">
                          {{
                            getNodeStepDescription(
                              index,
                              constructionInfo.currentNodeIndex,
                              constructionInfo,
                            )
                          }}
                        </span>
                        <div
                          v-if="node.subSteps?.length"
                          class="construction-progress-step__sub-steps"
                        >
                          <span
                            v-for="subStep in node.subSteps"
                            :key="subStep.key"
                            :class="[
                              'construction-progress-step__sub-step',
                              subStep.done &&
                                'construction-progress-step__sub-step--done',
                            ]"
                          >
                            {{ subStep.name }}
                          </span>
                        </div>
                      </div>
                    </template>
                  </n-step>
                </n-steps>
              </n-grid-item>

              <n-grid-item :span="2">
                <div v-if="currentNodeDetail">
                  <n-card
                    :title="`节点详情：${currentNodeDetail.nodeName}`"
                    size="small"
                    :bordered="false"
                  >
                    <template #header-extra>
                      <n-tag size="small" type="primary">
                        {{ currentNodeDetailStatusText }}
                      </n-tag>
                    </template>

                    <div
                      v-if="isPendingConstructionPaymentForCurrentNode"
                      class="construction-action-card construction-action-card--warning"
                    >
                      <div
                        class="construction-action-card__title construction-action-card__title--warning"
                      >
                        <n-icon class="construction-action-card__icon">
                          <CardOutline />
                        </n-icon>
                        当前阶段待支付
                      </div>
                      <div class="construction-action-card__desc">
                        <span>
                          {{
                            currentConstructionPayableBill
                              ? `当前应付金额：¥${formatAmount(currentConstructionPayableBill.amount)}，请前往“账单支付”完成付款`
                              : '当前阶段待支付账单生成后，会统一展示在“账单支付”中'
                          }}
                        </span>
                      </div>
                      <div class="construction-action-card__actions">
                        <n-button
                          type="warning"
                          @click="$emit('open-current-construction-payment')"
                        >
                          前往账单支付
                        </n-button>
                      </div>
                    </div>

                    <div
                      v-if="isPendingUserAudit"
                      class="construction-action-card construction-action-card--success"
                    >
                      <div
                        class="construction-action-card__title construction-action-card__title--success"
                      >
                        <n-icon class="construction-action-card__icon">
                          <CheckmarkCircle />
                        </n-icon>
                        该节点等待您的验收确认
                      </div>
                      <div class="construction-action-card__actions">
                        <n-button
                          type="success"
                          @click="$emit('user-audit-pass')"
                        >
                          验收通过
                        </n-button>
                        <n-button
                          type="error"
                          @click="$emit('open-audit-reject-modal')"
                        >
                          驳回整改
                        </n-button>
                      </div>
                    </div>

                    <n-scrollbar class="construction-timeline">
                      <n-timeline>
                        <n-timeline-item
                          v-for="record in currentNodeDetail.progressRecords"
                          :key="record.progressId"
                          type="info"
                          :title="record.operateTime?.replace('T', ' ')"
                        >
                          <div
                            v-if="record.description"
                            class="timeline-record-description"
                          >
                            {{ record.description }}
                          </div>
                          <div class="timeline-image-group">
                            <n-image-group>
                              <n-space>
                                <n-image
                                  v-for="img in record.imageList"
                                  :key="img.imageId"
                                  width="100"
                                  :src="resolveAssetUrl(img.imageUrl)"
                                  class="timeline-image-card"
                                />
                              </n-space>
                            </n-image-group>
                          </div>
                        </n-timeline-item>
                      </n-timeline>
                      <n-empty
                        v-if="!currentNodeDetail.progressRecords?.length"
                        description="暂无施工记录"
                      />
                    </n-scrollbar>
                  </n-card>
                </div>
                <div
                  v-else
                  class="construction-empty-state construction-empty-state--offset"
                >
                  <n-icon size="40"><DocumentTextOutline /></n-icon>
                  <p>请点击左侧节点查看详细记录</p>
                </div>
              </n-grid-item>
            </n-grid>
          </div>
          <div
            v-else
            class="construction-empty-state construction-empty-state--padded"
          >
            <n-empty description="订单尚未进入施工阶段或数据加载中" />
          </div>
        </n-tab-pane>

        <n-tab-pane name="bills" tab="账单支付" :disabled="!currentOrder">
          <n-spin :show="pendingPaymentBillsLoading">
            <div v-if="hasPendingPaymentBills" class="pending-payment-bills">
              <div class="pending-payment-bills-table client-center-paper">
                <div class="pending-payment-bills-head">
                  <div>账单标题</div>
                  <div>账单类型</div>
                  <div>应付金额</div>
                  <div>账单说明</div>
                  <div>创建时间</div>
                  <div>操作</div>
                </div>
                <div
                  v-for="row in pendingPaymentBillRows"
                  :key="row.id || row.virtualKey"
                  class="pending-payment-bills-row"
                >
                  <div class="pending-payment-bills-cell">
                    <span class="pending-payment-bills-label">账单标题</span>
                    <span>{{ getPaymentBillDisplayTitle(row) }}</span>
                  </div>
                  <div class="pending-payment-bills-cell">
                    <span class="pending-payment-bills-label">账单类型</span>
                    <n-tag
                      :type="getPaymentBillTypeTagType(row.billType)"
                      size="small"
                      :bordered="false"
                    >
                      {{ getPaymentBillTypeText(row.billType) }}
                    </n-tag>
                  </div>
                  <div class="pending-payment-bills-cell">
                    <span class="pending-payment-bills-label">应付金额</span>
                    <span>¥{{ formatAmount(row.amount) }}</span>
                  </div>
                  <div class="pending-payment-bills-cell">
                    <span class="pending-payment-bills-label">账单说明</span>
                    <span class="pending-payment-bills-text">
                      {{ row.remark || '--' }}
                    </span>
                  </div>
                  <div class="pending-payment-bills-cell">
                    <span class="pending-payment-bills-label">创建时间</span>
                    <span>{{ formatDateTime(row.createTime) }}</span>
                  </div>
                  <div
                    class="pending-payment-bills-cell pending-payment-bills-cell--actions"
                  >
                    <span class="pending-payment-bills-label">操作</span>
                    <div class="pending-payment-bills-actions">
                      <n-button
                        size="small"
                        type="primary"
                        @click="$emit('open-pending-bill-payment-modal', row)"
                      >
                        去支付
                      </n-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="construction-empty-state construction-empty-state--compact"
            >
              <n-empty description="当前订单暂无待支付账单" />
            </div>
          </n-spin>
        </n-tab-pane>

        <n-tab-pane
          name="payments"
          tab="支付记录"
          :disabled="!hasDetailPaymentRecords"
        >
          <n-spin :show="detailPaymentRecordsLoading">
            <div v-if="hasDetailPaymentRecords" class="detail-payment-records">
              <div class="detail-payment-records-table client-center-paper">
                <div class="detail-payment-records-head">
                  <div>支付流水ID</div>
                  <div>支付阶段</div>
                  <div>支付渠道</div>
                  <div>支付金额</div>
                  <div>支付时间</div>
                  <div>退款状态</div>
                  <div>交易流水号</div>
                  <div>操作</div>
                </div>
                <div
                  v-for="row in detailPaymentRecords"
                  :key="row.id"
                  class="detail-payment-records-row"
                >
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">支付流水ID</span>
                    <span>{{ row.id || '--' }}</span>
                  </div>
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">支付阶段</span>
                    <span>{{ getDetailPaymentStageText(row.paymentStage) }}</span>
                  </div>
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">支付渠道</span>
                    <n-tag
                      :type="getDetailPaymentChannelType(row.paymentChannel)"
                      size="small"
                      :bordered="false"
                    >
                      {{ getDetailPaymentChannelText(row.paymentChannel) }}
                    </n-tag>
                  </div>
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">支付金额</span>
                    <span>¥{{ formatAmount(row.amount) }}</span>
                  </div>
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">支付时间</span>
                    <span>{{ formatDateTime(row.payTime) }}</span>
                  </div>
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">退款状态</span>
                    <n-tag
                      v-if="
                        row.refundStatus !== null &&
                        row.refundStatus !== undefined
                      "
                      :type="getRefundStatusTagType(row)"
                      size="small"
                      :bordered="false"
                    >
                      {{ getRefundStatusText(row) }}
                    </n-tag>
                    <n-tag
                      v-else
                      type="default"
                      size="small"
                      :bordered="false"
                    >
                      未申请
                    </n-tag>
                  </div>
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">交易流水号</span>
                    <span class="detail-payment-records-text">
                      {{ row.transactionId || '--' }}
                    </span>
                  </div>
                  <div
                    class="detail-payment-records-cell detail-payment-records-cell--actions"
                  >
                    <span class="detail-payment-records-label">操作</span>
                    <div class="detail-payment-records-actions">
                      <n-button
                        v-if="canApplyRefundForPaymentRecordInList(row)"
                        size="small"
                        type="error"
                        ghost
                        @click="$emit('open-refund-modal', row)"
                      >
                        {{
                          [2, 5].includes(getPaymentRecordRefundStatus(row))
                            ? '重新申请'
                            : '申请退款'
                        }}
                      </n-button>
                      <n-button
                        v-if="canCancelRefundForPaymentRecordInList(row)"
                        size="small"
                        type="warning"
                        secondary
                        @click="$emit('cancel-refund-apply', row)"
                      >
                        取消退款申请
                      </n-button>
                      <n-button
                        v-if="canViewRefundDetailForPaymentRecordInList(row)"
                        size="small"
                        type="primary"
                        secondary
                        @click="$emit('open-refund-detail-modal', row)"
                      >
                        退款详情
                      </n-button>
                      <span
                        v-if="
                          !canApplyRefundForPaymentRecordInList(row) &&
                          !canCancelRefundForPaymentRecordInList(row) &&
                          !canViewRefundDetailForPaymentRecordInList(row)
                        "
                        class="detail-payment-records-empty-action"
                      >
                        --
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="construction-empty-state construction-empty-state--compact"
            >
              <n-empty description="当前订单暂无支付记录" />
            </div>
          </n-spin>
        </n-tab-pane>
      </n-tabs>
    </n-spin>

    <template #footer>
      <n-space justify="end" align="center">
        <div v-if="currentOrder" class="order-footer-panel">
          <span
            v-if="
              currentOrderPaymentStatus !== 0 &&
              !hasUploadedContract(currentOrder)
            "
            class="order-footer-hint"
          >
            <n-icon size="14" class="order-footer-hint__icon" />
            已完成首笔支付，等待平台上传合同...
          </span>

          <div
            v-if="
              canOpenBillPaymentCenter ||
              [1, 2].includes(currentOrderPaymentStatus)
            "
            class="order-footer-actions"
          >
            <n-button
              v-if="canOpenBillPaymentCenter"
              type="primary"
              class="order-footer-actions__button"
              @click="$emit('open-bill-payment-tab')"
            >
              账单支付
            </n-button>

            <div
              v-if="[1, 2].includes(currentOrderPaymentStatus)"
              class="order-footer-actions__status"
            >
              <span class="order-footer-actions__status-label">支付状态</span>
              <n-tag
                :type="getPaymentStatusType(currentOrderPaymentStatus)"
                size="medium"
                :bordered="false"
              >
                {{ formatPaymentStatus(currentOrderPaymentStatus) }}
              </n-tag>
            </div>
          </div>
        </div>
        <n-button @click="$emit('update:show', false)">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import {
  CardOutline,
  CheckmarkCircle,
  DocumentTextOutline,
} from '@/icons/ionicons'
import { getProcessText } from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'

defineProps({
  show: { type: Boolean, default: false },
  loadingDetail: { type: Boolean, default: false },
  detailTab: { type: String, default: 'info' },
  detailModalStyle: { type: Object, default: () => ({}) },
  currentOrder: { type: Object, default: null },
  descriptionsLabelPlacement: { type: String, default: 'left' },
  detailDescriptionsColumns: { type: Number, default: 2 },
  currentOrderPaymentStatus: { type: Number, default: 0 },
  currentOrderContactName: { type: String, default: '--' },
  currentOrderContactPhone: { type: String, default: '--' },
  currentOrderContractUrls: { type: Array, default: () => [] },
  userOptionConfigLoading: { type: Boolean, default: false },
  userOptionConfigList: { type: Array, default: () => [] },
  userOptionSelectionMap: { type: Object, default: () => ({}) },
  canAdjustUserOptions: { type: Boolean, default: false },
  userOptionSubmitting: { type: Boolean, default: false },
  userOptionAdjustmentHintText: { type: String, default: '' },
  hasUserOptionSelectionChanges: { type: Boolean, default: false },
  userOptionChangeTypeLabel: { type: String, default: '' },
  userOptionChangeSummaryText: { type: String, default: '' },
  userOptionalChangeLoading: { type: Boolean, default: false },
  visibleUserOptionalChangeRecords: { type: Array, default: () => [] },
  canApplyRefundForLatestOptionalChange: { type: Boolean, default: false },
  canCancelRefundForLatestOptionalChange: { type: Boolean, default: false },
  canViewRefundDetailForLatestOptionalChange: { type: Boolean, default: false },
  latestOptionalChangeRefundPaymentRecordMissing: {
    type: Boolean,
    default: false,
  },
  constructionInfo: { type: Object, default: null },
  currentNodeDetail: { type: Object, default: null },
  currentNodeDetailStatusText: { type: String, default: '--' },
  isPendingConstructionPaymentForCurrentNode: {
    type: Boolean,
    default: false,
  },
  currentConstructionPayableBill: { type: Object, default: null },
  isPendingUserAudit: { type: Boolean, default: false },
  pendingPaymentBillsLoading: { type: Boolean, default: false },
  hasPendingPaymentBills: { type: Boolean, default: false },
  pendingPaymentBillRows: { type: Array, default: () => [] },
  detailPaymentRecordsLoading: { type: Boolean, default: false },
  hasDetailPaymentRecords: { type: Boolean, default: false },
  detailPaymentRecords: { type: Array, default: () => [] },
  canOpenBillPaymentCenter: { type: Boolean, default: false },
  getCurrentBusinessFlowStep: { type: Function, required: true },
  getOrderBusinessFlowSteps: { type: Function, required: true },
  getStatusType: { type: Function, required: true },
  formatOrderStatus: { type: Function, required: true },
  getOrderProductName: { type: Function, required: true },
  formatCurrencyNumber: { type: Function, required: true },
  getPaymentStatusType: { type: Function, required: true },
  formatPaymentStatus: { type: Function, required: true },
  getUserOptionalChangeStatusTagType: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
  formatAmount: { type: Function, required: true },
  formatOptionalChangeSnapshot: { type: Function, required: true },
  shouldShowOptionalChangePendingBillTag: { type: Function, required: true },
  getConstructionStepsCurrent: { type: Function, required: true },
  getNodeStepStatus: { type: Function, required: true },
  getNodeStepDescription: { type: Function, required: true },
  getPaymentBillDisplayTitle: { type: Function, required: true },
  getPaymentBillTypeTagType: { type: Function, required: true },
  getPaymentBillTypeText: { type: Function, required: true },
  getDetailPaymentStageText: { type: Function, required: true },
  getDetailPaymentChannelType: { type: Function, required: true },
  getDetailPaymentChannelText: { type: Function, required: true },
  getRefundStatusTagType: { type: Function, required: true },
  getRefundStatusText: { type: Function, required: true },
  canApplyRefundForPaymentRecordInList: { type: Function, required: true },
  canCancelRefundForPaymentRecordInList: { type: Function, required: true },
  canViewRefundDetailForPaymentRecordInList: { type: Function, required: true },
  getPaymentRecordRefundStatus: { type: Function, required: true },
  hasUploadedContract: { type: Function, required: true },
})

defineEmits([
  'update:show',
  'update:detail-tab',
  'update:user-option-selection',
  'reset-user-option-selection-changes',
  'submit-user-option-selection-changes',
  'open-latest-optional-change-refund-modal',
  'cancel-latest-optional-change-refund-apply',
  'open-latest-optional-change-refund-detail-modal',
  'node-click',
  'open-current-construction-payment',
  'user-audit-pass',
  'open-audit-reject-modal',
  'open-pending-bill-payment-modal',
  'open-refund-modal',
  'cancel-refund-apply',
  'open-refund-detail-modal',
  'open-bill-payment-tab',
])
</script>
