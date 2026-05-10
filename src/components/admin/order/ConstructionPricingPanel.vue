<template>
  <div class="construction-pricing-panel">
    <n-alert :type="workflowStarted ? 'warning' : 'info'" class="panel-alert">
      {{
        workflowStarted
          ? '订单已进入施工阶段。后端仅支持同步未支付节点金额，已支付节点与已开工后的定金不可修改。'
          : '这一环节用于在派单完成后、开工前预设各阶段金额。当前录入的是开工前草稿，点击“确认并开启施工”后会写入后端节点金额。'
      }}
    </n-alert>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card__label">订单编号</div>
        <div class="summary-card__value">{{ orderNumber || '--' }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card__label">施工方式</div>
        <div class="summary-card__value">{{ processText || '--' }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card__label">订单总金额</div>
        <div class="summary-card__value">¥{{ formatAmount(totalAmount) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card__label">施工基数</div>
        <div class="summary-card__value">
          ¥{{ formatAmount(constructionBaseAmount) }}
        </div>
      </div>
    </div>

    <n-card size="small" class="deposit-card" :bordered="false">
      <div class="deposit-card__header">
        <div>
          <div class="deposit-card__title">建房定金</div>
          <div class="deposit-card__desc">
            {{
              canEditDeposit
                ? '当前订单尚未开工，可直接修改定金并让后续账单基于新定金重算。'
                : workflowStarted
                  ? '订单已开工，定金金额已锁定。'
                  : '当前定金账单不满足编辑条件，展示为后端当前识别金额。'
            }}
          </div>
        </div>
        <n-tag size="small" :bordered="false" :type="canEditDeposit ? 'warning' : 'default'">
          {{ canEditDeposit ? '可编辑' : '已锁定' }}
        </n-tag>
      </div>

      <div class="deposit-card__body">
        <n-input-number
          v-model:value="localDepositAmount"
          :min="0"
          :precision="2"
          class="deposit-card__input"
          :disabled="!canEditDeposit || depositSaving"
          @update:value="handleDepositDraftChange"
        >
          <template #prefix>¥</template>
        </n-input-number>
        <n-button
          v-if="canEditDeposit"
          type="primary"
          :loading="depositSaving"
          @click="handleSaveDeposit"
        >
          保存定金
        </n-button>
      </div>
    </n-card>

    <n-card size="small" class="plan-card" :bordered="false">
      <div class="plan-card__header">
        <div>
          <div class="plan-card__title">确认开工节点金额</div>
          <div class="plan-card__desc">
            {{ pricePlanHint || '请按后端规则确认当前节点金额同步结果。' }}
          </div>
        </div>
        <n-tag size="small" :bordered="false" type="info">
          {{ pricePlanStatusText || '--' }}
        </n-tag>
      </div>

      <div class="allocation-panel">
        <div class="allocation-panel__header">
          <div class="allocation-panel__title">节点金额同步</div>
          <div class="allocation-panel__desc">
            {{ allocationHintText }}
          </div>
        </div>
      <div class="allocation-summary-grid">
        <div class="allocation-summary-card">
          <div class="allocation-summary-card__label">已锁定节点</div>
          <div class="allocation-summary-card__value">
            {{ lockedStageCount }}
            </div>
          </div>
          <div class="allocation-summary-card">
            <div class="allocation-summary-card__label">待同步节点</div>
            <div class="allocation-summary-card__value">
              {{ adjustableStageCount }}
            </div>
          </div>
          <div class="allocation-summary-card">
            <div class="allocation-summary-card__label">已锁定阶段款</div>
            <div class="allocation-summary-card__value">
              ¥{{ formatAmount(lockedStageAmountTotal) }}
            </div>
          </div>
        <div class="allocation-summary-card">
          <div class="allocation-summary-card__label">剩余待支付阶段款</div>
          <div class="allocation-summary-card__value">
            ¥{{ formatAmount(editableStageAmountTotal || remainingStageAmountTotal) }}
          </div>
        </div>
      </div>
      </div>

      <div class="stage-table">
        <div class="stage-table__head">
          <div>阶段</div>
          <div>节点名称</div>
          <div>比例规则</div>
          <div>金额设置</div>
          <div>状态</div>
        </div>
        <div
          v-for="row in displayStageRows"
          :key="row.key"
          class="stage-table__row"
        >
          <div class="stage-table__cell">
            <span class="stage-table__label">阶段</span>
            <span>{{ row.stageLabel }}</span>
          </div>
          <div class="stage-table__cell">
            <span class="stage-table__label">节点名称</span>
            <span>{{ row.nodeName }}</span>
          </div>
          <div class="stage-table__cell">
            <span class="stage-table__label">比例规则</span>
            <span>{{ row.ratioText }}</span>
          </div>
          <div class="stage-table__cell">
            <span class="stage-table__label">金额设置</span>
            <span class="stage-table__current-amount">
              当前：¥{{ formatAmount(row.currentAmount ?? row.amount) }}
            </span>
            <div
              v-if="row.editable"
              class="stage-table__editor"
            >
              <n-input-number
                :value="row.draftAmount"
                :min="0"
                :precision="2"
                size="small"
                :disabled="planSubmitting || savingNodePriceId === '__all__'"
                @update:value="handleNodeDraftChange(row, $event)"
              >
                <template #prefix>¥</template>
              </n-input-number>
              <n-button
                size="small"
                type="primary"
                secondary
                :disabled="!row.dirty || planSubmitting"
                :loading="savingNodePriceId === '__all__'"
                @click="$emit('save-node-prices')"
              >
                保存
              </n-button>
            </div>
            <span v-else>¥{{ formatAmount(row.amount) }}</span>
            <span
              class="stage-table__note"
              :class="row.isPaid ? 'stage-table__note--locked' : 'stage-table__note--editable'"
            >
              {{
                row.isPaid
                  ? '已支付锁定'
                  : row.editable
                    ? '未支付，可直接修改并保存'
                    : workflowStarted
                      ? '未支付，可按后端规则同步'
                      : '开启施工后按比例生成'
              }}
            </span>
            <span
              v-if="!row.editable && Number(row.targetAmount) !== Number(row.amount)"
              class="stage-table__hint"
            >
              同步后：¥{{ formatAmount(row.targetAmount) }}
            </span>
          </div>
          <div class="stage-table__cell">
            <span class="stage-table__label">状态</span>
            <n-tag size="small" :bordered="false" :type="row.statusType || 'default'">
              {{ row.statusText || '--' }}
            </n-tag>
          </div>
        </div>
      </div>

      <div class="plan-card__footer">
        <n-button
          v-if="workflowStarted"
          type="primary"
          :disabled="!canSyncPlan"
          :loading="planSubmitting"
          @click="$emit('sync-plan')"
        >
          同步未支付节点金额
        </n-button>
        <n-button
          v-else
          type="success"
          :disabled="!canConfirmPlan"
          :loading="planSubmitting"
          @click="$emit('confirm-plan')"
        >
          确认并开启施工
        </n-button>
      </div>
      <div
        v-if="!workflowStarted && !canConfirmPlan && confirmPlanDisabledReason"
        class="plan-card__disabled-reason"
      >
        {{ confirmPlanDisabledReason }}
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps({
  orderNumber: {
    type: String,
    default: '',
  },
  processText: {
    type: String,
    default: '',
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  constructionBaseAmount: {
    type: Number,
    default: 0,
  },
  depositAmount: {
    type: Number,
    default: 0,
  },
  stageRows: {
    type: Array,
    default: () => [],
  },
  editableNodes: {
    type: Array,
    default: () => [],
  },
  editableStageAmountTotal: {
    type: Number,
    default: 0,
  },
  pricePlanStatusText: {
    type: String,
    default: '',
  },
  pricePlanHint: {
    type: String,
    default: '',
  },
  workflowStarted: {
    type: Boolean,
    default: false,
  },
  canEditDeposit: {
    type: Boolean,
    default: false,
  },
  canConfirmPlan: {
    type: Boolean,
    default: false,
  },
  confirmPlanDisabledReason: {
    type: String,
    default: '',
  },
  canSyncPlan: {
    type: Boolean,
    default: false,
  },
  depositSaving: {
    type: Boolean,
    default: false,
  },
  savingNodePriceId: {
    type: [String, Number, null],
    default: null,
  },
  planSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update-deposit-draft',
  'update-node-draft',
  'save-node-prices',
  'save-deposit',
  'confirm-plan',
  'sync-plan',
])

const message = useMessage()
const localDepositAmount = ref(0)

const normalizedDepositAmount = computed(() => Number(props.depositAmount || 0))

const pricingStageRows = computed(() =>
  Array.isArray(props.stageRows) ? props.stageRows : [],
)

const displayStageRows = computed(() =>
  Array.isArray(props.editableNodes) && props.editableNodes.length
    ? props.editableNodes
    : pricingStageRows.value,
)

const stagePaymentRows = computed(() =>
  displayStageRows.value.filter((row) => Number(row?.sortOrder || 0) > 1),
)

const lockedStageRows = computed(() =>
  stagePaymentRows.value.filter((row) => Boolean(row?.isPaid)),
)

const adjustableStageRows = computed(() =>
  stagePaymentRows.value.filter((row) => !row?.isPaid),
)

const lockedStageCount = computed(() => lockedStageRows.value.length)

const adjustableStageCount = computed(() => adjustableStageRows.value.length)

const lockedStageAmountTotal = computed(() =>
  lockedStageRows.value.reduce(
    (sum, row) => sum + Number(row?.amount || 0),
    0,
  ),
)

const remainingStageAmountTotal = computed(() =>
  adjustableStageRows.value.reduce(
    (sum, row) => sum + Number(row?.amount || 0),
    0,
  ),
)

const allocationHintText = computed(() => {
  if (!pricingStageRows.value.length) {
    return '当前尚未初始化施工节点，先展示开工前草稿。确认开启施工后，草稿会映射到后端创建的施工节点。'
  }

  if (!props.workflowStarted) {
    return '当前可先逐阶段调整草稿金额；开启施工后，系统会按当前草稿写入各节点。'
  }

  if (lockedStageCount.value > 0) {
    return '已支付节点金额会被后端锁定；剩余未支付节点仍按当前总价与既有定金，继续按固定比例同步。'
  }

  return '当前尚未产生已支付阶段款，可继续按后端固定比例同步未支付节点金额。'
})

watch(
  normalizedDepositAmount,
  (value) => {
    localDepositAmount.value = value
  },
  { immediate: true },
)

const formatAmount = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return '0.00'
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const handleDepositDraftChange = (value) => {
  const amount = Number(value)
  emit(
    'update-deposit-draft',
    Number.isFinite(amount) && amount >= 0 ? amount : 0,
  )
}

const handleNodeDraftChange = (row, value) => {
  const amount = Number(value)
  emit('update-node-draft', {
    nodeId: row?.nodeId,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
  })
}

const handleSaveDeposit = () => {
  const amount = Number(localDepositAmount.value)
  if (!Number.isFinite(amount) || amount <= 0) {
    message.warning('请输入有效的定金金额')
    return
  }
  emit('save-deposit', amount)
}
</script>

<style scoped>
.construction-pricing-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-alert {
  margin-bottom: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f5faf4 0%, #ecf5ef 100%);
  border: 1px solid #d7e6da;
}

.summary-card__label {
  font-size: 13px;
  color: #5f6b62;
}

.summary-card__value {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1f3a28;
  word-break: break-all;
}

.deposit-card,
.plan-card {
  background: #f8fbf8;
}

.allocation-panel {
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5ebe6;
}

.plan-card__disabled-reason {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff6eb;
  border: 1px solid #f0d7b1;
  color: #8a5a12;
  font-size: 13px;
  line-height: 1.6;
}

.allocation-panel__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.allocation-panel__title {
  font-size: 15px;
  font-weight: 600;
  color: #1f3a28;
}

.allocation-panel__desc {
  font-size: 13px;
  line-height: 1.6;
  color: #5f6b62;
}

.allocation-summary-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.allocation-summary-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbf8 0%, #eef5ef 100%);
  border: 1px solid #e3ebe4;
}

.allocation-summary-card__label {
  font-size: 12px;
  color: #68766d;
}

.allocation-summary-card__value {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f3a28;
}

.deposit-card__header,
.plan-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.deposit-card__title,
.plan-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #1f3a28;
}

.deposit-card__desc,
.plan-card__desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #5f6b62;
}

.deposit-card__body {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.deposit-card__input {
  width: min(280px, 100%);
}

.stage-table {
  margin-top: 16px;
  border: 1px solid #e5ebe6;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.stage-table__head,
.stage-table__row {
  display: grid;
  grid-template-columns: 120px 1.6fr 120px 140px 120px;
  gap: 0;
}

.stage-table__head {
  background: #eef5ef;
  color: #35523f;
  font-weight: 600;
}

.stage-table__row + .stage-table__row {
  border-top: 1px solid #edf1ee;
}

.stage-table__head > div,
.stage-table__cell {
  padding: 14px 16px;
}

.stage-table__label {
  display: none;
  font-size: 12px;
  color: #7b8a7f;
}

.stage-table__hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #c26b1d;
}

.stage-table__current-amount {
  display: block;
}

.stage-table__editor {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-table__note {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

.stage-table__note--locked {
  color: #15803d;
}

.stage-table__note--editable {
  color: #35523f;
}

.plan-card__footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .allocation-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stage-table__head {
    display: none;
  }

  .stage-table__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stage-table__cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
  }

  .stage-table__label {
    display: block;
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .allocation-summary-grid {
    grid-template-columns: 1fr;
  }

  .deposit-card__body {
    flex-direction: column;
    align-items: stretch;
  }

  .stage-table__row {
    grid-template-columns: 1fr;
  }
}
</style>
