<template>
  <div class="financial-page">
    <n-empty
      v-if="!hasPaymentListPermission && !hasRefundListPermission"
      description="当前账号暂无财务管理权限"
    />

    <n-tabs
      v-else
      :value="activeTab"
      type="segment"
      animated
      class="financial-tabs"
      @update:value="handleTabChangeWithState"
    >
      <n-tab-pane
        v-if="hasPaymentListPermission"
        name="payment"
        tab="支付流水管理"
      >
        <FinancialPaymentTab
          :keyword="paymentFilters.keyword"
          :loading="paymentLoading"
          :records="paymentRecordList"
          :page-info="paymentPageInfo"
          :has-payment-view-permission="hasPaymentViewPermission"
          :get-payment-stage-text="getPaymentStageText"
          :get-payment-channel-type="getPaymentChannelType"
          :get-payment-channel-text="getPaymentChannelText"
          :format-money="formatMoney"
          :format-date-time="formatDateTime"
          @update:keyword="handlePaymentKeywordChange"
          @search="handlePaymentSearch"
          @open-deposit-setting="openDepositSettingModal"
          @open-payment-statement="openPaymentStatementModal"
          @open-detail="openPaymentDetailModal"
          @page-change="handlePaymentPageChange"
        />
      </n-tab-pane>

      <n-tab-pane v-if="hasRefundListPermission" name="refund" tab="退款管理">
        <FinancialRefundTab
          :order-number="refundFilters.orderNumber"
          :status="refundFilters.status"
          :refund-status-options="refundStatusOptions"
          :loading="refundLoading"
          :records="refundList"
          :page-info="refundPageInfo"
          :has-refund-view-permission="hasRefundViewPermission"
          :has-refund-audit-permission="hasRefundAuditPermission"
          :get-refund-status-type="getRefundStatusType"
          :get-refund-status-text="getRefundStatusText"
          :format-money="formatMoney"
          :format-date-time="formatDateTime"
          @update:order-number="handleRefundOrderNumberChange"
          @update:status="handleRefundStatusChange"
          @search="handleRefundSearch"
          @open-detail="openRefundDetailModal"
          @open-audit="openAuditModal"
          @sync-status="syncRefundStatus"
          @page-change="handleRefundPageChange"
        />
      </n-tab-pane>
    </n-tabs>

    <FinancialPaymentStatementModal
      :show="showPaymentStatementModal"
      :loading="paymentStatementLoading"
      :saving="paymentStatementSaving"
      :draft="paymentStatementDraft"
      :editor-ref="paymentStatementEditorRef"
      :toolbar-config="paymentStatementToolbarConfig"
      :editor-config="paymentStatementEditorConfig"
      :has-update-permission="hasPaymentStatementUpdatePermission"
      @update:show="handlePaymentStatementModalShowChange"
      @update:draft="handlePaymentStatementDraftChange"
      @editor-created="handlePaymentStatementEditorCreated"
      @restore-current="restorePaymentStatementFromCurrent"
      @cancel="closePaymentStatementModal"
      @save="savePaymentStatement"
    />

    <FinancialDepositSettingModal
      :show="showDepositSettingModal"
      :loading="depositSettingLoading"
      :saving="depositSettingSaving"
      :draft-amount="designDepositDraft"
      :saved-amount="designDepositSavedAmount"
      :format-money="formatMoney"
      @update:show="handleDepositSettingModalShowChange"
      @update:draft-amount="handleDesignDepositDraftChange"
      @reload="reloadDefaultDepositAmount"
      @cancel="closeDepositSettingModal"
      @save="saveDesignDepositDraft"
    />

    <FinancialRefundDetailModal
      :show="showRefundDetailModal"
      :loading="refundDetailLoading"
      :detail="refundDetail"
      :get-refund-status-type="getRefundStatusType"
      :get-refund-status-text="getRefundStatusText"
      :format-money="formatMoney"
      :format-date-time="formatDateTime"
      :get-refund-audit-operator-phone="getRefundAuditOperatorPhone"
      @update:show="handleRefundDetailModalShowChange"
    />

    <FinancialPaymentDetailModal
      :show="showPaymentDetailModal"
      :loading="paymentDetailLoading"
      :detail="paymentDetail"
      :get-payment-stage-text="getPaymentStageText"
      :get-payment-channel-text="getPaymentChannelText"
      :format-money="formatMoney"
      :format-date-time="formatDateTime"
      @update:show="handlePaymentDetailModalShowChange"
    />

    <FinancialRefundAuditModal
      :show="showAuditModal"
      :submitting="auditSubmitting"
      :form="auditForm"
      @update:show="handleAuditModalShowChange"
      @update:field="handleAuditFormFieldChange"
      @cancel="closeAuditModal"
      @submit="submitAudit"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import '@wangeditor/editor/dist/css/style.css'
