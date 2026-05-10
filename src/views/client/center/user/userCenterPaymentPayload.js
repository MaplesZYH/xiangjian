export const openPaymentResultWindow = (
  content,
  isHtml = false,
  targetWindow = null,
  { allowSameWindowFallback = true } = {},
) => {
  if (!content) return false

  const popup = targetWindow || window.open('', '_blank')
  if (isHtml) {
    const container = document.createElement('div')
    container.style.display = 'none'
    container.innerHTML = content
    document.body.appendChild(container)

    const form = container.querySelector('form')
    if (!form) {
      container.remove()
      return false
    }

    if (popup && !popup.closed) {
      if (!popup.name) {
        popup.name = `payment_window_${Date.now()}`
      }
      form.setAttribute('target', popup.name)
    } else if (allowSameWindowFallback) {
      form.setAttribute('target', '_self')
    } else {
      container.remove()
      return false
    }

    form.submit()
    setTimeout(() => {
      container.remove()
    }, 1000)
    return true
  }

  if (!popup) {
    if (!allowSameWindowFallback) {
      return false
    }

    window.location.href = content
    return true
  }

  popup.location.href = content
  return true
}

export const decodeHtmlEntities = (value) => {
  if (typeof value !== 'string' || !value) return ''
  if (typeof document === 'undefined') return value
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

export const parsePaymentBizContent = (html) => {
  if (typeof html !== 'string' || !html.trim()) return null

  const match = html.match(
    /<input[^>]*name=["']biz_content["'][^>]*value=["']([^"']*)["'][^>]*>/i,
  )
  const encodedBizContent = match?.[1]
  if (!encodedBizContent) return null

  const decodedBizContent = decodeHtmlEntities(encodedBizContent)
  if (!decodedBizContent) return null

  try {
    const parsed = JSON.parse(decodedBizContent)
    const amount = Number(parsed?.total_amount)
    return {
      outTradeNo: parsed?.out_trade_no || '',
      subject: parsed?.subject || '',
      totalAmount: Number.isFinite(amount) ? amount : null,
      rawBizContent: decodedBizContent,
    }
  } catch (error) {
    return {
      outTradeNo: '',
      subject: '',
      totalAmount: null,
      rawBizContent: decodedBizContent,
    }
  }
}

export const resolvePaymentPayloadMeta = (payload, visited = new Set()) => {
  if (!payload) return null

  if (typeof payload === 'string') {
    const content = payload.trim()
    if (!content) return null

    if (content.includes('<form') || content.includes('<html')) {
      return {
        kind: 'html',
        ...parsePaymentBizContent(content),
      }
    }

    if (
      content.startsWith('http://') ||
      content.startsWith('https://') ||
      content.startsWith('//') ||
      content.startsWith('weixin://')
    ) {
      return {
        kind: 'url',
        url: content,
      }
    }

    return {
      kind: 'text',
      value: content,
    }
  }

  if (typeof payload !== 'object' || visited.has(payload)) return null
  visited.add(payload)

  const htmlContent =
    payload.formHtml ||
    payload.html ||
    payload.body ||
    payload.payHtml ||
    payload.paymentHtml ||
    payload.paymentPayload
  if (typeof htmlContent === 'string' && htmlContent.trim()) {
    return {
      kind: 'html',
      ...parsePaymentBizContent(htmlContent),
    }
  }

  const redirectUrl =
    payload.payUrl ||
    payload.alipayUrl ||
    payload.payLink ||
    payload.paymentLink ||
    payload.cashierUrl ||
    payload.h5Url ||
    payload.paymentUrl ||
    payload.redirectUrl ||
    payload.url ||
    payload.codeUrl ||
    payload.qrCodeUrl ||
    payload.qrCode
  if (typeof redirectUrl === 'string' && redirectUrl.trim()) {
    return {
      kind: redirectUrl.startsWith('weixin://') ? 'wechat-url' : 'url',
      url: redirectUrl,
    }
  }

  return ['data', 'result', 'payload']
    .map((key) => resolvePaymentPayloadMeta(payload[key], visited))
    .find(Boolean)
}

export const tryOpenPaymentPayload = (
  payload,
  visited = new Set(),
  targetWindow = null,
  options = {},
) => {
  if (!payload) return false

  if (typeof payload === 'string') {
    const content = payload.trim()
    if (!content) return false

    if (
      content.startsWith('http://') ||
      content.startsWith('https://') ||
      content.startsWith('//')
    ) {
      return openPaymentResultWindow(content, false, targetWindow, options)
    }

    if (content.includes('<form') || content.includes('<html')) {
      return openPaymentResultWindow(content, true, targetWindow, options)
    }

    return false
  }

  if (typeof payload !== 'object' || visited.has(payload)) return false
  visited.add(payload)

  const htmlContent =
    payload.formHtml ||
    payload.html ||
    payload.body ||
    payload.payHtml ||
    payload.paymentHtml ||
    payload.paymentPayload
  if (typeof htmlContent === 'string' && htmlContent.trim()) {
    return openPaymentResultWindow(htmlContent, true, targetWindow, options)
  }

  const redirectUrl =
    payload.payUrl ||
    payload.alipayUrl ||
    payload.payLink ||
    payload.paymentLink ||
    payload.cashierUrl ||
    payload.h5Url ||
    payload.paymentUrl ||
    payload.redirectUrl ||
    payload.url ||
    payload.codeUrl ||
    payload.qrCodeUrl ||
    payload.qrCode
  if (typeof redirectUrl === 'string' && redirectUrl.trim()) {
    return openPaymentResultWindow(redirectUrl, false, targetWindow, options)
  }

  return ['data', 'result', 'payload'].some((key) =>
    tryOpenPaymentPayload(payload[key], visited, targetWindow, options),
  )
}

export const resolveWechatPayUrl = (payload, visited = new Set()) => {
  if (!payload) return ''

  if (typeof payload === 'string') {
    const content = payload.trim()
    return content.startsWith('weixin://') ? content : ''
  }

  if (typeof payload !== 'object' || visited.has(payload)) return ''
  visited.add(payload)

  const candidates = [
    payload.data,
    payload.result,
    payload.payload,
    payload.codeUrl,
    payload.qrCode,
    payload.qrCodeUrl,
    payload.url,
  ]

  for (const candidate of candidates) {
    const value = resolveWechatPayUrl(candidate, visited)
    if (value) return value
  }

  return ''
}
