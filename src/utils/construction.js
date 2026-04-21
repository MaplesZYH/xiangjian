export const CONSTRUCTION_PROCESS_TYPE_MAP = {
  1: '砖混',
  2: '重钢',
}

export const CONSTRUCTION_STAGE_RATIO_MAP = {
  2: 0.2,
  3: 0.5,
  4: 0.28,
  5: 0.02,
}

export const CONSTRUCTION_STAGE_LABEL_MAP = {
  1: '定金',
  2: '一期',
  3: '二期',
  4: '三期',
  5: '尾款',
}

const CONSTRUCTION_STAGE_NODE_NAME_MAP = {
  1: [
    '现场勘测',
    '基础施工',
    '主体施工',
    '屋面工程，外墙装饰，门窗安装',
    '整体清洁',
  ],
  2: [
    '现场勘测',
    '基础施工',
    '主体钢结构安装，混凝土楼板现浇',
    '屋面工程，外墙装饰，门窗安装',
    '整体清洁',
  ],
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

const resolveProcessTypeByText = (value) => {
  const text = String(value || '').trim()
  if (!text) return 0
  if (text.includes('重钢')) return 2
  if (text.includes('砖混')) return 1
  return 0
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

export const resolveConstructionProcessType = (
  processType,
  processName,
  fallbackMethod = '',
) => {
  const numericProcessType = Number(processType)
  if (CONSTRUCTION_PROCESS_TYPE_MAP[numericProcessType]) {
    return numericProcessType
  }

  const resolvedByName = resolveProcessTypeByText(processName)
  if (resolvedByName) return resolvedByName

  return resolveProcessTypeByText(fallbackMethod)
}

export const getConstructionStageLabel = (sortOrder) =>
  CONSTRUCTION_STAGE_LABEL_MAP[Number(sortOrder)] || `阶段${sortOrder}`

export const getConstructionStageRatioText = (sortOrder) => {
  const ratio = CONSTRUCTION_STAGE_RATIO_MAP[Number(sortOrder)]
  if (!ratio) return '自定义定金'
  return `${Math.round(ratio * 100)}%`
}

export const getConstructionStageDefinitions = (
  processType,
  processName,
  fallbackMethod = '',
) => {
  const resolvedType =
    resolveConstructionProcessType(processType, processName, fallbackMethod) || 1
  const nodeNames =
    CONSTRUCTION_STAGE_NODE_NAME_MAP[resolvedType] ||
    CONSTRUCTION_STAGE_NODE_NAME_MAP[1]

  return nodeNames.map((nodeName, index) => {
    const sortOrder = index + 1
    return {
      sortOrder,
      stageLabel: getConstructionStageLabel(sortOrder),
      nodeName,
      ratio: CONSTRUCTION_STAGE_RATIO_MAP[sortOrder] || null,
      ratioText: getConstructionStageRatioText(sortOrder),
    }
  })
}

export const hasConstructionFlowStarted = (flow) => {
  if (!flow || typeof flow !== 'object') return false
  return Array.isArray(flow.nodeDetails) && flow.nodeDetails.length > 0
}

export const normalizeConstructionFlow = (flow) => {
  if (!hasConstructionFlowStarted(flow)) return null

  const currentNodeStatus = Number(flow.currentNodeStatus)
  const currentNodeStatusText =
    CONSTRUCTION_NODE_STATUS_MAP[currentNodeStatus] || flow.currentNodeStatusText

  return {
    ...flow,
    currentNodeStatusText,
  }
}
