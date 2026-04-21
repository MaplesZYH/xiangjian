<template>
  <div class="page-container">
    <div class="filter-container">
      <div class="filter-row">
        <div class="filter-item filter-item-keyword">
          <n-input
            v-model:value="filters.keyword"
            placeholder="请输入订单号/姓名/手机号"
            clearable
            @keydown.enter="handleSearch"
          >
          </n-input>
        </div>
        <div class="filter-item filter-item-select">
          <n-select
            v-model:value="filters.orderStatus"
            placeholder="订单状态 (全部)"
            :options="orderStatusOptions"
            clearable
            @update:value="handleSearch"
          />
        </div>
        <div class="filter-item filter-item-select">
          <n-select
            v-model:value="filters.paymentStatus"
            placeholder="支付状态 (全部)"
            :options="paymentStatusOptions"
            clearable
            @update:value="handleSearch"
          />
        </div>
        <div class="filter-item filter-item-action">
          <n-button type="primary" @click="handleSearch"> 查询 </n-button>
        </div>
      </div>
    </div>

    <div class="todo-overview">
      <button
        v-for="card in todoCards"
        :key="card.key"
        type="button"
        class="todo-filter-tag"
        :class="{
          'is-active': activeTodoFilter === card.key,
        }"
        @click="activeTodoFilter = card.key"
      >
        <span class="todo-filter-tag__text">{{ card.label }}</span>
        <span v-if="card.key === 'all'" class="todo-filter-tag__count">
          {{ card.count }}
        </span>
        <span
          v-else-if="card.count > 0"
          class="todo-filter-tag__badge"
        >
          {{ formatTodoBadgeCount(card.count) }}
        </span>
      </button>
    </div>

    <div class="todo-toolbar">
      <div class="todo-toolbar__summary">
        <span class="todo-toolbar__label">当前消息视图</span>
        <n-tag
          size="small"
          :type="activeTodoFilter === 'all' ? 'default' : 'info'"
          :bordered="false"
        >
          {{ activeTodoFilterLabel }}
        </n-tag>
      </div>
      <n-button
        v-if="activeTodoFilter !== 'all'"
        text
        type="primary"
        @click="activeTodoFilter = 'all'"
      >
        查看全部订单
      </n-button>
    </div>

    <div class="order-list admin-shell-list">
      <div class="list-header">
        <div class="header-item">订单号</div>
        <div class="header-item">姓名</div>
        <div class="header-item">手机号</div>
        <div class="header-item">订单状态</div>
        <div class="header-item">支付状态</div>
        <div class="header-item actions-header">操作</div>
      </div>

      <n-spin :show="loadingList">
        <div v-if="visibleOrderList.length > 0">
          <div v-for="item in visibleOrderList" :key="item.id" class="list-row">
            <div class="list-item">{{ item.orderNumber }}</div>
            <div class="list-item">{{ item.userName }}</div>
            <div class="list-item">{{ item.userPhone }}</div>
            <div class="list-item">
              <n-tag :type="getStatusType(item.orderStatus)">
                {{ getStatusText(item.orderStatus) }}
              </n-tag>
            </div>
            <div class="list-item">
              <n-tag :type="getPaymentType(item.paymentStatus)">
                {{ getPaymentText(item.paymentStatus) }}
              </n-tag>
            </div>
            <div class="list-item actions">
              <n-button
                type="info"
                size="small"
                @click="handleOpenUnifiedDetail(item)"
              >
                详情/编辑
              </n-button>

              <n-button
                type="primary"
                size="small"
                @click="handleOpenDispatch(item)"
                :disabled="!canOpenDispatchEntry(item)"
              >
                处理/派单
              </n-button>

              <Delete
                :itemId="item.id"
                @delete="handleUserOrderDelete"
                confirmText="确定删除该订单吗？"
              />
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <n-empty :description="emptyOrderListDescription" />
        </div>
      </n-spin>
    </div>

    <div class="pagination-container">
      <n-pagination
        v-model:page="pageInfo.page"
        :page-count="pageInfo.pageCount"
        :page-size="pageInfo.pageSize"
        :page-slot="3"
        size="large"
        show-quick-jumper
        @update:page="handlePageChange"
      />
    </div>

    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      title="订单基础详情"
      size="huge"
      :style="{ width: 'min(900px, calc(100vw - 24px))' }"
    >
      <n-spin v-if="loadingDetail" size="large" />
      <div v-else-if="detailOrder">
        <div class="info-header">
          <div><strong>订单号：</strong>{{ detailOrder.orderNumber }}</div>
          <div class="status-row">
            <n-tag size="small" :type="getStatusType(detailOrder.orderStatus)">{{
              getStatusText(detailOrder.orderStatus)
            }}</n-tag>
            <n-tag
              size="small"
              :type="getPaymentType(detailOrder.paymentStatus)"
            >
              {{ getPaymentText(detailOrder.paymentStatus) }}
            </n-tag>
          </div>
        </div>

        <n-alert v-if="isReadOnly" type="warning" class="inline-alert-sm">
          当前订单状态为“{{
            getStatusText(detailOrder.orderStatus)
          }}”，当前仅支持查看，不可再修改基础信息和选配。
        </n-alert>
        <n-alert
          v-else-if="isAddressLocked"
          type="warning"
          class="inline-alert-sm"
        >
          合同已上传，订单地址无法再修改，但选配产品仍可继续调整。
        </n-alert>

        <n-divider dashed />

        <n-form label-placement="left" label-width="90">
          <n-form-item label="订单地址">
            <n-space vertical class="full-width">
              <div class="order-address-editor">
                <n-cascader
                  v-model:value="selectedOrderRegionCode"
                  :options="orderRegionCascaderOptions"
                  check-strategy="child"
                  filterable
                  clearable
                  :disabled="isReadOnly || isAddressLocked"
                  placeholder="请选择省 / 市 / 区"
                  @update:value="handleOrderRegionUpdate"
                />
                <n-input
                  v-model:value="orderAddressForm.detail"
                  type="textarea"
                  :rows="2"
                  maxlength="120"
                  show-count
                  :disabled="isReadOnly || isAddressLocked"
                  placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
                />
              </div>
            </n-space>
          </n-form-item>
          <n-form-item label="地址预览">
            <div class="address-preview">
              {{
                orderAddressPreview ||
                '请先选择施工行政区并填写详细门牌地址'
              }}
            </div>
          </n-form-item>
          <n-form-item label="客户备注">
            <n-input
              v-model:value="detailOrder.customerNotes"
              type="textarea"
              :rows="2"
              :disabled="isReadOnly"
              placeholder="客户备注信息"
            />
          </n-form-item>
        </n-form>

        <n-divider title-placement="left">选配产品 (修改配置)</n-divider>

        <n-spin :show="loadingMetadata">
            <n-grid cols="2 s:3" responsive="screen" :x-gap="12" :y-gap="16">
              <n-grid-item
              v-for="config in dynamicConfigList"
              :key="config.key"
            >
              <div class="select-wrapper">
                <span class="label">{{ config.label }}：</span>
                <n-select
                  v-model:value="selectionMap[config.key]"
                  :options="config.options"
                  :disabled="isReadOnly"
                  size="small"
                  clearable
                  filterable
                  placeholder="请选择"
                />
              </div>
            </n-grid-item>
          </n-grid>
        </n-spin>

        <div class="house-info-section" v-if="detailOrder.structureInfo">
          <n-divider title-placement="left">房屋基础信息</n-divider>
          <n-descriptions
            bordered
            label-placement="left"
            size="small"
            :column="2"
          >
            <n-descriptions-item label="产品名称">
              <span class="accent-text-strong">{{
                detailOrder.structureInfo.name
              }}</span>
            </n-descriptions-item>
            <n-descriptions-item label="参考价格">
              {{ detailOrder.structureInfo.price }} 万
            </n-descriptions-item>
            <n-descriptions-item label="建筑风格">
              {{ getStyleLabel(detailOrder.structureInfo.style) }}
            </n-descriptions-item>
            <n-descriptions-item label="施工方式">
              {{ detailOrder.structureInfo.constructionMethod }}
            </n-descriptions-item>
            <n-descriptions-item label="户型布局" :span="2">
              <n-tag type="info" size="small" class="tag-gap-right">
                {{ detailOrder.structureInfo.roomCount }} 室
              </n-tag>
              <n-tag type="info" size="small" class="tag-gap-right">
                {{ detailOrder.structureInfo.livingRoomCount }} 厅
              </n-tag>
              <n-tag type="info" size="small">
                {{ detailOrder.structureInfo.bathroomCount }} 卫
              </n-tag>
            </n-descriptions-item>
          </n-descriptions>
        </div>

        <n-divider />
        <div class="modal-footer-actions" v-if="!isReadOnly">
          <n-button
            type="primary"
            @click="handleUpdateOrder"
            :loading="submitting"
            >保存基础信息修改</n-button
          >
        </div>
      </div>
    </n-modal>

    <n-modal
      v-model:show="showDispatchModal"
      preset="card"
      title="订单处理流程"
      size="huge"
      :style="{ width: 'min(1000px, calc(100vw - 20px))', height: '85vh' }"
      :bordered="false"
    >
      <n-spin :show="dispatchLoading">
        <n-tabs type="segment" animated v-model:value="dispatchTab">
          <n-tab-pane name="contract" tab="1. 合同管理">
            <div class="dispatch-panel">
              <n-alert type="info" class="inline-alert-lg">
                当前流程为：平台上传合同后即可进入派单；支付状态用于财务跟进，但不再作为合同上传或派单的前置条件。重新上传将覆盖原有合同。
              </n-alert>
              <n-alert
                v-if="!currentContractUrl"
                type="warning"
                class="inline-alert-md"
              >
                请先上传合同，上传完成后即可进入派单。
              </n-alert>
              <n-alert
                v-else
                type="success"
                class="inline-alert-md"
              >
                合同已上传，可继续派单。当前支付状态：{{
                  getPaymentText(detailOrder?.paymentStatus)
                }}
              </n-alert>

              <div class="contract-section">
                <div v-if="currentContractUrl" class="preview-area">
                  <div class="preview-title">当前生效合同：</div>
                  <div class="preview-content">
                    <div
                      v-if="isImage(currentContractUrl)"
                      class="image-preview"
                    >
                      <n-image
                        width="200"
                        :src="currentContractUrl"
                        :preview-src="currentContractUrl"
                        object-fit="contain"
                        class="contract-preview-image"
                      />
                    </div>
                    <div v-else class="file-link-card">
                      <n-icon size="40" color="#2080f0">
                        <DocumentAttachOutline />
                      </n-icon>
                      <div class="contract-link-actions">
                        <n-button
                          tag="a"
                          :href="currentContractUrl"
                          target="_blank"
                          type="primary"
                          text
                        >
                          下载/查看合同
                        </n-button>
                      </div>
                    </div>
                  </div>

                  <n-divider />

                  <div class="center-text">
                    <n-upload
                      :custom-request="handleUploadContract"
                      :show-file-list="false"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    >
                      <n-button type="warning" size="medium">
                        <template #icon>
                          <n-icon><CloudUploadOutline /></n-icon>
                        </template>
                        修改/重新上传合同
                      </n-button>
                    </n-upload>
                  </div>
                </div>

                <div v-else class="upload-area">
                  <n-upload
                    :custom-request="handleUploadContract"
                    :show-file-list="false"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  >
                    <n-upload-dragger>
                      <div class="upload-dragger-icon">
                        <n-icon size="48" :depth="3">
                          <CloudUploadOutline />
                        </n-icon>
                      </div>
                      <n-text class="upload-dragger-text">
                        点击或拖拽上传合同文件 (JPG/PDF/Word)
                      </n-text>
                    </n-upload-dragger>
                  </n-upload>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="dispatch"
            tab="2. 派单管理"
            :disabled="!canDispatch"
          >
            <div class="dispatch-panel">
              <n-alert
                v-if="!canDispatch"
                type="warning"
                class="inline-alert-lg"
              >
                需先上传合同后才能派单。
              </n-alert>

              <n-alert
                v-else-if="isDispatchStageLocked"
                type="info"
                class="inline-alert-md"
              >
                当前订单已进入施工阶段。施工单位派单按现有流程继续执行，材料选配仍可根据增项、同类改项结果继续取消旧单、重新派单或补派。
              </n-alert>

              <n-alert v-else type="info" class="inline-alert-md">
                合同已上传，系统将自动推荐距离最近的可派单服务商。后台仍可通过“详情/编辑”继续追加选配；如是用户提交的选配变更，请在“选配变更”中审核处理。
                <span
                  v-if="allServicesAccepted"
                  class="dispatch-alert-accent"
                >
                  所有服务商已接单，可直接开启施工流程。
                </span>
              </n-alert>

              <n-divider title-placement="left">施工服务商指派</n-divider>
              <div class="section-block">
                <div v-if="activeConstructionOrder" class="status-card">
                  <n-descriptions
                    bordered
                    size="small"
                    label-placement="left"
                    :column="2"
                  >
                    <n-descriptions-item label="服务商">
                      {{
                        activeConstructionOrder.companyName ||
                        `ID:${activeConstructionOrder.vendorOrderId}`
                      }}
                    </n-descriptions-item>
                    <n-descriptions-item label="状态">
                      <div class="status-with-reason">
                        <n-tag
                          :type="
                            getVendorStatusInfo(
                              activeConstructionOrder.orderStatus,
                            ).type
                          "
                          size="small"
                        >
                          {{
                            getVendorStatusInfo(
                              activeConstructionOrder.orderStatus,
                            ).text
                          }}
                        </n-tag>
                        <n-button
                          v-if="hasVendorRejectReason(activeConstructionOrder)"
                          size="tiny"
                          tertiary
                          type="warning"
                          class="vendor-reason-btn"
                          @click="
                            () =>
                              showVendorReasonDialog(
                                activeConstructionOrder.vendorNotes,
                              )
                          "
                        >
                          查看拒绝理由
                        </n-button>
                      </div>
                    </n-descriptions-item>
                    <n-descriptions-item
                      v-if="hasVendorRejectReason(activeConstructionOrder)"
                      label="拒单原因"
                    >
                      <span class="status-reason">
                        {{
                          getVendorRejectReason(activeConstructionOrder) ||
                          '服务商未填写理由'
                        }}
                      </span>
                    </n-descriptions-item>
                    <n-descriptions-item label="成交价格">
                      ¥{{ activeConstructionOrder.price }}
                    </n-descriptions-item>
                    <n-descriptions-item label="备注">
                      {{ activeConstructionOrder.adminNotes || '-' }}
                    </n-descriptions-item>
                  </n-descriptions>

                  <div class="dispatch-card-actions">
                    <n-button
                      v-if="
                        !isDispatchStageLocked &&
                        activeConstructionOrder.orderStatus === 0
                      "
                      type="warning"
                      size="small"
                      @click="
                        handleReDispatch(activeConstructionOrder.vendorOrderId)
                      "
                    >
                      重新派单
                    </n-button>

                    <n-button
                      v-if="
                        !isDispatchStageLocked &&
                        [1, 3].includes(activeConstructionOrder.orderStatus)
                      "
                      type="error"
                      size="small"
                      @click="
                        handlePreCancel(activeConstructionOrder.vendorOrderId)
                      "
                    >
                      取消该派单
                    </n-button>
                  </div>
                </div>

                <n-alert
                  v-else-if="isDispatchStageLocked"
                  type="warning"
                  class="inline-alert-md"
                >
                  当前订单已进入施工阶段，施工单位派单信息已锁定。
                </n-alert>

                <div v-else-if="canDispatch">
                  <n-card
                    size="small"
                    :bordered="true"
                    title="指派施工单位"
                    embedded
                  >
                    <n-space align="center">
                      <div class="dispatch-vendor-select">
                        <n-select
                          v-model:value="constructionForm.vendorId"
                          :options="constructionVendorOptions"
                          placeholder="选择推荐的施工公司"
                          filterable
                          clearable
                          size="small"
                          :loading="loadingVendorOpts"
                          @focus="loadBuilders"
                        />
                      </div>
                      <n-input-number
                        v-model:value="constructionForm.price"
                        placeholder="协商价格"
                        size="small"
                        class="dispatch-price-input"
                        :min="0"
                      >
                        <template #prefix>¥</template>
                      </n-input-number>
                      <n-input
                        v-model:value="constructionForm.adminNotes"
                        placeholder="派单备注"
                        size="small"
                        class="dispatch-note-input"
                      />
                      <n-button
                        type="primary"
                        size="small"
                        @click="submitConstructionDispatch"
                        :disabled="!constructionForm.vendorId"
                      >
                        确认派单
                      </n-button>
                    </n-space>
                  </n-card>
                </div>
              </div>

              <n-divider title-placement="left">材料供应商指派</n-divider>
              <div class="section-block">
                <n-data-table
                  :columns="materialColumns"
                  :data="materialDispatchList"
                  :bordered="true"
                  :pagination="false"
                  size="small"
                />
              </div>

              <div class="pricing-entry-wrap">
                <div class="pricing-entry-actions">
                  <n-button
                  v-if="!isReadOnly"
                  secondary
                  size="large"
                  @click="handleOpenUnifiedDetail(detailOrder)"
                >
                  追加选配/基础信息
                </n-button>
                  <n-button
                    v-if="shouldShowConstructionPricingButton"
                    type="success"
                    size="large"
                    :disabled="!canOpenConstructionPricingEntry"
                    @click="handleGoToConstructionPricing"
                  >
                    <template #icon>
                      <n-icon><HammerOutline /></n-icon>
                    </template>
                    {{ constructionPricingButtonText }}
                  </n-button>
                </div>
                <div
                  v-if="
                    shouldShowConstructionPricingButton &&
                    !canOpenConstructionPricingEntry
                  "
                  class="pricing-entry-hint"
                >
                  {{
                    !canDispatch
                      ? '请先完成合同上传后，再进入“确认开工金额方案”。'
                      : '当前订单暂不可进入金额方案确认环节'
                  }}
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="pricing"
            tab="3. 确认开工金额方案"
            :disabled="!detailOrder?.id"
          >
            <div class="dispatch-panel">
              <ConstructionPricingPanel
                :order-number="detailOrder?.orderNumber || ''"
                :process-text="constructionPricingProcessText"
                :total-amount="Number(detailOrder?.totalAmount || 0)"
                :construction-base-amount="constructionBaseAmount"
                :deposit-amount="depositDraftAmount"
                :stage-rows="constructionPricingStageRows"
                :price-plan-status-text="constructionPricePlanStatusText"
                :price-plan-hint="constructionPricePlanHint"
                :workflow-started="constructionWorkflowStarted"
                :can-edit-deposit="
                  canConfigureConstructionPrice && canEditConstructionDeposit
                "
                :can-confirm-plan="canStartConstructionEntry"
                :can-sync-plan="canSyncConstructionPricePlan"
                :deposit-saving="depositSubmitting"
                :plan-submitting="planSubmitting"
                @update-deposit-draft="handleUpdateConstructionDepositDraft"
                @save-deposit="handleSaveConstructionDeposit"
                @confirm-plan="handleConfirmConstructionPricing"
                @sync-plan="handleSyncConstructionPricePlan"
              />
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="flow"
            tab="4. 施工流程"
            :disabled="!constructionInfo"
          >
            <div class="dispatch-panel">
              <n-spin :show="loadingConstruction">
                <div v-if="constructionInfo">
                  <n-alert type="info" class="inline-alert-md">
                    当前流程顺序：服务商上传施工照片 -> 平台审核 -> 用户审核 -> 进入待支付 -> 用户在第 5 步“支付账单”中完成支付 -> 自动进入下一节点。
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
                          已审核通过，当前节点已进入待支付状态。请切换到第 5 步“支付账单”查看后端返回的账单信息；用户支付完成后，流程会自动推进到下一节点。
                        </div>
                      </div>
                    </div>
                  </n-card>

                  <div class="flow-steps">
                    <n-grid cols="1 s:3" responsive="screen">
                      <n-grid-item span="1 s:1" class="flow-steps__nav">
                        <n-steps
                          vertical
                          :current="getConstructionStepsCurrent(constructionInfo)"
                        >
                          <n-step
                            v-for="(
                              node, index
                            ) in constructionInfo.nodeDetails"
                            :key="node.nodeId"
                            :title="node.name"
                            :status="
                              getConstructionStepStatus(
                                index,
                                constructionInfo.currentNodeIndex,
                                constructionInfo,
                              )
                            "
                            class="flow-steps__step"
                            @click="handleNodeClick(node)"
                          >
                            <template #description>
                              <div class="flow-step-summary">
                                <div
                                  v-if="
                                    isConstructionFlowCompleted(constructionInfo)
                                  "
                                >
                                  已完成
                                </div>
                                <div
                                  v-else-if="
                                    index === constructionInfo.currentNodeIndex
                                  "
                                  class="flow-step-summary__current"
                                >
                                  {{ constructionInfo.currentNodeStatusText }}
                                </div>
                                <div
                                  v-else-if="
                                    index < constructionInfo.currentNodeIndex
                                  "
                                >
                                  已完成
                                </div>
                                <div v-else>待进行</div>
                              </div>
                            </template>
                          </n-step>
                        </n-steps>
                      </n-grid-item>

                      <n-grid-item span="1 s:2" class="flow-steps__detail">
                        <div v-if="currentNodeDetail">
                          <n-card
                            :title="`节点详情：${currentNodeDetail.nodeName}`"
                            size="small"
                          >
                            <template #header-extra>
                              <n-tag type="info" size="small">{{
                                currentNodeDetailStatusText
                              }}</n-tag>
                            </template>

                            <n-descriptions
                              bordered
                              size="small"
                              :column="2"
                              class="flow-node-detail-desc"
                            />

                            <n-scrollbar
                              class="flow-node-timeline"
                            >
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
                                v-if="
                                  !currentNodeDetail.progressRecords?.length
                                "
                                description="暂无服务商上传记录"
                              />
                            </n-scrollbar>

                            <div
                              v-if="isPendingAudit"
                              class="node-audit-actions"
                            >
                              <n-space justify="end">
                                <n-button
                                  type="error"
                                  @click="handleAuditReject"
                                >
                                  <template #icon
                                    ><n-icon><CloseCircleOutline /></n-icon
                                  ></template>
                                  驳回整改
                                </n-button>
                                <n-button
                                  type="success"
                                  @click="handleAuditPass"
                                >
                                  <template #icon
                                    ><n-icon><CheckmarkCircleOutline /></n-icon
                                  ></template>
                                  审核通过
                                </n-button>
                              </n-space>
                            </div>
                          </n-card>
                        </div>
                        <div
                          v-else
                          class="flow-detail-empty"
                        >
                          请点击左侧节点查看详细记录
                        </div>
                      </n-grid-item>
                    </n-grid>
                  </div>
                </div>

                <div v-else class="empty-flow">
                  <n-empty
                    description="请先在第 3 步“确认开工金额方案”中完成金额确认并开启施工"
                  />
                </div>
              </n-spin>
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="bills"
            tab="5. 支付账单"
            :disabled="!detailOrder?.id"
          >
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
          </n-tab-pane>

          <n-tab-pane
            name="optionalChange"
            tab="6. 选配变更"
            :disabled="!detailOrder?.id"
          >
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
                      <div class="admin-optional-change-card__title">
                        申请 #{{ record.id }}
                      </div>
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
                      <div v-if="record.finalChargeAmount !== null && record.finalChargeAmount !== undefined">
                        最终补价：¥{{ formatCurrencyAmount(record.finalChargeAmount) }}
                      </div>
                      <div v-if="record.finalRefundAmount !== null && record.finalRefundAmount !== undefined">
                        最终退款：¥{{ formatCurrencyAmount(record.finalRefundAmount) }}
                      </div>
                      <div v-if="record.linkedBillTitle">
                        关联账单：{{ record.linkedBillTitle }} / {{ record.linkedBillStatusLabel || '--' }}
                        <template
                          v-if="
                            record.linkedBillAmount !== null &&
                            record.linkedBillAmount !== undefined
                          "
                        >
                          / ¥{{ formatCurrencyAmount(record.linkedBillAmount) }}
                        </template>
                      </div>
                      <div v-if="record.linkedRefundStatusLabel">
                        退款状态：{{ record.linkedRefundStatusLabel }}
                      </div>
                      <div v-if="record.paymentRecordId">
                        关联支付流水：#{{ record.paymentRecordId }}
                      </div>
                      <div v-if="record.auditOperator || record.auditTime">
                        审核信息：{{ record.auditOperator || '--' }} / {{ formatDateTime(record.auditTime) }}
                      </div>
                    </div>

                    <div class="admin-optional-change-card__snapshots">
                      <div class="admin-optional-change-card__snapshot">
                        <span class="admin-optional-change-card__snapshot-label">
                          变更前
                        </span>
                        <span class="admin-optional-change-card__snapshot-text">
                          {{ formatAdminOptionalChangeSnapshot(record.oldOptionsSnapshot) }}
                        </span>
                      </div>
                      <div class="admin-optional-change-card__snapshot">
                        <span class="admin-optional-change-card__snapshot-label">
                          目标选配
                        </span>
                        <span class="admin-optional-change-card__snapshot-text">
                          {{ formatAdminOptionalChangeSnapshot(record.targetOptionsSnapshot) }}
                        </span>
                      </div>
                    </div>

                    <div
                      v-if="canAuditOptionalChange && record.status === 'PENDING'"
                      class="admin-optional-change-card__actions"
                    >
                      <n-button
                        size="small"
                        type="primary"
                        @click="openOptionalChangeAuditModal(record)"
                      >
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
          </n-tab-pane>
        </n-tabs>

        <div
          v-if="shouldShowConstructionProgressButton"
          class="construction-progress-actions"
        >
          <n-button type="info" size="large" @click="dispatchTab = 'flow'">
            <template #icon>
              <n-icon><EyeOutline /></n-icon>
            </template>
            查看施工进度
          </n-button>
        </div>
      </n-spin>
    </n-modal>

    <n-modal
      v-model:show="showOptionalChangeAuditModal"
      preset="card"
      title="审核选配变更"
      style="width: min(560px, calc(100vw - 24px))"
    >
      <n-form label-placement="left" label-width="90">
        <n-form-item label="申请编号">
          <span>#{{ currentOptionalChangeAuditRecord?.id || '--' }}</span>
        </n-form-item>
        <n-form-item label="理论差额">
          <span>
            {{
              currentOptionalChangeAuditRecord
                ? `¥${formatCurrencyAmount(currentOptionalChangeAuditRecord.theoreticalDiffAmount)}`
                : '--'
            }}
          </span>
        </n-form-item>
        <n-form-item label="处理结果">
          <n-radio-group v-model:value="optionalChangeAuditForm.approved">
            <n-space>
              <n-radio :value="true">审核通过</n-radio>
              <n-radio :value="false">审核驳回</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <template v-if="optionalChangeAuditForm.approved">
          <n-form-item label="结算方式">
            <n-radio-group v-model:value="optionalChangeAuditForm.mode">
              <n-space vertical>
                <n-radio
                  v-for="item in currentOptionalChangeAuditModeOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </n-radio>
              </n-space>
            </n-radio-group>
            <div class="vendor-option-hint">
              {{ currentOptionalChangeAuditModeHint }}
            </div>
          </n-form-item>

          <n-form-item v-if="optionalChangeAuditForm.mode === 'charge'" label="补价金额">
            <n-input-number
              v-model:value="optionalChangeAuditForm.finalChargeAmount"
              :min="0"
              :precision="2"
              class="full-width-input"
              placeholder="请输入最终补价金额"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-form-item>

          <template v-if="optionalChangeAuditForm.mode === 'refund'">
            <n-form-item label="退款金额">
              <n-input-number
                v-model:value="optionalChangeAuditForm.finalRefundAmount"
                :min="0"
                :precision="2"
                class="full-width-input"
                placeholder="请输入最终退款金额"
              >
                <template #prefix>¥</template>
              </n-input-number>
            </n-form-item>

            <n-form-item label="支付流水">
              <n-select
                v-if="
                  canViewPaymentRecordList &&
                  optionalChangePaymentRecordOptions.length > 0
                "
                v-model:value="optionalChangeAuditForm.paymentRecordId"
                :options="optionalChangePaymentRecordOptions"
                :loading="optionalChangePaymentRecordLoading"
                clearable
                filterable
                placeholder="请选择退款关联的支付流水"
              />
              <n-input-number
                v-else
                v-model:value="optionalChangeAuditForm.paymentRecordId"
                :min="1"
                class="full-width-input"
                placeholder="请输入支付流水ID"
              />
            </n-form-item>

            <n-alert
              v-if="
                !canViewPaymentRecordList ||
                optionalChangePaymentRecordOptions.length === 0
              "
              type="warning"
              class="inline-alert-md"
            >
              {{
                canViewPaymentRecordList
                  ? '当前订单未查询到可选支付流水，请手动填写支付流水ID。'
                  : '当前账号无支付流水查看权限，如需退款请手动填写支付流水ID。'
              }}
            </n-alert>
          </template>
        </template>
      </n-form>

      <template #footer>
        <div class="optional-change-audit-modal__footer">
          <n-button @click="closeOptionalChangeAuditModal">取消</n-button>
          <n-button
            type="primary"
            :loading="optionalChangeSubmitting"
            @click="submitOptionalChangeAudit"
          >
            确认提交
          </n-button>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showMaterialDispatchModal"
      preset="card"
      :title="
        materialDispatchReplacingVendorOrderId
          ? `更换供应商 - ${currentTarget.category} (${currentTarget.name})`
          : `指派供应商 - ${currentTarget.category} (${currentTarget.name})`
      "
      style="width: min(500px, calc(100vw - 24px))"
    >
      <n-alert type="info" class="inline-alert-md">
        {{
          materialDispatchReplacingVendorOrderId
            ? '当前分类下的选配产品已变更。确认派单时会先取消旧服务商订单，再创建新的材料派单。'
            : '可选择“材料商”或“综合服务商”类型的公司，价格为本次材料子单的成交价。施工中如发生增项或同类改项，也可继续在此补派或重派。'
        }}
      </n-alert>
      <n-form label-placement="left" label-width="80">
        <n-form-item label="推荐供应商">
          <n-select
            v-model:value="materialForm.vendorId"
            :options="materialVendorOptions"
            placeholder="请选择推荐的供应商"
            filterable
            clearable
            :loading="loadingVendorOpts"
            :disabled="!canManageMaterialDispatch"
          />
          <div v-if="selectedMaterialVendorOption?.raw" class="vendor-option-hint">
            {{
              `${selectedMaterialVendorOption.raw.companyName} · ${getVendorServiceTypeText(selectedMaterialVendorOption.raw.serviceType)} · ${formatVendorDistance(selectedMaterialVendorOption.raw.distance)}`
            }}
          </div>
        </n-form-item>
        <n-form-item label="价格">
          <n-input-number
            v-model:value="materialForm.price"
            placeholder="请输入价格"
            class="full-width-input"
            :min="0"
            :disabled="!canManageMaterialDispatch"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="materialForm.adminNotes"
            type="textarea"
            placeholder="备注 (可选)"
            :disabled="!canManageMaterialDispatch"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer-actions">
          <n-button @click="showMaterialDispatchModal = false">取消</n-button>
          <n-button
            type="primary"
            :disabled="!canManageMaterialDispatch"
            @click="submitMaterialDispatch"
            >确认派单</n-button
          >
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showRedispatchModal"
      preset="card"
      :title="
        redispatchTarget.type === 1
          ? '重新指派施工单位'
          : `重新指派供应商 - ${redispatchTarget.category || '--'}`
      "
      style="width: min(560px, calc(100vw - 24px))"
    >
      <n-alert :type="canManageMaterialDispatch ? 'warning' : 'error'" class="inline-alert-md">
        {{
          canManageMaterialDispatch
            ? `当前服务商：${redispatchTarget.currentVendorName || '未记录'}。请选择新的公司并确认成交价格。`
            : '当前订单不可继续派单。'
        }}
      </n-alert>
      <n-form label-placement="left" label-width="88">
        <n-form-item label="服务商公司">
          <n-select
            v-model:value="redispatchForm.vendorId"
            :options="redispatchVendorOptions"
            placeholder="请选择新的服务商公司"
            filterable
            clearable
            :loading="redispatchLoading"
            :disabled="!canManageMaterialDispatch"
          />
          <div v-if="selectedRedispatchVendorOption?.raw" class="vendor-option-hint">
            {{
              `${selectedRedispatchVendorOption.raw.companyName} · ${getVendorServiceTypeText(selectedRedispatchVendorOption.raw.serviceType)} · ${formatVendorDistance(selectedRedispatchVendorOption.raw.distance)}`
            }}
          </div>
        </n-form-item>
        <n-form-item label="成交价格">
          <n-input-number
            v-model:value="redispatchForm.price"
            placeholder="请输入价格"
            class="full-width-input"
            :min="0"
            :disabled="!canManageMaterialDispatch"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="派单备注">
          <n-input
            v-model:value="redispatchForm.adminNotes"
            type="textarea"
            placeholder="请输入派单备注"
            :disabled="!canManageMaterialDispatch"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer-actions">
          <n-button
            :disabled="redispatchSubmitting"
            @click="showRedispatchModal = false"
          >
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="redispatchSubmitting"
            :disabled="!canManageMaterialDispatch"
            @click="submitRedispatch"
          >
            确认重派
          </n-button>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showCancelModal"
      preset="dialog"
      title="取消派单"
      positive-text="确认取消"
      negative-text="暂不取消"
      @positive-click="submitCancel"
      @negative-click="showCancelModal = false"
    >
      <n-input
        v-model:value="cancelReason"
        type="textarea"
        placeholder="请输入取消理由..."
        :rows="3"
      />
    </n-modal>

    <n-modal
      v-model:show="showAuditRejectModal"
      preset="dialog"
      title="审核驳回"
      positive-text="确认驳回"
      negative-text="取消"
      @positive-click="() => submitAudit(false, auditRejectReason)"
      @negative-click="showAuditRejectModal = false"
    >
      <div class="audit-reject-wrap">
        <n-input
          v-model:value="auditRejectReason"
          type="textarea"
          placeholder="请输入驳回整改的原因，服务商将看到此信息..."
          :rows="3"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import {
  onMounted,
  onBeforeUnmount,
  ref,
  h,
  computed,
  watch,
} from 'vue'
import { storeToRefs } from 'pinia'
import {
  useMessage,
  useDialog,
  NButton,
  NTag,
} from 'naive-ui'
import {
  CloudUploadOutline,
  DocumentAttachOutline,
  HammerOutline,
  EyeOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
} from '@/icons/ionicons'
import Delete from '@/components/operation/Delete.vue'
import ConstructionPricingPanel from '@/components/admin/order/ConstructionPricingPanel.vue'
import adminOrderAPI from '@/api/user/detailsOrder'
import paymentAPI from '@/api/user/userOrder'
import { useAdminOrderManageStore } from '@/stores/order/useAdminOrderManageStore'
import { getEmployeePermissions, hasPermission } from '@/utils/adminAuth'
import { CONSTRUCTION_NODE_STATUS, getProcessText } from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'
import { AUTH_SCOPE_EMPLOYEE, getAuthStorage } from '@/utils/auth'

