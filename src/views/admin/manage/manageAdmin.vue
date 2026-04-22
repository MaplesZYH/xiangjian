<template>
  <EmployeeToolbar
    :checked-ids="checkedIds"
    :search-phone="searchPhone"
    @add-admin="handleAddAdmin"
    @batch-delete="handleBatchDelete"
    @update:search-phone="searchPhone = $event"
    @reset="handleReset"
    @search="handleSearch"
  />

  <EmployeeListPanel
    :admin-list="adminList"
    :checked-ids="checkedIds"
    :is-all-checked="isAllChecked"
    :is-indeterminate="isIndeterminate"
    :role-map="roleMap"
    :pageinfo="pageinfo"
    @check-all="handleCheckAll"
    @check-one="handleCheckOne($event.checked, $event.id)"
    @update-admin="handleUpdateAdmin"
    @delete-admin="handleAdminDelete"
    @page-change="handlePageChange"
  />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import EmployeeListPanel from '@/views/admin/employee/EmployeeListPanel.vue'
import EmployeeToolbar from '@/views/admin/employee/EmployeeToolbar.vue'
import { useAdminEmployeeStore } from '@/stores/admin/useAdminEmployeeStore'

const message = useMessage()
const employeeStore = useAdminEmployeeStore()
const {
  adminList,
  searchPhone,
  checkedIds,
  isAllChecked,
  isIndeterminate,
} = storeToRefs(employeeStore)
const roleMap = employeeStore.roleMap
const pageinfo = employeeStore.pageinfo

watch(searchPhone, (newVal) => {
  if (!newVal) {
    handleReset()
  }
})

const handleGetAdmin = async () => {
  try {
    await employeeStore.fetchAdmins()
  } catch (error) {
    console.error(error)
    message.error(error.msg || '获取数据失败')
    adminList.value = []
    pageinfo.count = 0
    pageinfo.pageCount = 0
  }
}

const handleSearch = () => {
  pageinfo.page = 1
  employeeStore.resetCheckedIds()
  handleGetAdmin()
}

const handleReset = () => {
  searchPhone.value = ''
  pageinfo.page = 1
  employeeStore.resetCheckedIds()
  handleGetAdmin()
}

const handlePageChange = (page) => {
  pageinfo.page = page
  employeeStore.resetCheckedIds()
  handleGetAdmin()
}

const handleCheckAll = (checked) => employeeStore.handleCheckAll(checked)
const handleCheckOne = (checked, id) => employeeStore.handleCheckOne(checked, id)

const handleAddAdmin = async (formData, done) => {
  try {
    const result = await employeeStore.addAdmin(formData)
    if (result.code === 200) {
      message.success('添加成功')
      handleReset()
      if (done) done(true)
    } else {
      message.error(result.msg || '添加失败')
      if (done) done(false)
    }
  } catch (error) {
    message.error(error.msg || '操作异常')
    if (done) done(false)
  }
}

const handleUpdateAdmin = async (formData, done) => {
  try {
    const result = await employeeStore.updateAdmin(formData)
    if (result.code === 200) {
      message.success('更新成功')
      handleGetAdmin()
      if (done) done(true)
    } else {
      message.error(result.msg || '更新失败')
      if (done) done(false)
    }
  } catch (error) {
    message.error(error.msg || '操作异常')
    if (done) done(false)
  }
}

const handleAdminDelete = async (id) => {
  try {
    const result = await employeeStore.deleteAdmins([id])
    if (result.code === 200) {
      message.success('删除成功')
      if (adminList.value.length === 1 && pageinfo.page > 1) {
        pageinfo.page--
      }
      checkedIds.value = checkedIds.value.filter((x) => x !== id)
      handleGetAdmin()
    } else {
      message.error(result.msg || '删除失败')
    }
  } catch (error) {
    message.error(error.msg || '删除异常')
  }
}

const handleBatchDelete = async (ids) => {
  try {
    const result = await employeeStore.deleteAdmins(ids)
    if (result.code === 200) {
      message.success('批量删除成功')

      const isAllDeleted = adminList.value.every((item) => ids.includes(item.id))
      if (isAllDeleted && pageinfo.page > 1) {
        pageinfo.page--
      }

      employeeStore.resetCheckedIds()
      handleGetAdmin()
    } else {
      message.error(result.msg || '删除失败')
    }
  } catch (error) {
    message.error(error.msg || '批量删除异常')
  }
}

onMounted(() => {
  handleGetAdmin()
})
</script>
