<template>
  <img
    :src="currentSrc"
    :alt="alt"
    :loading="loading"
    :decoding="decoding"
    :fetchpriority="fetchpriority"
    @error="handleError"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getAssetFallbackUrl, getAssetPrimaryUrl } from '@/utils/asset'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  fallbackSrc: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  loading: {
    type: String,
    default: 'lazy',
  },
  decoding: {
    type: String,
    default: 'async',
  },
  fetchpriority: {
    type: String,
    default: undefined,
  },
})

const primarySrc = computed(() => getAssetPrimaryUrl(props.src))
const fallbackSrc = computed(
  () => getAssetPrimaryUrl(props.fallbackSrc) || getAssetFallbackUrl(props.src),
)
const placeholderSrc = computed(() => props.placeholder || '')
const currentSrc = ref('')

const syncImageSource = () => {
  currentSrc.value =
    primarySrc.value || fallbackSrc.value || placeholderSrc.value || ''
}

const handleError = () => {
  if (fallbackSrc.value && currentSrc.value !== fallbackSrc.value) {
    currentSrc.value = fallbackSrc.value
    return
  }

  if (placeholderSrc.value && currentSrc.value !== placeholderSrc.value) {
    currentSrc.value = placeholderSrc.value
  }
}

watch([primarySrc, fallbackSrc, placeholderSrc], syncImageSource, {
  immediate: true,
})
</script>
