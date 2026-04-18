export const normalizeStructuredAddressDetail = (value = '') =>
  String(value || '').replace(/\s+/g, ' ').trim()

export const validateStructuredAddress = ({
  province = '',
  city = '',
  district = '',
  detail = '',
  fullAddress = '',
  addressLabel = '地址',
  detailRequiredMessage = '请填写详细地址（街道门牌）',
  maxLength = 200,
} = {}) => {
  if (!province || !city || !district) {
    return '请选择完整的省 / 市 / 区'
  }

  const normalizedDetail = normalizeStructuredAddressDetail(detail)
  if (!normalizedDetail) {
    return detailRequiredMessage
  }

  if (!fullAddress || fullAddress.length > maxLength) {
    return `${addressLabel}长度需在 1-${maxLength} 个字符内`
  }

  return ''
}
