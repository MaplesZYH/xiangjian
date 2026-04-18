import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import API from '@/api/house/house'

const createDefaultSearchParams = () => ({
  name: '',
  style: '',
  constructionMethod: '',
  minPrice: '',
  maxPrice: '',
  minBaseArea: '',
  maxBaseArea: '',
  minBuildArea: '',
  maxBuildArea: '',
  roomCount: '',
  livingRoomCount: '',
  bathroomCount: '',
  floors: '',
})

export const useAdminHouseStore = defineStore('adminHouse', () => {
  const selectedIds = ref([])
  const searchHouseName = ref('')
  const houseList = ref([])

  const searchParams = reactive(createDefaultSearchParams())
  const pageinfo = reactive({
    current: 1,
    size: 5,
    pageCount: 0,
    count: 0,
  })

  const isAllSelected = computed(
    () =>
      houseList.value.length > 0 &&
      selectedIds.value.length === houseList.value.length,
  )

  const isIndeterminate = computed(
    () =>
      selectedIds.value.length > 0 &&
      selectedIds.value.length < houseList.value.length,
  )

  const buildFilteredSearchParams = () =>
    Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => value !== ''),
    )

  const syncPageMeta = (pageResult = {}, fallbackPage = 1) => {
    pageinfo.current = Number(pageResult?.pageNum || fallbackPage || 1)
    pageinfo.size = Number(pageResult?.pageSize || pageinfo.size || 5)
    pageinfo.count = Number(pageResult?.total || 0)
    pageinfo.pageCount =
      Number(pageResult?.pages || 0) ||
      Math.ceil(pageinfo.count / pageinfo.size) ||
      0
  }

  const applyBackendPageRecords = (records = []) => {
    houseList.value = [...records]
  }

  const fetchHouseList = async (page = pageinfo.current) => {
    const filteredParams = buildFilteredSearchParams()
    const requestPage = Math.max(1, Number(page) || 1)
    const result = await API.getHouseData(
      requestPage,
      pageinfo.size,
      filteredParams,
    )

    if (!(result?.code === 200 && result?.data)) {
      houseList.value = []
      syncPageMeta({}, 1)
      return result
    }

    syncPageMeta(result.data, requestPage)

    if (pageinfo.count === 0) {
      houseList.value = []
      return result
    }

    if (pageinfo.pageCount > 0 && requestPage > pageinfo.pageCount) {
      const fallbackResult = await API.getHouseData(
        pageinfo.pageCount,
        pageinfo.size,
        filteredParams,
      )

      if (fallbackResult?.code === 200 && fallbackResult?.data) {
        syncPageMeta(fallbackResult.data, pageinfo.pageCount)
        applyBackendPageRecords(fallbackResult.data.records || [])
        selectedIds.value = []
        return fallbackResult
      }
    }

    applyBackendPageRecords(result.data.records || [])
    selectedIds.value = []
    return result
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      selectedIds.value = houseList.value.map((item) => item.id)
      return
    }
    selectedIds.value = []
  }

  const handleSelect = (id, checked) => {
    if (checked) {
      selectedIds.value = [...new Set([...selectedIds.value, id])]
      return
    }
    selectedIds.value = selectedIds.value.filter((itemId) => itemId !== id)
  }

  const resetSelectedIds = () => {
    selectedIds.value = []
  }

  const resetSearchParams = () => {
    Object.assign(searchParams, createDefaultSearchParams())
  }

  const applyHouseNameSearch = () => {
    resetSearchParams()
    searchParams.name = searchHouseName.value.trim()
    pageinfo.current = 1
    pageinfo.count = 0
    pageinfo.pageCount = 0
    resetSelectedIds()
  }

  const deleteHouses = async (ids) => API.deleteHouseData(ids)

  return {
    selectedIds,
    searchHouseName,
    houseList,
    searchParams,
    pageinfo,
    isAllSelected,
    isIndeterminate,
    fetchHouseList,
    handleSelectAll,
    handleSelect,
    resetSelectedIds,
    resetSearchParams,
    applyHouseNameSearch,
    deleteHouses,
  }
})
