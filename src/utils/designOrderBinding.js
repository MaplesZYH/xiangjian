const DESIGN_ORDER_PRODUCT_BINDING_MARKER = '[RCS_DESIGN_PRODUCT]'

const normalizeText = (value) => (typeof value === 'string' ? value : '')

const normalizeMainProductBinding = (binding) => {
  const id = Number(
    binding?.id ?? binding?.mpId ?? binding?.mainProductId ?? binding?.productId,
  )

  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  return {
    mainProductId: id,
  }
}

const splitBindingContent = (value) => {
  const text = normalizeText(value)
  const markerIndex = text.lastIndexOf(DESIGN_ORDER_PRODUCT_BINDING_MARKER)

  if (markerIndex < 0) {
    return {
      plainText: text.trim(),
      bindingText: '',
    }
  }

  return {
    plainText: text.slice(0, markerIndex).trim(),
    bindingText: text
      .slice(markerIndex + DESIGN_ORDER_PRODUCT_BINDING_MARKER.length)
      .trim(),
  }
}

export const stripDesignOrderProductBinding = (value) =>
  splitBindingContent(value).plainText

export const extractDesignOrderProductBinding = (...sources) => {
  for (const source of sources) {
    const candidate =
      typeof source === 'string'
        ? source
        : normalizeText(source?.designRequirements || source?.customerNotes)

    const { bindingText } = splitBindingContent(candidate)
    if (!bindingText) continue

    try {
      const parsed = JSON.parse(bindingText)
      const normalized = normalizeMainProductBinding(parsed)
      if (normalized) {
        return normalized
      }
    } catch {
      continue
    }
  }

  return null
}

export const appendDesignOrderProductBinding = (value, binding) => {
  const normalizedBinding = normalizeMainProductBinding(binding)
  const plainText = stripDesignOrderProductBinding(value)

  if (!normalizedBinding) {
    return plainText
  }

  const bindingText = `${DESIGN_ORDER_PRODUCT_BINDING_MARKER}${JSON.stringify(
    normalizedBinding,
  )}`

  return plainText ? `${plainText}\n\n${bindingText}` : bindingText
}

export const formatDesignOrderMainProductText = (binding) => {
  const normalizedBinding = normalizeMainProductBinding(binding)
  if (!normalizedBinding) return '--'
  return `主体产品ID:${normalizedBinding.mainProductId}`
}
