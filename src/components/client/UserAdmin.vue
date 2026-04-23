<template>
  <n-layout :has-sider="!isCompactViewport" class="client-center-layout h-full">
    <n-layout-sider
      v-if="!isCompactViewport"
      bordered
      :width="240"
      :native-scrollbar="false"
      class="client-center-sider h-full"
    >
      <n-card title="用户中心" class="client-center-fill-card">
        <n-menu :options="menuOptions" v-model:value="activeMenu" />
      </n-card>
    </n-layout-sider>

    <n-layout-content class="client-center-content">
      <div class="p-6">
        <n-card
          v-if="isCompactViewport"
          title="用户中心"
          class="client-center-mobile-menu"
        >
          <div class="client-center-mobile-nav">
            <button
              v-for="item in mobileMenuItems"
              :key="item.key"
              type="button"
              class="client-center-mobile-nav__item"
              :class="{ 'is-active': activeMenu === item.key }"
              @click="activeMenu = item.key"
            >
              <span class="client-center-mobile-nav__icon">
                <n-icon size="24">
                  <component :is="item.icon" />
                </n-icon>
              </span>
              <span class="client-center-mobile-nav__label">{{ item.label }}</span>
              <span class="client-center-mobile-nav__desc">
                {{ item.description }}
              </span>
            </button>
          </div>
        </n-card>
        <n-card title="用户管理">
          <n-space vertical>
            <div class="client-center-header">
              <n-h2>欢迎回来，{{ userName }}</n-h2>
            </div>
            <n-p>您现在是用户身份，可以管理您的个人信息、订单和收藏</n-p>

            <div v-if="activeMenu === 'profile'">
              <n-card title="个人信息">
                <n-form
                  ref="formRef"
                  :model="userInfo"
                  class="profile-form"
                  :label-placement="formLabelPlacement"
                  :label-width="isCompactViewport ? undefined : 100"
                >
                  <n-form-item label="姓名">
                    <n-input
                      v-model:value="userInfo.name"
                      placeholder="请输入姓名"
                    />
                  </n-form-item>
                  <n-form-item label="手机号">
                    <n-input
                      v-model:value="userInfo.phone"
                      placeholder="请输入手机号"
                    />
                  </n-form-item>
                  <n-form-item label="地址">
                    <n-cascader
                      v-model:value="selectedProfileRegionCode"
                      @update:value="handleProfileRegionUpdate"
                      :options="profileRegionCascaderOptions"
                      check-strategy="child"
                      filterable
                      clearable
                      placeholder="请选择省 / 市 / 区"
                    />
                  </n-form-item>
                  <n-form-item label="详细地址">
                    <n-input
                      v-model:value="profileAddressForm.detail"
                      type="textarea"
                      placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
                      :rows="2"
                      maxlength="120"
                      show-count
                    />
                  </n-form-item>
                  <n-form-item label="预览地址">
                    <div class="profile-address-preview client-center-preview">
                      {{
                        profileAddressPreview ||
                        '请先选择施工行政区并填写详细门牌地址'
                      }}
                    </div>
                  </n-form-item>
                  <n-p
                    v-if="!canViewUserProfile || !canUpdateUserProfile"
                    depth="3"
                    class="client-center-helper-text"
                  >
                    当前账号缺少资料管理权限，个人信息仅本地展示/保存。
                  </n-p>
                  <div class="client-center-form-actions">
                    <n-button @click="fetchUserInfo">重置/刷新</n-button>
                    <n-button
                      type="primary"
                      :loading="saving"
                      @click="saveUserInfo"
                      >{{ saveProfileButtonText }}</n-button
                    >
                  </div>
                </n-form>
              </n-card>
            </div>

            <div v-if="activeMenu === 'orders'">
              <n-card title="我的订单">
                <template #header-extra>
                  <n-button
                    size="small"
                    type="info"
                    secondary
                    @click="openOrderPaymentStatementModal"
                  >
                    支付协议
                  </n-button>
                </template>
                <n-tabs
                  v-model:value="activeOrderStatusTag"
                  type="line"
                  animated
                  class="user-order-tabs"
                >
                  <n-tab-pane
                    v-for="item in orderStatusFilterTabs"
                    :key="item.key"
                    :name="item.key"
                  >
                    <template #tab>
                      <span class="user-order-tab-label">
                        <span>{{ item.label }}</span>
                        <n-badge
                          v-if="item.showBadge"
                          :value="item.badgeCount"
                          :max="999"
                          color="#d03050"
                          class="user-order-tab-badge"
                        />
                      </span>
                    </template>
                  </n-tab-pane>
                </n-tabs>
                <div class="order-table-wrap">
                  <n-spin :show="loadingOrders">
                    <div
                      v-if="visibleOrderList.length > 0"
                      class="order-list-table client-center-paper"
                    >
                      <div class="order-list-table__head">
                        <div>订单号</div>
                        <div>产品名称</div>
                        <div>订单状态</div>
                        <div>支付状态</div>
                        <div>操作</div>
                      </div>
                      <div
                        v-for="row in visibleOrderList"
                        :key="row.id"
                        class="order-list-table__row"
                      >
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">订单号</span>
                          <span>{{ row.orderNumber || '生成中...' }}</span>
                        </div>
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">产品名称</span>
                          <span>{{ getOrderProductName(row) || '--' }}</span>
                        </div>
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">订单状态</span>
                          <n-tag :type="getStatusType(row.orderStatus)" size="small">
                            {{ formatOrderStatus(row.orderStatus) }}
                          </n-tag>
                        </div>
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">支付状态</span>
                          <n-tag
                            :type="getDesignOrderPaymentStatusType(row.paymentStatus)"
                            size="small"
                            :bordered="false"
                          >
                            {{ formatDesignOrderPaymentStatus(row.paymentStatus) }}
                          </n-tag>
                        </div>
                        <div class="order-list-table__cell order-list-table__cell--actions">
                          <span class="order-list-table__label">操作</span>
                          <div class="order-list-table__actions">
                            <n-button
                              size="small"
                              type="info"
                              @click="viewOrderDetail(row)"
                            >
                              详情
                            </n-button>
                            <n-button
                              v-if="canOpenRefundCenter(row)"
                              size="small"
                              type="warning"
                              secondary
                              @click="viewOrderDetail(row, 'payments')"
                            >
                              退款处理
                            </n-button>
                            <n-button
                              v-if="
                                row.contractLoaded &&
                                !hasUploadedContract(row) &&
                                ![4, 5].includes(Number(row.orderStatus))
                              "
                              size="small"
                              type="error"
                              secondary
                              @click="handleCancelOrder(row)"
                            >
                              取消
                            </n-button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="client-center-empty-card">
                      <n-empty description="当前暂无订单数据" />
                    </div>
                  </n-spin>
                </div>
                <div
                  v-if="pagination.itemCount > 0"
                  class="order-pagination client-center-pagination"
                >
                  <n-pagination
                    v-model:page="pagination.page"
                    :page-size="pagination.pageSize"
                    :item-count="pagination.itemCount"
                    :page-slot="3"
                    show-quick-jumper
                    @update:page="handlePageChange"
                  />
                </div>
              </n-card>
            </div>

            <div v-if="activeMenu === 'designOrders'">
              <n-card title="设计订单">
                <div class="client-center-toolbar-end">
                  <n-button size="small" @click="fetchDesignOrders">刷新列表</n-button>
                </div>
                <div class="order-table-wrap">
                  <n-spin :show="loadingDesignOrders">
                    <div
                      v-if="designOrderList.length > 0"
                      class="order-list-table design-order-list-table client-center-paper"
                    >
                      <div class="order-list-table__head">
                        <div>设计单号</div>
                        <div>设计地址</div>
                        <div>产品名称</div>
                        <div>设计状态</div>
                        <div>支付状态</div>
                        <div>操作</div>
                      </div>
                      <div
                        v-for="row in designOrderList"
                        :key="row.id"
                        class="order-list-table__row"
                      >
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">设计单号</span>
                          <span>{{ row.designOrderNo || '--' }}</span>
                        </div>
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">设计地址</span>
                          <span>{{ row.orderAddress || '--' }}</span>
                        </div>
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">产品名称</span>
                          <span>{{ getDesignOrderListMainProductNameText(row) }}</span>
                        </div>
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">设计状态</span>
                          <n-tag
                            :type="getDesignOrderStatusType(row.designStatus)"
                            size="small"
                          >
                            {{ getDesignOrderStatusText(row.designStatus) }}
                          </n-tag>
                        </div>
                        <div class="order-list-table__cell">
                          <span class="order-list-table__label">支付状态</span>
                          <n-tag
                            :type="getDesignOrderPaymentStatusType(row.paymentStatus)"
                            size="small"
                            :bordered="false"
                          >
                            {{ formatDesignOrderPaymentStatus(row.paymentStatus) }}
                          </n-tag>
                        </div>
                        <div class="order-list-table__cell order-list-table__cell--actions">
                          <span class="order-list-table__label">操作</span>
                          <div class="order-list-table__actions">
                            <n-button
                              size="small"
                              type="info"
                              @click="openDesignOrderDetail(row)"
                            >
                              详情
                            </n-button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="client-center-empty-card">
                      <n-empty description="当前暂无设计订单" />
                    </div>
                  </n-spin>
                </div>
                <div
                  v-if="designPagination.itemCount > 0"
                  class="order-pagination client-center-pagination"
                >
                  <n-pagination
                    v-model:page="designPagination.page"
                    :page-size="designPagination.pageSize"
                    :item-count="designPagination.itemCount"
                    :page-slot="3"
                    show-quick-jumper
                    @update:page="handleDesignPageChange"
                  />
                </div>
              </n-card>
            </div>

            <div v-if="activeMenu === 'favorites'">
              <n-card title="收藏户型">
                <div class="client-center-toolbar-end">
                  <n-button size="small" @click="refreshFavorites"
                    >刷新列表</n-button
                  >
                </div>
                <n-empty
                  description="您还没有收藏任何户型"
                  v-if="favorites.length === 0 && !loadingFavorites"
                >
                  <template #extra>
                    <n-button size="small" type="primary" @click="goToHousePage"
                      >去收藏</n-button
                    >
                  </template>
                </n-empty>
                <n-grid
                  cols="1 s:2 m:3"
                  responsive="screen"
                  :x-gap="16"
                  :y-gap="16"
                  v-else
                >
                  <n-grid-item v-for="item in favorites" :key="item.id">
                    <n-card hoverable>
                      <template #cover>
                        <SmartImage
                          :src="item.image"
                          :alt="item.name"
                          class="house-image"
                          loading="lazy"
                          decoding="async"
                          :placeholder="defaultFavoriteImage"
                        />
                      </template>
                      <n-space vertical>
                        <n-h3 class="house-title">{{ item.name }}</n-h3>
                        <n-space justify="space-between">
                          <n-tag type="success">{{
                            formatFavoriteStyle(item.style)
                          }}</n-tag>
                          <span>{{ formatFavoriteArea(item) }}</span>
                        </n-space>
                        <n-space
                          class="favorite-actions"
                          justify="space-between"
                        >
                          <n-button
                            type="primary"
                            @click="viewFavoriteDetail(item)"
                          >
                            查看详情
                          </n-button>
                          <n-button
                            type="error"
                            ghost
                            :loading="!!favoriteActionLoading[item.id]"
                            @click="cancelFavorite(item)"
                          >
                            取消收藏
                          </n-button>
                        </n-space>
                        <n-button v-if="false" type="primary" block class="mt-2"
                          >查看详情</n-button
                        >
                      </n-space>
                    </n-card>
                  </n-grid-item>
                </n-grid>
                <div
                  v-if="favoritePagination.pageCount > 1"
                  class="favorites-pagination"
                >
                  <n-pagination
                    v-model:page="favoritePagination.page"
                    :page-count="favoritePagination.pageCount"
                    :page-slot="3"
                    show-quick-jumper
                    @update:page="handleFavoritePageChange"
                  />
                </div>
              </n-card>
            </div>

            <div v-if="activeMenu === 'logout'">
              <n-card title="退出登录">
                <n-space vertical align="center">
                  <n-h3>确定要退出登录吗？</n-h3>
                  <n-p>退出后将无法管理您的个人信息和订单</n-p>
                  <n-space>
                    <n-button @click="activeMenu = 'profile'">取消</n-button>
                    <n-button type="error" @click="logout">确认退出</n-button>
                  </n-space>
                </n-space>
              </n-card>
            </div>
          </n-space>
        </n-card>
      </div>
    </n-layout-content>

    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      title="订单中心"
      size="huge"
      :style="detailModalStyle"
    >
      <n-spin :show="loadingDetail">
        <n-tabs v-model:value="detailTab" type="segment" animated>
          <n-tab-pane name="info" tab="订单详情">
            <div v-if="currentOrder">
              <div
                class="p-4 mb-4 bg-gray-50 rounded order-progress-card"
              >
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
                      {{
                        currentOrder.house?.houseMainStructure?.roomCount || 0
                      }}
                      室
                    </n-tag>
                    <n-tag type="info" size="small">
                      {{
                        currentOrder.house?.houseMainStructure
                          ?.livingRoomCount || 0
                      }}
                      厅
                    </n-tag>
                    <n-tag type="info" size="small">
                      {{
                        currentOrder.house?.houseMainStructure?.bathroomCount ||
                        0
                      }}
                      卫
                    </n-tag>
                  </n-space>
                </n-descriptions-item>
              </n-descriptions>

              <n-divider
                title-placement="left"
                v-if="currentOrder.house?.houseOptionalProducts"
                >选配详情</n-divider
              >
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
                          v-model:value="userOptionSelectionMap[config.key]"
                          :options="config.options"
                          size="small"
                          clearable
                          filterable
                          placeholder="请选择"
                          :disabled="!canAdjustUserOptions || userOptionSubmitting"
                        />
                      </div>
                    </n-grid-item>
                  </n-grid>
                </n-spin>
                <n-empty
                  v-if="!userOptionConfigLoading && userOptionConfigList.length === 0"
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
                  <n-button @click="resetUserOptionSelectionChanges">
                    撤销更改
                  </n-button>
                  <n-button
                    type="primary"
                    :loading="userOptionSubmitting"
                    :disabled="!canAdjustUserOptions"
                    @click="submitUserOptionSelectionChanges"
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
                      <div>
                        订单阶段：{{ record.orderStatusSnapshotLabel || '--' }}
                      </div>
                      <div>
                        理论差额：¥{{ formatAmount(record.theoreticalDiffAmount) }}
                      </div>
                      <div v-if="record.linkedBillTitle">
                        关联账单：{{ record.linkedBillTitle }} /
                        {{ record.linkedBillStatusLabel || '--' }}
                        <template v-if="record.linkedBillAmount !== null && record.linkedBillAmount !== undefined">
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
                          @click="openLatestOptionalChangeRefundModal"
                        >
                          申请退款
                        </n-button>
                        <n-button
                          v-if="canCancelRefundForLatestOptionalChange"
                          size="small"
                          type="warning"
                          secondary
                          @click="cancelLatestOptionalChangeRefundApply"
                        >
                          取消退款申请
                        </n-button>
                        <n-button
                          v-if="canViewRefundDetailForLatestOptionalChange"
                          size="small"
                          type="primary"
                          secondary
                          @click="openLatestOptionalChangeRefundDetailModal"
                        >
                          退款详情
                        </n-button>
                      </n-space>
                    </div>
                  </div>
                </div>
                <n-empty
                  v-else
                  description="当前订单暂无选配变更记录"
                />
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
                  <span class="construction-progress-header__node">{{ constructionInfo.currentNodeName }}</span>
                  <n-tag size="small" type="info">{{
                    constructionInfo.currentNodeStatusText
                  }}</n-tag>
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
                      :status="
                        getNodeStepStatus(
                          index,
                          constructionInfo.currentNodeIndex,
                        )
                      "
                      class="construction-progress-step"
                      @click="handleNodeClick(node)"
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
                                subStep.done && 'construction-progress-step__sub-step--done',
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
                        <n-tag size="small" type="primary">{{
                          currentNodeDetailStatusText
                        }}</n-tag>
                      </template>

                      <div
                        v-if="isPendingConstructionPaymentForCurrentNode"
                        class="construction-action-card construction-action-card--warning"
                      >
                        <div class="construction-action-card__title construction-action-card__title--warning">
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
                            @click="openCurrentConstructionPayment"
                          >
                            前往账单支付
                          </n-button>
                        </div>
                      </div>

                      <div
                        v-if="isPendingUserAudit"
                        class="construction-action-card construction-action-card--success"
                      >
                        <div class="construction-action-card__title construction-action-card__title--success">
                          <n-icon class="construction-action-card__icon"
                            ><CheckmarkCircle
                          /></n-icon>
                          该节点等待您的验收确认
                        </div>
                        <div class="construction-action-card__actions">
                          <n-button type="success" @click="handleUserAuditPass"
                            >验收通过</n-button
                          >
                          <n-button
                            type="error"
                            @click="showAuditRejectModal = true"
                            >驳回整改</n-button
                          >
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
                  <div v-else class="construction-empty-state construction-empty-state--offset">
                    <n-icon size="40"><DocumentTextOutline /></n-icon>
                    <p>请点击左侧节点查看详细记录</p>
                  </div>
                </n-grid-item>
              </n-grid>
            </div>
            <div v-else class="construction-empty-state construction-empty-state--padded">
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
                    <div class="pending-payment-bills-cell pending-payment-bills-cell--actions">
                      <span class="pending-payment-bills-label">操作</span>
                      <div class="pending-payment-bills-actions">
                        <n-button
                          size="small"
                          type="primary"
                          @click="openPendingBillPaymentModal(row)"
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
                      <n-tag v-else type="default" size="small" :bordered="false">
                        未申请
                      </n-tag>
                    </div>
                    <div class="detail-payment-records-cell">
                      <span class="detail-payment-records-label">交易流水号</span>
                      <span class="detail-payment-records-text">
                        {{ row.transactionId || '--' }}
                      </span>
                    </div>
                    <div class="detail-payment-records-cell detail-payment-records-cell--actions">
                      <span class="detail-payment-records-label">操作</span>
                      <div class="detail-payment-records-actions">
                        <n-button
                          v-if="canApplyRefundForPaymentRecordInList(row)"
                          size="small"
                          type="error"
                          ghost
                          @click="openRefundModal(row)"
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
                          @click="handleCancelRefundApply(row)"
                        >
                          取消退款申请
                        </n-button>
                        <n-button
                          v-if="canViewRefundDetailForPaymentRecordInList(row)"
                          size="small"
                          type="primary"
                          secondary
                          @click="openRefundDetailModal(row)"
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
              <n-icon
                size="14"
                class="order-footer-hint__icon"
              />
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
                @click="openBillPaymentTab"
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
          <n-button @click="showDetailModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDesignDetailModal"
      preset="card"
      title="设计订单详情"
      :style="detailModalStyle"
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
            @click="openDesignOrderPaymentModal"
          >
            继续支付
          </n-button>
          <n-button
            v-if="canMarkDesignOrderNoBuild(currentDesignOrder)"
            :loading="designDecisionSubmitting"
            @click="handleMarkDesignOrderNoBuild"
          >
            暂不建造
          </n-button>
          <n-button
            v-if="canContinueBuildDesignOrder(currentDesignOrder)"
            type="primary"
            :loading="designDecisionSubmitting"
            @click="handleContinueBuildFromDesign"
          >
            继续建房
          </n-button>
          <n-button @click="showDesignDetailModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDesignRepayModal"
      preset="card"
      title="设计订单支付"
      :style="paymentModalStyle"
      :mask-closable="!designRepaySubmitting"
      :closable="!designRepaySubmitting"
    >
      <n-space vertical size="large">
        <div class="payment-summary-card">
          <div class="payment-summary-card__title">设计定金支付</div>
          <div class="payment-summary-card__desc">
            请选择支付方式继续完成当前设计订单定金支付。
          </div>
          <div class="payment-summary-card__amount">
            {{ designRepayAmountText }}
          </div>
        </div>

        <n-radio-group v-model:value="designRepayForm.channel">
          <n-space vertical>
            <n-radio
              v-for="option in paymentChannelOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </n-radio>
          </n-space>
        </n-radio-group>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button
            :disabled="designRepaySubmitting"
            @click="showDesignRepayModal = false"
          >
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="designRepaySubmitting"
            @click="submitDesignOrderRepayment"
          >
            确认支付
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showPaymentModal"
      preset="card"
      :title="paymentModalTitle"
      :mask-closable="!paymentSubmitting"
      :closable="!paymentSubmitting"
      :style="paymentModalStyle"
    >
      <n-space vertical size="large">
        <div class="payment-summary client-center-soft-card">
          <div class="payment-summary__title">{{ paymentTarget.title }}</div>
          <div class="payment-summary__desc">
            {{ paymentTarget.description }}
          </div>
          <div class="payment-summary__amount">
            {{
              paymentTarget.amountText ||
              `¥${paymentTarget.amount?.toLocaleString?.() || 0}`
            }}
          </div>
        </div>

        <n-radio-group v-model:value="paymentForm.channel">
          <n-space vertical>
            <n-radio
              v-for="option in paymentChannelOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </n-radio>
          </n-space>
        </n-radio-group>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button :disabled="paymentSubmitting" @click="closePaymentModal">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="paymentSubmitting"
            @click="submitPayment"
          >
            确认支付
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showAuditRejectModal"
      preset="dialog"
      title="驳回整改"
      positive-text="确认驳回"
      negative-text="取消"
      @positive-click="() => submitUserAudit(false, auditRejectReason)"
      @negative-click="showAuditRejectModal = false"
    >
      <n-input
        v-model:value="auditRejectReason"
        type="textarea"
        placeholder="请输入驳回原因，服务商将看到此消息..."
        :rows="3"
      />
    </n-modal>
    <n-modal
      v-model:show="showWechatPayModal"
      preset="card"
      title="微信扫码支付"
      :style="paymentModalStyle"
    >
      <n-space vertical align="center" size="large">
        <n-qr-code
          v-if="wechatPayUrl"
          :value="wechatPayUrl"
          :size="220"
          error-correction-level="M"
        />
        <n-empty v-else description="未获取到微信支付二维码" />
        <div class="wechat-pay-tip">
          请使用微信扫一扫完成支付，支付完成后返回当前页面刷新订单状态。
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="closeWechatPayModal">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showRefundModal"
      preset="card"
      title="申请退款"
      :style="refundModalStyle"
      :mask-closable="!refundSubmitting"
      :closable="!refundSubmitting"
    >
      <n-space vertical size="large">
        <n-descriptions bordered size="small" :column="1" label-placement="left">
          <n-descriptions-item label="订单号">
            {{ refundTarget.orderNumber || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="产品名称">
            {{ refundTarget.productName || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="已支付金额">
            ¥{{ Number(refundTarget.paidAmount || 0).toLocaleString() }}
          </n-descriptions-item>
        </n-descriptions>

        <n-card
          size="small"
          class="refund-info-card client-center-soft-card"
          :bordered="false"
        >
          <n-space justify="space-between" align="center">
            <div class="refund-info-card__item">
              <div class="refund-info-card__label">系统关联流水</div>
              <div class="refund-info-card__value">
                #{{ refundTarget.paymentRecordId || '--' }}
              </div>
            </div>
            <div class="refund-info-card__item">
              <div class="refund-info-card__label">支付阶段</div>
              <div class="refund-info-card__value">
                {{ refundTarget.paymentStage || '--' }}
              </div>
            </div>
            <div class="refund-info-card__item refund-info-card__item--amount">
              <div class="refund-info-card__label">可退金额</div>
              <div class="refund-info-card__value">
                ¥{{ formatAmount(refundTarget.paymentAmount) }}
              </div>
            </div>
          </n-space>
        </n-card>

        <n-form
          :label-placement="formLabelPlacement"
          :label-width="isCompactViewport ? undefined : 90"
        >
          <n-form-item label="快捷原因">
            <n-select
              v-model:value="refundQuickReason"
              :options="refundReasonOptions"
              clearable
              placeholder="请选择常见原因，可继续修改下方内容"
              @update:value="handleRefundReasonPresetChange"
            />
          </n-form-item>
          <n-form-item label="退款原因" required>
            <n-input
              v-model:value="refundForm.reason"
              type="textarea"
              :rows="4"
              maxlength="200"
              show-count
              placeholder="请填写退款原因，也可以先选择上方常见原因"
            />
          </n-form-item>
        </n-form>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button :disabled="refundSubmitting" @click="closeRefundModal">
            取消
          </n-button>
          <n-button
            type="error"
            :loading="refundSubmitting"
            @click="submitRefundApply"
          >
            提交退款申请
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showRefundDetailModal"
      preset="card"
      title="退款详情"
      :style="refundDetailModalStyle"
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

    <n-modal
      v-model:show="showOrderPaymentStatementModal"
      preset="card"
      title="支付协议"
      :style="statementModalStyle"
    >
      <n-spin :show="orderPaymentStatementLoading">
        <div
          class="order-payment-statement-content client-center-paper"
          v-html="orderPaymentStatementHtml"
        ></div>
      </n-spin>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showOrderPaymentStatementModal = false">
            关闭
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </n-layout>
</template>

<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  reactive,
  h,
  defineEmits,
  watch,
  computed,
} from 'vue'
import { storeToRefs } from 'pinia'
import {
  useMessage,
  useDialog,
  useNotification,
  NTag,
  NButton,
  NSpace,
  NIcon,
  NBadge,
  NAvatar,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import orderAPI from '@/api/user/userOrder.js'
import designOrderAPI from '@/api/user/designOrder'
import ConstructionAPI from '@/api/house/construction.js'
import houseAPI from '@/api/house/house'
import {
  AUTH_SCOPE_USER,
  getAuthStorage,
} from '@/utils/auth'
import { getDesignOrderMainProductBinding } from '@/utils/designOrderMainProductStore'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useFavoriteStore } from '@/stores/favorite/useFavoriteStore'
import { useOptionCatalogStore } from '@/stores/option/useOptionCatalogStore'
import { useUserOrderStore } from '@/stores/order/useUserOrderStore'
import { useUserProfileStore } from '@/stores/user/useUserProfileStore'
import {
  CheckmarkCircle,
  Time,
  DocumentTextOutline,
  CardOutline,
  ColorPaletteOutline,
  PersonCircleOutline,
  HeartOutline,
  ArrowUndoCircleOutline,
} from '@/icons/ionicons'
import {
  CONSTRUCTION_NODE_STATUS,
  getProcessText,
  normalizeConstructionFlow,
} from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'
import { useMaxWidth } from '@/composables/useMaxWidth'
import {
  getOrderPaymentStatus,
} from '@/utils/orderPayment'
import SmartImage from '@/components/common/SmartImage.vue'

const router = useRouter()
const message = useMessage()
const notification = useNotification()
const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()
const optionCatalogStore = useOptionCatalogStore()
const orderStore = useUserOrderStore()
const userProfileStore = useUserProfileStore()
const dialog = useDialog()
const emit = defineEmits(['updateName'])
const {
  saving,
  userInfo,
  selectedProfileRegionCode,
  profileAddressPreview,
  canViewUserProfile,
  canUpdateUserProfile,
  canApplyRefund,
  canViewRefund,
  saveProfileButtonText,
  displayName: userName,
} = storeToRefs(userProfileStore)
const profileAddressForm = userProfileStore.profileAddressForm
const profileRegionCascaderOptions =
  userProfileStore.profileRegionCascaderOptions
const {
  favoriteList: favorites,
  favoriteListLoading: loadingFavorites,
  favoriteLoadingMap: favoriteActionLoading,
  currentUserId: currentFavoriteUserId,
} = storeToRefs(favoriteStore)
const favoritePagination = favoriteStore.favoritePagination
const defaultFavoriteImage = favoriteStore.defaultFavoriteImage
const {
  loadingOrders,
  orderList,
  currentOrder,
  loadingDetail,
  detailPaymentRecordsLoading,
  detailPaymentRecords,
  orderPaymentStatementLoading,
  orderPaymentStatementHtml,
  refundDetailLoading: loadingRefundDetail,
  refundDetail,
  refundSubmitting,
} = storeToRefs(orderStore)
const pagination = orderStore.pagination
const loadingDesignOrders = ref(false)
const designOrderList = ref([])
const designPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
})
const showDesignDetailModal = ref(false)
const loadingDesignDetail = ref(false)
const currentDesignOrder = ref(null)
const designDecisionSubmitting = ref(false)
const showDesignRepayModal = ref(false)
const designRepaySubmitting = ref(false)
const designMainProductNameMap = reactive({})
const designOrderListMainProductTextMap = reactive({})
const designRepayForm = reactive({
  channel: 'ALIPAY',
})
const userOptionConfigLoading = ref(false)
const userOptionConfigList = ref([])
const userOptionSelectionMap = reactive({})
const userOptionInitialSelectionSignature = ref('')
const userOptionSubmitting = ref(false)
const userOptionalChangeLoading = ref(false)
const userOptionalChangeRecords = ref([])

const renderMenuIcon = (icon) => () =>
  h(NIcon, null, {
    default: () => h(icon),
  })

const mobileMenuItems = [
  {
    label: '个人信息',
    description: '资料与地址',
    key: 'profile',
    icon: PersonCircleOutline,
  },
  {
    label: '我的订单',
    description: '订单与支付',
    key: 'orders',
    icon: DocumentTextOutline,
  },
  {
    label: '设计订单',
    description: '设计与交付',
    key: 'designOrders',
    icon: ColorPaletteOutline,
  },
  {
    label: '收藏户型',
    description: '收藏记录',
    key: 'favorites',
    icon: HeartOutline,
  },
  {
    label: '退出登录',
    description: '安全退出',
    key: 'logout',
    icon: ArrowUndoCircleOutline,
  },
]

const menuOptions = mobileMenuItems.map((item) => ({
  label: item.label,
  key: item.key,
  icon: renderMenuIcon(item.icon),
}))

const orderStatusFilterTagConfigs = [
  { key: 'all', label: '全部' },
  { key: '0', label: '订单提交' },
  { key: '1', label: '派单中' },
  { key: '2', label: '已派单' },
  { key: '3', label: '施工中' },
  { key: '4', label: '已完成' },
  { key: '5', label: '已取消' },
]

const getStoredUserId = () => getAuthStorage(AUTH_SCOPE_USER, 'id')
const activeMenu = ref('profile')
const activeOrderStatusTag = ref('all')
const isCompactViewport = useMaxWidth(768)
const pendingOrderNotificationRef = ref(null)
const pendingOrderNotificationSignature = ref('')
const handleProfileRegionUpdate = (...args) =>
  userProfileStore.handleProfileRegionUpdate(...args)
const formLabelPlacement = computed(() =>
  isCompactViewport.value ? 'top' : 'left',
)
const descriptionsLabelPlacement = computed(() =>
  isCompactViewport.value ? 'top' : 'left',
)
const detailDescriptionsColumns = computed(() =>
  isCompactViewport.value ? 1 : 2,
)
const detailModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 1000px)',
  minHeight: isCompactViewport.value ? 'auto' : '600px',
}))
const paymentModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : '420px',
}))
const refundModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : '520px',
}))
const refundDetailModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 760px)',
}))
const statementModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 920px)',
}))

