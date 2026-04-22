<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="设计订单详情"
    :style="{ width: 'min(960px, calc(100vw - 24px))' }"
  >
    <n-spin :show="loading">
      <div v-if="currentOrder" class="design-detail-panel">
        <n-descriptions bordered :column="2" label-placement="left" size="small">
          <n-descriptions-item label="设计单号">
            {{ currentOrder.designOrderNo || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="用户姓名">
            {{ getAdminDesignOrderUserName(currentOrder) }}
          </n-descriptions-item>
          <n-descriptions-item label="设计地址">
            {{ currentOrder.orderAddress || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="手机号">
            {{ getAdminDesignOrderUserPhone(currentOrder) }}
          </n-descriptions-item>
          <n-descriptions-item label="支付状态">
            <n-tag :type="getPaymentType(currentOrder.paymentStatus)">
              {{ getPaymentText(currentOrder.paymentStatus) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="设计状态">
            <n-tag :type="getDesignStatusType(currentOrder.designStatus)">
              {{ getDesignStatusText(currentOrder.designStatus) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="产品名称" :span="2">
            {{ getBoundMainProductText(currentOrder) }}
          </n-descriptions-item>
          <n-descriptions-item label="设计需求" :span="2">
            {{ getDisplayDesignRequirements(currentOrder) }}
          </n-descriptions-item>
          <n-descriptions-item label="客户备注" :span="2">
            {{ currentOrder.customerNotes || '--' }}
          </n-descriptions-item>
        </n-descriptions>

        <n-divider title-placement="left">设计交付文件</n-divider>
        <DesignOrderUploadSection
          :tip-type="uploadForms.delivery.mainProductId ? 'info' : 'warning'"
          :tip-text="deliveryTipText"
          :files="uploadForms.delivery.files"
          empty-description="暂未选择设计交付文件"
          select-button-type="primary"
          select-button-text="选择设计交付文件"
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip,.rar"
          file-label-prefix="设计图"
          :get-draft-file-href="getDraftFileHref"
          @files-selected="emit('delivery-files-selected', $event)"
          @remove-file="emit('remove-draft-file', { target: 'delivery', key: $event })"
          @clear-files="emit('clear-draft-files', 'delivery')"
        />

        <n-divider title-placement="left">补充反馈文件</n-divider>
        <DesignOrderUploadSection
          tip-type="info"
          tip-text="补充反馈文件也会先加入待提交列表，确认后统一保存。"
          :files="uploadForms.feedback.files"
          empty-description="暂未选择补充反馈文件"
          select-button-type="warning"
          select-button-text="选择补充反馈文件"
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip,.rar"
          file-label-prefix="补充文件"
          :get-draft-file-href="getDraftFileHref"
          @files-selected="emit('feedback-files-selected', $event)"
          @remove-file="emit('remove-draft-file', { target: 'feedback', key: $event })"
          @clear-files="emit('clear-draft-files', 'feedback')"
        />
      </div>
    </n-spin>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:show', false)">关闭</n-button>
        <n-button
          type="primary"
          :loading="savingUploads"
          :disabled="loading"
          @click="emit('submit-uploads')"
        >
          保存并上传
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import DesignOrderUploadSection from '@/components/admin/design-order/DesignOrderUploadSection.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  currentOrder: {
    type: Object,
    default: null,
  },
  uploadForms: {
    type: Object,
    required: true,
  },
  savingUploads: {
    type: Boolean,
    default: false,
  },
  getAdminDesignOrderUserName: {
    type: Function,
    required: true,
  },
  getAdminDesignOrderUserPhone: {
    type: Function,
    required: true,
  },
  getPaymentType: {
    type: Function,
    required: true,
  },
  getPaymentText: {
    type: Function,
    required: true,
  },
  getDesignStatusType: {
    type: Function,
    required: true,
  },
  getDesignStatusText: {
    type: Function,
    required: true,
  },
  getBoundMainProductText: {
    type: Function,
    required: true,
  },
  getDisplayDesignRequirements: {
    type: Function,
    required: true,
  },
  getDraftFileHref: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'update:show',
  'submit-uploads',
  'delivery-files-selected',
  'feedback-files-selected',
  'remove-draft-file',
  'clear-draft-files',
])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const deliveryTipText = computed(() =>
  props.uploadForms.delivery.mainProductId
    ? `当前设计订单已绑定主体产品：${props.getBoundMainProductText(props.currentOrder)}。先选择文件并在下方预览，确认后再统一提交。`
    : '当前设计订单未绑定主体产品，暂时无法提交设计交付文件。请确认该订单是否由户型详情页“设计定制”创建。',
)
</script>

<style lang="scss" scoped>
.design-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
