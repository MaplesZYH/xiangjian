<template>
  <VendorToolbar
    :checked-ids="checkedIds"
    :search-name="searchName"
    @batch-delete="handleBatchDelete"
    @update:search-name="searchName = $event"
    @reset="handleReset"
    @search="handleSearch"
  />

  <VendorStatusTabs
    :current-status="currentStatus"
    @update:status="handleTabChange"
  />

  <VendorListPanel
    :service-list="serviceList"
    :checked-ids="checkedIds"
    :loading="loading"
    :is-all-checked="isAllChecked"
    :is-indeterminate="isIndeterminate"
    :current-status="currentStatus"
    :page-info="pageInfo"
    :get-service-type-name="getServiceTypeName"
    :format-status="formatStatus"
    @check-all="handleCheckAll"
    @check-one="handleCheckOne($event.checked, $event.id)"
    @open-audit="handleShowAudit"
    @view-detail="handleViewDetail"
    @delete-service="handleDeleteService"
    @page-change="handlePageChange"
  />

  <VendorDetailAuditModal
    v-model:show="showAuditModal"
    :detail-vendor="detailVendor"
    :current-status="currentStatus"
    :get-service-type-name="getServiceTypeName"
    :get-cert-file-ext="getCertFileExt"
    :get-cert-file-name="getCertFileName"
    :get-cert-resolved-url="getCertResolvedUrl"
    @open-reject="openRejectModal"
    @submit-pass="submitAudit(1)"
  />

  <VendorRejectModal
    v-model:show="showRejectInput"
    :reject-message="rejectMessage"
    @update:reject-message="rejectMessage = $event"
    @confirm="submitAudit(0)"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import VendorDetailAuditModal from '@/views/admin/vendor/VendorDetailAuditModal.vue'
import VendorListPanel from '@/views/admin/vendor/VendorListPanel.vue'
import VendorRejectModal from '@/views/admin/vendor/VendorRejectModal.vue'
import VendorStatusTabs from '@/views/admin/vendor/VendorStatusTabs.vue'
import VendorToolbar from '@/views/admin/vendor/VendorToolbar.vue'
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

const handleCheckAll = (checked) => vendorStore.handleCheckAll(checked)
const handleCheckOne = (checked, id) => vendorStore.handleCheckOne(checked, id)

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
