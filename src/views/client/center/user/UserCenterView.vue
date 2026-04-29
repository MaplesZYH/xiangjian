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
    <n-card title="用户管理">
      <n-space vertical>
        <div class="client-center-header">
          <n-h2>欢迎回来，{{ userName }}</n-h2>
        </div>
        <n-p>您现在是用户身份，可以管理您的个人信息、订单和收藏</n-p>

        <UserProfilePanel
          v-if="activeMenu === 'profile'"
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
          :label-placement="formLabelPlacement"
          @update:user-info-field="handleUserInfoFieldChange"
          @update:selected-profile-region-code="selectedProfileRegionCode = $event"
          @update:profile-address-detail="handleProfileAddressDetailChange"
          @profile-region-update="handleProfileRegionUpdate"
          @refresh="fetchUserInfo"
          @save="saveUserInfo"
        />

        <UserOrderListPanel
          v-else-if="activeMenu === 'orders'"
          :active-order-status-tag="activeOrderStatusTag"
          :order-status-filter-tabs="orderStatusFilterTabs"
          :loading-orders="loadingOrders"
          :visible-order-list="visibleOrderList"
          :pagination="pagination"
          :get-order-product-name="getOrderProductName"
          :get-status-type="getStatusType"
          :format-order-status="formatOrderStatus"
          :get-design-order-payment-status-type="
            getDesignOrderPaymentStatusType
          "
          :format-design-order-payment-status="formatDesignOrderPaymentStatus"
          :can-open-refund-center="canOpenRefundCenter"
          :has-uploaded-contract="hasUploadedContract"
          @update:active-order-status-tag="activeOrderStatusTag = $event"
          @open-payment-statement="openOrderPaymentStatementModal"
          @open-detail="viewOrderDetail($event.row, $event.initialTab)"
          @cancel-order="handleCancelOrder"
          @page-change="handlePageChange"
        />

        <UserDesignOrderListPanel
          v-else-if="activeMenu === 'designOrders'"
          :loading-design-orders="loadingDesignOrders"
          :design-order-list="designOrderList"
          :design-pagination="designPagination"
          :get-design-order-list-main-product-name-text="
            getDesignOrderListMainProductNameText
          "
          :get-design-order-status-type="getDesignOrderStatusType"
          :get-design-order-status-text="getDesignOrderStatusText"
          :get-design-order-payment-status-type="
            getDesignOrderPaymentStatusType
          "
          :format-design-order-payment-status="formatDesignOrderPaymentStatus"
          @refresh="fetchDesignOrders"
          @open-detail="openDesignOrderDetail"
          @page-change="handleDesignPageChange"
        />

        <UserFavoritePanel
          v-else-if="activeMenu === 'favorites'"
          :favorites="favorites"
          :loading-favorites="loadingFavorites"
          :favorite-action-loading="favoriteActionLoading"
          :favorite-pagination="favoritePagination"
          :default-favorite-image="defaultFavoriteImage"
          :format-favorite-style="formatFavoriteStyle"
          :format-favorite-area="formatFavoriteArea"
          @refresh="refreshFavorites"
          @go-to-house-page="goToHousePage"
          @view-detail="viewFavoriteDetail"
          @cancel-favorite="cancelFavorite"
          @page-change="handleFavoritePageChange"
        />

        <UserLogoutPanel
          v-else-if="activeMenu === 'logout'"
          @cancel="activeMenu = 'profile'"
          @logout="logout"
        />
      </n-space>
    </n-card>

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
      :can-open-bill-payment-center="canOpenBillPaymentCenter"
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
      @update:show="showDetailModal = $event"
      @update:detail-tab="detailTab = $event"
      @update:user-option-selection="handleUserOptionSelectionUpdate"
      @reset-user-option-selection-changes="resetUserOptionSelectionChanges"
      @submit-user-option-selection-changes="submitUserOptionSelectionChanges"
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
      @open-refund-modal="openRefundModal"
      @cancel-refund-apply="handleCancelRefundApply"
      @open-refund-detail-modal="openRefundDetailModal"
      @open-bill-payment-tab="openBillPaymentTab"
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
      :get-design-order-payment-status-type="
        getDesignOrderPaymentStatusType
      "
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
      @update:show="showDesignDetailModal = $event"
      @open-payment-modal="openDesignOrderPaymentModal"
      @mark-no-build="handleMarkDesignOrderNoBuild"
      @continue-build="handleContinueBuildFromDesign"
    />

    <UserDesignRepayModal
      :show="showDesignRepayModal"
      :payment-modal-style="paymentModalStyle"
      :design-repay-submitting="designRepaySubmitting"
      :design-repay-amount-text="designRepayAmountText"
      :design-repay-channel="designRepayForm.channel"
      :payment-channel-options="paymentChannelOptions"
      @close="showDesignRepayModal = false"
      @submit="submitDesignOrderRepayment"
      @update:design-repay-channel="designRepayForm.channel = $event"
    />

    <UserPaymentModal
      :show="showPaymentModal"
      :payment-modal-title="paymentModalTitle"
      :payment-modal-style="paymentModalStyle"
      :payment-submitting="paymentSubmitting"
      :payment-target="paymentTarget"
      :payment-channel-options="paymentChannelOptions"
      :payment-channel="paymentForm.channel"
      @close="closePaymentModal"
      @submit="submitPayment"
      @update:payment-channel="paymentForm.channel = $event"
    />

    <UserAuditRejectModal
      :show="showAuditRejectModal"
      :audit-reject-reason="auditRejectReason"
      @close="showAuditRejectModal = false"
      @submit="submitUserAudit(false, auditRejectReason)"
      @update:audit-reject-reason="auditRejectReason = $event"
    />

    <UserWechatPayModal
      :show="showWechatPayModal"
      :payment-modal-style="paymentModalStyle"
      :wechat-pay-url="wechatPayUrl"
      @close="closeWechatPayModal"
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
      :refund-reason="refundForm.reason"
      :format-amount="formatAmount"
      @close="closeRefundModal"
      @submit="submitRefundApply"
      @preset-change="handleRefundReasonPresetChange"
      @update:refund-reason="refundForm.reason = $event"
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
      @close="showRefundDetailModal = false"
    />

    <UserPaymentStatementModal
      :show="showOrderPaymentStatementModal"
      :statement-modal-style="statementModalStyle"
      :order-payment-statement-loading="orderPaymentStatementLoading"
      :order-payment-statement-html="orderPaymentStatementHtml"
      @close="showOrderPaymentStatementModal = false"
    />
  </ClientCenterShell>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useDialog, useMessage, useNotification } from 'naive-ui'
