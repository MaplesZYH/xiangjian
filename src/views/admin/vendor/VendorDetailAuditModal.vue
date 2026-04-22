<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="服务商详情"
    style="width: min(700px, calc(100vw - 24px))"
  >
    <div v-if="detailVendor" class="detail-container">
      <n-grid :x-gap="12" :y-gap="12" cols="1 s:2" responsive="screen">
        <n-grid-item>
          <strong>公司名称：</strong>{{ detailVendor.companyName }}
        </n-grid-item>
        <n-grid-item>
          <strong>负责人：</strong>{{ detailVendor.companyChargerName }}
        </n-grid-item>
        <n-grid-item>
          <strong>联系电话：</strong>{{ detailVendor.phone }}
        </n-grid-item>
        <n-grid-item>
          <strong>公司地址：</strong>{{ detailVendor.companyAddress }}
        </n-grid-item>

        <n-grid-item :span="2">
          <strong>服务类型：</strong>
          <n-tag type="info" size="small">
            {{ getServiceTypeName(detailVendor.serviceType) }}
          </n-tag>
        </n-grid-item>

        <n-grid-item
          v-if="detailVendor.materialCategory && detailVendor.materialCategory.length > 0"
          :span="2"
        >
          <strong>主营材料：</strong>
          <div class="detail-mt-sm">
            <n-space size="small">
              <n-tag
                v-for="mat in detailVendor.materialCategory"
                :key="mat.id"
                type="success"
                size="small"
                :bordered="false"
              >
                {{ mat.name }}
              </n-tag>
            </n-space>
          </div>
        </n-grid-item>

        <n-grid-item :span="2">
          <strong>公司简介：</strong>
          <p class="detail-intro">
            {{ detailVendor.companyIntroduction || '暂无介绍' }}
          </p>
        </n-grid-item>

        <n-grid-item v-if="currentStatus === 0 && detailVendor.message" :span="2">
          <strong>未通过备注：</strong>
          <n-alert title="" type="error" :bordered="false" class="detail-alert-offset">
            {{ detailVendor.message }}
          </n-alert>
        </n-grid-item>
      </n-grid>

      <n-divider title-placement="left">资质文件</n-divider>
      <VendorCertificateList
        :certificate-list="detailVendor.certificate || []"
        :get-cert-file-ext="getCertFileExt"
        :get-cert-file-name="getCertFileName"
        :get-cert-resolved-url="getCertResolvedUrl"
      />

      <n-divider />

      <div v-if="currentStatus === 2" class="modal-actions">
        <n-button type="error" @click="emit('open-reject')">驳回申请</n-button>
        <n-button type="success" @click="emit('submit-pass')">通过审核</n-button>
      </div>
      <div v-else class="modal-actions">
        <n-button @click="showModel = false">关闭</n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import VendorCertificateList from '@/views/admin/vendor/VendorCertificateList.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  detailVendor: {
    type: Object,
    default: null,
  },
  currentStatus: {
    type: Number,
    default: 1,
  },
  getServiceTypeName: {
    type: Function,
    required: true,
  },
  getCertFileExt: {
    type: Function,
    required: true,
  },
  getCertFileName: {
    type: Function,
    required: true,
  },
  getCertResolvedUrl: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:show', 'open-reject', 'submit-pass'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.detail-container {
  .detail-mt-sm {
    margin-top: 6px;
  }

  .detail-intro {
    margin-top: 4px;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }

  .detail-alert-offset {
    margin-top: 5px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }
}

@media (max-width: 768px) {
  .detail-container .modal-actions {
    width: 100%;
    justify-content: stretch;
  }

  .detail-container .modal-actions > * {
    flex: 1 1 100%;
  }
}
</style>
