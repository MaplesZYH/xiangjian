export const getProviderCenterErrorMessage = (error, fallback) =>
  error?.msg ||
  error?.response?.data?.msg ||
  error?.response?.data?.message ||
  (typeof error?.response?.data === 'string' ? error.response.data : '') ||
  error?.message ||
  fallback

export const isDispatchStageLockedForVendor = (row) =>
  Number(row?.type) === 1 &&
  Boolean(String(row?.constructionStatusText || '').trim())

export const canCancelVendorOrder = (row) =>
  Number(row?.orderStatus) === 1 && !isDispatchStageLockedForVendor(row)

export const getProviderServiceTypeText = (type) => {
  const map = { 1: '建造商', 2: '材料商', 3: '综合服务商' }
  return map[type] || '未知'
}

export const getProviderServiceTypeTag = (type) =>
  type === 3 ? 'success' : 'info'

const materialTagPalette = [
  { color: '#fff7ed', text: '#c2410c' },
  { color: '#eff6ff', text: '#1d4ed8' },
  { color: '#ecfdf5', text: '#047857' },
  { color: '#fdf2f8', text: '#be185d' },
  { color: '#f5f3ff', text: '#6d28d9' },
  { color: '#effcf6', text: '#0f766e' },
]

export const getProviderMaterialTagStyle = (index) => {
  const palette = materialTagPalette[index % materialTagPalette.length]
  return {
    '--n-color': palette.color,
    '--n-color-hover': palette.color,
    '--n-color-pressed': palette.color,
    '--n-text-color': palette.text,
    '--n-border': `1px solid ${palette.text}22`,
    '--n-border-hover': `1px solid ${palette.text}22`,
    '--n-border-pressed': `1px solid ${palette.text}22`,
  }
}

export const formatProviderChineseDate = (value) => {
  if (!value) return '暂无'
  const datePart = String(value).split('T')[0]
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${year}年${month}月${day}日`
}

export const getProviderOrderStatusText = (status) => {
  const map = {
    0: '已拒接',
    1: '已接受',
    2: '已完成',
    3: '未回复',
    4: '已取消',
  }
  return map[status] || '未知'
}
