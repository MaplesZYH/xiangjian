<template>
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
      @edit="$emit('edit')"
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
      @update:order-status-tab="$emit('update:order-status-tab', $event)"
      @accept="$emit('accept', $event)"
      @reject="$emit('reject', $event)"
      @cancel="$emit('cancel', $event)"
      @open-detail="$emit('open-detail', $event)"
      @page-change="$emit('page-change', $event)"
    />

    <ProviderLogoutPanel
      v-else-if="activeMenu === 'logout'"
      @cancel="$emit('cancel-logout')"
      @logout="$emit('logout')"
    />
  </n-card>
</template>

<script setup>
import ProviderCompanyPanel from '@/views/client/center/provider/ProviderCompanyPanel.vue'
import ProviderLogoutPanel from '@/views/client/center/provider/ProviderLogoutPanel.vue'
import ProviderOrderListPanel from '@/views/client/center/provider/ProviderOrderListPanel.vue'

defineProps({
  activeMenu: {
    type: String,
    required: true,
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  vendorInfo: {
    type: Object,
    default: () => ({}),
  },
  canEditVendorInfo: {
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
  getMaterialTagStyle: {
    type: Function,
    required: true,
  },
  orderStatusTab: {
    type: String,
    default: '1',
  },
  unrepliedOrderCount: {
    type: Number,
    default: 0,
  },
  acceptedNeedHandleCount: {
    type: Number,
    default: 0,
  },
  ordersLoading: {
    type: Boolean,
    default: false,
  },
  orderList: {
    type: Array,
    default: () => [],
  },
  sortedOrderList: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    required: true,
  },
  isNeedHandleConstructionStatus: {
    type: Function,
    required: true,
  },
  canCancelVendorOrder: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'edit',
  'update:order-status-tab',
  'accept',
  'reject',
  'cancel',
  'open-detail',
  'page-change',
  'cancel-logout',
  'logout',
])
</script>
