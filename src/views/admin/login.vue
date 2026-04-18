<template>
  <div class="login-page">
    <n-card class="login-card" :bordered="false">
      <h2 class="title">后台员工登录</h2>
      <p class="desc">账号为后台创建手机号，请使用后台分配或已重置后的密码登录</p>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
        @submit.prevent="handleLogin"
      >
        <n-form-item label="账号" path="account">
          <n-input
            v-model:value="formData.account"
            placeholder="请输入 11 位手机号"
            maxlength="11"
            clearable
          />
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            placeholder="请输入登录密码"
            clearable
          />
        </n-form-item>

        <div class="tips">
          <div>账号要求：11 位中国大陆手机号</div>
          <div>密码要求以后台账户当前实际配置为准</div>
        </div>

        <div class="login-actions">
          <n-button text type="primary" @click="openResetModal">
            忘记密码
          </n-button>
        </div>

        <n-button
          type="primary"
          attr-type="submit"
          :loading="loading"
          block
          size="large"
        >
          登录
        </n-button>
      </n-form>
    </n-card>

    <n-modal
      v-model:show="resetVisible"
      preset="card"
      class="reset-modal"
      style="width: min(90vw, 380px)"
      title="员工重置密码"
      :bordered="false"
      :mask-closable="false"
      @after-leave="resetResetState"
    >
      <n-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-placement="top"
        @submit.prevent="handleResetPassword"
      >
        <n-form-item label="手机号" path="phone">
          <n-input
            v-model:value="resetForm.phone"
            placeholder="请输入登录手机号"
            maxlength="11"
          />
        </n-form-item>

        <n-form-item label="验证码" path="code">
          <div class="code-group">
            <n-input
              v-model:value="resetForm.code"
              placeholder="请输入短信验证码"
              maxlength="6"
            />
            <n-button
              type="primary"
              :disabled="sendingResetCode || resetCountdown > 0"
              @click="sendResetCode"
            >
              {{
                resetCountdown > 0
                  ? `${resetCountdown}s后重试`
                  : sendingResetCode
                    ? '发送中'
                    : '发送验证码'
              }}
            </n-button>
          </div>
        </n-form-item>

        <n-form-item label="新密码" path="password">
          <n-input
            v-model:value="resetForm.password"
            type="password"
            show-password-on="click"
            placeholder="8-20位，包含字母、数字和特殊字符"
          />
        </n-form-item>

        <div class="reset-actions">
          <n-button @click="closeResetModal">取消</n-button>
          <n-button type="primary" attr-type="submit" :loading="resetLoading">
            确认重置
          </n-button>
        </div>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import loginApi from '@/api/login/admin'
import { AUTH_SCOPE_EMPLOYEE } from '@/utils/auth'
import { useAuthStore } from '@/stores/auth/useAuthStore'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const formRef = ref(null)
const resetFormRef = ref(null)
const loading = ref(false)
const resetVisible = ref(false)
const resetLoading = ref(false)
const sendingResetCode = ref(false)
const resetCountdown = ref(0)
let resetTimer = null

const formData = reactive({
  account: '',
  password: '',
})

const resetForm = reactive({
  phone: '',
  code: '',
  password: '',
})

const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: ['blur', 'input'] },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '账号必须是 11 位手机号',
      trigger: ['blur', 'input'],
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
    {
      min: 6,
      max: 20,
      message: '密码长度应为 6-20 位',
      trigger: ['blur', 'input'],
    },
  ],
}

const resetRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: ['blur', 'input'] },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: ['blur', 'input'],
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: ['blur', 'input'] },
    {
      pattern: /^\d{6}$/,
      message: '验证码应为 6 位数字',
      trigger: ['blur', 'input'],
    },
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: ['blur', 'input'] },
    {
      min: 8,
      max: 20,
      message: '密码长度应为 8-20 位',
      trigger: ['blur', 'input'],
    },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/,
      message: '密码需包含字母、数字和特殊字符',
      trigger: ['blur', 'input'],
    },
  ],
}

const getErrorMessage = (error, fallback) => {
  if (error?.msg) return String(error.msg)
  if (error?.response?.data?.msg) return String(error.response.data.msg)
  if (error?.response?.data?.message) return String(error.response.data.message)
  if (typeof error?.response?.data === 'string') return error.response.data
  if (error?.message) return String(error.message)
  return fallback
}

