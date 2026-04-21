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
          :options="paymentStatusFilterOptions"
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
          <div class="header-item">产品名称</div>
          <div class="header-item">设计状态</div>
          <div class="header-item">支付状态</div>
          <div class="header-item actions-header">操作</div>
        </div>

        <n-spin :show="loadingList" class="design-order-spin">
          <div v-if="orderList.length > 0" class="list-body">
            <div v-for="item in orderList" :key="item.id" class="list-row">
              <div class="list-item" :title="item.designOrderNo || '--'">
                {{ item.designOrderNo || '--' }}
              </div>
              <div class="list-item" :title="item.orderAddress || '--'">
                {{ item.orderAddress || '--' }}
              </div>
              <div class="list-item" :title="getDesignOrderListMainProductText(item)">
                {{ getDesignOrderListMainProductText(item) }}
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
          <n-form class="design-upload-form" label-placement="top">
            <n-alert
              :type="uploadForms.delivery.mainProductId ? 'info' : 'warning'"
              class="design-upload-tip"
            >
              {{
                uploadForms.delivery.mainProductId
                  ? `当前设计订单已绑定主体产品：${getBoundMainProductText(currentOrder)}。先选择文件并在下方预览，确认后再统一提交。`
                  : '当前设计订单未绑定主体产品，暂时无法提交设计交付文件。请确认该订单是否由户型详情页“设计定制”创建。'
              }}
            </n-alert>

            <n-form-item label="文件预览">
              <div v-if="uploadForms.delivery.files.length" class="design-upload-preview-list">
                <div
                  v-for="(file, index) in uploadForms.delivery.files"
                  :key="file.key"
                  class="design-upload-preview-item"
                >
                  <a
                    class="design-file-link"
                    :href="getDraftFileHref(file)"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ file.displayName || getFileLabel(file, index, '设计图') }}
                  </a>
                  <div class="design-upload-preview-meta">
                    <n-tag size="small" :type="file.isLocal ? 'warning' : 'success'">
                      {{ file.isLocal ? '待上传' : '已保存' }}
                    </n-tag>
                    <n-button text type="error" @click="removeDraftFile('delivery', file.key)">
                      移除
                    </n-button>
                  </div>
                </div>
              </div>
              <n-empty v-else description="暂未选择设计交付文件" />
            </n-form-item>

            <div class="design-upload-block">
              <input
                ref="deliveryFileInputRef"
                class="design-upload-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip,.rar"
                @change="(event) => handleDraftFileChange(event, 'delivery')"
              />
              <n-space>
                <n-button type="primary" secondary @click="openFileSelector('delivery')">
                  选择设计交付文件
                </n-button>
                <n-button
                  tertiary
                  :disabled="!uploadForms.delivery.files.length"
                  @click="clearDraftFiles('delivery')"
                >
                  清空列表
                </n-button>
              </n-space>
            </div>
          </n-form>

          <n-divider title-placement="left">补充反馈文件</n-divider>
          <n-form class="design-upload-form" label-placement="top">
            <n-alert type="info" class="design-upload-tip">
              补充反馈文件也会先加入待提交列表，确认后统一保存。
            </n-alert>

            <n-form-item label="文件预览">
              <div v-if="uploadForms.feedback.files.length" class="design-upload-preview-list">
                <div
                  v-for="(file, index) in uploadForms.feedback.files"
                  :key="file.key"
                  class="design-upload-preview-item"
                >
                  <a
                    class="design-file-link"
                    :href="getDraftFileHref(file)"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ file.displayName || getFileLabel(file, index, '补充文件') }}
                  </a>
                  <div class="design-upload-preview-meta">
                    <n-tag size="small" :type="file.isLocal ? 'warning' : 'success'">
                      {{ file.isLocal ? '待上传' : '已保存' }}
                    </n-tag>
                    <n-button text type="error" @click="removeDraftFile('feedback', file.key)">
                      移除
                    </n-button>
                  </div>
                </div>
              </div>
              <n-empty v-else description="暂未选择补充反馈文件" />
            </n-form-item>

            <div class="design-upload-block">
              <input
                ref="feedbackFileInputRef"
                class="design-upload-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip,.rar"
                @change="(event) => handleDraftFileChange(event, 'feedback')"
              />
              <n-space>
                <n-button type="warning" secondary @click="openFileSelector('feedback')">
                  选择补充反馈文件
                </n-button>
                <n-button
                  tertiary
                  :disabled="!uploadForms.feedback.files.length"
                  @click="clearDraftFiles('feedback')"
                >
                  清空列表
                </n-button>
              </n-space>
            </div>
          </n-form>
        </div>
      </n-spin>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
          <n-button
            type="primary"
            :loading="savingUploads"
            :disabled="loadingDetail"
            @click="submitAllUploadForms"
          >
            保存并上传
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import designOrderAPI from '@/api/admin/designOrder'
import fileAPI from '@/api/file'
import houseAPI from '@/api/house/house'
import userDataAPI from '@/api/user/userData'
import {
  extractDesignOrderProductBinding,
  stripDesignOrderProductBinding,
} from '@/utils/designOrderBinding'

