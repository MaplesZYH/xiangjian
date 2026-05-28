<template>
  <ClientCenterShell
    class="user-center-view"
    menu-title="用户中心"
    :menu-items="mobileMenuItems"
    :active-menu="activeMenu"
    :is-compact-viewport="isCompactViewport"
    :mobile-columns="4"
    :mobile-columns-narrow="2"
    @update:active-menu="activeMenu = $event"
  >
    <UserCenterMainContent
      :active-menu="activeMenu"
      :user-name="userName"
      :user-info="userInfo"
      :selected-profile-region-code="selectedProfileRegionCode"
      :profile-region-cascader-options="profileRegionCascaderOptions"
      :profile-address-form="profileAddressForm"
      :profile-address-preview="profileAddressPreview"
      :can-view-user-profile="canViewUserProfile"
      :can-update-user-profile="canUpdateUserProfile"
      :saving="saving"
      :save-profile-button-text="saveProfileButtonText"
      :is-compact-viewport="isCompactViewport"
      :form-label-placement="formLabelPlacement"
      :active-order-status-tag="activeOrderStatusTag"
      :order-status-filter-tabs="orderStatusFilterTabs"
      :loading-orders="loadingOrders"
      :visible-order-list="visibleOrderList"
      :pagination="pagination"
      :get-order-product-name="getOrderProductName"
      :get-status-type="getStatusType"
      :format-order-status="formatOrderStatus"
      :get-design-order-payment-status-type="getDesignOrderPaymentStatusType"
      :format-design-order-payment-status="formatDesignOrderPaymentStatus"
      :can-open-refund-center="canOpenRefundCenter"
      :has-uploaded-contract="hasUploadedContract"
      :loading-design-orders="loadingDesignOrders"
      :design-order-list="designOrderList"
      :design-pagination="designPagination"
      :get-design-order-list-main-product-name-text="
        getDesignOrderListMainProductNameText
      "
      :get-design-order-status-type="getDesignOrderStatusType"
      :get-design-order-status-text="getDesignOrderStatusText"
      :can-cancel-design-order="canCancelDesignOrder"
      :favorites="favorites"
      :loading-favorites="loadingFavorites"
      :favorite-action-loading="favoriteActionLoading"
      :favorite-pagination="favoritePagination"
      :default-favorite-image="defaultFavoriteImage"
      :format-favorite-style="formatFavoriteStyle"
      :format-favorite-area="formatFavoriteArea"
      @update:user-info-field="handleUserInfoFieldChange"
      @update:selected-profile-region-code="selectedProfileRegionCode = $event"
      @update:profile-address-detail="handleProfileAddressDetailChange"
      @profile-region-update="handleProfileRegionUpdate"
      @refresh-user-info="fetchUserInfo"
      @save-user-info="saveUserInfo"
      @update:active-order-status-tag="activeOrderStatusTag = $event"
      @open-order-payment-statement="openOrderPaymentStatementModal"
      @open-order-detail="viewOrderDetail($event.row, $event.initialTab)"
      @cancel-order="handleCancelOrder"
      @order-page-change="handlePageChange"
      @open-design-order-detail="openDesignOrderDetail"
      @cancel-design-order="handleCancelDesignOrder"
      @design-order-page-change="handleDesignPageChange"
      @go-to-house-page="goToHousePage"
      @view-favorite-detail="viewFavoriteDetail"
      @cancel-favorite="cancelFavorite"
      @favorite-page-change="handleFavoritePageChange"
      @cancel-logout="activeMenu = 'profile'"
      @logout="handleLogout"
    />

    <UserCenterModalStack
      :show-detail-modal="showDetailModal"
      :loading-detail="loadingDetail"
      :detail-tab="detailTab"
      :detail-modal-style="detailModalStyle"
      :current-order="currentOrder"
      :descriptions-label-placement="descriptionsLabelPlacement"
      :detail-descriptions-columns="detailDescriptionsColumns"
      :current-order-payment-status="currentOrderPaymentStatus"
      :current-order-contact-name="currentOrderContactName"
      :current-order-contact-phone="currentOrderContactPhone"
      :current-order-contract-urls="currentOrderContractUrls"
      :user-option-config-loading="userOptionConfigLoading"
      :user-option-config-list="userOptionConfigList"
      :user-option-selection-map="userOptionSelectionMap"
      :can-adjust-user-options="canAdjustUserOptions"
      :user-option-submitting="userOptionSubmitting"
      :user-option-adjustment-hint-text="userOptionAdjustmentHintText"
      :has-user-option-selection-changes="hasUserOptionSelectionChanges"
      :user-option-change-type-label="userOptionChangeTypeLabel"
      :user-option-change-summary-text="userOptionChangeSummaryText"
      :user-optional-change-loading="userOptionalChangeLoading"
      :visible-user-optional-change-records="visibleUserOptionalChangeRecords"
      :current-effective-option-snapshot="currentEffectiveOptionSnapshot"
      :pending-target-option-snapshot="pendingTargetOptionSnapshot"
      :has-pending-user-optional-change="hasPendingUserOptionalChange"
      :can-cancel-latest-optional-change="canCancelLatestOptionalChange"
      :can-apply-refund-for-latest-optional-change="
        canApplyRefundForLatestOptionalChange
      "
      :can-cancel-refund-for-latest-optional-change="
        canCancelRefundForLatestOptionalChange
      "
      :can-view-refund-detail-for-latest-optional-change="
        canViewRefundDetailForLatestOptionalChange
      "
      :latest-optional-change-refund-payment-record-missing="
        latestOptionalChangeRefundPaymentRecordMissing
      "
      :construction-info="constructionInfo"
      :current-node-detail="currentNodeDetail"
      :current-node-detail-status-text="currentNodeDetailStatusText"
      :is-pending-construction-payment-for-current-node="
        isPendingConstructionPaymentForCurrentNode
      "
      :current-construction-payable-bill="currentConstructionPayableBill"
      :is-pending-user-audit="isPendingUserAudit"
      :pending-payment-bills-loading="pendingPaymentBillsLoading"
      :has-pending-payment-bills="hasPendingPaymentBills"
      :pending-payment-bill-rows="pendingPaymentBillRows"
      :detail-payment-records-loading="detailPaymentRecordsLoading"
      :has-detail-payment-records="hasDetailPaymentRecords"
      :detail-payment-records="detailPaymentRecords"
      :get-current-business-flow-step="getCurrentBusinessFlowStep"
      :get-order-business-flow-steps="getOrderBusinessFlowSteps"
      :get-status-type="getStatusType"
      :format-order-status="formatOrderStatus"
      :get-order-product-name="getOrderProductName"
      :format-currency-number="formatCurrencyNumber"
      :get-payment-status-type="getPaymentStatusType"
      :format-payment-status="formatPaymentStatus"
      :get-user-optional-change-status-tag-type="
        getUserOptionalChangeStatusTagType
      "
      :format-date-time="formatDateTime"
      :format-amount="formatAmount"
      :format-optional-change-snapshot="formatOptionalChangeSnapshot"
      :should-show-optional-change-pending-bill-tag="
        shouldShowOptionalChangePendingBillTag
      "
      :get-construction-steps-current="getConstructionStepsCurrent"
      :get-node-step-status="getNodeStepStatus"
      :get-node-step-description="getNodeStepDescription"
      :get-payment-bill-display-title="getPaymentBillDisplayTitle"
      :get-payment-bill-type-tag-type="getPaymentBillTypeTagType"
      :get-payment-bill-type-text="getPaymentBillTypeText"
      :get-payment-bill-status-tag-type="getPaymentBillStatusTagType"
      :get-payment-bill-status-text="getPaymentBillStatusText"
      :can-repay-bill="canRepayBill"
      :can-cancel-pending-option-change-bill="
        canCancelPendingOptionChangeBill
      "
      :get-pending-bill-action-text="getPendingBillActionText"
      :get-detail-payment-stage-text="getDetailPaymentStageText"
      :get-detail-payment-channel-type="getDetailPaymentChannelType"
      :get-detail-payment-channel-text="getDetailPaymentChannelText"
      :get-refund-status-tag-type="getRefundStatusTagType"
      :get-refund-status-text="getRefundStatusText"
      :refund-records-loading="refundRecordsLoading"
      :refund-records="refundRecords"
      :has-refund-records="hasRefundRecords"
      :can-cancel-refund-record="canCancelRefundRecord"
      :can-view-refund-record-detail="canViewRefundRecordDetail"
      :can-apply-refund-for-payment-record-in-list="
        canApplyRefundForPaymentRecordInList
      "
      :can-cancel-refund-for-payment-record-in-list="
        canCancelRefundForPaymentRecordInList
      "
      :can-view-refund-detail-for-payment-record-in-list="
        canViewRefundDetailForPaymentRecordInList
      "
      :get-payment-record-refund-status="getPaymentRecordRefundStatus"
      :has-uploaded-contract="hasUploadedContract"
      :show-design-detail-modal="showDesignDetailModal"
      :loading-design-detail="loadingDesignDetail"
      :current-design-order="currentDesignOrder"
      :design-decision-submitting="designDecisionSubmitting"
      :get-design-order-status-type="getDesignOrderStatusType"
      :get-design-order-status-text="getDesignOrderStatusText"
      :get-design-order-payment-status-type="
        getDesignOrderPaymentStatusType
      "
      :format-design-order-payment-status="formatDesignOrderPaymentStatus"
      :get-design-order-main-product-name-text="
        getDesignOrderMainProductNameText
      "
      :get-design-file-label="getDesignFileLabel"
      :can-repay-design-order="canRepayDesignOrder"
      :can-mark-design-order-no-build="canMarkDesignOrderNoBuild"
      :can-continue-build-design-order="canContinueBuildDesignOrder"
      :show-design-repay-modal="showDesignRepayModal"
      :payment-modal-style="paymentModalStyle"
      :design-repay-submitting="designRepaySubmitting"
      :design-repay-amount-text="designRepayAmountText"
      :design-repay-channel="designRepayForm.channel"
      :payment-channel-options="paymentChannelOptions"
      :show-payment-modal="showPaymentModal"
      :payment-modal-title="paymentModalTitle"
      :payment-submitting="paymentSubmitting"
      :payment-target="paymentTarget"
      :payment-channel="paymentForm.channel"
      :show-audit-reject-modal="showAuditRejectModal"
      :audit-reject-reason="auditRejectReason"
      :show-wechat-pay-modal="showWechatPayModal"
      :wechat-pay-url="wechatPayUrl"
      :show-refund-modal="showRefundModal"
      :refund-modal-style="refundModalStyle"
      :refund-submitting="refundSubmitting"
      :refund-target="refundTarget"
      :form-label-placement="formLabelPlacement"
      :is-compact-viewport="isCompactViewport"
      :refund-quick-reason="refundQuickReason"
      :refund-reason-options="refundReasonOptions"
      :refund-reason="refundForm.reason"
      :show-refund-detail-modal="showRefundDetailModal"
      :refund-detail-modal-style="refundDetailModalStyle"
      :loading-refund-detail="loadingRefundDetail"
      :refund-detail="refundDetail"
      :get-refund-audit-operator-phone="getRefundAuditOperatorPhone"
      :show-order-payment-statement-modal="showOrderPaymentStatementModal"
      :statement-modal-style="statementModalStyle"
      :order-payment-statement-loading="orderPaymentStatementLoading"
      :order-payment-statement-html="orderPaymentStatementHtml"
      @update:show-detail-modal="showDetailModal = $event"
      @update:detail-tab="detailTab = $event"
      @update:user-option-selection="handleUserOptionSelectionUpdate"
      @reset-user-option-selection-changes="resetUserOptionSelectionChanges"
      @submit-user-option-selection-changes="submitUserOptionSelectionChanges"
      @cancel-latest-optional-change="cancelLatestOptionalChange"
      @open-latest-optional-change-refund-modal="
        openLatestOptionalChangeRefundModal
      "
      @cancel-latest-optional-change-refund-apply="
        cancelLatestOptionalChangeRefundApply
      "
      @open-latest-optional-change-refund-detail-modal="
        openLatestOptionalChangeRefundDetailModal
      "
      @node-click="handleNodeClick"
      @open-current-construction-payment="openCurrentConstructionPayment"
      @user-audit-pass="handleUserAuditPass"
      @open-audit-reject-modal="showAuditRejectModal = true"
      @open-pending-bill-payment-modal="openPendingBillPaymentModal"
      @cancel-pending-bill="cancelPendingBill"
      @open-refund-modal="openRefundModal"
      @cancel-refund-apply="handleCancelRefundApply"
      @open-refund-detail-modal="openRefundDetailModal"
      @open-refund-record-detail-modal="openRefundRecordDetailModal"
      @cancel-refund-record="handleCancelRefundRecord"
      @update:show-design-detail-modal="showDesignDetailModal = $event"
      @open-design-order-payment-modal="openDesignOrderPaymentModal"
      @mark-design-order-no-build="handleMarkDesignOrderNoBuild"
      @continue-build-design-order="handleContinueBuildFromDesign"
      @close-design-repay-modal="showDesignRepayModal = false"
      @submit-design-order-repayment="submitDesignOrderRepayment"
      @update:design-repay-channel="designRepayForm.channel = $event"
      @close-payment-modal="closePaymentModal"
      @submit-payment="submitPayment"
      @update:payment-channel="paymentForm.channel = $event"
      @close-audit-reject-modal="showAuditRejectModal = false"
      @submit-audit-reject="submitUserAudit(false, auditRejectReason)"
      @update:audit-reject-reason="auditRejectReason = $event"
      @close-wechat-pay-modal="closeWechatPayModal"
      @close-refund-modal="closeRefundModal"
      @submit-refund-apply="submitRefundApply"
      @refund-reason-preset-change="handleRefundReasonPresetChange"
      @update:refund-reason="refundForm.reason = $event"
      @close-refund-detail-modal="showRefundDetailModal = false"
      @close-order-payment-statement-modal="
        showOrderPaymentStatementModal = false
      "
    />
  </ClientCenterShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useFavoriteStore } from '@/stores/favorite/useFavoriteStore'