const startResetCountdown = () => {
  resetCountdown.value = 60
  if (resetTimer) {
    window.clearInterval(resetTimer)
  }
  resetTimer = window.setInterval(() => {
    resetCountdown.value -= 1
    if (resetCountdown.value <= 0) {
      window.clearInterval(resetTimer)
      resetTimer = null
    }
  }, 1000)
}

const resetResetState = () => {
  resetForm.phone = ''
  resetForm.code = ''
  resetForm.password = ''
  resetLoading.value = false
  sendingResetCode.value = false
  resetCountdown.value = 0
  resetFormRef.value?.restoreValidation()
  if (resetTimer) {
    window.clearInterval(resetTimer)
    resetTimer = null
  }
}

const openResetModal = () => {
  resetVisible.value = true
}

const closeResetModal = () => {
  resetVisible.value = false
}

const sendResetCode = async () => {
  const phone = resetForm.phone.trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    message.error('请输入正确的手机号')
    return
  }
  sendingResetCode.value = true
  try {
    await loginApi.sendSmsCode(phone)
    message.success('验证码已发送，请注意查收')
    startResetCountdown()
  } catch (error) {
    message.error(getErrorMessage(error, '发送验证码失败'))
  } finally {
    sendingResetCode.value = false
  }
}

const handleResetPassword = async () => {
  try {
    await resetFormRef.value?.validate()
  } catch {
    return
  }

  resetLoading.value = true
  try {
    await loginApi.updateEmpPassword({
      phone: resetForm.phone.trim(),
      code: resetForm.code.trim(),
      password: resetForm.password,
    })
    message.success('密码重置成功，请使用新密码登录')
    closeResetModal()
  } catch (error) {
    message.error(getErrorMessage(error, '密码重置失败'))
  } finally {
    resetLoading.value = false
  }
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await loginApi.employeeLogin(formData.account, formData.password)
    const token = res?.data?.token
    const empInfo = res?.data?.empInfo || {}
    const permissions = Array.isArray(empInfo.permissions)
      ? empInfo.permissions
      : []
    const roles = Array.isArray(empInfo.roles) ? empInfo.roles : []

    if (!token) {
      message.error('登录成功但未获取到 token')
      return
    }

    authStore.loginEmployee({
      token,
      account: formData.account,
      empInfo: {
        ...empInfo,
        roles,
        permissions,
      },
    })

    const firstAllowedPath = authStore.firstAllowedAdminPath
    if (!firstAllowedPath) {
      authStore.logout(AUTH_SCOPE_EMPLOYEE)
      message.error('当前账号没有后台菜单权限')
      return
    }

    message.success('登录成功')
    router.push(firstAllowedPath)
  } catch (error) {
    message.error(getErrorMessage(error, '登录失败，请检查账号或密码'))
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (resetTimer) {
    window.clearInterval(resetTimer)
    resetTimer = null
  }
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(86, 183, 106, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(60, 64, 97, 0.14), transparent 24%),
    linear-gradient(180deg, #f4f7f4 0%, #eef4ef 100%);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-medium);
}

.title {
  margin: 0 0 8px;
  text-align: center;
  color: var(--color-brand-900);
  font-weight: 700;
}

.desc {
  margin: 0 0 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.tips {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(39, 110, 61, 0.08), rgba(60, 64, 97, 0.08));
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.login-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.reset-modal {
  width: min(90vw, 380px);
}

.reset-modal :deep(.n-card) {
  width: min(90vw, 380px);
  max-width: 100%;
}

.code-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.code-group :deep(.n-input) {
  min-width: 0;
}

.code-group :deep(.n-button) {
  min-width: 112px;
  white-space: nowrap;
}

.reset-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 576px) {
  .login-page {
    padding: 14px;
    align-items: stretch;
  }

  .login-card {
    max-width: 100%;
    margin: auto 0;
  }

  .title {
    font-size: 22px;
  }

  .desc {
    font-size: 14px;
    line-height: 1.7;
  }

  .code-group {
    grid-template-columns: minmax(0, 1fr) 112px;
    gap: 8px;
  }
}
</style>
