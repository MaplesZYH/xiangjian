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
        <div class="header-item">当前待办</div>
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
            <div class="list-item todo-cell">
              <n-tag
                size="small"
                :type="getOrderTodoMeta(item).type"
                :bordered="false"
              >
                {{ getOrderTodoMeta(item).label }}
              </n-tag>
              <span class="todo-cell__desc">
                {{ getOrderTodoMeta(item).description }}
              </span>
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
          }}”，仅在“未派单”或“派单中”状态下可修改基础信息和选配。
        </n-alert>
        <n-alert
          v-else-if="isOptionalProductsLocked"
          type="warning"
          class="inline-alert-sm"
        >
          合同已上传，订单地址与选配产品无法更改。
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
                  :disabled="isReadOnly || isOptionalProductsLocked"
                  placeholder="请选择省 / 市 / 区"
                  @update:value="handleOrderRegionUpdate"
                />
                <n-input
                  v-model:value="orderAddressForm.detail"
                  type="textarea"
                  :rows="2"
                  maxlength="120"
                  show-count
                  :disabled="isReadOnly || isOptionalProductsLocked"
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
                  :disabled="isReadOnly || isOptionalProductsLocked"
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
                只有上传合同后，用户才能进行支付。重新上传将覆盖原有合同。
              </n-alert>
              <n-alert
                v-if="
                  currentContractUrl &&
                  !isDispatchPaymentReady(detailOrder?.paymentStatus)
                "
                type="warning"
                class="inline-alert-md"
              >
                合同已上传，正在等待用户支付后解锁派单。当前支付状态：{{
                  getPaymentText(detailOrder?.paymentStatus)
                }}
              </n-alert>
              <n-alert
                v-else-if="
                  currentContractUrl &&
                  isDispatchPaymentReady(detailOrder?.paymentStatus)
                "
                type="success"
                class="inline-alert-md"
              >
                用户已完成支付，当前订单已解锁派单。
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
                {{
                  currentContractUrl
                    ? `合同已上传，需等待用户完成支付后才能派单。当前支付状态：${getPaymentText(detailOrder?.paymentStatus)}`
                    : '需先上传合同，上传后等待用户支付完成才能派单。'
                }}
              </n-alert>

              <n-alert
                v-else-if="isDispatchStageLocked"
                type="warning"
                class="inline-alert-md"
              >
                当前订单已进入施工阶段，派单信息已锁定，仅支持查看，不可再新增、取消或重新指派服务商。
              </n-alert>

              <n-alert v-else type="info" class="inline-alert-md">
                用户已完成支付，系统将自动推荐距离最近的可派单服务商。
                <span
                  v-if="allServicesAccepted"
                  class="dispatch-alert-accent"
                >
                  所有服务商已接单，可进入节点金额设置。
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
                        <div
                          v-if="selectedConstructionVendorOption?.raw"
                          class="vendor-option-hint"
                        >
                          {{
                            `${selectedConstructionVendorOption.raw.companyName} · ${getVendorServiceTypeText(selectedConstructionVendorOption.raw.serviceType)} · ${formatVendorDistance(selectedConstructionVendorOption.raw.distance)}`
                          }}
                        </div>
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
                <n-button
                  v-if="shouldShowConstructionPricingButton"
                  type="success"
                  size="large"
                  :disabled="!canEnterConstructionPricingStep"
                  @click="handleGoToConstructionPricing"
                >
                  <template #icon>
                    <n-icon><HammerOutline /></n-icon>
                  </template>
                  {{ constructionPricingButtonText }}
                </n-button>
                <div
                  v-if="
                    shouldShowConstructionPricingButton &&
                    !canEnterConstructionPricingStep
                  "
                  class="pricing-entry-hint"
                >
                  {{
                    !allServicesAccepted
                      ? '请等待所有服务商接单后，再进入节点金额设置。'
                      : !canStartConstruction && !canConfigureConstructionPrice
                        ? '当前账号无权管理施工金额或初始化施工节点，请联系管理员'
                        : '当前订单尚未达到可设置施工节点金额的状态'
                  }}
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="pricing"
            tab="3. 节点金额设置"
            :disabled="!canOpenConstructionPricingTab"
          >
            <div class="dispatch-panel">
              <n-spin :show="loadingConstruction">
                <div v-if="constructionInfo">
                  <n-alert type="info" class="inline-alert-md">
                    当前流程顺序：配置并保存节点金额 -> 进入施工流程执行上传、审核与支付。
                  </n-alert>
                  <div
                    class="flow-header"
                  >
                    <div>
                      <span class="flow-header__title">
                        施工方式：{{
                          getProcessText(
                            constructionInfo.processType,
                            constructionInfo.processName,
                            detailOrder?.structureInfo?.constructionMethod,
                          )
                        }}
                      </span>
                      <n-tag size="small" type="info">
                        {{ constructionInfo.currentNodeStatusText || '未开始' }}
                      </n-tag>
                    </div>
                    <div class="flow-header__meta">
                      <div class="flow-header__summary">
                        已支付：¥{{
                          constructionInfo.totalPaid?.toLocaleString()
                        }}
                        / 总额：¥{{
                          constructionInfo.totalAmount?.toLocaleString()
                        }}
                      </div>
                      <div class="flow-header__tip">
                        请先完成全部节点金额配置并保存，保存完成后再进入第 4 步施工流程
                      </div>
                    </div>
                  </div>

                  <div class="flow-workbench">
                    <n-card
                      class="flow-workbench-card"
                      size="small"
                      title="节点金额配置工作台"
                      :bordered="true"
                    >
                      <template #header-extra>
                        <n-tag
                          :type="
                            constructionPricePlanReady
                              ? 'success'
                              : constructionPricePlanDirty
                                ? 'warning'
                                : 'default'
                          "
                          size="small"
                        >
                          {{ constructionPricePlanStatusText }}
                        </n-tag>
                      </template>

                      <div class="workbench-stats">
                        <div class="workbench-stat">
                          <div class="workbench-stat__label">订单总额</div>
                          <div class="workbench-stat__value">
                            ¥{{ formatCurrencyAmount(priceLimitTotal) }}
                          </div>
                        </div>
                        <div class="workbench-stat">
                          <div class="workbench-stat__label">已锁定金额</div>
                          <div class="workbench-stat__value">
                            ¥{{ formatCurrencyAmount(lockedNodePriceTotal) }}
                          </div>
                        </div>
                        <div class="workbench-stat">
                          <div class="workbench-stat__label">当前已分配</div>
                          <div class="workbench-stat__value">
                            ¥{{ formatCurrencyAmount(constructionAssignedTotal) }}
                          </div>
                        </div>
                        <div class="workbench-stat">
                          <div class="workbench-stat__label">剩余待分配</div>
                          <div
                            class="workbench-stat__value"
                            :class="
                              constructionRemainingAmount === 0
                                ? 'workbench-stat__value--ok'
                                : 'workbench-stat__value--danger'
                            "
                          >
                            ¥{{ formatCurrencyAmount(constructionRemainingAmount) }}
                          </div>
                        </div>
                      </div>

                      <n-alert
                        :type="
                          isConstructionPriceLocked
                            ? 'info'
                            : constructionPricePlanReady
                              ? 'success'
                              : 'warning'
                        "
                        class="workbench-alert"
                      >
                        {{
                          isConstructionPriceLocked
                            ? constructionPricePlanHint
                            : constructionPricePlanReady
                            ? '节点金额已完成配置，后续施工、审核、支付将按该分配执行。'
                            : constructionPricePlanHint
                        }}
                      </n-alert>

                      <div class="workbench-toolbar">
                        <div class="workbench-toolbar__hint">
                          先统一规划并保存全部未锁定节点金额。已完成或已支付节点金额不可修改。
                        </div>
                        <n-space>
                          <n-button
                            secondary
                            :disabled="isConstructionPriceLocked"
                            @click="applyBalancedNodePricePlan"
                          >
                            按剩余总额均分
                          </n-button>
                          <n-button
                            secondary
                            :disabled="isConstructionPriceLocked"
                            @click="resetEditableNodePriceDraft"
                          >
                            重置未锁定节点
                          </n-button>
                          <n-button
                            type="primary"
                            :loading="savingNodePriceId === '__all__'"
                            :disabled="
                              isConstructionPriceLocked ||
                              !editableConstructionNodes.length ||
                              !canConfigureConstructionPrice
                            "
                            @click="submitConstructionPricePlan"
                          >
                            保存全部节点金额
                          </n-button>
                        </n-space>
                      </div>

                      <div class="node-price-list">
                        <div
                          v-for="(node, index) in constructionInfo.nodeDetails"
                          :key="`price-row-${node.nodeId}`"
                          class="node-price-row"
                        >
                          <div class="node-price-main">
                            <div class="node-price-title-row">
                              <span class="node-price-title">
                                {{ `步骤 ${index + 1} · ${node.name}` }}
                              </span>
                              <n-tag
                                v-if="index === constructionInfo.currentNodeIndex"
                                type="success"
                                size="small"
                              >
                                当前节点
                              </n-tag>
                              <n-tag
                                v-else-if="index < constructionInfo.currentNodeIndex"
                                type="default"
                                size="small"
                              >
                                已锁定
                              </n-tag>
                              <n-tag v-else type="info" size="small">
                                待执行
                              </n-tag>
                              <n-tag
                                v-if="node.isPaid"
                                type="success"
                                size="small"
                                :bordered="false"
                              >
                                已支付
                              </n-tag>
                            </div>
                            <div class="node-price-desc">
                              {{
                                index < constructionInfo.currentNodeIndex
                                  ? '该节点已进入历史流程，金额已锁定。'
                                  : index === constructionInfo.currentNodeIndex
                                    ? '当前节点金额必须大于 0，保存后再进入上传、审核与支付。'
                                    : '后续节点请提前规划金额，避免前面阶段把总额分配完。'
                              }}
                            </div>
                          </div>

                          <div class="node-price-controls">
                            <div class="node-price-saved">
                              已保存：¥{{ formatCurrencyAmount(node.amount) }}
                            </div>
                            <n-input-number
                              v-model:value="editableNodePriceMap[node.nodeId]"
                              :min="0"
                              :precision="2"
                              :disabled="!isNodeAmountEditable(index)"
                              class="node-price-input"
                              placeholder="输入节点金额"
                            >
                              <template #prefix>¥</template>
                            </n-input-number>
                          </div>
                        </div>
                      </div>
                    </n-card>
                  </div>

                  <div class="flow-confirm-actions">
                    <n-button
                      type="success"
                      size="large"
                      :disabled="!constructionPricePlanReady || isConstructionPriceLocked"
                      @click="handleConfirmConstructionFlow"
                    >
                      {{ isConstructionPriceLocked ? '金额已锁定' : '进入施工流程' }}
                    </n-button>
                  </div>
                </div>

                <div v-else class="empty-flow">
                  <n-empty
                    description="施工节点尚未就绪，请先回到第 2 步点击“设置施工节点金额”"
                  />
                </div>
              </n-spin>
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="flow"
            tab="4. 施工流程"
            :disabled="!constructionInfo || !constructionPricePlanReady"
          >
            <div class="dispatch-panel">
              <n-spin :show="loadingConstruction">
                <div v-if="constructionInfo">
                  <n-alert type="info" class="inline-alert-md">
                    当前流程顺序：服务商上传施工照片 -> 平台审核 -> 用户审核 -> 用户支付 -> 自动进入下一节点。
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
                                <div class="flow-step-summary__amount">
                                  金额：¥{{ node.amount?.toLocaleString() }}
                                  <n-tag
                                    v-if="node.isPaid"
                                    type="success"
                                    size="tiny"
                                    :bordered="false"
                                    >已支付</n-tag
                                  >
                                </div>
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
                            >
                              <n-descriptions-item label="节点金额">
                                <span class="flow-node-amount">
                                  ¥{{ formatCurrencyAmount(currentNodeDetail.amount) }}
                                </span>
                              </n-descriptions-item>
                              <n-descriptions-item label="支付状态">
                                <n-tag
                                  :type="currentNodeDetail.isPaid ? 'success' : 'warning'"
                                  size="small"
                                >
                                  {{ currentNodeDetail.isPaid ? '已支付' : '待支付' }}
                                </n-tag>
                              </n-descriptions-item>
                            </n-descriptions>

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
                    description="请先在“节点金额设置”中完成金额配置并进入施工流程"
                  />
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
      v-model:show="showMaterialDispatchModal"
      preset="card"
      :title="`指派供应商 - ${currentTarget.category} (${currentTarget.name})`"
      style="width: min(500px, calc(100vw - 24px))"
    >
      <n-alert
        :type="isDispatchStageLocked ? 'warning' : 'info'"
        class="inline-alert-md"
      >
        {{
          isDispatchStageLocked
            ? '当前订单已进入施工阶段，材料派单已锁定。'
            : '可选择“材料商”或“综合服务商”类型的公司，价格为本次材料子单的成交价。'
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
            :disabled="isDispatchStageLocked"
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
            :disabled="isDispatchStageLocked"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="materialForm.adminNotes"
            type="textarea"
            placeholder="备注 (可选)"
            :disabled="isDispatchStageLocked"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer-actions">
          <n-button @click="showMaterialDispatchModal = false">取消</n-button>
          <n-button
            type="primary"
            :disabled="isDispatchStageLocked"
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
      <n-alert type="warning" class="inline-alert-md">
        {{
          isDispatchStageLocked
            ? '当前订单已进入施工阶段，重新指派入口已锁定，仅保留查看。'
            : `当前服务商：${redispatchTarget.currentVendorName || '未记录'}。请选择新的公司并确认成交价格。`
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
            :disabled="isDispatchStageLocked"
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
            :disabled="isDispatchStageLocked"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="派单备注">
          <n-input
            v-model:value="redispatchForm.adminNotes"
            type="textarea"
            placeholder="请输入派单备注"
            :disabled="isDispatchStageLocked"
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
            :disabled="isDispatchStageLocked"
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
import { useAdminOrderManageStore } from '@/stores/order/useAdminOrderManageStore'
import { getEmployeePermissions, hasPermission } from '@/utils/adminAuth'
import { CONSTRUCTION_NODE_STATUS, getProcessText } from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'

const message = useMessage()
const dialog = useDialog()
const orderManageStore = useAdminOrderManageStore()
const pageInfo = orderManageStore.pageInfo
const filters = orderManageStore.filters
const orderAddressForm = orderManageStore.orderAddressForm
const orderRegionCascaderOptions = orderManageStore.orderRegionCascaderOptions
const constructionForm = orderManageStore.constructionForm
const materialForm = orderManageStore.materialForm
const redispatchForm = orderManageStore.redispatchForm
const editableNodePriceMap = orderManageStore.editableNodePriceMap
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
  savingNodePriceId,
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
  isOptionalProductsLocked,
  canDispatch,
  isDispatchStageLocked,
  isConstructionPriceLocked,
  activeConstructionNode,
  currentNodeDetailStatusText,
  priceLimitTotal,
  editableConstructionNodes,
  lockedNodePriceTotal,
  constructionAssignedTotal,
  constructionRemainingAmount,
  constructionPricePlanDirty,
  constructionPricePlanReady,
  constructionPricePlanStatusText,
  constructionPricePlanHint,
  resolvedCurrentNodeAmount,
  allServicesAccepted,
} = storeToRefs(orderManageStore)

const employeePermissions = getEmployeePermissions()
const canStartConstruction = computed(() =>
  hasPermission(employeePermissions, 'construction:admin:start'),
)
const canConfigureConstructionPrice = computed(() =>
  hasPermission(employeePermissions, 'construction:admin:price'),
)
const activeTodoFilter = ref('all')

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
  const paymentStatus = Number(order?.paymentStatus)
  const hasContract = hasUploadedContract(order)

  if (orderStatus === 5) {
    return {
      key: 'cancelled',
      label: '已取消',
      description: '订单已取消，无法继续处理',
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

  if (!hasContract) {
    return {
      key: 'contract',
      label: '待上传合同',
      description: '上传后用户才能继续支付',
      type: 'warning',
      accent: 'warning',
    }
  }

  if (!isDispatchPaymentReady(paymentStatus)) {
    return {
      key: 'payment',
      label: '待用户支付',
      description: '支付完成后才能解锁派单',
      type: 'error',
      accent: 'danger',
    }
  }

  if (orderStatus === 0) {
    return {
      key: 'dispatch',
      label: '待派单',
      description: '可直接进入处理/派单',
      type: 'info',
      accent: 'info',
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

  if (orderStatus === 2) {
    return {
      key: 'pricing',
      label: '待设置金额',
      description: '接单完成后进入节点金额配置',
      type: 'info',
      accent: 'brand',
    }
  }

  if (orderStatus === 3) {
    return {
      key: 'construction',
      label: '施工中跟进',
      description: '关注审核、付款与施工节点',
      type: 'success',
      accent: 'success',
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
    key: 'payment',
    label: '待用户支付',
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
    key: 'pricing',
    label: '待设置金额',
  },
  {
    key: 'construction',
    label: '施工中跟进',
  },
  {
    key: 'cancelled',
    label: '已取消',
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

const handleOpenUnifiedDetail = (item) => {
  showDetailModal.value = true
  isReadOnly.value = ![0, 1].includes(item.orderStatus)
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
      message.success('基础信息与选配修改成功')
      showDetailModal.value = false
      fetchData()
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
        if (isDispatchPaymentReady(detailOrder.value?.paymentStatus)) {
          dispatchTab.value = 'dispatch'
        } else {
          dispatchTab.value = 'contract'
          startDispatchPaymentPolling(orderId)
        }
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
const formatCurrencyAmount = (value) => Number(value || 0).toLocaleString()

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

const isNodeAmountEditable = (index) =>
  !isConstructionPriceLocked.value &&
  Number(index) >= Number(constructionInfo.value?.currentNodeIndex || 0)

// 施工派单数据
const selectedConstructionVendorOption = computed(() =>
  constructionVendorOptions.value.find(
    (item) => item.value === constructionForm.vendorId,
  ) || null,
)

// 材料派单数据
const showMaterialDispatchModal = ref(false)
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

const isDispatchPaymentReady = (status) => [1, 2].includes(Number(status))
const canOpenDispatchEntry = (item) =>
  Number(item?.orderStatus) !== 5 &&
  (Number(item?.orderStatus) < 4 || Number(item?.paymentStatus) === 2)

const stopDispatchPaymentPolling = () => {
  if (dispatchPaymentPollTimer) {
    window.clearTimeout(dispatchPaymentPollTimer)
    dispatchPaymentPollTimer = null
  }
}

const startDispatchPaymentPolling = (orderId, attempts = 40, delay = 3000) => {
  stopDispatchPaymentPolling()
  if (!orderId) return

  const poll = async () => {
    if (!showDispatchModal.value) {
      stopDispatchPaymentPolling()
      return
    }

    await orderManageStore.fetchOrderDetailInternal(orderId)
    orderManageStore.syncDispatchListItem()

    if (isDispatchPaymentReady(detailOrder.value?.paymentStatus)) {
      await orderManageStore.initDispatchState()
      dispatchTab.value = 'dispatch'
      stopDispatchPaymentPolling()
      return
    }

    if (!currentContractUrl.value || attempts <= 1) {
      stopDispatchPaymentPolling()
      return
    }

    attempts -= 1
    dispatchPaymentPollTimer = window.setTimeout(poll, delay)
  }

  dispatchPaymentPollTimer = window.setTimeout(poll, delay)
}

const shouldShowConstructionPricingButton = computed(
  () =>
    Number(detailOrder.value?.orderStatus) === 2 ||
    (Number(detailOrder.value?.orderStatus) >= 3 &&
      !constructionPricePlanReady.value),
)

const constructionPricingButtonText = computed(() =>
  Number(detailOrder.value?.orderStatus) >= 3
    ? '继续设置施工节点金额'
    : '设置施工节点金额',
)

const canEnterConstructionPricingStep = computed(() => {
  if (Number(detailOrder.value?.orderStatus) >= 3) {
    return canStartConstruction.value || canConfigureConstructionPrice.value
  }

  return (
    Number(detailOrder.value?.orderStatus) === 2 &&
    allServicesAccepted.value &&
    (canStartConstruction.value || canConfigureConstructionPrice.value)
  )
})
const canOpenConstructionPricingTab = computed(() => {
  if (!canEnterConstructionPricingStep.value) return false
  if (Number(detailOrder.value?.orderStatus) >= 3) return true
  return !!constructionInfo.value
})

const shouldShowConstructionProgressButton = computed(
  () =>
    Number(detailOrder.value?.orderStatus) >= 3 &&
    constructionPricePlanReady.value &&
    isConstructionPriceLocked.value,
)

const dispatchStageLockMessage = '订单已进入施工阶段，派单信息已锁定'

const ensureDispatchStageEditable = () => {
  if (!isDispatchStageLocked.value) return true
  message.warning(dispatchStageLockMessage)
  return false
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

  if (!currentContractUrl.value) {
    dispatchTab.value = 'contract'
  } else if (!isDispatchPaymentReady(detailOrder.value?.paymentStatus)) {
    dispatchTab.value = 'contract'
  } else {
    dispatchTab.value = 'dispatch'
  }

  orderManageStore.resetConstructionForm()
  await orderManageStore.initDispatchState()
  constructionVendorOptions.value = []

  if (Number(detailOrder.value?.orderStatus) >= 3) {
    await loadConstructionStatus()
    dispatchTab.value =
      constructionPricePlanReady.value && isConstructionPriceLocked.value
        ? 'flow'
        : 'pricing'
  }

  if (
    currentContractUrl.value &&
    !isDispatchPaymentReady(detailOrder.value?.paymentStatus)
  ) {
    startDispatchPaymentPolling(item.id)
  } else {
    stopDispatchPaymentPolling()
  }
}

const handleGoToConstructionPricing = async () => {
  if (!canEnterConstructionPricingStep.value) {
    if (!allServicesAccepted.value) {
      message.warning('请等待所有服务商接单后再进入节点金额设置')
      return
    }
    message.warning('当前订单尚未达到可设置施工节点金额的状态')
    return
  }

  if (constructionInfo.value) {
    dispatchTab.value = 'pricing'
    return
  }

  if (Number(detailOrder.value?.orderStatus) >= 3) {
    dispatchTab.value = 'pricing'
    await loadConstructionStatus()
    return
  }

  if (!canStartConstruction.value) {
    message.error('当前账号无权初始化施工节点，请联系管理员')
    return
  }

  dialog.info({
    title: '进入节点金额设置',
    content:
      '确认所有服务商已接单并进入节点金额设置吗？确认后系统会先初始化当前订单的施工节点，随后请在第 3 步完成全部节点金额配置并保存。',
    positiveText: '进入设置',
    negativeText: '取消',
    onPositiveClick: async () => {
      await startConstructionProcess('pricing')
    },
  })
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
  if (!ensureDispatchStageEditable()) return
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
      if (isDispatchStageLocked.value) {
        return h(
          'span',
          { style: { color: '#999', fontSize: '12px' } },
          '阶段已锁定',
        )
      }

      if (row.statusData) {
        const status = row.statusData.orderStatus

        if (status === 0) {
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

const openMaterialDispatch = async (row) => {
  if (!ensureDispatchStageEditable()) return
  showMaterialDispatchModal.value = true

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
  if (!ensureDispatchStageEditable()) return
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
  if (!ensureDispatchStageEditable()) return
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
  if (!ensureDispatchStageEditable()) return
  try {
    const res = await orderManageStore.createMaterialDispatch()
    if (res.code === 200 || res.type) {
      message.success('材料派单成功')
      showMaterialDispatchModal.value = false
      await orderManageStore.initDispatchState()
    } else {
      message.error(res.msg || '派单失败')
    }
  } catch (err) {
    message.error(getErrorMessage(err, '材料派单失败'))
  }
}

const handlePreCancel = (vendorOrderId) => {
  if (!ensureDispatchStageEditable()) return
  orderManageStore.prepareCancelVendorOrder(vendorOrderId)
  showCancelModal.value = true
}

const handleReDispatch = (vendorOrderId) => {
  if (!ensureDispatchStageEditable()) return
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
  if (newVal === 'pricing' || newVal === 'flow') {
    loadConstructionStatus()
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
  }
})

watch(showMaterialDispatchModal, (show) => {
  if (!show) {
    orderManageStore.resetMaterialDispatchForm()
    materialVendorOptions.value = []
  }
})

watch(showRedispatchModal, (show) => {
  if (!show) {
    orderManageStore.resetRedispatchForm()
  }
})

const startConstructionProcess = async (nextTab = 'pricing') => {
  try {
    const res = await orderManageStore.startConstructionProcess(
      currentDispatchOrder.value.id,
    )
    if (res.code === 200) {
      message.success('施工节点已初始化，请继续设置节点金额')
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
      message.warning('检测到施工节点已初始化，正在进入节点金额设置...')
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

const handleConfirmConstructionFlow = () => {
  if (!currentDispatchOrder.value?.id) {
    message.error('订单信息缺失，无法进入施工流程')
    return
  }
  if (!constructionInfo.value?.nodeDetails?.length) {
    message.warning('请先回到第 2 步点击“设置施工节点金额”，初始化施工节点后再继续')
    return
  }
  if (!constructionPricePlanReady.value) {
    message.warning('请先完成节点金额配置并保存后，再进入施工流程')
    return
  }

  dialog.warning({
    title: '确认进入施工流程',
    content:
      '请确认当前节点金额配置无误。确认后将进入施工流程，节点金额会立即锁定，后续不可再修改。',
    positiveText: '确认进入',
    negativeText: '再检查一下',
    onPositiveClick: async () => {
      orderManageStore.markConstructionPriceLocked(currentDispatchOrder.value.id)
      await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
      orderManageStore.syncDispatchListItem()
      await loadConstructionStatus()
      dispatchTab.value = 'flow'
      message.success('当前价格配置已确认，已进入施工流程')
      return true
    },
  })
}

// 点击节点加载详情
const handleNodeClick = async (node) => {
  try {
    await orderManageStore.handleNodeClick(node)
  } catch (e) {
    message.error('加载节点详情失败')
  }
}

const resetEditableNodePriceDraft = () => {
  orderManageStore.resetEditableNodePriceDraft()
}

const applyBalancedNodePricePlan = () => {
  try {
    const res = orderManageStore.applyBalancedNodePricePlan()
    if (res?.msg) {
      message.success(res.msg)
    }
  } catch (error) {
    message.warning(getErrorMessage(error, '自动分配失败'))
  }
}

const submitConstructionPricePlan = async () => {
  if (!canConfigureConstructionPrice.value) {
    message.error('当前账号无权设置施工节点金额')
    return
  }
  try {
    const res = await orderManageStore.submitConstructionPricePlan()
    if (res.code === 200) {
      message.success('全部节点金额已保存')
      await loadConstructionStatus()
      await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
      orderManageStore.syncDispatchListItem()
      if (currentNodeDetail.value?.nodeId) {
        await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
      }
    } else {
      message.error(res.msg || '设置失败')
    }
  } catch (e) {
    console.error('submitConstructionPricePlan failed', e)
    message.error(getErrorMessage(e, '设置节点金额失败'))
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
  if (!constructionPricePlanReady.value) {
    message.warning('请先到第 3 步“节点金额设置”中完成全部节点金额配置并保存！')
    return
  }

  if (currentNodeDetail.value && resolvedCurrentNodeAmount.value <= 0) {
    message.warning('当前节点金额尚未配置，请先完成金额配置后再审核！')
    return
  }

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
      ) minmax(100px, 1fr) minmax(100px, 1fr) minmax(170px, 1.2fr) 330px;
    gap: 12px;
    padding: 14px 20px;
    align-items: center;
    min-width: 1220px;
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
.todo-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  white-space: normal !important;
}
.todo-cell__desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-text-muted);
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
  text-align: center;
}
.pricing-entry-hint {
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
.flow-step-summary__amount {
  margin-bottom: 4px;
}
.flow-step-summary__current {
  color: var(--color-brand-700);
  font-weight: 700;
}
.flow-node-detail-desc {
  margin-bottom: 16px;
}
.flow-node-amount {
  font-weight: 600;
  color: #111;
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
      min-width: 1220px;
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
