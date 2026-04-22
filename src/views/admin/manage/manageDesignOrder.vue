<template>
  <div class="design-order-page">
    <DesignOrderSearchBar
      :keyword="filters.keyword"
      :design-status="filters.designStatus"
      :payment-status="filters.paymentStatus"
      :design-status-options="designStatusOptions"
      :payment-status-filter-options="paymentStatusFilterOptions"
      @update:keyword="handleFilterFieldChange('keyword', $event)"
      @update:design-status="handleFilterFieldChange('designStatus', $event)"
      @update:payment-status="handleFilterFieldChange('paymentStatus', $event)"
      @search="handleSearch"
    />

    <DesignOrderListPanel
      :loading="loadingList"
      :order-list="orderList"
      :page-info="pageInfo"
      :get-design-order-list-main-product-text="getDesignOrderListMainProductText"
      :get-design-status-type="getDesignStatusType"
      :get-design-status-text="getDesignStatusText"
      :get-payment-type="getPaymentType"
      :get-payment-text="getPaymentText"
      @open-detail="openDetail"
      @page-change="handlePageChange"
    />

    <DesignOrderDetailModal
      :show="showDetailModal"
      :loading="loadingDetail"
      :current-order="currentOrder"
      :upload-forms="uploadForms"
      :saving-uploads="savingUploads"
      :get-admin-design-order-user-name="getAdminDesignOrderUserName"
      :get-admin-design-order-user-phone="getAdminDesignOrderUserPhone"
      :get-payment-type="getPaymentType"
      :get-payment-text="getPaymentText"
      :get-design-status-type="getDesignStatusType"
      :get-design-status-text="getDesignStatusText"
      :get-bound-main-product-text="getBoundMainProductText"
      :get-display-design-requirements="getDisplayDesignRequirements"
      :get-draft-file-href="getDraftFileHref"
      @update:show="handleDetailModalShowChange"
      @submit-uploads="submitAllUploadForms"
      @delivery-files-selected="handleDraftFilesSelected('delivery', $event)"
      @feedback-files-selected="handleDraftFilesSelected('feedback', $event)"
      @remove-draft-file="handleRemoveDraftFile"
      @clear-draft-files="clearDraftFiles"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import designOrderAPI from '@/api/admin/designOrder'
import fileAPI from '@/api/file'
import houseAPI from '@/api/house/house'
import userDataAPI from '@/api/user/userData'
import DesignOrderDetailModal from '@/views/admin/design-order/DesignOrderDetailModal.vue'
import DesignOrderListPanel from '@/views/admin/design-order/DesignOrderListPanel.vue'
import DesignOrderSearchBar from '@/views/admin/design-order/DesignOrderSearchBar.vue'
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

const getAdminDesignOrderUserName = (order) =>
  order?.userName || order?.name || adminUserInfoMap[order?.userId]?.name || '--'

const getAdminDesignOrderUserPhone = (order) =>
  order?.phoneNumber ||
  order?.userPhone ||
  order?.userPhoneNumber ||
  adminUserInfoMap[order?.userId]?.phoneNumber ||
  '--'

const getFileLabel = (file, index, prefix) => {
  const fileUrl = String(file?.fileUrl || '').trim()
  if (!fileUrl) return `${prefix}${index + 1}`
  const rawName = fileUrl.split('/').pop() || ''
  return decodeURIComponent(rawName) || `${prefix}${index + 1}`
}

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

const handleDraftFilesSelected = (target, fileList) => {
  if (!fileList.length) return
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

const handleRemoveDraftFile = ({ target, key }) => {
  if (!target) return
  removeDraftFile(target, key)
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

const handleFilterFieldChange = (key, value) => {
  filters[key] = value
}

const handleSearch = () => {
  pageInfo.page = 1
  fetchData()
}

const handleDetailModalShowChange = (value) => {
  showDetailModal.value = value
}

onMounted(() => {
  fetchData()
})

watch(showDetailModal, (visible) => {
  if (!visible) {
    cleanupUploadForms()
    currentOrder.value = null
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
</style>
