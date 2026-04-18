<template>
  <div class="design-order-page">
    <div class="userManage design-order-toolbar">
      <div class="search-area search-area--inline design-order-search">
        <n-input
          v-model:value="filters.keyword"
          class="search-input design-order-search__keyword"
          placeholder="请输入设计单号或设计地址"
          clearable
          @clear="handleSearch"
          @keydown.enter="handleSearch"
        />
        <n-select
          v-model:value="filters.designStatus"
          class="design-order-search__select"
          placeholder="设计状态"
          :options="designStatusOptions"
          clearable
          @update:value="handleSearch"
        />
        <n-select
          v-model:value="filters.paymentStatus"
          class="design-order-search__select"
          placeholder="支付状态"
          :options="paymentStatusOptions"
          clearable
          @update:value="handleSearch"
        />
        <n-button type="primary" @click="handleSearch">查询</n-button>
      </div>
    </div>

    <div class="design-order-list admin-shell-list">
      <div class="design-order-table">
        <div class="list-header">
          <div class="header-item">设计单号</div>
          <div class="header-item">设计地址</div>
          <div class="header-item">设计状态</div>
          <div class="header-item">支付状态</div>
          <div class="header-item">创建时间</div>
          <div class="header-item actions-header">操作</div>
        </div>

        <n-spin :show="loadingList">
          <div v-if="orderList.length > 0" class="list-body">
            <div v-for="item in orderList" :key="item.id" class="list-row">
              <div class="list-item" :title="item.designOrderNo || '--'">
                {{ item.designOrderNo || '--' }}
              </div>
              <div class="list-item" :title="item.orderAddress || '--'">
                {{ item.orderAddress || '--' }}
              </div>
              <div class="list-item">
                <n-tag :type="getDesignStatusType(item.designStatus)">
                  {{ getDesignStatusText(item.designStatus) }}
                </n-tag>
              </div>
              <div class="list-item">
                <n-tag :type="getPaymentType(item.paymentStatus)">
                  {{ getPaymentText(item.paymentStatus) }}
                </n-tag>
              </div>
              <div class="list-item" :title="formatDateTime(item.createTime)">
                {{ formatDateTime(item.createTime) }}
              </div>
              <div class="list-item actions">
                <n-button type="info" size="small" @click="openDetail(item)">
                  详情/上传
                </n-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <n-empty description="当前暂无设计订单" />
          </div>
        </n-spin>
      </div>
    </div>

    <div class="pagination-container">
      <n-pagination
        v-model:page="pageInfo.page"
        :page-size="pageInfo.pageSize"
        :item-count="pageInfo.itemCount"
        :page-slot="3"
        show-quick-jumper
        @update:page="handlePageChange"
      />
    </div>

    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      title="设计订单详情"
      :style="{ width: 'min(960px, calc(100vw - 24px))' }"
    >
      <n-spin :show="loadingDetail">
        <div v-if="currentOrder" class="design-detail-panel">
          <n-descriptions bordered :column="2" label-placement="left" size="small">
            <n-descriptions-item label="设计单号">
              {{ currentOrder.designOrderNo || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="用户ID">
              {{ currentOrder.userId || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="设计状态">
              <n-tag :type="getDesignStatusType(currentOrder.designStatus)">
                {{ getDesignStatusText(currentOrder.designStatus) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="支付状态">
              <n-tag :type="getPaymentType(currentOrder.paymentStatus)">
                {{ getPaymentText(currentOrder.paymentStatus) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="设计地址">
              {{ currentOrder.orderAddress || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="关联建房订单">
              {{ currentOrder.buildOrderId || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="设计定金">
              ¥{{ formatAmount(currentOrder.depositAmount) }}
            </n-descriptions-item>
            <n-descriptions-item label="已支付金额">
              ¥{{ formatAmount(currentOrder.paidAmount) }}
            </n-descriptions-item>
            <n-descriptions-item label="设计需求" :span="2">
              {{ currentOrder.designRequirements || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="客户备注" :span="2">
              {{ currentOrder.customerNotes || '--' }}
            </n-descriptions-item>
          </n-descriptions>

          <n-divider title-placement="left">设计交付文件</n-divider>
          <div
            v-if="currentOrder.deliveryFiles?.length"
            class="design-file-list"
          >
            <a
              v-for="(file, index) in currentOrder.deliveryFiles"
              :key="`delivery-${file.fileUrl || index}`"
              class="design-file-link"
              :href="file.fileUrl"
              target="_blank"
              rel="noreferrer"
            >
              {{ getFileLabel(file, index, '设计图') }}
            </a>
          </div>
          <n-empty v-else description="暂未上传设计交付文件" />

          <div class="design-upload-block">
            <n-upload
              :custom-request="(options) => handleUploadRequest(options, 'delivery')"
              :show-file-list="false"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip,.rar"
            >
              <n-button :loading="uploading.delivery" type="primary" secondary>
                上传设计交付文件
              </n-button>
            </n-upload>
          </div>

          <n-divider title-placement="left">补充反馈文件</n-divider>
          <div
            v-if="currentOrder.finalFeedbackFiles?.length"
            class="design-file-list"
          >
            <a
              v-for="(file, index) in currentOrder.finalFeedbackFiles"
              :key="`feedback-${file.fileUrl || index}`"
              class="design-file-link"
              :href="file.fileUrl"
              target="_blank"
              rel="noreferrer"
            >
              {{ getFileLabel(file, index, '补充文件') }}
            </a>
          </div>
          <n-empty v-else description="暂无补充反馈文件" />

          <div class="design-upload-block">
            <n-upload
              :custom-request="(options) => handleUploadRequest(options, 'feedback')"
              :show-file-list="false"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip,.rar"
            >
              <n-button :loading="uploading.feedback" type="warning" secondary>
                上传补充反馈文件
              </n-button>
            </n-upload>
          </div>
        </div>
      </n-spin>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import designOrderAPI from '@/api/admin/designOrder'
import fileAPI from '@/api/file'

const message = useMessage()

const loadingList = ref(false)
const loadingDetail = ref(false)
const showDetailModal = ref(false)
const orderList = ref([])
const currentOrder = ref(null)
const filters = reactive({
  keyword: '',
  designStatus: null,
  paymentStatus: null,
})
const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
})
const uploading = reactive({
  delivery: false,
  feedback: false,
})

const designStatusOptions = [
  { label: '待支付定金', value: 0 },
  { label: '设计中', value: 1 },
  { label: '待用户决策', value: 2 },
  { label: '已转建房', value: 3 },
  { label: '暂不建房', value: 4 },
  { label: '已取消', value: 5 },
]

const paymentStatusOptions = [
  { label: '未支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已退款', value: 3 },
]

const getDesignStatusText = (status) => {
  const matched = designStatusOptions.find((item) => item.value === Number(status))
  return matched?.label || '未知状态'
}

const getDesignStatusType = (status) => {
  const numericStatus = Number(status)
  if (numericStatus === 0) return 'warning'
  if (numericStatus === 1) return 'info'
  if (numericStatus === 2) return 'success'
  if (numericStatus === 3) return 'primary'
  if (numericStatus === 4) return 'default'
  if (numericStatus === 5) return 'error'
  return 'default'
}

const getPaymentText = (status) => {
  const matched = paymentStatusOptions.find((item) => item.value === Number(status))
  return matched?.label || '未知状态'
}

const getPaymentType = (status) => {
  const numericStatus = Number(status)
  if (numericStatus === 0) return 'warning'
  if (numericStatus === 1) return 'info'
  if (numericStatus === 2) return 'success'
  if (numericStatus === 3) return 'error'
  return 'default'
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const formatAmount = (value) => Number(value || 0).toLocaleString()

const getFileLabel = (file, index, prefix) => {
  const fileUrl = String(file?.fileUrl || '').trim()
  if (!fileUrl) return `${prefix}${index + 1}`
  const rawName = fileUrl.split('/').pop() || ''
  return decodeURIComponent(rawName) || `${prefix}${index + 1}`
}

const fetchData = async () => {
  loadingList.value = true
  try {
    const res = await designOrderAPI.getPage({
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
      keyword: filters.keyword || undefined,
      designStatus: filters.designStatus,
      paymentStatus: filters.paymentStatus,
    })

    if (res.code !== 200 || !res.data) {
      orderList.value = []
      pageInfo.itemCount = 0
      message.error(res?.msg || '获取设计订单失败')
      return
    }

    orderList.value = Array.isArray(res.data.records)
      ? res.data.records
      : Array.isArray(res.data.rows)
        ? res.data.rows
        : []
    pageInfo.itemCount = Number(res.data.total || orderList.value.length)
  } catch (error) {
    void error
    orderList.value = []
    pageInfo.itemCount = 0
    message.error('获取设计订单失败')
  } finally {
    loadingList.value = false
  }
}

const openDetail = async (row) => {
  if (!row?.id) return

  showDetailModal.value = true
  loadingDetail.value = true
  currentOrder.value = {
    ...row,
  }

  try {
    const res = await designOrderAPI.getDetail(row.id)
    if (res.code === 200 && res.data) {
      currentOrder.value = {
        ...row,
        ...res.data,
      }
      return
    }
    message.error(res?.msg || '获取设计订单详情失败')
  } catch (error) {
    void error
    message.error('获取设计订单详情失败')
  } finally {
    loadingDetail.value = false
  }
}

const persistUploadedFile = async (file, target) => {
  if (!currentOrder.value?.id) {
    throw new Error('未获取到设计订单ID')
  }

  const uploadRes = await fileAPI.upload(file)
  if (uploadRes.code !== 200 || !uploadRes.data) {
    throw new Error(uploadRes?.msg || '文件上传失败')
  }

  const existingFiles =
    target === 'delivery'
      ? currentOrder.value.deliveryFiles || []
      : currentOrder.value.finalFeedbackFiles || []

  const nextFiles = [
    ...existingFiles,
    {
      fileUrl: String(uploadRes.data),
    },
  ]

  const payload = {
    designOrderId: currentOrder.value.id,
    files: nextFiles,
  }

  const saveRes =
    target === 'delivery'
      ? await designOrderAPI.uploadDeliveryFiles(payload)
      : await designOrderAPI.uploadFeedbackFiles(payload)

  if (saveRes.code !== 200) {
    throw new Error(saveRes?.msg || '保存文件失败')
  }

  if (target === 'delivery') {
    currentOrder.value.deliveryFiles = nextFiles
  } else {
    currentOrder.value.finalFeedbackFiles = nextFiles
  }
}

const handleUploadRequest = async ({ file, onFinish, onError }, target) => {
  uploading[target] = true
  try {
    await persistUploadedFile(file.file, target)
    message.success(target === 'delivery' ? '设计交付文件上传成功' : '补充反馈文件上传成功')
    await fetchData()
    onFinish()
  } catch (error) {
    message.error(error?.message || '文件上传失败')
    onError()
  } finally {
    uploading[target] = false
  }
}

const handlePageChange = (page) => {
  pageInfo.page = page
  fetchData()
}

const handleSearch = () => {
  pageInfo.page = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.design-order-page {
  width: 100%;
}

.design-order-toolbar {
  margin-bottom: 20px;
}

.design-order-search {
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: 12px;
}

.design-order-search__keyword {
  width: 280px;
  min-width: 280px;
}

.design-order-search__select {
  width: 160px;
  min-width: 160px;
}

.design-order-list {
  --design-order-grid-columns: minmax(140px, 1.2fr) minmax(220px, 1.9fr) minmax(
      120px,
      1fr
    ) minmax(110px, 0.9fr) minmax(150px, 1.1fr) 140px;
  --design-order-table-min-width: 930px;

  width: 100%;

  .design-order-table {
    min-width: var(--design-order-table-min-width);
    width: 100%;
  }

  .list-header,
  .list-body {
    min-width: var(--design-order-table-min-width);
    box-sizing: border-box;
  }

  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: var(--design-order-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--design-order-table-min-width);
    box-sizing: border-box;
  }

  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.design-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.design-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.design-file-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background: #f3f7f4;
  color: #276e3d;
  font-weight: 600;
  text-decoration: none;
}

.design-upload-block {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .design-order-search {
    width: 100%;
    justify-content: stretch;
  }

  .design-order-search__keyword,
  .design-order-search__select {
    width: 100%;
    min-width: 100%;
  }

  .design-order-list {
    --design-order-table-min-width: 930px;

    .list-header,
    .list-row {
      gap: 12px;
      padding: 12px;
    }
  }
}
</style>