import { useRouter } from 'vue-router'
import orderAPI from '@/api/user/userOrder.js'
import designOrderAPI from '@/api/user/designOrder'
import ConstructionAPI from '@/api/house/construction.js'
import houseAPI from '@/api/house/house'
import { AUTH_SCOPE_USER, getAuthStorage } from '@/utils/auth'
import { getDesignOrderMainProductBinding } from '@/utils/designOrderMainProductStore'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useFavoriteStore } from '@/stores/favorite/useFavoriteStore'
import { useOptionCatalogStore } from '@/stores/option/useOptionCatalogStore'
import { useUserOrderStore } from '@/stores/order/useUserOrderStore'
import { useUserProfileStore } from '@/stores/user/useUserProfileStore'
import {
  ArrowUndoCircleOutline,
  ColorPaletteOutline,
  DocumentTextOutline,
  HeartOutline,
  PersonCircleOutline,
} from '@/icons/ionicons'
import {
  CONSTRUCTION_NODE_STATUS,
  normalizeConstructionFlow,
} from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'
import { useMaxWidth } from '@/composables/useMaxWidth'
import { getOrderPaymentStatus } from '@/utils/orderPayment'
import ClientCenterShell from '@/views/client/center/shared/ClientCenterShell.vue'
import UserDesignOrderDetailModal from '@/views/client/center/user/UserDesignOrderDetailModal.vue'
import UserDesignOrderListPanel from '@/views/client/center/user/UserDesignOrderListPanel.vue'
import UserFavoritePanel from '@/views/client/center/user/UserFavoritePanel.vue'
import UserLogoutPanel from '@/views/client/center/user/UserLogoutPanel.vue'
import UserAuditRejectModal from '@/views/client/center/user/modals/UserAuditRejectModal.vue'
import UserDesignRepayModal from '@/views/client/center/user/modals/UserDesignRepayModal.vue'
import UserPaymentModal from '@/views/client/center/user/modals/UserPaymentModal.vue'
import UserPaymentStatementModal from '@/views/client/center/user/modals/UserPaymentStatementModal.vue'
import UserRefundApplyModal from '@/views/client/center/user/modals/UserRefundApplyModal.vue'
import UserRefundDetailModal from '@/views/client/center/user/modals/UserRefundDetailModal.vue'
import UserWechatPayModal from '@/views/client/center/user/modals/UserWechatPayModal.vue'
import UserOrderDetailModal from '@/views/client/center/user/UserOrderDetailModal.vue'
import UserOrderListPanel from '@/views/client/center/user/UserOrderListPanel.vue'
import UserProfilePanel from '@/views/client/center/user/UserProfilePanel.vue'
import {
  clearPendingOrderNotificationRead,
  usePendingOrderNotification,
} from '@/views/client/center/user/composables/usePendingOrderNotification'
import { useUserFavoritesPanel } from '@/views/client/center/user/composables/useUserFavoritesPanel'
import {
  resolvePaymentPayloadMeta,
  resolveWechatPayUrl,
  tryOpenPaymentPayload,
} from '@/views/client/center/user/userCenterPaymentPayload'

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
    currentDesignOrder.value?.depositAmount ||
      currentDesignOrder.value?.paidAmount ||
      0,
  )
  return Number.isFinite(amount) && amount >= 0
    ? `¥${amount.toLocaleString()}`
    : '¥--'
})

