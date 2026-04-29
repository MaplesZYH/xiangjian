<template>
  <n-space vertical>
    <div class="client-center-header">
      <n-h2>企业工作台</n-h2>
      <div v-if="vendorInfo.id">
        <n-tag v-if="vendorInfo.status === 1" type="success" size="large">
          <template #icon>
            <n-icon :component="CheckmarkCircle" />
          </template>
          审核通过
        </n-tag>
        <n-tag v-else-if="vendorInfo.status === 2" type="info" size="large">
          <template #icon>
            <n-icon :component="Time" />
          </template>
          审核中
        </n-tag>
        <n-tag v-else-if="vendorInfo.status === 0" type="error" size="large">
          <template #icon>
            <n-icon :component="CloseCircle" />
          </template>
          审核驳回
        </n-tag>
      </div>
    </div>

    <n-alert v-if="vendorInfo.status === 2" type="info" title="审核进度">
      您的入驻申请正在审核中，请耐心等待。
    </n-alert>
    <n-alert v-if="vendorInfo.status === 0" type="error" title="申请被驳回">
      驳回原因：{{ vendorInfo.message || '未提供具体原因' }}
    </n-alert>

    <n-spin :show="loading">
      <n-card v-if="vendorInfo.id" title="企业基本信息">
        <template #header-extra>
          <n-button
            v-if="canEditVendorInfo"
            type="primary"
            tertiary
            @click="$emit('edit')"
          >
            修改信息
          </n-button>
        </template>

        <n-descriptions
          :label-placement="isCompactViewport ? 'top' : 'left'"
          bordered
          :column="1"
          :label-style="
            isCompactViewport ? undefined : 'width: 120px; font-weight: bold;'
          "
        >
          <n-descriptions-item label="公司名称">
            <span class="vendor-company-name">{{ vendorInfo.companyName }}</span>
          </n-descriptions-item>
          <n-descriptions-item label="账号">
            {{ vendorInfo.username || '--' }}
          </n-descriptions-item>
          <n-descriptions-item label="服务类型">
            <n-tag :type="getServiceTypeTag(vendorInfo.serviceType)">
              {{ getServiceTypeText(vendorInfo.serviceType) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item
            v-if="vendorInfo.materialCategory?.length"
            label="主营材料"
          >
            <n-space class="vendor-material-tags" wrap>
              <n-tag
                v-for="(mat, index) in vendorInfo.materialCategory"
                :key="mat.id"
                size="small"
                :bordered="false"
                class="vendor-material-tag"
                :style="getMaterialTagStyle(index)"
              >
                {{ mat.name }}
              </n-tag>
            </n-space>
          </n-descriptions-item>
          <n-descriptions-item label="负责人">
            {{ vendorInfo.companyChargerName }}
          </n-descriptions-item>
          <n-descriptions-item label="联系电话">
            {{ vendorInfo.phone }}
          </n-descriptions-item>
          <n-descriptions-item label="公司地址">
            {{ vendorInfo.companyAddress }}
          </n-descriptions-item>
          <n-descriptions-item label="公司介绍">
            {{ vendorInfo.companyIntroduction || '暂无介绍' }}
          </n-descriptions-item>
        </n-descriptions>

        <n-divider title-placement="left">资质证书</n-divider>
        <div v-if="vendorInfo.certificate?.length > 0" class="cert-grid">
          <div
            v-for="(cert, index) in vendorInfo.certificate"
            :key="index"
            class="cert-item"
          >
            <div class="cert-card">
              <n-icon size="40" color="var(--color-brand-700)">
                <DocumentTextOutline />
              </n-icon>
              <div class="cert-name">资质文件 {{ index + 1 }}</div>
              <a :href="cert.fileUrl" target="_blank" class="cert-link">
                查看/下载
              </a>
            </div>
          </div>
        </div>
        <n-empty v-else description="暂无资质文件" />
      </n-card>

      <n-empty v-else description="无法加载企业信息" />
    </n-spin>
  </n-space>
</template>

<script setup>
import {
  CheckmarkCircle,
  CloseCircle,
  DocumentTextOutline,
  Time,
} from '@/icons/ionicons'

defineProps({
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
})

defineEmits(['edit'])
</script>

<style lang="scss" scoped>
.vendor-company-name {
  font-size: 1.1em;
  color: #333;
}

.vendor-material-tags {
  gap: 8px 10px !important;
}

.vendor-material-tag {
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.cert-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.cert-item {
  width: 150px;
  height: 150px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-soft);
}

.cert-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.cert-name {
  font-size: 12px;
  color: #666;
}

.cert-link {
  font-size: 12px;
  color: var(--color-brand-900);
  text-decoration: none;
}

@media (max-width: 768px) {
  .cert-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .cert-item {
    width: auto;
    height: auto;
    min-height: 132px;
    padding: 12px;
  }
}

@media (max-width: 576px) {
  .cert-grid {
    grid-template-columns: 1fr;
  }
}
</style>
