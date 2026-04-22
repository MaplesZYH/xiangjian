<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="添加分类"
    size="huge"
    :style="{ width: 'min(500px, calc(100vw - 24px))' }"
    :bordered="false"
  >
    <n-input
      :value="categoryName"
      placeholder="请输入分类名称"
      class="option-field option-field--lg"
      @update:value="emit('update:category-name', $event)"
    />

    <div class="option-actions responsive-actions">
      <n-button @click="showModel = false">取消</n-button>
      <n-button type="primary" @click="emit('save')">保存</n-button>
    </div>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  categoryName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:show', 'update:category-name', 'save'])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.option-field {
  margin-bottom: 15px;
}

.option-field--lg {
  margin-bottom: 20px;
}

.option-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .option-actions {
    width: 100%;
    justify-content: stretch;
  }

  .option-actions > * {
    flex: 1 1 100%;
  }
}
</style>
