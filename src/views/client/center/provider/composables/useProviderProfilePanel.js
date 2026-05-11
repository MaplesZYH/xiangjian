import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDialog, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { AUTH_SCOPE_PROVIDER } from '@/utils/auth'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useVendorOrderStore } from '@/stores/order/useVendorOrderStore'
import { useVendorProfileStore } from '@/stores/vendor/useVendorProfileStore'
import {
  getProviderCenterErrorMessage,
  getProviderMaterialTagStyle,
  getProviderServiceTypeTag,
  getProviderServiceTypeText,
} from '@/views/client/center/provider/composables/providerCenterHelpers'

export const useProviderProfilePanel = ({ emit, getProviderId }) => {
  const router = useRouter()
  const message = useMessage()
  const dialog = useDialog()
  const authStore = useAuthStore()
  const vendorOrderStore = useVendorOrderStore()
  const vendorProfileStore = useVendorProfileStore()

  const {
    loading,
    vendorInfo,
    categoryOptions,
    uploadedFiles,
    certificateChanged,
    submitting,
    selectedCompanyRegionCode,
    companyAddressPreview,
    canEditVendorInfo,
    editTipText,
  } = storeToRefs(vendorProfileStore)
  const { acceptedActiveOrderCount } = storeToRefs(vendorOrderStore)

  const editModalRef = ref(null)
  const showEditModal = ref(false)
  const editForm = vendorProfileStore.editForm
  const serviceTypeOptions = vendorProfileStore.serviceTypeOptions
  const companyAddressForm = vendorProfileStore.companyAddressForm
  const companyRegionCascaderOptions =
    vendorProfileStore.companyRegionCascaderOptions

  const requiresPasswordOnEdit = computed(
    () => Number(vendorInfo.value?.status) !== 1,
  )
  const canChangeServiceType = computed(
    () => Number(acceptedActiveOrderCount.value || 0) === 0,
  )
  const serviceTypeLockReason = computed(
    () => '当前存在已接单且正在处理的订单，暂不能修改服务类型。',
  )

  const passwordRules = [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
    {
      min: 8,
      max: 20,
      message: '密码长度必须在 8-20 位之间',
      trigger: ['blur', 'input'],
    },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/,
      message: '密码必须包含字母、数字和特殊字符',
      trigger: ['blur', 'input'],
    },
  ]

  const formRules = computed(() => ({
    companyName: { required: true, message: '请输入公司名称', trigger: 'blur' },
    ...(requiresPasswordOnEdit.value ? { password: passwordRules } : {}),
  }))

  const syncVendorDisplayName = (info) => {
    const companyName = info?.companyName || info?.username || ''
    if (!companyName) return
    authStore.patchScopeProfile(AUTH_SCOPE_PROVIDER, {
      name: companyName,
      vendorInfo: {
        ...(authStore.currentClientState?.info || {}),
        ...info,
        vendorId: info?.vendorId ?? info?.id ?? getProviderId(),
      },
    })
    emit('updateName', companyName)
  }

  const fetchVendorInfo = async ({
    activeMenu = 'company',
    refreshVendorOrders,
  } = {}) => {
    const userId = getProviderId()
    if (!userId) {
      message.error('未检测到登录信息')
      router.push('/login')
      return null
    }

    try {
      const res = await vendorProfileStore.fetchVendorInfo(userId)
      if (res?.code === 200 && res.data) {
        syncVendorDisplayName(res.data)
        if (activeMenu === 'orders') {
          await refreshVendorOrders?.()
        } else {
          await vendorOrderStore.refreshOrderSummary(res.data.id)
        }
      }
      return res
    } catch {
      message.error('网络异常，无法获取企业信息')
      return null
    }
  }

  const handleCompanyRegionUpdate = (...args) =>
    vendorProfileStore.handleCompanyRegionUpdate(...args)

  const handleEditFormFieldChange = ({ key, value }) => {
    if (!key) return
    editForm[key] = value
  }

  const handleCompanyAddressDetailChange = (value) => {
    companyAddressForm.detail = value
  }

  const handleEdit = async () => {
    try {
      await vendorProfileStore.prepareEditForm()
      showEditModal.value = true
    } catch {
      message.error('加载编辑信息失败')
    }
  }

  const handleUploadRequest = async ({ file, onFinish, onError }) => {
    try {
      message.loading('文件上传中...')
      const res = await vendorProfileStore.uploadCertificate(file.file)
      message.destroyAll()
      if (res.code === 200 && res.data) {
        message.success('上传成功')
        onFinish()
      } else {
        message.error(res.msg || '上传失败')
        onError()
      }
    } catch {
      message.destroyAll()
      message.error('上传出错')
      onError()
    }
  }

  const removeFile = async (file, index) => {
    if (file.id) {
      dialog.warning({
        title: '确认删除',
        content: '该文件已归档，确认要从服务器删除吗？',
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const res = await vendorProfileStore.deleteCertificate(file, index)
            if (res.code === 200) {
              message.success('删除成功')
            } else {
              message.error(res.msg || '删除失败')
            }
          } catch {
            message.error('删除请求异常')
          }
        },
      })
      return
    }

    await vendorProfileStore.deleteCertificate(file, index)
  }

  const handleRemoveFileRequest = async ({ file, index }) => {
    await removeFile(file, index)
  }

  const submitEdit = async ({ refreshVendorData } = {}) => {
    try {
      await editModalRef.value?.validate()
    } catch {
      return
    }

    const validationError = vendorProfileStore.getEditValidationError()
    if (validationError) {
      message.warning(validationError)
      return
    }

    try {
      const currentStatus = Number(vendorInfo.value.status)
      const hadCertificateChanged = certificateChanged.value
      const hadServiceTypeChanged =
        Number(editForm.serviceType) !== Number(vendorInfo.value.serviceType)
      if (hadServiceTypeChanged) {
        const vendorId = vendorInfo.value?.id || getProviderId()
        if (vendorId) {
          await vendorOrderStore.refreshOrderSummary(vendorId)
        }
        if (!canChangeServiceType.value) {
          message.warning(serviceTypeLockReason.value)
          return
        }
      }

      const res = await vendorProfileStore.submitEdit()
      if (res.code === 200) {
        message.success(
          currentStatus === 1 &&
            !hadCertificateChanged &&
            !hadServiceTypeChanged
            ? '企业信息修改成功'
            : '修改提交成功，请等待重新审核',
        )
        showEditModal.value = false
        await refreshVendorData?.()
      } else {
        message.error(res.msg || '提交失败')
      }
    } catch (error) {
      message.error(getProviderCenterErrorMessage(error, '提交请求异常'))
    }
  }

  return {
    loading,
    vendorInfo,
    categoryOptions,
    uploadedFiles,
    submitting,
    selectedCompanyRegionCode,
    companyAddressPreview,
    canEditVendorInfo,
    editTipText,
    editForm,
    serviceTypeOptions,
    companyAddressForm,
    companyRegionCascaderOptions,
    editModalRef,
    showEditModal,
    formRules,
    requiresPasswordOnEdit,
    canChangeServiceType,
    serviceTypeLockReason,
    fetchVendorInfo,
    handleCompanyRegionUpdate,
    handleEditFormFieldChange,
    handleCompanyAddressDetailChange,
    handleEdit,
    handleUploadRequest,
    handleRemoveFileRequest,
    submitEdit,
    getServiceTypeText: getProviderServiceTypeText,
    getServiceTypeTag: getProviderServiceTypeTag,
    getMaterialTagStyle: getProviderMaterialTagStyle,
  }
}
