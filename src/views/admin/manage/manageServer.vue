<template>
  <div class="userManage">
    <div class="left-actions">
      <Delete
        :isBatch="true"
        :checkedIds="checkedIds"
        @delete="handleBatchDelete"
      />
    </div>

    <div class="search-area search-area--inline">
      <n-input
        v-model:value="searchName"
        placeholder="请输入公司名称"
        clearable
        @clear="handleReset"
        @keydown.enter="handleSearch"
        class="search-input"
      >
      </n-input>
      <n-button type="primary" @click="handleSearch"> 搜索 </n-button>
    </div>
  </div>

  <n-tabs
    v-model:value="currentStatus"
    type="line"
    animated
    @update:value="handleTabChange"
    class="status-tabs"
  >
    <n-tab-pane :name="1" tab="已通过" />
    <n-tab-pane :name="2" tab="待审核" />
    <n-tab-pane :name="0" tab="未通过" />
  </n-tabs>

  <div class="house-list admin-shell-list">
    <div class="house-table">
      <div class="house-header">
        <div class="header-item center">
          <n-checkbox
            :checked="isAllChecked"
            :indeterminate="isIndeterminate"
            @update:checked="handleCheckAll"
          />
        </div>
        <div class="header-item">公司名称</div>
        <div class="header-item">负责人/电话</div>
        <div class="header-item">地址</div>
        <div class="header-item">服务类型</div>
        <div class="header-item">状态</div>
        <div class="header-item">操作</div>
      </div>

      <n-spin :show="loading" class="house-spin">
        <div v-if="serviceList.length > 0" class="house-body">
          <div v-for="item in serviceList" :key="item.id" class="house-item">
            <div class="list-item center">
              <n-checkbox
                :checked="checkedIds.includes(item.id)"
                @update:checked="(checked) => handleCheckOne(checked, item.id)"
              />
            </div>
            <div class="list-item" :title="item.companyName">
              {{ item.companyName || 'N/A' }}
            </div>
            <div class="list-item">
              {{ item.companyChargerName }} <br />
              <span class="vendor-phone">{{ item.phone }}</span>
            </div>
            <div class="list-item" :title="item.companyAddress">
              {{ item.companyAddress || 'N/A' }}
            </div>

            <div class="list-item">
              <n-tag :bordered="false" type="info" size="small">
                {{ getServiceTypeName(item.serviceType) }}
              </n-tag>
            </div>

            <div class="list-item">
              <n-tag :type="formatStatus(item.status ?? currentStatus).type" size="small">
                {{ formatStatus(item.status ?? currentStatus).text }}
              </n-tag>
            </div>

            <div class="list-item actions">
              <template v-if="currentStatus === 2">
                <n-button
                  size="small"
                  type="info"
                  @click="handleShowAudit(item)"
                >
                  审核
                </n-button>
                <Delete
                  size="small"
                  :itemId="item.id"
                  @delete="handleDeleteService"
                />
              </template>

              <template v-if="currentStatus === 1">
                <n-button size="small" type="info" @click="handleViewDetail(item)"
                  >查看</n-button
                >
                <Delete
                  size="small"
                  :itemId="item.id"
                  @delete="handleDeleteService"
                />
              </template>

              <template v-if="currentStatus === 0">
                <n-button size="small" type="info" @click="handleViewDetail(item)"
                  >详情</n-button
                >
                <Delete
                  size="small"
                  :itemId="item.id"
                  @delete="handleDeleteService"
                />
              </template>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <n-empty description="暂无相关服务商数据" />
        </div>
      </n-spin>
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      v-model:page="pageInfo.page"
      :page-count="pageInfo.pageCount"
      :page-size="pageInfo.pageSize"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="handlePageChange"
    />
  </div>

  <n-modal
    v-model:show="showAuditModal"
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
          :span="2"
          v-if="
            detailVendor.materialCategory &&
            detailVendor.materialCategory.length > 0
          "
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

        <n-grid-item
          :span="2"
          v-if="currentStatus === 0 && detailVendor.message"
        >
          <strong>未通过备注：</strong>
          <n-alert
            title=""
            type="error"
            :bordered="false"
            class="detail-alert-offset"
          >
            {{ detailVendor.message }}
          </n-alert>
        </n-grid-item>
      </n-grid>

      <n-divider title-placement="left">资质文件</n-divider>
      <div class="cert-list">
        <div
          v-if="
            !detailVendor.certificate || detailVendor.certificate.length === 0
          "
          class="cert-empty"
        >
          暂无资质文件
        </div>
        <div v-else class="cert-grid">
          <div
            v-for="(cert, index) in detailVendor.certificate"
            :key="cert.id || cert.fileUrl || index"
            class="cert-item"
          >
            <div class="cert-item__head">
              <div class="cert-item__badge">资质 {{ index + 1 }}</div>
              <div class="cert-item__type">
                {{ getCertFileExt(cert.fileUrl) }}
              </div>
            </div>
            <div class="cert-item__name" :title="getCertFileName(cert.fileUrl, index)">
              {{ getCertFileName(cert.fileUrl, index) }}
            </div>
            <div class="cert-item__actions">
              <a
                :href="getCertResolvedUrl(cert.fileUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="cert-action view"
              >
                在线查看
              </a>
              <a
                :href="getCertResolvedUrl(cert.fileUrl)"
                target="_blank"
                rel="noopener noreferrer"
                :download="getCertFileName(cert.fileUrl, index)"
                class="cert-action download"
              >
                下载文件
              </a>
            </div>
          </div>
        </div>
      </div>

      <n-divider />

      <div class="modal-actions" v-if="currentStatus === 2">
        <n-button type="error" @click="openRejectModal">驳回申请</n-button>
        <n-button type="success" @click="submitAudit(1)">通过审核</n-button>
      </div>
      <div class="modal-actions" v-else>
        <n-button @click="showAuditModal = false">关闭</n-button>
      </div>
    </div>
  </n-modal>

  <n-modal
    v-model:show="showRejectInput"
    preset="dialog"
    title="驳回申请"
    positive-text="确认驳回"
    negative-text="取消"
    @positive-click="submitAudit(0)"
    @negative-click="showRejectInput = false"
  >
    <div class="reject-input-wrap">
      <n-input
        v-model:value="rejectMessage"
        type="textarea"
        placeholder="请输入驳回的具体原因..."
        :autosize="{ minRows: 3 }"
      />
    </div>
  </n-modal>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import Delete from '@/components/operation/Delete.vue'