const message = useMessage()
const dialog = useDialog()
const orderManageStore = useAdminOrderManageStore()
const pageInfo = orderManageStore.pageInfo
const filters = orderManageStore.filters
const orderAddressForm = orderManageStore.orderAddressForm
const orderRegionCascaderOptions = orderManageStore.orderRegionCascaderOptions
const handleOrderRegionUpdate = (...args) =>
  orderManageStore.handleOrderRegionUpdate(...args)
const constructionForm = orderManageStore.constructionForm
const materialForm = orderManageStore.materialForm
const redispatchForm = orderManageStore.redispatchForm
const {
  loadingList,
  loadingMetadata,
  loadingDetail,
  dispatchLoading,
  loadingConstruction,
  loadingVendorOpts,
  submitting,
  redispatchSubmitting,
  redispatchLoading,
  orderList,
  dynamicConfigList,
  detailOrder,
  selectionMap,
  currentContractUrl,
  selectedOrderRegionCode,
  orderAddressPreview,
  currentDispatchOrder,
  materialDispatchList,
  activeConstructionOrder,
  constructionInfo,
  currentNodeDetail,
  constructionVendorOptions,
  currentTarget,
  materialVendorOptions,
  redispatchVendorOptions,
  redispatchTarget,
  showAuditRejectModal,
  auditRejectReason,
  showCancelModal,
  cancelReason,
  isAddressLocked,
  canDispatch,
  isDispatchStageLocked,
  activeConstructionNode,
  currentNodeDetailStatusText,
  depositDraftAmount,
  constructionBaseAmount,
  constructionPricePlanStatusText,
  constructionPricePlanHint,
  canEditConstructionDeposit,
  hasConstructionNodeInstances,
  constructionPricingProcessText,
  constructionPricingStageRows,
  allServicesAccepted,
} = storeToRefs(orderManageStore)

