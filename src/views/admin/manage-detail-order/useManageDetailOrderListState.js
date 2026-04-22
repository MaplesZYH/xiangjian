import { computed, ref } from 'vue'

export const useManageDetailOrderListState = ({
  orderList,
  filters,
  dialog,
}) => {
  const activeTodoFilter = ref('all')

  const orderStatusOptions = [
    { label: '未派单', value: 0 },
    { label: '派单中', value: 1 },
    { label: '已派单', value: 2 },
    { label: '施工中', value: 3 },
    { label: '已完成', value: 4 },
    { label: '已取消', value: 5 },
  ]

  const orderStatusMap = {
    0: '未派单',
    1: '派单中',
    2: '已派单',
    3: '施工中',
    4: '已完成',
    5: '已取消',
  }

  const styleMap = {
    modern: '现代风格',
    chinese: '中式风格',
    european: '欧式风格',
  }

  const paymentStatusOptions = [
    { label: '待支付', value: 0 },
    { label: '部分支付', value: 1 },
    { label: '已结清', value: 2 },
    { label: '已退款', value: 3 },
  ]

  const paymentStatusMap = {
    0: '待支付',
    1: '部分支付',
    2: '已结清',
    3: '已退款',
  }

  const hasUploadedContract = (order) => {
    const contract = order?.orderContract
    if (!contract) return false
    if (typeof contract === 'string') return contract.trim().length > 0
    if (Array.isArray(contract)) return contract.length > 0
    if (typeof contract === 'object') {
      if (typeof contract.fileUrl === 'string') {
        return contract.fileUrl.trim().length > 0
      }
      return Object.keys(contract).length > 0
    }
    return false
  }

  const getOrderTodoMeta = (order) => {
    const orderStatus = Number(order?.orderStatus)
    const hasContract = hasUploadedContract(order)
    const contractLoaded = Boolean(order?.contractLoaded)

    if (orderStatus === 5) {
      return {
        key: 'cancelled',
        label: '已取消',
        description: '订单已取消',
        type: 'default',
        accent: 'neutral',
      }
    }

    if (orderStatus >= 4) {
      return {
        key: 'completed',
        label: '已完结',
        description: '订单流程已完成',
        type: 'success',
        accent: 'success',
      }
    }

    if (orderStatus === 3) {
      return {
        key: 'construction',
        label: '施工中跟进',
        description: '跟进施工节点与账单',
        type: 'success',
        accent: 'success',
      }
    }

    if (orderStatus === 2) {
      return {
        key: 'readyConstruction',
        label: '待开启施工',
        description: '接单完成后可开启施工',
        type: 'info',
        accent: 'brand',
      }
    }

    if (orderStatus === 1) {
      return {
        key: 'dispatching',
        label: '派单中跟进',
        description: '等待服务商接单或重派',
        type: 'warning',
        accent: 'warning',
      }
    }

    if (orderStatus === 0 && contractLoaded && !hasContract) {
      return {
        key: 'contract',
        label: '待上传合同',
        description: '上传合同后可进入派单',
        type: 'warning',
        accent: 'warning',
      }
    }

    if (orderStatus === 0 && hasContract) {
      return {
        key: 'dispatch',
        label: '待派单',
        description: '可进入处理/派单',
        type: 'info',
        accent: 'info',
      }
    }

    if (orderStatus === 0) {
      return {
        key: 'contract',
        label: '待上传合同',
        description: '正在同步合同状态',
        type: 'warning',
        accent: 'warning',
      }
    }

    return {
      key: 'other',
      label: '待跟进',
      description: '请进入详情查看当前状态',
      type: 'default',
      accent: 'neutral',
    }
  }

  const todoCardConfigs = [
    { key: 'contract', label: '待上传合同' },
    { key: 'dispatch', label: '待派单' },
    { key: 'dispatching', label: '派单中跟进' },
    { key: 'readyConstruction', label: '待开启施工' },
    { key: 'construction', label: '施工中跟进' },
  ]

  const todoCountMap = computed(() => {
    const counts = Object.create(null)
    orderList.value.forEach((item) => {
      const key = getOrderTodoMeta(item).key
      counts[key] = Number(counts[key] || 0) + 1
    })
    return counts
  })

  const todoCards = computed(() => [
    {
      key: 'all',
      label: '全部订单',
      count: orderList.value.length,
    },
    ...todoCardConfigs.map((config) => ({
      ...config,
      count: Number(todoCountMap.value[config.key] || 0),
    })),
  ])

  const activeTodoFilterLabel = computed(() => {
    const matched = todoCards.value.find((item) => item.key === activeTodoFilter.value)
    return matched?.label || '全部订单'
  })

  const visibleOrderList = computed(() => {
    if (activeTodoFilter.value === 'all') return orderList.value
    return orderList.value.filter(
      (item) => getOrderTodoMeta(item).key === activeTodoFilter.value,
    )
  })

  const emptyOrderListDescription = computed(() =>
    activeTodoFilter.value === 'all'
      ? '暂无符合条件的订单数据'
      : `当前页暂无“${activeTodoFilterLabel.value}”订单`,
  )

  const formatTodoBadgeCount = (count) => {
    const value = Number(count || 0)
    if (value > 99) return '99+'
    return String(value)
  }

  const getStatusText = (status) => orderStatusMap[status] || `未知(${status})`
  const getStyleLabel = (value) => styleMap[value] || value || '--'

  const getStatusType = (status) => {
    const numericStatus = Number(status)
    if (numericStatus === 5) return 'error'
    if (numericStatus === 4) return 'success'
    if (numericStatus === 3 || numericStatus === 2) return 'info'
    if (numericStatus === 1 || numericStatus === 0) return 'warning'
    return 'default'
  }

  const getPaymentText = (status) => paymentStatusMap[status] || `未知(${status})`

  const getPaymentType = (status) => {
    if (status === 2) return 'success'
    if (status === 0) return 'error'
    return 'warning'
  }

  const getVendorStatusInfo = (status) => {
    const map = {
      0: { text: '已拒接', type: 'error' },
      1: { text: '已接受', type: 'success' },
      2: { text: '已完成', type: 'info' },
      3: { text: '未回复', type: 'warning' },
      4: { text: '已取消', type: 'default' },
    }
    return map[status] || { text: '未知', type: 'default' }
  }

  const hasVendorRejectReason = (order) =>
    Number(order?.orderStatus) === 0 && !!order?.vendorNotes

  const getVendorRejectReason = (order) => String(order?.vendorNotes || '').trim()

  const getVendorServiceTypeText = (type) => {
    const map = {
      1: '建筑商',
      2: '材料商',
      3: '综合服务商',
    }
    return map[Number(type)] || '未知类型'
  }

  const formatVendorDistance = (distance) => {
    const value = Number(distance)
    return Number.isFinite(value) ? `距离${value.toFixed(1)}km` : '距离未知'
  }

  const showVendorReasonDialog = (notes) => {
    dialog.info({
      title: '服务商拒绝理由',
      content: notes || '服务商未填写拒绝理由',
    })
  }

  const handleActiveTodoFilterChange = (value) => {
    activeTodoFilter.value = value
  }

  const handleFilterFieldUpdate = ({ key, value }) => {
    if (!key) return
    filters[key] = value
  }

  const canOpenDispatchEntry = (item) =>
    Number(item?.orderStatus) !== 5 &&
    (Number(item?.orderStatus) < 4 || Number(item?.paymentStatus) === 2)

  return {
    activeTodoFilter,
    orderStatusOptions,
    paymentStatusOptions,
    todoCards,
    activeTodoFilterLabel,
    visibleOrderList,
    emptyOrderListDescription,
    formatTodoBadgeCount,
    getStatusText,
    getStyleLabel,
    getStatusType,
    getPaymentText,
    getPaymentType,
    getVendorStatusInfo,
    hasVendorRejectReason,
    getVendorRejectReason,
    getVendorServiceTypeText,
    formatVendorDistance,
    showVendorReasonDialog,
    handleActiveTodoFilterChange,
    handleFilterFieldUpdate,
    canOpenDispatchEntry,
  }
}