// 施工相关状态
const constructionInfo = ref(null)
const currentNodeDetail = ref(null)
const pendingPaymentBillsLoading = ref(false)
const pendingPaymentBills = ref([])
const showAuditRejectModal = ref(false)
const auditRejectReason = ref('')
const showPaymentModal = ref(false)
const paymentSubmitting = ref(false)
const paymentForm = reactive({
  channel: 'ALIPAY',
})
const paymentTarget = reactive({
  orderId: null,
  billId: null,
  billType: '',
  nodeId: null,
  amount: 0,
  amountText: '',
  title: '',
  description: '',
})
const showWechatPayModal = ref(false)
const wechatPayUrl = ref('')
let paymentStatusPollTimer = null
let designPaymentStatusPollTimer = null
let constructionPaymentPollTimer = null
const orderPaymentTracker = reactive({
  orderId: null,
  billId: null,
  billType: '',
})
const designOrderPaymentTracker = reactive({
  orderId: null,
  billId: null,
})
const constructionPaymentTracker = reactive({
  orderId: null,
  nodeId: null,
  billId: null,
})
const paymentResultTarget = reactive({
  orderId: null,
  nodeId: null,
  billId: null,
  designOrderId: null,
})

const paymentChannelOptions = [
  { label: '支付宝支付', value: 'ALIPAY' },
  { label: '微信支付', value: 'WECHAT' },
]

const paymentModalTitle = computed(() => '账单支付')
const currentOrderPaymentStatus = computed(() =>
  getOrderPaymentStatus(currentOrder.value),
)
const currentOrderContactName = computed(
  () => currentOrder.value?.userName || userName.value || '--',
)
const currentOrderContactPhone = computed(
  () => currentOrder.value?.userPhone || userInfo.value?.phone || '--',
)

const designOrderStatusMap = {
  0: '待支付定金',
  1: '设计中',
  2: '待用户决策',
  3: '已转建房',
  4: '暂不建房',
  5: '已取消',
}

const designRepayAmountText = computed(() => {
  const amount = Number(
    currentDesignOrder.value?.depositAmount || currentDesignOrder.value?.paidAmount || 0,
  )
  return Number.isFinite(amount) && amount >= 0 ? `¥${amount.toLocaleString()}` : '¥--'
})

const logDesignOrderPaymentDebug = (message, payload = {}) => {
  console.info('[design-order-payment]', message, payload)
}

const closeWechatPayModal = async () => {
  const resultOrderId = paymentResultTarget.orderId
  const resultNodeId = paymentResultTarget.nodeId
  const resultBillId = paymentResultTarget.billId
  const resultDesignOrderId = paymentResultTarget.designOrderId
  showWechatPayModal.value = false
  wechatPayUrl.value = ''
  paymentResultTarget.orderId = null
  paymentResultTarget.nodeId = null
  paymentResultTarget.billId = null
  paymentResultTarget.designOrderId = null
  if (resultDesignOrderId) {
    await refreshDesignOrderAfterPayment(resultDesignOrderId)
    return
  }
  if (resultNodeId) {
    if (resultBillId) {
      await confirmUserBillPayment(resultBillId)
    }
    await refreshConstructionAfterNodePayment(resultOrderId, {
      focusPaymentResult: true,
    })
    return
  }
  if (resultBillId) {
    await confirmUserBillPayment(resultBillId)
  }
  await refreshOrderAfterPayment()
}

const fetchUserInfo = async () => {
  try {
    return await userProfileStore.fetchUserInfo()
  } catch (error) {
    message.error(error?.message || '登录状态异常，请重新登录')
    router.push('/login')
    return null
  }
}

const saveUserInfo = async () => {
  try {
    const res = await userProfileStore.saveUserInfo()
    if (!res) return

    if (res.code === 200) {
      message.success(res.localOnly ? '已本地保存个人信息' : '个人信息已保存')
      return
    }

    message.error(res.msg || '保存失败')
  } catch (error) {
    void error
    message.error('保存失败，请稍后重试')
  }
}

const logout = () => {
  clearPendingOrderNotificationRead(getStoredUserId())
  closePendingOrderNotification()
  userProfileStore.clearProfileState()
  favoriteStore.clearFavoriteState()
  orderStore.clearOrderState()
  authStore.logout(AUTH_SCOPE_USER)
  router.replace('/login')
  message.success('您已成功退出登录')
}

const styleLabelMap = {
  modern: '现代风格',
  chinese: '中式风格',
  european: '欧式风格',
}

const formatFavoriteStyle = (style) => styleLabelMap[style] || style || '未分类'