const message = useMessage()

const loadingList = ref(false)
const loadingDetail = ref(false)
const showDetailModal = ref(false)
const orderList = ref([])
const currentOrder = ref(null)
const mainProductNameMap = reactive({})
const orderMainProductTextMap = reactive({})
const adminUserInfoMap = reactive({})
const deliveryFileInputRef = ref(null)
const feedbackFileInputRef = ref(null)
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
const savingUploads = ref(false)
const uploadForms = reactive({
  delivery: {
    mainProductId: null,
    files: [],
  },
  feedback: {
    files: [],
  },
})

const designStatusOptions = [
  { label: '待支付定金', value: 0 },
  { label: '设计中', value: 1 },
  { label: '待用户决策', value: 2 },
  { label: '已转建房', value: 3 },
  { label: '暂不建房', value: 4 },
  { label: '已取消', value: 5 },
]

const paymentStatusFilterOptions = [
  { label: '未支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已退款', value: 3 },
]

const paymentStatusOptions = [
  { label: '未支付', value: 0 },
  { label: '已支付', value: 1 },
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
  if (numericStatus === 3) return 'error'
  return 'default'
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const getAdminDesignOrderUserName = (order) =>
  order?.userName || order?.name || adminUserInfoMap[order?.userId]?.name || '--'

const getAdminDesignOrderUserPhone = (order) =>
  order?.phoneNumber ||
  order?.userPhone ||
  order?.userPhoneNumber ||
  adminUserInfoMap[order?.userId]?.phoneNumber ||
  '--'

const hydrateAdminDesignOrderUserInfo = async (userId) => {
  const numericUserId = Number(userId)
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return null
  }

  if (adminUserInfoMap[numericUserId]) {
    return adminUserInfoMap[numericUserId]
  }

  try {
    const res = await userDataAPI.getUserDataById(numericUserId)
    if (res.code !== 200 || !res.data) {
      return null
    }

    adminUserInfoMap[numericUserId] = {
      name: String(res.data.name || '').trim(),
      phoneNumber: String(res.data.phoneNumber || '').trim(),
    }
    return adminUserInfoMap[numericUserId]
  } catch (error) {
    void error
    return null
  }
}

const getFileLabel = (file, index, prefix) => {
  const fileUrl = String(file?.fileUrl || '').trim()
  if (!fileUrl) return `${prefix}${index + 1}`
  const rawName = fileUrl.split('/').pop() || ''
  return decodeURIComponent(rawName) || `${prefix}${index + 1}`
}

const resolveDeliveryMainProductId = (order) => {
  const deliveredMpId = Number(order?.deliveredMpId)
  if (Number.isFinite(deliveredMpId) && deliveredMpId > 0) {
    return deliveredMpId
  }
  return extractDesignOrderProductBinding(order)?.mainProductId || null
}

const ensureAdminMainProductName = async (mainProductId) => {
  const numericMainProductId = Number(mainProductId)
  if (!Number.isInteger(numericMainProductId) || numericMainProductId <= 0) {
    return ''
  }
  if (mainProductNameMap[numericMainProductId]) {
    return mainProductNameMap[numericMainProductId]
  }

  try {
    const res = await houseAPI.getHouseDetails(numericMainProductId)
    const productName = String(res?.data?.name || '').trim()
    if (productName) {
      mainProductNameMap[numericMainProductId] = productName
      return productName
    }
  } catch (error) {
    void error
  }

  return ''
}

const getBoundMainProductText = (order) => {
  const mainProductId = resolveDeliveryMainProductId(order)
  if (!mainProductId) return '--'
  return mainProductNameMap[mainProductId] || '加载中...'
}

const getDesignOrderListMainProductText = (order) =>
  orderMainProductTextMap[order?.id] || '--'

const hydrateAdminListMainProductNames = async (rows = []) => {
  await Promise.all(
    rows.map(async (row) => {
      const orderId = Number(row?.id)
      if (!Number.isInteger(orderId) || orderId <= 0) return

      try {
        const res = await designOrderAPI.getDetail(orderId)
        if (res.code !== 200 || !res.data) {
          orderMainProductTextMap[orderId] = '--'
          return
        }

        const detail = {
          ...row,
          ...res.data,
        }
        const mainProductId = resolveDeliveryMainProductId(detail)
        if (!mainProductId) {
          orderMainProductTextMap[orderId] = '--'
          return
        }

        const productName = await ensureAdminMainProductName(mainProductId)
        orderMainProductTextMap[orderId] = productName || '--'
      } catch (error) {
        void error
        orderMainProductTextMap[orderId] = '--'
      }
    }),
  )
}

