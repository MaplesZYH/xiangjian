import { computed, ref, watch } from 'vue'

export const useManageDetailOrderDispatch = ({
  detailOrder,
  canDispatch,
  isDispatchStageLocked,
  activeConstructionOrder,
  allServicesAccepted,
  constructionVendorOptions,
  materialDispatchList,
  materialVendorOptions,
  redispatchVendorOptions,
  materialForm,
  redispatchForm,
  currentTarget,
  currentDispatchOrder,
  currentNodeDetail,
  constructionInfo,
  currentContractUrl,
  hasAdminPaymentBillRows,
  hasConstructionNodeInstances,
  canConfigureConstructionPrice,
  canStartConstruction,
  orderManageStore,
  redispatchSubmitting,
  showCancelModal,
  cancelReason,
  message,
  dialog,
  getErrorMessage,
  h,
  NButton,
  NTag,
  getVendorStatusInfo,
  hasVendorRejectReason,
  showVendorReasonDialog,
  loadAdminOptionalChangeList,
  loadConstructionStatus,
  startConstructionProcess,
}) => {
  const showDispatchModal = ref(false)
  const dispatchTab = ref('contract')
  const showMaterialDispatchModal = ref(false)
  const materialDispatchReplacingVendorOrderId = ref(null)
  const showRedispatchModal = ref(false)
  const depositSubmitting = ref(false)
  const planSubmitting = ref(false)
  let dispatchPaymentPollTimer = null

  const normalizeMaterialName = (value) => String(value || '').trim()

  const isMaterialDispatchOutdated = (row) => {
    const currentName = normalizeMaterialName(row?.name)
    const dispatchedName = normalizeMaterialName(row?.statusData?.materialName)
    if (!row?.statusData || !currentName || !dispatchedName) return false
    return currentName !== dispatchedName
  }

  const selectedMaterialVendorOption = computed(
    () =>
      materialVendorOptions.value.find(
        (item) => item.value === materialForm.vendorId,
      ) || null,
  )

  const selectedRedispatchVendorOption = computed(
    () =>
      redispatchVendorOptions.value.find(
        (item) => item.value === redispatchForm.vendorId,
      ) || null,
  )

  const stopDispatchPaymentPolling = () => {
    if (dispatchPaymentPollTimer) {
      window.clearTimeout(dispatchPaymentPollTimer)
      dispatchPaymentPollTimer = null
    }
  }

  const shouldShowConstructionPricingButton = computed(
    () => Number(detailOrder.value?.orderStatus) < 3,
  )

  const constructionWorkflowStarted = computed(
    () => Number(detailOrder.value?.orderStatus) >= 3,
  )

  const constructionPricingButtonText = computed(() => '确认开工节点金额')

  const canOpenConstructionPricingEntry = computed(
    () => canDispatch.value && Number(detailOrder.value?.orderStatus) !== 5,
  )

  const canManageMaterialDispatch = computed(
    () => canDispatch.value && Number(detailOrder.value?.orderStatus) < 4,
  )

  const canStartConstructionEntry = computed(
    () =>
      Number(detailOrder.value?.orderStatus) === 2 &&
      canDispatch.value &&
      allServicesAccepted.value &&
      canConfigureConstructionPrice.value &&
      canStartConstruction.value,
  )

  const canSyncConstructionPricePlan = computed(
    () =>
      Number(detailOrder.value?.orderStatus) === 3 &&
      hasConstructionNodeInstances.value &&
      canConfigureConstructionPrice.value,
  )

  const shouldShowConstructionProgressButton = computed(
    () => Number(detailOrder.value?.orderStatus) >= 3 && !!constructionInfo.value,
  )

  const ensureMaterialDispatchEditable = () => {
    if (canManageMaterialDispatch.value) return true
    message.warning('当前订单不可继续材料派单')
    return false
  }

  const ensureConstructionDispatchEditable = () => {
    if (!canDispatch.value) {
      message.warning('请先上传合同后再派单')
      return false
    }
    if (Number(detailOrder.value?.orderStatus) === 5) {
      message.warning('已取消订单无法继续处理/派单')
      return false
    }
    if (isDispatchStageLocked.value) {
      message.warning('订单已进入施工阶段，施工单位派单已锁定')
      return false
    }
    return true
  }

  const handleOpenDispatch = async (item) => {
    if (Number(item?.orderStatus) === 5) {
      message.warning('已取消订单无法继续处理/派单')
      return
    }

    showDispatchModal.value = true
    currentDispatchOrder.value = item
    constructionInfo.value = null
    currentNodeDetail.value = null

    await orderManageStore.fetchOrderDetailInternal(item.id)
    orderManageStore.syncDispatchListItem()
    await loadAdminOptionalChangeList(item.id)

    dispatchTab.value = currentContractUrl.value ? 'dispatch' : 'contract'

    orderManageStore.resetConstructionForm()
    await orderManageStore.initDispatchState()
    constructionVendorOptions.value = []

    if (Number(detailOrder.value?.orderStatus) >= 3) {
      await loadConstructionStatus()
      dispatchTab.value = hasAdminPaymentBillRows.value ? 'bills' : 'flow'
    }
    stopDispatchPaymentPolling()
  }

  const handleGoToConstructionPricing = async () => {
    if (!canOpenConstructionPricingEntry.value) {
      message.warning('请先完成合同上传后，再确认开工节点金额')
      return
    }
    dispatchTab.value = 'pricing'
    if (constructionWorkflowStarted.value) {
      await loadConstructionStatus()
    }
  }

  const handleUpdateConstructionDepositDraft = (amount) => {
    orderManageStore.setConstructionDepositDraft(amount)
  }

  const handleSaveConstructionDeposit = async (amount) => {
    if (!canConfigureConstructionPrice.value) {
      message.warning('当前账号无权修改建房定金')
      return
    }
    depositSubmitting.value = true
    try {
      const res = await orderManageStore.submitConstructionDepositAmount(amount)
      if (res.code !== 200) {
        message.error(res.msg || '保存建房定金失败')
        return
      }
      await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
      orderManageStore.syncDispatchListItem()
      message.success('建房定金已更新，剩余未支付节点金额已按新定金重算')
    } catch (error) {
      message.error(getErrorMessage(error, '保存建房定金失败'))
    } finally {
      depositSubmitting.value = false
    }
  }

  const handleConfirmConstructionPricing = () => {
    if (!canStartConstructionEntry.value) {
      message.warning('请先完成派单并等待全部服务商接单后，再确认开工节点金额')
      return
    }

    dialog.warning({
      title: '确认节点金额并开启施工',
      content:
        '确认后将调用后端开启施工流程，并按后端规则同步当前节点金额。',
      positiveText: '确认开启',
      negativeText: '再检查一下',
      onPositiveClick: async () => {
        planSubmitting.value = true
        try {
          const started = await startConstructionProcess('pricing')
          if (!started) return false

          const res = await orderManageStore.submitConstructionPricePlan()
          if (res.code !== 200) {
            message.error(res.msg || '同步节点金额失败')
            dispatchTab.value = 'pricing'
            return false
          }

          await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
          orderManageStore.syncDispatchListItem()
          await loadConstructionStatus()
          dispatchTab.value = 'bills'
          message.success('节点金额已确认，用户可按当前节点账单继续支付')
          return true
        } finally {
          planSubmitting.value = false
        }
      },
    })
  }

  const handleSyncConstructionPricePlan = async () => {
    if (!canSyncConstructionPricePlan.value) {
      message.warning('当前订单暂不满足同步节点金额的条件')
      return
    }

    planSubmitting.value = true
    try {
      const res = await orderManageStore.submitConstructionPricePlan()
      if (res.code !== 200) {
        message.error(res.msg || '同步节点金额失败')
        return
      }

      await orderManageStore.fetchOrderDetailInternal(currentDispatchOrder.value.id)
      orderManageStore.syncDispatchListItem()
      await loadConstructionStatus()
      message.success('已按后端规则同步未支付节点金额')
    } catch (error) {
      message.error(getErrorMessage(error, '同步节点金额失败'))
    } finally {
      planSubmitting.value = false
    }
  }

  const loadBuilders = async () => {
    try {
      await orderManageStore.loadBuilders()
    } catch (e) {
      constructionVendorOptions.value = []
      message.warning('加载建筑商失败')
    }
  }

  const submitConstructionDispatch = async () => {
    if (!ensureConstructionDispatchEditable()) return
    try {
      const res = await orderManageStore.createConstructionDispatch()
      if (res.code === 200 || res.type) {
        message.success('施工派单成功')
        await orderManageStore.initDispatchState()
      } else {
        message.error(res.msg || '派单失败')
      }
    } catch (err) {
      message.error(getErrorMessage(err, '施工派单失败'))
    }
  }

  const openMaterialDispatch = async (row, replacingVendorOrderId = null) => {
    if (!ensureMaterialDispatchEditable()) return
    showMaterialDispatchModal.value = true
    materialDispatchReplacingVendorOrderId.value =
      Number(replacingVendorOrderId) || null

    try {
      await orderManageStore.prepareMaterialDispatch(row)
      if (!materialVendorOptions.value.length) {
        materialVendorOptions.value = []
        message.info('未找到匹配的供应商')
      }
    } catch (error) {
      materialVendorOptions.value = []
      message.error('加载供应商失败')
    }
  }

  const openRedispatchModal = async (vendorOrder) => {
    if (!ensureMaterialDispatchEditable()) return
    showRedispatchModal.value = true

    try {
      await orderManageStore.prepareRedispatch(vendorOrder)
      if (!redispatchVendorOptions.value.length) {
        message.info('未找到可重派的服务商')
      }
    } catch (error) {
      redispatchVendorOptions.value = []
      message.error(getErrorMessage(error, '加载重派服务商失败'))
    }
  }

  const submitRedispatch = async () => {
    if (!ensureMaterialDispatchEditable()) return
    redispatchSubmitting.value = true
    try {
      const updateRes = await orderManageStore.submitRedispatch()
      if (updateRes.code !== 200) {
        message.error(updateRes.msg || '重派失败')
        return
      }
      message.success('重新派单成功')
      showRedispatchModal.value = false
      orderManageStore.resetRedispatchForm()
      await orderManageStore.initDispatchState()
    } catch (error) {
      message.error(getErrorMessage(error, '重新派单失败'))
    } finally {
      redispatchSubmitting.value = false
    }
  }

  const submitMaterialDispatch = async () => {
    if (!ensureMaterialDispatchEditable()) return
    try {
      if (materialDispatchReplacingVendorOrderId.value) {
        orderManageStore.prepareCancelVendorOrder(
          materialDispatchReplacingVendorOrderId.value,
        )
        cancelReason.value = `同分类选配已调整为「${currentTarget.value.name || '当前产品'}」，取消旧服务商后重新派单`
        const cancelRes = await orderManageStore.cancelCurrentVendorOrder()
        if (cancelRes.code !== 200) {
          message.error(cancelRes.msg || '取消旧派单失败')
          return
        }
      }

      const res = await orderManageStore.createMaterialDispatch()
      if (res.code === 200 || res.type) {
        message.success('材料派单成功')
        showMaterialDispatchModal.value = false
        materialDispatchReplacingVendorOrderId.value = null
        await orderManageStore.initDispatchState()
      } else {
        message.error(res.msg || '派单失败')
      }
    } catch (err) {
      message.error(getErrorMessage(err, '材料派单失败'))
    }
  }

  const handlePreCancel = (vendorOrderId) => {
    if (!ensureMaterialDispatchEditable()) return
    orderManageStore.prepareCancelVendorOrder(vendorOrderId)
    showCancelModal.value = true
  }

  const handleReDispatch = (vendorOrderId) => {
    if (!ensureMaterialDispatchEditable()) return
    const sourceOrder =
      activeConstructionOrder.value?.vendorOrderId === vendorOrderId
        ? activeConstructionOrder.value
        : materialDispatchList.value.find(
            (item) => item.statusData?.vendorOrderId === vendorOrderId,
          )?.statusData

    if (!sourceOrder) {
      message.warning('未找到可重派的服务商订单')
      return
    }

    openRedispatchModal(sourceOrder)
  }

  const submitCancel = async () => {
    try {
      const res = await orderManageStore.cancelCurrentVendorOrder()
      if (res.code === 200) {
        message.success('已取消该派单')
        showCancelModal.value = false
        await orderManageStore.initDispatchState()
      } else {
        message.error(res.msg || '取消失败')
      }
    } catch (err) {
      message.error(getErrorMessage(err, '请求异常'))
    }
  }

  const materialColumns = [
    { title: '材料分类', key: 'category' },
    { title: '具体产品', key: 'name' },
    {
      title: '状态/服务商',
      key: 'statusInfo',
      render(row) {
        if (row.statusData) {
          const statusInfo = getVendorStatusInfo(row.statusData.orderStatus)
          return h('div', { style: { display: 'inline-flex', alignItems: 'center' } }, [
            h(
              NTag,
              {
                type: statusInfo.type,
                size: 'small',
              },
              { default: () => statusInfo.text },
            ),
            h(
              'span',
              { style: { fontSize: '12px', color: '#666', marginLeft: '6px' } },
              row.statusData.companyName || `ID:${row.statusData.vendorOrderId}`,
            ),
            hasVendorRejectReason(row.statusData)
              ? h(
                  NButton,
                  {
                    size: 'tiny',
                    tertiary: true,
                    type: 'warning',
                    style: { marginLeft: '6px' },
                    onClick: () => showVendorReasonDialog(row.statusData.vendorNotes),
                  },
                  { default: () => '查看拒绝理由' },
                )
              : null,
            isMaterialDispatchOutdated(row)
              ? h(
                  NTag,
                  {
                    size: 'small',
                    type: 'warning',
                    bordered: false,
                    style: { marginLeft: '6px' },
                  },
                  { default: () => '选配已变更' },
                )
              : null,
          ])
        }

        return h(
          NTag,
          { type: 'default', size: 'small' },
          { default: () => '待派单' },
        )
      },
    },
    {
      title: '成交价格',
      key: 'priceInfo',
      render(row) {
        return row.statusData ? `¥${row.statusData.price}` : '-'
      },
    },
    {
      title: '操作',
      key: 'actions',
      render(row) {
        if (!canManageMaterialDispatch.value) {
          return h(
            'span',
            { style: { color: '#999', fontSize: '12px' } },
            '不可派单',
          )
        }

        if (row.statusData) {
          const status = row.statusData.orderStatus
          const outdated = isMaterialDispatchOutdated(row)

          if (outdated && [1, 3].includes(status)) {
            return h(
              NButton,
              {
                type: 'warning',
                size: 'small',
                onClick: () =>
                  openMaterialDispatch(row, row.statusData.vendorOrderId),
              },
              { default: () => '更换服务商' },
            )
          }
          if (status === 0) {
            return h(
              NButton,
              {
                type: 'warning',
                size: 'small',
                onClick: () => handleReDispatch(row.statusData.vendorOrderId),
              },
              { default: () => '重新派单' },
            )
          }
          if ([1, 3].includes(status)) {
            return h(
              NButton,
              {
                type: 'error',
                size: 'small',
                onClick: () => handlePreCancel(row.statusData.vendorOrderId),
              },
              { default: () => '取消' },
            )
          }
          return h(
            'span',
            { style: { color: '#999', fontSize: '12px' } },
            '不可操作',
          )
        }

        return h(
          NButton,
          {
            type: 'primary',
            size: 'small',
            onClick: () => openMaterialDispatch(row),
          },
          { default: () => '指派' },
        )
      },
    },
  ]

  watch(showMaterialDispatchModal, (show) => {
    if (!show) {
      orderManageStore.resetMaterialDispatchForm()
      materialVendorOptions.value = []
      materialDispatchReplacingVendorOrderId.value = null
    }
  })

  watch(showRedispatchModal, (show) => {
    if (!show) {
      orderManageStore.resetRedispatchForm()
    }
  })

  return {
    showDispatchModal,
    dispatchTab,
    showMaterialDispatchModal,
    materialDispatchReplacingVendorOrderId,
    showRedispatchModal,
    selectedMaterialVendorOption,
    selectedRedispatchVendorOption,
    depositSubmitting,
    planSubmitting,
    stopDispatchPaymentPolling,
    shouldShowConstructionPricingButton,
    constructionWorkflowStarted,
    constructionPricingButtonText,
    canOpenConstructionPricingEntry,
    canManageMaterialDispatch,
    canStartConstructionEntry,
    canSyncConstructionPricePlan,
    shouldShowConstructionProgressButton,
    handleOpenDispatch,
    handleGoToConstructionPricing,
    handleUpdateConstructionDepositDraft,
    handleSaveConstructionDeposit,
    handleConfirmConstructionPricing,
    handleSyncConstructionPricePlan,
    loadBuilders,
    submitConstructionDispatch,
    materialColumns,
    submitRedispatch,
    submitMaterialDispatch,
    handlePreCancel,
    handleReDispatch,
    submitCancel,
  }
}
