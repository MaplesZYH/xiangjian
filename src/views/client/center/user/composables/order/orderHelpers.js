import { resolveAssetUrl } from '@/utils/asset'

export const paymentChannelOptions = [
  { label: '支付宝支付', value: 'ALIPAY' },
  { label: '微信支付', value: 'WECHAT' },
]

export const refundReasonOptions = [
  { label: '计划有变，暂不继续', value: '计划有变，暂不继续' },
  { label: '价格原因，申请退款', value: '价格原因，申请退款' },
  { label: '重复支付或误支付', value: '重复支付或误支付' },
  { label: '与平台沟通后申请退款', value: '与平台沟通后申请退款' },
  { label: '施工安排调整，申请退款', value: '施工安排调整，申请退款' },
]

export const formatOrderStatus = (status) => {
  const map = {
    0: '订单提交',
    1: '派单中',
    2: '已派单',
    3: '施工中',
    4: '已完成',
    5: '已取消',
  }
  return map[status] !== undefined ? map[status] : status || '未知状态'
}

export const formatPaymentStatus = (status) => {
  const map = {
    0: '待支付',
    1: '部分支付',
    2: '已结清',
    3: '已退款',
  }
  return map[status] !== undefined ? map[status] : status || '未知'
}

export const getStatusType = (status) => {
  const map = {
    0: 'default',
    1: 'warning',
    2: 'info',
    3: 'info',
    4: 'success',
    5: 'error',
  }
  return map[status] || 'default'
}

export const formatAmount = (value) => {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? '0.00' : amount.toFixed(2)
}

export const formatCurrencyNumber = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export const formatDateTime = (value) => {
  if (!value) return '--'
  return String(value).replace('T', ' ')
}

export const normalizeOptionSelectionValue = (value) => {
  const resolved = Number(value)
  return Number.isFinite(resolved) && resolved > 0 ? resolved : null
}

export const resolvePaymentRecordId = (record) => {
  const value = Number(record?.id || record?.paymentRecordId || 0)
  return value > 0 ? value : null
}

export const isConstructionStagePaymentRecord = (record) => {
  const stage = String(record?.paymentStage || '').trim()
  if (!stage) return false
  return stage.includes('施工进度款') || stage === 'NODE'
}

const detailPaymentChannelMap = {
  ALIPAY: '支付宝',
  WECHAT: '微信支付',
}

const detailPaymentStageMap = {
  ORDER: '首付款',
  NODE: '节点付款',
  FINAL: '尾款',
}

const paymentBillTypeMap = {
  BUILD_DEPOSIT: '建房定金',
  ADJUSTMENT: '补差账单',
  OPTION_CHANGE: '选配变更补价',
  STAGE_PAYMENT: '节点进度款',
}

export const getDetailPaymentChannelText = (channel) =>
  detailPaymentChannelMap[channel] || channel || '--'

export const getDetailPaymentChannelType = (channel) => {
  if (channel === 'ALIPAY') return 'info'
  if (channel === 'WECHAT') return 'success'
  return 'default'
}

export const getDetailPaymentStageText = (stage) =>
  detailPaymentStageMap[stage] || stage || '--'

export const getPaymentBillTypeText = (billType) =>
  paymentBillTypeMap[billType] || billType || '待支付账单'

export const getPaymentBillTypeTagType = (billType) => {
  if (billType === 'BUILD_DEPOSIT') return 'warning'
  if (billType === 'ADJUSTMENT') return 'error'
  if (billType === 'OPTION_CHANGE') return 'warning'
  if (billType === 'STAGE_PAYMENT') return 'info'
  return 'default'
}

export const getPaymentStatusType = (status) => {
  if (status === 2) return 'success'
  if (status === 1) return 'info'
  if (status === 3) return 'error'
  return 'warning'
}

export const extractPaymentBillRows = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.records)) return data.records
  return []
}

export const sortPendingPaymentBills = (rows = []) =>
  [...rows].sort((a, b) => {
    const timeA = a?.createTime ? new Date(a.createTime).getTime() : 0
    const timeB = b?.createTime ? new Date(b.createTime).getTime() : 0
    if (timeA !== timeB) return timeB - timeA
    return Number(b?.id || 0) - Number(a?.id || 0)
  })

export const findPendingBillById = (bills = [], billId) =>
  bills.find((item) => Number(item?.id || 0) === Number(billId)) || null

export const findPendingStageBillByNodeId = (bills = [], nodeId) =>
  bills.find(
    (item) =>
      item?.billType === 'STAGE_PAYMENT' &&
      Number(item?.relatedNodeId || 0) === Number(nodeId),
  ) || null

