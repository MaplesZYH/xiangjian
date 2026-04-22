<template>
  <div class="page-container">
    <ManageDetailOrderListPanel
      :filters="filters"
      :order-status-options="orderStatusOptions"
      :payment-status-options="paymentStatusOptions"
      :todo-cards="todoCards"
      :active-todo-filter="activeTodoFilter"
      :active-todo-filter-label="activeTodoFilterLabel"
      :visible-order-list="visibleOrderList"
      :loading-list="loadingList"
      :empty-order-list-description="emptyOrderListDescription"
      :page-info="pageInfo"
      :format-todo-badge-count="formatTodoBadgeCount"
      :get-status-type="getStatusType"
      :get-status-text="getStatusText"
      :get-payment-type="getPaymentType"
      :get-payment-text="getPaymentText"
      :can-open-dispatch-entry="canOpenDispatchEntry"
      @search="handleSearch"
      @update:filter-field="handleFilterFieldUpdate"
      @update:active-todo-filter="handleActiveTodoFilterChange"
      @open-detail="handleOpenUnifiedDetail"
      @open-dispatch="handleOpenDispatch"
      @delete-order="handleUserOrderDelete"
      @page-change="handlePageChange"
    />

    <ManageDetailOrderDetailModal
      :show="showDetailModal"
      :loading-detail="loadingDetail"
      :detail-order="detailOrder"
      :get-status-type="getStatusType"
      :get-status-text="getStatusText"
      :get-payment-type="getPaymentType"
      :get-payment-text="getPaymentText"
      :is-read-only="isReadOnly"
      :is-address-locked="isAddressLocked"
      :selected-order-region-code="selectedOrderRegionCode"
      :order-region-cascader-options="orderRegionCascaderOptions"
      :order-address-form="orderAddressForm"
      :order-address-preview="orderAddressPreview"
      :loading-metadata="loadingMetadata"
      :dynamic-config-list="dynamicConfigList"
      :selection-map="selectionMap"
      :get-style-label="getStyleLabel"
      :submitting="submitting"
      @update:show="handleDetailModalShowChange"
      @update:selected-order-region-code="handleSelectedOrderRegionCodeChange"
      @update:order-address-detail="handleOrderAddressDetailChange"
      @update:customer-notes="handleDetailCustomerNotesChange"
      @update:selection-item="handleSelectionItemChange"
      @order-region-update="handleOrderRegionUpdate"
      @save="handleUpdateOrder"
    />

    <ManageDetailOrderDispatchModal
      :show="showDispatchModal"
      :loading="dispatchLoading"
      :detail-order="detailOrder"
      :dispatch-tab="dispatchTab"
      :current-contract-url="currentContractUrl"
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
      :construction-info="constructionInfo"
      :loading-construction="loadingConstruction"
      :should-show-wait-upload-highlight="shouldShowWaitUploadHighlight"
      :should-show-wait-user-audit-highlight="shouldShowWaitUserAuditHighlight"
      :should-show-wait-bill-payment-highlight="shouldShowWaitBillPaymentHighlight"
      :active-construction-node="activeConstructionNode"
      :current-node-detail="currentNodeDetail"
      :current-node-detail-status-text="currentNodeDetailStatusText"
      :is-pending-audit="isPendingAudit"
      :has-admin-payment-bill-rows="hasAdminPaymentBillRows"
      :admin-payment-bill-rows="adminPaymentBillRows"
      :optional-change-loading="optionalChangeLoading"
      :visible-optional-change-records="visibleOptionalChangeRecords"
      :can-audit-optional-change="canAuditOptionalChange"
      :should-show-construction-progress-button="shouldShowConstructionProgressButton"
      :is-image="isImage"
      :handle-upload-contract="handleUploadContract"
      :get-payment-text="getPaymentText"
      :get-vendor-status-info="getVendorStatusInfo"
      :has-vendor-reject-reason="hasVendorRejectReason"
      :get-vendor-reject-reason="getVendorRejectReason"
      :show-vendor-reason-dialog="showVendorReasonDialog"
      :load-builders="loadBuilders"
      :submit-construction-dispatch="submitConstructionDispatch"
      :handle-open-unified-detail="handleOpenUnifiedDetail"
      :handle-go-to-construction-pricing="handleGoToConstructionPricing"
      :handle-update-construction-deposit-draft="handleUpdateConstructionDepositDraft"
      :handle-save-construction-deposit="handleSaveConstructionDeposit"
      :handle-confirm-construction-pricing="handleConfirmConstructionPricing"
      :handle-sync-construction-price-plan="handleSyncConstructionPricePlan"
      :handle-re-dispatch="handleReDispatch"
      :handle-pre-cancel="handlePreCancel"
      :handle-node-click="handleNodeClick"
      :handle-audit-reject="handleAuditReject"
      :handle-audit-pass="handleAuditPass"
      :get-admin-bill-display-title="getAdminBillDisplayTitle"
      :get-payment-bill-type-tag-type="getPaymentBillTypeTagType"
      :get-payment-bill-type-text="getPaymentBillTypeText"
      :get-admin-bill-status-tag-type="getAdminBillStatusTagType"
      :get-admin-bill-status-text="getAdminBillStatusText"
      :get-bill-related-node-name="getBillRelatedNodeName"
      :format-currency-amount="formatCurrencyAmount"
      :format-date-time="formatDateTime"
      :get-optional-change-status-tag-type="getOptionalChangeStatusTagType"
      :format-admin-optional-change-snapshot="formatAdminOptionalChangeSnapshot"
      :open-optional-change-audit-modal="openOptionalChangeAuditModal"
      @update:show="handleDispatchModalShowChange"
      @update:dispatch-tab="handleDispatchTabChange"
      @update:construction-form-field="handleConstructionFormFieldChange"
    />

    <ManageDetailOrderOptionalChangeAuditModal
      :show="showOptionalChangeAuditModal"
      :current-record="currentOptionalChangeAuditRecord"
      :audit-form="optionalChangeAuditForm"
      :mode-options="currentOptionalChangeAuditModeOptions"
      :mode-hint="currentOptionalChangeAuditModeHint"
      :can-view-payment-record-list="canViewPaymentRecordList"
      :payment-record-options="optionalChangePaymentRecordOptions"
      :payment-record-loading="optionalChangePaymentRecordLoading"
      :submitting="optionalChangeSubmitting"
      :format-currency-amount="formatCurrencyAmount"
      @update:show="setOptionalChangeAuditModalVisible"
      @update:audit-form-field="handleOptionalChangeAuditFieldChange"
      @submit="submitOptionalChangeAudit"
    />

    <ManageDetailOrderMaterialDispatchModal
      :show="showMaterialDispatchModal"
      :material-dispatch-replacing-vendor-order-id="
        materialDispatchReplacingVendorOrderId
      "
      :current-target="currentTarget"
      :material-form="materialForm"
      :material-vendor-options="materialVendorOptions"
      :selected-material-vendor-option="selectedMaterialVendorOption"
      :loading-vendor-opts="loadingVendorOpts"
      :can-manage-material-dispatch="canManageMaterialDispatch"
      :get-vendor-service-type-text="getVendorServiceTypeText"
      :format-vendor-distance="formatVendorDistance"
      @update:show="handleMaterialDispatchModalShowChange"
      @update:material-form-field="handleMaterialFormFieldChange"
      @submit="submitMaterialDispatch"
    />

    <ManageDetailOrderRedispatchModal
      :show="showRedispatchModal"
      :redispatch-target="redispatchTarget"
      :redispatch-form="redispatchForm"
      :redispatch-vendor-options="redispatchVendorOptions"
      :selected-redispatch-vendor-option="selectedRedispatchVendorOption"
      :redispatch-loading="redispatchLoading"
      :redispatch-submitting="redispatchSubmitting"
      :can-manage-material-dispatch="canManageMaterialDispatch"
      :get-vendor-service-type-text="getVendorServiceTypeText"
      :format-vendor-distance="formatVendorDistance"
      @update:show="handleRedispatchModalShowChange"
      @update:redispatch-form-field="handleRedispatchFormFieldChange"
      @submit="submitRedispatch"
    />

    <ManageDetailOrderCancelDispatchModal
      :show="showCancelModal"
      :cancel-reason="cancelReason"
      @update:show="handleCancelModalShowChange"
      @update:cancel-reason="cancelReason = $event"
      @submit="submitCancel"
    />

    <ManageDetailOrderAuditRejectModal
      :show="showAuditRejectModal"
      :audit-reject-reason="auditRejectReason"
      @update:show="handleAuditRejectModalShowChange"
      @update:audit-reject-reason="auditRejectReason = $event"
      @submit="submitAudit(false, auditRejectReason)"
    />
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
import { useAdminOrderManageStore } from '@/stores/order/useAdminOrderManageStore'
import { getEmployeePermissions, hasPermission } from '@/utils/adminAuth'
import { CONSTRUCTION_NODE_STATUS } from '@/utils/construction'
import { AUTH_SCOPE_EMPLOYEE, getAuthStorage } from '@/utils/auth'
import ManageDetailOrderAuditRejectModal from '@/views/admin/manage-detail-order/ManageDetailOrderAuditRejectModal.vue'
import ManageDetailOrderCancelDispatchModal from '@/views/admin/manage-detail-order/ManageDetailOrderCancelDispatchModal.vue'
import ManageDetailOrderDetailModal from '@/views/admin/manage-detail-order/ManageDetailOrderDetailModal.vue'
import ManageDetailOrderDispatchModal from '@/views/admin/manage-detail-order/ManageDetailOrderDispatchModal.vue'
import ManageDetailOrderListPanel from '@/views/admin/manage-detail-order/ManageDetailOrderListPanel.vue'
import ManageDetailOrderMaterialDispatchModal from '@/views/admin/manage-detail-order/ManageDetailOrderMaterialDispatchModal.vue'
import ManageDetailOrderOptionalChangeAuditModal from '@/views/admin/manage-detail-order/ManageDetailOrderOptionalChangeAuditModal.vue'
import ManageDetailOrderRedispatchModal from '@/views/admin/manage-detail-order/ManageDetailOrderRedispatchModal.vue'
import { useManageDetailOrderConstructionFlow } from '@/views/admin/manage-detail-order/useManageDetailOrderConstructionFlow'
import { useManageDetailOrderDispatch } from '@/views/admin/manage-detail-order/useManageDetailOrderDispatch'
import { useManageDetailOrderListState } from '@/views/admin/manage-detail-order/useManageDetailOrderListState'
import { useManageDetailOrderOptionalChange } from '@/views/admin/manage-detail-order/useManageDetailOrderOptionalChange'
import { useManageDetailOrderPaymentBills } from '@/views/admin/manage-detail-order/useManageDetailOrderPaymentBills'

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

