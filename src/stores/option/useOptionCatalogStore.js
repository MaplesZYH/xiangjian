import { ref } from 'vue'
import { defineStore } from 'pinia'
import categoryAPI from '@/api/house/categories'

const normalizeCategoryId = (value) => {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : value
}

const normalizeCategoryOption = (item = {}) => ({
  label: item.name || item.label || `分类${item.id ?? item.value ?? ''}`,
  value: normalizeCategoryId(item.id ?? item.value),
})

const normalizeConfigOption = (item = {}) => ({
  label:
    item.label ||
    item.name ||
    `产品${item.id ?? item.value ?? ''}`,
  value: normalizeCategoryId(item.id ?? item.value),
  name: item.name || item.label || '',
  price: item.price,
  description: item.description || '',
})

const extractCategoryProducts = (category = {}) => {
  const candidates = [
    category.optionProducts,
    category.products,
    category.options,
    category.children,
    category.records,
    category.list,
  ]

  return candidates.find((item) => Array.isArray(item)) || []
}

const normalizeCategoryConfig = (category = {}) => ({
  id: normalizeCategoryId(category.id ?? category.value ?? category.categoryId),
  key: String(category.id ?? category.value ?? category.categoryId ?? ''),
  name: category.name || category.label || category.categoryName || '',
  options: extractCategoryProducts(category).map(normalizeConfigOption),
})

export const useOptionCatalogStore = defineStore('optionCatalog', () => {
  const userCategoryOptions = ref([])
  const userCategoryConfigs = ref([])
  const userCategoryOptionsPromise = ref(null)
  const userCategoryConfigsPromise = ref(null)

  const setUserCategoryOptions = (options = []) => {
    userCategoryOptions.value = options
  }

  const setUserCategoryConfigs = (configs = []) => {
    userCategoryConfigs.value = configs
    if (configs.length > 0) {
      setUserCategoryOptions(configs.map(normalizeCategoryOption))
    }
  }

  const fetchUserCategoryOptions = async ({ force = false } = {}) => {
    if (!force && userCategoryOptions.value.length > 0) {
      return { code: 200, data: userCategoryOptions.value }
    }

    if (!force && userCategoryConfigs.value.length > 0) {
      const options = userCategoryConfigs.value.map(normalizeCategoryOption)
      setUserCategoryOptions(options)
      return { code: 200, data: options }
    }

    if (!force && userCategoryOptionsPromise.value) {
      return userCategoryOptionsPromise.value
    }

    userCategoryOptionsPromise.value = (async () => {
      try {
        const res = await categoryAPI.getCategoriesData()
        if (res.code === 200 && Array.isArray(res.data)) {
          const options = res.data.map(normalizeCategoryOption)
          setUserCategoryOptions(options)
        }
        return res
      } finally {
        userCategoryOptionsPromise.value = null
      }
    })()

    return userCategoryOptionsPromise.value
  }

  const fetchUserCategoryConfigs = async ({ force = false } = {}) => {
    if (!force && userCategoryConfigs.value.length > 0) {
      return { code: 200, data: userCategoryConfigs.value }
    }

    if (!force && userCategoryConfigsPromise.value) {
      return userCategoryConfigsPromise.value
    }

    userCategoryConfigsPromise.value = (async () => {
      try {
        const allRes = await categoryAPI.getAllCategoriesWithProducts()
        if (allRes.code === 200 && Array.isArray(allRes.data)) {
          const configs = allRes.data
            .map(normalizeCategoryConfig)
            .filter((category) => category.id && category.name)
          setUserCategoryConfigs(configs)
          return { ...allRes, data: configs }
        }
      } catch (error) {
        void error
      }

      const categoryRes = await fetchUserCategoryOptions({ force })
      const categories = Array.isArray(categoryRes?.data) ? categoryRes.data : []
      const configs = await Promise.all(
        categories.map(async (category) => {
          const optionRes = await categoryAPI.getCategoryOptionsData(category.value)
          const optionList = Array.isArray(optionRes?.data)
            ? optionRes.data.map(normalizeConfigOption)
            : []
          return {
            id: category.value,
            key: String(category.value),
            name: category.label,
            options: optionList,
          }
        }),
      )
      setUserCategoryConfigs(configs)
      return { code: 200, data: configs }
    })().finally(() => {
      userCategoryConfigsPromise.value = null
    })

    return userCategoryConfigsPromise.value
  }

  const clearUserCategoryCatalog = () => {
    userCategoryOptions.value = []
    userCategoryConfigs.value = []
    userCategoryOptionsPromise.value = null
    userCategoryConfigsPromise.value = null
  }

  return {
    userCategoryOptions,
    userCategoryConfigs,
    fetchUserCategoryOptions,
    fetchUserCategoryConfigs,
    clearUserCategoryCatalog,
  }
})
