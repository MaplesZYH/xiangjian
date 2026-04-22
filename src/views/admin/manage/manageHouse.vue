<template>
  <HouseToolbar
    :selected-ids="selectedIds"
    :search-house-name="searchHouseName"
    @saved="handleHouseSaved"
    @batch-delete="handleBatchDelete"
    @update:search-house-name="searchHouseName = $event"
    @search="handleSearchHouse"
  />

  <HouseListPanel
    :house-list="houseList"
    :selected-ids="selectedIds"
    :is-all-selected="isAllSelected"
    :is-indeterminate="isIndeterminate"
    :pageinfo="pageinfo"
    @select-all="handleSelectAll"
    @select-one="handleSelect($event.id, $event.checked)"
    @saved="handleHouseSaved"
    @delete-house="handleHouseDelete"
    @page-change="handleGetHouse"
  />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import HouseListPanel from '@/views/admin/house/HouseListPanel.vue'
import HouseToolbar from '@/views/admin/house/HouseToolbar.vue'
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

const handleSearchHouse = () => {
  houseStore.applyHouseNameSearch()
  handleGetHouse()
}

const handleHouseSaved = async () => {
  try {
    handleGetHouse()
    message.success('操作成功')
  } catch (error) {
    console.error('刷新列表失败:', error)
  }
}

const handleHouseDelete = async (id) => {
  try {
    const result = await houseStore.deleteHouses([id])
    message.success(result?.msg || result?.message || '删除成功')
    selectedIds.value = selectedIds.value.filter((itemId) => itemId !== id)
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
