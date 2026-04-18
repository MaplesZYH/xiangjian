<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <router-link to="/" class="back-home">
      <n-icon :component="ArrowUndoCircleOutline" :size="20" />
      <span>返回首页</span>
    </router-link>

    <div class="page">
      <section class="brand">
        <div class="brand__content">
          <h1 class="brand__logo">
            <n-icon :component="HomeOutline" :size="44" class="mr-2" />
            乡建在线
          </h1>
          <h2 class="brand__title">专业乡村建房服务平台</h2>
          <p class="brand__desc">
            当前用户端采用手机号直接登录，服务商通过账号密码登录。
          </p>
        </div>
      </section>

      <section class="login">
        <n-card class="login__card" :bordered="false">
          <h3 class="login__title">欢迎回来</h3>
          <p class="login__subtitle">请选择登录身份</p>

          <n-tabs v-model:value="userType" type="segment" animated>
            <n-tab-pane name="user" tab="用户登录" />
            <n-tab-pane name="provider" tab="服务商登录" />
          </n-tabs>

          <n-form
            v-if="userType === 'user'"
            ref="userFormRef"
            :model="userForm"
            :rules="userRules"
            @submit.prevent="handleUserLogin"
          >
            <n-form-item path="phone">
              <n-input
                v-model:value="userForm.phone"
                placeholder="请输入手机号直接登录"
                size="large"
                maxlength="11"
              >
                <template #prefix>
                  <n-icon :component="PhonePortraitOutline" />
                </template>
              </n-input>
            </n-form-item>

            <n-form-item path="code">
              <div class="login__code-group">
                <n-input
                  v-model:value="userForm.code"
                  placeholder="请输入验证码"
                  size="large"
                  maxlength="6"
                >
                  <template #prefix>
                    <n-icon :component="ShieldCheckmarkOutline" />
                  </template>
                </n-input>
                <n-button
                  type="primary"
                  size="large"
                  :disabled="sendingCode || countdown > 0"
                  @click="sendSmsCode"
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

            <p class="login__helper">当前阶段默认按手机号直登处理，验证码输入框仅保留样式。</p>

            <n-button
              type="primary"
              attr-type="submit"
              class="submit-btn"
              :loading="loading"
            >
              登录
            </n-button>
          </n-form>

          <n-form
            v-else
            ref="providerFormRef"
            :model="providerForm"
            :rules="providerRules"
            @submit.prevent="handleProviderLogin"
          >
            <n-form-item path="username">
              <n-input
                v-model:value="providerForm.username"
                placeholder="请输入服务商账号"
                size="large"
                maxlength="24"
              >
                <template #prefix>
                  <n-icon :component="PersonCircleOutline" />
                </template>
              </n-input>
            </n-form-item>

            <n-form-item path="password">
              <n-input
                v-model:value="providerForm.password"
                type="password"
                show-password-on="click"
                placeholder="请输入密码"
                size="large"
                maxlength="20"
              >
                <template #prefix>
                  <n-icon :component="LockClosedOutline" />
                </template>
              </n-input>
            </n-form-item>

            <n-button
              type="primary"
              attr-type="submit"
              class="submit-btn"
              :loading="loading"
            >
              登录
            </n-button>

            <div class="footer">
              <p class="login__helper login__helper--compact">
                新注册或重置后的密码需为 8-20 位，包含字母、数字和特殊字符。
              </p>
              <n-space justify="space-between">
                <n-button text type="primary" @click="openProviderResetModal">
                  忘记密码
                </n-button>
                <n-button text type="primary" @click="router.push('/service')">
                  入驻平台
                </n-button>
              </n-space>
            </div>
          </n-form>
        </n-card>
      </section>
    </div>

    <n-modal
      v-model:show="providerResetVisible"
      preset="card"
      class="reset-modal"
      style="width: min(90vw, 380px)"
      title="服务商重置密码"
      :bordered="false"
      :mask-closable="false"
      @after-leave="resetProviderResetState"
    >
      <n-form
        ref="providerResetFormRef"
        :model="providerResetForm"
        :rules="providerResetRules"
        label-placement="top"
        @submit.prevent="handleProviderResetPassword"
      >
        <n-form-item label="手机号" path="phone">
          <n-input
            v-model:value="providerResetForm.phone"
            placeholder="请输入注册手机号"
            maxlength="11"
          />
        </n-form-item>

        <n-form-item label="验证码" path="code">
          <div class="login__code-group">
            <n-input
              v-model:value="providerResetForm.code"
              placeholder="请输入短信验证码"
              maxlength="6"
            />
            <n-button
              type="primary"
              :disabled="providerSendingCode || providerResetCountdown > 0"
              @click="sendProviderResetCode"
            >
              {{
                providerResetCountdown > 0
                  ? `${providerResetCountdown}s后重试`
                  : providerSendingCode
                    ? '发送中'
                    : '发送验证码'
              }}
            </n-button>
          </div>
        </n-form-item>

        <n-form-item label="新密码" path="password">
          <n-input
            v-model:value="providerResetForm.password"
            type="password"
            show-password-on="click"
            placeholder="8-20位，包含字母、数字和特殊字符"
          />
        </n-form-item>

        <p class="reset-modal__hint">
          仅支持通过注册手机号重置密码，如忘记账号请联系平台管理员。
        </p>

        <div class="reset-modal__actions">
          <n-button @click="closeProviderResetModal">取消</n-button>
          <n-button
            type="primary"
            attr-type="submit"
            :loading="providerResetLoading"
          >
            确认重置
          </n-button>
        </div>
      </n-form>
    </n-modal>
  </n-config-provider>
