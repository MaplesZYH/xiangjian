<template>
  <div class="option-row">
    <n-input
      :value="categoryName"
      placeholder="分类名称"
      @update:value="emit('update:category-name', $event)"
    />
    <n-button type="primary" @click="emit('save-name')">修改分类名称</n-button>
  </div>
</template>

<script setup>
defineProps({
  categoryName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:category-name', 'save-name'])
</script>

<style lang="scss" scoped>
.option-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .option-row {
    flex-direction: column;
  }
}
</style>
