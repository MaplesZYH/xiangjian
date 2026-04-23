<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="订单处理流程"
    size="huge"
    :style="{ width: 'min(1000px, calc(100vw - 20px))', height: '85vh' }"
    :bordered="false"
  >
    <n-spin :show="loading">
      <n-tabs type="segment" animated :value="dispatchTab" @update:value="updateDispatchTab">
        <n-tab-pane name="contract" tab="1. 合同管理">
          <ManageDetailOrderDispatchContractTab
            :current-contract-url="currentContractUrl"
            :detail-order="detailOrder"
            :get-payment-text="getPaymentText"
            :is-image="isImage"
            :handle-upload-contract="handleUploadContract"
          />
        </n-tab-pane>

        <n-tab-pane name="dispatch" tab="2. 派单管理" :disabled="!canDispatch">
          <ManageDetailOrderDispatchAssignTab
            :can-dispatch="canDispatch"
            :is-dispatch-stage-locked="isDispatchStageLocked"
            :active-construction-order="activeConstructionOrder"
            :all-services-accepted="allServicesAccepted"
            :construction-form="constructionForm"
            :construction-vendor-options="constructionVendorOptions"
            :loading-vendor-opts="loadingVendorOpts"
            :material-columns="materialColumns"
            :material-dispatch-list="materialDispatchList"
            :is-read-only="isReadOnly"
            :should-show-construction-pricing-button="shouldShowConstructionPricingButton"
            :can-open-construction-pricing-entry="canOpenConstructionPricingEntry"
            :construction-pricing-button-text="constructionPricingButtonText"
            :detail-order="detailOrder"
            :get-vendor-status-info="getVendorStatusInfo"
            :has-vendor-reject-reason="hasVendorRejectReason"
            :get-vendor-reject-reason="getVendorRejectReason"
            :show-vendor-reason-dialog="showVendorReasonDialog"
            :load-builders="loadBuilders"
            :submit-construction-dispatch="submitConstructionDispatch"
            :handle-re-dispatch="handleReDispatch"
            :handle-pre-cancel="handlePreCancel"
            :handle-open-unified-detail="handleOpenUnifiedDetail"
            :handle-go-to-construction-pricing="handleGoToConstructionPricing"
            @update:construction-form-field="emit('update:constructionFormField', $event)"
          />
        </n-tab-pane>

        <n-tab-pane name="pricing" tab="3. 确认开工节点金额" :disabled="!detailOrder?.id">
          <ManageDetailOrderDispatchPricingTab
            :detail-order="detailOrder"
            :construction-pricing-process-text="constructionPricingProcessText"
            :construction-base-amount="constructionBaseAmount"
            :deposit-draft-amount="depositDraftAmount"
            :construction-pricing-stage-rows="constructionPricingStageRows"
            :construction-price-plan-status-text="constructionPricePlanStatusText"
            :construction-price-plan-hint="constructionPricePlanHint"
            :construction-workflow-started="constructionWorkflowStarted"
            :can-configure-construction-price="canConfigureConstructionPrice"
            :can-edit-construction-deposit="canEditConstructionDeposit"
            :can-start-construction-entry="canStartConstructionEntry"
            :can-sync-construction-price-plan="canSyncConstructionPricePlan"
            :deposit-submitting="depositSubmitting"
            :plan-submitting="planSubmitting"
            :handle-update-construction-deposit-draft="handleUpdateConstructionDepositDraft"
            :handle-save-construction-deposit="handleSaveConstructionDeposit"
            :handle-confirm-construction-pricing="handleConfirmConstructionPricing"
            :handle-sync-construction-price-plan="handleSyncConstructionPricePlan"
          />
        </n-tab-pane>

        <n-tab-pane name="flow" tab="4. 施工流程" :disabled="!constructionInfo">
          <ManageDetailOrderDispatchFlowTab
            :construction-info="constructionInfo"
            :loading-construction="loadingConstruction"
            :should-show-wait-upload-highlight="shouldShowWaitUploadHighlight"
            :should-show-wait-user-audit-highlight="shouldShowWaitUserAuditHighlight"
            :should-show-wait-bill-payment-highlight="shouldShowWaitBillPaymentHighlight"
            :active-construction-node="activeConstructionNode"
            :current-node-detail="currentNodeDetail"
            :current-node-detail-status-text="currentNodeDetailStatusText"
            :is-pending-audit="isPendingAudit"
            :handle-node-click="handleNodeClick"
            :handle-audit-reject="handleAuditReject"
            :handle-audit-pass="handleAuditPass"
          />
        </n-tab-pane>

        <n-tab-pane name="bills" tab="5. 支付账单" :disabled="!detailOrder?.id">
          <ManageDetailOrderDispatchBillsTab
            :has-admin-payment-bill-rows="hasAdminPaymentBillRows"
            :admin-payment-bill-rows="adminPaymentBillRows"
            :get-admin-bill-display-title="getAdminBillDisplayTitle"
            :get-payment-bill-type-tag-type="getPaymentBillTypeTagType"
            :get-payment-bill-type-text="getPaymentBillTypeText"
            :get-admin-bill-status-tag-type="getAdminBillStatusTagType"
            :get-admin-bill-status-text="getAdminBillStatusText"
            :get-bill-related-node-name="getBillRelatedNodeName"
            :format-currency-amount="formatCurrencyAmount"
            :format-date-time="formatDateTime"
          />
        </n-tab-pane>

        <n-tab-pane name="optionalChange" tab="6. 选配变更" :disabled="!detailOrder?.id">
          <ManageDetailOrderDispatchOptionalChangeTab
            :optional-change-loading="optionalChangeLoading"
            :visible-optional-change-records="visibleOptionalChangeRecords"
            :can-audit-optional-change="canAuditOptionalChange"
            :get-optional-change-status-tag-type="getOptionalChangeStatusTagType"
            :format-date-time="formatDateTime"
            :format-currency-amount="formatCurrencyAmount"
            :format-admin-optional-change-snapshot="formatAdminOptionalChangeSnapshot"
            :open-optional-change-audit-modal="openOptionalChangeAuditModal"
          />
        </n-tab-pane>
      </n-tabs>

      <div v-if="shouldShowConstructionProgressButton" class="construction-progress-actions">
        <n-button type="info" size="large" @click="updateDispatchTab('flow')">
          查看施工进度
        </n-button>
      </div>
    </n-spin>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import ManageDetailOrderDispatchAssignTab from '@/views/admin/manage-detail-order/ManageDetailOrderDispatchAssignTab.vue'