const formatFavoriteArea = (item) => {
  const area = item?.buildArea || item?.area || item?.baseArea
  return area ? `${area} m²` : '面积待补充'
}

const appendContractUrl = (list, value) => {
  if (typeof value !== 'string') return
  const trimmed = value.trim()
  if (!trimmed || list.includes(trimmed)) return
  list.push(trimmed)
}

const extractOrderContractUrls = (order) => {
  const urls = []
  const contract = order?.orderContract
  if (!contract) return urls

  if (typeof contract === 'string') {
    appendContractUrl(urls, contract)
    return urls
  }

  if (Array.isArray(contract)) {
    contract.forEach((item) => {
      if (typeof item === 'string') {
        appendContractUrl(urls, item)
        return
      }
      appendContractUrl(urls, item?.fileUrl)
      appendContractUrl(urls, item?.url)
    })
    return urls
  }

  if (typeof contract === 'object') {
    appendContractUrl(urls, contract.fileUrl)
    appendContractUrl(urls, contract.url)
    if (Array.isArray(contract.contractUrls)) {
      contract.contractUrls.forEach((item) => appendContractUrl(urls, item))
    }
  }

  return urls
}

const currentOrderContractUrls = computed(() =>
  extractOrderContractUrls(currentOrder.value).map((item) => resolveAssetUrl(item)),
)

const isOrderNeedingAttention = (order) => {
  const status = Number(order?.orderStatus)
  if ([4, 5].includes(status)) return false

  if (status === 3) return true

  return hasUploadedContract(order) && getOrderPaymentStatus(order) === 0
}

const orderStatusCountMap = computed(() => {
  const counts = Object.create(null)
  orderList.value.forEach((item) => {
    const statusKey = String(Number(item?.orderStatus))
    counts[statusKey] = Number(counts[statusKey] || 0) + 1
    if (isOrderNeedingAttention(item)) {
      counts.attentionAll = Number(counts.attentionAll || 0) + 1
      counts[`attention:${statusKey}`] =
        Number(counts[`attention:${statusKey}`] || 0) + 1
    }
  })
  return counts
})

const visibleOrderList = computed(() => {
  if (activeOrderStatusTag.value === 'all') return orderList.value
  return orderList.value.filter(
    (item) => String(Number(item?.orderStatus)) === activeOrderStatusTag.value,
  )
})

const orderStatusFilterTabs = computed(() =>
  orderStatusFilterTagConfigs.map((item) => {
    const badgeCount =
      item.key === 'all'
        ? Number(orderStatusCountMap.value.attentionAll || 0)
        : Number(orderStatusCountMap.value[`attention:${item.key}`] || 0)
    const isSilentTab = ['all', '4', '5'].includes(item.key)

    return {
      ...item,
      badgeCount,
      showBadge: !isSilentTab && badgeCount > 0,
    }
  }),
)

const pendingOrderNotificationItems = computed(() =>
  orderStatusFilterTabs.value.filter((item) => item.showBadge),
)

const getPendingOrderNotificationSessionKey = (userId) =>
  `user-pending-order-notification-read:${userId}`

const getPendingOrderNotificationSignature = () =>
  pendingOrderNotificationItems.value
    .map((item) => `${item.key}:${item.badgeCount}`)
    .join('|')

const readPendingOrderNotification = (userId) => {
  if (typeof window === 'undefined' || !userId) return ''
  return (
    window.sessionStorage.getItem(
      getPendingOrderNotificationSessionKey(userId),
    ) || ''
  )
}

const markPendingOrderNotificationRead = (userId, signature) => {
  if (typeof window === 'undefined' || !userId) return
  window.sessionStorage.setItem(
    getPendingOrderNotificationSessionKey(userId),
    signature,
  )
}

const clearPendingOrderNotificationRead = (userId) => {
  if (typeof window === 'undefined' || !userId) return
  window.sessionStorage.removeItem(getPendingOrderNotificationSessionKey(userId))
}

const closePendingOrderNotification = () => {
  pendingOrderNotificationRef.value?.destroy()
  pendingOrderNotificationRef.value = null
  pendingOrderNotificationSignature.value = ''
}

const maybeShowPendingOrderNotification = () => {
  const userId = getStoredUserId()
  if (!userId) return

  const items = pendingOrderNotificationItems.value
  const total = items.reduce((sum, item) => sum + Number(item.badgeCount || 0), 0)

  if (total <= 0) {
    clearPendingOrderNotificationRead(userId)
    closePendingOrderNotification()
    return
  }

  const signature = getPendingOrderNotificationSignature()
  if (
    pendingOrderNotificationRef.value &&
    pendingOrderNotificationSignature.value === signature
  ) {
    return
  }

  if (readPendingOrderNotification(userId) === signature) {
    return
  }

  closePendingOrderNotification()

  let markAsRead = false
  const metaText = items
    .map((item) => `${item.label} ${item.badgeCount}`)
    .join(' · ')

  const notificationReactive = notification.create({
    title: '订单待处理提醒',
    description: '订单中心存在需要您尽快处理的内容',
    content: `当前共有 ${total} 条待处理提醒，请及时进入订单中心查看并处理。`,
    meta: metaText || '请及时处理',
    duration: 0,
    avatar: () =>
      h(
        NAvatar,
        {
          size: 'small',
          round: true,
          style: {
            backgroundColor: '#d03050',
            color: '#fff',
          },
        },
        {
          default: () =>
            h(NIcon, { size: 16 }, { default: () => h(DocumentTextOutline) }),
        },
      ),
    action: () =>
      h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => {
            markAsRead = true
            markPendingOrderNotificationRead(userId, signature)
            notificationReactive.destroy()
          },
        },
        {
          default: () => '已读',
        },
      ),
    onClose: () => {
      if (!markAsRead) {
        message.warning('点击“已读”可暂时关闭该提醒')
        return false
      }
      return true
    },
    onAfterLeave: () => {
      if (pendingOrderNotificationRef.value === notificationReactive) {
        pendingOrderNotificationRef.value = null
        pendingOrderNotificationSignature.value = ''
      }
    },
  })

  pendingOrderNotificationRef.value = notificationReactive
  pendingOrderNotificationSignature.value = signature
}

const goToHousePage = () => router.push('/houseList')
const viewFavoriteDetail = (item) => router.push(`/houseDetail/${item.id}`)

const fetchFavorites = async () => {
  try {
    await favoriteStore.fetchFavoriteList({
      page: favoritePagination.page,
      pageSize: favoritePagination.pageSize,
    })
  } catch (error) {
    void error
    message.error('获取收藏列表失败')
  }
}

const refreshFavorites = () => {
  favoritePagination.page = 1
  fetchFavorites()
}

const handleFavoritePageChange = (page) => {
  favoritePagination.page = page
  fetchFavorites()
}

const cancelFavorite = async (item) => {
  const userId = currentFavoriteUserId.value || getStoredUserId()
  if (!userId || !item?.id) return

  try {
    const shouldFallbackPrevPage =
      favorites.value.length === 1 && favoritePagination.page > 1

    await favoriteStore.toggleFavorite(item.id, userId)
    message.success('已取消收藏')

    favoritePagination.page = shouldFallbackPrevPage
      ? favoritePagination.page - 1
      : favoritePagination.page
    await fetchFavorites()
  } catch (error) {
    void error
    message.error('取消收藏失败')
  }
}

/* ------------------ 订单相关逻辑 ------------------ */
const showDetailModal = ref(false)
const detailTab = ref('info')
const showOrderPaymentStatementModal = ref(false)
const getOrderProductName = (order) => orderStore.getOrderProductName(order)
const hasUploadedContract = (order) => orderStore.hasUploadedContract(order)
const getPaymentRecordIdFromOrder = (order) =>
  orderStore.getPaymentRecordIdFromOrder(order)

const formatOrderStatus = (status) => {
  const map = {
    0: '订单提交',
    1: '派单中',
    2: '已派单',
    3: '施工中',
    4: '已完成',
    5: '已取消',
  }
  return map[status] !== undefined ? map[status] : status || '未知状态'
}

const formatPaymentStatus = (status) => {
  const map = {
    0: '待支付',
    1: '部分支付',
    2: '已结清',
    3: '已退款',
  }
  return map[status] !== undefined ? map[status] : status || '未知'
}

const detailPaymentChannelMap = {
  ALIPAY: '支付宝',
  WECHAT: '微信支付',
}

const detailPaymentStageMap = {
  ORDER: '首付款',
  NODE: '节点付款',
  FINAL: '尾款',
}

const paymentBillTypeMap = {
  BUILD_DEPOSIT: '建房定金',
  ADJUSTMENT: '补差账单',
  OPTION_CHANGE: '选配变更补价',
  STAGE_PAYMENT: '节点进度款',
}

const getDetailPaymentChannelText = (channel) =>
  detailPaymentChannelMap[channel] || channel || '--'

const getDetailPaymentChannelType = (channel) => {
  if (channel === 'ALIPAY') return 'info'
  if (channel === 'WECHAT') return 'success'
  return 'default'
}

const getDetailPaymentStageText = (stage) =>
  detailPaymentStageMap[stage] || stage || '--'

const isConstructionStagePaymentRecord = (record) => {
  const stage = String(record?.paymentStage || '').trim()
  if (!stage) return false
  return stage.includes('施工进度款') || stage === 'NODE'
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

const getPaymentBillDisplayTitle = (bill) => {
  if (bill?.billType === 'BUILD_DEPOSIT') return '建房定金'
  if (bill?.billType === 'OPTION_CHANGE') {
    return bill?.billTitle || '选配变更补价'
  }
  if (bill?.billType === 'STAGE_PAYMENT') {
    return resolveStagePaymentNodeName(bill) || '--'
  }
  return bill?.billTitle || '--'
}

const getPaymentStatusType = (status) => {
  if (status === 2) return 'success'
  if (status === 1) return 'info'
  if (status === 3) return 'error'
  return 'warning'
}

const openOrderPaymentStatementModal = async () => {
  showOrderPaymentStatementModal.value = true
  try {
    const res = await orderStore.loadOrderPaymentStatement()
    if (res?.code !== 200) {
      message.error(res?.msg || '获取支付协议失败')
    }
  } catch (error) {
    void error
    message.error('获取支付协议失败')
  }
}

const refundStatusMap = orderStore.refundStatusMap
const showRefundDetailModal = ref(false)
const showRefundModal = ref(false)
const refundTarget = ref({
  orderId: null,
  orderNumber: '',
  productName: '',
  paidAmount: 0,
  paymentRecordId: null,
  paymentStage: '',
  paymentAmount: 0,
})
const refundForm = reactive({
  reason: '',
})
const refundQuickReason = ref(null)
const refundReasonOptions = [
  {
    label: '计划有变，暂不继续',
    value: '计划有变，暂不继续',
  },
  {
    label: '价格原因，申请退款',
    value: '价格原因，申请退款',
  },
  {
    label: '重复支付或误支付',
    value: '重复支付或误支付',
  },
  {
    label: '与平台沟通后申请退款',
    value: '与平台沟通后申请退款',
  },
  {
    label: '施工安排调整，申请退款',
    value: '施工安排调整，申请退款',
  },
]

const handleRefundReasonPresetChange = (value) => {
  refundQuickReason.value = value
  refundForm.reason = value || ''
}

const closeRefundModal = () => {
  if (refundSubmitting.value) return
  showRefundModal.value = false
  refundTarget.value = {
    orderId: null,
    orderNumber: '',
    productName: '',
    paidAmount: 0,
    paymentRecordId: null,
    paymentStage: '',
    paymentAmount: 0,
  }
  refundForm.reason = ''
  refundQuickReason.value = null
}

const formatAmount = (value) => {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? '0.00' : amount.toFixed(2)
}

const formatCurrencyNumber = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return String(value).replace('T', ' ')
}

const normalizeOptionSelectionValue = (value) => {
  const resolved = Number(value)
  return Number.isFinite(resolved) && resolved > 0 ? resolved : null
}

const getOptionalCategoryLabel = (categoryId) => {
  const normalizedCategoryId = Number(categoryId)
  const config = userOptionConfigList.value.find(
    (item) => Number(item.categoryId) === normalizedCategoryId,
  )
  if (config?.label) return config.label

  const storeConfig = (optionCatalogStore.userCategoryConfigs || []).find(
    (item) => Number(item?.id) === normalizedCategoryId,
  )
  return storeConfig?.name || `分类${normalizedCategoryId || '--'}`
}

const buildCurrentOptionalSelectionMap = () => {
  const result = new Map()
  const existingProducts = currentOrder.value?.house?.houseOptionalProducts || []
  existingProducts.forEach((item) => {
    const categoryId = Number(item?.categoryId)
    const optionId = normalizeOptionSelectionValue(item?.optionalProductId)
    if (categoryId > 0 && optionId) {
      result.set(categoryId, optionId)
    }
  })
  return result
}

const buildTargetOptionalSelectionMap = () => {
  const result = new Map()
  userOptionConfigList.value.forEach((config) => {
    const optionId = normalizeOptionSelectionValue(
      userOptionSelectionMap[config.key],
    )
    if (optionId) {
      result.set(Number(config.categoryId), optionId)
    }
  })
  return result
}

const buildTargetOptionalProductIds = () =>
  userOptionConfigList.value
    .map((config) =>
      normalizeOptionSelectionValue(userOptionSelectionMap[config.key]),
    )
    .filter(Boolean)

const classifyUserOptionSelectionChange = () => {
  const currentSelectionMap = buildCurrentOptionalSelectionMap()
  const targetSelectionMap = buildTargetOptionalSelectionMap()
  let hasAdd = false
  let hasReplace = false
  let hasRemove = false

  targetSelectionMap.forEach((targetId, categoryId) => {
    const currentId = currentSelectionMap.get(categoryId)
    if (!currentId) {
      hasAdd = true
      return
    }
    if (currentId !== targetId) {
      hasReplace = true
    }
  })

  currentSelectionMap.forEach((_, categoryId) => {
    if (!targetSelectionMap.has(categoryId)) {
      hasRemove = true
    }
  })

  const typeCount =
    Number(hasAdd) + Number(hasReplace) + Number(hasRemove)

  if (typeCount > 1) return 'MIXED'
  if (hasReplace) return 'REPLACE'
  if (hasRemove) return 'REMOVE'
  if (hasAdd) return 'ADD_ONLY'
  return 'UNCHANGED'
}

const resetUserOptionSelectionMap = () => {
  Object.keys(userOptionSelectionMap).forEach((key) => {
    delete userOptionSelectionMap[key]
  })
}

const buildUserOptionSelectionSignature = () =>
  JSON.stringify(
    userOptionConfigList.value.map((config) => [
      config.key,
      normalizeOptionSelectionValue(userOptionSelectionMap[config.key]),
    ]),
  )

const buildUserOptionConfigList = (configs = []) =>
  configs.map((category) => ({
    label: category.name,
    key: `cat_${category.id}`,
    categoryId: Number(category.id),
    options: (category.options || []).map((opt) => ({
      label: opt.name || opt.label || `产品${opt.value ?? ''}`,
      value: normalizeOptionSelectionValue(opt.value),
    })),
  }))

const loadUserOptionConfigList = async () => {
  if (userOptionConfigList.value.length > 0) {
    return userOptionConfigList.value
  }

  userOptionConfigLoading.value = true
  try {
    const res = await optionCatalogStore.fetchUserCategoryConfigs()
    if (res?.code === 200 && Array.isArray(res.data)) {
      userOptionConfigList.value = buildUserOptionConfigList(res.data)
    }
    return userOptionConfigList.value
  } catch (error) {
    void error
    return []
  } finally {
    userOptionConfigLoading.value = false
  }
}

const hydrateUserOptionSelection = () => {
  resetUserOptionSelectionMap()
  const existingProducts = currentOrder.value?.house?.houseOptionalProducts || []
  const baseConfigList =
    Array.isArray(optionCatalogStore.userCategoryConfigs) &&
    optionCatalogStore.userCategoryConfigs.length > 0
      ? buildUserOptionConfigList(optionCatalogStore.userCategoryConfigs)
      : buildUserOptionConfigList(userOptionConfigList.value)

  userOptionConfigList.value = baseConfigList.map((config) => {
    const found = existingProducts.find(
      (item) => Number(item?.categoryId) === Number(config.categoryId),
    )
    const options = [...config.options]
    const optionValue = normalizeOptionSelectionValue(found?.optionalProductId)

    if (
      found &&
      optionValue &&
      !options.some((item) => Number(item.value) === optionValue)
    ) {
      options.push({
        label: found.name || `未知产品(ID:${optionValue})`,
        value: optionValue,
      })
    }

    userOptionSelectionMap[config.key] = optionValue
    return {
      ...config,
      options,
    }
  })

  userOptionInitialSelectionSignature.value = buildUserOptionSelectionSignature()
}

const getSelectedUserOptionRows = () =>
  userOptionConfigList.value
    .map((config) => {
      const selectedValue = normalizeOptionSelectionValue(
        userOptionSelectionMap[config.key],
      )
      if (!selectedValue) return null
      const option = config.options.find(
        (item) => Number(item.value) === selectedValue,
      )
      return option
        ? `${config.label}：${option.label}`
        : `${config.label}：产品ID ${selectedValue}`
    })
    .filter(Boolean)

const formatOptionalChangeSnapshot = (snapshot = []) => {
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    return '无'
  }
  return snapshot
    .map((item) => {
      const categoryLabel = getOptionalCategoryLabel(item?.categoryId)
      const name = item?.name || `产品${item?.id || '--'}`
      return `${categoryLabel}：${name}`
    })
    .join('；')
}

const userOptionChangeTypeLabelMap = {
  ADD_ONLY: '纯追加',
  REMOVE: '减少',
  REPLACE: '替换',
  MIXED: '混合调整',
  UNCHANGED: '未变更',
}

