<template>
  <ProviderEditModal
    :ref="editModalRef"
    :show="showEditModal"
    :modal-style="editModalStyle"
    :is-compact-viewport="isCompactViewport"
    :edit-form="editForm"
    :form-rules="formRules"
    :submitting="submitting"
    :edit-tip-text="editTipText"
    :service-type-options="serviceTypeOptions"
    :can-change-service-type="canChangeServiceType"
    :service-type-lock-reason="serviceTypeLockReason"
    :category-options="categoryOptions"
    :uploaded-files="uploadedFiles"
    :selected-company-region-code="selectedCompanyRegionCode"
    :company-region-cascader-options="companyRegionCascaderOptions"
    :company-address-form="companyAddressForm"
    :company-address-preview="companyAddressPreview"
    :requires-password-on-edit="requiresPasswordOnEdit"
    :get-service-type-tag="getServiceTypeTag"
    :get-service-type-text="getServiceTypeText"
    @update:show="$emit('update:show-edit-modal', $event)"
    @update:selected-company-region-code="
      $emit('update:selected-company-region-code', $event)
    "
    @update:field="$emit('update:edit-field', $event)"
    @update:company-address-detail="
      $emit('update:company-address-detail', $event)
    "
    @upload-certificate="$emit('upload-certificate', $event)"
    @remove-certificate="$emit('remove-certificate', $event)"
    @company-region-update="handleCompanyRegionUpdate"
    @change-password="$emit('change-password')"
    @submit="$emit('submit-edit')"
  />

  <ProviderPasswordModal
    :ref="passwordModalRef"
    :show="showPasswordModal"
    :modal-style="passwordModalStyle"
    :form="passwordForm"
    :rules="passwordRules"
    :sending-code="passwordSendingCode"
    :submitting="passwordSubmitting"
    :countdown="passwordCountdown"
    @update:show="$emit('update:show-password-modal', $event)"
    @update:field="$emit('update:password-field', $event)"
    @send-code="$emit('send-password-code')"
    @submit="$emit('submit-password-change')"
    @after-leave="$emit('reset-password-modal')"
  />

  <ProviderActionNoteModal
    :show="showNoteModal"
    :title="noteModalTitle"
    :positive-text="noteModalActionText"
    :placeholder="noteModalPlaceholder"
    :note="actionNote"
    @update:show="$emit('update:show-note-modal', $event)"
    @update:note="$emit('update:action-note', $event)"
    @submit="$emit('submit-order-action')"
  />

  <ProviderOrderDetailModal
    :show="showOrderModal"
    :loading="orderDetailLoading"
    :order-modal-style="orderModalStyle"
    :detail-descriptions-columns="detailDescriptionsColumns"
    :descriptions-label-placement="descriptionsLabelPlacement"
    :current-order-detail="currentOrderDetail"
    :construction-status="constructionStatus"
    :current-node-detail="currentNodeDetail"
    :construction-flow-state="constructionFlowState"
    :construction-flow-error-message="constructionFlowErrorMessage"
    :is-compact-viewport="isCompactViewport"
    :construction-grid-cols="constructionGridCols"
    :current-node-status-text="currentNodeStatusText"
    :can-upload-current-node="canUploadCurrentNode"
    :node-upload-submitting="nodeUploadSubmitting"
    :upload-node-description="uploadNodeDescription"
    :upload-node-file-list="uploadNodeFileList"
    :upload-node-tip-text="uploadNodeTipText"
    :can-delete-current-node-photo="canDeleteCurrentNodePhoto"
    :get-upload-node-preview-url="getUploadNodePreviewUrl"
    :format-chinese-date="formatChineseDate"
    :get-order-status-text="getOrderStatusText"
    :get-flow-current-node-status-text="getFlowCurrentNodeStatusText"
    :get-construction-steps-current="getConstructionStepsCurrent"
    :get-node-status-desc="getNodeStatusDesc"
    :get-node-status="getNodeStatus"
    @update:show="$emit('update:show-order-modal', $event)"
    @update:upload-node-description="
      $emit('update:upload-node-description', $event)
    "
    @update:upload-node-file-list="$emit('update:upload-node-file-list', $event)"
    @node-click="$emit('node-click', $event)"
    @submit-node-upload="$emit('submit-node-upload')"
    @remove-upload-file="$emit('remove-upload-file', $event)"
    @delete-photo="$emit('delete-photo', $event)"
  />
