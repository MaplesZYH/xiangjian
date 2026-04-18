import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import API from '@/api/house/categories'

export const useAdminOptionStore = defineStore('adminOption', () => {
  const CategoriesList = ref([])
  const checkedCategoryIds = ref([])
  const categoryName = ref('')

  const pageinfo = reactive({
    current: 1,
    size: 5,
    pageCount: 0,
    count: 0,
  })

  const OptionList = ref([])
  const checkedOptionIds = ref([])
  const searchKeyword = ref('')
  const currentCategoryId = ref(null)
  const currentCategoryName = ref('')

  const optionPageInfo = reactive({
    current: 1,
    size: 5,
    pageCount: 0,
    count: 0,
  })

  const OptionsData = reactive({
    categoryId: '',
    name: '',
    price: 0,
    description: '',
  })

  const editingOption = reactive({
    id: null,
    categoryId: '',
    name: '',
    price: 0,
    description: '',
  })

  const syncCategoryPageMeta = (pageResult = {}) => {
    pageinfo.count = Number(pageResult?.total || 0)
    pageinfo.pageCount = Math.ceil(pageinfo.count / pageinfo.size) || 0
  }

  const syncOptionPageMeta = (pageResult = {}) => {
    optionPageInfo.count = Number(pageResult?.total || 0)
    optionPageInfo.pageCount =
      Math.ceil(optionPageInfo.count / optionPageInfo.size) || 0
  }

  const applyCategoryPageRecords = (records = []) => {
    CategoriesList.value = [...records]
  }

  const applyOptionPageRecords = (records = []) => {
    OptionList.value = [...records]
  }

  const resolveReversePageRecords = async ({
    metadataResult,
    page,
    pageSize,
    total,
    fetchPage,
  }) => {
    const startAscIndex = Math.max(1, total - page * pageSize + 1)
    const endAscIndex = total - (page - 1) * pageSize

    if (startAscIndex > endAscIndex) return []

    const startBackendPage = Math.ceil(startAscIndex / pageSize)
    const endBackendPage = Math.ceil(endAscIndex / pageSize)
    const backendPages = Array.from(
      { length: endBackendPage - startBackendPage + 1 },
      (_, index) => startBackendPage + index,
    )

    const pageResults = await Promise.all(
      backendPages.map((backendPage) =>
        backendPage === 1 ? metadataResult : fetchPage(backendPage),
      ),
    )

    const mergedRecords = pageResults.flatMap(
      (result) => result?.data?.records || [],
    )
    const mergedStartAscIndex = (startBackendPage - 1) * pageSize + 1
    const sliceStart = Math.max(0, startAscIndex - mergedStartAscIndex)
    const sliceLength = endAscIndex - startAscIndex + 1

    return mergedRecords.slice(sliceStart, sliceStart + sliceLength).reverse()
  }

  const syncCurrentCategoryName = () => {
    if (!currentCategoryId.value) return
    const category = CategoriesList.value.find(
      (item) => item.id === currentCategoryId.value,
    )
    if (category) {
      currentCategoryName.value = category.name || ''
    }
  }

  const fetchCategories = async (page = pageinfo.current) => {
    pageinfo.current = page

    const metadataResult = await API.getCategoryData(1, pageinfo.size)
    syncCategoryPageMeta(metadataResult?.data)

    if (pageinfo.count === 0) {
      CategoriesList.value = []
      return metadataResult
    }

    if (pageinfo.current > pageinfo.pageCount) {
      pageinfo.current = pageinfo.pageCount
    }

    const reversePageRecords = await resolveReversePageRecords({
      metadataResult,
      page: pageinfo.current,
      pageSize: pageinfo.size,
      total: pageinfo.count,
      fetchPage: (backendPage) => API.getCategoryData(backendPage, pageinfo.size),
    })

    applyCategoryPageRecords(reversePageRecords)
    syncCurrentCategoryName()
    return metadataResult
  }

  const addCategory = async (name = categoryName.value) => API.addCategoryName(name)
  const updateCategoryName = async (id, name) => API.updateCategoryName(id, name)
  const deleteCategories = async (ids) => API.deleteCategoryName(ids)

  const handleCategoryChecked = (id, checked) => {
    if (checked) {
      if (!checkedCategoryIds.value.includes(id)) {
        checkedCategoryIds.value = [...checkedCategoryIds.value, id]
      }
      return
    }
    checkedCategoryIds.value = checkedCategoryIds.value.filter(
      (checkedId) => checkedId !== id,
    )
  }

  const isAllCategoryChecked = computed(() => {
    if (CategoriesList.value.length === 0) return false
    return CategoriesList.value.every((item) =>
      checkedCategoryIds.value.includes(item.id),
    )
  })

  const isCategoryIndeterminate = computed(() => {
    if (CategoriesList.value.length === 0) return false
    const count = CategoriesList.value.filter((item) =>
      checkedCategoryIds.value.includes(item.id),
    ).length
    return count > 0 && count < CategoriesList.value.length
  })

  const handleCheckAllCategories = (checked) => {
    const currentIds = CategoriesList.value.map((item) => item.id)
    if (checked) {
      checkedCategoryIds.value = [
        ...new Set([...checkedCategoryIds.value, ...currentIds]),
      ]
      return
    }
    checkedCategoryIds.value = checkedCategoryIds.value.filter(
      (id) => !currentIds.includes(id),
    )
  }

  const setCurrentCategory = (id) => {
    currentCategoryId.value = id
    syncCurrentCategoryName()
  }

  const fetchOptions = async ({
    categoryId = currentCategoryId.value,
    keyword = searchKeyword.value,
    page = optionPageInfo.current,
  } = {}) => {
    if (!categoryId) return null

    setCurrentCategory(categoryId)
    optionPageInfo.current = page

    const metadataResult = await API.getOptionsData(
      1,
      optionPageInfo.size,
      categoryId,
      keyword,
    )

    syncOptionPageMeta(metadataResult?.data)

    if (optionPageInfo.count === 0) {
      OptionList.value = []
      return metadataResult
    }

    if (optionPageInfo.current > optionPageInfo.pageCount) {
      optionPageInfo.current = optionPageInfo.pageCount
    }

    const reversePageRecords = await resolveReversePageRecords({
      metadataResult,
      page: optionPageInfo.current,
      pageSize: optionPageInfo.size,
      total: optionPageInfo.count,
      fetchPage: (backendPage) =>
        API.getOptionsData(
          backendPage,
          optionPageInfo.size,
          categoryId,
          keyword,
        ),
    })

    applyOptionPageRecords(reversePageRecords)
    return metadataResult
  }

  const resetOptionsData = () => {
    OptionsData.categoryId = ''
    OptionsData.name = ''
    OptionsData.price = 0
    OptionsData.description = ''
  }

  const resetEditingOption = () => {
    editingOption.id = null
    editingOption.categoryId = ''
    editingOption.name = ''
    editingOption.price = 0
    editingOption.description = ''
  }

  const fillEditingOption = (item) => {
    editingOption.id = item.id
    editingOption.categoryId = item.categoryId
    editingOption.name = item.name || ''
    editingOption.price = Number(item.price || 0)
    editingOption.description = item.description || ''
  }

  const addOption = async () => {
    OptionsData.categoryId = currentCategoryId.value
    return API.addOptionsData({ ...OptionsData })
  }

  const updateOption = async () => {
    const payload = {
      id: editingOption.id,
      categoryId: editingOption.categoryId,
      name: editingOption.name,
      price: editingOption.price,
      description: editingOption.description,
    }
    return API.updateOptionsData(payload)
  }

  const deleteOptions = async (ids) => API.deleteOptionsData(ids)

  const handleOptionChecked = (id, checked) => {
    if (checked) {
      if (!checkedOptionIds.value.includes(id)) {
        checkedOptionIds.value = [...checkedOptionIds.value, id]
      }
      return
    }
    checkedOptionIds.value = checkedOptionIds.value.filter(
      (checkedId) => checkedId !== id,
    )
  }

  const resetCategoryName = () => {
    categoryName.value = ''
  }

  const resetCheckedCategoryIds = () => {
    checkedCategoryIds.value = []
  }

  const resetCheckedOptionIds = () => {
    checkedOptionIds.value = []
  }

  const resetOptionModalState = () => {
    searchKeyword.value = ''
    checkedOptionIds.value = []
    OptionList.value = []
    currentCategoryId.value = null
    currentCategoryName.value = ''
    optionPageInfo.current = 1
    optionPageInfo.pageCount = 0
    optionPageInfo.count = 0
    resetOptionsData()
    resetEditingOption()
  }

  return {
    CategoriesList,
    checkedCategoryIds,
    categoryName,
    pageinfo,
    isAllCategoryChecked,
    isCategoryIndeterminate,
    OptionList,
    checkedOptionIds,
    searchKeyword,
    currentCategoryId,
    currentCategoryName,
    optionPageInfo,
    OptionsData,
    editingOption,
    fetchCategories,
    addCategory,
    updateCategoryName,
    deleteCategories,
    handleCategoryChecked,
    handleCheckAllCategories,
    fetchOptions,
    resetOptionsData,
    resetEditingOption,
    fillEditingOption,
    addOption,
    updateOption,
    deleteOptions,
    handleOptionChecked,
    resetCategoryName,
    resetCheckedCategoryIds,
    resetCheckedOptionIds,
    resetOptionModalState,
  }
})
