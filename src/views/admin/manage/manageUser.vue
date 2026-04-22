<template>
  <UserToolbar
    :checked-ids="checkedIds"
    :search-phone="searchPhone"
    @add-user="handleAddUser"
    @batch-delete="handleBatchDelete"
    @update:search-phone="searchPhone = $event"
    @reset="handleReset"
    @search="handleSearch"
  />

  <UserListPanel
    :user-list="userList"
    :checked-ids="checkedIds"
    :is-all-checked="isAllChecked"
    :is-indeterminate="isIndeterminate"
    :pageinfo="pageinfo"
    @check-all="handleCheckAll"
    @check-one="handleCheckOne($event.checked, $event.id)"
    @update-user="handleUpdateUser"
    @delete-user="handleUserDelete"
    @page-change="handlePageChange"
  />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import UserListPanel from '@/views/admin/user/UserListPanel.vue'
import UserToolbar from '@/views/admin/user/UserToolbar.vue'
import { useAdminUserStore } from '@/stores/user/useAdminUserStore'

const message = useMessage()
const userStore = useAdminUserStore()
const {
  userList,
  searchPhone,
  checkedIds,
  isAllChecked,
  isIndeterminate,
} = storeToRefs(userStore)
const pageinfo = userStore.pageinfo

watch(searchPhone, (newVal) => {
  if (!newVal) {
    handleReset()
  }
})

const handlegetUser = async () => {
  try {
    await userStore.fetchUsers()
  } catch (error) {
    console.error('请求异常:', error)
    userList.value = []
    pageinfo.count = 0
    pageinfo.pageCount = 0
    if (error && error.msg) {
      message.error(error.msg)
    } else {
      message.error('获取用户数据失败')
    }
  }
}

const handleCheckAll = (checked) => userStore.handleCheckAll(checked)
const handleCheckOne = (checked, id) => userStore.handleCheckOne(checked, id)

const handleBatchDelete = async (ids) => {
  try {
    const result = await userStore.deleteUsers(ids)
    message.success(result.msg || result.message || '批量删除成功')

    const isAllDeletedOnPage = userList.value.every((item) =>
      ids.includes(item.id)
    )
    if (isAllDeletedOnPage && pageinfo.page > 1) {
      pageinfo.page--
    }

    userStore.resetCheckedIds()
    handlegetUser()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        error.msg ||
        '批量删除失败'
    )
  }
}

const handleSearch = () => {
  pageinfo.page = 1
  userStore.resetCheckedIds()
  handlegetUser()
}

const handleReset = () => {
  searchPhone.value = ''
  pageinfo.page = 1
  userStore.resetCheckedIds()
  handlegetUser()
}

const handlePageChange = (page) => {
  pageinfo.page = page
  handlegetUser()
}

const handleAddUser = async (userData, done) => {
  try {
    const result = await userStore.addUser(userData)
    if (result.code === 200) {
      message.success(result.msg || '添加成功')
      searchPhone.value = ''
      pageinfo.page = 1
      handlegetUser()
      if (done) done(true)
    } else {
      message.error(result.msg || '添加失败')
      if (done) done(false)
    }
  } catch (error) {
    message.error(error.msg || '添加用户失败')
    if (done) done(false)
  }
}

const handleUpdateUser = async (id, data, done) => {
  try {
    const fullData = { ...data, id: id }
    const result = await userStore.updateUser(fullData)
    if (result.code === 200) {
      message.success(result.msg || '更新成功')
      handlegetUser()
      if (done) done(true)
    } else {
      message.error(result.msg || '更新失败')
      if (done) done(false)
    }
  } catch (error) {
    message.error(error.msg || '更新用户失败')
    if (done) done(false)
  }
}

const handleUserDelete = async (id) => {
  try {
    const isLastItemOnPage = userList.value.length === 1
    const isNotFirstPage = pageinfo.page > 1

    const result = await userStore.deleteUsers(id)
    message.success(result.msg || result.message || '删除成功')

    if (isLastItemOnPage && isNotFirstPage) {
      pageinfo.page--
    }

    checkedIds.value = checkedIds.value.filter((x) => x !== id)
    handlegetUser()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        error.msg ||
        '删除失败'
    )
  }
}

onMounted(() => {
  handlegetUser()
})
</script>