const {
  loadConstructionStatus,
  handleNodeClick,
  isPendingAudit,
  submitAudit,
  handleAuditPass,
  handleAuditReject,
} = useManageDetailOrderConstructionFlow({
  constructionInfo,
  currentNodeDetail,
  currentDispatchOrder,
  showAuditRejectModal,
  auditRejectReason,
  orderManageStore,
  message,
  dialog,
  getErrorMessage,
  constructionNodeStatus: CONSTRUCTION_NODE_STATUS,
})

const {
  activeTodoFilter,
  orderStatusOptions,
  paymentStatusOptions,
  todoCards,
  activeTodoFilterLabel,
  visibleOrderList,
  emptyOrderListDescription,
  formatTodoBadgeCount,
  getStatusText,
  getStyleLabel,
  getStatusType,
  getPaymentText,
  getPaymentType,
  getVendorStatusInfo,
  hasVendorRejectReason,
  getVendorRejectReason,
  getVendorServiceTypeText,
  formatVendorDistance,
  showVendorReasonDialog,
  handleActiveTodoFilterChange,
  handleFilterFieldUpdate,
  canOpenDispatchEntry,
} = useManageDetailOrderListState({
  orderList,
  filters,
  dialog,
})

const handleDetailModalShowChange = (value) => {
  showDetailModal.value = value
}

