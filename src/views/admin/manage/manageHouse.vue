<template>
  <div class="userManage">
    <!-- 操作区 -->
    <div class="action-bar">
      <EditHouse title="添加户型" @saved="handleHouseSaved" />
      <n-button size="small" type="error" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
        批量删除
      </n-button>
    </div>

    <div class="search-area search-area--inline">
      <n-input
        v-model:value="searchHouseName"
        placeholder="请输入户型名称"
        clearable
        @clear="handleSearchHouse"
        @keydown.enter="handleSearchHouse"
        class="search-input"
      >
      </n-input>
      <n-button type="primary" @click="handleSearchHouse"> 搜索 </n-button>
    </div>
  </div>

  <div class="house-list admin-shell-list">
    <div class="house-header">
      <div>
        <n-checkbox :checked="isAllSelected" :indeterminate="isIndeterminate" @update:checked="handleSelectAll" />
      </div>
      <div>产品名称</div>
      <div>操作</div>
    </div>

    <div v-for="item in houseList" :key="item.id" class="house-item">
      <div>
        <n-checkbox :value="item.id" :checked="selectedIds.includes(item.id)"
          @update:checked="(checked) => handleSelect(item.id, checked)" />
      </div>
      <div :title="item.name">{{ item.name }}</div>
      <div class="actions">
        <EditHouse title="编辑户型" :itemId="item.id" @saved="handleHouseSaved" />

        <Delete :itemId="item.id" @delete="handleHouseDelete" />
      </div>
    </div>
  </div>
  <div class="pagination-container">
    <n-pagination v-model:page="pageinfo.current" :page-count="pageinfo.pageCount" :page-slot="3" size="large" show-quick-jumper
      @update:page="handleGetHouse" />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import Delete from '@/components/operation/delete.vue'
import EditHouse from '@/components/operation/EditHouse.vue'
import { useAdminHouseStore } from '@/stores/house/useAdminHouseStore'

const message = useMessage()
const houseStore = useAdminHouseStore()
const {
  selectedIds,
  searchHouseName,
  houseList,
  isAllSelected,
  isIndeterminate,
} = storeToRefs(houseStore)
const pageinfo = houseStore.pageinfo

const handleSelectAll = (checked) => houseStore.handleSelectAll(checked)
const handleSelect = (id, checked) => houseStore.handleSelect(id, checked)

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  const d = window.confirm(`确认批量删除选中的 ${selectedIds.value.length} 个户型吗？`)
  if (!d) return

  try {
    const result = await houseStore.deleteHouses(selectedIds.value)
    message.success(result?.msg || result?.message || '批量删除成功')
    houseStore.resetSelectedIds()
    handleGetHouse()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        '批量删除失败'
    )
  }
}

onMounted(() => {
  handleGetHouse()
})

watch(searchHouseName, (newVal) => {
  if (!newVal) {
    handleSearchHouse()
  }
})

const handleGetHouse = async (page = pageinfo.current) => {
  try {
    await houseStore.fetchHouseList(page)
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('获取数据失败')
  }
}

// 处理搜索
const handleSearchHouse = () => {
  houseStore.applyHouseNameSearch()
  handleGetHouse()
}

// 获取产品详情
// const houseDetail = ref([])
// const handleGetHouseDetail = async (id) => {
//   try {
//     const result = await API.getHouseDetail(id)
//     houseDetail.value = result.data
//   } catch (error) {
//     console.error('获取数据失败:', error)
//     message.error('获取数据失败')
//   }
// }

// 获取并实现添加或更新户型
const handleHouseSaved = async () => {
  try {
    // 直接刷新列表
    handleGetHouse()
    message.success('操作成功')
  } catch (error) {
    console.error('刷新列表失败:', error)
  }
}

// 删除户型 (复用批量删除接口)
const handleHouseDelete = async (id) => {
  try {
    const result = await houseStore.deleteHouses([id])
    message.success(result?.msg || result?.message || '删除成功')
    selectedIds.value = selectedIds.value.filter(i => i !== id)
    handleGetHouse()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        '删除失败'
    )
  }
}
</script>

<style lang="scss" scoped>
.userManage {
  padding: 15px;

  .action-bar {
    gap: 12px;
  }
}

.house-list {
}

.house-header,
.house-item {
  display: grid;
  grid-template-columns: 50px minmax(240px, 1fr) 220px;
  gap: 30px;
  padding: 15px;
  align-items: center;
  min-width: 600px;
}

.house-header {
  div {
    text-align: center;
  }
}

.house-item {
  div {
    text-align: center;
  }
}


.actions {
  justify-content: center;
}

@media (max-width: 768px) {
  .userManage {
    padding: 0;
  }

  .house-header,
  .house-item {
    min-width: 600px;
    gap: 16px;
    padding: 12px;
  }
}
</style>