const handleUserInfoFieldChange = ({ key, value }) => {
  if (!key) return
  userInfo.value[key] = value
}

const handleProfileAddressDetailChange = (value) => {
  profileAddressForm.detail = value
}

const handleUserOptionSelectionUpdate = ({ key, value }) => {
  if (!key) return
  userOptionSelectionMap[key] = value
}

// existing logic preserved from UserAdmin.vue
// BEGIN copied logic
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
const { closePendingOrderNotification, maybeShowPendingOrderNotification } =
  usePendingOrderNotification({
    pendingOrderNotificationItems,
    getStoredUserId,
    notification,
    message,
  })
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
  getStoredUserId,
  router,
  message,
})

// The rest of the logic below is copied unchanged from UserAdmin.vue.
// eslint-disable-next-line no-unused-vars
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
  { label: '计划有变，暂不继续', value: '计划有变，暂不继续' },
  { label: '价格原因，申请退款', value: '价格原因，申请退款' },
  { label: '重复支付或误支付', value: '重复支付或误支付' },
  { label: '与平台沟通后申请退款', value: '与平台沟通后申请退款' },
  { label: '施工安排调整，申请退款', value: '施工安排调整，申请退款' },
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

  const typeCount = Number(hasAdd) + Number(hasReplace) + Number(hasRemove)

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
  return selectedRows.length > 0 ? selectedRows.join('；') : '未选择任何选配'
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