import orderAPI from '@/api/user/userOrder'
import { usePaymentStore } from '@/stores/payment/usePaymentStore'
import {
  AUTH_SCOPE_EMPLOYEE,
  getAuthStorage,
  getToken,
  resolveClientScope,
} from '@/utils/auth'
import FinancialDepositSettingModal from '@/views/admin/financial/FinancialDepositSettingModal.vue'
import FinancialPaymentDetailModal from '@/views/admin/financial/FinancialPaymentDetailModal.vue'
import FinancialPaymentStatementModal from '@/views/admin/financial/FinancialPaymentStatementModal.vue'
import FinancialPaymentTab from '@/views/admin/financial/FinancialPaymentTab.vue'
import FinancialRefundAuditModal from '@/views/admin/financial/FinancialRefundAuditModal.vue'
import FinancialRefundDetailModal from '@/views/admin/financial/FinancialRefundDetailModal.vue'
import FinancialRefundTab from '@/views/admin/financial/FinancialRefundTab.vue'

const message = useMessage()
const paymentStore = usePaymentStore()
const {
  paymentLoading,
  paymentRecordList,
  refundLoading,
  refundList,
} = storeToRefs(paymentStore)
const paymentPageInfo = paymentStore.paymentPageInfo
const paymentFilters = paymentStore.paymentFilters
const refundPageInfo = paymentStore.refundPageInfo
const refundFilters = paymentStore.refundFilters

const employeePermissions = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem('employeePermissions') || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
})()

const hasRefundListPermission = computed(() =>
  employeePermissions.includes('refund:list'),
)
const hasRefundViewPermission = computed(() =>
  employeePermissions.includes('refund:view'),
)
const hasRefundAuditPermission = computed(() =>
  employeePermissions.includes('refund:audit'),
)
const hasPaymentListPermission = computed(() =>
  employeePermissions.includes('payment:list'),
)
const hasPaymentViewPermission = computed(() =>
  employeePermissions.includes('payment:view'),
)
const hasPaymentStatementUpdatePermission = computed(() =>
  employeePermissions.includes('order:update:statement') ||
  employeePermissions.includes('order:update'),
)

const resolveReadableClientScope = () => {
  const scope = resolveClientScope()
  if (!scope) return ''
  return getToken(scope) ? scope : ''
}

const operatorName = computed(() => {
  const name = getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'name')
  const phone = getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'phone')
  const userId = getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'id')
  return name || phone || (userId ? `emp-${userId}` : 'admin')
})

const operatorPhone = computed(
  () => getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'phone') || '',
)

const operatorIdentity = computed(() => {
  const name = operatorName.value || ''
  const phone = operatorPhone.value || ''
  if (name && phone) return `${name}|${phone}`
  return name || phone || 'admin'
})

const getRefundAuditOperatorPhone = (value) => {
  const raw = String(value || '').trim()
  if (!raw) {
    return '--'
  }

  if (raw.includes('|')) {
    const [, phonePart] = raw.split('|')
    return (phonePart || '').trim() || '--'
  }

  if (/^1\d{10}$/.test(raw)) {
    return raw
  }

  return '--'
}

const activeTab = ref(
  hasPaymentListPermission.value
    ? 'payment'
    : hasRefundListPermission.value
      ? 'refund'
      : '',
)