const employeePermissions = getEmployeePermissions()
const canStartConstruction = computed(() =>
  hasPermission(employeePermissions, 'construction:admin:start'),
)
const canConfigureConstructionPrice = computed(() =>
  hasPermission(employeePermissions, 'construction:admin:price'),
)
const canAuditOptionalChange = computed(() =>
  hasPermission(employeePermissions, 'order:update'),
)
const canViewPaymentRecordList = computed(() =>
  hasPermission(employeePermissions, 'payment:list'),
)
const operatorName = computed(() => {
  const name = getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'name')
  const phone = getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'phone')
  const userId = getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'id')
  return name || phone || (userId ? `emp-${userId}` : 'admin')
})
const activeTodoFilter = ref('all')
const depositSubmitting = ref(false)
const planSubmitting = ref(false)

const getErrorMessage = (error, fallback) => {
  return (
    error?.msg ||
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === 'string' ? error.response.data : '') ||
    error?.message ||
    fallback
  )
}

const hasUploadedContract = (order) => {
  const contract = order?.orderContract
  if (!contract) return false
  if (typeof contract === 'string') return contract.trim().length > 0
  if (Array.isArray(contract)) return contract.length > 0
  if (typeof contract === 'object') {
    if (typeof contract.fileUrl === 'string') {
      return contract.fileUrl.trim().length > 0
    }
    return Object.keys(contract).length > 0
  }
  return false
}

