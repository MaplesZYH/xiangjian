<template>
  <ClientCenterShell
    menu-title="服务商中心"
    :menu-items="mobileMenuItems"
    :active-menu="activeMenu"
    :is-compact-viewport="isCompactViewport"
    :mobile-columns="3"
    @update:active-menu="activeMenu = $event"
  >
    <n-card title="服务商管理">
      <ProviderCompanyPanel
        v-if="activeMenu === 'company'"
        :is-compact-viewport="isCompactViewport"
        :loading="loading"
        :vendor-info="vendorInfo"
        :can-edit-vendor-info="canEditVendorInfo"
        :get-service-type-tag="getServiceTypeTag"
        :get-service-type-text="getServiceTypeText"
        :get-material-tag-style="getMaterialTagStyle"
        @edit="handleEdit"
      />

      <ProviderOrderListPanel
        v-else-if="activeMenu === 'orders'"
        :order-status-tab="orderStatusTab"
        :unreplied-order-count="unrepliedOrderCount"
        :accepted-need-handle-count="acceptedNeedHandleCount"
        :orders-loading="ordersLoading"
        :order-list="orderList"
        :sorted-order-list="sortedOrderList"
        :pagination="pagination"
        :is-need-handle-construction-status="isNeedHandleConstructionStatus"
        :can-cancel-vendor-order="canCancelVendorOrder"
        @update:order-status-tab="handleOrderTabChange"
        @accept="handleAcceptConfirm"
        @reject="handleRejectConfirm"
        @cancel="handleCancelOrder"
        @open-detail="openOrderDetail"
        @page-change="handlePageChange"
      />

      <ProviderLogoutPanel
        v-else-if="activeMenu === 'logout'"
        @cancel="activeMenu = 'company'"
        @logout="logout"
      />
    </n-card>

    <ProviderEditModal
      ref="editModalRef"
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
      @update:show="showEditModal = $event"
      @update:selected-company-region-code="selectedCompanyRegionCode = $event"
      @update:field="handleEditFormFieldChange"
      @update:company-address-detail="handleCompanyAddressDetailChange"
      @upload-certificate="handleUploadRequest"
      @remove-certificate="handleRemoveFileRequest"
      @company-region-update="handleCompanyRegionUpdate"
      @submit="submitEdit"
    />

    <ProviderActionNoteModal
      :show="showNoteModal"
      :title="noteModalTitle"
      :positive-text="noteModalActionText"
      :placeholder="noteModalPlaceholder"
      :note="actionNote"
      @update:show="showNoteModal = $event"
      @update:note="actionNote = $event"
      @submit="submitOrderAction"
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
      @update:show="showOrderModal = $event"
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
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import {
  useDialog,
  useMessage,
  useNotification,
  NAvatar,
  NButton,
  NIcon,
} from 'naive-ui'
import VendorOrderAPI from '@/api/service/vendorOrder'
import ConstructionAPI from '@/api/house/construction'
import {
  AUTH_SCOPE_PROVIDER,
  getAuthStorage,
} from '@/utils/auth'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useVendorOrderStore } from '@/stores/order/useVendorOrderStore'
import { useVendorProfileStore } from '@/stores/vendor/useVendorProfileStore'
import {
  ArrowUndoCircleOutline,
  DocumentTextOutline,
  HomeOutline,
} from '@/icons/ionicons'
import {
  CONSTRUCTION_NODE_STATUS,
} from '@/utils/construction'
import { useMaxWidth } from '@/composables/useMaxWidth'
import ClientCenterShell from '@/views/client/center/shared/ClientCenterShell.vue'
import ProviderActionNoteModal from '@/views/client/center/provider/ProviderActionNoteModal.vue'
import ProviderCompanyPanel from '@/views/client/center/provider/ProviderCompanyPanel.vue'
import ProviderEditModal from '@/views/client/center/provider/ProviderEditModal.vue'
import ProviderLogoutPanel from '@/views/client/center/provider/ProviderLogoutPanel.vue'
import ProviderOrderDetailModal from '@/views/client/center/provider/ProviderOrderDetailModal.vue'
import ProviderOrderListPanel from '@/views/client/center/provider/ProviderOrderListPanel.vue'

