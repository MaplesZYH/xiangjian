import { computed } from 'vue'
import { useMaxWidth } from '@/composables/useMaxWidth'

export const useUserCenterViewLayout = () => {
  const isCompactViewport = useMaxWidth(768)

  const formLabelPlacement = computed(() =>
    isCompactViewport.value ? 'top' : 'left',
  )
  const descriptionsLabelPlacement = computed(() =>
    isCompactViewport.value ? 'top' : 'left',
  )
  const detailDescriptionsColumns = computed(() =>
    isCompactViewport.value ? 1 : 2,
  )
  const detailModalStyle = computed(() => ({
    width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 1000px)',
    minHeight: isCompactViewport.value ? 'auto' : '600px',
  }))
  const paymentModalStyle = computed(() => ({
    width: isCompactViewport.value ? 'calc(100vw - 20px)' : '420px',
  }))
  const refundModalStyle = computed(() => ({
    width: isCompactViewport.value ? 'calc(100vw - 20px)' : '520px',
  }))
  const refundDetailModalStyle = computed(() => ({
    width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 760px)',
  }))
  const statementModalStyle = computed(() => ({
    width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 920px)',
  }))

  return {
    isCompactViewport,
    formLabelPlacement,
    descriptionsLabelPlacement,
    detailDescriptionsColumns,
    detailModalStyle,
    paymentModalStyle,
    refundModalStyle,
    refundDetailModalStyle,
    statementModalStyle,
  }
}
