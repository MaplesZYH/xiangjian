import { resolveAssetUrl } from '@/utils/asset'

const warmedModelUrlMap = new Map()

export const resolveModelAssetUrl = (value) => resolveAssetUrl(value)

export const warmModelAsset = async (value) => {
  const resolvedUrl = resolveModelAssetUrl(value)
  if (!resolvedUrl || typeof resolvedUrl !== 'string') return ''
  if (!/^https?:/i.test(resolvedUrl)) return resolvedUrl

  const cached = warmedModelUrlMap.get(resolvedUrl)
  if (cached?.objectUrl) {
    return cached.objectUrl
  }
  if (cached?.promise) {
    return cached.promise
  }

  const warmPromise = fetch(resolvedUrl, {
    method: 'GET',
    cache: 'force-cache',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to preload model: ${response.status}`)
      }
      return response.blob()
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob)
      warmedModelUrlMap.set(resolvedUrl, { objectUrl })
      return objectUrl
    })
    .catch((error) => {
      warmedModelUrlMap.delete(resolvedUrl)
      throw error
    })

  warmedModelUrlMap.set(resolvedUrl, { promise: warmPromise })
  return warmPromise
}

export const forgetWarmedModelAsset = (value) => {
  const resolvedUrl = resolveModelAssetUrl(value)
  const cached = warmedModelUrlMap.get(resolvedUrl)
  if (cached?.objectUrl) {
    URL.revokeObjectURL(cached.objectUrl)
  }
  warmedModelUrlMap.delete(resolvedUrl)
}