const userOptionChangeType = computed(() =>
  hasUserOptionSelectionChanges.value
    ? classifyUserOptionSelectionChange()
    : 'UNCHANGED',
)

const userOptionChangeTypeLabel = computed(
  () => userOptionChangeTypeLabelMap[userOptionChangeType.value] || '未变更',
)

const userOptionChangeSummaryText = computed(() => {
  const selectedRows = getSelectedUserOptionRows()
  return selectedRows.length > 0
    ? selectedRows.join('；')
    : '未选择任何选配'
})

const getUserOptionalChangeStatusTagType = (status) => {
  switch (status) {
    case 'PAID':
    case 'APPROVED':
    case 'REFUNDED':
      return 'success'
    case 'AUTO_APPROVED':
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

const loadUserOptionalChangeRecords = async (
  orderId = currentOrder.value?.id,
) => {
  const userId = getStoredUserId()
  if (!orderId || !userId) {
    userOptionalChangeRecords.value = []
    return []
  }

  userOptionalChangeLoading.value = true
  try {
    const res = await orderAPI.getOptionalChangeList(orderId, userId)
    if (res?.code === 200 && Array.isArray(res.data)) {
      userOptionalChangeRecords.value = res.data
      return userOptionalChangeRecords.value
    }
    userOptionalChangeRecords.value = []
    return []
  } catch (error) {
    void error
    userOptionalChangeRecords.value = []
    return []
  } finally {
    userOptionalChangeLoading.value = false
  }
}

const sortedUserOptionalChangeRecords = computed(() =>
  sortOptionalChangeRecords(userOptionalChangeRecords.value),
)

const latestUserOptionalChangeRecord = computed(
  () => sortedUserOptionalChangeRecords.value[0] || null,
)

const visibleUserOptionalChangeRecords = computed(() => {
  const latestRecord = latestUserOptionalChangeRecord.value
  return latestRecord ? [latestRecord] : []
})

const currentOrderConstructionFlow = computed(() =>
  normalizeConstructionFlow(currentOrder.value?.constructionFlow || null),
)

const hasCurrentOrderConstructionStarted = computed(
  () =>
    Boolean(constructionInfo.value?.nodeDetails?.length) ||
    Boolean(currentOrderConstructionFlow.value?.nodeDetails?.length),
)

const hasPaidConstructionStagePaymentRecord = computed(() =>
  detailPaymentRecords.value.some((record) => isConstructionStagePaymentRecord(record)),
)

const canAdjustUserOptions = computed(() => {
  const orderId = Number(currentOrder.value?.id || 0)
  if (!(orderId > 0)) return false

  const orderStatus = Number(currentOrder.value?.orderStatus ?? -1)
  return orderStatus >= 0 && orderStatus < 4
})

const userOptionAdjustmentHintText = computed(() => {
  if (!currentOrder.value?.id) {
    return '请先打开订单详情后查看当前选配。'
  }

  const orderStatus = Number(currentOrder.value?.orderStatus ?? -1)
  if (orderStatus >= 4) {
    return '当前订单已完结或已取消，选配内容仅支持查看，不可再提交变更。'
  }

  if (!hasCurrentOrderConstructionStarted.value) {
    return '当前订单尚未开启施工。提交后会按后端规则处理：纯追加会直接更新总价并生成补价账单；减少、替换或混合调整会提交后台审核，审核通过后在未支付节点进度款时仅调整总价，不走真实退款。'
  }

  if (!hasPaidConstructionStagePaymentRecord.value) {
    return '当前订单已开启施工，但尚未支付任何节点进度款。提交后会按后端规则处理：纯追加会直接生成补价账单；减少、替换或混合调整会提交后台审核，审核通过后仅调整总价，不走真实退款。'
  }

  return '当前订单已存在已支付节点进度款。提交后会按后端规则处理：纯追加会直接生成补价账单；减少、替换或混合调整会提交后台审核，审核后按当前订单最近一次已支付节点进度款处理退款。'
})

const latestOptionalChangeNeedsRefundSource = computed(() => {
  const latestRecord = latestUserOptionalChangeRecord.value
  if (!latestRecord) return false

  const status = String(latestRecord?.status || '').trim()

  return (
    ['REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED'].includes(status) ||
    Boolean(resolveOptionalChangePaymentRecordId(latestRecord)) ||
    Boolean(latestRecord?.linkedRefundStatusLabel)
  )
})

const getLatestConstructionStagePaymentRecord = (records = []) =>
  [...records]
    .filter((record) => isConstructionStagePaymentRecord(record))
    .sort((a, b) => {
      const timeA = a?.payTime ? new Date(a.payTime).getTime() : 0
      const timeB = b?.payTime ? new Date(b.payTime).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })[0] || null

const latestOptionalChangeRefundPaymentRecord = computed(() => {
  if (!latestOptionalChangeNeedsRefundSource.value) {
    return null
  }

  const linkedPaymentRecordId = resolveOptionalChangePaymentRecordId(
    latestUserOptionalChangeRecord.value,
  )

  if (linkedPaymentRecordId) {
    return (
      findDetailPaymentRecordById(linkedPaymentRecordId) ||
      getLatestConstructionStagePaymentRecord(detailPaymentRecords.value)
    )
  }

  return getLatestConstructionStagePaymentRecord(detailPaymentRecords.value)
})

const latestOptionalChangeRefundPaymentRecordMissing = computed(() => {
  if (!latestOptionalChangeNeedsRefundSource.value) return false
  if (latestOptionalChangeRefundPaymentRecord.value) return false

  return true
})

const canApplyRefundForLatestOptionalChange = computed(() =>
  canApplyRefundForPaymentRecord(latestOptionalChangeRefundPaymentRecord.value),
)

const canCancelRefundForLatestOptionalChange = computed(() =>
  canCancelRefundForPaymentRecord(latestOptionalChangeRefundPaymentRecord.value),
)

const canViewRefundDetailForLatestOptionalChange = computed(() =>
  canViewRefundDetailForPaymentRecord(latestOptionalChangeRefundPaymentRecord.value),
)

const hasUserOptionSelectionChanges = computed(
  () =>
    userOptionConfigList.value.length > 0 &&
    buildUserOptionSelectionSignature() !==
      userOptionInitialSelectionSignature.value,
)

const resetUserOptionSelectionChanges = () => {
  hydrateUserOptionSelection()
}

const submitUserOptionSelectionChanges = async () => {
  if (!canAdjustUserOptions.value) {
    message.warning('订单信息缺失，请刷新后重试')
    return
  }

  if (!hasUserOptionSelectionChanges.value) {
    message.info('当前没有新的选配调整')
    return
  }

  const userId = getStoredUserId()
  const orderId = Number(currentOrder.value?.id || 0)
  if (!userId || !orderId) {
    message.error('订单信息缺失，请刷新后重试')
    return
  }

  const changeType = classifyUserOptionSelectionChange()
  const optionalProductIds = buildTargetOptionalProductIds()

  userOptionSubmitting.value = true
  try {
    const res = await orderAPI.updateOrderProducts(userId, {
      id: orderId,
      optionalProductIds,
    })

    if (res?.code !== 200) {
      message.error(res?.msg || '提交选配变更失败')
      return
    }

    await syncCurrentOrderFromServer(orderId)
    hydrateUserOptionSelection()
    await Promise.all([
      loadUserOptionalChangeRecords(orderId),
      loadPendingPaymentBills(orderId),
      loadDetailPaymentRecords(orderId),
    ])
    await fetchOrders()

    const latestRecord = latestUserOptionalChangeRecord.value
    if (shouldShowOptionalChangePendingBillTag(latestRecord)) {
      detailTab.value = 'bills'
    }

    if (changeType === 'ADD_ONLY') {
      const latestOptionChangeBill = latestPendingOptionalChangeBill.value
      if (latestOptionChangeBill) {
        detailTab.value = 'bills'
        openPendingBillPaymentModal(latestOptionChangeBill)
        message.success('选配已调整，补价账单已生成，请在账单支付中完成付款')
      } else {
        message.success('选配已调整成功')
      }
      return
    }

    message.success('选配变更申请已提交，等待后台审核')
  } catch (error) {
    void error
    message.error('提交选配变更失败')
  } finally {
    userOptionSubmitting.value = false
  }
}

const parseRefundAuditOperator = (value) => {
  const raw = String(value || '').trim()
  if (!raw) {
    return {
      name: '--',
      phone: '--',
    }
  }

  if (raw.includes('|')) {
    const [namePart, phonePart] = raw.split('|')
    return {
      name: (namePart || '').trim() || '--',
      phone: (phonePart || '').trim() || '--',
    }
  }

  if (/^1\d{10}$/.test(raw)) {
    return {
      name: '--',
      phone: raw,
    }
  }

  return {
    name: raw,
    phone: '--',
  }
}

// const getRefundAuditOperatorName = (value) =>
//   parseRefundAuditOperator(value).name

const getRefundAuditOperatorPhone = (value) =>
  parseRefundAuditOperator(value).phone

const isUserCanceledRefund = (target) =>
  Number(target?.status ?? target?.refundStatus) === 2 &&
  String(target?.auditRemark || target?.refundDetail?.auditRemark || '').trim() ===
    '用户撤销退款申请'

const getRefundStatusText = (target) => {
  if (isUserCanceledRefund(target)) return '已撤销'
  const status = Number(target?.status ?? target?.refundStatus)
  return refundStatusMap[status] || '未知'
}

const getRefundStatusTagType = (target) => {
  const value = Number(target?.status ?? target?.refundStatus ?? target)
  if (isUserCanceledRefund(target)) return 'default'
  if (value === 4) return 'success'
  if (value === 2 || value === 5) return 'error'
  if (value === 1) return 'info'
  return 'warning'
}

const isRefundActiveStatus = (status) => {
  if (status === null || status === undefined || status === '') return false
  return [0, 1, 3].includes(Number(status))
}
const getPaymentRecordRefundStatus = (record) => {
  if (
    record?.refundStatus === null ||
    record?.refundStatus === undefined ||
    record?.refundStatus === ''
  ) {
    return null
  }

  const status = Number(record.refundStatus)
  return Number.isNaN(status) ? null : status
}

const canOpenRefundCenter = (row) => {
  const status = getOrderPaymentStatus(row)
  const hasPaidAmount = Number(row?.paidAmount || 0) > 0
  const hasPaymentRecord = Boolean(getPaymentRecordIdFromOrder(row))
  if (status === 0 && !hasPaidAmount && !hasPaymentRecord) return false
  return true
}

const canApplyRefundForPaymentRecord = (record) => {
  if (!record) return false

  const amount = Number(record.amount || 0)
  if (!(amount > 0)) return false

  const refundStatus = getPaymentRecordRefundStatus(record)

  if (isRefundActiveStatus(refundStatus)) {
    return false
  }

  if (refundStatus !== null && ![2, 5].includes(refundStatus)) {
    return false
  }

  return true
}

const resolvePaymentRecordId = (record) => {
  const value = Number(record?.id || record?.paymentRecordId || 0)
  return value > 0 ? value : null
}

const findDetailPaymentRecordById = (paymentRecordId) => {
  const normalizedId = Number(paymentRecordId || 0)
  if (!(normalizedId > 0)) return null

  return (
    detailPaymentRecords.value.find(
      (item) => resolvePaymentRecordId(item) === normalizedId,
    ) || null
  )
}

const resolveOptionalChangePaymentRecordId = (record) => {
  const candidates = [
    record?.paymentRecordId,
    record?.linkedPaymentRecordId,
    record?.refundDetail?.paymentRecordId,
  ]

  for (const candidate of candidates) {
    const resolvedId = Number(candidate || 0)
    if (resolvedId > 0) {
      return resolvedId
    }
  }

  return null
}

const canCancelRefundForPaymentRecord = (record) => {
  if (!canApplyRefund.value || !record) return false
  return getPaymentRecordRefundStatus(record) === 0
}

const canViewRefundDetailForPaymentRecord = (record) =>
  canViewRefund.value && getPaymentRecordRefundStatus(record) === 4

const isLatestOptionalChangeRefundPaymentRecord = (record) => {
  const latestRecordId = resolvePaymentRecordId(latestOptionalChangeRefundPaymentRecord.value)
  const currentRecordId = resolvePaymentRecordId(record)
  return Boolean(
    latestOptionalChangeNeedsRefundSource.value &&
      latestRecordId &&
      currentRecordId &&
      latestRecordId === currentRecordId,
  )
}

const canApplyRefundForPaymentRecordInList = (record) =>
  isLatestOptionalChangeRefundPaymentRecord(record) &&
  canApplyRefundForPaymentRecord(record)

const canCancelRefundForPaymentRecordInList = (record) =>
  isLatestOptionalChangeRefundPaymentRecord(record) &&
  canCancelRefundForPaymentRecord(record)

const canViewRefundDetailForPaymentRecordInList = (record) =>
  isLatestOptionalChangeRefundPaymentRecord(record) &&
  canViewRefundDetailForPaymentRecord(record)

const hasDetailPaymentRecords = computed(() => detailPaymentRecords.value.length > 0)

const loadDetailPaymentRecords = async (orderId) => {
  const userId = getStoredUserId()
  try {
    await orderStore.loadDetailPaymentRecords({
      orderId,
      userId,
      canViewRefund: canViewRefund.value,
    })
  } catch (error) {
    void error
  }
}

const openRefundModal = (
  paymentRecord,
  { paymentStageText = '', productName = '' } = {},
) => {
  if (!canApplyRefundForPaymentRecord(paymentRecord)) {
    message.warning('当前订单暂不支持申请退款')
    return
  }

  const paymentRecordId = resolvePaymentRecordId(paymentRecord)

  refundTarget.value = {
    orderId: currentOrder.value?.id || paymentRecord?.orderId || null,
    orderNumber: currentOrder.value?.orderNumber || '--',
    productName: productName || getOrderProductName(currentOrder.value),
    paidAmount: Number(currentOrder.value?.paidAmount || 0),
    paymentRecordId,
    paymentStage:
      paymentStageText || getDetailPaymentStageText(paymentRecord?.paymentStage),
    paymentAmount: Number(paymentRecord?.amount || 0),
  }

  refundForm.reason = ''
  refundQuickReason.value = null

  showRefundModal.value = true
}

const openLatestOptionalChangeRefundModal = () => {
  const paymentRecord = latestOptionalChangeRefundPaymentRecord.value
  if (!paymentRecord) {
    message.warning('未获取到当前订单最近一次已支付节点进度款，请先完成节点付款后再重试')
    return
  }

  openRefundModal(paymentRecord, {
    paymentStageText: '当前订单最近一次已支付节点进度款',
  })
}

const openRefundDetailModal = async (paymentRecord) => {
  const userId = getStoredUserId()
  const orderId = Number(currentOrder.value?.id || paymentRecord?.orderId || 0)
  const paymentRecordId = resolvePaymentRecordId(paymentRecord)
  if (!userId || !orderId || !paymentRecordId || Number.isNaN(paymentRecordId)) {
    message.warning('未获取到退款详情所需的支付流水信息')
    return
  }

  showRefundDetailModal.value = true

  try {
    const res = await orderStore.fetchRefundDetail({
      orderId,
      userId,
      paymentRecordId,
    })
    if (!(res?.code === 200 && res?.data)) {
      message.error(res.msg || '获取退款详情失败')
    }
  } catch (error) {
    const msg =
      error?.response?.data?.msg ||
      error?.msg ||
      error?.message ||
      '获取退款详情失败'
    message.error(String(msg))
  }
}

const openLatestOptionalChangeRefundDetailModal = () => {
  const paymentRecord = latestOptionalChangeRefundPaymentRecord.value
  if (!paymentRecord) {
    message.warning('未获取到当前订单最近一次已支付节点进度款，请先完成节点付款后再重试')
    return
  }

  openRefundDetailModal(paymentRecord)
}

const submitRefundApply = async () => {
  const userId = getStoredUserId()
  const orderId = refundTarget.value.orderId
  const paymentRecordId = Number(refundTarget.value.paymentRecordId || 0)
  const reason = refundForm.reason.trim()

  if (!userId) {
    message.error('登录状态失效，请重新登录')
    return
  }
  if (!orderId) {
    message.error('未获取到订单信息')
    return
  }
  if (!paymentRecordId || Number.isNaN(paymentRecordId)) {
    message.error('未获取到系统关联的支付流水，请刷新后重试')
    return
  }
  if (!reason) {
    message.error('请填写退款原因')
    return
  }

  closeRefundModal()
  try {
    const res = await orderStore.submitRefundApply({
      userId,
      paymentRecordId,
      reason,
      orderId,
    })
    if (res.code === 200) {
      message.success('退款申请已提交，等待后台审核')
      if (currentOrder.value?.id === orderId) {
        await loadDetailPaymentRecords(orderId)
        await syncCurrentOrderFromServer(orderId)
      }
      await fetchOrders()
    } else {
      message.error(res.msg || '退款申请提交失败')
    }
  } catch (error) {
    const msg =
      error?.response?.data?.msg ||
      error?.msg ||
      error?.message ||
      '退款申请提交失败'
    message.error(String(msg))
  }
}

const handleCancelRefundApply = (paymentRecord) => {
  const userId = getStoredUserId()
  const orderId = Number(currentOrder.value?.id || paymentRecord?.orderId || 0)
  const paymentRecordId = resolvePaymentRecordId(paymentRecord)

  if (!userId || !orderId || !paymentRecordId || Number.isNaN(paymentRecordId)) {
    message.warning('未获取到取消退款申请所需信息')
    return
  }

  if (!canCancelRefundForPaymentRecord(paymentRecord)) {
    message.warning('当前退款申请不可撤销')
    return
  }

  dialog.warning({
    title: '取消退款申请',
    content: '确定撤销当前待审核的退款申请吗？撤销后可重新发起申请。',
    positiveText: '确认撤销',
    negativeText: '暂不撤销',
    onPositiveClick: async () => {
      try {
        const res = await orderStore.submitRefundCancel({
          userId,
          paymentRecordId,
          orderId,
        })
        if (res.code === 200) {
          message.success(res.msg || '退款申请已撤销')
          await loadDetailPaymentRecords(orderId)
          await syncCurrentOrderFromServer(orderId)
          await fetchOrders()
          return true
        }
        message.error(res.msg || '取消退款申请失败')
        return false
      } catch (error) {
        const msg =
          error?.response?.data?.msg ||
          error?.msg ||
          error?.message ||
          '取消退款申请失败'
        message.error(String(msg))
        return false
      }
    },
  })
}

const cancelLatestOptionalChangeRefundApply = () => {
  const paymentRecord = latestOptionalChangeRefundPaymentRecord.value
  if (!paymentRecord) {
    message.warning('未获取到当前订单最近一次已支付节点进度款，请先完成节点付款后再重试')
    return
  }

  handleCancelRefundApply(paymentRecord)
}

const handleCancelOrder = (row) => {
  const orderStatus = Number(row?.orderStatus)

  if (orderStatus === 4) {
    message.warning('已完成订单不能取消')
    return
  }

  if (orderStatus === 5) {
    message.warning('该订单已取消')
    return
  }

  if (hasUploadedContract(row)) {
    message.warning('合同已上传，订单不能在线取消')
    return
  }

  const hasPaidAmount = getOrderPaymentStatus(row) !== 0

  dialog.warning({
    title: '取消订单',
    content: hasPaidAmount
      ? '确定要取消该订单吗？订单取消后将自动提交退款申请，等待后台审核。'
      : '确定要取消该订单吗？此操作无法恢复。',
    positiveText: '确认取消',
    negativeText: '暂不取消',
    onPositiveClick: async () => {
      const userId = getStoredUserId()
      if (!userId || !row?.id) {
        message.error('登录状态失效，请重新登录')
        return false
      }

      try {
        const res = await orderAPI.cancelOrder(row.id, userId, '用户取消订单')
        if (res.code === 200) {
          message.success(
            hasPaidAmount
              ? '订单已取消，已自动提交退款申请，请等待后台审核'
              : '订单已取消',
          )
          await fetchOrders()
          if (currentOrder.value?.id === row.id) {
            await viewOrderDetail({ ...row, orderStatus: 5 }, detailTab.value)
          }
        } else {
          message.error(res.msg || '取消失败')
          return false
        }
      } catch (err) {
        const msg =
          err?.response?.data?.msg ||
          err?.msg ||
          err?.message ||
          '取消订单失败'
        message.error(String(msg))
        return false
      }
    },
  })
}

const closePaymentModal = () => {
  if (!paymentSubmitting.value) {
    showPaymentModal.value = false
    resetPaymentTarget()
  }
}

const resetPaymentTarget = () => {
  paymentForm.channel = 'ALIPAY'
  paymentTarget.orderId = null
  paymentTarget.billId = null
  paymentTarget.billType = ''
  paymentTarget.nodeId = null
  paymentTarget.amount = 0
  paymentTarget.amountText = ''
  paymentTarget.title = ''
  paymentTarget.description = ''
}

const openPaymentResultWindow = (
  content,
  isHtml = false,
  targetWindow = null,
) => {
  if (!content) return false

  const popup = targetWindow || window.open('', '_blank')
  if (!popup) {
    if (isHtml) {
      const container = document.createElement('div')
      container.style.display = 'none'
      container.innerHTML = content
      document.body.appendChild(container)

      const form = container.querySelector('form')
      if (form) {
        form.setAttribute('target', '_self')
        form.submit()
        setTimeout(() => {
          container.remove()
        }, 1000)
        return true
      }

      container.remove()
      return false
    }

    if (!isHtml) {
      window.location.href = content
      return true
    }
  }

  if (isHtml) {
    popup.document.open()
    popup.document.write(content)
    popup.document.close()
  } else {
    popup.location.href = content
  }

  return true
}

const decodeHtmlEntities = (value) => {
  if (typeof value !== 'string' || !value) return ''
  if (typeof document === 'undefined') return value
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

const parsePaymentBizContent = (html) => {
  if (typeof html !== 'string' || !html.trim()) return null

  const match = html.match(
    /<input[^>]*name=["']biz_content["'][^>]*value=["']([^"']*)["'][^>]*>/i,
  )
  const encodedBizContent = match?.[1]
  if (!encodedBizContent) return null

  const decodedBizContent = decodeHtmlEntities(encodedBizContent)
  if (!decodedBizContent) return null

  try {
    const parsed = JSON.parse(decodedBizContent)
    const amount = Number(parsed?.total_amount)
    return {
      outTradeNo: parsed?.out_trade_no || '',
      subject: parsed?.subject || '',
      totalAmount: Number.isFinite(amount) ? amount : null,
      rawBizContent: decodedBizContent,
    }
  } catch (error) {
    return {
      outTradeNo: '',
      subject: '',
      totalAmount: null,
      rawBizContent: decodedBizContent,
    }
  }
}

const resolvePaymentPayloadMeta = (payload, visited = new Set()) => {
  if (!payload) return null

  if (typeof payload === 'string') {
    const content = payload.trim()
    if (!content) return null

    if (content.includes('<form') || content.includes('<html')) {
      return {
        kind: 'html',
        ...parsePaymentBizContent(content),
      }
    }

    if (
      content.startsWith('http://') ||
      content.startsWith('https://') ||
      content.startsWith('//') ||
      content.startsWith('weixin://')
    ) {
      return {
        kind: 'url',
        url: content,
      }
    }

    return {
      kind: 'text',
      value: content,
    }
  }

  if (typeof payload !== 'object' || visited.has(payload)) return null
  visited.add(payload)

  const htmlContent =
    payload.formHtml ||
    payload.html ||
    payload.body ||
    payload.payHtml ||
    payload.paymentHtml
  if (typeof htmlContent === 'string' && htmlContent.trim()) {
    return {
      kind: 'html',
      ...parsePaymentBizContent(htmlContent),
    }
  }

  const redirectUrl =
    payload.payUrl ||
    payload.paymentUrl ||
    payload.redirectUrl ||
    payload.url ||
    payload.codeUrl ||
    payload.qrCodeUrl ||
    payload.qrCode
  if (typeof redirectUrl === 'string' && redirectUrl.trim()) {
    return {
      kind: redirectUrl.startsWith('weixin://') ? 'wechat-url' : 'url',
      url: redirectUrl.trim(),
    }
  }

  for (const key of ['data', 'result', 'payload']) {
    const nestedMeta = resolvePaymentPayloadMeta(payload[key], visited)
    if (nestedMeta) return nestedMeta
  }

  return null
}

const tryOpenPaymentPayload = (
  payload,
  visited = new Set(),
  targetWindow = null,
) => {
  if (!payload) return false

  if (typeof payload === 'string') {
    const content = payload.trim()
    if (!content) return false

    if (
      content.startsWith('http://') ||
      content.startsWith('https://') ||
      content.startsWith('//')
    ) {
      return openPaymentResultWindow(content, false, targetWindow)
    }

    if (content.includes('<form') || content.includes('<html')) {
      return openPaymentResultWindow(content, true, targetWindow)
    }

    return false
  }

  if (typeof payload !== 'object' || visited.has(payload)) return false
  visited.add(payload)

  const htmlContent =
    payload.formHtml ||
    payload.html ||
    payload.body ||
    payload.payHtml ||
    payload.paymentHtml
  if (typeof htmlContent === 'string' && htmlContent.trim()) {
    return openPaymentResultWindow(htmlContent, true, targetWindow)
  }

  const redirectUrl =
    payload.payUrl ||
    payload.paymentUrl ||
    payload.redirectUrl ||
    payload.url ||
    payload.codeUrl ||
    payload.qrCodeUrl ||
    payload.qrCode
  if (typeof redirectUrl === 'string' && redirectUrl.trim()) {
    return openPaymentResultWindow(redirectUrl, false, targetWindow)
  }

  return ['data', 'result', 'payload'].some((key) =>
    tryOpenPaymentPayload(payload[key], visited, targetWindow),
  )
}

const resolveWechatPayUrl = (payload, visited = new Set()) => {
  if (!payload) return ''

  if (typeof payload === 'string') {
    const content = payload.trim()
    return content.startsWith('weixin://') ? content : ''
  }

  if (typeof payload !== 'object' || visited.has(payload)) return ''
  visited.add(payload)

  const candidates = [
    payload.data,
    payload.result,
    payload.payload,
    payload.codeUrl,
    payload.qrCode,
    payload.qrCodeUrl,
    payload.url,
  ]

  for (const candidate of candidates) {
    const value = resolveWechatPayUrl(candidate, visited)
    if (value) return value
  }

  return ''
}

const extractPaymentBillRows = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.records)) return data.records
  return []
}

const sortPendingPaymentBills = (rows = []) =>
  [...rows].sort((a, b) => {
    const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
    const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return Number(b?.id || 0) - Number(a?.id || 0)
  })

const sortOptionalChangeRecords = (records = []) =>
  [...records].sort((a, b) => {
    const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
    const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return Number(b?.id || 0) - Number(a?.id || 0)
  })

const logConstructionBillDebug = (label, extra = {}) => {
  console.info('[user-center-construction-bill]', {
    label,
    orderId: currentOrder.value?.id || null,
    detailTab: detailTab.value,
    currentNodeStatus: constructionInfo.value?.currentNodeStatus ?? null,
    currentNodeStatusText: constructionInfo.value?.currentNodeStatusText || '',
    currentNodeName: constructionInfo.value?.currentNodeName || '',
    currentNodeIndex: constructionInfo.value?.currentNodeIndex ?? null,
    currentNodeDetailId: currentNodeDetail.value?.nodeId || null,
    currentNodeDetailName: currentNodeDetail.value?.nodeName || '',
    currentNodeDetailAmount: currentNodeDetail.value?.amount ?? null,
    pendingBills: (pendingPaymentBills.value || []).map((item) => ({
      id: item?.id || null,
      billType: item?.billType || '',
      relatedNodeId: item?.relatedNodeId || null,
      amount: item?.amount ?? null,
      billTitle: item?.billTitle || '',
      isVirtualConstructionBill: !!item?.isVirtualConstructionBill,
    })),
    ...extra,
  })
}

const syncPendingPaymentBillsState = (rows = []) => {
  const nextRows = sortPendingPaymentBills(rows)
  pendingPaymentBills.value = nextRows
  if (currentOrder.value) {
    currentOrder.value.pendingPaymentBills = nextRows
  }
  logConstructionBillDebug('syncPendingPaymentBillsState', {
    nextBillCount: nextRows.length,
  })
  return nextRows
}

const loadPendingPaymentBills = async (orderId = currentOrder.value?.id) => {
  const userId = getStoredUserId()
  if (!orderId || !userId) {
    pendingPaymentBills.value = []
    return []
  }

  pendingPaymentBillsLoading.value = true
  try {
    const res = await orderAPI.getUserPaymentBills(orderId, userId)
    console.info('[user-center-construction-bill] payment-bills response', {
      orderId,
      code: res?.code,
      data: res?.data,
    })
    if (res.code === 200) {
      return syncPendingPaymentBillsState(extractPaymentBillRows(res.data))
    }
    return pendingPaymentBills.value
  } catch (error) {
    void error
    return pendingPaymentBills.value
  } finally {
    pendingPaymentBillsLoading.value = false
  }
}

const findPendingBillById = (bills = [], billId) =>
  bills.find((item) => Number(item?.id || 0) === Number(billId)) || null

const findPendingStageBillByNodeId = (bills = [], nodeId) =>
  bills.find(
    (item) =>
      item?.billType === 'STAGE_PAYMENT' &&
      Number(item?.relatedNodeId || 0) === Number(nodeId),
  ) || null

const resolveConstructionPaymentBillId = async (orderId, nodeId) => {
  if (!orderId || !nodeId) return null
  const latestBills = await loadPendingPaymentBills(orderId)
  return findPendingStageBillByNodeId(latestBills, nodeId)?.id || null
}

const refreshOrderAfterPayment = async () => {
  if (!currentOrder.value?.id) return
  stopPaymentStatusPolling()
  await syncCurrentOrderFromServer(currentOrder.value.id)
  hydrateUserOptionSelection()
  await loadUserOptionalChangeRecords(currentOrder.value.id)
  await loadPendingPaymentBills(currentOrder.value.id)
  await loadDetailPaymentRecords(currentOrder.value.id)
  await fetchOrders()
}

const isConstructionNodeWaitingPayment = computed(() => {
  if (!constructionInfo.value?.nodeDetails?.length) return false
  return (
    Number(constructionInfo.value.currentNodeStatus) ===
    CONSTRUCTION_NODE_STATUS.WAIT_PAYMENT
  )
})

const showConstructionPaymentResult = () => {
  if (!showDetailModal.value || !currentOrder.value?.id) return
  if (detailTab.value === 'bills') {
    detailTab.value = 'payments'
  }
}

const refreshConstructionAfterNodePayment = async (
  orderId = constructionPaymentTracker.orderId || currentOrder.value?.id,
  options = {},
) => {
  if (!orderId) return
  await syncCurrentOrderFromServer(orderId)
  await loadPendingPaymentBills(orderId)
  await loadDetailPaymentRecords(orderId)
  await loadConstructionFlow(orderId)
  await fetchOrders()
  if (options.focusPaymentResult) {
    showConstructionPaymentResult()
  }
}

const syncCurrentOrderFromServer = async (orderId = currentOrder.value?.id) => {
  const userId = getStoredUserId()
  return orderStore.syncCurrentOrderFromServer({ userId, orderId })
}

const syncDesignOrderDetailFromServer = async (
  designOrderId = currentDesignOrder.value?.id,
) => {
  const userId = getStoredUserId()
  if (!userId || !designOrderId) return null

  try {
    const res = await designOrderAPI.getDetail(designOrderId, userId)
    logDesignOrderPaymentDebug('sync detail response', {
      designOrderId,
      code: res?.code,
      paymentStatus: res?.data?.paymentStatus,
      designStatus: res?.data?.designStatus,
      pendingBillId: res?.data?.pendingBillId,
    })
    if (res.code === 200 && res.data) {
      return res.data
    }
    return null
  } catch (error) {
    void error
    return null
  }
}

const confirmDesignOrderBillPayment = async (billId) => {
  const userId = getStoredUserId()
  if (!userId || !billId) return null

  try {
    const res = await designOrderAPI.confirmBillPayment(billId, userId)
    logDesignOrderPaymentDebug('confirm bill response', {
      billId,
      code: res?.code,
      paid: res?.data?.paid,
      billStatus: res?.data?.billStatus,
      compensated: res?.data?.compensated,
    })
    if (res.code === 200 && res.data) {
      return res.data
    }
    return null
  } catch (error) {
    void error
    return null
  }
}

const confirmUserBillPayment = async (billId) => {
  const userId = getStoredUserId()
  if (!userId || !billId) return null

  try {
    const res = await orderAPI.confirmBillPayment(billId, userId)
    if (res.code === 200 && res.data) {
      return res.data
    }
    return null
  } catch (error) {
    void error
    return null
  }
}

const isDesignOrderPaymentDone = (detail) =>
  !!detail && Number(detail.paymentStatus) >= 1

const stopDesignPaymentStatusPolling = () => {
  if (designPaymentStatusPollTimer) {
    window.clearTimeout(designPaymentStatusPollTimer)
    designPaymentStatusPollTimer = null
  }
  designOrderPaymentTracker.orderId = null
  designOrderPaymentTracker.billId = null
}

const refreshDesignOrderAfterPayment = async (
  designOrderId = designOrderPaymentTracker.orderId || currentDesignOrder.value?.id,
  latestDetail = null,
) => {
  if (!designOrderId) return

  await fetchDesignOrders()

  const matchedRow =
    designOrderList.value.find(
      (item) => Number(item?.id) === Number(designOrderId),
    ) || null
  const resolvedDetail = latestDetail || (await syncDesignOrderDetailFromServer(designOrderId))
  logDesignOrderPaymentDebug('refresh after payment', {
    designOrderId,
    listPaymentStatus: matchedRow?.paymentStatus,
    detailPaymentStatus: resolvedDetail?.paymentStatus,
    detailDesignStatus: resolvedDetail?.designStatus,
    detailPendingBillId: resolvedDetail?.pendingBillId,
  })

  if (currentDesignOrder.value?.id && Number(currentDesignOrder.value.id) === Number(designOrderId)) {
    currentDesignOrder.value = {
      ...currentDesignOrder.value,
      ...(matchedRow || {}),
      ...(resolvedDetail || {}),
    }
  }
}

const stopPaymentStatusPolling = () => {
  if (paymentStatusPollTimer) {
    window.clearTimeout(paymentStatusPollTimer)
    paymentStatusPollTimer = null
  }
  orderPaymentTracker.orderId = null
  orderPaymentTracker.billId = null
  orderPaymentTracker.billType = ''
}

const isInitialOrderPaymentDone = (status) => [1, 2, 3].includes(Number(status))

const startPaymentStatusPolling = (
  orderId,
  billId = null,
  billType = '',
  attempts = 40,
  delay = 3000,
) => {
  stopPaymentStatusPolling()
  if (!orderId) return
  orderPaymentTracker.orderId = orderId
  orderPaymentTracker.billId = billId
  orderPaymentTracker.billType = billType || ''

  const poll = async () => {
    if (billId) {
      const confirmResult = await confirmUserBillPayment(billId)
      let paid = !!confirmResult?.paid

      if (!paid) {
        const latestBills = await loadPendingPaymentBills(orderId)
        paid = !findPendingBillById(latestBills, billId)
      }

      if (paid) {
        await refreshOrderAfterPayment()
        stopPaymentStatusPolling()
        return
      }
    }

    const latestOrder = await syncCurrentOrderFromServer(orderId)

    if (!latestOrder) {
      if (attempts <= 1) {
        stopPaymentStatusPolling()
        return
      }
      attempts -= 1
      paymentStatusPollTimer = window.setTimeout(poll, delay)
      return
    }

    if (!billId && isInitialOrderPaymentDone(latestOrder.paymentStatus)) {
      orderPaymentTracker.orderId = null
      await fetchOrders()
      stopPaymentStatusPolling()
      return
    }

    if (attempts <= 1) {
      stopPaymentStatusPolling()
      return
    }

    attempts -= 1
    paymentStatusPollTimer = window.setTimeout(poll, delay)
  }

  paymentStatusPollTimer = window.setTimeout(poll, delay)
}

const syncPendingOrderPaymentOnFocus = async () => {
  if (!orderPaymentTracker.orderId) return

  if (orderPaymentTracker.billId) {
    const confirmResult = await confirmUserBillPayment(orderPaymentTracker.billId)
    let paid = !!confirmResult?.paid

    if (!paid) {
      const latestBills = await loadPendingPaymentBills(orderPaymentTracker.orderId)
      paid = !findPendingBillById(latestBills, orderPaymentTracker.billId)
    }

    if (paid) {
      stopPaymentStatusPolling()
      await refreshOrderAfterPayment()
      return
    }
  }

  const latestOrder = await syncCurrentOrderFromServer(orderPaymentTracker.orderId)
  if (!latestOrder) return

  if (!orderPaymentTracker.billId && isInitialOrderPaymentDone(latestOrder.paymentStatus)) {
    orderPaymentTracker.orderId = null
    stopPaymentStatusPolling()
    await fetchOrders()
    return
  }

  if (!paymentStatusPollTimer) {
    startPaymentStatusPolling(
      orderPaymentTracker.orderId,
      orderPaymentTracker.billId,
      orderPaymentTracker.billType,
    )
  }
}

const startDesignPaymentStatusPolling = (
  designOrderId,
  billId = null,
  attempts = 40,
  delay = 3000,
) => {
  stopDesignPaymentStatusPolling()
  if (!designOrderId) return
  designOrderPaymentTracker.orderId = designOrderId
  designOrderPaymentTracker.billId = billId

  const poll = async () => {
    let latestDetail = null
    const trackedBillId = Number(billId || 0)

    if (trackedBillId > 0) {
      const confirmResult = await confirmDesignOrderBillPayment(trackedBillId)
      if (confirmResult?.paid) {
        latestDetail = await syncDesignOrderDetailFromServer(designOrderId)
        await refreshDesignOrderAfterPayment(designOrderId, latestDetail)
        stopDesignPaymentStatusPolling()
        return
      }
    }

    latestDetail = latestDetail || (await syncDesignOrderDetailFromServer(designOrderId))
    const latestPendingBillId = Number(latestDetail?.pendingBillId || 0)
    if (
      isDesignOrderPaymentDone(latestDetail) ||
      (trackedBillId > 0 && latestPendingBillId !== trackedBillId)
    ) {
      await refreshDesignOrderAfterPayment(designOrderId, latestDetail)
      stopDesignPaymentStatusPolling()
      return
    }

    if (currentDesignOrder.value?.id && Number(currentDesignOrder.value.id) === Number(designOrderId) && latestDetail) {
      currentDesignOrder.value = {
        ...currentDesignOrder.value,
        ...latestDetail,
      }
    }

    if (attempts <= 1) {
      stopDesignPaymentStatusPolling()
      return
    }

    attempts -= 1
    designPaymentStatusPollTimer = window.setTimeout(poll, delay)
  }

  designPaymentStatusPollTimer = window.setTimeout(poll, delay)
}

const syncPendingDesignOrderPaymentOnFocus = async () => {
  if (!designOrderPaymentTracker.orderId) return

  const trackedBillId = Number(designOrderPaymentTracker.billId || 0)
  if (trackedBillId > 0) {
    const confirmResult = await confirmDesignOrderBillPayment(trackedBillId)
    if (confirmResult?.paid) {
      const latestDetail = await syncDesignOrderDetailFromServer(
        designOrderPaymentTracker.orderId,
      )
      stopDesignPaymentStatusPolling()
      await refreshDesignOrderAfterPayment(
        designOrderPaymentTracker.orderId,
        latestDetail,
      )
      return
    }
  }

  const latestDetail = await syncDesignOrderDetailFromServer(
    designOrderPaymentTracker.orderId,
  )
  if (!latestDetail) return

  await refreshDesignOrderAfterPayment(
    designOrderPaymentTracker.orderId,
    latestDetail,
  )

  const latestPendingBillId = Number(latestDetail.pendingBillId || 0)
  if (
    isDesignOrderPaymentDone(latestDetail) ||
    (trackedBillId > 0 && latestPendingBillId !== trackedBillId)
  ) {
    stopDesignPaymentStatusPolling()
    return
  }

  if (!designPaymentStatusPollTimer) {
    startDesignPaymentStatusPolling(
      designOrderPaymentTracker.orderId,
      designOrderPaymentTracker.billId,
    )
  }
}

const initDesignOrderPaymentTracking = async () => {
  stopDesignPaymentStatusPolling()
}

const handleReturnToPage = () => {
  syncPendingOrderPaymentOnFocus()
  syncPendingDesignOrderPaymentOnFocus()
  syncPendingConstructionPaymentOnFocus()
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    handleReturnToPage()
  }
}

const handleWindowFocus = () => {
  handleReturnToPage()
}

const clearConstructionPaymentTracking = () => {
  constructionPaymentTracker.orderId = null
  constructionPaymentTracker.nodeId = null
  constructionPaymentTracker.billId = null
}

const stopConstructionPaymentPolling = (clearTracking = false) => {
  if (constructionPaymentPollTimer) {
    window.clearTimeout(constructionPaymentPollTimer)
    constructionPaymentPollTimer = null
  }
  if (clearTracking) {
    clearConstructionPaymentTracking()
  }
}

const isConstructionNodePaid = (statusData, nodeId) => {
  if (!statusData?.nodeDetails || !nodeId) return false
  const targetNode = statusData.nodeDetails.find(
    (node) => Number(node.nodeId || node.id) === Number(nodeId),
  )
  return Number(targetNode?.isPaid) === 1
}

const startConstructionPaymentPolling = (
  orderId,
  nodeId,
  billId = null,
  attempts = 20,
  delay = 3000,
) => {
  stopConstructionPaymentPolling(true)
  if (!orderId || !nodeId) return

  constructionPaymentTracker.orderId = orderId
  constructionPaymentTracker.nodeId = nodeId
  constructionPaymentTracker.billId = billId

  const poll = async () => {
    if (billId) {
      const confirmResult = await confirmUserBillPayment(billId)
      if (confirmResult?.paid) {
        await refreshConstructionAfterNodePayment(orderId, {
          focusPaymentResult: true,
        })
        stopConstructionPaymentPolling(true)
        return
      }
    }

    try {
      const res = await ConstructionAPI.getConstructionStatus(orderId)
      const flow = normalizeConstructionFlow(res?.data)
      if (res.code === 200 && flow) {
        if (isConstructionNodePaid(flow, nodeId)) {
          await refreshConstructionAfterNodePayment(orderId, {
            focusPaymentResult: true,
          })
          stopConstructionPaymentPolling(true)
          return
        }
      }
    } catch (error) {
      console.error('Poll construction payment status failed', error)
    }

    if (attempts <= 1) {
      stopConstructionPaymentPolling()
      return
    }

    attempts -= 1
    constructionPaymentPollTimer = window.setTimeout(poll, delay)
  }

  constructionPaymentPollTimer = window.setTimeout(poll, delay)
}

const syncPendingConstructionPaymentOnFocus = async () => {
  const trackedOrderId = constructionPaymentTracker.orderId
  const trackedNodeId = constructionPaymentTracker.nodeId
  const trackedBillId = constructionPaymentTracker.billId

  if (!trackedOrderId || !trackedNodeId) return

  if (trackedBillId) {
    const confirmResult = await confirmUserBillPayment(trackedBillId)
    if (confirmResult?.paid) {
      await refreshConstructionAfterNodePayment(trackedOrderId, {
        focusPaymentResult: true,
      })
      stopConstructionPaymentPolling(true)
      return
    }
  }

  try {
    const res = await ConstructionAPI.getConstructionStatus(trackedOrderId)
    const flow = normalizeConstructionFlow(res?.data)
    if (!(res.code === 200 && flow)) return

    if (isConstructionNodePaid(flow, trackedNodeId)) {
      await refreshConstructionAfterNodePayment(trackedOrderId, {
        focusPaymentResult: true,
      })
      stopConstructionPaymentPolling(true)
      return
    }
  } catch (error) {
    console.error('Sync construction payment status on focus failed', error)
    return
  }

  if (!constructionPaymentPollTimer) {
    startConstructionPaymentPolling(
      trackedOrderId,
      trackedNodeId,
      trackedBillId,
    )
  }
}

const openBillPaymentTab = async () => {
  if (!currentOrder.value?.id) return
  detailTab.value = 'bills'
  await loadConstructionFlow(currentOrder.value.id)
  await loadPendingPaymentBills(currentOrder.value.id)
}

const openPendingBillPaymentModal = (bill) => {
  if (!currentOrder.value?.id || !bill) return
  if (!bill.id && !bill.isVirtualConstructionBill) {
    message.warning('当前账单尚未生成，请刷新后重试')
    return
  }

  paymentForm.channel = 'ALIPAY'
  paymentTarget.orderId = currentOrder.value.id
  paymentTarget.billId = bill.id || null
  paymentTarget.billType = bill.billType || ''
  paymentTarget.nodeId = bill.relatedNodeId || null
  paymentTarget.amount = Number(bill.amount || 0)
  paymentTarget.amountText = `¥${Number(bill.amount || 0).toLocaleString()}`
  paymentTarget.title = getPaymentBillDisplayTitle(bill)
  paymentTarget.description =
    bill.remark || `订单号：${currentOrder.value.orderNumber || '--'}`
  showPaymentModal.value = true
}

const submitPayment = async () => {
  const userId = getStoredUserId()
  const pollingOrderId = paymentTarget.orderId
  const pollingNodeId = paymentTarget.nodeId
  const pollingBillId = paymentTarget.billId
  if (!userId || !paymentTarget.orderId) {
    message.error('登录状态失效，请重新登录')
    return
  }
  if (!paymentTarget.billId && !paymentTarget.nodeId) {
    message.error('未找到待支付账单')
    return
  }

  paymentSubmitting.value = true
  if (currentOrder.value) {
    currentOrder.value.paying = true
  }

  const paymentWindow =
    paymentForm.channel === 'ALIPAY' ? window.open('', '_blank') : null

  try {
    const isConstructionStagePayment =
      paymentTarget.billType === 'STAGE_PAYMENT' && Number(paymentTarget.nodeId || 0) > 0

    const res = isConstructionStagePayment
      ? await ConstructionAPI.payNode(
          paymentTarget.orderId,
          userId,
          paymentTarget.nodeId,
          paymentForm.channel,
        )
      : paymentTarget.billId
        ? await orderAPI.payBill(
            paymentTarget.billId,
            userId,
            paymentForm.channel,
          )
        : await ConstructionAPI.payNode(
            paymentTarget.orderId,
            userId,
            paymentTarget.nodeId,
            paymentForm.channel,
          )

    const paymentPayloadMeta = resolvePaymentPayloadMeta(res?.data)
    if (
      !pollingNodeId &&
      Number.isFinite(paymentPayloadMeta?.totalAmount) &&
      paymentPayloadMeta.totalAmount >= 0
    ) {
      paymentTarget.amount = paymentPayloadMeta.totalAmount
      paymentTarget.amountText = `¥${paymentPayloadMeta.totalAmount.toLocaleString()}`
    }
    if (res.code !== 200) {
      message.error(res.msg || '支付失败')
      return
    }

    const paymentLabel =
      paymentChannelOptions.find((item) => item.value === paymentForm.channel)
        ?.label || '支付'
    const paymentSubject = paymentTarget.title || '账单支付'
    const trackedConstructionBillId = pollingNodeId
      ? pollingBillId || (await resolveConstructionPaymentBillId(pollingOrderId, pollingNodeId))
      : null
    const wechatUrl = resolveWechatPayUrl(res.data)
    if (paymentForm.channel === 'WECHAT' && wechatUrl) {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }
      paymentResultTarget.orderId = pollingOrderId
      paymentResultTarget.nodeId = pollingNodeId
      paymentResultTarget.billId = pollingBillId || trackedConstructionBillId
      wechatPayUrl.value = wechatUrl
      showPaymentModal.value = false
      showWechatPayModal.value = true
      if (pollingNodeId) {
        startConstructionPaymentPolling(
          pollingOrderId,
          pollingNodeId,
          trackedConstructionBillId,
        )
      } else {
        startPaymentStatusPolling(
          pollingOrderId,
          pollingBillId,
          paymentTarget.billType,
        )
      }
      message.success(`请使用微信扫码完成${paymentSubject}`)
      return
    }

    const opened = tryOpenPaymentPayload(res.data, new Set(), paymentWindow)

    message.success(
      opened
        ? `已发起${paymentLabel}${paymentSubject}，请在新窗口完成付款`
        : `${paymentSubject}请求已发起`,
    )

    showPaymentModal.value = false
    if (pollingNodeId) {
      startConstructionPaymentPolling(
        pollingOrderId,
        pollingNodeId,
        trackedConstructionBillId,
      )
    } else {
      startPaymentStatusPolling(
        pollingOrderId,
        pollingBillId,
        paymentTarget.billType,
      )
    }
  } catch (error) {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close()
    }
    void error
    message.error('支付请求发生错误')
  } finally {
    paymentSubmitting.value = false
    if (currentOrder.value) {
      currentOrder.value.paying = false
    }
    resetPaymentTarget()
  }
}