const getOrderTodoMeta = (order) => {
  const orderStatus = Number(order?.orderStatus)
  const hasContract = hasUploadedContract(order)
  const contractLoaded = Boolean(order?.contractLoaded)

  if (orderStatus === 5) {
    return {
      key: 'cancelled',
      label: '已取消',
      description: '订单已取消',
      type: 'default',
      accent: 'neutral',
    }
  }

  if (orderStatus >= 4) {
    return {
      key: 'completed',
      label: '已完结',
      description: '订单流程已完成',
      type: 'success',
      accent: 'success',
    }
  }

  if (orderStatus === 3) {
    return {
      key: 'construction',
      label: '施工中跟进',
      description: '跟进施工节点与账单',
      type: 'success',
      accent: 'success',
    }
  }

  if (orderStatus === 2) {
    return {
      key: 'readyConstruction',
      label: '待开启施工',
      description: '接单完成后可开启施工',
      type: 'info',
      accent: 'brand',
    }
  }

  if (orderStatus === 1) {
    return {
      key: 'dispatching',
      label: '派单中跟进',
      description: '等待服务商接单或重派',
      type: 'warning',
      accent: 'warning',
    }
  }

  if (orderStatus === 0 && contractLoaded && !hasContract) {
    return {
      key: 'contract',
      label: '待上传合同',
      description: '上传合同后可进入派单',
      type: 'warning',
      accent: 'warning',
    }
  }

  if (orderStatus === 0 && hasContract) {
    return {
      key: 'dispatch',
      label: '待派单',
      description: '可进入处理/派单',
      type: 'info',
      accent: 'info',
    }
  }

  if (orderStatus === 0) {
    return {
      key: 'contract',
      label: '待上传合同',
      description: '正在同步合同状态',
      type: 'warning',
      accent: 'warning',
    }
  }

  return {
    key: 'other',
    label: '待跟进',
    description: '请进入详情查看当前状态',
    type: 'default',
    accent: 'neutral',
  }
}

const todoCardConfigs = [
  {
    key: 'contract',
    label: '待上传合同',
  },
  {
    key: 'dispatch',
    label: '待派单',
  },
  {
    key: 'dispatching',
    label: '派单中跟进',
  },
  {
    key: 'readyConstruction',
    label: '待开启施工',
  },
  {
    key: 'construction',
    label: '施工中跟进',
  },
]

const todoCountMap = computed(() => {
  const counts = Object.create(null)
  orderList.value.forEach((item) => {
    const key = getOrderTodoMeta(item).key
    counts[key] = Number(counts[key] || 0) + 1
  })
  return counts
})

const todoCards = computed(() => [
  {
    key: 'all',
    label: '全部订单',
    count: orderList.value.length,
  },
  ...todoCardConfigs.map((config) => ({
    ...config,
    count: Number(todoCountMap.value[config.key] || 0),
  })),
])

const activeTodoFilterLabel = computed(() => {
  const matched = todoCards.value.find((item) => item.key === activeTodoFilter.value)
  return matched?.label || '全部订单'
})

const visibleOrderList = computed(() => {
  if (activeTodoFilter.value === 'all') return orderList.value
  return orderList.value.filter(
    (item) => getOrderTodoMeta(item).key === activeTodoFilter.value,
  )
})

const emptyOrderListDescription = computed(() =>
  activeTodoFilter.value === 'all'
    ? '暂无符合条件的订单数据'
    : `当前页暂无“${activeTodoFilterLabel.value}”订单`,
)

const formatTodoBadgeCount = (count) => {
  const value = Number(count || 0)
  if (value > 99) return '99+'
  return String(value)
}

watch(
  () => filters.keyword,
  (newVal) => {
    if (!newVal) {
      handleReset()
    }
  },
)

// 订单状态映射
const orderStatusOptions = [
  { label: '未派单', value: 0 },
  { label: '派单中', value: 1 },
  { label: '已派单', value: 2 },
  { label: '施工中', value: 3 },
  { label: '已完成', value: 4 },
  { label: '已取消', value: 5 },
]

// 列表显示用
const orderStatusMap = {
  0: '未派单',
  1: '派单中',
  2: '已派单',
  3: '施工中',
  4: '已完成',
  5: '已取消',
}

const getStatusText = (status) => orderStatusMap[status] || `未知(${status})`

const styleMap = {
  modern: '现代风格',
  chinese: '中式风格',
  european: '欧式风格',
}

const getStyleLabel = (value) => styleMap[value] || value || '--'
const getStatusType = (status) => {
  const numericStatus = Number(status)
  if (numericStatus === 5) return 'error'
  if (numericStatus === 4) return 'success'
  if (numericStatus === 3 || numericStatus === 2) return 'info'
  if (numericStatus === 1 || numericStatus === 0) return 'warning'
  return 'default'
}

// 支付状态映射
const paymentStatusOptions = [
  { label: '待支付', value: 0 },
  { label: '部分支付', value: 1 },
  { label: '已结清', value: 2 },
  { label: '已退款', value: 3 },
]

const paymentStatusMap = {
  0: '待支付',
  1: '部分支付',
  2: '已结清',
  3: '已退款',
}

const getPaymentText = (status) => paymentStatusMap[status] || `未知(${status})`
const getPaymentType = (status) => {
  if (status === 2) return 'success'
  if (status === 0) return 'error'
  return 'warning'
}

// 辅助：获取服务商订单状态文本和颜色
const getVendorStatusInfo = (status) => {
  const map = {
    0: { text: '已拒接', type: 'error' },
    1: { text: '已接受', type: 'success' },
    2: { text: '已完成', type: 'info' },
    3: { text: '未回复', type: 'warning' },
    4: { text: '已取消', type: 'default' },
  }
  return map[status] || { text: '未知', type: 'default' }
}

const hasVendorRejectReason = (order) =>
  Number(order?.orderStatus) === 0 && !!order?.vendorNotes

const getVendorRejectReason = (order) => String(order?.vendorNotes || '').trim()

const getVendorServiceTypeText = (type) => {
  const map = {
    1: '建筑商',
    2: '材料商',
    3: '综合服务商',
  }
  return map[Number(type)] || '未知类型'
}

const formatVendorDistance = (distance) => {
  const value = Number(distance)
  return Number.isFinite(value) ? `距离${value.toFixed(1)}km` : '距离未知'
}

const showVendorReasonDialog = (notes) => {
  dialog.info({
    title: '服务商拒绝理由',
    content: notes || '服务商未填写拒绝理由',
  })
}

const fetchData = async () => {
  try {
    await orderManageStore.fetchData()
  } catch (e) {
    console.error(e)
    message.error('获取列表失败')
  }
}

const handleSearch = () => {
  pageInfo.page = 1
  fetchData()
}
const handleReset = () => {
  orderManageStore.resetFilters()
  handleSearch()
}
const handlePageChange = (page) => {
  pageInfo.page = page
  fetchData()
}

const showDetailModal = ref(false)
const isReadOnly = ref(false)
let dispatchPaymentPollTimer = null
const optionalChangeLoading = ref(false)
const optionalChangeSubmitting = ref(false)
const optionalChangeRecords = ref([])
const showOptionalChangeAuditModal = ref(false)
const currentOptionalChangeAuditRecord = ref(null)
const optionalChangePaymentRecordLoading = ref(false)
const optionalChangePaymentRecordOptions = ref([])
const optionalChangeAuditForm = reactive({
  approved: true,
  mode: 'direct',
  finalChargeAmount: null,
  finalRefundAmount: null,
  paymentRecordId: null,
})
const OPTIONAL_CHANGE_AUDIT_MODE_LABEL_MAP = {
  direct: '直接通过',
  charge: '生成补价账单',
  refund: '发起退款',
}

const sortOptionalChangeRecords = (records = []) =>
  [...records].sort((a, b) => {
    const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
    const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return Number(b?.id || 0) - Number(a?.id || 0)
  })

const visibleOptionalChangeRecords = computed(() => {
  if (!optionalChangeRecords.value.length) return []
  return sortOptionalChangeRecords(optionalChangeRecords.value).slice(0, 1)
})

