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
              <n-descriptions-item
                v-if="orderAdjustmentInfo.visible"
                label="选配调整"
              >
                <span class="order-adjustment-amount">
                  {{ orderAdjustmentInfo.label }} ¥{{ orderAdjustmentInfo.amountText }}
                </span>
                <span class="order-adjustment-desc">
                  {{ orderAdjustmentInfo.suffix }}
                </span>
              </n-descriptions-item>
              <n-descriptions-item label="支付状态">
                <div class="order-payment-status-cell">
                  <n-tag
                    :type="getPaymentStatusType(currentOrderPaymentStatus)"
                    size="small"
                    :bordered="false"
                  >
                    {{ formatPaymentStatus(currentOrderPaymentStatus) }}
                  </n-tag>
                </div>
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
              v-if="currentEffectiveOptionSnapshot.length > 0"
              title-placement="left"
            >
              选配详情
            </n-divider>
            <div
              v-if="currentEffectiveOptionSnapshot.length > 0"
              class="option-detail-table client-center-paper"
            >
              <div class="option-detail-table__head">
                <div>选配类别</div>
                <div>选配项目</div>
                <div>价格</div>
              </div>
              <div
                v-for="(opt, index) in currentEffectiveOptionSnapshot"
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

            <template v-if="hasPendingUserOptionalChange">
              <n-divider title-placement="left">待生效选配</n-divider>
              <div
                v-if="pendingTargetOptionSnapshot.length > 0"
                class="option-detail-table client-center-paper option-detail-table--pending"
              >
                <div class="option-detail-table__head">
                  <div>选配类别</div>
                  <div>目标选配</div>
                  <div>价格</div>
                </div>
                <div
                  v-for="(opt, index) in pendingTargetOptionSnapshot"
                  :key="`pending-${index}`"
                  class="option-detail-table__row"
                >
                  <div class="option-detail-table__cell">
                    <span class="option-detail-table__label">选配类别</span>
                    <span>{{ opt.categoryName || '--' }}</span>
                  </div>
                  <div class="option-detail-table__cell">
                    <span class="option-detail-table__label">目标选配</span>
                    <span>{{ opt.name || '--' }}</span>
                  </div>
                  <div class="option-detail-table__cell option-detail-table__cell--amount">
                    <span class="option-detail-table__label">价格</span>
                    <span>¥{{ formatCurrencyNumber(opt.price) }}</span>
                  </div>
                </div>
              </div>
              <n-empty v-else description="待生效选配为空" />
            </template>

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
                      (record.isLatestRecord &&
                        (canCancelLatestOptionalChange ||
                          canApplyRefundForLatestOptionalChange ||
                          canCancelRefundForLatestOptionalChange ||
                          latestOptionalChangeRefundPaymentRecordMissing))
                      || record.canViewRefundDetail
                      || record.refundPaymentRecordMissing
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
                        v-if="
                          record.refundPaymentRecordMissing ||
                          (record.isLatestRecord &&
                            latestOptionalChangeRefundPaymentRecordMissing)
                        "
                        size="small"
                        type="default"
                        :bordered="false"
                      >
                        未找到关联选配支付记录
                      </n-tag>
                      <n-button
                        v-if="record.isLatestRecord && canCancelLatestOptionalChange"
                        size="small"
                        type="default"
                        secondary
                        :disabled="userOptionSubmitting"
                        @click="$emit('cancel-latest-optional-change')"
                      >
                        取消变更
                      </n-button>
                      <n-button
                        v-if="
                          record.isLatestRecord &&
                          canApplyRefundForLatestOptionalChange
                        "
                        size="small"
                        type="error"
                        ghost
                        @click="$emit('open-latest-optional-change-refund-modal')"
                      >
                        申请退款
                      </n-button>
                      <n-button
                        v-if="
                          record.isLatestRecord &&
                          canCancelRefundForLatestOptionalChange
                        "
                        size="small"
                        type="warning"
                        secondary
                        @click="$emit('cancel-latest-optional-change-refund-apply')"
                      >
                        取消退款申请
                      </n-button>
                      <n-button
                        v-if="record.canViewRefundDetail"
                        size="small"
                        type="primary"
                        secondary
                        @click="
                          $emit('open-refund-detail-modal', record.refundPaymentRecord)
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

            <n-alert
              v-if="constructionAdjustmentInfo.visible"
              type="warning"
              class="construction-adjustment-alert"
            >
              因定金、选配变更或节点金额调整，节点金额合计与订单总额存在 ¥{{ constructionAdjustmentInfo.amountText }} 差异，{{ constructionAdjustmentFlowText }}
            </n-alert>

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
                  <div>账单状态</div>
                  <div>应付金额</div>
                  <div v-if="hasPendingPaymentBillRemark">账单说明</div>
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
                    <span class="pending-payment-bills-label">账单状态</span>
                    <n-tag
                      :type="getPaymentBillStatusTagType(row.status)"
                      size="small"
                      :bordered="false"
                    >
                      {{ getPaymentBillStatusText(row.status) }}
                    </n-tag>
                  </div>
                  <div class="pending-payment-bills-cell">
                    <span class="pending-payment-bills-label">应付金额</span>
                    <span>¥{{ formatAmount(row.amount) }}</span>
                  </div>
                  <div
                    v-if="hasPendingPaymentBillRemark"
                    class="pending-payment-bills-cell pending-payment-bills-cell--remark"
                  >
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
                        v-if="canRepayBill(row)"
                        size="small"
                        type="primary"
                        @click="$emit('open-pending-bill-payment-modal', row)"
                      >
                        {{ getPendingBillActionText(row) }}
                      </n-button>
                      <n-button
                        v-if="canCancelPendingOptionChangeBill(row)"
                        size="small"
                        secondary
                        @click="$emit('cancel-pending-bill', row)"
                      >
                        取消账单
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
                  <div>支付流水码</div>
                  <div>支付阶段</div>
                  <div>支付渠道</div>
                  <div>支付金额</div>
                  <div>支付时间</div>
                  <div>交易流水号</div>
                  <div>操作</div>
                </div>
                <div
                  v-for="row in detailPaymentRecords"
                  :key="row.id"
                  class="detail-payment-records-row"
                >
                  <div class="detail-payment-records-cell">
                    <span class="detail-payment-records-label">支付流水码</span>
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
                      <span
                        v-if="!canApplyRefundForPaymentRecordInList(row)"
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

        <n-tab-pane
          name="refunds"
          tab="退款/售后记录"
          :disabled="!currentOrder"
        >
          <n-spin :show="refundRecordsLoading">
            <div v-if="hasRefundRecords" class="refund-records">
              <div class="refund-records-table client-center-paper">
                <div class="refund-records-head">
                  <div>退款单号</div>
                  <div>支付流水码</div>
                  <div>退款阶段</div>
                  <div>退款金额</div>
                  <div>退款状态</div>
                  <div>申请时间</div>
                  <div>操作</div>
                </div>
                <div
                  v-for="row in refundRecords"
                  :key="row.id || row.refundId"
                  class="refund-records-row"
                >
                  <div class="refund-records-cell">
                    <span class="refund-records-label">退款单号</span>
                    <span>{{ row.id || row.refundId || '--' }}</span>
                  </div>
                  <div class="refund-records-cell">
                    <span class="refund-records-label">支付流水码</span>
                    <span>{{ row.paymentRecordId || '--' }}</span>
                  </div>
                  <div class="refund-records-cell">
                    <span class="refund-records-label">退款阶段</span>
                    <span>{{ row.paymentStage || row.sourcePaymentStage || '--' }}</span>
                  </div>
                  <div class="refund-records-cell">
                    <span class="refund-records-label">退款金额</span>
                    <span>¥{{ formatAmount(row.refundAmount) }}</span>
                  </div>
                  <div class="refund-records-cell">
                    <span class="refund-records-label">退款状态</span>
                    <n-tag
                      :type="getRefundStatusTagType(row)"
                      size="small"
                      :bordered="false"
                    >
                      {{ getRefundStatusText(row) }}
                    </n-tag>
                  </div>
                  <div class="refund-records-cell">
                    <span class="refund-records-label">申请时间</span>
                    <span>{{ formatDateTime(row.createTime) }}</span>
                  </div>
                  <div class="refund-records-cell refund-records-cell--actions">
                    <span class="refund-records-label">操作</span>
                    <div class="refund-records-actions">
                      <n-button
                        v-if="canViewRefundRecordDetail(row)"
                        size="small"
                        type="primary"
                        secondary
                        @click="$emit('open-refund-record-detail-modal', row)"
                      >
                        退款详情
                      </n-button>
                      <n-button
                        v-if="canCancelRefundRecord(row)"
                        size="small"
                        type="warning"
                        secondary
                        @click="$emit('cancel-refund-record', row)"
                      >
                        取消退款申请
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
              <n-empty description="当前订单暂无退款/售后记录" />
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
            v-if="[1, 2].includes(currentOrderPaymentStatus)"
            class="order-footer-actions"
          >
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
import { computed } from 'vue'
import {
  CardOutline,
  CheckmarkCircle,
  DocumentTextOutline,
} from '@/icons/ionicons'
import { getProcessText } from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'
import { resolveOptionAdjustmentInfo } from '@/utils/optionAdjustment'