const fetchOrders = async () => {
  const userId = getStoredUserId()
  if (!userId) {
    message.warning('请先登录')
    return
  }

  try {
    const res = await orderStore.fetchOrders({ userId })
    if (res?.code !== 200) {
      message.error(res?.msg || '获取订单列表失败')
      return
    }
  } catch (error) {
    void error
    message.error('获取订单列表失败')
  }
}

const getDesignOrderStatusText = (status) =>
  designOrderStatusMap[Number(status)] || '未知状态'

const getDesignOrderStatusType = (status) => {
  const numericStatus = Number(status)
  if (numericStatus === 0) return 'warning'
  if (numericStatus === 1) return 'info'
  if (numericStatus === 2) return 'success'
  if (numericStatus === 3) return 'primary'
  if (numericStatus === 4) return 'default'
  if (numericStatus === 5) return 'error'
  return 'default'
}

const formatDesignOrderPaymentStatus = (status) => {
  const numericStatus = Number(status)
  if (numericStatus === 0) return '未支付'
  if (numericStatus === 1) return '已支付'
  if (numericStatus === 2) return '已结清'
  if (numericStatus === 3) return '已退款'
  return '未知'
}

const getDesignOrderPaymentStatusType = (status) => {
  const numericStatus = Number(status)
  if (numericStatus === 1) return 'info'
  if (numericStatus === 2) return 'success'
  if (numericStatus === 3) return 'error'
  return 'warning'
}

