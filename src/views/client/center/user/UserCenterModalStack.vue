<template>
  <UserOrderDetailModal
    :show="showDetailModal"
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
    :can-cancel-pending-option-change-bill="canCancelPendingOptionChangeBill"
    :get-pending-bill-action-text="getPendingBillActionText"
    :get-detail-payment-stage-text="getDetailPaymentStageText"
    :get-detail-payment-channel-type="getDetailPaymentChannelType"
    :get-detail-payment-channel-text="getDetailPaymentChannelText"
    :get-refund-status-tag-type="getRefundStatusTagType"
    :get-refund-status-text="getRefundStatusText"
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
    @update:show="$emit('update:show-detail-modal', $event)"
    @update:detail-tab="$emit('update:detail-tab', $event)"
    @update:user-option-selection="$emit('update:user-option-selection', $event)"
    @reset-user-option-selection-changes="
      $emit('reset-user-option-selection-changes')
    "
    @submit-user-option-selection-changes="
      $emit('submit-user-option-selection-changes')
    "
    @cancel-latest-optional-change="$emit('cancel-latest-optional-change')"
    @open-latest-optional-change-refund-modal="
      $emit('open-latest-optional-change-refund-modal')
    "
    @cancel-latest-optional-change-refund-apply="
      $emit('cancel-latest-optional-change-refund-apply')
    "
    @open-latest-optional-change-refund-detail-modal="
      $emit('open-latest-optional-change-refund-detail-modal')
    "
    @node-click="$emit('node-click', $event)"
    @open-current-construction-payment="$emit('open-current-construction-payment')"
    @user-audit-pass="$emit('user-audit-pass')"
    @open-audit-reject-modal="$emit('open-audit-reject-modal')"
    @open-pending-bill-payment-modal="$emit('open-pending-bill-payment-modal', $event)"
    @cancel-pending-bill="$emit('cancel-pending-bill', $event)"
    @open-refund-modal="$emit('open-refund-modal', $event)"
    @cancel-refund-apply="$emit('cancel-refund-apply', $event)"
    @open-refund-detail-modal="$emit('open-refund-detail-modal', $event)"
  />

  <UserDesignOrderDetailModal
    :show="showDesignDetailModal"
    :loading-design-detail="loadingDesignDetail"
    :current-design-order="currentDesignOrder"
    :detail-modal-style="detailModalStyle"
    :detail-descriptions-columns="detailDescriptionsColumns"
    :descriptions-label-placement="descriptionsLabelPlacement"
    :design-decision-submitting="designDecisionSubmitting"
    :get-design-order-status-type="getDesignOrderStatusType"
    :get-design-order-status-text="getDesignOrderStatusText"
    :get-design-order-payment-status-type="getDesignOrderPaymentStatusType"
    :format-design-order-payment-status="formatDesignOrderPaymentStatus"
    :get-design-order-main-product-name-text="
      getDesignOrderMainProductNameText
    "
    :format-amount="formatAmount"
    :format-date-time="formatDateTime"
    :get-design-file-label="getDesignFileLabel"
    :can-repay-design-order="canRepayDesignOrder"
    :can-mark-design-order-no-build="canMarkDesignOrderNoBuild"
    :can-continue-build-design-order="canContinueBuildDesignOrder"
    @update:show="$emit('update:show-design-detail-modal', $event)"
    @open-payment-modal="$emit('open-design-order-payment-modal')"
    @mark-no-build="$emit('mark-design-order-no-build')"
    @continue-build="$emit('continue-build-design-order')"
  />

  <UserDesignRepayModal
    :show="showDesignRepayModal"
    :payment-modal-style="paymentModalStyle"
    :design-repay-submitting="designRepaySubmitting"
    :design-repay-amount-text="designRepayAmountText"
    :design-repay-channel="designRepayChannel"
    :payment-channel-options="paymentChannelOptions"
    @close="$emit('close-design-repay-modal')"
    @submit="$emit('submit-design-order-repayment')"
    @update:design-repay-channel="$emit('update:design-repay-channel', $event)"
  />

  <UserPaymentModal
    :show="showPaymentModal"
    :payment-modal-title="paymentModalTitle"
    :payment-modal-style="paymentModalStyle"
    :payment-submitting="paymentSubmitting"
    :payment-target="paymentTarget"
    :payment-channel-options="paymentChannelOptions"
    :payment-channel="paymentChannel"
    @close="$emit('close-payment-modal')"
    @submit="$emit('submit-payment')"
    @update:payment-channel="$emit('update:payment-channel', $event)"
  />

  <UserAuditRejectModal
    :show="showAuditRejectModal"
    :audit-reject-reason="auditRejectReason"
    @close="$emit('close-audit-reject-modal')"
    @submit="$emit('submit-audit-reject')"
    @update:audit-reject-reason="$emit('update:audit-reject-reason', $event)"
  />

  <UserWechatPayModal
    :show="showWechatPayModal"
    :payment-modal-style="paymentModalStyle"
    :wechat-pay-url="wechatPayUrl"
    @close="$emit('close-wechat-pay-modal')"
  />

  <UserRefundApplyModal
    :show="showRefundModal"
    :refund-modal-style="refundModalStyle"
    :refund-submitting="refundSubmitting"
    :refund-target="refundTarget"
    :form-label-placement="formLabelPlacement"
    :is-compact-viewport="isCompactViewport"
    :refund-quick-reason="refundQuickReason"
    :refund-reason-options="refundReasonOptions"
    :refund-reason="refundReason"
    :format-amount="formatAmount"
    @close="$emit('close-refund-modal')"
    @submit="$emit('submit-refund-apply')"
    @preset-change="$emit('refund-reason-preset-change', $event)"
    @update:refund-reason="$emit('update:refund-reason', $event)"
  />

  <UserRefundDetailModal
    :show="showRefundDetailModal"
    :refund-detail-modal-style="refundDetailModalStyle"
    :loading-refund-detail="loadingRefundDetail"
    :refund-detail="refundDetail"
    :detail-descriptions-columns="detailDescriptionsColumns"
    :descriptions-label-placement="descriptionsLabelPlacement"
    :get-refund-status-tag-type="getRefundStatusTagType"
    :get-refund-status-text="getRefundStatusText"
    :format-amount="formatAmount"
    :get-refund-audit-operator-phone="getRefundAuditOperatorPhone"
    :format-date-time="formatDateTime"
    @close="$emit('close-refund-detail-modal')"
  />

  <UserPaymentStatementModal
    :show="showOrderPaymentStatementModal"
    :statement-modal-style="statementModalStyle"
    :order-payment-statement-loading="orderPaymentStatementLoading"
    :order-payment-statement-html="orderPaymentStatementHtml"
    @close="$emit('close-order-payment-statement-modal')"
  />