import { useAdminVendorStore } from '@/stores/vendor/useAdminVendorStore'
import { resolveAssetUrl } from '@/utils/asset'

const message = useMessage()
const vendorStore = useAdminVendorStore()
const {
  currentStatus,
  searchName,
  serviceList,
  checkedIds,
  loading,
  detailVendor,
  isAllChecked,
  isIndeterminate,
} = storeToRefs(vendorStore)
const pageInfo = vendorStore.pageInfo
const getErrorMessage = (error, fallback) =>
  error?.msg ||
  error?.response?.data?.msg ||
  error?.response?.data?.message ||
  (typeof error?.response?.data === 'string' ? error.response.data : '') ||
  error?.message ||
  fallback

const { getServiceTypeName, formatStatus, getCertFileName } = vendorStore

const getCertResolvedUrl = (url) => resolveAssetUrl(url || '')

const getCertFileExt = (url) => {
  const fileName = getCertFileName(url)
  const ext = fileName.includes('.') ? fileName.split('.').pop() : ''
  return ext ? ext.toUpperCase() : 'FILE'
}

/* --- 数据获取 --- */
const fetchData = async () => {
  try {
    const res = await vendorStore.fetchData()
    if (
      res &&
      !(
        res.code === 200 ||
        (res.code === 500 && res.msg && res.msg.includes('未查询到'))
      )
    ) {
      message.error(res.msg || '数据加载失败')
    }
  } catch (err) {
    const errorMsg = getErrorMessage(err, '')
    if (errorMsg.includes('未查询到')) {
      serviceList.value = []
      pageInfo.count = 0
      pageInfo.pageCount = 0
    } else {
      console.error(err)
      message.error(errorMsg || '数据加载异常')
    }
  }
}