const getDesignFileLabel = (file, index, fallbackPrefix = '文件') => {
  const fileUrl = String(file?.fileUrl || '').trim()
  if (!fileUrl) {
    return `${fallbackPrefix}${index + 1}`
  }

  const rawName = fileUrl.split('/').pop() || ''
  return decodeURIComponent(rawName) || `${fallbackPrefix}${index + 1}`
}

const canContinueBuildDesignOrder = (order) =>
  Boolean(order?.canConvertToBuild)

const resolveDesignOrderMainProductId = (order) => {
  const deliveredMpId = Number(order?.deliveredMpId)
  if (Number.isInteger(deliveredMpId) && deliveredMpId > 0) {
    return deliveredMpId
  }

  return getDesignOrderMainProductBinding(order?.id)
}

const loadDesignOrderMainProductId = async (order, userId) => {
  const deliveredMpId = Number(order?.deliveredMpId)
  if (Number.isInteger(deliveredMpId) && deliveredMpId > 0) {
    return deliveredMpId
  }

  const orderId = Number(order?.id)
  if (userId && Number.isInteger(orderId) && orderId > 0) {
    try {
      const res = await designOrderAPI.getDetail(orderId, userId)
      const detailDeliveredMpId = Number(res?.data?.deliveredMpId)
      if (res?.code === 200 && Number.isInteger(detailDeliveredMpId) && detailDeliveredMpId > 0) {
        return detailDeliveredMpId
      }
    } catch (error) {
      void error
    }
  }

  return getDesignOrderMainProductBinding(order?.id)
}

const ensureClientMainProductName = async (mainProductId) => {
  const numericMainProductId = Number(mainProductId)
  if (!Number.isInteger(numericMainProductId) || numericMainProductId <= 0) {
    return ''
  }
  if (designMainProductNameMap[numericMainProductId]) {
    return designMainProductNameMap[numericMainProductId]
  }

  try {
    const res = await houseAPI.getClientHouseDetails(numericMainProductId)
    const productName = String(res?.data?.name || '').trim()
    if (productName) {
      designMainProductNameMap[numericMainProductId] = productName
      return productName
    }
  } catch (error) {
    void error
  }

  return ''
}

const getDesignOrderMainProductNameText = (order) => {
  const mainProductId = resolveDesignOrderMainProductId(order)
  if (!mainProductId) return '--'
  return designMainProductNameMap[mainProductId] || '加载中...'
}

const getDesignOrderListMainProductNameText = (order) =>
  designOrderListMainProductTextMap[order?.id] || '--'

const hydrateDesignOrderListMainProductNames = async (rows = [], userId = null) => {
  await Promise.all(
    rows.map(async (row) => {
      const orderId = Number(row?.id)
      if (!Number.isInteger(orderId) || orderId <= 0) return

      const mainProductId = await loadDesignOrderMainProductId(row, userId)
      if (!mainProductId) {
        designOrderListMainProductTextMap[orderId] = '--'
        return
      }

      const productName = await ensureClientMainProductName(mainProductId)
      designOrderListMainProductTextMap[orderId] = productName || '--'
    }),
  )
}