const refundStatusOptions = [
  { label: '全部状态', value: null },
  { label: '待审核', value: 0 },
  { label: '审核通过', value: 1 },
  { label: '审核拒绝', value: 2 },
  { label: '退款处理中', value: 3 },
  { label: '退款成功', value: 4 },
  { label: '退款失败', value: 5 },
]

const refundStatusMap = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝',
  3: '退款处理中',
  4: '退款成功',
  5: '退款失败',
}

const paymentChannelMap = {
  ALIPAY: '支付宝',
  WECHAT: '微信',
}

const paymentStageMap = {
  ORDER: '首付款',
  NODE: '节点付款',
  FINAL: '尾款',
}

const getRefundStatusText = (status) =>
  refundStatusMap[Number(status)] || `未知(${status})`

const getRefundStatusType = (status) => {
  const s = Number(status)
  if (s === 4) return 'success'
  if (s === 2 || s === 5) return 'error'
  if (s === 1) return 'info'
  return 'warning'
}

const getPaymentChannelText = (channel) => paymentChannelMap[channel] || channel || '--'

const getPaymentChannelType = (channel) => {
  if (channel === 'ALIPAY') return 'info'
  if (channel === 'WECHAT') return 'success'
  return 'default'
}

const getPaymentStageText = (stage) => paymentStageMap[stage] || stage || '--'

const formatMoney = (value) => {
  const num = Number(value || 0)
  return Number.isNaN(num) ? '0.00' : num.toFixed(2)
}

const formatDateTime = (value) => {
  if (!value) return '--'
  return String(value).replace('T', ' ')
}

const defaultPaymentStatement =
  '<p style="text-align: center;"><strong>支付协议（模拟文案）</strong></p><p><strong>1.</strong> 下单后请在规定时间内完成付款。</p><p><strong>2.</strong> 施工节点付款请以系统提示金额为准。</p><p><strong>3.</strong> 如有疑问请联系客服。</p>'
const DEFAULT_DESIGN_DEPOSIT_DRAFT = 0.01
const showDepositSettingModal = ref(false)
const showPaymentStatementModal = ref(false)
const depositSettingLoading = ref(false)
const depositSettingSaving = ref(false)
const paymentStatementLoading = ref(false)
const paymentStatementSaving = ref(false)
const paymentStatementCurrent = ref(defaultPaymentStatement)
const paymentStatementDraft = ref(defaultPaymentStatement)
const designDepositDraft = ref(DEFAULT_DESIGN_DEPOSIT_DRAFT)
const designDepositSavedAmount = ref(null)
const paymentStatementEditorRef = shallowRef()
const paymentStatementToolbarConfig = {
  toolbarKeys: [
    'headerSelect',
    '|',
    'bold',
    'justifyCenter',
    '|',
    'bulletedList',
    'numberedList',
  ],
}
const paymentStatementEditorConfig = computed(() => ({
  placeholder: '请输入支付协议文案（支持标题、加粗、居中等）',
  readOnly: !hasPaymentStatementUpdatePermission.value,
}))

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const normalizeStatementHtml = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return defaultPaymentStatement
  if (/[<][^>]+[>]/.test(raw)) return raw
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return defaultPaymentStatement
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
}

const getStatementPlainText = (html) => {
  if (!html) return ''
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = String(html)
    return (div.textContent || div.innerText || '').replace(/\u00a0/g, ' ').trim()
  }
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

const normalizeDepositDraftAmount = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }
  return Number(amount.toFixed(2))
}

const loadDesignDepositDraft = async ({ silent = false } = {}) => {
  depositSettingLoading.value = true
  try {
    const res = await orderAPI.getPaymentDefaultDeposit()
    const amount = normalizeDepositDraftAmount(
      res?.data?.depositAmount ?? res?.data?.amount,
    )

    if (res?.code === 200 && amount != null) {
      designDepositSavedAmount.value = amount
      designDepositDraft.value = amount
      return amount
    }

    designDepositSavedAmount.value = null
    designDepositDraft.value = DEFAULT_DESIGN_DEPOSIT_DRAFT
    if (!silent) {
      message.error(res?.msg || '获取全局默认定金失败')
    }
    return null
  } catch (error) {
    designDepositSavedAmount.value = null
    designDepositDraft.value = DEFAULT_DESIGN_DEPOSIT_DRAFT
    if (!silent) {
      const msg =
        error?.response?.data?.msg || error?.msg || error?.message || '获取全局默认定金失败'
      message.error(String(msg))
    }
    return null
  } finally {
    depositSettingLoading.value = false
  }
}

