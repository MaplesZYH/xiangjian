<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    :title="title"
    size="huge"
    :style="{ width: 'min(500px, calc(100vw - 24px))' }"
    :bordered="false"
  >
    <n-input
      :value="name"
      placeholder="产品名称"
      class="option-field"
      @update:value="emit('update:name', $event)"
    />
    <n-input-number
      :value="price"
      placeholder="价格"
      class="option-field"
      :min="0"
      @update:value="emit('update:price', $event)"
    />
    <n-input
      :value="description"
      placeholder="描述"
      type="textarea"
      class="option-field"
      @update:value="emit('update:description', $event)"
    />

    <div class="option-actions responsive-actions">
      <n-button @click="showModel = false">取消</n-button>
      <n-button type="primary" @click="emit('confirm')">{{ confirmText }}</n-button>
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
  title: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: '保存',
  },
  name: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:show',
  'update:name',
  'update:price',
  'update:description',
  'confirm',
])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.option-field {
  margin-bottom: 15px;
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