import { useOptionCatalogStore } from '@/stores/option/useOptionCatalogStore'
import { useUserOrderStore } from '@/stores/order/useUserOrderStore'
import ClientCenterShell from '@/views/client/center/shared/ClientCenterShell.vue'
import UserCenterMainContent from '@/views/client/center/user/UserCenterMainContent.vue'
import UserCenterModalStack from '@/views/client/center/user/UserCenterModalStack.vue'
import { useUserCenterViewLayout } from '@/views/client/center/user/composables/useUserCenterViewLayout'
import { useUserCenterViewLifecycle } from '@/views/client/center/user/composables/useUserCenterViewLifecycle'
import { useUserDesignOrderPanel } from '@/views/client/center/user/composables/useUserDesignOrderPanel'
import { useUserFavoritesPanel } from '@/views/client/center/user/composables/useUserFavoritesPanel'
import { useUserOrderPanel } from '@/views/client/center/user/composables/useUserOrderPanel'
import { useUserProfilePanel } from '@/views/client/center/user/composables/useUserProfilePanel'
import {
  mobileMenuItems,
  orderStatusFilterTagConfigs,
} from '@/views/client/center/user/userCenterPageConfig'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()
const optionCatalogStore = useOptionCatalogStore()
const orderStore = useUserOrderStore()
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
  userName,
  profileAddressForm,
  profileRegionCascaderOptions,
  handleProfileRegionUpdate,
  handleUserInfoFieldChange,
  handleProfileAddressDetailChange,
  fetchUserInfo,
  saveUserInfo,
  logout,
  formatFavoriteStyle,
  formatFavoriteArea,
  initializeProfile,
} = useUserProfilePanel()

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
  refundRecordsLoading,
  refundRecords,
  orderPaymentStatementLoading,
  orderPaymentStatementHtml,
  refundDetailLoading: loadingRefundDetail,
  refundDetail,
  refundSubmitting,
} = storeToRefs(orderStore)
const pagination = orderStore.pagination