const handlePaymentStatementEditorCreated = (editor) => {
  paymentStatementEditorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = paymentStatementEditorRef.value
  if (editor && editor.destroy) {
    editor.destroy()
  }
})

const loadPaymentStatement = async ({ silent = false } = {}) => {
  const readableScope = resolveReadableClientScope()
  if (!readableScope) {
    if (!silent) {
      message.warning('需用户登录才能查看支付协议内容')
    }
    return
  }

  paymentStatementLoading.value = true
  try {
    const res = await orderAPI.getPaymentStatement({ authScope: readableScope })
    if (res.code === 200) {
      paymentStatementCurrent.value = normalizeStatementHtml(res.data)
      if (!paymentStatementDraft.value?.trim()) {
        paymentStatementDraft.value = paymentStatementCurrent.value
      }
    } else if (!silent) {
      message.error(res.msg || '获取支付协议失败')
    }
  } catch (error) {
    if (!silent) {
      const msg =
        error?.response?.data?.msg || error?.msg || error?.message || '获取支付协议失败'
      message.error(String(msg))
    }
  } finally {
    paymentStatementLoading.value = false
  }
}

const openPaymentStatementModal = async () => {
  showPaymentStatementModal.value = true
  paymentStatementDraft.value = paymentStatementCurrent.value || defaultPaymentStatement
  await loadPaymentStatement({ silent: true })
  paymentStatementDraft.value = paymentStatementCurrent.value || defaultPaymentStatement
}

const openDepositSettingModal = async () => {
  showDepositSettingModal.value = true
  await loadDesignDepositDraft({ silent: false })
}

const closeDepositSettingModal = async () => {
  await loadDesignDepositDraft({ silent: true })
  showDepositSettingModal.value = false
}

const saveDesignDepositDraft = async () => {
  const amount = normalizeDepositDraftAmount(designDepositDraft.value)
  if (amount == null) {
    message.warning('请输入有效的定金金额')
    return
  }

  depositSettingSaving.value = true
  try {
    const res = await orderAPI.updatePaymentDefaultDeposit(amount)
    if (res?.code !== 200) {
      message.error(res?.msg || '默认定金保存失败')
      return
    }

    designDepositDraft.value = amount
    designDepositSavedAmount.value = amount
    message.success('全局默认定金已保存')
  } catch (error) {
    const msg =
      error?.response?.data?.msg || error?.msg || error?.message || '默认定金保存失败'
    message.error(String(msg))
    return
  } finally {
    depositSettingSaving.value = false
  }

  showDepositSettingModal.value = false
}

const reloadDefaultDepositAmount = () => loadDesignDepositDraft({ silent: false })

const closePaymentStatementModal = () => {
  if (paymentStatementSaving.value) return
  showPaymentStatementModal.value = false
}

const restorePaymentStatementFromCurrent = () => {
  paymentStatementDraft.value = paymentStatementCurrent.value || defaultPaymentStatement
}

const savePaymentStatement = async () => {
  if (!hasPaymentStatementUpdatePermission.value) {
    message.warning('当前账号无修改支付协议权限')
    return
  }
  const statement = String(paymentStatementDraft.value || '')
  if (!getStatementPlainText(statement)) {
    message.warning('支付协议内容不能为空')
    return
  }
  paymentStatementSaving.value = true
  try {
    const res = await orderAPI.updatePaymentStatement(statement)
    if (res.code === 200) {
      message.success(res.msg || '支付协议更新成功')
      paymentStatementCurrent.value = normalizeStatementHtml(statement)
      await loadPaymentStatement({ silent: true })
      paymentStatementDraft.value = paymentStatementCurrent.value || statement
    } else {
      message.error(res.msg || '支付协议更新失败')
    }
  } catch (error) {
    const msg =
      error?.response?.data?.msg || error?.msg || error?.message || '支付协议更新失败'
    message.error(String(msg))
  } finally {
    paymentStatementSaving.value = false
  }
}

