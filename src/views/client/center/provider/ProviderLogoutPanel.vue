<template>
  <n-card title="退出登录">
    <n-space vertical align="center">
      <n-h3>确定要退出系统吗？</n-h3>
      <n-space>
        <n-button @click="$emit('cancel')">取消</n-button>
        <n-button type="error" @click="$emit('logout')">确认退出</n-button>
      </n-space>
    </n-space>
  </n-card>
</template>

<script setup>
defineEmits(['cancel', 'logout'])
</script>