const handleDispatchModalShowChange = (value) => {
  showDispatchModal.value = value
}

const handleDispatchTabChange = (value) => {
  dispatchTab.value = value
}

const handleMaterialDispatchModalShowChange = (value) => {
  showMaterialDispatchModal.value = value
}

const handleRedispatchModalShowChange = (value) => {
  showRedispatchModal.value = value
}

const handleCancelModalShowChange = (value) => {
  showCancelModal.value = value
}

const handleAuditRejectModalShowChange = (value) => {
  showAuditRejectModal.value = value
}

const handleMaterialFormFieldChange = ({ key, value }) => {
  if (!key) return
  materialForm[key] = value
}

const handleRedispatchFormFieldChange = ({ key, value }) => {
  if (!key) return
  redispatchForm[key] = value
}

const handleSelectedOrderRegionCodeChange = (value) => {
  selectedOrderRegionCode.value = value
}

const handleOrderAddressDetailChange = (value) => {
  orderAddressForm.detail = value
}

const handleDetailCustomerNotesChange = (value) => {
  if (!detailOrder.value) return
  detailOrder.value.customerNotes = value
}

const handleSelectionItemChange = ({ key, value }) => {
  if (!key) return
  selectionMap.value[key] = value
}

const handleConstructionFormFieldChange = ({ key, value }) => {
  if (!key) return
  constructionForm[key] = value
}