export const normalizePaymentBillStatus = (status) => {
  const normalizedStatus = String(status || '')
    .trim()
    .toUpperCase()

  if (
    ['PENDING', 'PAYING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(
      normalizedStatus,
    )
  ) {
    return normalizedStatus
  }

  return 'PENDING'
}

export const isPendingPaymentBillStatus = (status) =>
  normalizePaymentBillStatus(status) === 'PENDING'

export const isPayingPaymentBillStatus = (status) =>
  normalizePaymentBillStatus(status) === 'PAYING'

export const getPaymentBillStatusText = (status) => {
  const normalizedStatus = normalizePaymentBillStatus(status)
  const statusMap = {
    PENDING: '待支付',
    PAYING: '支付中',
    PAID: '已支付',
    CANCELLED: '已取消',
    EXPIRED: '已失效',
    REFUNDED: '已退款',
  }
  return statusMap[normalizedStatus] || '待支付'
}

export const getPaymentBillStatusTagType = (status) => {
  const normalizedStatus = normalizePaymentBillStatus(status)
  if (normalizedStatus === 'PAID') return 'success'
  if (normalizedStatus === 'PAYING') return 'info'
  if (normalizedStatus === 'REFUNDED') return 'error'
  if (['CANCELLED', 'EXPIRED'].includes(normalizedStatus)) return 'default'
  return 'warning'
}

export const resolveConstructionNodeAmount = (...nodes) => {
  const candidates = nodes.flatMap((node) => [
    node?.amount,
    node?.price,
    node?.nodeAmount,
    node?.nodePrice,
  ])

  for (const candidate of candidates) {
    if (candidate === '' || candidate === null || candidate === undefined) {
      continue
    }

    const amount = Number(candidate)
    if (Number.isFinite(amount) && amount > 0) {
      return Number(amount.toFixed(2))
    }
  }

  return 0
}

const appendContractUrl = (list, value) => {
  if (typeof value !== 'string') return
  const trimmed = value.trim()
  if (!trimmed || list.includes(trimmed)) return
  list.push(trimmed)
}

export const buildCurrentOrderContractUrls = (order) => {
  const urls = []
  const contract = order?.orderContract
  if (!contract) return urls

  if (typeof contract === 'string') {
    appendContractUrl(urls, contract)
    return urls.map((item) => resolveAssetUrl(item))
  }

  if (Array.isArray(contract)) {
    contract.forEach((item) => {
      if (typeof item === 'string') {
        appendContractUrl(urls, item)
        return
      }
      appendContractUrl(urls, item?.fileUrl)
      appendContractUrl(urls, item?.url)
    })
    return urls.map((item) => resolveAssetUrl(item))
  }

  if (typeof contract === 'object') {
    appendContractUrl(urls, contract.fileUrl)
    appendContractUrl(urls, contract.url)
    if (Array.isArray(contract.contractUrls)) {
      contract.contractUrls.forEach((item) => appendContractUrl(urls, item))
    }
  }

  return urls.map((item) => resolveAssetUrl(item))
}

export const resolveStagePaymentNodeName = (bill, constructionInfo) => {
  const relatedNodeId = Number(bill?.relatedNodeId || 0)
  if (relatedNodeId > 0) {
    const relatedNode = (constructionInfo?.nodeDetails || []).find(
      (node) => Number(node?.nodeId || node?.id) === relatedNodeId,
    )
    if (relatedNode?.name) return relatedNode.name
  }

  const rawTitle = String(bill?.billTitle || '').trim()
  if (!rawTitle) return ''
  const titleParts = rawTitle.split(/[:：]/)
  if (titleParts.length > 1) {
    const nodeName = titleParts[titleParts.length - 1].trim()
    if (nodeName) return nodeName
  }
  return rawTitle
}

export const getPaymentBillDisplayTitle = (bill, constructionInfo) => {
  if (bill?.billType === 'BUILD_DEPOSIT') return '建房定金'
  if (bill?.billType === 'OPTION_CHANGE') {
    return bill?.billTitle || '选配变更补价'
  }
  if (bill?.billType === 'STAGE_PAYMENT') {
    return resolveStagePaymentNodeName(bill, constructionInfo) || '--'
  }
  return bill?.billTitle || '--'
}

const parseRefundAuditOperator = (value) => {
  const raw = String(value || '').trim()
  if (!raw) {
    return {
      name: '--',
      phone: '--',
    }
  }

  if (raw.includes('|')) {
    const [namePart, phonePart] = raw.split('|')
    return {
      name: (namePart || '').trim() || '--',
      phone: (phonePart || '').trim() || '--',
    }
  }

  if (/^1\d{10}$/.test(raw)) {
    return {
      name: '--',
      phone: raw,
    }
  }

  return {
    name: raw,
    phone: '--',
  }
}

export const getRefundAuditOperatorPhone = (value) =>
  parseRefundAuditOperator(value).phone
