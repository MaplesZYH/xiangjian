<template>
  <n-button
    size="small"
    type="error"
    @click="deleteDialog"
    :disabled="isBatch && checkedIds.length === 0"
  >
    <template #icon>
      <n-icon><IconDelete /></n-icon>
    </template>
    {{ buttonText }}
  </n-button>
</template>

<script setup>
import { computed } from 'vue'
import { useDialog } from 'naive-ui'
import { IconDelete } from '@/icons/ionicons'

// 定义props
const props = defineProps({
  // 单个删除时的ID
  itemId: {
    type: [String, Number],
    default: null,
  },
  // 批量删除时的ID数组
  checkedIds: {
    type: Array,
    default: () => [],
  },
  // 是否为批量模式
  isBatch: {
    type: Boolean,
    default: false,
  },
})

// 定义emit
const emit = defineEmits(['delete'])

const dialog = useDialog()

// 计算按钮文字
const buttonText = computed(() => {
  return props.isBatch ? '批量删除' : '删除'
})

// 点击删除按钮触发
const deleteDialog = () => {
  // 1. 确定提示文案
  const content = props.isBatch
    ? `确定要删除选中的 ${props.checkedIds.length} 位用户吗？`
    : '你确定要删除吗？'

  // 2. 弹出确认框
  dialog.error({
    title: '警告',
    content: content,
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: () => {
      // 3. 根据模式传递不同的数据给父组件
      if (props.isBatch) {
        // 批量模式：传递数组
        emit('delete', props.checkedIds)
      } else {
        // 单个模式：传递单个ID
        emit('delete', props.itemId)
      }
    },
  })
}
</script>

<style lang="scss" scoped></style>