const activeMenu = ref('profile')
const activeOrderStatusTag = ref('all')
const {
  isCompactViewport,
  formLabelPlacement,
  descriptionsLabelPlacement,
  detailDescriptionsColumns,
  detailModalStyle,
  paymentModalStyle,
  refundModalStyle,
  refundDetailModalStyle,
  statementModalStyle,
} = useUserCenterViewLayout()

const showWechatPayModal = ref(false)
const wechatPayUrl = ref('')
const paymentResultTarget = reactive({
  orderId: null,
  nodeId: null,
  billId: null,
  designOrderId: null,
})

const paymentBridge = {
  showWechatPayModal,
  wechatPayUrl,
  paymentResultTarget,
}

const {
  goToHousePage,
  viewFavoriteDetail,
  fetchFavorites,
  refreshFavorites,
  handleFavoritePageChange,
  cancelFavorite,
} = useUserFavoritesPanel({
  favoriteStore,
  favoritePagination,
  favorites,
  currentFavoriteUserId,
  getStoredUserId: () => currentFavoriteUserId.value,
  router,
  message,
})

const fetchOrders = async () => {
  const userId = currentFavoriteUserId.value
  if (!userId) {
    message.warning('请先登录')
    return
  }

  try {
    const res = await orderStore.fetchOrders({ userId })
    if (res?.code !== 200) {
      message.error(res?.msg || '获取订单列表失败')
    }
  } catch (error) {
    void error
    message.error('获取订单列表失败')
  }
}

