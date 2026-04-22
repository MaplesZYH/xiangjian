<template>
  <div class="dispatch-panel">
    <n-alert v-if="!canDispatch" type="warning" class="inline-alert-lg">
      需先上传合同后才能派单。
    </n-alert>

    <n-alert v-else-if="isDispatchStageLocked" type="info" class="inline-alert-md">
      当前订单已进入施工阶段。施工单位派单按现有流程继续执行，材料选配仍可根据增项、同类改项结果继续取消旧单、重新派单或补派。
    </n-alert>

    <n-alert v-else type="info" class="inline-alert-md">
      合同已上传，系统将自动推荐距离最近的可派单服务商。后台仍可通过“详情/编辑”继续追加选配；如是用户提交的选配变更，请在“选配变更”中审核处理。
      <span v-if="allServicesAccepted" class="dispatch-alert-accent">
        所有服务商已接单，可直接开启施工流程。
      </span>
    </n-alert>

    <n-divider title-placement="left">施工服务商指派</n-divider>
    <div class="section-block">
      <div v-if="activeConstructionOrder" class="status-card">
        <n-descriptions bordered size="small" label-placement="left" :column="2">
          <n-descriptions-item label="服务商">
            {{
              activeConstructionOrder.companyName ||
              `ID:${activeConstructionOrder.vendorOrderId}`
            }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <div class="status-with-reason">
              <n-tag
                :type="getVendorStatusInfo(activeConstructionOrder.orderStatus).type"
                size="small"
              >
                {{ getVendorStatusInfo(activeConstructionOrder.orderStatus).text }}
              </n-tag>
              <n-button
                v-if="hasVendorRejectReason(activeConstructionOrder)"
                size="tiny"
                tertiary
                type="warning"
                class="vendor-reason-btn"
                @click="showVendorReasonDialog(activeConstructionOrder.vendorNotes)"
              >
                查看拒绝理由
              </n-button>
            </div>
          </n-descriptions-item>
          <n-descriptions-item
            v-if="hasVendorRejectReason(activeConstructionOrder)"
            label="拒单原因"
          >
            <span class="status-reason">
              {{ getVendorRejectReason(activeConstructionOrder) || '服务商未填写理由' }}
            </span>
          </n-descriptions-item>
          <n-descriptions-item label="成交价格">
            ¥{{ activeConstructionOrder.price }}
          </n-descriptions-item>
          <n-descriptions-item label="备注">
            {{ activeConstructionOrder.adminNotes || '-' }}
          </n-descriptions-item>
        </n-descriptions>

        <div class="dispatch-card-actions">
          <n-button
            v-if="!isDispatchStageLocked && activeConstructionOrder.orderStatus === 0"
            type="warning"
            size="small"
            @click="handleReDispatch(activeConstructionOrder.vendorOrderId)"
          >
            重新派单
          </n-button>

          <n-button
            v-if="!isDispatchStageLocked && [1, 3].includes(activeConstructionOrder.orderStatus)"
            type="error"
            size="small"
            @click="handlePreCancel(activeConstructionOrder.vendorOrderId)"
          >
            取消该派单
          </n-button>
        </div>
      </div>

      <n-alert v-else-if="isDispatchStageLocked" type="warning" class="inline-alert-md">
        当前订单已进入施工阶段，施工单位派单信息已锁定。
      </n-alert>

      <div v-else-if="canDispatch">
        <n-card size="small" :bordered="true" title="指派施工单位" embedded>
          <n-space align="center">
            <div class="dispatch-vendor-select">
              <n-select
                :value="constructionForm.vendorId"
                :options="constructionVendorOptions"
                placeholder="选择推荐的施工公司"
                filterable
                clearable
                size="small"
                :loading="loadingVendorOpts"
                @focus="loadBuilders"
                @update:value="updateConstructionFormField('vendorId', $event)"
              />
            </div>
            <n-input-number
              :value="constructionForm.price"
              placeholder="协商价格"
              size="small"
              class="dispatch-price-input"
              :min="0"
              @update:value="updateConstructionFormField('price', $event)"
            >
              <template #prefix>¥</template>
            </n-input-number>
            <n-input
              :value="constructionForm.adminNotes"
              placeholder="派单备注"
              size="small"
              class="dispatch-note-input"
              @update:value="updateConstructionFormField('adminNotes', $event)"
            />
            <n-button
              type="primary"
              size="small"
              :disabled="!constructionForm.vendorId"
              @click="submitConstructionDispatch"
            >
              确认派单
            </n-button>
          </n-space>
        </n-card>
      </div>
    </div>

    <n-divider title-placement="left">材料供应商指派</n-divider>
    <div class="section-block">
      <n-data-table
        :columns="materialColumns"
        :data="materialDispatchList"
        :bordered="true"
        :pagination="false"
        size="small"
      />
    </div>

    <div class="pricing-entry-wrap">
      <div class="pricing-entry-actions">
        <n-button
          v-if="!isReadOnly"
          secondary
          size="large"
          @click="handleOpenUnifiedDetail(detailOrder)"
        >
          追加选配/基础信息
        </n-button>
        <n-button
          v-if="shouldShowConstructionPricingButton"
          type="success"
          size="large"
          :disabled="!canOpenConstructionPricingEntry"
          @click="handleGoToConstructionPricing"
        >
          {{ constructionPricingButtonText }}
        </n-button>
      </div>
      <div
        v-if="shouldShowConstructionPricingButton && !canOpenConstructionPricingEntry"
        class="pricing-entry-hint"
      >
        {{
          !canDispatch
            ? '请先完成合同上传后，再进入“确认开工金额方案”。'
            : '当前订单暂不可进入金额方案确认环节'
        }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
  detailOrder: {
    type: Object,
    default: null,
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
  handleReDispatch: {
    type: Function,
    required: true,
  },
  handlePreCancel: {
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
})

const emit = defineEmits(['update:constructionFormField'])

const updateConstructionFormField = (key, value) => {
  emit('update:constructionFormField', {
    key,
    value,
  })
}
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

.inline-alert-md {
  margin-bottom: 16px;
}

.inline-alert-lg {
  margin-bottom: 20px;
}

.dispatch-alert-accent {
  font-weight: 700;
  color: var(--color-brand-700);
  margin-left: 10px;
}

.vendor-reason-btn {
  margin-left: 6px;
}

.dispatch-card-actions {
  margin-top: 10px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dispatch-vendor-select {
  width: 300px;
}

.dispatch-price-input {
  width: 150px;
}

.dispatch-note-input {
  width: 200px;
}

.pricing-entry-wrap {
  margin-top: 30px;
}

.pricing-entry-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.pricing-entry-hint {
  text-align: center;
  margin-top: 12px;
  color: #c14545;
}

.section-block {
  background: linear-gradient(180deg, #f8fbf8 0%, #f4f7f4 100%);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-soft);
  margin-bottom: 20px;
}

.status-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: 16px;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-xs);
}

.status-with-reason {
  display: inline-flex;
  align-items: center;
}

::v-deep(.n-data-table) {
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-sm) !important;
  border: none !important;

  .n-data-table-th {
    background: linear-gradient(
      135deg,
      var(--color-brand-700) 0%,
      var(--color-brand-900) 100%
    ) !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    border-bottom: none !important;
  }

  .n-data-table-tr:not(.n-data-table-tr--summary):hover {
    .n-data-table-td {
      background-color: rgba(39, 110, 61, 0.05) !important;
    }
  }
}

@media (max-width: 992px) {
  .dispatch-vendor-select,
  .dispatch-price-input,
  .dispatch-note-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .dispatch-card-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: stretch;
  }

  .dispatch-card-actions > * {
    flex: 1 1 100%;
  }

  .dispatch-panel {
    padding: 4px 2px 8px;
    max-height: calc(85vh - 180px);
  }

  .section-block,
  .status-card {
    padding: 14px;
  }
}
</style>