const fetchPaymentRecordList = async () => {
  if (!hasPaymentListPermission.value) return
  try {
    await paymentStore.fetchPaymentRecordList()
  } catch (error) {
    const msg =
      error?.response?.data?.msg || error?.msg || error?.message || '获取支付流水列表失败'
    message.error(String(msg))
  }
}

const handlePaymentSearch = () => {
  paymentPageInfo.page = 1
  fetchPaymentRecordList()
}

const handlePaymentKeywordChange = (value) => {
  paymentFilters.keyword = value
}

const handlePaymentPageChange = (page) => {
  paymentPageInfo.page = page
  fetchPaymentRecordList()
}

const fetchRefundList = async () => {
  if (!hasRefundListPermission.value) return
  try {
    await paymentStore.fetchRefundList()
  } catch (error) {
    const msg =
      error?.response?.data?.msg || error?.msg || error?.message || '获取退款列表失败'
    message.error(String(msg))
  }
}

const handleRefundSearch = () => {
  refundPageInfo.page = 1
  fetchRefundList()
}

const handleRefundOrderNumberChange = (value) => {
  refundFilters.orderNumber = value
}

const handleRefundStatusChange = (value) => {
  refundFilters.status = value
}

const handleRefundPageChange = (page) => {
  refundPageInfo.page = page
  if (refundFilters.status === null || refundFilters.status === undefined) {
    paymentStore.refreshVisibleRefundRows()
    return
  }
  fetchRefundList()
}

const showRefundDetailModal = ref(false)
const refundDetailLoading = ref(false)
const refundDetail = ref(null)
const showPaymentDetailModal = ref(false)
const paymentDetailLoading = ref(false)
const paymentDetail = ref(null)

const openPaymentDetailModal = async (row) => {
  if (!row?.id || !hasPaymentViewPermission.value) return
  showPaymentDetailModal.value = true
  paymentDetailLoading.value = true
  paymentDetail.value = null
  try {
    const res = await orderAPI.getPaymentRecordDetail(row.id)
    if (res.code === 200) {
      paymentDetail.value = res.data || null
      if (!paymentDetail.value) {
        message.error('获取支付流水详情失败')
      }
      return
    }
    message.error(res.msg || '获取支付流水详情失败')
  } catch (error) {
    const msg =
      error?.response?.data?.msg || error?.msg || error?.message || '获取支付流水详情失败'
    message.error(String(msg))
  } finally {
    paymentDetailLoading.value = false
  }
}

const openRefundDetailModal = async (row) => {
  if (!row?.id || !hasRefundViewPermission.value) return
  showRefundDetailModal.value = true
  refundDetailLoading.value = true
  refundDetail.value = null
  try {
    refundDetail.value = await paymentStore.fetchRefundDetail(row.id)
    if (!refundDetail.value) {
      message.error('获取退款详情失败')
    }
  } catch (error) {
    const msg =
      error?.response?.data?.msg || error?.msg || error?.message || '获取退款详情失败'
    message.error(String(msg))
  } finally {
    refundDetailLoading.value = false
  }
}

const showAuditModal = ref(false)
const auditSubmitting = ref(false)
const auditForm = reactive({
  refundId: null,
  orderId: null,
  orderNumber: '',
  paymentRecordId: null,
  approved: true,
  refundAmount: null,
  reason: '',
})

const closeAuditModal = (force = false) => {
  if (auditSubmitting.value && !force) return
  showAuditModal.value = false
}

const handlePaymentStatementDraftChange = (value) => {
  paymentStatementDraft.value = value
}

const handleDesignDepositDraftChange = (value) => {
  designDepositDraft.value = value
}

const handlePaymentStatementModalShowChange = (value) => {
  if (value) {
    showPaymentStatementModal.value = true
    return
  }
  closePaymentStatementModal()
}

const handleDepositSettingModalShowChange = (value) => {
  if (value) {
    showDepositSettingModal.value = true
    return
  }
  void closeDepositSettingModal()
}

const handleRefundDetailModalShowChange = (value) => {
  showRefundDetailModal.value = value
}