const handleOpenUnifiedDetail = (item) => {
  showDetailModal.value = true
  isReadOnly.value = ![0, 1, 2, 3].includes(Number(item.orderStatus))
  orderManageStore.fetchOrderDetailInternal(item.id).catch((error) => {
    console.error(error)
    message.error('获取详情失败')
  })
}

const handleUpdateOrder = async () => {
  if (isReadOnly.value) {
    message.warning('当前订单状态不可修改')
    return
  }
  submitting.value = true
  try {
    const res = await orderManageStore.updateCurrentOrder()
    if (res.code === 200) {
      const currentOrderId = detailOrder.value?.id
      if (currentOrderId) {
        await orderManageStore.fetchOrderDetailInternal(currentOrderId)
        orderManageStore.syncDispatchListItem()
        if (showDispatchModal.value) {
          await orderManageStore.initDispatchState()
        }
      }
      message.success('基础信息与选配修改成功')
      showDetailModal.value = false
      await fetchData()
    } else {
      message.error(res.msg || '修改失败')
    }
  } catch (e) {
    message.error(getErrorMessage(e, '请求出错'))
  } finally {
    submitting.value = false
  }
}

// 合同上传相关
const isImage = (url) => {
  if (!url || typeof url !== 'string') return false
  const ext = url.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
}

const handleUploadContract = async ({ file, onFinish, onError }) => {
  const orderId = currentDispatchOrder.value?.id || detailOrder.value?.id
  if (!orderId) {
    message.error('未获取到订单ID')
    onError()
    return
  }
  try {
    message.loading('文件上传中...', { duration: 0 })
    const res = await orderManageStore.uploadContract({
      orderId,
      file: file.file,
    })
    message.destroyAll()
    if (res.code === 200 && res.data && res.data.contractUrl) {
      message.success('合同上传成功')
      orderManageStore.syncDispatchListItem()
      if (showDispatchModal.value) {
        dispatchTab.value = 'dispatch'
      }
      onFinish()
    } else {
      message.error(res.msg || '上传失败')
      onError()
    }
  } catch (e) {
    message.destroyAll()
    message.error('上传过程发生错误')
    onError()
  }
}

const handleUserOrderDelete = async (id) => {
  try {
    const res = await orderManageStore.deleteUserOrder(id)
    if (res.code === 200) {
      message.success('删除成功')
      if (orderList.value.length === 1 && pageInfo.page > 1) pageInfo.page--
      fetchData()
    } else {
      message.error(res.msg || '删除失败')
    }
  } catch (e) {
    message.error('删除出错')
  }
}

const getOptionalChangeStatusTagType = (status) => {
  switch (status) {
    case 'PAID':
    case 'APPROVED':
    case 'AUTO_APPROVED':
    case 'REFUNDED':
      return 'success'
    case 'PAYMENT_PENDING':
    case 'REFUND_PENDING':
      return 'warning'
    case 'REJECTED':
    case 'CANCELLED':
      return 'error'
    default:
      return 'info'
  }
}

const formatAdminOptionalChangeSnapshot = (snapshot = []) => {
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    return '无'
  }

  return snapshot
    .map((item) => {
      const categoryLabel =
        item?.categoryName || item?.categoryLabel || `分类${item?.categoryId || '--'}`
      const name = item?.name || `产品${item?.id || '--'}`
      return `${categoryLabel}：${name}`
    })
    .join('；')
}

const resolveOptionalChangeAllowedModes = (record) => {
  const diff = Number(record?.theoreticalDiffAmount || 0)
  const changeType = String(record?.changeType || '').trim()

  if (changeType === 'ADD_ONLY') {
    return diff > 0 ? ['charge'] : ['direct']
  }

  if (changeType === 'REMOVE') {
    return diff < 0 ? ['refund'] : ['direct']
  }

  if (['REPLACE', 'MIXED'].includes(changeType)) {
    if (diff > 0) return ['charge']
    if (diff < 0) return ['refund']
    return ['direct']
  }

  if (diff > 0) return ['charge']
  if (diff < 0) return ['refund']
  return ['direct']
}

const currentOptionalChangeAllowedModes = computed(() =>
  resolveOptionalChangeAllowedModes(currentOptionalChangeAuditRecord.value),
)

const currentOptionalChangeAuditModeOptions = computed(() =>
  currentOptionalChangeAllowedModes.value.map((value) => ({
    value,
    label: OPTIONAL_CHANGE_AUDIT_MODE_LABEL_MAP[value] || value,
  })),
)

const currentOptionalChangeAuditModeHint = computed(() => {
  const changeTypeLabel =
    currentOptionalChangeAuditRecord.value?.changeTypeLabel || '当前变更'
  const firstMode = currentOptionalChangeAuditModeOptions.value[0]
  if (!firstMode) return `${changeTypeLabel}仅支持审核驳回。`
  return `${changeTypeLabel}仅支持“${firstMode.label}”处理，已限制错误操作。`
})

const resolveOptionalChangeAuditMode = (record) => {
  return resolveOptionalChangeAllowedModes(record)[0] || 'direct'
}

const resetOptionalChangeAuditForm = () => {
  optionalChangeAuditForm.approved = true
  optionalChangeAuditForm.mode = 'direct'
  optionalChangeAuditForm.finalChargeAmount = null
  optionalChangeAuditForm.finalRefundAmount = null
  optionalChangeAuditForm.paymentRecordId = null
}

const loadAdminOptionalChangeList = async (
  orderId = currentDispatchOrder.value?.id || detailOrder.value?.id,
) => {
  if (!orderId) {
    optionalChangeRecords.value = []
    return []
  }

  optionalChangeLoading.value = true
  try {
    const res = await adminOrderAPI.getAdminOptionalChangeList(orderId)
    if (res?.code === 200 && Array.isArray(res.data)) {
      optionalChangeRecords.value = res.data
      return optionalChangeRecords.value
    }
    optionalChangeRecords.value = []
    return []
  } catch (error) {
    console.error(error)
    optionalChangeRecords.value = []
    return []
  } finally {
    optionalChangeLoading.value = false
  }
}

const loadOptionalChangePaymentRecordOptions = async (
  orderId = currentDispatchOrder.value?.id || detailOrder.value?.id,
) => {
  if (!orderId || !canViewPaymentRecordList.value) {
    optionalChangePaymentRecordOptions.value = []
    return []
  }

  optionalChangePaymentRecordLoading.value = true
  try {
    const res = await paymentAPI.getPaymentRecordList({
      page: 1,
      pageSize: 100,
      orderId,
    })
    if (res?.code !== 200 || !res.data) {
      optionalChangePaymentRecordOptions.value = []
      return []
    }

    const rows = res.data.rows || res.data.records || []
    optionalChangePaymentRecordOptions.value = rows.map((item) => ({
      label: `#${item.id} | ${item.paymentStage || '--'} | ¥${formatCurrencyAmount(item.amount)} | ${formatDateTime(item.payTime)}`,
      value: Number(item.id),
    }))
    return optionalChangePaymentRecordOptions.value
  } catch (error) {
    console.error(error)
    optionalChangePaymentRecordOptions.value = []
    return []
  } finally {
    optionalChangePaymentRecordLoading.value = false
  }
}

const closeOptionalChangeAuditModal = () => {
  if (optionalChangeSubmitting.value) return
  showOptionalChangeAuditModal.value = false
  currentOptionalChangeAuditRecord.value = null
  optionalChangePaymentRecordOptions.value = []
  resetOptionalChangeAuditForm()
}

const openOptionalChangeAuditModal = async (record) => {
  currentOptionalChangeAuditRecord.value = record
  resetOptionalChangeAuditForm()
  optionalChangeAuditForm.mode = resolveOptionalChangeAuditMode(record)

  const diffAmount = Math.abs(Number(record?.theoreticalDiffAmount || 0))
  if (optionalChangeAuditForm.mode === 'charge' && diffAmount > 0) {
    optionalChangeAuditForm.finalChargeAmount = diffAmount
  }
  if (optionalChangeAuditForm.mode === 'refund' && diffAmount > 0) {
    optionalChangeAuditForm.finalRefundAmount = diffAmount
  }

  showOptionalChangeAuditModal.value = true

  if (optionalChangeAuditForm.mode === 'refund') {
    await loadOptionalChangePaymentRecordOptions()
  }
}

const refreshDispatchContext = async (
  orderId = currentDispatchOrder.value?.id || detailOrder.value?.id,
) => {
  if (!orderId) return
  await orderManageStore.fetchOrderDetailInternal(orderId)
  orderManageStore.syncDispatchListItem()
  await loadAdminOptionalChangeList(orderId)
  if (Number(detailOrder.value?.orderStatus) >= 3) {
    await loadConstructionStatus()
  }
}

const submitOptionalChangeAudit = async () => {
  const requestId = Number(currentOptionalChangeAuditRecord.value?.id || 0)
  if (!requestId) {
    message.error('未找到选配变更申请')
    return
  }

  const payload = {
    requestId,
    approved: optionalChangeAuditForm.approved,
  }

  if (optionalChangeAuditForm.approved) {
    if (!currentOptionalChangeAllowedModes.value.includes(optionalChangeAuditForm.mode)) {
      message.warning('当前变更类型不支持所选结算方式')
      optionalChangeAuditForm.mode = resolveOptionalChangeAuditMode(
        currentOptionalChangeAuditRecord.value,
      )
      return
    }

    if (optionalChangeAuditForm.mode === 'charge') {
      const amount = Number(optionalChangeAuditForm.finalChargeAmount)
      if (!(amount > 0)) {
        message.warning('请输入有效的补价金额')
        return
      }
      payload.finalChargeAmount = amount
    }

    if (optionalChangeAuditForm.mode === 'refund') {
      const refundAmount = Number(optionalChangeAuditForm.finalRefundAmount)
      const paymentRecordId = Number(optionalChangeAuditForm.paymentRecordId)
      if (!(refundAmount > 0)) {
        message.warning('请输入有效的退款金额')
        return
      }
      if (!(paymentRecordId > 0)) {
        message.warning('退款必须关联已支付流水')
        return
      }
      payload.finalRefundAmount = refundAmount
      payload.paymentRecordId = paymentRecordId
    }
  }

  optionalChangeSubmitting.value = true
  try {
    const res = await adminOrderAPI.auditAdminOptionalChange(
      payload,
      operatorName.value,
    )
    if (res?.code !== 200) {
      message.error(res?.msg || '选配变更审核失败')
      return
    }

    message.success(res.msg || '选配变更审核成功')
    closeOptionalChangeAuditModal()
    await refreshDispatchContext()
  } catch (error) {
    console.error(error)
    message.error(getErrorMessage(error, '选配变更审核失败'))
  } finally {
    optionalChangeSubmitting.value = false
  }
}

// ======================= 派单管理功能区域 =======================

const showDispatchModal = ref(false)
const dispatchTab = ref('contract')
const shouldShowWaitUploadHighlight = computed(
  () =>
    Number(constructionInfo.value?.currentNodeStatus) ===
    CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD,
)
const shouldShowWaitUserAuditHighlight = computed(
  () =>
    Number(constructionInfo.value?.currentNodeStatus) ===
    CONSTRUCTION_NODE_STATUS.WAIT_USER_AUDIT,
)
const shouldShowWaitBillPaymentHighlight = computed(
  () =>
    Number(constructionInfo.value?.currentNodeStatus) ===
    CONSTRUCTION_NODE_STATUS.WAIT_PAYMENT,
)
const formatCurrencyAmount = (value) => Number(value || 0).toLocaleString()
const formatDateTime = (value) => {
  if (!value) return '--'
  return String(value).replace('T', ' ')
}

const paymentBillTypeMap = {
  BUILD_DEPOSIT: '建房定金',
  ADJUSTMENT: '补差账单',
  OPTION_CHANGE: '选配变更补价',
  STAGE_PAYMENT: '节点进度款',
}