const canRepayDesignOrder = (order) =>
  Number(order?.paymentStatus) === 0 && Number(order?.pendingBillId) > 0

const canMarkDesignOrderNoBuild = (order) =>
  Number(order?.designStatus) === 2 && !order?.buildOrderId

const fetchDesignOrders = async () => {
  const userId = getStoredUserId()
  if (!userId) {
    designOrderList.value = []
    designPagination.itemCount = 0
    return
  }

  loadingDesignOrders.value = true
  try {
    const res = await designOrderAPI.getList({
      page: designPagination.page,
      pageSize: designPagination.pageSize,
      userId,
    })

    if (res.code !== 200 || !res.data) {
      designOrderList.value = []
      designPagination.itemCount = 0
      message.error(res?.msg || '获取设计订单失败')
      return
    }

    const rows = Array.isArray(res.data.records)
      ? res.data.records
      : Array.isArray(res.data.rows)
        ? res.data.rows
        : []

    designOrderList.value = rows
    designPagination.itemCount = Number(res.data.total || rows.length)
    await hydrateDesignOrderListMainProductNames(rows, userId)
    const trackedRow = rows.find(
      (item) => Number(item?.id) === Number(designOrderPaymentTracker.orderId),
    )
    logDesignOrderPaymentDebug('fetch design orders', {
      trackedOrderId: designOrderPaymentTracker.orderId,
      trackedPaymentStatus: trackedRow?.paymentStatus,
      trackedDesignStatus: trackedRow?.designStatus,
      trackedPendingBillId: trackedRow?.pendingBillId,
      total: rows.length,
    })

    if (trackedRow && Number(trackedRow.paymentStatus) >= 1) {
      if (currentDesignOrder.value?.id && Number(currentDesignOrder.value.id) === Number(trackedRow.id)) {
        currentDesignOrder.value = {
          ...currentDesignOrder.value,
          ...trackedRow,
        }
      }
      stopDesignPaymentStatusPolling()
    }
  } catch (error) {
    void error
    designOrderList.value = []
    designPagination.itemCount = 0
    message.error('获取设计订单失败')
  } finally {
    loadingDesignOrders.value = false
  }
}

const openDesignOrderDetail = async (row) => {
  const userId = getStoredUserId()
  if (!userId || !row?.id) {
    message.error('未找到有效的设计订单')
    return
  }

  showDesignDetailModal.value = true
  loadingDesignDetail.value = true
  currentDesignOrder.value = {
    ...row,
  }

  try {
    const res = await designOrderAPI.getDetail(row.id, userId)
    if (res.code === 200 && res.data) {
      currentDesignOrder.value = {
        ...row,
        ...res.data,
      }
      const mainProductId = resolveDesignOrderMainProductId(currentDesignOrder.value)
      const productName = await ensureClientMainProductName(mainProductId)
      if (mainProductId) {
        designOrderListMainProductTextMap[row.id] = productName || '--'
      }
      if (
        Number(designOrderPaymentTracker.orderId) === Number(row.id) &&
        !isDesignOrderPaymentDone(res.data) &&
        !designPaymentStatusPollTimer
      ) {
        startDesignPaymentStatusPolling(
          designOrderPaymentTracker.orderId,
          designOrderPaymentTracker.billId,
        )
      }
      return
    }
    message.error(res?.msg || '获取设计订单详情失败')
  } catch (error) {
    void error
    message.error('获取设计订单详情失败')
  } finally {
    loadingDesignDetail.value = false
  }
}

const openDesignOrderPaymentModal = async () => {
  if (!currentDesignOrder.value?.id) return

  if (!currentDesignOrder.value?.pendingBillId) {
    const latestDetail = await syncDesignOrderDetailFromServer(currentDesignOrder.value.id)
    if (latestDetail) {
      currentDesignOrder.value = {
        ...currentDesignOrder.value,
        ...latestDetail,
      }
    }
  }

  if (!currentDesignOrder.value?.pendingBillId) {
    message.warning('当前设计订单暂无可支付账单')
    return
  }

  designRepayForm.channel = 'ALIPAY'
  showDesignRepayModal.value = true
}

const submitDesignOrderRepayment = async () => {
  const userId = getStoredUserId()
  const designOrderId = currentDesignOrder.value?.id
  const billId = currentDesignOrder.value?.pendingBillId
  if (!userId || !designOrderId || !billId) {
    message.error('未找到有效的设计订单支付信息')
    return
  }

  designRepaySubmitting.value = true
  const paymentWindow =
    designRepayForm.channel === 'ALIPAY' ? window.open('', '_blank') : null

  try {
    const res = await designOrderAPI.payBill(
      billId,
      userId,
      designRepayForm.channel,
    )
    logDesignOrderPaymentDebug('repay request response', {
      designOrderId,
      billId,
      code: res?.code,
      channel: designRepayForm.channel,
    })

    if (res.code !== 200) {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }
      message.error(res.msg || '支付发起失败')
      return
    }

    const wechatUrl = resolveWechatPayUrl(res.data)
    if (designRepayForm.channel === 'WECHAT' && wechatUrl) {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }
      paymentResultTarget.orderId = null
      paymentResultTarget.nodeId = null
      paymentResultTarget.designOrderId = designOrderId
      wechatPayUrl.value = wechatUrl
      showDesignRepayModal.value = false
      showWechatPayModal.value = true
      startDesignPaymentStatusPolling(designOrderId, billId)
      message.success('请使用微信扫码完成设计定金支付')
      return
    }

    const opened = tryOpenPaymentPayload(res.data, new Set(), paymentWindow)
    if (!opened && paymentWindow && !paymentWindow.closed) {
      paymentWindow.close()
    }

    showDesignRepayModal.value = false
    startDesignPaymentStatusPolling(designOrderId, billId)
    message.success(
      opened
        ? '已发起设计定金支付，请在新窗口完成付款'
        : '设计定金支付请求已发起',
    )
  } catch (error) {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close()
    }
    void error
    message.error('设计定金支付请求失败')
  } finally {
    designRepaySubmitting.value = false
  }
}

const handleContinueBuildFromDesign = async () => {
  const userId = getStoredUserId()
  const designOrderId = currentDesignOrder.value?.id
  if (!userId || !designOrderId) return

  designDecisionSubmitting.value = true
  try {
    const res = await designOrderAPI.continueBuild(designOrderId, userId)
    const buildOrderId = Number(res?.data)

    if (res.code === 200 && Number.isInteger(buildOrderId) && buildOrderId > 0) {
      currentDesignOrder.value = {
        ...currentDesignOrder.value,
        buildOrderId,
        designStatus: 3,
      }
      message.success('已从设计订单继续创建建房订单')
      showDesignDetailModal.value = false
      activeMenu.value = 'orders'
      activeOrderStatusTag.value = 'all'
      await fetchDesignOrders()
      await fetchOrders()
      await viewOrderDetail(
        {
          id: buildOrderId,
          orderStatus: 0,
          paymentStatus: 1,
          sourceDesignOrderId: designOrderId,
        },
        'info',
      )
      return
    }
    message.error(res?.msg || '继续建房失败')
  } catch (error) {
    void error
    message.error('继续建房失败')
  } finally {
    designDecisionSubmitting.value = false
  }
}

const handleMarkDesignOrderNoBuild = async () => {
  const userId = getStoredUserId()
  const designOrderId = currentDesignOrder.value?.id
  if (!userId || !designOrderId) return

  designDecisionSubmitting.value = true
  try {
    const res = await designOrderAPI.markNoBuildForNow(designOrderId, userId)
    if (res.code === 200) {
      currentDesignOrder.value = {
        ...currentDesignOrder.value,
        ...res.data,
      }
      message.success('该设计订单已标记为暂不建房')
      await fetchDesignOrders()
      return
    }
    message.error(res?.msg || '操作失败')
  } catch (error) {
    void error
    message.error('操作失败')
  } finally {
    designDecisionSubmitting.value = false
  }
}

const viewOrderDetail = async (row, initialTab = 'info') => {
  detailTab.value = initialTab
  const userId = getStoredUserId()
  showDetailModal.value = true
  orderStore.clearCurrentOrder()
  constructionInfo.value = null
  currentNodeDetail.value = null
  pendingPaymentBills.value = []
  userOptionalChangeRecords.value = []
  resetUserOptionSelectionMap()

  try {
    const res = await orderStore.loadOrderDetail({
      row,
      userId,
      canViewRefund: canViewRefund.value,
    })

    if (res?.code === 200 && currentOrder.value) {
      await loadUserOptionConfigList()
      hydrateUserOptionSelection()
      syncPendingPaymentBillsState(
        extractPaymentBillRows(currentOrder.value.pendingPaymentBills),
      )
      if ([3, 4].includes(currentOrder.value.orderStatus)) {
        await loadConstructionFlow(currentOrder.value.id)
      }
      await loadPendingPaymentBills(currentOrder.value.id)
      await loadUserOptionalChangeRecords(currentOrder.value.id)
    } else {
      message.error('获取详情失败')
      currentOrder.value = row
    }
  } catch (error) {
    void error
    message.error('网络错误，无法获取详情')
  }
}

// ================= 施工流程相关逻辑 =================

// 加载施工流程
const applyConstructionStatus = async (statusData) => {
  const flow = normalizeConstructionFlow(statusData)
  constructionInfo.value = flow
  console.info('[user-center-construction-bill] construction status', {
    orderId: currentOrder.value?.id || null,
    flow,
  })

  if (!flow?.nodeDetails?.length) {
    currentNodeDetail.value = null
    return
  }

  const targetIndex =
    flow.currentNodeIndex < flow.nodeDetails.length
      ? flow.currentNodeIndex
      : 0
  const targetNode = flow.nodeDetails[targetIndex]
  if (targetNode) {
    await handleNodeClick(targetNode)
  }
}

const loadConstructionFlow = async (orderId) => {
  try {
    const res = await ConstructionAPI.getConstructionStatus(orderId)
    if (res.code === 200 && res.data) {
      await applyConstructionStatus(res.data)
    } else {
      constructionInfo.value = null
      currentNodeDetail.value = null
    }
  } catch (e) {
    void e
    constructionInfo.value = null
    currentNodeDetail.value = null
  }
}

// 点击节点加载详情
const handleNodeClick = async (node) => {
  if (!currentOrder.value) return
  const orderId = currentOrder.value.id
  try {
    const nodeId = node.nodeId || node.id
    const res = await ConstructionAPI.getConstructionDetail(orderId, nodeId)
    if (res.code === 200) {
      currentNodeDetail.value = res.data
      console.info('[user-center-construction-bill] construction detail', {
        orderId,
        nodeId,
        data: res?.data,
      })
    }
  } catch (e) {
    message.error('加载节点详情失败')
  }
}

// 步骤条状态
const isConstructionFlowCompleted = (flow) => {
  if (!flow?.nodeDetails?.length) return false

  const lastIndex = flow.nodeDetails.length - 1
  const currentIndex = Number(flow.currentNodeIndex)
  if (currentIndex !== lastIndex) return false

  const currentStatus = Number(flow.currentNodeStatus)
  const detailStatus = Number(currentNodeDetail.value?.status)
  return (
    currentStatus === CONSTRUCTION_NODE_STATUS.FINISHED ||
    detailStatus === CONSTRUCTION_NODE_STATUS.FINISHED
  )
}

const getConstructionStepsCurrent = (flow) => {
  if (!flow?.nodeDetails?.length) return 0
  return isConstructionFlowCompleted(flow)
    ? flow.nodeDetails.length
    : flow.currentNodeIndex
}

const getNodeStepStatus = (index, currentIndex, flow = constructionInfo.value) => {
  if (isConstructionFlowCompleted(flow)) return 'finish'
  if (index === currentIndex) return 'process'
  if (index < currentIndex) return 'finish'
  return 'wait'
}

const getNodeStepDescription = (
  index,
  currentIndex,
  flow = constructionInfo.value,
) => {
  const node = flow?.nodeDetails?.[index] || null
  if (node?.statusText) return node.statusText
  if (isConstructionFlowCompleted(flow)) return '已完成'
  if (index === currentIndex) return flow?.currentNodeStatusText || '进行中'
  if (index < currentIndex) return '已完成'
  return '待开始'
}

// 计算是否待用户审核 (状态码为 2)
const isPendingUserAudit = computed(() => {
  if (!constructionInfo.value || !constructionInfo.value.nodeDetails)
    return false
  if (
    Number(constructionInfo.value.currentNodeStatus) !==
    CONSTRUCTION_NODE_STATUS.WAIT_USER_AUDIT
  ) {
    return false
  }

  const activeNodeId =
    constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex]
      ?.nodeId
  if (!currentNodeDetail.value) return false

  return currentNodeDetail.value.nodeId === activeNodeId
})

const activeConstructionNodeId = computed(() => {
  if (!constructionInfo.value?.nodeDetails?.length) return 0
  const activeNode =
    constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex] || null
  return Number(activeNode?.nodeId || activeNode?.id || 0)
})

const currentConstructionPayableBill = computed(() => {
  if (!currentOrder.value || !constructionInfo.value?.nodeDetails?.length) return null

  if (
    Number(constructionInfo.value.currentNodeStatus) !==
    CONSTRUCTION_NODE_STATUS.WAIT_PAYMENT
  ) {
    return null
  }

  const activeNode =
    constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex] || null
  const activeNodeId = activeConstructionNodeId.value
  if (!activeNodeId) return null

  const existingStageBill = findPendingStageBillByNodeId(
    pendingPaymentBills.value,
    activeNodeId,
  )
  if (existingStageBill) return existingStageBill

  const resolvedAmount = [currentNodeDetail.value?.amount, activeNode?.amount]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0)

  if (!(resolvedAmount > 0)) return null

  return {
    virtualKey: `construction-node-${currentOrder.value.id}-${activeNodeId}`,
    isVirtualConstructionBill: true,
    billType: 'STAGE_PAYMENT',
    relatedNodeId: activeNodeId,
    amount: resolvedAmount,
    billTitle: activeNode?.name || currentNodeDetail.value?.nodeName || '当前施工节点',
    remark: '当前施工阶段待支付，支付时若后端尚未生成账单，将按当前节点自动拉起支付。',
    createTime:
      currentOrder.value?.updateTime ||
      currentOrder.value?.orderTime ||
      currentOrder.value?.createTime ||
      null,
  }
})

watch(
  () => currentConstructionPayableBill.value,
  (value) => {
    logConstructionBillDebug('currentConstructionPayableBill', {
      currentConstructionPayableBill: value,
    })
  },
  { immediate: true },
)

const isPendingConstructionPaymentForCurrentNode = computed(() => {
  if (!currentConstructionPayableBill.value) return false
  if (!currentNodeDetail.value) return false
  return Number(currentNodeDetail.value.nodeId || 0) === activeConstructionNodeId.value
})

const findPendingPaymentBillById = (billId) => {
  const normalizedBillId = Number(billId || 0)
  if (!(normalizedBillId > 0)) return null

  return (
    pendingPaymentBills.value.find(
      (item) => Number(item?.id || 0) === normalizedBillId,
    ) || null
  )
}

const shouldShowOptionalChangePendingBillTag = (record) => {
  if (!record) return false
  return Boolean(findPendingPaymentBillById(record?.linkedBillId))
}

const latestPendingOptionalChangeBill = computed(() => {
  const latestRecord = latestUserOptionalChangeRecord.value
  if (!latestRecord) return null
  return findPendingPaymentBillById(latestRecord?.linkedBillId)
})

const currentNodeDetailStatusText = computed(() => {
  if (!currentNodeDetail.value) return '--'
  if (
    Number(currentNodeDetail.value.nodeId || 0) ===
    Number(activeConstructionNodeId.value || 0)
  ) {
    return (
      constructionInfo.value?.currentNodeStatusText ||
      currentNodeDetail.value.statusText ||
      '--'
    )
  }

  return currentNodeDetail.value.statusText || '--'
})

const pendingPaymentBillRows = computed(() => {
  const rows = pendingPaymentBills.value.filter((item) => {
    if (item?.billType !== 'OPTION_CHANGE') return true
    const latestBillId = Number(latestPendingOptionalChangeBill.value?.id || 0)
    return latestBillId > 0 && Number(item?.id || 0) === latestBillId
  })
  if (
    currentConstructionPayableBill.value &&
    !currentConstructionPayableBill.value.id
  ) {
    rows.unshift(currentConstructionPayableBill.value)
  }
  return sortPendingPaymentBills(rows)
})

const hasPendingPaymentBills = computed(() => pendingPaymentBillRows.value.length > 0)

const canOpenBillPaymentCenter = computed(() => {
  if (!currentOrder.value) return false
  return (
    Number(currentOrderPaymentStatus.value) === 0 ||
    hasPendingPaymentBills.value ||
    isConstructionNodeWaitingPayment.value
  )
})

const openCurrentConstructionPayment = async () => {
  if (!currentOrder.value?.id) return

  await loadPendingPaymentBills(currentOrder.value.id)

  const payableBill = currentConstructionPayableBill.value
  if (!payableBill) {
    message.warning('当前阶段暂未生成待支付账单，请稍后重试')
    return
  }

  detailTab.value = 'bills'
}

// 用户审核通过
const handleUserAuditPass = () => {
  dialog.success({
    title: '验收通过',
    content: '确定该施工节点已符合您的要求并验收通过吗？',
    positiveText: '通过',
    negativeText: '取消',
    onPositiveClick: async () => {
      await submitUserAudit(true)
    },
  })
}

