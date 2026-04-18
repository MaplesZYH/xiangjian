import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import API from '@/api/admin'

const roleMap = {
  1: '管理员',
  2: '财务',
  3: '运营',
  4: '销售',
}

export const useAdminEmployeeStore = defineStore('adminEmployee', () => {
  const adminList = ref([])
  const searchPhone = ref('')
  const checkedIds = ref([])

  const pageinfo = reactive({
    page: 1,
    pageSize: 5,
    pageCount: 0,
    count: 0,
  })

  const fetchAdmins = async () => {
    let pageResult = await API.getAdminData(
      pageinfo.page,
      pageinfo.pageSize,
      searchPhone.value,
    )

    if (pageResult && pageResult.data) {
      pageinfo.count = Number(pageResult.data.total || 0)
      pageinfo.pageCount = Math.ceil(pageinfo.count / pageinfo.pageSize)

      if (pageinfo.count === 0) {
        adminList.value = []
        return pageResult
      }

      if (pageinfo.page > pageinfo.pageCount) {
        pageinfo.page = pageinfo.pageCount
        pageResult = await API.getAdminData(
          pageinfo.page,
          pageinfo.pageSize,
          searchPhone.value,
        )
      }

      adminList.value = pageResult.data.rows || []
      return pageResult
    }

    adminList.value = []
    pageinfo.count = 0
    pageinfo.pageCount = 0
    return pageResult
  }

  const handleCheckAll = (checked) => {
    if (checked) {
      const currentIds = adminList.value.map((item) => item.id)
      checkedIds.value = [...new Set([...checkedIds.value, ...currentIds])]
      return
    }

    const currentIds = adminList.value.map((item) => item.id)
    checkedIds.value = checkedIds.value.filter((id) => !currentIds.includes(id))
  }

  const handleCheckOne = (checked, id) => {
    if (checked) {
      checkedIds.value = [...new Set([...checkedIds.value, id])]
      return
    }

    checkedIds.value = checkedIds.value.filter((item) => item !== id)
  }

  const resetCheckedIds = () => {
    checkedIds.value = []
  }

  const addAdmin = async (data) => API.addAdminData(data)
  const updateAdmin = async (data) => API.updateAdminData(data)
  const deleteAdmins = async (ids) => API.deleteAdminData(ids)

  const isAllChecked = computed(() => {
    if (adminList.value.length === 0) return false
    return adminList.value.every((item) => checkedIds.value.includes(item.id))
  })

  const isIndeterminate = computed(() => {
    if (adminList.value.length === 0) return false
    const count = adminList.value.filter((item) =>
      checkedIds.value.includes(item.id),
    ).length
    return count > 0 && count < adminList.value.length
  })

  return {
    roleMap,
    adminList,
    searchPhone,
    checkedIds,
    pageinfo,
    isAllChecked,
    isIndeterminate,
    fetchAdmins,
    handleCheckAll,
    handleCheckOne,
    resetCheckedIds,
    addAdmin,
    updateAdmin,
    deleteAdmins,
  }
})