const getDisplayDesignRequirements = (order) =>
  stripDesignOrderProductBinding(order?.designRequirements) || '--'

const buildDraftFileFromRemote = (file, index, prefix) => {
  const fileUrl = String(file?.fileUrl || '').trim()
  return {
    key: `remote-${prefix}-${fileUrl || index}`,
    fileUrl,
    displayName: getFileLabel(file, index, prefix),
    isLocal: false,
    previewUrl: fileUrl,
    file: null,
  }
}

const buildDraftFileFromLocal = (file, target) => {
  const previewUrl = URL.createObjectURL(file)
  return {
    key: `local-${target}-${file.name}-${file.size}-${file.lastModified}`,
    fileUrl: '',
    displayName: file.name,
    isLocal: true,
    previewUrl,
    file,
  }
}

const revokeDraftFilePreview = (file) => {
  if (file?.isLocal && file?.previewUrl) {
    URL.revokeObjectURL(file.previewUrl)
  }
}

const cleanupUploadForms = () => {
  uploadForms.delivery.files.forEach(revokeDraftFilePreview)
  uploadForms.feedback.files.forEach(revokeDraftFilePreview)
  uploadForms.delivery.files = []
  uploadForms.feedback.files = []
  uploadForms.delivery.mainProductId = null
}

const hydrateUploadForms = (order) => {
  cleanupUploadForms()
  uploadForms.delivery.mainProductId = resolveDeliveryMainProductId(order)
  uploadForms.delivery.files = (order?.deliveryFiles || []).map((file, index) =>
    buildDraftFileFromRemote(file, index, '设计图'),
  )
  uploadForms.feedback.files = (order?.finalFeedbackFiles || []).map((file, index) =>
    buildDraftFileFromRemote(file, index, '补充文件'),
  )
}

const getDraftFileHref = (file) => file?.previewUrl || file?.fileUrl || '#'

const openFileSelector = (target) => {
  const inputRef =
    target === 'delivery' ? deliveryFileInputRef.value : feedbackFileInputRef.value
  inputRef?.click()
}

const resetFileInputValue = (target) => {
  const inputRef =
    target === 'delivery' ? deliveryFileInputRef.value : feedbackFileInputRef.value
  if (inputRef) {
    inputRef.value = ''
  }
}

const handleDraftFileChange = (event, target) => {
  const fileList = Array.from(event?.target?.files || [])
  if (!fileList.length) {
    resetFileInputValue(target)
    return
  }

  const targetFiles = uploadForms[target].files
  fileList.forEach((file) => {
    const nextFile = buildDraftFileFromLocal(file, target)
    const duplicateIndex = targetFiles.findIndex((item) => item.key === nextFile.key)
    if (duplicateIndex >= 0) {
      revokeDraftFilePreview(nextFile)
      return
    }
    targetFiles.push(nextFile)
  })

  resetFileInputValue(target)
}

const removeDraftFile = (target, key) => {
  const targetFiles = uploadForms[target].files
  const index = targetFiles.findIndex((file) => file.key === key)
  if (index < 0) return
  revokeDraftFilePreview(targetFiles[index])
  targetFiles.splice(index, 1)
}

const clearDraftFiles = (target) => {
  uploadForms[target].files.forEach(revokeDraftFilePreview)
  uploadForms[target].files = []
  if (target === 'delivery') {
    uploadForms.delivery.mainProductId = resolveDeliveryMainProductId(currentOrder.value)
  }
}