</template>

<script setup>
import ProviderActionNoteModal from '@/views/client/center/provider/ProviderActionNoteModal.vue'
import ProviderEditModal from '@/views/client/center/provider/ProviderEditModal.vue'
import ProviderOrderDetailModal from '@/views/client/center/provider/ProviderOrderDetailModal.vue'
import ProviderPasswordModal from '@/views/client/center/provider/ProviderPasswordModal.vue'

const emit = defineEmits([
  'update:show-edit-modal',
  'update:show-password-modal',
  'update:selected-company-region-code',
  'update:edit-field',
  'update:password-field',
  'update:company-address-detail',
  'upload-certificate',
  'remove-certificate',
  'company-region-update',
  'change-password',
  'send-password-code',
  'submit-password-change',
  'reset-password-modal',
  'submit-edit',
  'update:show-note-modal',
  'update:action-note',
  'submit-order-action',
  'update:show-order-modal',
  'update:upload-node-description',
  'update:upload-node-file-list',
  'node-click',
  'submit-node-upload',
  'remove-upload-file',
  'delete-photo',
])

const handleCompanyRegionUpdate = (...args) => {
  emit('company-region-update', ...args)
}

defineProps({
  editModalRef: {
    type: Object,
    default: null,
  },
  passwordModalRef: {
    type: Object,
    default: null,
  },
  showEditModal: {
    type: Boolean,
    default: false,
  },
  showPasswordModal: {
    type: Boolean,
    default: false,
  },
  editModalStyle: {
    type: Object,
    required: true,
  },
  passwordModalStyle: {
    type: Object,
    required: true,
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  editForm: {
    type: Object,
    required: true,
  },
  passwordForm: {
    type: Object,
    required: true,
  },
  formRules: {
    type: Object,
    required: true,
  },
  passwordRules: {
    type: Object,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  passwordSubmitting: {
    type: Boolean,
    default: false,
  },
  passwordSendingCode: {
    type: Boolean,
    default: false,
  },
  passwordCountdown: {
    type: Number,
    default: 0,
  },
  editTipText: {
    type: String,
    default: '',
  },
  serviceTypeOptions: {
    type: Array,
    default: () => [],
  },
  canChangeServiceType: {
    type: Boolean,
    default: false,
  },
  serviceTypeLockReason: {
    type: String,
    default: '',
  },
  categoryOptions: {
    type: Array,
    default: () => [],
  },
  uploadedFiles: {
    type: Array,
    default: () => [],
  },
  selectedCompanyRegionCode: {
    type: [String, Number, null],
    default: null,
  },
  companyRegionCascaderOptions: {
    type: Array,
    default: () => [],
  },
  companyAddressForm: {
    type: Object,
    required: true,
  },
  companyAddressPreview: {
    type: String,
    default: '',
  },
  requiresPasswordOnEdit: {
    type: Boolean,
    default: false,
  },
  getServiceTypeTag: {
    type: Function,
    required: true,
  },
  getServiceTypeText: {
    type: Function,
    required: true,
  },
  showNoteModal: {
    type: Boolean,
    default: false,
  },
  noteModalTitle: {
    type: String,
    default: '',
  },
  noteModalActionText: {
    type: String,
    default: '',
  },
  noteModalPlaceholder: {
    type: String,
    default: '',
  },
  actionNote: {
    type: String,
    default: '',
  },
  showOrderModal: {
    type: Boolean,
    default: false,
  },
  orderDetailLoading: {
    type: Boolean,
    default: false,
  },
  orderModalStyle: {
    type: Object,
    required: true,
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
  constructionFlowState: {
    type: String,
    default: 'idle',
  },
  constructionFlowErrorMessage: {
    type: String,
    default: '',
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
</script>
