<template>
  <div class="dispatch-panel">
    <ConstructionPricingPanel
      :order-number="detailOrder?.orderNumber || ''"
      :process-text="constructionPricingProcessText"
      :total-amount="Number(detailOrder?.totalAmount || 0)"
      :construction-base-amount="constructionBaseAmount"
      :deposit-amount="depositDraftAmount"
      :stage-rows="constructionPricingStageRows"
      :editable-nodes="editableConstructionNodes"
      :editable-stage-amount-total="editableStageAmountTotal"
      :price-plan-status-text="constructionPricePlanStatusText"
      :price-plan-hint="constructionPricePlanHint"
      :workflow-started="constructionWorkflowStarted"
      :can-edit-deposit="canConfigureConstructionPrice && canEditConstructionDeposit"
      :saving-node-price-id="savingNodePriceId"
      :can-confirm-plan="canStartConstructionEntry"
      :confirm-plan-disabled-reason="startConstructionBlockedReason"
      :can-sync-plan="canSyncConstructionPricePlan"
      :deposit-saving="depositSubmitting"
      :plan-submitting="planSubmitting"
      @update-deposit-draft="handleUpdateConstructionDepositDraft"
      @update-node-draft="handleUpdateConstructionNodeDraft"
      @save-node-prices="handleSaveConstructionNodePrices"
      @save-deposit="handleSaveConstructionDeposit"
      @confirm-plan="handleConfirmConstructionPricing"
      @sync-plan="handleSyncConstructionPricePlan"
    />
  </div>
</template>

<script setup>
import ConstructionPricingPanel from '@/components/admin/order/ConstructionPricingPanel.vue'

defineProps({
  detailOrder: {
    type: Object,
    default: null,
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
  editableConstructionNodes: {
    type: Array,
    default: () => [],
  },
  editableStageAmountTotal: {
    type: Number,
    default: 0,
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
  savingNodePriceId: {
    type: [String, Number, null],
    default: null,
  },
  canStartConstructionEntry: {
    type: Boolean,
    default: false,
  },
  startConstructionBlockedReason: {
    type: String,
    default: '',
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
  handleUpdateConstructionDepositDraft: {
    type: Function,
    required: true,
  },
  handleSaveConstructionDeposit: {
    type: Function,
    required: true,
  },
  handleUpdateConstructionNodeDraft: {
    type: Function,
    required: true,
  },
  handleSaveConstructionNodePrices: {
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
})
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

@media (max-width: 768px) {
  .dispatch-panel {
    padding: 4px 2px 8px;
    max-height: calc(85vh - 180px);
  }
}
</style>