// 提交用户审核结果
const submitUserAudit = async (pass, reason = '') => {
  const userIdStr = getStoredUserId()
  if (!userIdStr || !currentOrder.value?.id || !currentNodeDetail.value?.nodeId)
    return
  const userId = Number(userIdStr) // 转换为数字

  try {
    const res = await ConstructionAPI.userAudit(
      userId,
      currentOrder.value.id,
      currentNodeDetail.value.nodeId,
      pass,
      reason,
    )
    if (res.code === 200) {
      message.success(pass ? '验收通过' : '已驳回')
      showAuditRejectModal.value = false
      auditRejectReason.value = ''
      await syncCurrentOrderFromServer(currentOrder.value.id)
      await loadConstructionFlow(currentOrder.value.id)
      await loadPendingPaymentBills(currentOrder.value.id)
      await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
      if (pass) {
        detailTab.value = 'bills'
      }
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch (e) {
    void e
    message.error('审核请求异常')
  }
}

const getStatusType = (status) => {
  const map = {
    0: 'default',
    1: 'warning',
    2: 'info',
    3: 'info',
    4: 'success',
    5: 'error',
  }
  return map[status] || 'default'
}

const getOrderBusinessFlowSteps = (order) => {
  const paymentStatus = getOrderPaymentStatus(order)
  const contractUploaded = hasUploadedContract(order)
  const orderStatus = Number(order?.orderStatus)

  const depositDescription =
    paymentStatus > 0 ? '已完成首笔定金支付' : '待支付首笔定金'
  const contractDescription = contractUploaded
    ? '后台已上传合同'
    : '等待后台上传合同'

  let dispatchDescription = '等待平台派单'
  if (orderStatus === 1) {
    dispatchDescription = '平台正在分配服务商'
  } else if (orderStatus >= 2) {
    dispatchDescription = '服务商已接单'
  }

  let pricingDescription = '待后台确认整单金额方案'
  if (orderStatus >= 3) {
    pricingDescription = '已确认开工金额方案'
  } else if (orderStatus === 2) {
    pricingDescription = '派单完成后由后台确认'
  }

  let loopDescription = '待进入节点循环'
  if (orderStatus === 3) {
    if (
      Number(constructionInfo.value?.currentNodeStatus) ===
      CONSTRUCTION_NODE_STATUS.WAIT_PAYMENT
    ) {
      loopDescription = '当前节点待支付'
    } else {
      loopDescription =
        constructionInfo.value?.currentNodeStatusText || '施工进行中'
    }
  } else if (orderStatus >= 4) {
    loopDescription = '全部节点已结束'
  }

  return [
    { key: 'submit', title: '用户下单', description: '主体产品 + 选配产品' },
    { key: 'deposit', title: '支付定金', description: depositDescription },
    { key: 'contract', title: '上传合同', description: contractDescription },
    { key: 'dispatch', title: '派单接单', description: dispatchDescription },
    {
      key: 'pricing',
      title: '确认开工金额方案',
      description: pricingDescription,
    },
    { key: 'loop', title: '节点循环', description: loopDescription },
  ]
}

const getCurrentBusinessFlowStep = (order) => {
  const paymentStatus = getOrderPaymentStatus(order)
  const contractUploaded = hasUploadedContract(order)
  const orderStatus = Number(order?.orderStatus)

  if (orderStatus >= 4) return 6
  if (orderStatus >= 3) return 6
  if (orderStatus >= 2) return 5
  if (orderStatus >= 1) return 4
  if (contractUploaded) return 3
  if (paymentStatus > 0) return 2
  return 1
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchOrders()
}

const handleDesignPageChange = (page) => {
  designPagination.page = page
  fetchDesignOrders()
}

watch(
  userName,
  (name) => {
    emit('updateName', name || '用户')
  },
  { immediate: true },
)

watch(
  () => [getStoredUserId(), getPendingOrderNotificationSignature()],
  () => {
    maybeShowPendingOrderNotification()
  },
  { flush: 'post' },
)

watch(detailTab, (value) => {
  if (value === 'bills' && showDetailModal.value && currentOrder.value?.id) {
    loadPendingPaymentBills(currentOrder.value.id)
  }
})

onMounted(() => {
  authStore.setActiveScope(AUTH_SCOPE_USER)
  userProfileStore.initializeProfile().catch((error) => {
    message.error(error?.message || '登录状态异常，请重新登录')
    router.push('/login')
  })
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleWindowFocus)
  initDesignOrderPaymentTracking()
  if (activeMenu.value === 'orders') {
    fetchOrders()
  }
  if (activeMenu.value === 'designOrders') {
    fetchDesignOrders()
  }
  if (activeMenu.value === 'favorites') {
    fetchFavorites()
  }
})

watch(activeMenu, (newVal) => {
  if (newVal === 'orders') {
    pagination.page = 1
    fetchOrders()
  }
  if (newVal === 'designOrders') {
    designPagination.page = 1
    fetchDesignOrders()
    initDesignOrderPaymentTracking()
  }
  if (newVal === 'favorites') {
    favoritePagination.page = 1
    fetchFavorites()
  }
})

onBeforeUnmount(() => {
  closePendingOrderNotification()
  stopPaymentStatusPolling()
  if (designPaymentStatusPollTimer) {
    window.clearTimeout(designPaymentStatusPollTimer)
    designPaymentStatusPollTimer = null
  }
  stopConstructionPaymentPolling(true)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleWindowFocus)
})
</script>

<style lang="scss" scoped>
:deep(.n-layout) {
  background: transparent;
}

:deep(.n-layout-sider) {
  box-shadow: var(--shadow-sm);
}

.n-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

.h-full {
  height: 100vh;
}

.client-center-content {
  min-width: 0;
}

.client-center-mobile-menu {
  margin-bottom: 16px;
}

.client-center-mobile-nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.client-center-mobile-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%);
  color: var(--color-text-secondary);
  text-align: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.client-center-mobile-nav__item.is-active {
  color: var(--color-brand-700);
  border-color: rgba(39, 110, 61, 0.22);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.client-center-mobile-nav__icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  background: rgba(39, 110, 61, 0.1);
}

.client-center-mobile-nav__label {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.client-center-mobile-nav__desc {
  font-size: 11px;
  line-height: 1.2;
  color: var(--color-text-muted);
}

.house-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}
.favorite-actions {
  width: 100%;
}
.favorites-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.order-progress-card {
  padding: 20px;
  margin-bottom: 20px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
}
.order-amount-strong {
  color: #d03050;
  font-weight: 700;
}
.order-contract-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.construction-progress-header {
  margin-bottom: 20px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.construction-progress-header__node {
  color: var(--color-brand-700);
  font-size: 16px;
  margin-right: 10px;
  font-weight: 700;
}
.construction-progress-header__meta {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.construction-progress-nav {
  border-right: 1px solid var(--color-border-soft);
  padding-right: 10px;
}
.construction-progress-step {
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
.construction-progress-step__desc {
  font-size: 12px;
  color: var(--color-text-muted);
}
.construction-progress-step__meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.construction-progress-step__sub-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.construction-progress-step__sub-step {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.construction-progress-step__sub-step--done {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}
.construction-progress-desc {
  margin-bottom: 16px;
}
.construction-action-card {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: var(--radius-sm);
}
.construction-action-card--success {
  background: #eefdf5;
  border: 1px solid #b7eb8f;
}
.construction-action-card--warning {
  background: #fff7e6;
  border: 1px solid #ffd591;
}
.construction-action-card__title {
  margin-bottom: 10px;
  font-weight: 700;
}
.construction-action-card__title--success {
  color: var(--color-brand-700);
}
.construction-action-card__title--warning {
  color: #fa8c16;
}
.construction-action-card__icon {
  vertical-align: middle;
}
.construction-action-card__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.construction-timeline {
  max-height: 400px;
}
.timeline-record-description {
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
.timeline-image-group {
  margin-top: 8px;
}
.timeline-image-card {
  border-radius: 4px;
  border: 1px solid var(--color-border-soft);
}
.construction-empty-state {
  text-align: center;
  color: var(--color-text-muted);
}
.construction-empty-state--offset {
  margin-top: 60px;
}
.construction-empty-state--padded {
  padding: 40px;
}
.construction-empty-state--compact {
  padding: 40px 0;
}
.order-footer-panel {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}
.order-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.order-footer-actions__button {
  min-width: 112px;
  height: 36px;
  padding: 0 18px;
}
.order-footer-actions__status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border-soft);
  background: #fff;
  box-sizing: border-box;
}
.order-footer-actions__status-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1;
  white-space: nowrap;
}
.order-footer-hint {
  color: var(--color-text-muted);
  font-size: 13px;
  flex-shrink: 0;
}
.order-footer-hint__icon {
  vertical-align: text-bottom;
  margin-right: 2px;
}
.pending-bill-alert {
  margin-bottom: 16px;
}
.pending-bill-alert__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.payment-summary {
  padding: 16px;
}
.payment-summary__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.payment-summary__desc {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
}
.payment-summary__amount {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #d03050;
}
.order-payment-statement-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 14px 16px;
  line-height: 1.75;
  word-break: break-word;
}

.order-payment-statement-content :deep(p) {
  margin: 0 0 10px;
}

.order-payment-statement-content :deep(p:last-child) {
  margin-bottom: 0;
}

.profile-address-preview {
  min-height: 78px;
  color: #111827;
  white-space: normal;
  word-break: break-word;
}

.order-table-wrap {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.order-list-table {
  min-width: 1040px;
  overflow: hidden;
}

.design-order-list-table {
  min-width: 1240px;
}

.order-list-table__head,
.order-list-table__row {
  display: grid;
  grid-template-columns: minmax(240px, 1.5fr) minmax(180px, 1fr) 120px 160px minmax(220px, 1.2fr);
  align-items: center;
}

.order-list-table__head {
  padding: 14px 18px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.order-list-table__row {
  padding: 16px 18px;
  border-top: 1px solid var(--color-border-soft);
}

.order-list-table__cell {
  min-width: 0;
  font-size: 14px;
  color: var(--color-text-primary);
}

.order-list-table__cell--actions {
  justify-self: stretch;
}

.design-order-list-table .order-list-table__head,
.design-order-list-table .order-list-table__row {
  grid-template-columns:
    minmax(220px, 1.4fr)
    minmax(180px, 1fr)
    minmax(180px, 1.1fr)
    120px
    120px
    minmax(220px, 1.2fr);
}

.order-list-table__label {
  display: none;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.order-list-table__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-detail-table {
  overflow: hidden;
}

.option-detail-table__head,
.option-detail-table__row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.2fr) 140px;
  align-items: center;
}

.option-detail-table__head {
  padding: 14px 16px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.option-detail-table__row {
  padding: 14px 16px;
  border-top: 1px solid var(--color-border-soft);
}

.option-detail-table__cell {
  min-width: 0;
}

.option-detail-table__cell--amount {
  color: #d03050;
  font-weight: 600;
}

.option-detail-table__label {
  display: none;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.user-option-adjust-panel {
  margin-top: 16px;
  padding: 16px;
}

.user-option-adjust-panel--disabled {
  opacity: 0.72;
  background:
    linear-gradient(180deg, rgba(245, 247, 246, 0.96) 0%, rgba(237, 241, 238, 0.96) 100%);
}

.user-option-adjust-panel__hint {
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.user-option-adjust-panel__summary {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(39, 110, 61, 0.06);
}

.user-option-adjust-panel__summary-title {
  font-size: 13px;
  font-weight: 700;
  color: #276e3d;
}

.user-option-adjust-panel__summary-text {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.user-option-adjust-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.user-option-change-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-option-change-history__item {
  padding: 16px;
}

.user-option-change-history__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user-option-change-history__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.user-option-change-history__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.user-option-change-history__snapshots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.user-option-change-history__snapshot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(60, 64, 97, 0.04);
}

.user-option-change-history__snapshot-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.user-option-change-history__snapshot-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.user-option-change-history__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.select-wrapper {
  display: flex;
  align-items: center;
}

.select-wrapper .label {
  width: 90px;
  margin-right: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: right;
  flex: 0 0 auto;
}

.user-order-tabs {
  margin-bottom: 6px;
}

.user-order-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.user-order-tab-badge {
  display: inline-flex;
  align-items: center;
}

.user-order-tab-badge :deep(.n-badge-sup) {
  position: static;
  transform: none;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  border-radius: 999px;
}

.detail-payment-records {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 8px;
}

.detail-payment-records-table {
  min-width: 1260px;
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
    120px
    minmax(220px, 1fr)
    minmax(220px, 1.2fr);
  align-items: start;
}

.detail-payment-records-head {
  padding: 14px 16px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.detail-payment-records-row {
  padding: 14px 16px;
  border-top: 1px solid var(--color-border-soft);
}

.detail-payment-records-cell {
  min-width: 0;
  font-size: 14px;
  color: var(--color-text-primary);
}

.detail-payment-records-cell--actions {
  justify-self: stretch;
}

.detail-payment-records-label {
  display: none;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.detail-payment-records-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-payment-records-text {
  display: inline-block;
  min-width: 0;
  word-break: break-all;
}

.detail-payment-records-empty-action {
  color: var(--color-text-muted);
}

.pending-payment-bills {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 8px;
}

.pending-payment-bills-table {
  min-width: 1080px;
  overflow: hidden;
}

.pending-payment-bills-head,
.pending-payment-bills-row {
  display: grid;
  grid-template-columns:
    minmax(180px, 1.1fr)
    140px
    140px
    minmax(240px, 1.4fr)
    180px
    minmax(140px, 0.8fr);
  align-items: start;
}

.pending-payment-bills-head {
  padding: 14px 16px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.pending-payment-bills-row {
  padding: 14px 16px;
  border-top: 1px solid var(--color-border-soft);
}

.pending-payment-bills-cell {
  min-width: 0;
  font-size: 14px;
  color: var(--color-text-primary);
}

.pending-payment-bills-cell--actions {
  justify-self: stretch;
}

.pending-payment-bills-label {
  display: none;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.pending-payment-bills-text {
  display: inline-block;
  min-width: 0;
  word-break: break-all;
}

.pending-payment-bills-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.refund-info-card__item {
  min-width: 0;
}

.refund-info-card__item--amount {
  text-align: right;
}

.refund-info-card__label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.refund-info-card__value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

@media (max-width: 768px) {
  .h-full {
    height: auto;
  }

  .p-6 {
    padding: 0;
  }

  .client-center-layout {
    display: block;
  }

  .client-center-mobile-menu {
    :deep(.n-card-header) {
      padding-bottom: 12px;
    }
  }

  .favorite-actions,
  .construction-action-card__actions,
  .user-option-adjust-panel__actions {
    flex-direction: column;
  }

  .favorite-actions :deep(.n-button),
  .construction-action-card__actions :deep(.n-button),
  .user-option-adjust-panel__actions :deep(.n-button) {
    width: 100%;
  }

  .order-progress-card {
    overflow-x: auto;
    padding: 16px;
  }

  .order-list-table,
  .option-detail-table,
  .detail-payment-records-table,
  .pending-payment-bills-table {
    min-width: 0;
  }

  .order-list-table__head,
  .option-detail-table__head,
  .detail-payment-records-head,
  .pending-payment-bills-head {
    display: none;
  }

  .order-list-table__row,
  .option-detail-table__row,
  .detail-payment-records-row,
  .pending-payment-bills-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .order-list-table__label,
  .option-detail-table__label,
  .detail-payment-records-label,
  .pending-payment-bills-label {
    display: block;
  }

  .user-order-tabs :deep(.n-tabs-nav),
  .user-order-tabs :deep(.n-tabs-nav-scroll-wrapper),
  .user-order-tabs :deep(.n-tabs-nav-scroll-content) {
    width: 100%;
  }

  .user-order-tabs :deep(.n-tabs-tab) {
    flex: 1;
    justify-content: center;
  }

  .payment-summary {
    padding: 14px;
  }

  .pending-bill-alert__content {
    align-items: flex-start;
  }

  .payment-summary__amount {
    font-size: 22px;
  }

  .select-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .select-wrapper .label {
    width: auto;
    margin-right: 0;
    text-align: left;
  }

  .refund-info-card :deep(.n-space) {
    width: 100%;
  }

  .refund-info-card__item--amount {
    text-align: left;
  }

  .profile-form .client-center-form-actions {
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;
  }

  .profile-form .client-center-form-actions :deep(.n-button) {
    width: 100%;
    min-width: 0;
    min-height: 46px;
  }

  .user-option-change-history__header,
  .user-option-change-history__meta,
  .user-option-change-history__snapshots {
    grid-template-columns: minmax(0, 1fr);
  }

  .user-option-change-history__header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .user-option-change-history__actions {
    justify-content: stretch;
  }

  .user-option-change-history__actions :deep(.n-button) {
    width: 100%;
  }

  .order-list-table__actions,
  .detail-payment-records-actions,
  .pending-payment-bills-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .order-list-table__actions :deep(.n-button),
  .detail-payment-records-actions :deep(.n-button),
  .pending-payment-bills-actions :deep(.n-button) {
    width: 100%;
  }
}

.design-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.design-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.design-file-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background: rgba(39, 110, 61, 0.08);
  color: #276e3d;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 576px) {
  .user-order-tabs {
    margin-bottom: 12px;
  }

  .user-order-tabs :deep(.n-tabs-nav) {
    overflow: hidden;
    padding-bottom: 4px;
  }

  .user-order-tabs :deep(.n-tabs-rail) {
    left: 0;
    right: 0;
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }

  .user-order-tabs :deep(.n-tabs-nav-scroll-wrapper) {
    width: 100%;
    min-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .user-order-tabs :deep(.n-tabs-nav-scroll-content) {
    width: max-content;
    min-width: 100%;
  }

  .user-order-tabs :deep(.n-tabs-tab) {
    flex: 0 0 auto;
    justify-content: center;
    padding-left: 12px;
    padding-right: 12px;
    white-space: nowrap;
  }

  .user-order-tab-label {
    font-size: 12px;
  }

  .client-center-mobile-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .client-center-mobile-nav__item {
    padding: 12px 8px 10px;
  }

  .client-center-mobile-nav__icon {
    width: 42px;
    height: 42px;
  }
}

</style>
