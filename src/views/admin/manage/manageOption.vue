<template>
  <div class="userManage">
    <div class="left-actions">
      <n-button size="small" type="info" @click="showAddCategory = true">添加选配分类</n-button>
      <Delete
        :checkedIds="checkedCategoryIds"
        :isBatch="true"
        @delete="handleBatchDeleteCategory"
      />
    </div>
  </div>
  <n-modal
    v-model:show="showAddCategory"
    preset="card"
    title="添加分类"
    size="huge"
    :style="{ width: 'min(500px, calc(100vw - 24px))' }"
    :bordered="false"
  >
    <n-input
      v-model:value="categoryName"
      placeholder="请输入分类名称"
      class="option-field option-field--lg"
    ></n-input>

    <div class="option-actions responsive-actions">
      <n-button @click="showAddCategory = false">取消</n-button>
      <n-button type="primary" @click="handleAddCategory">保存</n-button>
    </div>
  </n-modal>
  <br /><br />
  <div class="house-list admin-shell-list">
    <div class="house-header">
      <div class="center">
        <n-checkbox
          :checked="isAllCategoryChecked"
          :indeterminate="isCategoryIndeterminate"
          @update:checked="handleCheckAllCategories"
        />
      </div>
      <div>选配类型</div>
      <div>操作</div>
    </div>
    <div v-for="item in CategoriesList" :key="item.id" class="house-item">
      <div class="center">
        <n-checkbox
          :checked="checkedCategoryIds.includes(item.id)"
          @update:checked="(checked) => handleCategoryChecked(item.id, checked)"
        />
      </div>
      <div class="category-name">{{ item.name }}</div>
      <div class="actions">
        <n-button size="small" type="info" @click="handleGetOption(item.id)"
          >编辑产品</n-button
        >
        <Delete :itemId="item.id" @delete="handleDeleteCategory" />
      </div>
    </div>
  </div>
  <div class="pagination-container">
    <n-pagination
      v-model:page="pageinfo.current"
      :page-count="pageinfo.pageCount"
      :page-slot="3"
      size="large"
      show-quick-jumper
      @update:page="handleGetCategories"
    />
  </div>

  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="'选配产品列表 - ' + currentCategoryName"
    size="huge"
    :style="{ width: 'min(800px, calc(100vw - 24px))' }"
    :bordered="false"
    @after-leave="resetOptionModalState"
  >
    <div class="option-list-container">
      <div class="category-name-edit option-row">
        <n-input
          v-model:value="currentCategoryName"
          placeholder="分类名称"
        ></n-input>
        <n-button
          type="primary"
          @click="
            handleUpdateCategoryName(currentCategoryId, currentCategoryName)
          "
          >修改分类名称</n-button
        >
      </div>

      <!-- 添加子类选配 -->
      <div class="userManage optionManage">
        <div class="left-actions">
          <n-button
            size="small"
            type="info"
            @click="showAddOptionModal = true"
            >添加产品</n-button
          >
          <Delete
            :checkedIds="checkedOptionIds"
            :isBatch="true"
            @delete="handleBatchDeleteOption"
          />
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="option-row option-row--center">
        <n-input
          v-model:value="searchKeyword"
          placeholder="输入产品名称搜索"
          class="option-row__grow"
          clearable
          @keydown.enter="handleSearchOption"
        ></n-input>
        <n-button type="primary" @click="handleSearchOption">搜索</n-button>
      </div>

      <!-- 添加选项的模态框 -->
      <n-modal
        v-model:show="showAddOptionModal"
        preset="card"
        title="添加选配产品"
        size="huge"
        :style="{ width: 'min(500px, calc(100vw - 24px))' }"
        :bordered="false"
      >
        <n-input
          v-model:value="OptionsData.name"
          placeholder="产品名称"
          class="option-field"
        ></n-input>
        <n-input-number
          v-model:value="OptionsData.price"
          placeholder="价格"
          class="option-field"
          :min="0"
        ></n-input-number>
        <n-input
          v-model:value="OptionsData.description"
          placeholder="描述"
          type="textarea"
          class="option-field"
        ></n-input>

        <div class="option-actions responsive-actions">
          <n-button @click="closeAddOptionModal">取消</n-button>
          <n-button type="primary" @click="handleAddOption">保存</n-button>
        </div>
      </n-modal>

      <n-modal
        v-model:show="showEditOptionModal"
        preset="card"
        title="编辑选配产品"
        size="huge"
        :style="{ width: 'min(500px, calc(100vw - 24px))' }"
        :bordered="false"
      >
        <n-input
          v-model:value="editingOption.name"
          placeholder="产品名称"
          class="option-field"
        ></n-input>
        <n-input-number
          v-model:value="editingOption.price"
          placeholder="价格"
          class="option-field"
          :min="0"
        ></n-input-number>
        <n-input
          v-model:value="editingOption.description"
          placeholder="描述"
          type="textarea"
          class="option-field"
        ></n-input>

        <div class="option-actions responsive-actions">
          <n-button @click="closeEditOptionModal">取消</n-button>
          <n-button type="primary" @click="handleUpdateOption">保存修改</n-button>
        </div>
      </n-modal>

      <div class="option-list">
        <div v-for="item in OptionList" :key="item.id" class="option-card">
          <div class="option-card__check">
            <n-checkbox
              :checked="checkedOptionIds.includes(item.id)"
              @update:checked="(checked) => handleOptionChecked(item.id, checked)"
            />
          </div>
          <div class="option-card__body">
            <div class="option-card__main">
              <span class="option-name">{{ item.name || '--' }}</span>
              <span class="option-price">¥{{ item.price ?? 0 }}</span>
            </div>
            <div class="option-description">
              {{ item.description || '暂无描述' }}
            </div>
          </div>
          <div class="option-card__actions">
            <n-button size="small" type="primary" @click="openEditOptionModal(item)"
              >修改</n-button
            >
            <Delete :itemId="item.id" @delete="handleOptionDelete" />
          </div>
        </div>
      </div>
    </div>

    <!-- 选配产品分页 -->
    <div class="pagination-container option-pagination">
      <n-pagination
        v-model:page="optionPageInfo.current"
        :page-count="optionPageInfo.pageCount"
        :page-slot="3"
        size="medium"
        show-quick-jumper
        @update:page="handleOptionPageChange"
      />
    </div>
  </n-modal>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import Delete from '@/components/operation/delete.vue'
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