/* --- 搜索 & 分页 --- */
const handleSearch = () => {
  pageInfo.page = 1
  vendorStore.resetCheckedIds()
  fetchData()
}
const handleReset = () => {
  searchName.value = ''
  pageInfo.page = 1
  vendorStore.resetCheckedIds()
  fetchData()
}
const handlePageChange = (page) => {
  pageInfo.page = page
  vendorStore.resetCheckedIds()
  fetchData()
}
const handleTabChange = (val) => {
  currentStatus.value = val
  searchName.value = ''
  pageInfo.page = 1
  vendorStore.resetCheckedIds()
  fetchData()
}

/* --- 多选逻辑 --- */
const handleCheckAll = (checked) => vendorStore.handleCheckAll(checked)
const handleCheckOne = (checked, id) => vendorStore.handleCheckOne(checked, id)

/* --- 批量删除逻辑 --- */
const handleBatchDelete = async (ids) => {
  if (!ids || ids.length === 0) return

  try {
    const res = await vendorStore.deleteVendors(ids)

    if (res.code === 200) {
      message.success('批量删除成功')

      const isAllDeleted = serviceList.value.every((item) =>
        ids.includes(item.id)
      )
      if (isAllDeleted && pageInfo.page > 1) {
        pageInfo.page--
      }

      vendorStore.resetCheckedIds()
      fetchData()
    } else {
      message.error(res.msg || '批量删除失败')
    }
  } catch (err) {
    message.error('删除操作异常')
  }
}

/* --- 单条删除逻辑 --- */
const handleDeleteService = async (id) => {
  try {
    const res = await vendorStore.deleteVendors([id])
    if (res.code === 200) {
      message.success('删除成功')
      if (serviceList.value.length === 1 && pageInfo.page > 1) pageInfo.page--
      checkedIds.value = checkedIds.value.filter((x) => x !== id)
      fetchData()
    } else {
      message.error(res.msg || '删除失败')
    }
  } catch (err) {
    message.error('删除操作异常')
  }
}

/* --- 审核与详情 --- */
const showAuditModal = ref(false)
const showRejectInput = ref(false)
const rejectMessage = ref('')

const handleShowAudit = async (item) => {
  try {
    const res = await vendorStore.fetchVendorDetail(item.id)
    if (res.code === 200) {
      showAuditModal.value = true
    } else {
      message.error(res.msg || '无法获取详情')
    }
  } catch (err) {
    message.error(getErrorMessage(err, '无法获取详情'))
  }
}
const handleViewDetail = (item) => handleShowAudit(item)

const openRejectModal = () => {
  rejectMessage.value = ''
  showRejectInput.value = true
}

