import { onBeforeUnmount, onMounted, ref } from 'vue'

export const useMaxWidth = (maxWidth) => {
  const matches = ref(false)
  let mediaQueryList = null

  const updateMatches = (event) => {
    matches.value = Boolean(event?.matches)
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !maxWidth) return

    mediaQueryList = window.matchMedia(`(max-width: ${maxWidth}px)`)
    matches.value = mediaQueryList.matches

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', updateMatches)
      return
    }

    if (typeof mediaQueryList.addListener === 'function') {
      mediaQueryList.addListener(updateMatches)
    }
  })

  onBeforeUnmount(() => {
    if (!mediaQueryList) return

    if (typeof mediaQueryList.removeEventListener === 'function') {
      mediaQueryList.removeEventListener('change', updateMatches)
      return
    }

    if (typeof mediaQueryList.removeListener === 'function') {
      mediaQueryList.removeListener(updateMatches)
    }
  })

  return matches
}
