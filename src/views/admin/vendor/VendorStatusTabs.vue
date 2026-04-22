<template>
  <n-tabs
    :value="currentStatus"
    type="line"
    animated
    @update:value="emit('update:status', $event)"
    class="status-tabs"
  >
    <n-tab-pane :name="1" tab="已通过" />
    <n-tab-pane :name="2" tab="待审核" />
    <n-tab-pane :name="0" tab="未通过" />
  </n-tabs>
</template>

<script setup>
defineProps({
  currentStatus: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['update:status'])
</script>

<style lang="scss" scoped>
.status-tabs {
  margin-bottom: 20px;

  :deep(.n-tabs-nav .n-tabs-tab) {
    border-radius: 8px 8px 0 0;
    padding: 8px 14px;
    font-weight: 600;
    color: #4b5563;
    transition: all 0.2s ease;
  }

  :deep(.n-tabs-nav .n-tabs-tab:nth-child(1)) {
    color: #059669;
  }

  :deep(.n-tabs-nav .n-tabs-tab:nth-child(2)) {
    color: #b45309;
  }

  :deep(.n-tabs-nav .n-tabs-tab:nth-child(3)) {
    color: #dc2626;
  }

  :deep(.n-tabs-nav .n-tabs-tab.n-tabs-tab--active) {
    background: #f3f4f6;
  }
}

@media (max-width: 768px) {
  .status-tabs {
    :deep(.n-tabs-nav-scroll-wrapper) {
      overflow-x: auto;
      scrollbar-width: none;
    }

    :deep(.n-tabs-nav-scroll-wrapper::-webkit-scrollbar) {
      display: none;
    }

    :deep(.n-tabs-nav-scroll-content) {
      min-width: max-content;
    }
  }
}
</style>
