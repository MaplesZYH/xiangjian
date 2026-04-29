<template>
  <n-modal
    :show="show"
    preset="dialog"
    :title="title"
    :positive-text="positiveText"
    negative-text="取消"
    @update:show="$emit('update:show', $event)"
    @positive-click="$emit('submit')"
    @negative-click="$emit('update:show', false)"
  >
    <n-input
      :value="note"
      type="textarea"
      :placeholder="placeholder"
      :rows="3"
      @update:value="$emit('update:note', $event)"
    />
  </n-modal>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  positiveText: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  note: {
    type: String,
    default: '',
  },
})

defineEmits(['update:show', 'update:note', 'submit'])
</script>