watch(
  () => filters.keyword,
  (newVal) => {
    if (!newVal) {
      handleReset()
    }
  },
)

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

const {
  shouldShowWaitUploadHighlight,
  shouldShowWaitUserAuditHighlight,
  shouldShowWaitBillPaymentHighlight,
  formatCurrencyAmount,
  formatDateTime,
  getPaymentBillTypeText,
  getPaymentBillTypeTagType,
  adminPaymentBillRows,
  hasAdminPaymentBillRows,
  getAdminBillStatusText,
  getAdminBillStatusTagType,
  getAdminBillDisplayTitle,
  getBillRelatedNodeName,
} = useManageDetailOrderPaymentBills({
  detailOrder,
  constructionInfo,
  constructionNodeStatus: CONSTRUCTION_NODE_STATUS,
})

const {
  optionalChangeLoading,
  optionalChangeSubmitting,
  optionalChangeRecords,
  showOptionalChangeAuditModal,
  currentOptionalChangeAuditRecord,
  optionalChangePaymentRecordLoading,
  optionalChangePaymentRecordOptions,
  optionalChangeAuditForm,
  visibleOptionalChangeRecords,
  currentOptionalChangeAuditModeOptions,
  currentOptionalChangeAuditModeHint,
  getOptionalChangeStatusTagType,
  formatAdminOptionalChangeSnapshot,
  loadAdminOptionalChangeList,
  setOptionalChangeAuditModalVisible,
  handleOptionalChangeAuditFieldChange,
  closeOptionalChangeAuditModal,
  openOptionalChangeAuditModal,
  submitOptionalChangeAudit,
} = useManageDetailOrderOptionalChange({
  detailOrder,
  currentDispatchOrder,
  canViewPaymentRecordList,
  orderManageStore,
  operatorName,
  message,
  formatCurrencyAmount,
  formatDateTime,
  getErrorMessage,
  loadConstructionStatus: async (...args) => loadConstructionStatus(...args),
})

// ======================= 派单管理功能区域 =======================
const {
  showDispatchModal,
  dispatchTab,
  showMaterialDispatchModal,
  materialDispatchReplacingVendorOrderId,
  showRedispatchModal,
  selectedMaterialVendorOption,
  selectedRedispatchVendorOption,
  depositSubmitting,
  planSubmitting,
  stopDispatchPaymentPolling,
  shouldShowConstructionPricingButton,
  constructionWorkflowStarted,
  constructionPricingButtonText,
  canOpenConstructionPricingEntry,
  canManageMaterialDispatch,
  canStartConstructionEntry,
  canSyncConstructionPricePlan,
  shouldShowConstructionProgressButton,
  handleOpenDispatch,
  handleGoToConstructionPricing,
  handleUpdateConstructionDepositDraft,
  handleSaveConstructionDeposit,
  handleConfirmConstructionPricing,
  handleSyncConstructionPricePlan,
  loadBuilders,
  submitConstructionDispatch,
  materialColumns,
  submitRedispatch,
  submitMaterialDispatch,
  handlePreCancel,
  handleReDispatch,
  submitCancel,
} = useManageDetailOrderDispatch({
  detailOrder,
  canDispatch,
  isDispatchStageLocked,
  activeConstructionOrder,
  allServicesAccepted,
  constructionVendorOptions,
  materialDispatchList,
  materialVendorOptions,
  redispatchVendorOptions,
  materialForm,
  redispatchForm,
  currentTarget,
  currentDispatchOrder,
  currentNodeDetail,
  constructionInfo,
  currentContractUrl,
  hasAdminPaymentBillRows,
  hasConstructionNodeInstances,
  canConfigureConstructionPrice,
  canStartConstruction,
  orderManageStore,
  redispatchSubmitting,
  showCancelModal,
  cancelReason,
  message,
  dialog,
  getErrorMessage,
  h,
  NButton,
  NTag,
  getVendorStatusInfo,
  hasVendorRejectReason,
  showVendorReasonDialog,
  loadAdminOptionalChangeList: (...args) => loadAdminOptionalChangeList(...args),
  loadConstructionStatus: async (...args) => loadConstructionStatus(...args),
  startConstructionProcess: async (...args) => startConstructionProcess(...args),
})

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
.page-container {
  min-height: 100%;
}
</style>
