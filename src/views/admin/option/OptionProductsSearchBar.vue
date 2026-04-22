<template>
  <div class="option-row option-row--center">
    <n-input
      :value="keyword"
      placeholder="输入产品名称搜索"
      class="option-row__grow"
      clearable
      @update:value="emit('update:keyword', $event)"
      @keydown.enter="emit('search')"
    />
    <n-button type="primary" @click="emit('search')">搜索</n-button>
  </div>
</template>

<script setup>
defineProps({
  keyword: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:keyword', 'search'])
</script>

<style lang="scss" scoped>
.option-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.option-row--center {
  align-items: center;
}

.option-row__grow {
  flex: 1;
}

@media (max-width: 768px) {
  .option-row {
    flex-direction: column;
  }

  .option-row__grow {
    width: 100%;
  }
}
</style>
