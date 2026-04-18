import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import API from '@/api/service/manage'
import { useOptionCatalogStore } from '@/stores/option/useOptionCatalogStore'

const serviceTypeOptions = [
  { label: '建造商', value: 1 },
  { label: '材料商', value: 2 },
  { label: '综合服务商', value: 3 },
]

const normalizeCertificateList = (list = []) => {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => ({
      id: item?.id ?? null,
      fileUrl: item?.fileUrl || item?.url || '',
    }))
    .filter((item) => item.fileUrl)
}

const normalizeMaterialCategoryList = (list = []) => {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => ({
      id: item?.id,
      name: item?.name || '',
    }))
    .filter((item) => item.id !== undefined && item.id !== null)
}

export const useAdminVendorStore = defineStore('adminVendor', () => {
  const optionCatalogStore = useOptionCatalogStore()
  const loading = ref(false)
  const currentStatus = ref(1)
  const searchName = ref('')
  const serviceList = ref([])
  const checkedIds = ref([])
  const detailVendor = ref(null)
  const categoryOptions = computed(() => optionCatalogStore.userCategoryOptions)

  const pageInfo = reactive({
    page: 1,
    pageSize: 5,
    pageCount: 0,
    count: 0,
  })

  const editForm = reactive({
    id: null,
    username: '',
    companyName: '',
    phone: '',
    companyChargerName: '',
    companyAddress: '',
    serviceType: null,
    companyIntroduction: '',
    certificate: [],
    materialCategoryIds: [],
  })

  const resetCheckedIds = () => {
    checkedIds.value = []
  }

  const resetDetailVendor = () => {
    detailVendor.value = null
  }

  const resetEditForm = () => {
    editForm.id = null
    editForm.username = ''
    editForm.companyName = ''
    editForm.phone = ''
    editForm.companyChargerName = ''
    editForm.companyAddress = ''
    editForm.serviceType = null
    editForm.companyIntroduction = ''
    editForm.certificate = []
    editForm.materialCategoryIds = []
  }

  const getServiceTypeName = (value) => {
    const matched = serviceTypeOptions.find((option) => option.value === value)
    return matched ? matched.label : `未知类型(${value})`
  }

  const formatStatus = (status) => {
    switch (status) {
      case 1:
        return { text: '已通过', type: 'success' }
      case 0:
        return { text: '未通过', type: 'error' }
      case 2:
        return { text: '待审核', type: 'warning' }
      default:
        return { text: '未知', type: 'default' }
    }
  }

  const getCertFileName = (url, index = 0) => {
    if (!url) return `资质文件-${index + 1}`
    try {
      const parsed = new URL(String(url), window.location.origin)
      const rawName = parsed.pathname.split('/').pop()
      const decodedName = rawName ? decodeURIComponent(rawName) : ''
      return decodedName || `资质文件-${index + 1}`
    } catch {
      const rawName = String(url).split('/').pop()?.split('?')[0]?.split('#')[0]
      const decodedName = rawName ? decodeURIComponent(rawName) : ''
      return decodedName || `资质文件-${index + 1}`
    }
  }

  const fetchData = async () => {
    loading.value = true
    serviceList.value = []
    pageInfo.count = 0
    pageInfo.pageCount = 0

    try {
      let pageResult = await API.getVendorList(
        pageInfo.page,
        pageInfo.pageSize,
        currentStatus.value,
        searchName.value || undefined,
      )

      if (pageResult.code === 200 && pageResult.data) {
        pageInfo.count = Number(pageResult.data.total || 0)
        pageInfo.pageCount = Math.ceil(pageInfo.count / pageInfo.pageSize)

        if (pageInfo.count === 0) {
          serviceList.value = []
          return pageResult
        }

        if (pageInfo.page > pageInfo.pageCount) {
          pageInfo.page = pageInfo.pageCount
          pageResult = await API.getVendorList(
            pageInfo.page,
            pageInfo.pageSize,
            currentStatus.value,
            searchName.value || undefined,
          )
        }

        serviceList.value = pageResult.data.rows || []
        return pageResult
      }

      if (
        pageResult.code === 500 &&
        pageResult.msg &&
        pageResult.msg.includes('未查询到')
      ) {
        serviceList.value = []
        pageInfo.count = 0
        pageInfo.pageCount = 0
        return pageResult
      }

      return pageResult
    } finally {
      loading.value = false
    }
  }

  const fetchVendorDetail = async (id) => {
    const res = await API.getVendorById(id)
    if (res.code === 200) {
      detailVendor.value = res.data || null
    }
    return res
  }

  const fetchCategories = async () => {
    return optionCatalogStore.fetchUserCategoryOptions()
  }

  const prepareEdit = async (id) => {
    await fetchCategories()
    const res = await fetchVendorDetail(id)
    if (res.code !== 200 || !res.data) {
      return res
    }

    const data = res.data
    editForm.id = data.id
    editForm.username = data.username || ''
    editForm.companyName = data.companyName || ''
    editForm.phone = data.phone || ''
    editForm.companyChargerName = data.companyChargerName || ''
    editForm.companyAddress = data.companyAddress || ''
    editForm.serviceType = data.serviceType ?? null
    editForm.companyIntroduction = data.companyIntroduction || ''
    editForm.certificate = normalizeCertificateList(data.certificate)
    editForm.materialCategoryIds = normalizeMaterialCategoryList(
      data.materialCategory,
    ).map((item) => item.id)
    return res
  }

  const getEditValidationError = () => {
    if (!editForm.serviceType) {
      return '请选择服务类型'
    }
    if (
      [2, 3].includes(editForm.serviceType) &&
      editForm.materialCategoryIds.length === 0
    ) {
      return '请选择主营材料'
    }
    return ''
  }

  const submitEdit = async () => {
    const materialCategory = [2, 3].includes(editForm.serviceType)
      ? editForm.materialCategoryIds
          .map((id) => {
            const option = categoryOptions.value.find((item) => item.value === id)
            return option ? { id, name: option.label } : null
          })
          .filter(Boolean)
      : []

    const payload = {
      id: editForm.id,
      username: editForm.username,
      companyName: editForm.companyName,
      phone: editForm.phone,
      companyChargerName: editForm.companyChargerName,
      companyAddress: editForm.companyAddress,
      serviceType: editForm.serviceType,
      companyIntroduction: editForm.companyIntroduction,
      certificate: normalizeCertificateList(editForm.certificate),
      materialCategory,
    }

    return API.updateService(payload)
  }

  const auditVendor = async ({ id, audit, message = '' }) =>
    API.auditService(id, audit, message)

  const deleteVendors = async (ids = []) => API.deleteService(ids)

  const handleCheckAll = (checked) => {
    if (checked) {
      const ids = serviceList.value.map((item) => item.id)
      checkedIds.value = [...new Set([...checkedIds.value, ...ids])]
      return
    }

    const ids = serviceList.value.map((item) => item.id)
    checkedIds.value = checkedIds.value.filter((id) => !ids.includes(id))
  }

  const handleCheckOne = (checked, id) => {
    if (checked) {
      checkedIds.value = [...new Set([...checkedIds.value, id])]
      return
    }

    checkedIds.value = checkedIds.value.filter((value) => value !== id)
  }

  const isAllChecked = computed(
    () =>
      serviceList.value.length > 0 &&
      serviceList.value.every((item) => checkedIds.value.includes(item.id)),
  )

  const isIndeterminate = computed(() => {
    const checkedCount = serviceList.value.filter((item) =>
      checkedIds.value.includes(item.id),
    ).length
    return checkedCount > 0 && checkedCount < serviceList.value.length
  })

  return {
    loading,
    currentStatus,
    searchName,
    serviceList,
    checkedIds,
    detailVendor,
    categoryOptions,
    pageInfo,
    editForm,
    serviceTypeOptions,
    isAllChecked,
    isIndeterminate,
    resetCheckedIds,
    resetDetailVendor,
    resetEditForm,
    getServiceTypeName,
    formatStatus,
    getCertFileName,
    fetchData,
    fetchVendorDetail,
    fetchCategories,
    prepareEdit,
    getEditValidationError,
    submitEdit,
    auditVendor,
    deleteVendors,
    handleCheckAll,
    handleCheckOne,
  }
})