const handlePaymentDetailModalShowChange = (value) => {
  showPaymentDetailModal.value = value
}

const handleAuditModalShowChange = (value) => {
  if (value) {
    showAuditModal.value = true
    return
  }
  closeAuditModal()
}

const handleAuditFormFieldChange = ({ key, value }) => {
  if (!key) return
  auditForm[key] = value
}

const openAuditModal = (row) => {
  if (!row) return
  auditForm.refundId = row.id
  auditForm.orderId = row.orderId
  auditForm.orderNumber = row.orderNumber || ''
  auditForm.paymentRecordId = row.paymentRecordId
  auditForm.approved = true
  auditForm.refundAmount = Number(row.refundAmount || row.paymentAmount || 0)
  auditForm.reason = ''
  showAuditModal.value = true
}

const submitAudit = async () => {
  if (!auditForm.orderId || !auditForm.paymentRecordId) {
    message.error('订单ID或支付流水ID缺失')
    return
  }
  if (!auditForm.reason.trim()) {
    message.error('请填写审核备注')
    return
  }

  const fallbackAmount = Number(auditForm.refundAmount || 0)
  const amount = fallbackAmount > 0 ? fallbackAmount : 0
  if (amount <= 0) {
    message.error('退款金额必须大于 0')
    return
  }

  const currentRow = refundList.value.find((item) => item.id === auditForm.refundId)
  const paymentAmount = Number(currentRow?.paymentAmount || 0)
  if (paymentAmount > 0 && amount > paymentAmount) {
    message.error('退款金额不能超过支付金额')
    return
  }

  auditSubmitting.value = true
  try {
    const res = await orderAPI.auditRefund(
      auditForm.orderId,
      amount,
      auditForm.reason.trim(),
      auditForm.approved,
      auditForm.paymentRecordId,
      operatorIdentity.value,
    )
    if (res.code === 200) {
      message.success(res.msg || (auditForm.approved ? '退款已执行' : '退款已拒绝'))
      closeAuditModal(true)
      fetchRefundList()
    } else {
      message.error(res.msg || '审核失败')
    }
  } catch (error) {
    const msg = error?.response?.data?.msg || error?.msg || error?.message || '审核失败'
    message.error(String(msg))
  } finally {
    auditSubmitting.value = false
  }
}

const syncRefundStatus = async (row) => {
  if (!row?.id) return
  try {
    const res = await orderAPI.syncRefundStatus(row.id, operatorName.value)
    if (res.code === 200) {
      message.success(res.msg || '退款状态同步完成')
      await fetchRefundList()
      if (showRefundDetailModal.value && refundDetail.value?.id === row.id) {
        await openRefundDetailModal(row)
      }
    } else {
      message.error(res.msg || '退款状态同步失败')
    }
  } catch (error) {
    const msg =
      error?.response?.data?.msg || error?.msg || error?.message || '退款状态同步失败'
    message.error(String(msg))
  }
}

const handleTabChange = (tab) => {
  if (tab === 'payment') {
    fetchPaymentRecordList()
    return
  }

  if (tab === 'refund') {
    fetchRefundList()
  }
}

const handleTabChangeWithState = (tab) => {
  activeTab.value = tab
  handleTabChange(tab)
}

onMounted(() => {
  if (activeTab.value === 'payment') {
    fetchPaymentRecordList()
    return
  }

  if (activeTab.value === 'refund') {
    fetchRefundList()
  }
})
</script>

<style lang="scss" scoped>
.financial-page {
  padding: 8px;
}

.financial-tabs {
  :deep(.n-tabs-nav) {
    margin-bottom: 18px;
  }
}

@media (max-width: 768px) {
  .financial-page {
    padding: 0;
  }

  .financial-tabs {
    :deep(.n-tabs-nav-scroll-wrapper) {
      overflow-x: auto;
      scrollbar-width: none;
    }

    :deep(.n-tabs-nav-scroll-wrapper::-webkit-scrollbar) {
      display: none;
    }

    :deep(.n-tabs-nav-scroll-content) {
      min-width: max-content;
    }
  }
}
</style>
