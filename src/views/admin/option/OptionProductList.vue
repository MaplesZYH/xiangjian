<template>
  <div class="option-list">
    <div v-for="item in optionList" :key="item.id" class="option-card">
      <div class="option-card__check">
        <n-checkbox
          :checked="checkedOptionIds.includes(item.id)"
          @update:checked="emit('check-one', { id: item.id, checked: $event })"
        />
      </div>
      <div class="option-card__body">
        <div class="option-card__main">
          <span class="option-name">{{ item.name || '--' }}</span>
          <span class="option-price">¥{{ item.price ?? 0 }}</span>
        </div>
        <div class="option-description">
          {{ item.description || '暂无描述' }}
        </div>
      </div>
      <div class="option-card__actions">
        <n-button size="small" type="primary" @click="emit('open-edit', item)">
          修改
        </n-button>
        <Delete :itemId="item.id" @delete="emit('delete-option', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import Delete from '@/components/operation/delete.vue'

defineProps({
  optionList: {
    type: Array,
    default: () => [],
  },
  checkedOptionIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['check-one', 'open-edit', 'delete-option'])
</script>

<style lang="scss" scoped>
.option-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 140px;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;

  &:hover {
    background: rgba(39, 110, 61, 0.04);
    border-color: rgba(39, 110, 61, 0.2);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
}

.option-card__check {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.option-card__body {
  min-width: 0;
}

.option-card__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.option-card__actions {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;

  > * {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
  }

  > :deep(.n-button) {
    width: 100%;
    padding: 0 8px;
  }
}

.option-name,
.option-price,
.option-description {
  line-height: 1.6;
  word-break: break-word;
  color: #1f2937;
}

.option-price {
  font-weight: 700;
  color: var(--color-brand-700);
  flex-shrink: 0;
}

.option-description {
  color: #4b5563;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 768px) {
  .option-card {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .option-card__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .option-card__main {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