// 修改分类名称
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

// 添加分类名称
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

// 删除分类名称
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

/**----------------------------------------------------------- */

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

// 搜索选配产品
const handleSearchOption = () => {
  optionPageInfo.current = 1 // 重置到第一页
  handleGetOption(currentCategoryId.value, searchKeyword.value)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  optionPageInfo.current = 1
  handleGetOption(currentCategoryId.value, '', 1)
}

// 选配产品分页变化
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

// 更新选配产品
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

// 删除选配产品
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

<style lang="scss" scoped>

.userManage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  white-space: nowrap;
  margin-bottom: 20px;
  padding: 15px;
  overflow-x: auto;

  .left-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: 0 0 auto;
  }
}

.optionManage {
  margin-bottom: 15px;

  .left-actions {
    min-height: 28px;

    > :deep(.n-button) {
      height: 28px;
    }
  }
}

.option-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.option-row--center {
  align-items: center;
}

.option-row__grow {
  flex: 1;
}

.option-field {
  margin-bottom: 15px;
}

.option-field--lg {
  margin-bottom: 20px;
}

.house-list {
  border: none;
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
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

.house-header div:first-child,
.house-item div:first-child {
  text-align: center;
}

.house-header div:last-child,
.house-item div:last-child {
  text-align: center;
}

.actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  width: 100%;
  overflow: hidden;

  > * {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
  }

  > :deep(.n-button) {
    width: 100%;
    min-width: 0;
    padding: 0 4px;
  }
}

.option-pagination {
  margin-top: 15px;
}

.option-list-container {
  margin: 10px 0;
}

.option-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 140px;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;

  &:hover {
    background: rgba(39, 110, 61, 0.04);
    border-color: rgba(39, 110, 61, 0.2);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
}

.option-card__check {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.option-card__body {
  min-width: 0;
}

.option-card__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.option-card__actions {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;

  > * {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
  }

  > :deep(.n-button) {
    width: 100%;
    padding: 0 8px;
  }
}

.option-name,
.option-price,
.option-description {
  line-height: 1.6;
  word-break: break-word;
  color: #1f2937;
}

.option-price {
  font-weight: 700;
  color: var(--color-brand-700);
  flex-shrink: 0;
}

.option-description {
  color: #4b5563;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 768px) {
  .option-row {
    flex-direction: column;
  }

  .option-row__grow {
    width: 100%;
  }

  .option-actions {
    width: 100%;
    justify-content: stretch;
  }

  .option-actions > * {
    flex: 1 1 100%;
  }

  .option-card {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .option-card__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .option-card__main {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
