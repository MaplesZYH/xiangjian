<template>
  <ClientCenterShell
    menu-title="服务商中心"
    :menu-items="providerMobileMenuItems"
    :active-menu="activeMenu"
    :is-compact-viewport="isCompactViewport"
    :mobile-columns="3"
    @update:active-menu="activeMenu = $event"
  >
    <ProviderCenterMainContent
      :active-menu="activeMenu"
      :is-compact-viewport="isCompactViewport"
      :loading="loading"
      :vendor-info="vendorInfo"
      :can-edit-vendor-info="canEditVendorInfo"
      :get-service-type-tag="getServiceTypeTag"
      :get-service-type-text="getServiceTypeText"
      :get-material-tag-style="getMaterialTagStyle"
      :order-status-tab="orderStatusTab"
      :unreplied-order-count="unrepliedOrderCount"
      :accepted-need-handle-count="acceptedNeedHandleCount"
      :orders-loading="ordersLoading"
      :order-list="orderList"
      :sorted-order-list="sortedOrderList"
      :pagination="pagination"
      :is-need-handle-construction-status="isNeedHandleConstructionStatus"
      :can-cancel-vendor-order="canCancelVendorOrder"
      @edit="handleEdit"
      @update:order-status-tab="handleOrderTabChange"
      @accept="handleAcceptConfirm"
      @reject="handleRejectConfirm"
      @cancel="handleCancelOrder"
      @open-detail="openOrderDetail"
      @page-change="handlePageChange"
      @cancel-logout="activeMenu = 'company'"
      @logout="logout"
    />

    <ProviderCenterModalStack
      :edit-modal-ref="editModalRef"
      :show-edit-modal="showEditModal"
      :edit-modal-style="editModalStyle"
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
      :show-note-modal="showNoteModal"
      :note-modal-title="noteModalTitle"
      :note-modal-action-text="noteModalActionText"
      :note-modal-placeholder="noteModalPlaceholder"
      :action-note="actionNote"
      :show-order-modal="showOrderModal"
      :order-detail-loading="orderDetailLoading"
      :order-modal-style="orderModalStyle"
      :detail-descriptions-columns="detailDescriptionsColumns"
      :descriptions-label-placement="descriptionsLabelPlacement"
      :current-order-detail="currentOrderDetail"
      :construction-status="constructionStatus"
      :current-node-detail="currentNodeDetail"
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
      @update:show-edit-modal="showEditModal = $event"
      @update:selected-company-region-code="selectedCompanyRegionCode = $event"
      @update:edit-field="handleEditFormFieldChange"
      @update:company-address-detail="handleCompanyAddressDetailChange"
      @upload-certificate="handleUploadRequest"
      @remove-certificate="handleRemoveFileRequest"
      @company-region-update="handleCompanyRegionUpdate"
      @submit-edit="handleSubmitEdit"
      @update:show-note-modal="showNoteModal = $event"
      @update:action-note="actionNote = $event"
      @submit-order-action="submitOrderAction"
      @update:show-order-modal="showOrderModal = $event"
      @update:upload-node-description="uploadNodeDescription = $event"
      @update:upload-node-file-list="uploadNodeFileList = $event"
      @node-click="handleNodeClick"
      @submit-node-upload="submitNodeUpload"
      @remove-upload-file="removeUploadNodeFile"
      @delete-photo="handleDeletePhoto"
    />
  </ClientCenterShell>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useVendorOrderStore } from '@/stores/order/useVendorOrderStore'
import { useVendorProfileStore } from '@/stores/vendor/useVendorProfileStore'
import {
  AUTH_SCOPE_PROVIDER,
  getAuthStorage,
} from '@/utils/auth'
import ClientCenterShell from '@/views/client/center/shared/ClientCenterShell.vue'
import ProviderCenterMainContent from '@/views/client/center/provider/ProviderCenterMainContent.vue'
import ProviderCenterModalStack from '@/views/client/center/provider/ProviderCenterModalStack.vue'
import { providerMobileMenuItems } from '@/views/client/center/provider/providerCenterPageConfig'
import { useProviderCenterViewLayout } from '@/views/client/center/provider/composables/useProviderCenterViewLayout'
import { useProviderPendingOrderNotification } from '@/views/client/center/provider/composables/useProviderPendingOrderNotification'
import { useProviderProfilePanel } from '@/views/client/center/provider/composables/useProviderProfilePanel'
import { useProviderOrderPanel } from '@/views/client/center/provider/composables/useProviderOrderPanel'
import { useProviderOrderDetailPanel } from '@/views/client/center/provider/composables/useProviderOrderDetailPanel'
import { useProviderCenterViewLifecycle } from '@/views/client/center/provider/composables/useProviderCenterViewLifecycle'