let orderDetailOpener = async () => {}
function viewOrderDetail(...args) {
  return orderDetailOpener(...args)
}

let refreshDesignOrderAfterPayment = async () => {}
const refreshDesignOrderAfterPaymentBridge = (...args) =>
  refreshDesignOrderAfterPayment(...args)

const {
  userOptionConfigLoading,
  userOptionConfigList,
  userOptionSelectionMap,
  userOptionSubmitting,
  userOptionalChangeLoading,
  visibleUserOptionalChangeRecords,
  constructionInfo,
  currentNodeDetail,
  pendingPaymentBillsLoading,
  showAuditRejectModal,
  auditRejectReason,
  showPaymentModal,
  paymentSubmitting,
  paymentForm,
  paymentTarget,
  showDetailModal,
  detailTab,
  showOrderPaymentStatementModal,
  showRefundDetailModal,
  showRefundModal,
  refundTarget,
  refundForm,
  refundQuickReason,
  refundReasonOptions,
  paymentChannelOptions,
  paymentModalTitle,
  currentOrderPaymentStatus,
  currentOrderContactName,
  currentOrderContactPhone,
  currentOrderContractUrls,
  orderStatusFilterTabs,
  visibleOrderList,
  getOrderProductName,
  hasUploadedContract,
  formatOrderStatus,
  formatPaymentStatus,
  getDetailPaymentChannelText,
  getDetailPaymentChannelType,
  getDetailPaymentStageText,
  getPaymentBillTypeText,
  getPaymentBillTypeTagType,
  getPaymentBillDisplayTitle,
  getPaymentBillStatusTagType,
  getPaymentBillStatusText,
  getPaymentStatusType,
  canRepayBill,
  canCancelPendingOptionChangeBill,
  getPendingBillActionText,
  handleRefundReasonPresetChange,
  closeRefundModal,
  formatAmount,
  formatCurrencyNumber,
  formatDateTime,
  canAdjustUserOptions,
  userOptionAdjustmentHintText,
  hasUserOptionSelectionChanges,
  userOptionChangeTypeLabel,
  userOptionChangeSummaryText,
  currentEffectiveOptionSnapshot,
  pendingTargetOptionSnapshot,
  hasPendingUserOptionalChange,
  canCancelLatestOptionalChange,
  getUserOptionalChangeStatusTagType,
  formatOptionalChangeSnapshot,
  latestOptionalChangeRefundPaymentRecordMissing,
  canApplyRefundForLatestOptionalChange,
  canCancelRefundForLatestOptionalChange,
  canViewRefundDetailForLatestOptionalChange,
  getRefundAuditOperatorPhone,
  getRefundStatusText,
  getRefundStatusTagType,
  hasRefundRecords,
  canOpenRefundCenter,
  canApplyRefundForPaymentRecordInList,
  canCancelRefundForPaymentRecordInList,
  canViewRefundDetailForPaymentRecordInList,
  getPaymentRecordRefundStatus,
  canCancelRefundRecord,
  canViewRefundRecordDetail,
  hasDetailPaymentRecords,
  openRefundModal,
  openLatestOptionalChangeRefundModal,
  openRefundDetailModal,
  openRefundRecordDetailModal,
  openLatestOptionalChangeRefundDetailModal,
  submitRefundApply,
  handleCancelRefundApply,
  handleCancelRefundRecord,
  cancelLatestOptionalChangeRefundApply,
  handleCancelOrder,
  closePaymentModal,
  submitPayment,
  handleUserOptionSelectionUpdate,
  resetUserOptionSelectionChanges,
  cancelLatestOptionalChange,
  submitUserOptionSelectionChanges,
  handleNodeClick,
  currentNodeDetailStatusText,
  isPendingConstructionPaymentForCurrentNode,
  currentConstructionPayableBill,
  isPendingUserAudit,
  hasPendingPaymentBills,
  pendingPaymentBillRows,
  openCurrentConstructionPayment,
  openPendingBillPaymentModal,
  cancelPendingBill,
  handleUserAuditPass,
  submitUserAudit,
  getStatusType,
  getOrderBusinessFlowSteps,
  getCurrentBusinessFlowStep,
  getConstructionStepsCurrent,
  getNodeStepStatus,
  getNodeStepDescription,
  handlePageChange,
  openOrderPaymentStatementModal,
  closeWechatPayModal,
  maybeShowPendingOrderNotification,
  pendingOrderNotificationItems,
  loadPendingPaymentBills,
  shouldShowOptionalChangePendingBillTag,
  handleVisibilityChange,
  handleWindowFocus,
  cleanup: cleanupOrderPanel,
} = useUserOrderPanel({
  orderStore,
  optionCatalogStore,
  canApplyRefund,
  canViewRefund,
  orderList,
  currentOrder,
  detailPaymentRecords,
  refundRecords,
  refundRecordsLoading,
  refundSubmitting,
  activeOrderStatusTag,
  orderStatusFilterTagConfigs,
  pagination,
  userName,
  userInfo,
  paymentBridge,
  fetchOrders,
  onOpenOrderDetail: (fn) => {
    orderDetailOpener = fn
  },
  onRefreshDesignOrderAfterPayment: refreshDesignOrderAfterPaymentBridge,
})