const getPaymentBillTypeText = (billType) =>
  paymentBillTypeMap[billType] || billType || '待支付账单'

const getPaymentBillTypeTagType = (billType) => {
  if (billType === 'BUILD_DEPOSIT') return 'warning'
  if (billType === 'ADJUSTMENT') return 'error'
  if (billType === 'OPTION_CHANGE') return 'warning'
  if (billType === 'STAGE_PAYMENT') return 'info'
  return 'default'
}

const sortAdminPaymentBills = (rows = []) =>
  [...rows].sort((left, right) => {
    const leftTime = left?.createTime ? new Date(left.createTime).getTime() : 0
    const rightTime = right?.createTime ? new Date(right.createTime).getTime() : 0
    if (leftTime !== rightTime) return rightTime - leftTime
    return Number(right?.id || 0) - Number(left?.id || 0)
  })

const getBuildDepositPendingBill = () => {
  const pendingRows = Array.isArray(detailOrder.value?.pendingPaymentBills)
    ? detailOrder.value.pendingPaymentBills
    : []
  return pendingRows.find((bill) => bill?.billType === 'BUILD_DEPOSIT') || null
}

const getBuildDepositBillAmount = () => {
  const pendingBill = getBuildDepositPendingBill()
  const pendingAmount = Number(pendingBill?.amount)
  if (Number.isFinite(pendingAmount) && pendingAmount > 0) {
    return pendingAmount
  }

  const paidAmount = Number(detailOrder.value?.paidAmount)
  if (Number.isFinite(paidAmount) && paidAmount > 0) {
    return paidAmount
  }

  return null
}

const getBuildDepositBillCreateTime = () => {
  const pendingBill = getBuildDepositPendingBill()
  return (
    pendingBill?.createTime ||
    detailOrder.value?.createTime ||
    detailOrder.value?.payTime ||
    detailOrder.value?.paymentTime ||
    null
  )
}

const resolveAdminBillStatus = (bill) => {
  const rawStatus = String(bill?.status || '').trim().toUpperCase()
  if (rawStatus === 'PAID') return 'PAID'
  if (rawStatus === 'REFUNDED') return 'REFUNDED'
  if (rawStatus === 'CANCELLED') return 'CANCELLED'
  if (rawStatus === 'EXPIRED') return 'EXPIRED'
  return 'PENDING'
}

const adminPendingPaymentBillRows = computed(() => {
  const rows = Array.isArray(detailOrder.value?.pendingPaymentBills)
    ? detailOrder.value.pendingPaymentBills
    : []
  return sortAdminPaymentBills(rows)
})

const buildDepositAdminStatus = computed(() => {
  if (getBuildDepositPendingBill()) return 'PENDING'
  const paymentStatus = Number(detailOrder.value?.paymentStatus)
  if (paymentStatus === 3) return 'REFUNDED'
  if ([1, 2].includes(paymentStatus)) return 'PAID'
  return 'PENDING'
})

const adminPaymentBillRows = computed(() => {
  const rows = [...adminPendingPaymentBillRows.value]
  const hasBuildDepositBill = rows.some((bill) => bill?.billType === 'BUILD_DEPOSIT')

  if (!hasBuildDepositBill && detailOrder.value?.id) {
    rows.unshift({
      id: `build-deposit-${detailOrder.value.id}`,
      billType: 'BUILD_DEPOSIT',
      status: buildDepositAdminStatus.value,
      amount: getBuildDepositBillAmount(),
      remark: '--',
      relatedNodeId: null,
      billTitle: '建房定金',
      createTime: getBuildDepositBillCreateTime(),
    })
  }

  return sortAdminPaymentBills(rows)
})

const hasAdminPaymentBillRows = computed(() => adminPaymentBillRows.value.length > 0)

const getAdminBillStatusText = (bill) => {
  const status = resolveAdminBillStatus(bill)
  const statusMap = {
    PENDING: '待支付',
    PAID: '已支付',
    REFUNDED: '已退款',
    CANCELLED: '已取消',
    EXPIRED: '已失效',
  }
  return statusMap[status] || '待支付'
}

const getAdminBillStatusTagType = (bill) => {
  const status = resolveAdminBillStatus(bill)
  if (status === 'PAID') return 'success'
  if (status === 'REFUNDED') return 'error'
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'default'
  return 'warning'
}

const resolveStagePaymentNodeName = (bill) => {
  const relatedNodeId = Number(bill?.relatedNodeId || 0)
  if (relatedNodeId > 0) {
    const relatedNode = (constructionInfo.value?.nodeDetails || []).find(
      (node) => Number(node?.nodeId || node?.id) === relatedNodeId,
    )
    if (relatedNode?.name) return relatedNode.name
  }

  const rawTitle = String(bill?.billTitle || '').trim()
  if (!rawTitle) return ''
  const titleParts = rawTitle.split(/[:：]/)
  if (titleParts.length > 1) {
    const nodeName = titleParts[titleParts.length - 1].trim()
    if (nodeName) return nodeName
  }
  return rawTitle
}

const getAdminBillDisplayTitle = (bill) => {
  if (bill?.billType === 'BUILD_DEPOSIT') return '建房定金'
  if (bill?.billType === 'STAGE_PAYMENT') {
    return resolveStagePaymentNodeName(bill) || '--'
  }
  return bill?.billTitle || '--'
}

const getBillRelatedNodeName = (bill) => {
  const relatedNodeId = Number(bill?.relatedNodeId || 0)
  if (!relatedNodeId) return '--'

  const relatedNode = (constructionInfo.value?.nodeDetails || []).find(
    (node) => Number(node?.nodeId || node?.id) === relatedNodeId,
  )

  return relatedNode?.name || '--'
}

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

const getConstructionStepStatus = (
  index,
  currentIndex,
  flow = constructionInfo.value,
) => {
  if (isConstructionFlowCompleted(flow)) return 'finish'
  if (index === Number(currentIndex)) return 'process'
  if (index < Number(currentIndex)) return 'finish'
  return 'wait'
}

// 施工派单数据
// 材料派单数据
const showMaterialDispatchModal = ref(false)
const materialDispatchReplacingVendorOrderId = ref(null)
const normalizeMaterialName = (value) => String(value || '').trim()
const isMaterialDispatchOutdated = (row) => {
  const currentName = normalizeMaterialName(row?.name)
  const dispatchedName = normalizeMaterialName(row?.statusData?.materialName)
  if (!row?.statusData || !currentName || !dispatchedName) return false
  return currentName !== dispatchedName
}
const selectedMaterialVendorOption = computed(() =>
  materialVendorOptions.value.find((item) => item.value === materialForm.vendorId) ||
  null,
)

// 重派数据
const showRedispatchModal = ref(false)
const selectedRedispatchVendorOption = computed(() =>
  redispatchVendorOptions.value.find(
    (item) => item.value === redispatchForm.vendorId,
  ) || null,
)

const canOpenDispatchEntry = (item) =>
  Number(item?.orderStatus) !== 5 &&
  (Number(item?.orderStatus) < 4 || Number(item?.paymentStatus) === 2)

const stopDispatchPaymentPolling = () => {
  if (dispatchPaymentPollTimer) {
    window.clearTimeout(dispatchPaymentPollTimer)
    dispatchPaymentPollTimer = null
  }
}

const shouldShowConstructionPricingButton = computed(
  () => Number(detailOrder.value?.orderStatus) < 3,
)

const constructionWorkflowStarted = computed(
  () => Number(detailOrder.value?.orderStatus) >= 3,
)

const constructionPricingButtonText = computed(() => '确认开工金额方案')

const canOpenConstructionPricingEntry = computed(
  () => canDispatch.value && Number(detailOrder.value?.orderStatus) !== 5,
)

const canManageMaterialDispatch = computed(
  () => canDispatch.value && Number(detailOrder.value?.orderStatus) !== 5,
)

const canStartConstructionEntry = computed(
  () =>
    Number(detailOrder.value?.orderStatus) === 2 &&
    canDispatch.value &&
    allServicesAccepted.value &&
    canConfigureConstructionPrice.value &&
    canStartConstruction.value,
)

const canSyncConstructionPricePlan = computed(
  () =>
    constructionWorkflowStarted.value &&
    hasConstructionNodeInstances.value &&
    canConfigureConstructionPrice.value,
)

const shouldShowConstructionProgressButton = computed(
  () => Number(detailOrder.value?.orderStatus) >= 3 && !!constructionInfo.value,
)

const ensureMaterialDispatchEditable = () => {
  if (canManageMaterialDispatch.value) return true
  message.warning('当前订单不可继续材料派单')
  return false
}

const ensureConstructionDispatchEditable = () => {
  if (!canDispatch.value) {
    message.warning('请先上传合同后再派单')
    return false
  }
  if (Number(detailOrder.value?.orderStatus) === 5) {
    message.warning('已取消订单无法继续处理/派单')
    return false
  }
  if (isDispatchStageLocked.value) {
    message.warning('订单已进入施工阶段，施工单位派单已锁定')
    return false
  }
  return true
}

const handleOpenDispatch = async (item) => {
  if (Number(item?.orderStatus) === 5) {
    message.warning('已取消订单无法继续处理/派单')
    return
  }

  showDispatchModal.value = true
  currentDispatchOrder.value = item
  constructionInfo.value = null
  currentNodeDetail.value = null

  await orderManageStore.fetchOrderDetailInternal(item.id)
  orderManageStore.syncDispatchListItem()
  await loadAdminOptionalChangeList(item.id)

  if (!currentContractUrl.value) {
    dispatchTab.value = 'contract'
  } else {
    dispatchTab.value = 'dispatch'
  }

  orderManageStore.resetConstructionForm()
  await orderManageStore.initDispatchState()
  constructionVendorOptions.value = []

  if (Number(detailOrder.value?.orderStatus) >= 3) {
    await loadConstructionStatus()
    dispatchTab.value = hasAdminPaymentBillRows.value ? 'bills' : 'flow'
  }
  stopDispatchPaymentPolling()
}

const handleGoToConstructionPricing = async () => {
  if (!canOpenConstructionPricingEntry.value) {
    message.warning('请先完成合同上传后，再确认开工金额方案')
    return
  }
  dispatchTab.value = 'pricing'
  if (constructionWorkflowStarted.value) {
    await loadConstructionStatus()
  }
}

const handleUpdateConstructionDepositDraft = (amount) => {
  orderManageStore.setConstructionDepositDraft(amount)
}

const handleSaveConstructionDeposit = async (amount) => {
  if (!canConfigureConstructionPrice.value) {
    message.warning('当前账号无权修改建房定金')
    return
  }
  depositSubmitting.value = true
  try {
    const res = await orderManageStore.submitConstructionDepositAmount(amount)
    if (res.code !== 200) {
      message.error(res.msg || '保存建房定金失败')
      return
    }
    await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
    orderManageStore.syncDispatchListItem()
    message.success('建房定金已更新，后续金额方案已按新定金重算')
  } catch (error) {
    message.error(getErrorMessage(error, '保存建房定金失败'))
  } finally {
    depositSubmitting.value = false
  }
}

const handleConfirmConstructionPricing = () => {
  if (!canStartConstructionEntry.value) {
    message.warning('请先完成派单并等待全部服务商接单后，再确认开工金额方案')
    return
  }

  dialog.warning({
    title: '确认金额方案并开启施工',
    content:
      '确认后将调用后端开启施工流程，并按当前订单总价与定金同步施工节点金额。',
    positiveText: '确认开启',
    negativeText: '再检查一下',
    onPositiveClick: async () => {
      planSubmitting.value = true
      try {
        const started = await startConstructionProcess('pricing')
        if (!started) return false

        const res = await orderManageStore.submitConstructionPricePlan()
        if (res.code !== 200) {
          message.error(res.msg || '同步金额方案失败')
          dispatchTab.value = 'pricing'
          return false
        }

        await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
        orderManageStore.syncDispatchListItem()
        await loadConstructionStatus()
        dispatchTab.value = 'bills'
        message.success('金额方案已确认，用户可按当前节点账单继续支付')
        return true
      } finally {
        planSubmitting.value = false
      }
    },
  })
}