const emit = defineEmits(['updateName'])
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const vendorOrderStore = useVendorOrderStore()
const vendorProfileStore = useVendorProfileStore()
const activeMenu = ref('company')
const getProviderId = () => getAuthStorage(AUTH_SCOPE_PROVIDER, 'id')

const {
  isCompactViewport,
  descriptionsLabelPlacement,
  detailDescriptionsColumns,
  constructionGridCols,
  editModalStyle,
  orderModalStyle,
} = useProviderCenterViewLayout()

const {
  loading,
  vendorInfo,
  categoryOptions,
  uploadedFiles,
  submitting,
  selectedCompanyRegionCode,
  companyAddressPreview,
  canEditVendorInfo,
  editTipText,
  editForm,
  serviceTypeOptions,
  companyAddressForm,
  companyRegionCascaderOptions,
  editModalRef,
  showEditModal,
  formRules,
  requiresPasswordOnEdit,
  canChangeServiceType,
  serviceTypeLockReason,
  fetchVendorInfo,
  handleCompanyRegionUpdate,
  handleEditFormFieldChange,
  handleCompanyAddressDetailChange,
  handleEdit,
  handleUploadRequest,
  handleRemoveFileRequest,
  submitEdit,
  getServiceTypeText,
  getServiceTypeTag,
  getMaterialTagStyle,
} = useProviderProfilePanel({
  emit,
  getProviderId,
})

const {
  orderList,
  ordersLoading,
  orderStatusTab,
  unrepliedOrderCount,
  acceptedNeedHandleCount,
  sortedOrderList,
  pagination,
  showNoteModal,
  noteModalTitle,
  noteModalActionText,
  noteModalPlaceholder,
  actionNote,
  refreshVendorOrders,
  handleOrderTabChange,
  handlePageChange,
  handleAcceptConfirm,
  handleRejectConfirm,
  submitOrderAction,
  handleCancelOrder,
  isNeedHandleConstructionStatus,
  canCancelVendorOrder,
} = useProviderOrderPanel()

const {
  maybeShowPendingOrderNotification,
  clearPendingOrderNotificationRead,
  closePendingOrderNotification,
} = useProviderPendingOrderNotification({
  vendorInfo,
  acceptedNeedHandleCount,
  unrepliedOrderCount,
  getProviderId,
})

const {
  orderDetailLoading,
  currentOrderDetail,
  constructionStatus,
  currentNodeDetail,
  showOrderModal,
  uploadNodeDescription,
  uploadNodeFileList,
  nodeUploadSubmitting,
  currentNodeStatusText,
  canUploadCurrentNode,
  uploadNodeTipText,
  canDeleteCurrentNodePhoto,
  getFlowCurrentNodeStatusText,
  openOrderDetail,
  handleNodeClick,
  getConstructionStepsCurrent,
  getNodeStatus,
  getNodeStatusDesc,
  getUploadNodePreviewUrl,
  removeUploadNodeFile,
  submitNodeUpload,
  handleDeletePhoto,
  formatChineseDate,
  getOrderStatusText,
} = useProviderOrderDetailPanel({
  refreshVendorOrders,
})

const handleSubmitEdit = () =>
  submitEdit({
    refreshVendorData: () =>
      fetchVendorInfo({
        activeMenu: activeMenu.value,
        refreshVendorOrders,
      }),
  })

const logout = () => {
  clearPendingOrderNotificationRead(getProviderId())
  closePendingOrderNotification()
  vendorOrderStore.clearOrderState()
  vendorProfileStore.clearProfileState()
  authStore.logout(AUTH_SCOPE_PROVIDER)
  router.replace('/login')
  message.success('已退出登录')
}

watch(
  () => editForm.serviceType,
  (value) => {
    if (![2, 3].includes(value)) {
      editForm.materialCategoryIds = []
    }
  },
)

useProviderCenterViewLifecycle({
  authStore,
  activeMenu,
  pagination,
  fetchVendorInfo: () =>
    fetchVendorInfo({
      activeMenu: activeMenu.value,
      refreshVendorOrders,
    }),
  refreshVendorOrders,
  vendorInfo,
  acceptedNeedHandleCount,
  unrepliedOrderCount,
  maybeShowPendingOrderNotification,
  closePendingOrderNotification,
})
</script>