import ManageDetailOrderDispatchBillsTab from '@/views/admin/manage-detail-order/ManageDetailOrderDispatchBillsTab.vue'
import ManageDetailOrderDispatchContractTab from '@/views/admin/manage-detail-order/ManageDetailOrderDispatchContractTab.vue'
import ManageDetailOrderDispatchFlowTab from '@/views/admin/manage-detail-order/ManageDetailOrderDispatchFlowTab.vue'
import ManageDetailOrderDispatchOptionalChangeTab from '@/views/admin/manage-detail-order/ManageDetailOrderDispatchOptionalChangeTab.vue'
import ManageDetailOrderDispatchPricingTab from '@/views/admin/manage-detail-order/ManageDetailOrderDispatchPricingTab.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  detailOrder: {
    type: Object,
    default: null,
  },
  dispatchTab: {
    type: String,
    default: 'contract',
  },
  currentContractUrl: {
    type: String,
    default: '',
  },
  canDispatch: {
    type: Boolean,
    default: false,
  },
  isDispatchStageLocked: {
    type: Boolean,
    default: false,
  },
  activeConstructionOrder: {
    type: Object,
    default: null,
  },
  allServicesAccepted: {
    type: Boolean,
    default: false,
  },
  constructionForm: {
    type: Object,
    required: true,
  },
  constructionVendorOptions: {
    type: Array,
    default: () => [],
  },
  loadingVendorOpts: {
    type: Boolean,
    default: false,
  },
  materialColumns: {
    type: Array,
    default: () => [],
  },
  materialDispatchList: {
    type: Array,
    default: () => [],
  },
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  shouldShowConstructionPricingButton: {
    type: Boolean,
    default: false,
  },
  canOpenConstructionPricingEntry: {
    type: Boolean,
    default: false,
  },
  constructionPricingButtonText: {
    type: String,
    default: '',
  },
  constructionPricingProcessText: {
    type: String,
    default: '',
  },
  constructionBaseAmount: {
    type: Number,
    default: 0,
  },
  depositDraftAmount: {
    type: Number,
    default: 0,
  },
  constructionPricingStageRows: {
    type: Array,
    default: () => [],
  },
  constructionPricePlanStatusText: {
    type: String,
    default: '',
  },
  constructionPricePlanHint: {
    type: String,
    default: '',
  },
  constructionWorkflowStarted: {
    type: Boolean,
    default: false,
  },
  canConfigureConstructionPrice: {
    type: Boolean,
    default: false,
  },
  canEditConstructionDeposit: {
    type: Boolean,
    default: false,
  },
  canStartConstructionEntry: {
    type: Boolean,
    default: false,
  },
  canSyncConstructionPricePlan: {
    type: Boolean,
    default: false,
  },
  depositSubmitting: {
    type: Boolean,
    default: false,
  },
  planSubmitting: {
    type: Boolean,
    default: false,
  },
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
  hasAdminPaymentBillRows: {
    type: Boolean,
    default: false,
  },
  adminPaymentBillRows: {
    type: Array,
    default: () => [],
  },
  optionalChangeLoading: {
    type: Boolean,
    default: false,
  },
  visibleOptionalChangeRecords: {
    type: Array,
    default: () => [],
  },
  canAuditOptionalChange: {
    type: Boolean,
    default: false,
  },
  shouldShowConstructionProgressButton: {
    type: Boolean,
    default: false,
  },
  isImage: {
    type: Function,
    required: true,
  },
  handleUploadContract: {
    type: Function,
    required: true,
  },
  getPaymentText: {
    type: Function,
    required: true,
  },
  getVendorStatusInfo: {
    type: Function,
    required: true,
  },
  hasVendorRejectReason: {
    type: Function,
    required: true,
  },
  getVendorRejectReason: {
    type: Function,
    required: true,
  },
  showVendorReasonDialog: {
    type: Function,
    required: true,
  },
  loadBuilders: {
    type: Function,
    required: true,
  },
  submitConstructionDispatch: {
    type: Function,
    required: true,
  },
  handleOpenUnifiedDetail: {
    type: Function,
    required: true,
  },
  handleGoToConstructionPricing: {
    type: Function,
    required: true,
  },
  handleUpdateConstructionDepositDraft: {
    type: Function,
    required: true,
  },
  handleSaveConstructionDeposit: {
    type: Function,
    required: true,
  },
  handleConfirmConstructionPricing: {
    type: Function,
    required: true,
  },
  handleSyncConstructionPricePlan: {
    type: Function,
    required: true,
  },
  handleReDispatch: {
    type: Function,
    required: true,
  },
  handlePreCancel: {
    type: Function,
    required: true,
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
  getAdminBillDisplayTitle: {
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
  getAdminBillStatusTagType: {
    type: Function,
    required: true,
  },
  getAdminBillStatusText: {
    type: Function,
    required: true,
  },
  getBillRelatedNodeName: {
    type: Function,
    required: true,
  },
  formatCurrencyAmount: {
    type: Function,
    required: true,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
  getOptionalChangeStatusTagType: {
    type: Function,
    required: true,
  },
  formatAdminOptionalChangeSnapshot: {
    type: Function,
    required: true,
  },
  openOptionalChangeAuditModal: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'update:show',
  'update:dispatchTab',
  'update:constructionFormField',
])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const updateDispatchTab = (value) => {
  emit('update:dispatchTab', value)
}
</script>

<style lang="scss" scoped>
.construction-progress-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-soft);
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 768px) {
  .construction-progress-actions {
    margin-top: 16px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: stretch;
    padding-left: 0;
    padding-right: 0;
  }

  .construction-progress-actions > * {
    flex: 1 1 100%;
  }
}
</style>