const handleSyncConstructionPricePlan = async () => {
  if (!canSyncConstructionPricePlan.value) {
    message.warning('当前订单暂不满足同步金额方案的条件')
    return
  }

  planSubmitting.value = true
  try {
    const res = await orderManageStore.submitConstructionPricePlan()
    if (res.code !== 200) {
      message.error(res.msg || '同步金额方案失败')
      return
    }

    await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
    orderManageStore.syncDispatchListItem()
    await loadConstructionStatus()
    message.success('已按后端规则同步未支付节点金额')
  } catch (error) {
    message.error(getErrorMessage(error, '同步金额方案失败'))
  } finally {
    planSubmitting.value = false
  }
}
const loadBuilders = async () => {
  try {
    await orderManageStore.loadBuilders()
  } catch (e) {
    constructionVendorOptions.value = []
    message.warning('加载建筑商失败')
  }
}

const submitConstructionDispatch = async () => {
  if (!ensureConstructionDispatchEditable()) return
  try {
    const res = await orderManageStore.createConstructionDispatch()
    if (res.code === 200 || res.type) {
      message.success('施工派单成功')
      await orderManageStore.initDispatchState()
    } else {
      message.error(res.msg || '派单失败')
    }
  } catch (err) {
    message.error(getErrorMessage(err, '施工派单失败'))
  }
}

const materialColumns = [
  { title: '材料分类', key: 'category' },
  { title: '具体产品', key: 'name' },
  {
    title: '状态/服务商',
    key: 'statusInfo',
    render(row) {
      if (row.statusData) {
        const statusInfo = getVendorStatusInfo(row.statusData.orderStatus)
        return h('div', { class: 'status-with-reason' }, [
          h(
            NTag,
            {
              type: statusInfo.type,
              size: 'small',
            },
            { default: () => statusInfo.text },
          ),
          h(
            'span',
            { style: { fontSize: '12px', color: '#666', marginLeft: '6px' } },
            row.statusData.companyName || `ID:${row.statusData.vendorOrderId}`,
          ),
          hasVendorRejectReason(row.statusData)
            ? h(
                NButton,
                {
                  size: 'tiny',
                  tertiary: true,
                  type: 'warning',
                  style: { marginLeft: '6px' },
                  onClick: () =>
                    showVendorReasonDialog(row.statusData.vendorNotes),
                },
                { default: () => '查看拒绝理由' },
              )
            : null,
          isMaterialDispatchOutdated(row)
            ? h(
                NTag,
                {
                  size: 'small',
                  type: 'warning',
                  bordered: false,
                  style: { marginLeft: '6px' },
                },
                { default: () => '选配已变更' },
              )
            : null,
        ])
      } else {
        return h(
          NTag,
          { type: 'default', size: 'small' },
          { default: () => '待派单' },
        )
      }
    },
  },
  {
    title: '成交价格',
    key: 'priceInfo',
    render(row) {
      return row.statusData ? `¥${row.statusData.price}` : '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      if (!canManageMaterialDispatch.value) {
        return h(
          'span',
          { style: { color: '#999', fontSize: '12px' } },
          '不可派单',
        )
      }

      if (row.statusData) {
        const status = row.statusData.orderStatus
        const outdated = isMaterialDispatchOutdated(row)

        if (outdated && [1, 3].includes(status)) {
          return h(
            NButton,
            {
              type: 'warning',
              size: 'small',
              onClick: () =>
                openMaterialDispatch(row, row.statusData.vendorOrderId),
            },
            { default: () => '更换服务商' },
          )
        } else if (status === 0) {
          return h(
            NButton,
            {
              type: 'warning',
              size: 'small',
              onClick: () => handleReDispatch(row.statusData.vendorOrderId),
            },
            { default: () => '重新派单' },
          )
        } else if ([1, 3].includes(status)) {
          return h(
            NButton,
            {
              type: 'error',
              size: 'small',
              onClick: () => handlePreCancel(row.statusData.vendorOrderId),
            },
            { default: () => '取消' },
          )
        } else {
          return h(
            'span',
            { style: { color: '#999', fontSize: '12px' } },
            '不可操作',
          )
        }
      } else {
        return h(
          NButton,
          {
            type: 'primary',
            size: 'small',
            onClick: () => openMaterialDispatch(row),
          },
          { default: () => '指派' },
        )
      }
    },
  },
]

const openMaterialDispatch = async (row, replacingVendorOrderId = null) => {
  if (!ensureMaterialDispatchEditable()) return
  showMaterialDispatchModal.value = true
  materialDispatchReplacingVendorOrderId.value = Number(replacingVendorOrderId) || null

  try {
    await orderManageStore.prepareMaterialDispatch(row)
    if (!materialVendorOptions.value.length) {
      materialVendorOptions.value = []
      message.info('未找到匹配的供应商')
    }
  } catch (error) {
    materialVendorOptions.value = []
    message.error('加载供应商失败')
  }
}

const openRedispatchModal = async (vendorOrder) => {
  if (!ensureMaterialDispatchEditable()) return
  showRedispatchModal.value = true

  try {
    await orderManageStore.prepareRedispatch(vendorOrder)
    if (!redispatchVendorOptions.value.length) {
      message.info('未找到可重派的服务商')
    }
  } catch (error) {
    redispatchVendorOptions.value = []
    message.error(getErrorMessage(error, '加载重派服务商失败'))
  }
}

const submitRedispatch = async () => {
  if (!ensureMaterialDispatchEditable()) return
  redispatchSubmitting.value = true
  try {
    const updateRes = await orderManageStore.submitRedispatch()
    if (updateRes.code !== 200) {
      message.error(updateRes.msg || '重派失败')
      return
    }
    message.success('重新派单成功')
    showRedispatchModal.value = false
    orderManageStore.resetRedispatchForm()
    await orderManageStore.initDispatchState()
  } catch (error) {
    message.error(getErrorMessage(error, '重新派单失败'))
  } finally {
    redispatchSubmitting.value = false
  }
}

const submitMaterialDispatch = async () => {
  if (!ensureMaterialDispatchEditable()) return
  try {
    if (materialDispatchReplacingVendorOrderId.value) {
      orderManageStore.prepareCancelVendorOrder(
        materialDispatchReplacingVendorOrderId.value,
      )
      cancelReason.value = `同分类选配已调整为「${currentTarget.value.name || '当前产品'}」，取消旧服务商后重新派单`
      const cancelRes = await orderManageStore.cancelCurrentVendorOrder()
      if (cancelRes.code !== 200) {
        message.error(cancelRes.msg || '取消旧派单失败')
        return
      }
    }

    const res = await orderManageStore.createMaterialDispatch()
    if (res.code === 200 || res.type) {
      message.success('材料派单成功')
      showMaterialDispatchModal.value = false
      materialDispatchReplacingVendorOrderId.value = null
      await orderManageStore.initDispatchState()
    } else {
      message.error(res.msg || '派单失败')
    }
  } catch (err) {
    message.error(getErrorMessage(err, '材料派单失败'))
  }
}

const handlePreCancel = (vendorOrderId) => {
  if (!ensureMaterialDispatchEditable()) return
  orderManageStore.prepareCancelVendorOrder(vendorOrderId)
  showCancelModal.value = true
}

const handleReDispatch = (vendorOrderId) => {
  if (!ensureMaterialDispatchEditable()) return
  const sourceOrder =
    activeConstructionOrder.value?.vendorOrderId === vendorOrderId
      ? activeConstructionOrder.value
      : materialDispatchList.value.find(
          (item) => item.statusData?.vendorOrderId === vendorOrderId,
        )?.statusData

  if (!sourceOrder) {
    message.warning('未找到可重派的服务商订单')
    return
  }

  openRedispatchModal(sourceOrder)
}

const submitCancel = async () => {
  try {
    const res = await orderManageStore.cancelCurrentVendorOrder()
    if (res.code === 200) {
      message.success('已取消该派单')
      showCancelModal.value = false
      await orderManageStore.initDispatchState()
    } else {
      message.error(res.msg || '取消失败')
    }
  } catch (err) {
    message.error(getErrorMessage(err, '请求异常'))
  }
}

// --- 施工流程功能 ---
const loadConstructionStatus = async () => {
  try {
    await orderManageStore.loadConstructionStatus()
  } catch (e) {
    console.error('加载施工状态失败', e)
  }
}

watch(dispatchTab, (newVal) => {
  if (
    newVal === 'pricing' ||
    newVal === 'flow' ||
    newVal === 'bills'
  ) {
    loadConstructionStatus()
  }
  if (newVal === 'optionalChange') {
    loadAdminOptionalChangeList()
  }
})

watch(
  () => canDispatch.value,
  (enabled) => {
    if (enabled) {
      stopDispatchPaymentPolling()
    }
  },
)

watch(showDispatchModal, (show) => {
  if (!show) {
    stopDispatchPaymentPolling()
    optionalChangeRecords.value = []
    closeOptionalChangeAuditModal()
  }
})

watch(showOptionalChangeAuditModal, (show) => {
  if (!show) {
    currentOptionalChangeAuditRecord.value = null
    optionalChangePaymentRecordOptions.value = []
    resetOptionalChangeAuditForm()
  }
})

watch(
  () => optionalChangeAuditForm.mode,
  (mode) => {
    if (mode === 'refund' && showOptionalChangeAuditModal.value) {
      loadOptionalChangePaymentRecordOptions()
      return
    }

    if (mode !== 'refund') {
      optionalChangeAuditForm.paymentRecordId = null
      optionalChangePaymentRecordOptions.value = []
    }
  },
)

watch(
  () => currentOptionalChangeAllowedModes.value.join('|'),
  () => {
    if (!showOptionalChangeAuditModal.value) return
    if (
      !currentOptionalChangeAllowedModes.value.includes(
        optionalChangeAuditForm.mode,
      )
    ) {
      optionalChangeAuditForm.mode = resolveOptionalChangeAuditMode(
        currentOptionalChangeAuditRecord.value,
      )
    }
  },
)

watch(showMaterialDispatchModal, (show) => {
  if (!show) {
    orderManageStore.resetMaterialDispatchForm()
    materialVendorOptions.value = []
    materialDispatchReplacingVendorOrderId.value = null
  }
})

watch(showRedispatchModal, (show) => {
  if (!show) {
    orderManageStore.resetRedispatchForm()
  }
})

const startConstructionProcess = async (nextTab = 'dispatch') => {
  try {
    const res = await orderManageStore.startConstructionProcess(
      currentDispatchOrder.value.id,
    )
    if (res.code === 200) {
      message.success('施工节点已初始化，正在同步节点金额')
      await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
      orderManageStore.syncDispatchListItem()
      await orderManageStore.initDispatchState()
      await loadConstructionStatus()
      dispatchTab.value = nextTab
      return true
    }
    message.error(res.msg || '开启失败')
    return false
  } catch (error) {
    const errorMsg =
      error?.msg || error?.response?.data?.msg || error?.message || ''
    const alreadyStarted =
      errorMsg.includes('已在进行中') || errorMsg.includes('请勿重复开启')
    if (alreadyStarted) {
      message.warning('检测到施工节点已初始化，正在同步节点数据...')
      await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
      orderManageStore.syncDispatchListItem()
      await orderManageStore.initDispatchState()
      await loadConstructionStatus()
      dispatchTab.value = nextTab
      return true
    }
    console.error(error)
    message.error(errorMsg || '初始化施工节点失败')
    return false
  }
}

