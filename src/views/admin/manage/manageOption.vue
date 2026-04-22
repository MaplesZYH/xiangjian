<template>
  <OptionCategoryToolbar
    :checked-category-ids="checkedCategoryIds"
    @open-add-category="showAddCategory = true"
    @batch-delete="handleBatchDeleteCategory"
  />

  <OptionCategoryCreateModal
    v-model:show="showAddCategory"
    :category-name="categoryName"
    @update:category-name="categoryName = $event"
    @save="handleAddCategory"
  />

  <br /><br />

  <OptionCategoryList
    :categories="CategoriesList"
    :checked-category-ids="checkedCategoryIds"
    :is-all-category-checked="isAllCategoryChecked"
    :is-category-indeterminate="isCategoryIndeterminate"
    :page-info="pageinfo"
    @check-all="handleCheckAllCategories"
    @check-one="handleCategoryChecked($event.id, $event.checked)"
    @edit-products="handleGetOption"
    @delete-category="handleDeleteCategory"
    @page-change="handleGetCategories"
  />

  <OptionProductsModal
    v-model:show="showModal"
    :current-category-name="currentCategoryName"
    :search-keyword="searchKeyword"
    :option-list="OptionList"
    :checked-option-ids="checkedOptionIds"
    :option-page-info="optionPageInfo"
    :show-add-option-modal="showAddOptionModal"
    :show-edit-option-modal="showEditOptionModal"
    :add-option-name="OptionsData.name"
    :add-option-price="OptionsData.price"
    :add-option-description="OptionsData.description"
    :edit-option-name="editingOption.name"
    :edit-option-price="editingOption.price"
    :edit-option-description="editingOption.description"
    @after-leave="resetOptionModalState"
    @update:current-category-name="currentCategoryName = $event"
    @save-category-name="
      handleUpdateCategoryName(currentCategoryId, currentCategoryName)
    "
    @update:show-add-option-modal="handleAddOptionModalToggle"
    @batch-delete-option="handleBatchDeleteOption"
    @update:search-keyword="searchKeyword = $event"
    @search-option="handleSearchOption"
    @update:add-option-name="OptionsData.name = $event"
    @update:add-option-price="OptionsData.price = $event ?? 0"
    @update:add-option-description="OptionsData.description = $event"
    @add-option="handleAddOption"
    @update:show-edit-option-modal="handleEditOptionModalToggle"
    @update:edit-option-name="editingOption.name = $event"
    @update:edit-option-price="editingOption.price = $event ?? 0"
    @update:edit-option-description="editingOption.description = $event"
    @update-option="handleUpdateOption"
    @check-option="handleOptionChecked($event.id, $event.checked)"
    @open-edit-option="openEditOptionModal"
    @delete-option="handleOptionDelete"
    @page-change="handleOptionPageChange"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import OptionCategoryCreateModal from '@/views/admin/option/OptionCategoryCreateModal.vue'
import OptionCategoryList from '@/views/admin/option/OptionCategoryList.vue'
import OptionCategoryToolbar from '@/views/admin/option/OptionCategoryToolbar.vue'
import OptionProductsModal from '@/views/admin/option/OptionProductsModal.vue'
import { useAdminOptionStore } from '@/stores/option/useAdminOptionStore'

const message = useMessage()
const optionStore = useAdminOptionStore()
const {
  CategoriesList,
  checkedCategoryIds,
  categoryName,
  isAllCategoryChecked,
  isCategoryIndeterminate,
  OptionList,
  checkedOptionIds,
  searchKeyword,
  currentCategoryId,
  currentCategoryName,
} = storeToRefs(optionStore)
const pageinfo = optionStore.pageinfo
const optionPageInfo = optionStore.optionPageInfo
const OptionsData = optionStore.OptionsData
const editingOption = optionStore.editingOption

const showAddCategory = ref(false)
const showModal = ref(false)
const showAddOptionModal = ref(false)
const showEditOptionModal = ref(false)

onMounted(() => {
  handleGetCategories()
})

watch(searchKeyword, (newVal) => {
  if (!newVal && currentCategoryId.value && showModal.value) {
    clearSearch()
  }
})

const handleGetCategories = async (page = pageinfo.current) => {
  try {
    await optionStore.fetchCategories(page)
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('获取数据失败')
  }
}

const handleUpdateCategoryName = async (id, name) => {
  try {
    const result = await optionStore.updateCategoryName(id, name)
    message.success(result.msg || result.message || '修改成功')
    await handleGetCategories()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        '修改失败'
    )
  }
}

