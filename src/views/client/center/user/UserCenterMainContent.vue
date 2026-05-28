<template>
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
        @update:user-info-field="$emit('update:user-info-field', $event)"
        @update:selected-profile-region-code="
          $emit('update:selected-profile-region-code', $event)
        "
        @update:profile-address-detail="$emit('update:profile-address-detail', $event)"
        @profile-region-update="$emit('profile-region-update', $event)"
        @refresh="$emit('refresh-user-info')"
        @save="$emit('save-user-info')"
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
        :get-design-order-payment-status-type="getDesignOrderPaymentStatusType"
        :format-design-order-payment-status="formatDesignOrderPaymentStatus"
        :can-open-refund-center="canOpenRefundCenter"
        :has-uploaded-contract="hasUploadedContract"
        @update:active-order-status-tag="
          $emit('update:active-order-status-tag', $event)
        "
        @open-payment-statement="$emit('open-order-payment-statement')"
        @open-detail="$emit('open-order-detail', $event)"
        @cancel-order="$emit('cancel-order', $event)"
        @page-change="$emit('order-page-change', $event)"
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
        :get-design-order-payment-status-type="getDesignOrderPaymentStatusType"
        :format-design-order-payment-status="formatDesignOrderPaymentStatus"
        :can-cancel-design-order="canCancelDesignOrder"
        @open-detail="$emit('open-design-order-detail', $event)"
        @cancel-order="$emit('cancel-design-order', $event)"
        @page-change="$emit('design-order-page-change', $event)"
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
        @go-to-house-page="$emit('go-to-house-page', $event)"
        @view-detail="$emit('view-favorite-detail', $event)"
        @cancel-favorite="$emit('cancel-favorite', $event)"
        @page-change="$emit('favorite-page-change', $event)"
      />

      <UserLogoutPanel
        v-else-if="activeMenu === 'logout'"
        @cancel="$emit('cancel-logout')"
        @logout="$emit('logout')"
      />
    </n-space>
  </n-card>
</template>

<script setup>
import UserDesignOrderListPanel from '@/views/client/center/user/UserDesignOrderListPanel.vue'
import UserFavoritePanel from '@/views/client/center/user/UserFavoritePanel.vue'
import UserLogoutPanel from '@/views/client/center/user/UserLogoutPanel.vue'
import UserOrderListPanel from '@/views/client/center/user/UserOrderListPanel.vue'
import UserProfilePanel from '@/views/client/center/user/UserProfilePanel.vue'

defineProps({
  activeMenu: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: '用户',
  },
  userInfo: {
    type: Object,
    required: true,
  },
  selectedProfileRegionCode: {
    type: [Array, String, Number, null],
    default: null,
  },
  profileRegionCascaderOptions: {
    type: Array,
    default: () => [],
  },
  profileAddressForm: {
    type: Object,
    required: true,
  },
  profileAddressPreview: {
    type: String,
    default: '',
  },
  canViewUserProfile: {
    type: Boolean,
    default: false,
  },
  canUpdateUserProfile: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  saveProfileButtonText: {
    type: String,
    default: '保存',
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  formLabelPlacement: {
    type: String,
    default: 'left',
  },
  activeOrderStatusTag: {
    type: String,
    default: 'all',
  },
  orderStatusFilterTabs: {
    type: Array,
    default: () => [],
  },
  loadingOrders: {
    type: Boolean,
    default: false,
  },
  visibleOrderList: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    required: true,
  },
  getOrderProductName: {
    type: Function,
    required: true,
  },
  getStatusType: {
    type: Function,
    required: true,
  },
  formatOrderStatus: {
    type: Function,
    required: true,
  },
  getDesignOrderPaymentStatusType: {
    type: Function,
    required: true,
  },
  formatDesignOrderPaymentStatus: {
    type: Function,
    required: true,
  },
  canOpenRefundCenter: {
    type: Function,
    required: true,
  },
  hasUploadedContract: {
    type: Function,
    required: true,
  },
  loadingDesignOrders: {
    type: Boolean,
    default: false,
  },
  designOrderList: {
    type: Array,
    default: () => [],
  },
  designPagination: {
    type: Object,
    required: true,
  },
  getDesignOrderListMainProductNameText: {
    type: Function,
    required: true,
  },
  getDesignOrderStatusType: {
    type: Function,
    required: true,
  },
  getDesignOrderStatusText: {
    type: Function,
    required: true,
  },
  canCancelDesignOrder: {
    type: Function,
    required: true,
  },
  favorites: {
    type: Array,
    default: () => [],
  },
  loadingFavorites: {
    type: Boolean,
    default: false,
  },
  favoriteActionLoading: {
    type: Object,
    required: true,
  },
  favoritePagination: {
    type: Object,
    required: true,
  },
  defaultFavoriteImage: {
    type: String,
    default: '',
  },
  formatFavoriteStyle: {
    type: Function,
    required: true,
  },
  formatFavoriteArea: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'update:user-info-field',
  'update:selected-profile-region-code',
  'update:profile-address-detail',
  'profile-region-update',
  'refresh-user-info',
  'save-user-info',
  'update:active-order-status-tag',
  'open-order-payment-statement',
  'open-order-detail',
  'cancel-order',
  'order-page-change',
  'open-design-order-detail',
  'cancel-design-order',
  'design-order-page-change',
  'go-to-house-page',
  'view-favorite-detail',
  'cancel-favorite',
  'favorite-page-change',
  'cancel-logout',
  'logout',
])
</script>