</template>

<script setup>
import {
  HomeOutline,
  PhonePortraitOutline,
  ShieldCheckmarkOutline,
  PersonCircleOutline,
  LockClosedOutline,
  ArrowUndoCircleOutline,
} from '@/icons/ionicons'
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import loginApi from '@/api/login/admin'
import registerAPI from '@/api/service/register'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { naiveThemeOverrides } from '@/theme/naive'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const themeOverrides = naiveThemeOverrides

const userType = ref('user')
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let timer = null

const providerResetVisible = ref(false)
const providerSendingCode = ref(false)
const providerResetLoading = ref(false)
const providerResetCountdown = ref(0)
let providerResetTimer = null

const userFormRef = ref(null)
const providerFormRef = ref(null)
const providerResetFormRef = ref(null)

const userForm = reactive({
  phone: '',
  code: '',
})

const providerForm = reactive({
  username: '',
  password: '',
})

const providerResetForm = reactive({
  phone: '',
  code: '',
  password: '',
})

const userRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: ['blur', 'input'] },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: ['blur', 'input'],
    },
  ],
}

const providerRules = {
  username: [
    { required: true, message: '请输入账号', trigger: ['blur', 'input'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
  ],
}

const providerResetRules = {
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

const startCountdown = () => {
  countdown.value = 60
  if (timer) {
    window.clearInterval(timer)
  }
  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      window.clearInterval(timer)
      timer = null
    }
  }, 1000)
}

const startProviderResetCountdown = () => {
  providerResetCountdown.value = 60
  if (providerResetTimer) {
    window.clearInterval(providerResetTimer)
  }
  providerResetTimer = window.setInterval(() => {
    providerResetCountdown.value -= 1
    if (providerResetCountdown.value <= 0) {
      window.clearInterval(providerResetTimer)
      providerResetTimer = null
    }
  }, 1000)
}

const sendSmsCode = async () => {
  const phone = userForm.phone.trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    message.error('请输入正确的手机号')
    return
  }
  sendingCode.value = true
  try {
    await loginApi.sendUserCode(phone)
    message.success('验证码已发送，请注意查收')
    startCountdown()
  } catch (error) {
    message.error(getErrorMessage(error, '发送验证码失败'))
  } finally {
    sendingCode.value = false
  }
}

const resetProviderResetState = () => {
  providerResetForm.phone = ''
  providerResetForm.code = ''
  providerResetForm.password = ''
  providerResetLoading.value = false
  providerSendingCode.value = false
  providerResetCountdown.value = 0
  providerResetFormRef.value?.restoreValidation()
  if (providerResetTimer) {
    window.clearInterval(providerResetTimer)
    providerResetTimer = null
  }
}