const submitAudit = async (audit) => {
  if (audit === 0 && !rejectMessage.value.trim()) {
    message.warning('请输入驳回理由')
    return
  }
  try {
    const res = await vendorStore.auditVendor({
      id: detailVendor.value.id,
      audit,
      message: audit === 0 ? rejectMessage.value : '',
    })
    if (res.code === 200) {
      message.success(audit === 1 ? '审核通过' : '已驳回')
      showRejectInput.value = false
      showAuditModal.value = false
      vendorStore.resetDetailVendor()
      fetchData()
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch (err) {
    message.error('操作异常')
  }
}

watch(showAuditModal, (show) => {
  if (!show) {
    vendorStore.resetDetailVendor()
  }
})

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.status-tabs {
  margin-bottom: 20px;

  :deep(.n-tabs-nav .n-tabs-tab) {
    border-radius: 8px 8px 0 0;
    padding: 8px 14px;
    font-weight: 600;
    color: #4b5563;
    transition: all 0.2s ease;
  }

  :deep(.n-tabs-nav .n-tabs-tab:nth-child(1)) {
    color: #059669;
  }

  :deep(.n-tabs-nav .n-tabs-tab:nth-child(2)) {
    color: #b45309;
  }

  :deep(.n-tabs-nav .n-tabs-tab:nth-child(3)) {
    color: #dc2626;
  }

  :deep(.n-tabs-nav .n-tabs-tab.n-tabs-tab--active) {
    background: #f3f4f6;
  }
}

.house-list {
  --house-grid-columns: 50px minmax(140px, 1.35fr) minmax(130px, 1.2fr)
    minmax(140px, 1.35fr) minmax(80px, 0.72fr) minmax(72px, 0.62fr) 270px;
  --house-table-min-width: 1020px;

  width: 100%;

  .house-table {
    min-width: var(--house-table-min-width);
    width: 100%;
  }

  .house-spin {
    width: 100%;

    :deep(.n-spin-content) {
      width: 100%;
    }
  }

  .house-header,
  .house-body {
    min-width: var(--house-table-min-width);
    box-sizing: border-box;
  }

  .house-header,
  .house-item {
    display: grid;
    grid-template-columns: var(--house-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--house-table-min-width);
    box-sizing: border-box;
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.vendor-phone {
  color: var(--color-text-muted);
  font-size: 12px;
}

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

  .cert-list {
    margin-top: 12px;

    .cert-empty {
      color: #9ca3af;
      font-style: italic;
      padding: 8px 2px;
    }

    .cert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .cert-item {
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      padding: 12px;
      background: linear-gradient(180deg, var(--color-surface) 0%, #f8fbf8 100%);
      box-shadow: var(--shadow-xs);

      .cert-item__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }

      .cert-item__badge {
        background: rgba(39, 110, 61, 0.1);
        color: var(--color-brand-700);
        border: 1px solid rgba(39, 110, 61, 0.18);
        border-radius: 999px;
        font-size: 12px;
        padding: 2px 8px;
        white-space: nowrap;
      }

      .cert-item__name {
        font-weight: 600;
        color: #111827;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 10px;
      }

      .cert-item__type {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(60, 64, 97, 0.08);
        border: 1px solid rgba(60, 64, 97, 0.16);
        color: var(--color-accent-700);
        font-size: 12px;
        font-weight: 600;
      }

      .cert-item__actions {
        display: flex;
        gap: 8px;
      }

      .cert-action {
        flex: 1;
        text-align: center;
        text-decoration: none;
        font-size: 12px;
        padding: 6px 8px;
        border-radius: var(--radius-sm);
        border: 1px solid transparent;
        transition: all 0.2s ease;
      }

      .cert-action.view {
        background: rgba(39, 110, 61, 0.08);
        color: var(--color-brand-700);
        border-color: rgba(39, 110, 61, 0.18);
      }

      .cert-action.download {
        background: rgba(60, 64, 97, 0.08);
        color: var(--color-accent-700);
        border-color: rgba(60, 64, 97, 0.18);
      }

      .cert-action:hover {
        filter: brightness(0.97);
      }
    }
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }
}

.reject-input-wrap {
  margin-top: 10px;
}

.edit-alert {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .status-tabs {
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

  .detail-container {
    .cert-list .cert-grid {
      grid-template-columns: 1fr;
    }

    .cert-list .cert-item {
      .cert-item__head,
      .cert-item__actions {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .modal-actions {
      width: 100%;
    }
  }

  .modal-actions {
    width: 100%;
    justify-content: stretch;
  }

  .modal-actions > * {
    flex: 1 1 100%;
  }
}
</style>