const props = defineProps({
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
  currentEffectiveOptionSnapshot: { type: Array, default: () => [] },
  pendingTargetOptionSnapshot: { type: Array, default: () => [] },
  hasPendingUserOptionalChange: { type: Boolean, default: false },
  canCancelLatestOptionalChange: { type: Boolean, default: false },
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
  getPaymentBillStatusTagType: { type: Function, required: true },
  getPaymentBillStatusText: { type: Function, required: true },
  canRepayBill: { type: Function, required: true },
  canCancelPendingOptionChangeBill: { type: Function, required: true },
  getPendingBillActionText: { type: Function, required: true },
  getDetailPaymentStageText: { type: Function, required: true },
  getDetailPaymentChannelType: { type: Function, required: true },
  getDetailPaymentChannelText: { type: Function, required: true },
  getRefundStatusTagType: { type: Function, required: true },
  getRefundStatusText: { type: Function, required: true },
  refundRecordsLoading: { type: Boolean, default: false },
  refundRecords: { type: Array, default: () => [] },
  hasRefundRecords: { type: Boolean, default: false },
  canCancelRefundRecord: { type: Function, required: true },
  canViewRefundRecordDetail: { type: Function, required: true },
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
  'cancel-latest-optional-change',
  'open-latest-optional-change-refund-modal',
  'cancel-latest-optional-change-refund-apply',
  'open-latest-optional-change-refund-detail-modal',
  'node-click',
  'open-current-construction-payment',
  'user-audit-pass',
  'open-audit-reject-modal',
  'open-pending-bill-payment-modal',
  'cancel-pending-bill',
  'open-refund-modal',
  'cancel-refund-apply',
  'open-refund-detail-modal',
  'open-refund-record-detail-modal',
  'cancel-refund-record',
])