const openProviderResetModal = () => {
  providerResetVisible.value = true
}

const closeProviderResetModal = () => {
  providerResetVisible.value = false
}

const sendProviderResetCode = async () => {
  const phone = providerResetForm.phone.trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    message.error('请输入正确的手机号')
    return
  }
  providerSendingCode.value = true
  try {
    await loginApi.sendSmsCode(phone)
    message.success('验证码已发送，请注意查收')
    startProviderResetCountdown()
  } catch (error) {
    message.error(getErrorMessage(error, '发送验证码失败'))
  } finally {
    providerSendingCode.value = false
  }
}

const handleProviderResetPassword = async () => {
  try {
    await providerResetFormRef.value?.validate()
  } catch {
    return
  }

  providerResetLoading.value = true
  try {
    await loginApi.updateVendorPassword({
      phone: providerResetForm.phone.trim(),
      code: providerResetForm.code.trim(),
      password: providerResetForm.password,
    })
    message.success('密码重置成功，请使用新密码登录')
    closeProviderResetModal()
  } catch (error) {
    message.error(getErrorMessage(error, '密码重置失败'))
  } finally {
    providerResetLoading.value = false
  }
}

const handleUserLogin = async () => {
  try {
    await userFormRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const phone = userForm.phone.trim()
    const code = userForm.code.trim()
    const res = await loginApi.userLogin(phone, code)
    const data = res?.data || {}
    const token = data.token
    const userInfo = data.userInfo || {}
    const userId = userInfo.userId

    if (!token || !userId) {
      message.error('登录成功但返回数据不完整')
      return
    }

    authStore.loginUser({
      token,
      phone,
      menu: data.menu || [],
      userInfo,
    })

    message.success('登录成功')
    router.replace('/adminCenter')
  } catch (error) {
    const errorMessage = getErrorMessage(error, '用户登录失败')
    if (!userForm.code.trim() && errorMessage.includes('验证码错误')) {
      message.error('当前连接的后端环境仍在校验验证码，前端已放开校验，但线上后端还未切到手机号直登')
      return
    }
    message.error(errorMessage)
  } finally {
    loading.value = false
  }
}

const handleProviderLogin = async () => {
  try {
    await providerFormRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await loginApi.serviceLogin(
      providerForm.username.trim(),
      providerForm.password,
    )
    const data = res?.data || {}
    const token = data.token
    const vendorInfo = data.vendorInfo || {}
    const vendorId = vendorInfo.vendorId

    if (!token || !vendorId) {
      message.error('登录成功但返回数据不完整')
      return
    }

    authStore.loginProvider({
      token,
      menu: data.menu || [],
      username: providerForm.username.trim(),
      vendorInfo,
    })

    try {
      const detailRes = await registerAPI.registerInfo(vendorId)
      if (detailRes?.code === 200 && detailRes.data) {
        authStore.patchScopeProfile('provider', {
          id: vendorId ? String(vendorId) : '',
          name:
            detailRes.data.companyName ||
            detailRes.data.username ||
            vendorInfo.companyName ||
            vendorInfo.username ||
            providerForm.username.trim(),
          phone:
            detailRes.data.phone ||
            detailRes.data.phoneNumber ||
            vendorInfo.phone ||
            vendorInfo.phoneNumber ||
            '',
          vendorInfo: {
            ...vendorInfo,
            ...detailRes.data,
            vendorId,
          },
        })
      }
    } catch (detailError) {
      console.warn('服务商详情补拉失败，导航名称将先回退到账号', detailError)
    }

    message.success('服务商登录成功')
    router.replace('/adminCenter')
  } catch (error) {
    message.error(getErrorMessage(error, '服务商登录失败'))
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
  if (providerResetTimer) {
    window.clearInterval(providerResetTimer)
    providerResetTimer = null
  }
})
</script>

<style lang="scss" scoped>
.back-home {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: clamp(12px, 4vw, 24px);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: var(--color-brand-700);
  font-size: 14px;
  text-decoration: none;
  border-radius: 999px;
  border: 1px solid rgba(39, 110, 61, 0.14);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-xs);
  backdrop-filter: blur(10px);

  &:hover {
    color: var(--color-brand-900);
  }
}

