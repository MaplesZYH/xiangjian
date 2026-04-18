<template>
  <div class="userManage">
    <div class="left-actions">
      <EditAdmin type="info" title="添加员工" @update="handleAddAdmin" />

      <Delete
        :isBatch="true"
        :checkedIds="checkedIds"
        @delete="handleBatchDelete"
      />
    </div>

    <div class="search-area search-area--inline">
      <n-input
        v-model:value="searchPhone"
        placeholder="请输入员工手机号"
        clearable
        @clear="handleReset"
        @keydown.enter="handleSearch"
        class="search-input"
      >
      </n-input>
      <n-button type="primary" @click="handleSearch"> 搜索 </n-button>
    </div>
  </div>

  <div class="admin-list admin-shell-list">
    <div class="list-header">
      <div class="header-item center">
        <n-checkbox
          :checked="isAllChecked"
          :indeterminate="isIndeterminate"
          @update:checked="handleCheckAll"
        />
      </div>
      <div class="header-item">角色</div>
      <div class="header-item">姓名</div>
      <div class="header-item">手机号</div>
      <div class="header-item">操作</div>
    </div>

    <div v-if="adminList.length > 0">
      <div v-for="item in adminList" :key="item.id" class="list-row">
        <div class="list-item center">
          <n-checkbox
            :checked="checkedIds.includes(item.id)"
            @update:checked="(checked) => handleCheckOne(checked, item.id)"
          />
        </div>
        <div class="list-item" :title="roleMap[item.roleId] || '未知角色'">
          {{ roleMap[item.roleId] || '未知角色' }}
        </div>
        <div class="list-item" :title="item.name">{{ item.name }}</div>
        <div class="list-item" :title="item.phone">{{ item.phone }}</div>

        <div class="list-item actions">
          <EditAdmin
            type="info"
            title="编辑员工"
            :itemData="item"
            @update="(data, done) => handleUpdateAdmin(data, done)"
          />
          <Delete :itemId="item.id" @delete="handleAdminDelete" />
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <n-empty description="暂无管理员数据" />
    </div>
  </div>

  <div class="pagination-container">
    <n-pagination
      v-model:page="pageinfo.page"
      :page-count="pageinfo.pageCount"
      :page-size="pageinfo.pageSize"
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
import EditAdmin from '@/components/operation/EditAdmin.vue'
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

// 当输入框被清空（比如点击了清除图标或删完了文字）时，自动重置列表
watch(searchPhone, (newVal) => {
  if (!newVal) {
    handleReset()
  }
})

// --- 获取数据 ---
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

// --- 搜索 ---
const handleSearch = () => {
  pageinfo.page = 1
  employeeStore.resetCheckedIds()
  handleGetAdmin()
}

// --- 重置 ---
const handleReset = () => {
  searchPhone.value = ''
  pageinfo.page = 1
  employeeStore.resetCheckedIds()
  handleGetAdmin()
}

// --- 翻页 ---
const handlePageChange = (page) => {
  pageinfo.page = page
  employeeStore.resetCheckedIds()
  handleGetAdmin()
}

// --- 复选框逻辑 ---
const handleCheckAll = (checked) => employeeStore.handleCheckAll(checked)
const handleCheckOne = (checked, id) => employeeStore.handleCheckOne(checked, id)

// 添加 (增加 done 参数)
const handleAddAdmin = async (formData, done) => {
  try {
    const result = await employeeStore.addAdmin(formData)
    if (result.code === 200) {
      message.success('添加成功')
      handleReset()
      if (done) done(true) // 成功：关闭弹窗
    } else {
      message.error(result.msg || '添加失败')
      if (done) done(false) // 失败：保持弹窗
    }
  } catch (error) {
    message.error(error.msg || '操作异常')
    if (done) done(false)
  }
}

// 编辑 (增加 done 参数)
const handleUpdateAdmin = async (formData, done) => {
  try {
    const result = await employeeStore.updateAdmin(formData)
    if (result.code === 200) {
      message.success('更新成功')
      handleGetAdmin()
      if (done) done(true) // 成功：关闭弹窗
    } else {
      message.error(result.msg || '更新失败')
      if (done) done(false) // 失败：保持弹窗
    }
  } catch (error) {
    message.error(error.msg || '操作异常')
    if (done) done(false)
  }
}

// 单个删除
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

// 批量删除 (使用通用 IDs)
const handleBatchDelete = async (ids) => {
  try {
    const result = await employeeStore.deleteAdmins(ids)
    if (result.code === 200) {
      message.success('批量删除成功')

      // 如果全选删完了当前页，回退一页
      const isAllDeleted = adminList.value.every((item) =>
        ids.includes(item.id)
      )
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

<style lang="scss" scoped>
.admin-list {
  .list-header,
  .list-row {
    display: grid;
    /* 第一列给复选框，操作列固定宽度，避免按钮把整列继续撑大 */
    grid-template-columns: 50px minmax(90px, 1fr) minmax(90px, 1fr) minmax(
        140px,
        1.5fr
      ) 210px;
    gap: 16px;
    padding: 12px 16px;
    align-items: center;
    min-width: 680px;
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
  .admin-list {
    .list-header,
    .list-row {
      min-width: 680px;
      gap: 12px;
      padding: 12px;
    }
  }
}
</style>
