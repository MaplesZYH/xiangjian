<template>
  <div class="financial-page">
    <n-empty
      v-if="!hasPaymentListPermission && !hasRefundListPermission"
      description="当前账号暂无财务管理权限"
    />

    <n-tabs
      v-else
      v-model:value="activeTab"
      type="segment"
      animated
      class="financial-tabs"
      @update:value="handleTabChange"
    >
      <n-tab-pane
        v-if="hasPaymentListPermission"
        name="payment"
        tab="支付流水管理"
      >
        <section class="financial-section">
          <div class="financial-section__header">
            <h3 class="financial-section__title">支付流水管理</h3>
          </div>
          <n-space vertical size="large">
            <div class="financial-filter-row">
              <div class="financial-filter-item financial-filter-item-keyword">
                <n-input
                  v-model:value="paymentFilters.keyword"
                  placeholder="订单号 / 用户名 / 手机号"
                  clearable
                  @keydown.enter="handlePaymentSearch"
                />
              </div>
              <div class="financial-filter-item financial-filter-item-actions">
                <n-space>
                  <n-button type="primary" @click="handlePaymentSearch">
                    查询
                  </n-button>
                  <n-button type="warning" secondary @click="openDepositSettingModal">
                    定金设置
                  </n-button>
                  <n-button type="info" secondary @click="openPaymentStatementModal">
                    支付协议
                  </n-button>
                </n-space>
              </div>
            </div>

            <div class="financial-list admin-shell-list financial-list--payment">
              <div class="financial-table-scroll">
                <div class="financial-table">
                  <div class="list-header">
                    <div class="header-item">支付流水ID</div>
                    <div class="header-item">订单号</div>
                    <div class="header-item">用户名</div>
                    <div class="header-item">手机号</div>
                    <div class="header-item">支付阶段</div>
                    <div class="header-item">支付渠道</div>
                    <div class="header-item">支付金额</div>
                    <div class="header-item">交易流水号</div>
                    <div class="header-item">支付时间</div>
                    <div class="header-item">操作</div>
                  </div>

                  <n-spin :show="paymentLoading" class="financial-spin">
                    <div v-if="paymentRecordList.length > 0" class="list-body">
                      <div
                        v-for="item in paymentRecordList"
                        :key="item.id"
                        class="list-row"
                      >
                        <div class="list-item" :title="String(item.id || '--')">
                          {{ item.id || '--' }}
                        </div>
                        <div class="list-item" :title="item.orderNumber || '--'">
                          {{ item.orderNumber || '--' }}
                        </div>
                        <div class="list-item" :title="item.userName || '--'">
                          {{ item.userName || '--' }}
                        </div>
                        <div class="list-item" :title="item.phoneNumber || '--'">
                          {{ item.phoneNumber || '--' }}
                        </div>
                        <div class="list-item" :title="getPaymentStageText(item.paymentStage)">
                          {{ getPaymentStageText(item.paymentStage) }}
                        </div>
                        <div class="list-item">
                          <n-tag
                            :type="getPaymentChannelType(item.paymentChannel)"
                            size="small"
                          >
                            {{ getPaymentChannelText(item.paymentChannel) }}
                          </n-tag>
                        </div>
                        <div class="list-item" :title="`¥${formatMoney(item.amount)}`">
                          ¥{{ formatMoney(item.amount) }}
                        </div>
                        <div
                          class="list-item"
                          :title="item.transactionId || '--'"
                        >
                          {{ item.transactionId || '--' }}
                        </div>
                        <div class="list-item" :title="formatDateTime(item.payTime)">
                          {{ formatDateTime(item.payTime) }}
                        </div>
                        <div class="list-item actions">
                          <n-button
                            v-if="hasPaymentViewPermission"
                            size="small"
                            type="info"
                            secondary
                            @click="openPaymentDetailModal(item)"
                          >
                            详情
                          </n-button>
                          <span v-else>--</span>
                        </div>
                      </div>
                    </div>

                    <div v-else class="empty-state">
                      <n-empty description="暂无支付流水数据" />
                    </div>
                  </n-spin>
                </div>
              </div>
            </div>

            <div class="pagination-wrap">
              <n-pagination
                v-model:page="paymentPageInfo.page"
                :page-size="paymentPageInfo.pageSize"
                :item-count="paymentPageInfo.itemCount"
                :page-slot="3"
                show-quick-jumper
                @update:page="handlePaymentPageChange"
              />
            </div>
          </n-space>
        </section>
      </n-tab-pane>

      <n-tab-pane v-if="hasRefundListPermission" name="refund" tab="退款管理">
        <section class="financial-section">
          <div class="financial-section__header">
            <h3 class="financial-section__title">退款管理</h3>
          </div>
          <n-space vertical size="large">
            <div class="financial-filter-row">
              <div class="financial-filter-item financial-filter-item-input">
                <n-input
                  v-model:value="refundFilters.orderNumber"
                  placeholder="订单号"
                  clearable
                  @keydown.enter="handleRefundSearch"
                />
              </div>
              <div class="financial-filter-item financial-filter-item-select">
                <n-select
                  v-model:value="refundFilters.status"
                  :options="refundStatusOptions"
                  placeholder="退款状态"
                  @update:value="handleRefundSearch"
                />
              </div>
              <div class="financial-filter-item financial-filter-item-actions">
                <n-space>
                  <n-button type="primary" @click="handleRefundSearch">
                    查询
                  </n-button>
                </n-space>
              </div>
            </div>

            <div class="financial-list admin-shell-list financial-list--refund">
              <div class="financial-table-scroll">
                <div class="financial-table">
                  <div class="list-header">
                    <div class="header-item">订单号</div>
                    <div class="header-item">用户名</div>
                    <div class="header-item">手机号</div>
                    <div class="header-item">支付金额</div>
                    <div class="header-item">退款金额</div>
                    <div class="header-item">退款状态</div>
                    <div class="header-item">申请时间</div>
                    <div class="header-item">操作</div>
                  </div>

                  <n-spin :show="refundLoading" class="financial-spin">
                    <div v-if="refundList.length > 0" class="list-body">
                      <div
                        v-for="item in refundList"
                        :key="item.id"
                        class="list-row"
                      >
                        <div class="list-item" :title="item.orderNumber || '--'">
                          {{ item.orderNumber || '--' }}
                        </div>
                        <div class="list-item" :title="item.userName || '--'">
                          {{ item.userName || '--' }}
                        </div>
                        <div class="list-item" :title="item.userPhone || '--'">
                          {{ item.userPhone || '--' }}
                        </div>
                        <div
                          class="list-item"
                          :title="`¥${formatMoney(item.paymentAmount)}`"
                        >
                          ¥{{ formatMoney(item.paymentAmount) }}
                        </div>
                        <div
                          class="list-item"
                          :title="`¥${formatMoney(item.refundAmount)}`"
                        >
                          ¥{{ formatMoney(item.refundAmount) }}
                        </div>
                        <div class="list-item">
                          <n-tag :type="getRefundStatusType(item.status)" size="small">
                            {{ getRefundStatusText(item.status) }}
                          </n-tag>
                        </div>
                        <div class="list-item" :title="formatDateTime(item.createTime)">
                          {{ formatDateTime(item.createTime) }}
                        </div>
                        <div class="list-item actions">
                          <n-button
                            v-if="hasRefundViewPermission"
                            size="small"
                            type="info"
                            secondary
                            @click="openRefundDetailModal(item)"
                          >
                            详情
                          </n-button>
                          <n-button
                            v-if="hasRefundAuditPermission && Number(item.status) === 0"
                            size="small"
                            type="primary"
                            @click="openAuditModal(item)"
                          >
                            审核
                          </n-button>
                          <n-button
                            v-if="hasRefundAuditPermission && Number(item.status) === 3"
                            size="small"
                            type="warning"
                            ghost
                            @click="syncRefundStatus(item)"
                          >
                            同步状态
                          </n-button>
                        </div>
                      </div>
                    </div>

                    <div v-else class="empty-state">
                      <n-empty description="暂无退款数据" />
                    </div>
                  </n-spin>
                </div>
              </div>
            </div>

            <div class="pagination-wrap">
              <n-pagination
                v-model:page="refundPageInfo.page"
                :page-size="refundPageInfo.pageSize"
                :item-count="refundPageInfo.itemCount"
                :page-slot="3"
                show-quick-jumper
                @update:page="handleRefundPageChange"
              />
            </div>
          </n-space>
        </section>
      </n-tab-pane>
    </n-tabs>

    <n-modal
      v-model:show="showPaymentStatementModal"
      preset="card"
      title="支付协议"
      style="width: 980px; max-width: calc(100vw - 32px)"
      :mask-closable="!paymentStatementSaving"
      :closable="!paymentStatementSaving"
    >
      <n-space vertical size="large">
        <n-spin :show="paymentStatementLoading">
          <n-form label-placement="top">
            <n-form-item label="支付协议内容">
              <div class="payment-agreement-editor-wrap">
                <Toolbar
                  :editor="paymentStatementEditorRef"
                  :default-config="paymentStatementToolbarConfig"
                  mode="default"
                  class="payment-agreement-toolbar"
                />
                <Editor
                  v-model="paymentStatementDraft"
                  :default-config="paymentStatementEditorConfig"
                  mode="default"
                  class="payment-agreement-editor"
                  @onCreated="handlePaymentStatementEditorCreated"
                />
              </div>
            </n-form-item>
          </n-form>
        </n-spin>
      </n-space>

      <template #footer>
        <div class="financial-modal-actions">
          <n-button
            :disabled="paymentStatementLoading || paymentStatementSaving"
            @click="restorePaymentStatementFromCurrent"
          >
            恢复线上内容
          </n-button>
          <div class="financial-modal-actions__group">
            <n-button :disabled="paymentStatementSaving" @click="closePaymentStatementModal">
              取消
            </n-button>
            <n-button
              type="primary"
              :loading="paymentStatementSaving"
              :disabled="!hasPaymentStatementUpdatePermission"
              @click="savePaymentStatement"
            >
              保存
            </n-button>
          </div>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDepositSettingModal"
      preset="card"
      title="定金设置"
      style="width: min(520px, calc(100vw - 24px))"
    >
      <div class="deposit-setting-panel">
        <section class="deposit-setting-card">
          <div class="deposit-setting-card__title">设计订单定金</div>
          <div class="deposit-setting-card__desc">
            这里直接读取并修改后端全局默认定金，保存后后续新建设计订单会立即按新金额生效。
          </div>

          <n-form label-placement="top">
            <n-form-item label="定金金额">
              <n-input-number
                v-model:value="designDepositDraft"
                :min="0.01"
                :precision="2"
                :step="100"
                style="width: 100%"
                placeholder="请输入设计订单定金"
              />
            </n-form-item>
          </n-form>

          <div class="deposit-setting-card__status">
            <span>当前已保存：</span>
            <strong>
              {{
                designDepositSavedAmount == null
                  ? '未设置'
                  : `¥${formatMoney(designDepositSavedAmount)}`
              }}
            </strong>
          </div>
          <div class="deposit-setting-card__hint">
            已创建的历史订单不会回溯修改，实际支付金额仍以后端实时生成账单为准。
          </div>
        </section>

        <div class="deposit-setting-inline-note">
          建房订单定金继续按订单详情里的单笔链路处理；这里仅维护“新订单默认定金”。
        </div>
      </div>

      <template #footer>
        <div class="financial-modal-actions">
          <n-button :disabled="depositSettingLoading" @click="reloadDefaultDepositAmount">
            刷新
          </n-button>
          <div class="financial-modal-actions__group">
            <n-button :disabled="depositSettingSaving" @click="closeDepositSettingModal">取消</n-button>
            <n-button
              type="primary"
              :loading="depositSettingSaving"
              @click="saveDesignDepositDraft"
            >
              保存
            </n-button>
          </div>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showRefundDetailModal"
      preset="card"
      title="退款详情"
      style="width: min(760px, calc(100vw - 24px))"
    >
      <n-spin :show="refundDetailLoading">
        <div v-if="refundDetail" class="refund-detail-panel">
          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">订单号：</span>
              <span class="refund-detail-item__value">
                {{ refundDetail.orderNumber || '--' }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">支付订单号：</span>
              <span class="refund-detail-item__value">
                {{ refundDetail.paymentRecordId || '--' }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">用户：</span>
              <span class="refund-detail-item__value">
                {{ refundDetail.userName || '--' }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">电话：</span>
              <span class="refund-detail-item__value">
                {{ refundDetail.userPhone || '--' }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">退款状态：</span>
              <span class="refund-detail-item__value">
                <n-tag :type="getRefundStatusType(refundDetail.status)">
                  {{ getRefundStatusText(refundDetail.status) }}
                </n-tag>
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">支付金额：</span>
              <span class="refund-detail-item__value">
                ¥{{ formatMoney(refundDetail.paymentAmount) }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">退款金额：</span>
              <span class="refund-detail-item__value">
                ¥{{ formatMoney(refundDetail.refundAmount) }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">咨询电话：</span>
              <span class="refund-detail-item__value">
                {{ getRefundAuditOperatorPhone(refundDetail.auditOperator) }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">审核时间：</span>
              <span class="refund-detail-item__value">
                {{ formatDateTime(refundDetail.auditTime) }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">申请时间：</span>
              <span class="refund-detail-item__value">
                {{ formatDateTime(refundDetail.createTime) }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item refund-detail-item--full">
              <span class="refund-detail-item__label">更新时间：</span>
              <span class="refund-detail-item__value">
                {{ formatDateTime(refundDetail.updateTime) }}
              </span>
            </div>
          </div>

          <div class="refund-detail-block">
            <div class="refund-detail-block__label">用户原因</div>
            <div class="refund-detail-block__value">
              {{ refundDetail.reason || '--' }}
            </div>
          </div>

          <div class="refund-detail-block">
            <div class="refund-detail-block__label">审核备注</div>
            <div class="refund-detail-block__value">
              {{ refundDetail.auditRemark || '--' }}
            </div>
          </div>
        </div>
      </n-spin>
    </n-modal>

    <n-modal
      v-model:show="showPaymentDetailModal"
      preset="card"
      title="支付流水详情"
      style="width: min(760px, calc(100vw - 24px))"
    >
      <n-spin :show="paymentDetailLoading">
        <div v-if="paymentDetail" class="refund-detail-panel">
          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">支付流水ID：</span>
              <span class="refund-detail-item__value">
                {{ paymentDetail.id || '--' }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">订单ID：</span>
              <span class="refund-detail-item__value">
                {{ paymentDetail.orderId || '--' }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">订单号：</span>
              <span class="refund-detail-item__value">
                {{ paymentDetail.orderNumber || '--' }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">交易流水号：</span>
              <span class="refund-detail-item__value">
                {{ paymentDetail.transactionId || '--' }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">用户：</span>
              <span class="refund-detail-item__value">
                {{ paymentDetail.userName || '--' }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">电话：</span>
              <span class="refund-detail-item__value">
                {{ paymentDetail.phoneNumber || '--' }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">支付阶段：</span>
              <span class="refund-detail-item__value">
                {{ getPaymentStageText(paymentDetail.paymentStage) }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">支付渠道：</span>
              <span class="refund-detail-item__value">
                {{ getPaymentChannelText(paymentDetail.paymentChannel) }}
              </span>
            </div>
          </div>

          <div class="refund-detail-row">
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">支付金额：</span>
              <span class="refund-detail-item__value">
                ¥{{ formatMoney(paymentDetail.amount) }}
              </span>
            </div>
            <div class="refund-detail-item">
              <span class="refund-detail-item__label">支付时间：</span>
              <span class="refund-detail-item__value">
                {{ formatDateTime(paymentDetail.payTime) }}
              </span>
            </div>
          </div>
        </div>
        <n-empty v-else description="暂无支付流水详情" />
      </n-spin>
    </n-modal>

    <n-modal
      v-model:show="showAuditModal"
      preset="card"
      title="退款审核"
      style="width: min(560px, calc(100vw - 24px))"
      :mask-closable="!auditSubmitting"
      :closable="!auditSubmitting"
    >
      <n-form label-placement="left" label-width="96">
        <n-form-item label="订单号">
          <n-input :value="auditForm.orderNumber" disabled />
        </n-form-item>
        <n-form-item label="支付流水ID">
          <n-input :value="String(auditForm.paymentRecordId || '')" disabled />
        </n-form-item>
        <n-form-item label="审核结果">
          <n-radio-group v-model:value="auditForm.approved">
            <n-space>
              <n-radio :value="true">通过</n-radio>
              <n-radio :value="false">拒绝</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="退款金额" required>
          <n-input-number
            v-model:value="auditForm.refundAmount"
            :min="0.01"
            :precision="2"
            :step="1"
            :disabled="!auditForm.approved"
            style="width: 100%"
            placeholder="请输入退款金额"
          />
        </n-form-item>
        <n-form-item label="审核备注" required>
          <n-input
            v-model:value="auditForm.reason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-count
            :placeholder="
              auditForm.approved ? '请输入通过备注' : '请输入拒绝原因（将回传给用户）'
            "
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="financial-modal-actions financial-modal-actions--end">
          <n-button :disabled="auditSubmitting" @click="closeAuditModal">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="auditSubmitting"
            @click="submitAudit"
          >
            确认审核
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import orderAPI from '@/api/user/userOrder'
import { usePaymentStore } from '@/stores/payment/usePaymentStore'
import {
  AUTH_SCOPE_EMPLOYEE,
  getAuthStorage,
  getToken,
  resolveClientScope,
} from '@/utils/auth'

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

.financial-section {
  padding: 18px 14px 16px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.financial-section__header {
  margin-bottom: 18px;
}

.financial-section__title {
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.financial-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  min-width: 720px;
}

.financial-filter-item {
  flex: 0 0 auto;
}

.financial-filter-item-input {
  width: 180px;
}

.financial-filter-item-select {
  width: 180px;
}

.financial-filter-item-keyword {
  width: 240px;
}

.financial-filter-item-actions {
  min-width: 220px;
}

.financial-table-shell {
  margin-bottom: 0;
  box-shadow: none;
}

.financial-list {
  width: 100%;

  .financial-table {
    min-width: var(--financial-table-min-width);
    width: max-content;
  }

  .financial-spin {
    width: 100%;

    :deep(.n-spin-content) {
      width: 100%;
    }
  }

  .list-header,
  .list-body {
    min-width: var(--financial-table-min-width);
    box-sizing: border-box;
  }

  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: var(--financial-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--financial-table-min-width);
    box-sizing: border-box;
  }

  .header-item,
  .list-item {
    min-width: 0;
  }

  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.financial-list--payment {
  --financial-grid-columns: minmax(120px, 0.72fr) minmax(220px, 1.4fr) minmax(
      120px,
      0.85fr
    ) minmax(150px, 0.95fr) minmax(110px, 0.82fr) minmax(100px, 0.72fr) minmax(
      110px,
      0.78fr
    ) minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(96px, 0.64fr);
  --financial-table-min-width: 1540px;
}

.financial-list--refund {
  --financial-grid-columns: minmax(220px, 1.4fr) minmax(120px, 0.7fr) minmax(
      140px,
      0.82fr
    ) minmax(110px, 0.7fr) minmax(110px, 0.7fr) minmax(110px, 0.72fr) minmax(
      180px,
      1fr
    ) 240px;
  --financial-table-min-width: 1320px;
}

.financial-table-scroll {
  width: 100%;
  overflow: visible;
  border: none;
  border-radius: inherit;
  background: var(--color-surface);
}

.refund-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.refund-detail-row {
  display: flex;
  gap: 12px;
}

.refund-detail-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
}

.refund-detail-item--full {
  flex: 1 1 100%;
}

.refund-detail-item__label {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-weight: 600;
  white-space: nowrap;
}

.refund-detail-item__value {
  min-width: 0;
  color: var(--color-text-primary);
  font-weight: 500;
  word-break: break-all;
}

.refund-detail-block {
  padding: 14px 16px;
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, var(--color-surface) 0%, #f8fbf8 100%);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-xs);
}

.refund-detail-block__label {
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.refund-detail-block__value {
  color: var(--color-text-primary);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.payment-agreement-editor-wrap {
  width: 100%;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.payment-agreement-toolbar {
  border-bottom: 1px solid var(--color-border-soft);
  background: linear-gradient(180deg, #f8fbf8 0%, #f2f7f3 100%);
}

.payment-agreement-editor {
  min-height: 360px;

  :deep(.w-e-text-container) {
    min-height: 320px !important;
    max-height: 52vh;
    overflow-y: auto !important;
  }

  :deep(.w-e-scroll) {
    min-height: 320px !important;
  }
}

.deposit-setting-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.deposit-setting-card {
  padding: 18px 18px 16px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-soft);
  background: linear-gradient(180deg, var(--color-surface) 0%, #f8fbf8 100%);
  box-shadow: var(--shadow-xs);
}

.deposit-setting-card__title {
  color: var(--color-text-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.deposit-setting-card__desc {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.deposit-setting-card__status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
}

.deposit-setting-card__hint {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.deposit-setting-inline-note {
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: rgba(60, 64, 97, 0.05);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.financial-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.financial-modal-actions--end {
  justify-content: flex-end;
}

.financial-modal-actions__group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

  .financial-section {
    padding: 16px 0 12px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }

  .financial-section__header {
    margin-bottom: 16px;
    padding-inline: 12px;
  }

  .financial-section__title {
    font-size: 18px;
  }

  .financial-filter-row {
    min-width: 0;
    flex-direction: column;
    align-items: stretch;
    overflow: visible;
  }

  .financial-filter-item,
  .financial-filter-item-input,
  .financial-filter-item-select,
  .financial-filter-item-actions {
    width: 100%;
  }

  .financial-filter-item-actions :deep(.n-space) {
    width: 100%;
  }

  .financial-filter-item-actions :deep(.n-space > .n-space-item) {
    flex: 1 1 100%;
  }

  .financial-filter-item-actions :deep(.n-button) {
    width: 100%;
  }

  .financial-filter-row,
  .pagination-wrap {
    padding-inline: 12px;
  }

  .financial-list {
    .list-header,
    .list-row {
      gap: 12px;
      padding: 12px;
    }
  }

  .financial-modal-actions,
  .financial-modal-actions__group {
    width: 100%;
  }

  .financial-modal-actions {
    justify-content: stretch;
  }

  .financial-modal-actions > *,
  .financial-modal-actions__group > * {
    flex: 1 1 100%;
  }

  .payment-agreement-editor {
    min-height: 280px;

    :deep(.w-e-text-container) {
      min-height: 240px !important;
      max-height: 46vh;
    }

    :deep(.w-e-scroll) {
      min-height: 240px !important;
    }
  }

  .refund-detail-row {
    flex-direction: column;
  }
}
</style>