const {
  loadingDesignOrders,
  designOrderList,
  designPagination,
  showDesignDetailModal,
  loadingDesignDetail,
  currentDesignOrder,
  designDecisionSubmitting,
  showDesignRepayModal,
  designRepaySubmitting,
  designRepayForm,
  designRepayAmountText,
  getDesignOrderStatusText,
  getDesignOrderStatusType,
  formatDesignOrderPaymentStatus,
  getDesignOrderPaymentStatusType,
  getDesignFileLabel,
  canContinueBuildDesignOrder,
  canCancelDesignOrder,
  getDesignOrderMainProductNameText,
  getDesignOrderListMainProductNameText,
  canRepayDesignOrder,
  canMarkDesignOrderNoBuild,
  fetchDesignOrders,
  openDesignOrderDetail,
  openDesignOrderPaymentModal,
  submitDesignOrderRepayment,
  handleContinueBuildFromDesign,
  handleMarkDesignOrderNoBuild,
  handleCancelDesignOrder,
  handleDesignPageChange,
  syncPendingDesignOrderPaymentOnFocus,
  initDesignOrderPaymentTracking,
  stopDesignPaymentStatusPolling,
  refreshDesignOrderAfterPayment: refreshDesignOrderAfterPaymentFromComposable,
} = useUserDesignOrderPanel({
  paymentBridge,
  fetchOrders,
  viewOrderDetail,
  activeMenu,
  activeOrderStatusTag,
})

