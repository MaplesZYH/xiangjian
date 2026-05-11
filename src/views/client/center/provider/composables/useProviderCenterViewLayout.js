import { computed } from 'vue'
import { useMaxWidth } from '@/composables/useMaxWidth'

export const useProviderCenterViewLayout = () => {
  const isCompactViewport = useMaxWidth(768)

  const descriptionsLabelPlacement = computed(() =>
    isCompactViewport.value ? 'top' : 'left',
  )
  const detailDescriptionsColumns = computed(() =>
    isCompactViewport.value ? 1 : 2,
  )
  const constructionGridCols = computed(() => (isCompactViewport.value ? 1 : 3))
  const editModalStyle = computed(() => ({
    width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 800px)',
  }))
  const orderModalStyle = computed(() => ({
    width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 1000px)',
    minHeight: isCompactViewport.value ? 'auto' : '600px',
  }))

  return {
    isCompactViewport,
    descriptionsLabelPlacement,
    detailDescriptionsColumns,
    constructionGridCols,
    editModalStyle,
    orderModalStyle,
  }
}