const router = useRouter()
const message = useMessage()
const notification = useNotification()
const authStore = useAuthStore()
const vendorOrderStore = useVendorOrderStore()
const vendorProfileStore = useVendorProfileStore()
const dialog = useDialog()
const emit = defineEmits(['updateName'])

const {
  orderList,
  ordersLoading,
  orderStatusTab,
  unrepliedOrderCount,
  acceptedNeedHandleCount,
  acceptedActiveOrderCount,
  sortedOrderList,
  orderDetailLoading,
  currentOrderDetail,
  constructionStatus,
  currentNodeDetail,
} = storeToRefs(vendorOrderStore)
const {
  loading,
  vendorInfo,
  categoryOptions,
  uploadedFiles,
  certificateChanged,
  submitting,
  selectedCompanyRegionCode,
  companyAddressPreview,
  canEditVendorInfo,
  editTipText,
} = storeToRefs(vendorProfileStore)

const pagination = vendorOrderStore.pagination
const editForm = vendorProfileStore.editForm
const serviceTypeOptions = vendorProfileStore.serviceTypeOptions
const companyAddressForm = vendorProfileStore.companyAddressForm
const companyRegionCascaderOptions =
  vendorProfileStore.companyRegionCascaderOptions

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

const isDispatchStageLockedForVendor = (row) =>
  Number(row?.type) === 1 &&
  Boolean(String(row?.constructionStatusText || '').trim())

const canCancelVendorOrder = (row) =>
  Number(row?.orderStatus) === 1 && !isDispatchStageLockedForVendor(row)

const activeMenu = ref('company')
const uploadNodeDescription = ref('')
const uploadNodeFileList = ref([])
const uploadNodePreviewUrlMap = ref({})
const nodeUploadSubmitting = ref(false)
const editModalRef = ref(null)
const isCompactViewport = useMaxWidth(768)
const descriptionsLabelPlacement = computed(() =>
  isCompactViewport.value ? 'top' : 'left',
)
const detailDescriptionsColumns = computed(() =>
  isCompactViewport.value ? 1 : 2,
)
const constructionGridCols = computed(() => (isCompactViewport.value ? 1 : 3))
const requiresPasswordOnEdit = computed(
  () => Number(vendorInfo.value?.status) !== 1,
)
const canChangeServiceType = computed(
  () => Number(acceptedActiveOrderCount.value || 0) === 0,
)
const serviceTypeLockReason = computed(
  () => '当前存在已接单且正在处理的订单，暂不能修改服务类型。',
)
const editModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 800px)',
}))
const orderModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 1000px)',
  minHeight: isCompactViewport.value ? 'auto' : '600px',
}))
const getProviderId = () => getAuthStorage(AUTH_SCOPE_PROVIDER, 'id')
const pendingOrderNotificationRef = ref(null)
const pendingOrderNotificationSignature = ref('')

const getPendingOrderNotificationSessionKey = (vendorId) =>
  `provider-pending-order-notification-read:${vendorId}`

const getPendingOrderNotificationSignature = () => {
  const accepted = Number(acceptedNeedHandleCount.value || 0)
  const unreplied = Number(unrepliedOrderCount.value || 0)
  return `${accepted}:${unreplied}`
}

const readPendingOrderNotification = (vendorId) => {
  if (typeof window === 'undefined' || !vendorId) return ''
  return (
    window.sessionStorage.getItem(
      getPendingOrderNotificationSessionKey(vendorId),
    ) || ''
  )
}

const markPendingOrderNotificationRead = (vendorId, signature) => {
  if (typeof window === 'undefined' || !vendorId) return
  window.sessionStorage.setItem(
    getPendingOrderNotificationSessionKey(vendorId),
    signature,
  )
}

const clearPendingOrderNotificationRead = (vendorId) => {
  if (typeof window === 'undefined' || !vendorId) return
  window.sessionStorage.removeItem(
    getPendingOrderNotificationSessionKey(vendorId),
  )
}

const closePendingOrderNotification = () => {
  pendingOrderNotificationRef.value?.destroy()
  pendingOrderNotificationRef.value = null
  pendingOrderNotificationSignature.value = ''
}

