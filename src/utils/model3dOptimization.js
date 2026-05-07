export const MODEL3D_STATUS = {
  OPTIMIZING: 'OPTIMIZING',
  DONE: 'DONE',
  FAILED: 'FAILED',
}

export const normalizeModel3dStatus = (status) => {
  const value = String(status || '').trim().toUpperCase()
  return Object.values(MODEL3D_STATUS).includes(value) ? value : ''
}

export const isModel3dOptimizing = (status) =>
  normalizeModel3dStatus(status) === MODEL3D_STATUS.OPTIMIZING

export const getModel3dStatusText = (status) => {
  switch (normalizeModel3dStatus(status)) {
    case MODEL3D_STATUS.OPTIMIZING:
      return '模型优化中'
    case MODEL3D_STATUS.DONE:
      return ''
    case MODEL3D_STATUS.FAILED:
      return '使用原始模型'
    default:
      return ''
  }
}
