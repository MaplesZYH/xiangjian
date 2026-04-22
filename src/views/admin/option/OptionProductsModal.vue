<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    :title="'选配产品列表 - ' + currentCategoryName"
    size="huge"
    :style="{ width: 'min(800px, calc(100vw - 24px))' }"
    :bordered="false"
    @after-leave="emit('after-leave')"
  >
    <div class="option-list-container">
      <OptionCategoryEditRow
        :category-name="currentCategoryName"
        @update:category-name="emit('update:current-category-name', $event)"
        @save-name="emit('save-category-name')"
      />

      <OptionProductsToolbar
        :checked-option-ids="checkedOptionIds"
        @open-add-option="emit('update:show-add-option-modal', true)"
        @batch-delete-option="emit('batch-delete-option', $event)"
      />

      <OptionProductsSearchBar
        :keyword="searchKeyword"
        @update:keyword="emit('update:search-keyword', $event)"
        @search="emit('search-option')"
      />

      <OptionFormModal
        :show="showAddOptionModal"
        title="添加选配产品"
        confirm-text="保存"
        :name="addOptionName"
        :price="addOptionPrice"
        :description="addOptionDescription"
        @update:show="emit('update:show-add-option-modal', $event)"
        @update:name="emit('update:add-option-name', $event)"
        @update:price="emit('update:add-option-price', $event)"
        @update:description="emit('update:add-option-description', $event)"
        @confirm="emit('add-option')"
      />

      <OptionFormModal
        :show="showEditOptionModal"
        title="编辑选配产品"
        confirm-text="保存修改"
        :name="editOptionName"
        :price="editOptionPrice"
        :description="editOptionDescription"
        @update:show="emit('update:show-edit-option-modal', $event)"
        @update:name="emit('update:edit-option-name', $event)"
        @update:price="emit('update:edit-option-price', $event)"
        @update:description="emit('update:edit-option-description', $event)"
        @confirm="emit('update-option')"
      />

      <OptionProductList
        :option-list="optionList"
        :checked-option-ids="checkedOptionIds"
        @check-one="emit('check-option', $event)"
        @open-edit="emit('open-edit-option', $event)"
        @delete-option="emit('delete-option', $event)"
      />
    </div>

    <div class="pagination-container option-pagination">
      <n-pagination
        :page="optionPageInfo.current"
        :page-count="optionPageInfo.pageCount"
        :page-slot="3"
        size="medium"
        show-quick-jumper
        @update:page="emit('page-change', $event)"
      />
    </div>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import OptionFormModal from '@/components/admin/option/OptionFormModal.vue'
import OptionCategoryEditRow from '@/views/admin/option/OptionCategoryEditRow.vue'
import OptionProductList from '@/views/admin/option/OptionProductList.vue'
import OptionProductsSearchBar from '@/views/admin/option/OptionProductsSearchBar.vue'
import OptionProductsToolbar from '@/views/admin/option/OptionProductsToolbar.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  currentCategoryName: {
    type: String,
    default: '',
  },
  searchKeyword: {
    type: String,
    default: '',
  },
  optionList: {
    type: Array,
    default: () => [],
  },
  checkedOptionIds: {
    type: Array,
    default: () => [],
  },
  optionPageInfo: {
    type: Object,
    required: true,
  },
  showAddOptionModal: {
    type: Boolean,
    default: false,
  },
  showEditOptionModal: {
    type: Boolean,
    default: false,
  },
  addOptionName: {
    type: String,
    default: '',
  },
  addOptionPrice: {
    type: Number,
    default: 0,
  },
  addOptionDescription: {
    type: String,
    default: '',
  },
  editOptionName: {
    type: String,
    default: '',
  },
  editOptionPrice: {
    type: Number,
    default: 0,
  },
  editOptionDescription: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:show',
  'after-leave',
  'update:current-category-name',
  'save-category-name',
  'update:show-add-option-modal',
  'batch-delete-option',
  'update:search-keyword',
  'search-option',
  'update:add-option-name',
  'update:add-option-price',
  'update:add-option-description',
  'add-option',
  'update:show-edit-option-modal',
  'update:edit-option-name',
  'update:edit-option-price',
  'update:edit-option-description',
  'update-option',
  'check-option',
  'open-edit-option',
  'delete-option',
  'page-change',
])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.option-list-container {
  margin: 10px 0;
}

.option-pagination {
  margin-top: 15px;
}
</style>