const maybeShowPendingOrderNotification = () => {
  const vendorId = vendorInfo.value?.id || getProviderId()
  if (!vendorId) return

  const accepted = Number(acceptedNeedHandleCount.value || 0)
  const unreplied = Number(unrepliedOrderCount.value || 0)
  const total = accepted + unreplied

  if (total <= 0) {
    clearPendingOrderNotificationRead(vendorId)
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

  if (readPendingOrderNotification(vendorId) === signature) {
    return
  }

  closePendingOrderNotification()

  let markAsRead = false
  const metaText = [
    accepted > 0 ? `已接受待处理 ${accepted}` : '',
    unreplied > 0 ? `未回复 ${unreplied}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const notificationReactive = notification.create({
    title: '订单待处理提醒',
    description: '订单管理中存在需要尽快处理的内容',
    content: `当前共有 ${total} 条待处理提醒，请及时进入订单管理查看并处理。`,
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
            markPendingOrderNotificationRead(vendorId, signature)
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

const mobileMenuItems = [
  {
    label: '企业信息',
    description: '资料与资质',
    key: 'company',
    icon: HomeOutline,
  },
  {
    label: '订单管理',
    description: '订单与进度',
    key: 'orders',
    icon: DocumentTextOutline,
  },
  {
    label: '退出登录',
    description: '安全退出',
    key: 'logout',
    icon: ArrowUndoCircleOutline,
  },
]

const showEditModal = ref(false)

const syncVendorDisplayName = (info) => {
  const companyName = info?.companyName || info?.username || ''
  if (!companyName) return
  authStore.patchScopeProfile(AUTH_SCOPE_PROVIDER, {
    name: companyName,
    vendorInfo: {
      ...(authStore.currentClientState?.info || {}),
      ...info,
      vendorId: info?.vendorId ?? info?.id ?? getProviderId(),
    },
  })
  emit('updateName', companyName)
}

const handleCompanyRegionUpdate = (value, option, path) =>
  vendorProfileStore.handleCompanyRegionUpdate(value, option, path)

const handleEditFormFieldChange = ({ key, value }) => {
  if (!key) return
  editForm[key] = value
}

const handleCompanyAddressDetailChange = (value) => {
  companyAddressForm.detail = value
}

const passwordRules = [
  { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
  {
    min: 8,
    max: 20,
    message: '密码长度必须在 8-20 位之间',
    trigger: ['blur', 'input'],
  },
  {
    pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/,
    message: '密码必须包含字母、数字和特殊字符',
    trigger: ['blur', 'input'],
  },
]

const formRules = computed(() => ({
  companyName: { required: true, message: '请输入公司名称', trigger: 'blur' },
  ...(requiresPasswordOnEdit.value ? { password: passwordRules } : {}),
}))

const fetchVendorInfo = async () => {
  const userId = getProviderId()
  if (!userId) {
    message.error('未检测到登录信息')
    router.push('/login')
    return
  }

  try {
    const res = await vendorProfileStore.fetchVendorInfo(userId)
    if (res.code === 200 && res.data) {
      syncVendorDisplayName(res.data)
      if (activeMenu.value === 'orders') {
        await refreshVendorOrders()
      } else {
        await vendorOrderStore.refreshOrderSummary(res.data.id)
      }
    }
  } catch {
    message.error('网络异常，无法获取企业信息')
  }
}

const handleEdit = async () => {
  try {
    await vendorProfileStore.prepareEditForm()
    showEditModal.value = true
  } catch {
    message.error('加载编辑信息失败')
  }
}

const handleUploadRequest = async ({ file, onFinish, onError }) => {
  try {
    message.loading('文件上传中...')
    const res = await vendorProfileStore.uploadCertificate(file.file)
    message.destroyAll()
    if (res.code === 200 && res.data) {
      message.success('上传成功')
      onFinish()
    } else {
      message.error(res.msg || '上传失败')
      onError()
    }
  } catch {
    message.destroyAll()
    message.error('上传出错')
    onError()
  }
}

const removeFile = async (file, index) => {
  if (file.id) {
    dialog.warning({
      title: '确认删除',
      content: '该文件已归档，确认要从服务器删除吗？',
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const res = await vendorProfileStore.deleteCertificate(file, index)
          if (res.code === 200) {
            message.success('删除成功')
          } else {
            message.error(res.msg || '删除失败')
          }
        } catch {
          message.error('删除请求异常')
        }
      },
    })
    return
  }

  await vendorProfileStore.deleteCertificate(file, index)
}

const handleRemoveFileRequest = async ({ file, index }) => {
  await removeFile(file, index)
}

const submitEdit = async () => {
  try {
    await editModalRef.value?.validate()
  } catch {
    return
  }

  const validationError = vendorProfileStore.getEditValidationError()
  if (validationError) {
    message.warning(validationError)
    return
  }

  try {
    const currentStatus = Number(vendorInfo.value.status)
    const hadCertificateChanged = certificateChanged.value
    const hadServiceTypeChanged =
      Number(editForm.serviceType) !== Number(vendorInfo.value.serviceType)
    if (hadServiceTypeChanged) {
      const vendorId = vendorInfo.value?.id || getProviderId()
      if (vendorId) {
        await vendorOrderStore.refreshOrderSummary(vendorId)
      }
      if (!canChangeServiceType.value) {
        message.warning(serviceTypeLockReason.value)
        return
      }
    }
    const res = await vendorProfileStore.submitEdit()
    if (res.code === 200) {
      message.success(
        currentStatus === 1 &&
          !hadCertificateChanged &&
          !hadServiceTypeChanged
          ? '企业信息修改成功'
          : '修改提交成功，请等待重新审核',
      )
      showEditModal.value = false
      await fetchVendorInfo()
    } else {
      message.error(res.msg || '提交失败')
    }
  } catch (error) {
    message.error(getErrorMessage(error, '提交请求异常'))
  }
}

const currentOrderId = ref(null)
const showNoteModal = ref(false)
const noteModalTitle = ref('')
const noteModalActionText = ref('')
const noteModalPlaceholder = ref('')
const actionNote = ref('')
const resolveNodeStatusCode = (statusCode, node) =>
  vendorOrderStore.resolveNodeStatusCode(statusCode, node)
const resolveNodeStatusText = (statusCode, statusText, node) =>
  vendorOrderStore.resolveNodeStatusText(statusCode, statusText, node)
const getFlowCurrentNode = (flow) => vendorOrderStore.getFlowCurrentNode(flow)
const getFlowCurrentNodeStatusText = (flow) =>
  vendorOrderStore.getFlowCurrentNodeStatusText(flow)
const isNeedHandleConstructionStatus = (statusText) =>
  vendorOrderStore.isNeedHandleConstructionStatus(statusText)

const fetchOrders = async () => {
  const vendorId = vendorInfo.value.id
  if (!vendorId) return

  try {
    await vendorOrderStore.fetchOrders(vendorId)
  } catch (error) {
    message.error(getErrorMessage(error, '获取订单列表失败'))
  }
}

const refreshVendorOrders = async () => {
  const vendorId = vendorInfo.value.id
  if (!vendorId) return
  await fetchOrders()
  await vendorOrderStore.refreshOrderSummary(vendorId, {
    currentStatus: Number(orderStatusTab.value),
  })
}

const handleOrderTabChange = (value) => {
  orderStatusTab.value = String(value)
  pagination.page = 1
  refreshVendorOrders()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchOrders()
}

watch(activeMenu, (menu) => {
  if (menu === 'orders') {
    pagination.page = 1
    refreshVendorOrders()
  }
})

const handleAcceptConfirm = (row) => {
  dialog.success({
    title: '确认接单',
    content: '确定接下该订单吗？系统不会再提示备注。',
    positiveText: '确认接单',
    negativeText: '再想想',
    onPositiveClick: async () => {
      try {
        const res = await VendorOrderAPI.getManageOrderAccept(row.id, {
          vendorNotes: '',
        })
        if (res.code === 200) {
          message.success('接单成功')
          row.orderStatus = 1
          await refreshVendorOrders()
        } else {
          message.error(res.msg || '接单失败')
        }
      } catch {
        message.error('接单请求异常')
      }
    },
  })
}

const handleRejectConfirm = (row) => {
  currentOrderId.value = row.id
  noteModalTitle.value = '确认拒单'
  noteModalActionText.value = '确认拒单'
  noteModalPlaceholder.value = '请输入拒单理由（建议填写）'
  actionNote.value = ''
  showNoteModal.value = true
}

const submitOrderAction = async () => {
  try {
    const res = await VendorOrderAPI.getManageOrderReject(currentOrderId.value, {
      vendorNotes: actionNote.value,
    })
    if (res.code === 200) {
      message.success('操作成功')
      showNoteModal.value = false
      refreshVendorOrders()
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch {
    message.error('网络请求异常')
  }
}

const handleCancelOrder = (row) => {
  if (isDispatchStageLockedForVendor(row)) {
    message.warning('订单已进入施工阶段，当前派单已锁定，不能取消')
    return
  }

  dialog.warning({
    title: '取消订单',
    content: '确定要取消这个正在进行中的订单吗？此操作不可逆。',
    positiveText: '确定取消',
    negativeText: '暂不取消',
    onPositiveClick: async () => {
      try {
        const res = await VendorOrderAPI.getManageOrderCancel(row.id, {
          vendorNotes: '',
        })
        if (res.code === 200) {
          message.success('订单已取消')
          row.orderStatus = 4
          await refreshVendorOrders()
        } else {
          message.error(res.msg || '取消失败')
        }
      } catch {
        message.error('请求异常')
      }
    },
  })
}

const showOrderModal = ref(false)

const activeConstructionNodeId = computed(() => {
  if (!constructionStatus.value?.nodeDetails?.length) return null
  return (
    constructionStatus.value.nodeDetails[constructionStatus.value.currentNodeIndex]
      ?.nodeId || null
  )
})

const currentNodeStatusCode = computed(() => {
  if (isViewingActiveNode.value) {
    return resolveNodeStatusCode(
      constructionStatus.value?.currentNodeStatus,
      currentNodeDetail.value || getFlowCurrentNode(constructionStatus.value),
    )
  }
  return resolveNodeStatusCode(
    currentNodeDetail.value?.status,
    currentNodeDetail.value,
  )
})

const isViewingActiveNode = computed(() => {
  if (!currentNodeDetail.value?.nodeId || !activeConstructionNodeId.value) {
    return false
  }
  return (
    Number(currentNodeDetail.value.nodeId) ===
    Number(activeConstructionNodeId.value)
  )
})

const currentNodeStatusText = computed(() => {
  if (isViewingActiveNode.value) {
    return resolveNodeStatusText(
      constructionStatus.value?.currentNodeStatus,
      constructionStatus.value?.currentNodeStatusText ||
        currentNodeDetail.value?.statusText,
      currentNodeDetail.value || getFlowCurrentNode(constructionStatus.value),
    )
  }

  return resolveNodeStatusText(
    currentNodeDetail.value?.status,
    currentNodeDetail.value?.statusText,
    currentNodeDetail.value,
  )
})

const canUploadCurrentNode = computed(() => {
  if (!isViewingActiveNode.value) return false
  return [
    CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD,
    CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT,
    CONSTRUCTION_NODE_STATUS.AUDIT_REJECTED,
  ].includes(currentNodeStatusCode.value)
})

const canDeleteCurrentNodePhoto = computed(() => {
  if (!isViewingActiveNode.value) return false
  return [
    CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD,
    CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT,
    CONSTRUCTION_NODE_STATUS.AUDIT_REJECTED,
  ].includes(currentNodeStatusCode.value)
})

const uploadNodeTipText = computed(() => {
  if (!currentNodeDetail.value) {
    return '请先选择当前施工节点，再上传现场施工照片（支持 JPG/PNG）'
  }

  if (!isViewingActiveNode.value) {
    return '仅当前施工阶段可上传照片，请选择正在进行中的节点'
  }

  if (canUploadCurrentNode.value) {
    if (
      currentNodeStatusCode.value ===
      CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT
    ) {
      return '当前节点已提交待审核，如需替换图片或补充说明，可删除原记录后重新提交'
    }
    return '请先选择施工阶段图片进行预览，再选填情况描述，最后统一提交'
  }

  return `当前节点状态为“${currentNodeStatusText.value}”，暂不可继续上传`
})

const openOrderDetail = async (row) => {
  showOrderModal.value = true

  try {
    const res = await vendorOrderStore.openOrderDetail(row.id)
    if (res?.code !== 200) {
      message.error(res?.msg || '获取详情失败')
    }
  } catch {
    message.error('获取详情失败')
  }
}

const loadConstructionFlow = async (userOrderId, options = {}) => {
  try {
    await vendorOrderStore.loadConstructionFlow(userOrderId, options)
  } catch {
    // ignore detail refresh failure here and keep current modal state
  }
}

const handleNodeClick = async (node) => {
  if (!currentOrderDetail.value) {
    message.error('订单详情未加载')
    return
  }

  const userOrderId = currentOrderDetail.value.orderId
  try {
    const res = await vendorOrderStore.loadNodeDetail(userOrderId, node)
    if (res?.code !== 200) {
      message.error(res?.msg || '加载节点详情失败')
    }
  } catch {
    message.error('加载节点详情失败')
  }
}

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

const getNodeStatus = (index, currentIndex, flow = constructionStatus.value) => {
  if (isConstructionFlowCompleted(flow)) return 'finish'
  if (index === currentIndex) return 'process'
  if (index < currentIndex) return 'finish'
  return 'wait'
}

const getNodeStatusDesc = (
  index,
  currentIndex,
  flow = constructionStatus.value,
) => {
  if (isConstructionFlowCompleted(flow)) return '已完成'
  if (index === currentIndex) return '进行中'
  if (index < currentIndex) return '已完成'
  return '待开始'
}

const formatChineseDate = (value) => {
  if (!value) return '暂无'
  const datePart = String(value).split('T')[0]
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${year}年${month}月${day}日`
}

const getOrderStatusText = (status) => {
  const map = {
    0: '已拒接',
    1: '已接受',
    2: '已完成',
    3: '未回复',
    4: '已取消',
  }
  return map[status] || '未知'
}

const resetNodeUploadForm = () => {
  uploadNodeDescription.value = ''
  uploadNodeFileList.value = []
}

const syncUploadNodePreviewUrls = () => {
  const nextMap = {}

  uploadNodeFileList.value.forEach((item) => {
    const fileId = String(item?.id || '')
    if (!fileId) return

    const resolvedUrl = item.thumbnailUrl || item.url
    if (resolvedUrl) {
      const previous = uploadNodePreviewUrlMap.value[fileId]
      if (previous?.isObjectUrl) {
        URL.revokeObjectURL(previous.url)
      }
      nextMap[fileId] = {
        url: resolvedUrl,
        isObjectUrl: false,
      }
      return
    }

    if (item.file instanceof File) {
      const previous = uploadNodePreviewUrlMap.value[fileId]
      nextMap[fileId] =
        previous || {
          url: URL.createObjectURL(item.file),
          isObjectUrl: true,
        }
    }
  })

  Object.entries(uploadNodePreviewUrlMap.value).forEach(([fileId, entry]) => {
    if (!nextMap[fileId] && entry?.isObjectUrl) {
      URL.revokeObjectURL(entry.url)
    }
  })

  uploadNodePreviewUrlMap.value = nextMap
}

const getUploadNodePreviewUrl = (file) =>
  uploadNodePreviewUrlMap.value[String(file?.id || '')]?.url || ''

const removeUploadNodeFile = (fileId) => {
  uploadNodeFileList.value = uploadNodeFileList.value.filter(
    (item) => String(item?.id || '') !== String(fileId),
  )
}

const submitNodeUpload = async () => {
  if (!currentNodeDetail.value || !vendorInfo.value.id) return
  if (!canUploadCurrentNode.value) {
    message.warning(uploadNodeTipText.value)
    return
  }

  const files = uploadNodeFileList.value
    .map((item) => item.file)
    .filter((file) => file instanceof File)

  if (files.length === 0) {
    message.warning('请先选择至少一张施工图片')
    return
  }

  const params = {
    orderId: currentOrderDetail.value.orderId,
    nodeId: currentNodeDetail.value.nodeId,
    vendorId: vendorInfo.value.id,
    description: String(uploadNodeDescription.value || '').trim(),
    files,
  }

  nodeUploadSubmitting.value = true
  try {
    const res = await ConstructionAPI.uploadNodePhoto(params)
    if (res.code === 200) {
      message.success('上传成功')
      resetNodeUploadForm()
      vendorOrderStore.invalidateConstructionFlowCache(
        currentOrderDetail.value.orderId,
      )
      await loadConstructionFlow(currentOrderDetail.value.orderId)
      await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
      await refreshVendorOrders()
    } else {
      message.error(res.msg || '上传失败')
    }
  } catch {
    message.error('上传异常')
  } finally {
    nodeUploadSubmitting.value = false
  }
}

const handleDeletePhoto = (imageId) => {
  if (!canDeleteCurrentNodePhoto.value) {
    message.warning('当前节点状态下不允许删除施工照片')
    return
  }

  dialog.warning({
    title: '删除照片',
    content: '确定要删除这张施工照片吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const orderId = currentOrderDetail.value.orderId
        const vendorId = vendorInfo.value.id
        const nodeId = currentNodeDetail.value.nodeId
        const res = await ConstructionAPI.deleteNodePhoto(
          orderId,
          vendorId,
          nodeId,
          imageId,
        )
        if (res.code === 200) {
          message.success('删除成功')
          vendorOrderStore.invalidateConstructionFlowCache(orderId)
          await loadConstructionFlow(orderId)
          await handleNodeClick({ nodeId })
          await refreshVendorOrders()
        } else {
          message.error(res.msg || '删除失败')
        }
      } catch {
        message.error('删除请求异常')
      }
    },
  })
}

