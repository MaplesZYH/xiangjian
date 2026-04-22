<template>
  <div class="userManage design-order-toolbar">
    <div class="search-area search-area--inline design-order-search">
      <n-input
        :value="keyword"
        class="search-input design-order-search__keyword"
        placeholder="请输入设计单号或设计地址"
        clearable
        @update:value="emit('update:keyword', $event)"
        @clear="emit('search')"
        @keydown.enter="emit('search')"
      />
      <n-select
        :value="designStatus"
        class="design-order-search__select"
        placeholder="设计状态"
        :options="designStatusOptions"
        clearable
        @update:value="handleDesignStatusUpdate"
      />
      <n-select
        :value="paymentStatus"
        class="design-order-search__select"
        placeholder="支付状态"
        :options="paymentStatusFilterOptions"
        clearable
        @update:value="handlePaymentStatusUpdate"
      />
      <n-button type="primary" @click="emit('search')">查询</n-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  keyword: {
    type: String,
    default: '',
  },
  designStatus: {
    type: [Number, String, null],
    default: null,
  },
  paymentStatus: {
    type: [Number, String, null],
    default: null,
  },
  designStatusOptions: {
    type: Array,
    default: () => [],
  },
  paymentStatusFilterOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:keyword',
  'update:designStatus',
  'update:paymentStatus',
  'search',
])

const handleDesignStatusUpdate = (value) => {
  emit('update:designStatus', value)
  emit('search')
}

const handlePaymentStatusUpdate = (value) => {
  emit('update:paymentStatus', value)
  emit('search')
}
</script>

<style lang="scss" scoped>
.design-order-toolbar {
  margin-bottom: 20px;
}

.design-order-search {
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: 12px;
}

.design-order-search__keyword {
  width: 280px;
  min-width: 280px;
}

.design-order-search__select {
  width: 160px;
  min-width: 160px;
}

@media (max-width: 768px) {
  .design-order-search {
    width: 100%;
    justify-content: stretch;
  }

  .design-order-search__keyword,
  .design-order-search__select {
    width: 100%;
    min-width: 100%;
  }
}
</style>