.login__helper {
  margin: 0 0 16px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  flex-direction: column;
  overflow-x: hidden;
  padding-top: 72px;

  @media (min-width: 1024px) {
    flex-direction: row;
    padding-top: 0;
  }
}

.brand {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36vh;
  padding: 3.5rem clamp(1.25rem, 4vw, 2.5rem) 2.75rem;
  background: linear-gradient(rgba(37, 54, 43, 0.84), rgba(39, 110, 61, 0.88)),
    url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1950&q=80')
      center/cover;
  color: #fff;

  @media (min-width: 1024px) {
    flex: 0 0 50%;
    max-width: 50%;
    height: 100vh;
  }

  &__content {
    max-width: 560px;
    text-align: center;

    @media (min-width: 1024px) {
      text-align: left;
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    font-size: 36px;

    @media (min-width: 1024px) {
      justify-content: flex-start;
    }
  }

  &__title {
    margin: 0 0 8px;
    font-size: 30px;
    line-height: 1.2;
  }

  &__desc {
    margin: 0;
    font-size: 16px;
    opacity: 0.95;
  }
}

.login {
  flex: 1 1 auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.25rem clamp(1rem, 4vw, 2rem) 2rem;
  background:
    radial-gradient(circle at top right, rgba(86, 183, 106, 0.12), transparent 24%),
    linear-gradient(180deg, #f4f7f4 0%, #eef4ef 100%);

  @media (min-width: 1024px) {
    flex: 0 0 50%;
    max-width: 50%;
    height: 100vh;
  }

  &__card {
    width: 100%;
    max-width: 430px;
    border-radius: var(--radius-3xl);
    box-shadow: var(--shadow-medium);

    :deep(.n-card__content) {
      padding: 40px 32px;
    }
  }

  &__title {
    margin: 0 0 8px;
    text-align: center;
    color: var(--color-brand-900);
    font-weight: 700;
  }

  &__subtitle {
    margin: 0 0 18px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 14px;
  }
}

.login__code-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.login__code-group :deep(.n-input) {
  min-width: 0;
}

.login__code-group :deep(.n-button) {
  min-width: 112px;
  white-space: nowrap;
}

.login :deep(.n-tabs) {
  margin-bottom: 20px;
}

.login :deep(.n-form-item) {
  margin-bottom: 16px;
}

.login :deep(.n-base-selection),
.login :deep(.n-input),
.login :deep(.n-button) {
  border-radius: var(--radius-md);
}

.submit-btn {
  width: 100%;
  height: 46px;
}

.footer {
  margin-top: 16px;
}

.reset-modal {
  width: min(90vw, 380px);
}

.reset-modal :deep(.n-card) {
  width: min(90vw, 380px);
  max-width: 100%;
}

.reset-modal__hint {
  margin: 0 0 18px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.reset-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .brand {
    min-height: 32vh;
    padding-top: 3rem;
    padding-bottom: 2.25rem;

    &__logo {
      font-size: 2rem;
    }

    &__title {
      font-size: 1.7rem;
    }

    &__desc {
      font-size: 0.95rem;
      line-height: 1.7;
    }
  }

  .login {
    padding-top: 0.5rem;
    padding-bottom: 1.75rem;

    &__card :deep(.n-card__content) {
      padding: 28px 20px;
    }
  }
}

@media (max-width: 576px) {
  .back-home {
    top: calc(10px + env(safe-area-inset-top, 0px));
    left: 12px;
    padding: 7px 10px;
    font-size: 13px;
  }

  .page {
    padding-top: 64px;
  }

  .brand {
    min-height: 0;
    padding: 2.5rem 16px 2rem;

    &__logo {
      font-size: 1.8rem;
      margin-bottom: 12px;
    }

    &__title {
      font-size: 1.45rem;
    }

    &__desc {
      font-size: 0.9rem;
    }
  }

  .login {
    padding: 0 12px 20px;

    &__card {
      max-width: none;

      :deep(.n-card__content) {
        padding: 24px 16px;
      }
    }
  }

  .login__code-group {
    grid-template-columns: minmax(0, 1fr) 112px;
    gap: 8px;
  }

  .login__helper {
    font-size: 12px;
  }
}
</style>