refreshDesignOrderAfterPayment = refreshDesignOrderAfterPaymentFromComposable

const handleLogout = () => {
  logout(cleanupOrderPanel)
}

useUserCenterViewLifecycle({
  emit,
  userName,
  pendingOrderNotificationItems,
  maybeShowPendingOrderNotification,
  detailTab,
  showDetailModal,
  currentOrder,
  loadPendingPaymentBills,
  activeMenu,
  pagination,
  fetchOrders,
  designPagination,
  fetchDesignOrders,
  initDesignOrderPaymentTracking,
  favoritePagination,
  fetchFavorites,
  authStore,
  initializeProfile,
  message,
  router,
  handleVisibilityChange,
  handleWindowFocus,
  cleanupOrderPanel,
  stopDesignPaymentStatusPolling,
})
</script>


<style lang="scss">
.user-center-view {
  .n-card {
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xs);
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

  @media (max-width: 768px) {
    .favorite-actions,
    .order-list-table__actions {
      flex-direction: column;
    }

    .favorite-actions .n-button,
    .order-list-table__actions .n-button {
      width: 100%;
    }

    .order-list-table {
      min-width: 0;
    }

    .order-list-table__head {
      display: none;
    }

    .order-list-table__row {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }

    .order-list-table__label {
      display: block;
    }

    .user-order-tabs .n-tabs-nav,
    .user-order-tabs .n-tabs-nav-scroll-wrapper,
    .user-order-tabs .n-tabs-nav-scroll-content {
      width: 100%;
    }

    .user-order-tabs .n-tabs-tab {
      flex: 1;
      justify-content: center;
    }

  }
}
</style>
