<template>
  <div class="userManage">
    <div class="left-actions">
      <EditUser title="添加用户" @add-user="handleAddUser" />

      <Delete
        :isBatch="true"
        :checkedIds="checkedIds"
        @delete="handleBatchDelete"
      />
    </div>

    <div class="search-area search-area--inline">
      <n-input
        v-model:value="searchPhone"
        placeholder="请输入手机号查询"
        clearable
        @clear="handleReset"
        @keydown.enter="handleSearch"
        class="search-input"
      >
      </n-input>
      <n-button type="primary" @click="handleSearch"> 搜索 </n-button>
    </div>
  </div>

  <div class="user-list admin-shell-list">
    <div class="user-table">
      <div class="list-header">
        <div class="header-item center">
          <n-checkbox
            :checked="isAllChecked"
            :indeterminate="isIndeterminate"
            @update:checked="handleCheckAll"
          />
        </div>
        <div class="header-item">姓名</div>
        <div class="header-item">手机号</div>
        <div class="header-item">地址</div>
        <div class="header-item">操作</div>
      </div>

      <div v-if="userList.length > 0" class="list-body">
        <div v-for="item in userList" :key="item.id" class="list-row">
          <div class="list-item center">
            <n-checkbox
              :checked="checkedIds.includes(item.id)"
              @update:checked="(checked) => handleCheckOne(checked, item.id)"
            />
          </div>
          <div class="list-item" :title="item.name">{{ item.name }}</div>
          <div class="list-item" :title="item.phoneNumber">{{ item.phoneNumber }}</div>
          <div class="list-item" :title="item.address || '用户暂未填写'">
            {{ item.address || '用户暂未填写' }}
          </div>
          <div class="list-item actions">
            <EditUser
              title="编辑用户"
              :userData="item"
              :isEdit="true"
              @update-user="(data, done) => handleUpdateUser(item.id, data, done)"
            />
            <Delete :itemId="item.id" @delete="handleUserDelete" />
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <n-empty description="暂无用户数据" />
      </div>
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      v-model:page="pageinfo.page"
      :page-count="pageinfo.pageCount"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="handlePageChange"
    />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import Delete from '@/components/operation/Delete.vue'
import EditUser from '@/components/operation/EditUser.vue'
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

// 监听搜索框变化
watch(searchPhone, (newVal) => {
  if (!newVal) {
    handleReset()
  }
})

// 获取数据
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

// 复选框逻辑
const handleCheckAll = (checked) => userStore.handleCheckAll(checked)
const handleCheckOne = (checked, id) => userStore.handleCheckOne(checked, id)

// 批量删除
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

// 添加用户：接收 done 回调
const handleAddUser = async (userData, done) => {
  try {
    const result = await userStore.addUser(userData)
    if (result.code === 200) {
      message.success(result.msg || '添加成功')
      searchPhone.value = ''
      pageinfo.page = 1
      handlegetUser()
      if (done) done(true) // 成功：关闭弹窗
    } else {
      message.error(result.msg || '添加失败')
      if (done) done(false) // 失败：保留弹窗
    }
  } catch (error) {
    message.error(error.msg || '添加用户失败')
    if (done) done(false) // 异常：保留弹窗
  }
}

// 更新用户：接收 done 回调
const handleUpdateUser = async (id, data, done) => {
  try {
    const fullData = { ...data, id: id }
    const result = await userStore.updateUser(fullData)
    if (result.code === 200) {
      message.success(result.msg || '更新成功')
      handlegetUser()
      if (done) done(true) // 成功：关闭弹窗
    } else {
      message.error(result.msg || '更新失败')
      if (done) done(false) // 失败：保留弹窗
    }
  } catch (error) {
    message.error(error.msg || '更新用户失败')
    if (done) done(false) // 异常：保留弹窗
  }
}

// 单个删除
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

<style lang="scss" scoped>
.user-list {
  --user-grid-columns: 50px minmax(90px, 1fr) minmax(120px, 1fr) minmax(
      160px,
      1.5fr
    ) 210px;
  --user-table-min-width: 730px;

  width: 100%;

  .user-table {
    min-width: var(--user-table-min-width);
    width: 100%;
  }

  .list-header,
  .list-body {
    min-width: var(--user-table-min-width);
    box-sizing: border-box;
  }

  .list-header,
  .list-row {
    display: grid;
    grid-template-columns: var(--user-grid-columns);
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: var(--user-table-min-width);
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

@media (max-width: 768px) {
  .user-list {
    --user-table-min-width: 730px;

    .list-header,
    .list-row {
      gap: 12px;
      padding: 12px;
    }
  }
}
</style>