const handleAddCategory = async () => {
  try {
    const result = await optionStore.addCategory(categoryName.value)
    message.success(result.msg || result.message || '添加成功')
    showAddCategory.value = false
    optionStore.resetCategoryName()
    await handleGetCategories()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        '添加失败'
    )
  }
}

const handleDeleteCategory = async (id) => {
  try {
    const result = await optionStore.deleteCategories(id)
    message.success(result.msg || result.message || '删除成功')
    checkedCategoryIds.value = checkedCategoryIds.value.filter(
      (checkedId) => checkedId !== id
    )
    await handleGetCategories()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        error.message ||
        '删除失败'
    )
  }
}

const handleCategoryChecked = (id, checked) =>
  optionStore.handleCategoryChecked(id, checked)
const handleCheckAllCategories = (checked) =>
  optionStore.handleCheckAllCategories(checked)

const handleBatchDeleteCategory = async (ids) => {
  if (!Array.isArray(ids) || !ids.length) {
    message.warning('请先选择需要删除的分类')
    return
  }

  try {
    const result = await optionStore.deleteCategories(ids)
    message.success(result.msg || result.message || '删除成功')
    optionStore.resetCheckedCategoryIds()
    await handleGetCategories()
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        error.message ||
        '删除失败'
    )
  }
}

const handleGetOption = async (
  id,
  keyword = '',
  page = optionPageInfo.current
) => {
  showModal.value = true
  try {
    await optionStore.fetchOptions({
      categoryId: id,
      keyword,
      page,
    })
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('获取数据失败')
  }
}

const handleSearchOption = () => {
  optionPageInfo.current = 1
  handleGetOption(currentCategoryId.value, searchKeyword.value)
}

const clearSearch = () => {
  searchKeyword.value = ''
  optionPageInfo.current = 1
  handleGetOption(currentCategoryId.value, '', 1)
}

const handleOptionPageChange = async (page) => {
  optionPageInfo.current = page
  if (currentCategoryId.value) {
    await handleGetOption(currentCategoryId.value, searchKeyword.value, page)
  }
}

const closeAddOptionModal = () => {
  showAddOptionModal.value = false
  optionStore.resetOptionsData()
}

const closeEditOptionModal = () => {
  showEditOptionModal.value = false
  optionStore.resetEditingOption()
}

const handleAddOptionModalToggle = (show) => {
  if (show) {
    showAddOptionModal.value = true
    return
  }
  closeAddOptionModal()
}

const handleEditOptionModalToggle = (show) => {
  if (show) {
    showEditOptionModal.value = true
    return
  }
  closeEditOptionModal()
}

const resetOptionModalState = () => {
  optionStore.resetOptionModalState()
  showAddOptionModal.value = false
  showEditOptionModal.value = false
}

const handleAddOption = async () => {
  try {
    const result = await optionStore.addOption()
    message.success(result.msg || result.message || '添加成功')
    closeAddOptionModal()
    await handleGetOption(currentCategoryId.value, searchKeyword.value)
  } catch (error) {
    console.error('添加选项失败:', error)
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        '添加失败'
    )
  }
}

const openEditOptionModal = (item) => {
  optionStore.fillEditingOption(item)
  showEditOptionModal.value = true
}

const handleUpdateOption = async () => {
  if (!editingOption.id) {
    message.warning('未获取到选配产品信息')
    return
  }
  try {
    const result = await optionStore.updateOption()
    message.success(result.msg || result.message || '更新成功')
    closeEditOptionModal()
    await handleGetOption(currentCategoryId.value, searchKeyword.value)
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        '更新失败'
    )
  }
}

const handleOptionDelete = async (id) => {
  try {
    const result = await optionStore.deleteOptions(id)
    message.success(result.msg || result.message || '删除成功')
    checkedOptionIds.value = checkedOptionIds.value.filter(
      (checkedId) => checkedId !== id
    )
    await handleGetOption(currentCategoryId.value, searchKeyword.value)
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        error.message ||
        '删除失败'
    )
  }
}

const handleOptionChecked = (id, checked) =>
  optionStore.handleOptionChecked(id, checked)

const handleBatchDeleteOption = async (ids) => {
  if (!Array.isArray(ids) || !ids.length) {
    message.warning('请先选择需要删除的产品')
    return
  }

  try {
    const result = await optionStore.deleteOptions(ids)
    message.success(result.msg || result.message || '删除成功')
    optionStore.resetCheckedOptionIds()
    await handleGetOption(currentCategoryId.value, searchKeyword.value)
  } catch (error) {
    message.error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        error.message ||
        '删除失败'
    )
  }
}
</script>