const getServiceTypeText = (type) => {
  const map = { 1: '建造商', 2: '材料商', 3: '综合服务商' }
  return map[type] || '未知'
}

const getServiceTypeTag = (type) => {
  return type === 3 ? 'success' : 'info'
}

const materialTagPalette = [
  { color: '#fff7ed', text: '#c2410c' },
  { color: '#eff6ff', text: '#1d4ed8' },
  { color: '#ecfdf5', text: '#047857' },
  { color: '#fdf2f8', text: '#be185d' },
  { color: '#f5f3ff', text: '#6d28d9' },
  { color: '#effcf6', text: '#0f766e' },
]

const getMaterialTagStyle = (index) => {
  const palette = materialTagPalette[index % materialTagPalette.length]
  return {
    '--n-color': palette.color,
    '--n-color-hover': palette.color,
    '--n-color-pressed': palette.color,
    '--n-text-color': palette.text,
    '--n-border': `1px solid ${palette.text}22`,
    '--n-border-hover': `1px solid ${palette.text}22`,
    '--n-border-pressed': `1px solid ${palette.text}22`,
  }
}

const logout = () => {
  clearPendingOrderNotificationRead(getProviderId())
  closePendingOrderNotification()
  vendorOrderStore.clearOrderState()
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

onMounted(() => {
  authStore.setActiveScope(AUTH_SCOPE_PROVIDER)
  fetchVendorInfo()
})

onBeforeUnmount(() => {
  Object.values(uploadNodePreviewUrlMap.value).forEach((entry) => {
    if (entry?.isObjectUrl) {
      URL.revokeObjectURL(entry.url)
    }
  })
  closePendingOrderNotification()
})

watch(
  () => currentNodeDetail.value?.nodeId,
  () => {
    resetNodeUploadForm()
  },
)

watch(
  uploadNodeFileList,
  () => {
    syncUploadNodePreviewUrls()
  },
  { deep: true },
)

watch(
  () => showOrderModal.value,
  (show) => {
    if (!show) {
      resetNodeUploadForm()
    }
  },
)

watch(
  () => [
    vendorInfo.value?.id,
    acceptedNeedHandleCount.value,
    unrepliedOrderCount.value,
  ],
  () => {
    maybeShowPendingOrderNotification()
  },
  { flush: 'post' },
)
</script>