</template>

<script setup>
import UserDesignOrderDetailModal from '@/views/client/center/user/UserDesignOrderDetailModal.vue'
import UserOrderDetailModal from '@/views/client/center/user/UserOrderDetailModal.vue'
import UserAuditRejectModal from '@/views/client/center/user/modals/UserAuditRejectModal.vue'
import UserDesignRepayModal from '@/views/client/center/user/modals/UserDesignRepayModal.vue'
import UserPaymentModal from '@/views/client/center/user/modals/UserPaymentModal.vue'
import UserPaymentStatementModal from '@/views/client/center/user/modals/UserPaymentStatementModal.vue'
import UserRefundApplyModal from '@/views/client/center/user/modals/UserRefundApplyModal.vue'
import UserRefundDetailModal from '@/views/client/center/user/modals/UserRefundDetailModal.vue'
import UserWechatPayModal from '@/views/client/center/user/modals/UserWechatPayModal.vue'

defineProps({
  showDetailModal: {
    type: Boolean,
    default: false,
  },
  loadingDetail: {
    type: Boolean,
    default: false,
  },
  detailTab: {
    type: String,
    default: 'info',
  },
  detailModalStyle: {
    type: Object,
    required: true,
  },
  currentOrder: {
    type: Object,
    default: null,
  },
  descriptionsLabelPlacement: {
    type: String,
    default: 'left',
  },
  detailDescriptionsColumns: {
    type: Number,
    default: 2,
  },
  currentOrderPaymentStatus: {
    type: [String, Number],
    default: '',
  },
  currentOrderContactName: {
    type: String,
    default: '',
  },
  currentOrderContactPhone: {
    type: String,
    default: '',
  },
  currentOrderContractUrls: {
    type: Array,
    default: () => [],
  },
  userOptionConfigLoading: {
    type: Boolean,
    default: false,
  },
  userOptionConfigList: {
    type: Array,
    default: () => [],
  },
  userOptionSelectionMap: {
    type: Object,
    required: true,
  },
  canAdjustUserOptions: {
    type: Boolean,
    default: false,
  },
  userOptionSubmitting: {
    type: Boolean,
    default: false,
  },
  userOptionAdjustmentHintText: {
    type: String,
    default: '',
  },
  hasUserOptionSelectionChanges: {
    type: Boolean,
    default: false,
  },
  userOptionChangeTypeLabel: {
    type: String,
    default: '',
  },
  userOptionChangeSummaryText: {
    type: String,
    default: '',
  },
  userOptionalChangeLoading: {
    type: Boolean,
    default: false,
  },
  visibleUserOptionalChangeRecords: {
    type: Array,
    default: () => [],
  },
  currentEffectiveOptionSnapshot: {
    type: Array,
    default: () => [],
  },
  pendingTargetOptionSnapshot: {
    type: Array,
    default: () => [],
  },
  hasPendingUserOptionalChange: {
    type: Boolean,
    default: false,
  },
  canCancelLatestOptionalChange: {
    type: Boolean,
    default: false,
  },
  canApplyRefundForLatestOptionalChange: {
    type: Boolean,
    default: false,
  },
  canCancelRefundForLatestOptionalChange: {
    type: Boolean,
    default: false,
  },
  canViewRefundDetailForLatestOptionalChange: {
    type: Boolean,
    default: false,
  },
  latestOptionalChangeRefundPaymentRecordMissing: {
    type: Boolean,
    default: false,
  },
  constructionInfo: {
    type: Object,
    default: null,
  },
  currentNodeDetail: {
    type: Object,
    default: null,
  },
  currentNodeDetailStatusText: {
    type: String,
    default: '--',
  },
  isPendingConstructionPaymentForCurrentNode: {
    type: Boolean,
    default: false,
  },
  currentConstructionPayableBill: {
    type: Object,
    default: null,
  },
  isPendingUserAudit: {
    type: Boolean,
    default: false,
  },
  pendingPaymentBillsLoading: {
    type: Boolean,
    default: false,
  },
  hasPendingPaymentBills: {
    type: Boolean,
    default: false,
  },
  pendingPaymentBillRows: {
    type: Array,
    default: () => [],
  },
  detailPaymentRecordsLoading: {
    type: Boolean,
    default: false,
  },
  hasDetailPaymentRecords: {
    type: Boolean,
    default: false,
  },
  detailPaymentRecords: {
    type: Array,
    default: () => [],
  },
  getCurrentBusinessFlowStep: {
    type: Function,
    required: true,
  },
  getOrderBusinessFlowSteps: {
    type: Function,
    required: true,
  },
  getStatusType: {
    type: Function,
    required: true,
  },
  formatOrderStatus: {
    type: Function,
    required: true,
  },
  getOrderProductName: {
    type: Function,
    required: true,
  },
  formatCurrencyNumber: {
    type: Function,
    required: true,
  },
  getPaymentStatusType: {
    type: Function,
    required: true,
  },
  formatPaymentStatus: {
    type: Function,
    required: true,
  },
  getUserOptionalChangeStatusTagType: {
    type: Function,
    required: true,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
  formatAmount: {
    type: Function,
    required: true,
  },
  formatOptionalChangeSnapshot: {
    type: Function,
    required: true,
  },
  shouldShowOptionalChangePendingBillTag: {
    type: Function,
    required: true,
  },
  getConstructionStepsCurrent: {
    type: Function,
    required: true,
  },
  getNodeStepStatus: {
    type: Function,
    required: true,
  },
  getNodeStepDescription: {
    type: Function,
    required: true,
  },
  getPaymentBillDisplayTitle: {
    type: Function,
    required: true,
  },
  getPaymentBillTypeTagType: {
    type: Function,
    required: true,
  },
  getPaymentBillTypeText: {
    type: Function,
    required: true,
  },
  getPaymentBillStatusTagType: {
    type: Function,
    required: true,
  },
  getPaymentBillStatusText: {
    type: Function,
    required: true,
  },
  canRepayBill: {
    type: Function,
    required: true,
  },
  canCancelPendingOptionChangeBill: {
    type: Function,
    required: true,
  },
  getPendingBillActionText: {
    type: Function,
    required: true,
  },
  getDetailPaymentStageText: {
    type: Function,
    required: true,
  },
  getDetailPaymentChannelType: {
    type: Function,
    required: true,
  },
  getDetailPaymentChannelText: {
    type: Function,
    required: true,
  },
  getRefundStatusTagType: {
    type: Function,
    required: true,
  },
  getRefundStatusText: {
    type: Function,
    required: true,
  },
  canApplyRefundForPaymentRecordInList: {
    type: Function,
    required: true,
  },
  canCancelRefundForPaymentRecordInList: {
    type: Function,
    required: true,
  },
  canViewRefundDetailForPaymentRecordInList: {
    type: Function,
    required: true,
  },
  getPaymentRecordRefundStatus: {
    type: Function,
    required: true,
  },
  hasUploadedContract: {
    type: Function,
    required: true,
  },
  showDesignDetailModal: {
    type: Boolean,
    default: false,
  },
  loadingDesignDetail: {
    type: Boolean,
    default: false,
  },
  currentDesignOrder: {
    type: Object,
    default: null,
  },
  designDecisionSubmitting: {
    type: Boolean,
    default: false,
  },
  getDesignOrderStatusType: {
    type: Function,
    required: true,
  },
  getDesignOrderStatusText: {
    type: Function,
    required: true,
  },
  getDesignOrderPaymentStatusType: {
    type: Function,
    required: true,
  },
  formatDesignOrderPaymentStatus: {
    type: Function,
    required: true,
  },
  getDesignOrderMainProductNameText: {
    type: Function,
    required: true,
  },
  getDesignFileLabel: {
    type: Function,
    required: true,
  },
  canRepayDesignOrder: {
    type: Function,
    required: true,
  },
  canMarkDesignOrderNoBuild: {
    type: Function,
    required: true,
  },
  canContinueBuildDesignOrder: {
    type: Function,
    required: true,
  },
  showDesignRepayModal: {
    type: Boolean,
    default: false,
  },
  paymentModalStyle: {
    type: Object,
    required: true,
  },
  designRepaySubmitting: {
    type: Boolean,
    default: false,
  },
  designRepayAmountText: {
    type: String,
    default: '',
  },
  designRepayChannel: {
    type: String,
    default: 'ALIPAY',
  },
  paymentChannelOptions: {
    type: Array,
    default: () => [],
  },
  showPaymentModal: {
    type: Boolean,
    default: false,
  },
  paymentModalTitle: {
    type: String,
    default: '',
  },
  paymentSubmitting: {
    type: Boolean,
    default: false,
  },
  paymentTarget: {
    type: Object,
    required: true,
  },
  paymentChannel: {
    type: String,
    default: 'ALIPAY',
  },
  showAuditRejectModal: {
    type: Boolean,
    default: false,
  },
  auditRejectReason: {
    type: String,
    default: '',
  },
  showWechatPayModal: {
    type: Boolean,
    default: false,
  },
  wechatPayUrl: {
    type: String,
    default: '',
  },
  showRefundModal: {
    type: Boolean,
    default: false,
  },
  refundModalStyle: {
    type: Object,
    required: true,
  },
  refundSubmitting: {
    type: Boolean,
    default: false,
  },
  refundTarget: {
    type: Object,
    required: true,
  },
  formLabelPlacement: {
    type: String,
    default: 'left',
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  refundQuickReason: {
    type: String,
    default: null,
  },
  refundReasonOptions: {
    type: Array,
    default: () => [],
  },
  refundReason: {
    type: String,
    default: '',
  },
  showRefundDetailModal: {
    type: Boolean,
    default: false,
  },
  refundDetailModalStyle: {
    type: Object,
    required: true,
  },
  loadingRefundDetail: {
    type: Boolean,
    default: false,
  },
  refundDetail: {
    type: Object,
    default: null,
  },
  getRefundAuditOperatorPhone: {
    type: Function,
    required: true,
  },
  showOrderPaymentStatementModal: {
    type: Boolean,
    default: false,
  },
  statementModalStyle: {
    type: Object,
    required: true,
  },
  orderPaymentStatementLoading: {
    type: Boolean,
    default: false,
  },
  orderPaymentStatementHtml: {
    type: String,
    default: '',
  },
})

defineEmits([
  'update:show-detail-modal',
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
  'update:show-design-detail-modal',
  'open-design-order-payment-modal',
  'mark-design-order-no-build',
  'continue-build-design-order',
  'close-design-repay-modal',
  'submit-design-order-repayment',
  'update:design-repay-channel',
  'close-payment-modal',
  'submit-payment',
  'update:payment-channel',
  'close-audit-reject-modal',
  'submit-audit-reject',
  'update:audit-reject-reason',
  'close-wechat-pay-modal',
  'close-refund-modal',
  'submit-refund-apply',
  'refund-reason-preset-change',
  'update:refund-reason',
  'close-refund-detail-modal',
  'close-order-payment-statement-modal',
])
</script>