const replaceDraftFiles = (target, files, prefix) => {
  uploadForms[target].files.forEach(revokeDraftFilePreview)
  uploadForms[target].files = files.map((file, index) =>
    buildDraftFileFromRemote(file, index, prefix),
  )
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
    await hydrateAdminListMainProductNames(orderList.value)
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
      const userInfo = await hydrateAdminDesignOrderUserInfo(currentOrder.value.userId)
      if (userInfo && currentOrder.value) {
        currentOrder.value = {
          ...currentOrder.value,
          userName: userInfo.name || currentOrder.value.userName || '',
          phoneNumber: userInfo.phoneNumber || currentOrder.value.phoneNumber || '',
        }
      }
      await ensureAdminMainProductName(resolveDeliveryMainProductId(currentOrder.value))
      hydrateUploadForms(currentOrder.value)
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

const persistUploadedFile = async (file) => {
  const uploadRes = await fileAPI.upload(file)
  if (uploadRes.code !== 200 || !uploadRes.data) {
    throw new Error(uploadRes?.msg || '文件上传失败')
  }
  return String(uploadRes.data)
}

const buildUploadFilesPayload = async (target) => {
  const nextFiles = []
  for (const draftFile of uploadForms[target].files) {
    if (draftFile.isLocal && draftFile.file) {
      const uploadedUrl = await persistUploadedFile(draftFile.file)
      nextFiles.push({ fileUrl: uploadedUrl })
      continue
    }

    if (draftFile.fileUrl) {
      nextFiles.push({ fileUrl: draftFile.fileUrl })
    }
  }
  return nextFiles
}

const applySavedUploadResult = (target, files) => {
  if (!currentOrder.value) return

  if (target === 'delivery') {
    currentOrder.value.deliveryFiles = files
    currentOrder.value.deliveredMpId = uploadForms.delivery.mainProductId
    replaceDraftFiles('delivery', files, '设计图')
    return
  }

  currentOrder.value.finalFeedbackFiles = files
  replaceDraftFiles('feedback', files, '补充文件')
}

const submitAllUploadForms = async () => {
  if (!currentOrder.value?.id) {
    message.error('未获取到设计订单ID')
    return
  }

  const hasDeliveryFiles = uploadForms.delivery.files.length > 0
  const hasFeedbackFiles = uploadForms.feedback.files.length > 0

  if (!hasDeliveryFiles && !hasFeedbackFiles) {
    message.warning('请先选择需要保存的文件')
    return
  }

  if (hasDeliveryFiles && !uploadForms.delivery.mainProductId) {
    message.warning('当前设计订单未绑定主体产品，暂时无法提交设计交付文件')
    return
  }

  savingUploads.value = true
  const savedTargets = []
  try {
    if (hasDeliveryFiles) {
      const nextDeliveryFiles = await buildUploadFilesPayload('delivery')
      const deliveryRes = await designOrderAPI.uploadDeliveryFiles({
        designOrderId: currentOrder.value.id,
        files: nextDeliveryFiles,
        mainProductId: uploadForms.delivery.mainProductId,
      })
      if (deliveryRes.code !== 200) {
        throw new Error(deliveryRes?.msg || '保存设计交付文件失败')
      }
      applySavedUploadResult('delivery', nextDeliveryFiles)
      savedTargets.push('设计交付文件')
    }

    if (hasFeedbackFiles) {
      const nextFeedbackFiles = await buildUploadFilesPayload('feedback')
      const feedbackRes = await designOrderAPI.uploadFeedbackFiles({
        designOrderId: currentOrder.value.id,
        files: nextFeedbackFiles,
      })
      if (feedbackRes.code !== 200) {
        throw new Error(feedbackRes?.msg || '保存补充反馈文件失败')
      }
      applySavedUploadResult('feedback', nextFeedbackFiles)
      savedTargets.push('补充反馈文件')
    }

    if (savedTargets.length > 0) {
      await fetchData()
      message.success(`${savedTargets.join('、')}已保存`)
    }
  } catch (error) {
    const savedText = savedTargets.length ? `，已保存${savedTargets.join('、')}` : ''
    message.error(`${error?.message || '文件上传失败'}${savedText}`)
  } finally {
    savingUploads.value = false
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

watch(showDetailModal, (visible) => {
  if (!visible) {
    cleanupUploadForms()
    currentOrder.value = null
    resetFileInputValue('delivery')
    resetFileInputValue('feedback')
  }
})

onBeforeUnmount(() => {
  cleanupUploadForms()
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
      180px,
      1.2fr
    ) minmax(
      120px,
      1fr
    ) minmax(110px, 0.9fr) 180px;
  --design-order-table-min-width: 1000px;

  width: 100%;

  .design-order-table {
    min-width: var(--design-order-table-min-width);
    width: max-content;
  }

  .design-order-spin {
    width: 100%;

    :deep(.n-spin-content) {
      width: 100%;
    }
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

  .header-item,
  .list-item {
    min-width: 0;
  }

  .list-item {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions-header,
  .actions {
    text-align: center;
    justify-content: center;
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

.design-upload-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.design-upload-tip {
  margin-bottom: 4px;
}

.design-upload-preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.design-upload-preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5efe8;
  border-radius: 10px;
  background: #fafcfb;
}

.design-upload-preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.design-upload-block {
  margin-top: 12px;
}

.design-upload-input {
  display: none;
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
    --design-order-table-min-width: 1000px;

    .list-header,
    .list-row {
      gap: 12px;
      padding: 12px;
    }
  }

  .design-upload-preview-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .design-upload-preview-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
