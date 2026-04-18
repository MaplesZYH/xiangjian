<template>
  <n-button size="small" :type="props.type" @click="handleOpen">
    {{ props.title }}
  </n-button>

  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="props.title"
    size="huge"
    :style="{ width: 'min(600px, calc(100vw - 24px))' }"
    :bordered="false"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      label-placement="left"
      label-width="80"
    >
      <n-form-item label="角色：">
        <n-select
          v-model:value="formData.roleId"
          :options="roleOptions"
          placeholder="请选择角色"
        />
      </n-form-item>
      <n-form-item label="姓名：">
        <n-input v-model:value="formData.name" placeholder="请输入姓名" />
      </n-form-item>
      <n-form-item label="电话：">
        <n-input v-model:value="formData.phone" placeholder="请输入电话" />
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="edit-admin-actions responsive-actions">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="success" :loading="loading" @click="handleSave">
          确定
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    default: '编辑',
  },
  itemData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update'])
const showModal = ref(false)
const loading = ref(false) // 新增：控制按钮加载状态

// 角色选项
const roleOptions = [
  { label: '管理员', value: 1 },
  { label: '财务', value: 2 },
  { label: '运营', value: 3 },
  { label: '销售', value: 4 },
]

// 表单数据
const formData = ref({
  id: null,
  roleId: null,
  name: '',
  phone: '',
})

// 打开弹窗并初始化数据
const handleOpen = () => {
  if (props.itemData) {
    // 编辑模式：回显数据
    formData.value = {
      id: props.itemData.id,
      roleId: props.itemData.roleId,
      name: props.itemData.name || '',
      phone: props.itemData.phone || '',
    }
  } else {
    // 添加模式：清空表单
    formData.value = {
      id: null,
      roleId: null,
      name: '',
      phone: '',
    }
  }
  showModal.value = true
  loading.value = false // 重置loading
}

const handleSave = () => {
  // 开启 Loading
  loading.value = true

  // 定义回调函数：由父组件调用
  const done = (success) => {
    loading.value = false // 停止转圈
    if (success) {
      showModal.value = false // 成功才关闭
    }
  }

  // 提交数据和回调给父组件
  emit('update', formData.value, done)
}
</script>
<style scoped>
.edit-admin-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