const orderAdjustmentInfo = computed(() =>
  resolveOptionAdjustmentInfo(props.currentOrder?.adjustmentAmount),
)

const constructionAdjustmentInfo = computed(() =>
  resolveOptionAdjustmentInfo(props.constructionInfo?.adjustmentAmount),
)

const constructionAdjustmentFlowText = computed(() =>
  constructionAdjustmentInfo.value.type === 'charge'
    ? '差额将通过补价账单处理，请以账单支付为准。'
    : '差额已通过原路退款或未付节点抵扣处理，不影响实际支付。',
)

const hasPendingPaymentBillRemark = computed(() =>
  props.pendingPaymentBillRows.some((row) => String(row?.remark || '').trim()),
)
</script>

<style scoped>
.detail-payment-records,
.pending-payment-bills,
.refund-records {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 8px;
}

.detail-payment-records-table,
.refund-records-table {
  min-width: 1080px;
  overflow: hidden;
}

.pending-payment-bills-table {
  min-width: 1080px;
  overflow: hidden;
}

.detail-payment-records-head,
.detail-payment-records-row {
  display: grid;
  grid-template-columns:
    120px
    120px
    110px
    120px
    180px
    minmax(220px, 1fr)
    minmax(220px, 1.2fr);
  align-items: start;
}

.refund-records-head,
.refund-records-row {
  display: grid;
  grid-template-columns:
    120px
    120px
    130px
    140px
    180px
    minmax(220px, 1fr)
    minmax(220px, 1.2fr);
  column-gap: 24px;
  align-items: start;
}

.pending-payment-bills-head,
.pending-payment-bills-row {
  display: grid;
  grid-template-columns: var(
    --pending-payment-bills-columns,
    minmax(180px, 1.1fr) 140px 140px minmax(120px, 0.8fr) 180px minmax(140px, 0.8fr)
  );
  align-items: start;
}

.pending-payment-bills-table:has(.pending-payment-bills-cell--remark) {
  --pending-payment-bills-columns: minmax(180px, 1.1fr) 140px 140px minmax(120px, 0.8fr) minmax(180px, 1.2fr) 180px minmax(140px, 0.8fr);
}