const loadUserOptionalChangeRecords = async (orderId = currentOrder.value?.id) => {
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

const sortOptionalChangeRecords = (records = []) =>
  [...records].sort((a, b) => {
    const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
    const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return Number(b?.id || 0) - Number(a?.id || 0)
  })

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
    buildUserOptionSelectionSignature() !== userOptionInitialSelectionSignature.value,
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
  const latestRecordId = resolvePaymentRecordId(
    latestOptionalChangeRefundPaymentRecord.value,
  )
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
  const resolvedDetail =
    latestDetail || (await syncDesignOrderDetailFromServer(designOrderId))
  logDesignOrderPaymentDebug('refresh after payment', {
    designOrderId,
    listPaymentStatus: matchedRow?.paymentStatus,
    detailPaymentStatus: resolvedDetail?.paymentStatus,
    detailDesignStatus: resolvedDetail?.designStatus,
    detailPendingBillId: resolvedDetail?.pendingBillId,
  })

  if (
    currentDesignOrder.value?.id &&
    Number(currentDesignOrder.value.id) === Number(designOrderId)
  ) {
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

  if (
    !orderPaymentTracker.billId &&
    isInitialOrderPaymentDone(latestOrder.paymentStatus)
  ) {
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

    if (
      currentDesignOrder.value?.id &&
      Number(currentDesignOrder.value.id) === Number(designOrderId) &&
      latestDetail
    ) {
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
      paymentTarget.billType === 'STAGE_PAYMENT' &&
      Number(paymentTarget.nodeId || 0) > 0

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
      ? pollingBillId ||
        (await resolveConstructionPaymentBillId(pollingOrderId, pollingNodeId))
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

const canContinueBuildDesignOrder = (order) => Boolean(order?.canConvertToBuild)

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
      if (
        res?.code === 200 &&
        Number.isInteger(detailDeliveredMpId) &&
        detailDeliveredMpId > 0
      ) {
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
      if (
        currentDesignOrder.value?.id &&
        Number(currentDesignOrder.value.id) === Number(trackedRow.id)
      ) {
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
      const mainProductId = resolveDesignOrderMainProductId(
        currentDesignOrder.value,
      )
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
    const latestDetail = await syncDesignOrderDetailFromServer(
      currentDesignOrder.value.id,
    )
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
      opened ? '已发起设计定金支付，请在新窗口完成付款' : '设计定金支付请求已发起',
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
    flow.currentNodeIndex < flow.nodeDetails.length ? flow.currentNodeIndex : 0
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
  return isConstructionFlowCompleted(flow) ? flow.nodeDetails.length : flow.currentNodeIndex
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

const isPendingUserAudit = computed(() => {
  if (!constructionInfo.value || !constructionInfo.value.nodeDetails) return false
  if (
    Number(constructionInfo.value.currentNodeStatus) !==
    CONSTRUCTION_NODE_STATUS.WAIT_USER_AUDIT
  ) {
    return false
  }

  const activeNodeId =
    constructionInfo.value.nodeDetails[constructionInfo.value.currentNodeIndex]?.nodeId
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
  if (currentConstructionPayableBill.value && !currentConstructionPayableBill.value.id) {
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

const submitUserAudit = async (pass, reason = '') => {
  const userIdStr = getStoredUserId()
  if (!userIdStr || !currentOrder.value?.id || !currentNodeDetail.value?.nodeId) return
  const userId = Number(userIdStr)

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

  const depositDescription = paymentStatus > 0 ? '已完成首笔定金支付' : '待支付首笔定金'
  const contractDescription = contractUploaded ? '后台已上传合同' : '等待后台上传合同'

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
      loopDescription = constructionInfo.value?.currentNodeStatusText || '施工进行中'
    }
  } else if (orderStatus >= 4) {
    loopDescription = '全部节点已结束'
  }

  return [
    { key: 'submit', title: '用户下单', description: '主体产品 + 选配产品' },
    { key: 'deposit', title: '支付定金', description: depositDescription },
    { key: 'contract', title: '上传合同', description: contractDescription },
    { key: 'dispatch', title: '派单接单', description: dispatchDescription },
    { key: 'pricing', title: '确认开工金额方案', description: pricingDescription },
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
  () => [
    getStoredUserId(),
    pendingOrderNotificationItems.value
      .map((item) => `${item.key}:${item.badgeCount}`)
      .join('|'),
  ],
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
