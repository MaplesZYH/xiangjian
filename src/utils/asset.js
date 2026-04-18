const MINIO_PROXY_HOST = '116.198.38.236'
const MINIO_PROXY_PORT = '8088'
const MINIO_ORIGIN_PORT = '9000'

const normalizeAssetValue = (value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed || ''
}

const rewriteAssetPort = (value, targetPort) => {
  const normalized = normalizeAssetValue(value)
  if (typeof normalized !== 'string' || !normalized) return normalized

  try {
    const parsed = new URL(normalized)
    if (
      parsed.hostname === MINIO_PROXY_HOST &&
      parsed.port === MINIO_PROXY_PORT
    ) {
      parsed.port = targetPort
      return parsed.toString()
    }
    return parsed.toString()
  } catch {
    if (targetPort === MINIO_PROXY_PORT) {
      return normalized
    }
    return normalized.replace(
      `${MINIO_PROXY_HOST}:${MINIO_PROXY_PORT}`,
      `${MINIO_PROXY_HOST}:${targetPort}`,
    )
  }
}

export const getAssetPrimaryUrl = (value) =>
  rewriteAssetPort(value, MINIO_ORIGIN_PORT)

export const getAssetFallbackUrl = (value) => {
  const normalized = normalizeAssetValue(value)
  if (typeof normalized !== 'string' || !normalized) return ''
  return ''
}

// Backend may return the nginx asset proxy URL (8088). If that proxy is not
// deployed or unhealthy, fall back to the MinIO origin endpoint (9000).
export const resolveAssetUrl = (value) =>
  rewriteAssetPort(value, MINIO_ORIGIN_PORT)
