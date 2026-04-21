const DESIGN_ORDER_MAIN_PRODUCT_STORAGE_KEY =
  'client_design_order_main_product_map'

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const loadRawMap = () => {
  const storage = getStorage()
  if (!storage) return {}

  try {
    const raw = storage.getItem(DESIGN_ORDER_MAIN_PRODUCT_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const persistRawMap = (value) => {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(DESIGN_ORDER_MAIN_PRODUCT_STORAGE_KEY, JSON.stringify(value))
}

export const saveDesignOrderMainProductBinding = (orderId, mainProductId) => {
  const numericOrderId = Number(orderId)
  const numericMainProductId = Number(mainProductId)
  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) return
  if (!Number.isInteger(numericMainProductId) || numericMainProductId <= 0) return

  const currentMap = loadRawMap()
  currentMap[numericOrderId] = numericMainProductId
  persistRawMap(currentMap)
}

export const getDesignOrderMainProductBinding = (orderId) => {
  const numericOrderId = Number(orderId)
  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) return null

  const currentMap = loadRawMap()
  const numericMainProductId = Number(currentMap[numericOrderId])
  return Number.isInteger(numericMainProductId) && numericMainProductId > 0
    ? numericMainProductId
    : null
}
