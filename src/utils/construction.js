export const CONSTRUCTION_PROCESS_TYPE_MAP = {
  1: '砖混',
  2: '重钢',
}

export const CONSTRUCTION_NODE_STATUS = {
  WAIT_UPLOAD: 0,
  WAIT_PLATFORM_AUDIT: 1,
  WAIT_USER_AUDIT: 2,
  AUDIT_REJECTED: 3,
  FINISHED: 4,
  LOCKED: 5,
  WAIT_PAYMENT: 6,
}

export const CONSTRUCTION_NODE_STATUS_MAP = {
  [CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD]: '待服务商上传',
  [CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT]: '已上传，待平台审核',
  [CONSTRUCTION_NODE_STATUS.WAIT_USER_AUDIT]: '平台通过，待用户审核',
  [CONSTRUCTION_NODE_STATUS.AUDIT_REJECTED]: '审核驳回',
  [CONSTRUCTION_NODE_STATUS.FINISHED]: '节点已完成',
  [CONSTRUCTION_NODE_STATUS.LOCKED]: '节点已锁定/未开始',
  [CONSTRUCTION_NODE_STATUS.WAIT_PAYMENT]: '审核通过，待支付',
}

export const normalizeProcessText = (value) => {
  const text = String(value || '').trim()
  if (!text || text === '未知流程') return ''
  return text
}

export const getProcessText = (
  processType,
  processName,
  fallbackMethod = '',
) => {
  const normalizedProcessName = normalizeProcessText(processName)
  if (normalizedProcessName) return normalizedProcessName

  const normalizedFallbackMethod = normalizeProcessText(fallbackMethod)
  if (normalizedFallbackMethod) return normalizedFallbackMethod

  const normalizedProcessType = Number(processType)
  if (CONSTRUCTION_PROCESS_TYPE_MAP[normalizedProcessType]) {
    return CONSTRUCTION_PROCESS_TYPE_MAP[normalizedProcessType]
  }

  return '未知流程'
}

export const hasConstructionFlowStarted = (flow) => {
  if (!flow || typeof flow !== 'object') return false
  return Array.isArray(flow.nodeDetails) && flow.nodeDetails.length > 0
}

export const normalizeConstructionFlow = (flow) => {
  return hasConstructionFlowStarted(flow) ? flow : null
}
