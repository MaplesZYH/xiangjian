import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import API from '@/api/user/userData'

export const useAdminUserStore = defineStore('adminUser', () => {
  const userList = ref([])
  const searchPhone = ref('')
  const checkedIds = ref([])

  const pageinfo = reactive({
    page: 1,
    pageSize: 5,
    pageCount: 0,
    count: 0,
  })

  const fetchUsers = async () => {
    let pageResult = await API.getUserData(
      pageinfo.page,
      pageinfo.pageSize,
      searchPhone.value,
    )

    if (pageResult && pageResult.data) {
      pageinfo.count = Number(pageResult.data.total || 0)
      pageinfo.pageCount = Math.ceil(pageinfo.count / pageinfo.pageSize)

      if (pageinfo.count === 0) {
        userList.value = []
        return pageResult
      }

      if (pageinfo.page > pageinfo.pageCount) {
        pageinfo.page = pageinfo.pageCount
        pageResult = await API.getUserData(
          pageinfo.page,
          pageinfo.pageSize,
          searchPhone.value,
        )
      }

      userList.value = pageResult.data.rows || []
      return pageResult
    }

    userList.value = []
    pageinfo.count = 0
    pageinfo.pageCount = 0
    return pageResult
  }

  const handleCheckAll = (checked) => {
    if (checked) {
      const currentIds = userList.value.map((item) => item.id)
      checkedIds.value = [...new Set([...checkedIds.value, ...currentIds])]
      return
    }

    const currentIds = userList.value.map((item) => item.id)
    checkedIds.value = checkedIds.value.filter((id) => !currentIds.includes(id))
  }

  const handleCheckOne = (checked, id) => {
    if (checked) {
      checkedIds.value = [...new Set([...checkedIds.value, id])]
      return
    }

    checkedIds.value = checkedIds.value.filter((itemId) => itemId !== id)
  }

  const resetCheckedIds = () => {
    checkedIds.value = []
  }

  const deleteUsers = async (ids) => API.deleteUserData(ids)
  const addUser = async (data) => API.addUserData(data)
  const updateUser = async (data) => API.updateUserData(data)

  const isAllChecked = computed(() => {
    if (userList.value.length === 0) return false
    return userList.value.every((item) => checkedIds.value.includes(item.id))
  })

  const isIndeterminate = computed(() => {
    if (userList.value.length === 0) return false
    const count = userList.value.filter((item) =>
      checkedIds.value.includes(item.id),
    ).length
    return count > 0 && count < userList.value.length
  })

  return {
    userList,
    searchPhone,
    checkedIds,
    pageinfo,
    isAllChecked,
    isIndeterminate,
    fetchUsers,
    handleCheckAll,
    handleCheckOne,
    resetCheckedIds,
    deleteUsers,
    addUser,
    updateUser,
  }
})