.detail-payment-records-head,
.pending-payment-bills-head,
.refund-records-head {
  padding: 14px 16px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.detail-payment-records-row,
.pending-payment-bills-row,
.refund-records-row {
  padding: 14px 16px;
  border-top: 1px solid var(--color-border-soft);
}

.detail-payment-records-cell,
.pending-payment-bills-cell,
.refund-records-cell {
  min-width: 0;
  font-size: 14px;
  color: var(--color-text-primary);
}

.detail-payment-records-cell--actions,
.pending-payment-bills-cell--actions,
.refund-records-cell--actions {
  justify-self: stretch;
}

.pending-payment-bills-cell--remark {
  min-width: 0;
}

.detail-payment-records-label,
.pending-payment-bills-label,
.refund-records-label {
  display: none;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.detail-payment-records-text,
.pending-payment-bills-text {
  display: inline-block;
  min-width: 0;
  word-break: break-all;
}

.detail-payment-records-actions,
.pending-payment-bills-actions,
.refund-records-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-payment-records-empty-action {
  color: var(--color-text-muted);
}

.option-detail-table--pending {
  border: 1px solid rgba(195, 142, 44, 0.18);
  background: linear-gradient(180deg, #fffdf7 0%, #fff9ee 100%);
}

.order-adjustment-amount {
  display: block;
  font-weight: 700;
  color: #ad6800;
}

.order-adjustment-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.order-payment-status-cell {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
}

.construction-adjustment-alert {
  margin-bottom: 16px;
}

.user-option-adjust-panel {
  padding: 16px;
}

.user-option-adjust-panel__hint {
  margin-bottom: 14px;
}

.select-wrapper {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.select-wrapper .label {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.4;
  text-align: right;
  white-space: nowrap;
}

.select-wrapper :deep(.n-select) {
  min-width: 0;
}

.select-wrapper :deep(.n-base-selection-overlay__wrapper) {
  padding-right: 4px;
}

.select-wrapper :deep(.n-base-selection-label) {
  min-width: 0;
}

.select-wrapper :deep(.n-base-selection-label__render-label) {
  padding-right: 6px;
}

.user-option-change-history {
  display: grid;
  gap: 16px;
}

.user-option-change-history__item {
  padding: 0;
  overflow: hidden;
  border: 1px solid #dfe9e1;
  background: #ffffff;
}

.user-option-change-history__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(180deg, #f8fbf8 0%, #eef6f0 100%);
  border-bottom: 1px solid #dfe9e1;
}

.user-option-change-history__title {
  color: #25362b;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.user-option-change-history__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  padding: 14px 16px;
  color: #3c4061;
  font-size: 13px;
  line-height: 1.5;
}

.user-option-change-history__meta > div {
  min-width: 0;
  padding: 9px 10px;
  border-radius: 8px;
  background: #f8faf8;
  border: 1px solid #edf2ee;
  word-break: break-word;
}

.user-option-change-history__snapshots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0 16px 16px;
}

.user-option-change-history__snapshot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #dfe9e1;
  background: #fbfdfb;
}

.user-option-change-history__snapshot-label {
  width: fit-content;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(39, 110, 61, 0.1);
  color: #276e3d;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
}

.user-option-change-history__snapshot-text {
  color: #25362b;
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
}

.user-option-change-history__actions {
  padding: 12px 16px 16px;
  border-top: 1px dashed #dfe9e1;
  background: #fcfdfc;
}

@media (max-width: 768px) {
  .detail-payment-records-table,
  .pending-payment-bills-table,
  .refund-records-table {
    min-width: 0;
  }

  .detail-payment-records-head,
  .pending-payment-bills-head,
  .refund-records-head {
    display: none;
  }

  .detail-payment-records-row,
  .pending-payment-bills-row,
  .refund-records-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .pending-payment-bills-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .pending-payment-bills-cell--actions {
    grid-column: 2;
    grid-row: 1 / span 3;
    justify-self: end;
    align-self: start;
  }

  .pending-payment-bills-row
    > .pending-payment-bills-cell:not(.pending-payment-bills-cell--actions) {
    grid-column: 1;
  }

  .pending-payment-bills-cell--remark {
    grid-column: 1 / -1;
  }

  .detail-payment-records-label,
  .pending-payment-bills-label,
  .refund-records-label {
    display: block;
  }

  .detail-payment-records-actions,
  .refund-records-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .pending-payment-bills-actions {
    justify-content: flex-end;
  }

  .detail-payment-records-actions :deep(.n-button),
  .refund-records-actions :deep(.n-button) {
    width: 100%;
  }

  .user-option-adjust-panel {
    padding: 14px;
  }

  .select-wrapper {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .select-wrapper .label {
    text-align: left;
  }

  .user-option-change-history__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-option-change-history__meta,
  .user-option-change-history__snapshots {
    grid-template-columns: minmax(0, 1fr);
  }

  .user-option-change-history__actions :deep(.n-space) {
    width: 100%;
  }

  .user-option-change-history__actions :deep(.n-button) {
    width: 100%;
  }
}
</style>
