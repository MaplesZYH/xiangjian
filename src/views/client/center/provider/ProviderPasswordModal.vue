<template>
  <n-modal
    :show="show"
    preset="card"
    title="修改密码"
    :style="modalStyle"
    :mask-closable="false"
    @update:show="emit('update:show', $event)"
    @after-leave="emit('after-leave')"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      @submit.prevent="emit('submit')"
    >
      <n-form-item label="注册手机号" path="phone">
        <n-input :value="form.phone" disabled />
      </n-form-item>

      <n-form-item label="验证码" path="code">
        <div class="password-code-row">
          <n-input
            :value="form.code"
            placeholder="请输入短信验证码"
            maxlength="6"
            @update:value="emit('update:field', { key: 'code', value: $event })"
          />
          <n-button
            type="primary"
            :disabled="sendingCode || countdown > 0"
            @click="emit('send-code')"
          >
            {{
              countdown > 0
                ? `${countdown}s后重试`
                : sendingCode
                  ? '发送中'
                  : '发送验证码'
            }}
          </n-button>
        </div>
      </n-form-item>

      <n-form-item label="新密码" path="password">
        <n-input
          :value="form.password"
          type="password"
          show-password-on="click"
          placeholder="8-20位，包含字母、数字和特殊字符"
          @update:value="emit('update:field', { key: 'password', value: $event })"
        />
      </n-form-item>

      <n-form-item label="确认新密码" path="confirmPassword">
        <n-input
          :value="form.confirmPassword"
          type="password"
          show-password-on="click"
          placeholder="请再次输入新密码"
          @update:value="
            emit('update:field', { key: 'confirmPassword', value: $event })
          "
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space class="password-modal-footer" justify="end">
        <n-button @click="emit('update:show', false)">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="emit('submit')">
          确认修改
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  modalStyle: {
    type: Object,
    default: () => ({}),
  },
  form: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    required: true,
  },
  sendingCode: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  countdown: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'update:show',
  'update:field',
  'send-code',
  'submit',
  'after-leave',
])

const formRef = ref(null)

const validate = async () => formRef.value?.validate()
const restoreValidation = () => formRef.value?.restoreValidation()

defineExpose({
  validate,
  restoreValidation,
})
</script>

<style lang="scss" scoped>
.password-code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 10px;
  width: 100%;
}

@media (max-width: 768px) {
  .password-code-row {
    grid-template-columns: 1fr;
  }

  .password-modal-footer {
    width: 100%;
    justify-content: stretch !important;
  }

  .password-modal-footer > * {
    flex: 1 1 100%;
  }
}
</style>