// 点击节点加载详情
const handleNodeClick = async (node) => {
  try {
    await orderManageStore.handleNodeClick(node)
  } catch (e) {
    message.error('加载节点详情失败')
  }
}

// --- 审核相关逻辑 (新增) ---

// 计算是否显示审核按钮：当前节点状态为1(平台审核中) 且 选中的是当前进度节点
const isPendingAudit = computed(() => {
  if (!constructionInfo.value || !constructionInfo.value.nodeDetails)
    return false
  // 状态码1代表平台审核中
  if (
    Number(constructionInfo.value.currentNodeStatus) !==
    CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT
  ) {
    return false
  }

  // 确保当前查看的是正在进行的节点
  const activeNodeId =
    constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex]
      ?.nodeId
  // 如果详情数据还没加载出来，则不显示
  if (!currentNodeDetail.value) return false

  return currentNodeDetail.value.nodeId === activeNodeId
})

const handleAuditPass = () => {
  dialog.success({
    title: '审核通过',
    content: '确定通过当前施工节点的验收吗？',
    positiveText: '通过',
    negativeText: '取消',
    onPositiveClick: async () => {
      await submitAudit(true)
    },
  })
}

const handleAuditReject = () => {
  auditRejectReason.value = ''
  showAuditRejectModal.value = true
}

const submitAudit = async (pass, reason = '') => {
  try {
    const res = await orderManageStore.submitAudit(pass, reason)
    if (res.code === 200) {
      message.success(pass ? '审核通过' : '已驳回')
      showAuditRejectModal.value = false
      // 刷新整体流程状态
      await loadConstructionStatus()
      await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
      orderManageStore.syncDispatchListItem()
      // 刷新当前节点详情
      await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch (e) {
    console.error(e)
    message.error(getErrorMessage(e, '审核请求异常'))
  }
}

onMounted(() => {
  orderManageStore.initMetadata().catch((error) => {
    console.error('初始化元数据失败', error)
  })
  fetchData()
})

onBeforeUnmount(() => {
  stopDispatchPaymentPolling()
  orderManageStore.clearState()
})
</script>

<style lang="scss" scoped>
/* 保持原有样式不变 */
.page-container {

  min-height: 100%;
}
.filter-container {
  margin-bottom: 16px;
  overflow-x: auto;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 760px;
}

.filter-item {
  flex: 0 0 auto;
}

.filter-item-keyword {
  width: 280px;
}

.filter-item-select {
  width: 180px;
}

.filter-item-action {
  width: 96px;
}
.todo-overview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.todo-filter-tag {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(39, 110, 61, 0.16);
  background: #f6faf7;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}
.todo-filter-tag:hover {
  border-color: rgba(39, 110, 61, 0.34);
  color: var(--color-brand-700);
}
.todo-filter-tag.is-active {
  background: linear-gradient(135deg, #276e3d 0%, #1f5a31 100%);
  border-color: #276e3d;
  color: #fff;
  box-shadow: 0 8px 18px rgba(39, 110, 61, 0.18);
}
.todo-filter-tag__text {
  line-height: 1;
}
.todo-filter-tag__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(39, 110, 61, 0.1);
  color: var(--color-brand-700);
  font-size: 11px;
  font-weight: 700;
}
.todo-filter-tag.is-active .todo-filter-tag__count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.todo-filter-tag__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #d03050;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0 0 2px #fff;
}
.todo-filter-tag.is-active .todo-filter-tag__badge {
  box-shadow: 0 0 0 2px rgba(39, 110, 61, 0.9);
}
.todo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.todo-toolbar__summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.todo-toolbar__label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.order-list {
  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: minmax(180px, 1.5fr) minmax(90px, 1fr) minmax(
        120px,
        1.2fr
      ) minmax(100px, 1fr) minmax(100px, 1fr) 330px;
    gap: 12px;
    padding: 14px 20px;
    align-items: center;
    min-width: 1030px;
  }
  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-secondary);
  }
  .actions {
    justify-content: center;
  }
}
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.status-row {
  display: flex;
  gap: 10px;
}
.select-wrapper {
  display: flex;
  align-items: center;
  .label {
    width: 90px;
    font-size: 13px;
    color: var(--color-text-secondary);
    text-align: right;
    margin-right: 8px;
  }
}
.inline-alert-sm {
  margin-bottom: 10px;
}
.inline-alert-md {
  margin-bottom: 16px;
}
.inline-alert-lg {
  margin-bottom: 20px;
}
.full-width {
  width: 100%;
}
.full-width-input {
  width: 100%;
}
.accent-text-strong {
  font-weight: 700;
  color: var(--color-brand-700);
}
.tag-gap-right {
  margin-right: 8px;
}
.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.center-text {
  text-align: center;
}
.upload-dragger-icon {
  margin-bottom: 12px;
}
.upload-dragger-text {
  font-size: 16px;
}
.dispatch-alert-accent {
  font-weight: 700;
  color: var(--color-brand-700);
  margin-left: 10px;
}
.vendor-reason-btn {
  margin-left: 6px;
}
.dispatch-card-actions {
  margin-top: 10px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.dispatch-vendor-select {
  width: 300px;
}
.dispatch-price-input {
  width: 150px;
}
.dispatch-note-input {
  width: 200px;
}
.pricing-entry-wrap {
  margin-top: 30px;
}
.pricing-entry-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.pricing-entry-hint {
  text-align: center;
  margin-top: 12px;
  color: #c14545;
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
.construction-progress-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-soft);
  display: flex;
  justify-content: flex-end;
}
.audit-reject-wrap {
  margin-top: 10px;
}
.contract-section {
  min-height: 250px;
  padding: 10px;
}
.contract-preview-image {
  border: 1px solid var(--color-border-soft);
  padding: 4px;
  border-radius: 4px;
  background: var(--color-surface);
}
.contract-link-actions {
  margin-top: 8px;
  text-align: center;
}
.empty-state {
  padding: 40px;
  display: flex;
  justify-content: center;
}
.house-info-section {
  background-color: var(--color-surface-soft);
  padding: 15px;
  border-radius: var(--radius-sm);
  margin: 15px 0;
  border: 1px solid var(--color-border-soft);
}
.order-address-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.address-preview {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  line-height: 1.6;
  word-break: break-all;
}

/* 预览和上传样式 */
.preview-area {
  margin-bottom: 20px;
  background: var(--color-surface-soft);
  padding: 15px;
  border-radius: var(--radius-sm);
  border: 1px dashed rgba(39, 110, 61, 0.26);
}
.preview-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--color-text-primary);
}
.file-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  width: 250px;
}

/* 新增：派单面板样式 */
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
.flow-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: linear-gradient(180deg, #f8fbf8 0%, #f4f8f5 100%);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
}
.flow-header__title {
  font-weight: 700;
  font-size: 16px;
  margin-right: 12px;
  color: var(--color-text-primary);
}
.flow-header__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.flow-header__summary {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.flow-header__tip {
  font-size: 13px;
  color: var(--color-text-muted);
}
.flow-workbench {
  padding: 0 20px 20px;
}
.workbench-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.workbench-stat {
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
}
.workbench-stat__label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}
.workbench-stat__value {
  font-size: 22px;
  font-weight: 600;
  color: #111;
}
.workbench-stat__value--ok {
  color: var(--color-brand-700);
}
.workbench-stat__value--danger {
  color: #d03050;
}
.workbench-alert {
  margin-bottom: 16px;
}
.workbench-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.workbench-toolbar__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.node-price-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.node-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}
.node-price-main {
  min-width: 220px;
  flex: 1;
}
.node-price-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.node-price-title {
  font-size: 15px;
  font-weight: 600;
  color: #111;
}
.node-price-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.node-price-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.node-price-input {
  width: 170px;
}
.node-price-saved {
  font-size: 12px;
  color: var(--color-text-muted);
}
.node-price-readonly {
  min-width: 170px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  border: 1px dashed var(--color-border-soft);
  color: var(--color-brand-700);
  font-size: 13px;
  font-weight: 600;
}
.flow-confirm-actions {
  padding: 0 20px 20px;
  display: flex;
  justify-content: flex-end;
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
.optional-change-audit-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
.flow-steps__step {
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
.flow-step-summary {
  font-size: 13px;
  color: #888;
}
.flow-step-summary__current {
  color: var(--color-brand-700);
  font-weight: 700;
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
.section-block {
  background: linear-gradient(180deg, #f8fbf8 0%, #f4f7f4 100%);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-soft);
  margin-bottom: 20px;
}
.status-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: 16px;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-xs);
}
.status-with-reason {
  display: inline-flex;
  align-items: center;
}
.vendor-option-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
/* 覆盖 Naive UI 原生 Data Table 的样式统一为绿色主题 */
::v-deep(.n-data-table) {
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-sm) !important;
  border: none !important;

  .n-data-table-th {
    background: linear-gradient(
      135deg,
      var(--color-brand-700) 0%,
      var(--color-brand-900) 100%
    ) !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    border-bottom: none !important;
  }

  .n-data-table-tr:not(.n-data-table-tr--summary):hover {
    .n-data-table-td {
      background-color: rgba(39, 110, 61, 0.05) !important;
    }
  }
}

@media (max-width: 992px) {
  .filter-row {
    min-width: 0;
    flex-wrap: wrap;
  }

  .filter-item-keyword,
  .filter-item-select,
  .filter-item-action {
    width: calc(50% - 6px);
    min-width: 0;
  }

  .dispatch-vendor-select,
  .dispatch-price-input,
  .dispatch-note-input {
    width: 100%;
  }

  .admin-payment-bills-head,
  .admin-payment-bills-row {
    grid-template-columns: 1.2fr 0.9fr 0.9fr 0.8fr 1fr 0.9fr 0.8fr;
  }

  .flow-steps {
    padding: 0 8px;
  }
}

@media (max-width: 768px) {
  .filter-container {
    overflow: visible;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filter-item-keyword,
  .filter-item-select,
  .filter-item-action {
    width: 100%;
  }

  .filter-item-action :deep(.n-button) {
    width: 100%;
  }

  .order-list {
    .list-header,
    .list-row {
      min-width: 1030px;
    }
  }

  .info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .status-row,
  .modal-footer-actions,
  .dispatch-card-actions,
  .construction-progress-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .modal-footer-actions,
  .dispatch-card-actions,
  .construction-progress-actions,
  .flow-confirm-actions {
    justify-content: stretch;
  }

  .modal-footer-actions > *,
  .dispatch-card-actions > *,
  .construction-progress-actions > *,
  .flow-confirm-actions > * {
    flex: 1 1 100%;
  }

  .select-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;

    .label {
      width: auto;
      text-align: left;
      margin-right: 0;
    }
  }

  .flow-header,
  .flow-highlight-card__body,
  .node-price-row,
  .workbench-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .flow-workbench,
  .flow-steps,
  .flow-confirm-actions {
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

  .admin-optional-change-card {
    padding: 14px;
  }

  .admin-optional-change-card__header,
  .optional-change-audit-modal__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-optional-change-card__snapshots {
    grid-template-columns: 1fr;
  }

  .dispatch-panel {
    padding: 4px 2px 8px;
    max-height: calc(85vh - 180px);
  }

  .todo-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .contract-section,
  .section-block,
  .status-card,
  .house-info-section {
    padding: 14px;
  }

  .file-link-card {
    width: 100%;
  }

  .flow-node-timeline {
    max-height: 320px;
  }
}

@media (max-width: 576px) {
  .todo-filter-tag {
    min-height: 32px;
    padding: 0 12px;
    font-size: 12px;
  }

  .workbench-stats {
    grid-template-columns: 1fr;
  }

  .flow-highlight-card__title {
    font-size: 17px;
  }

  .upload-dragger-text {
    font-size: 14px;
  }
}
</style>
