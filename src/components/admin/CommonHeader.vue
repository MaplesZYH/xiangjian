<template>
  <div class="common-header-wrapper">
    <div class="common-header">
      <img
        class="logo"
        src="https://www.xiangjiancn.cn/static/img/logo.4169042e.png"
        alt="logo"
        decoding="async"
      />

      <div class="setting">
        <button
          v-if="showMobileMenuBtn"
          class="mobile-menu-btn"
          :class="{ open: mobileMenuOpen }"
          aria-label="切换菜单"
          :aria-expanded="mobileMenuOpen"
          @click="emit('toggle-mobile-menu')"
        >
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <n-dropdown
          placement="bottom-end"
          trigger="click"
          size="small"
          :options="options"
          @select="handleSelect"
        >
          <div class="user-name">
            <span class="user-name__icon">
              <n-icon size="18">
                <PersonCircleOutline />
              </n-icon>
            </span>
            <span class="user-name__text">{{ displayName }}</span>
          </div>
        </n-dropdown>
      </div>
    </div>

    <n-modal v-model:show="profileVisible" :mask-closable="false">
      <n-card
        class="admin-profile-card responsive-dialog-card"
        title="个人中心"
        :bordered="false"
        style="width: min(90vw, 420px); --dialog-max-width: 420px"
      >
        <n-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-placement="left"
          label-width="90"
        >
          <n-form-item label="姓名" path="name">
            <n-input
              v-model:value="profileForm.name"
              placeholder="请输入姓名"
            />
          </n-form-item>

          <n-form-item label="电话" path="phone">
            <n-input
              v-model:value="profileForm.phone"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </n-form-item>

          <n-form-item label="新密码" path="password">
            <n-input
              v-model:value="profileForm.password"
              type="password"
              show-password-on="click"
              placeholder="不修改可留空"
            />
          </n-form-item>

          <n-form-item label="角色">
            <n-select
              v-if="isSuperAdmin"
              v-model:value="profileForm.roleId"
              :options="roleOptions"
              placeholder="请选择角色"
            />
            <n-input v-else :value="currentRoleText" disabled />
          </n-form-item>
        </n-form>

        <template #footer>
          <div class="profile-footer responsive-actions">
            <n-button @click="profileVisible = false">取消</n-button>
            <n-button
              type="primary"
              :loading="profileSubmitting"
              @click="handleSaveProfile"
            >
              保存
            </n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { PersonCircleOutline } from '@/icons/ionicons'
import { AUTH_SCOPE_EMPLOYEE, getAuthStorage } from '@/utils/auth'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import adminApi from '@/api/admin'

defineProps({
  showMobileMenuBtn: {
    type: Boolean,
    default: false,
  },
  mobileMenuOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-mobile-menu'])

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { employeeDisplayName, employeeId, employeeRoles } = storeToRefs(authStore)
const profileVisible = ref(false)
const profileSubmitting = ref(false)
const profileFormRef = ref(null)

const roleOptions = [
  { label: '管理员', value: 1 },
  { label: '财务', value: 2 },
  { label: '运营', value: 3 },
  { label: '销售', value: 4 },
]

const roleValueMap = {
  ADMIN: 1,
  '管理员': 1,
  SALE: 4,
  SALES: 4,
  FINANCE: 2,
  '财务': 2,
  OPERATION: 3,
  OPERATE: 3,
  '运营': 3,
  '平台运营': 3,
  '销售': 4,
}

const profileForm = reactive({
  id: null,
  name: '',
  phone: '',
  password: '',
  roleId: null,
})

const profileRules = {
  name: [{ required: true, message: '请输入姓名', trigger: ['blur', 'input'] }],
  phone: [
    { required: true, message: '请输入手机号', trigger: ['blur', 'input'] },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: ['blur', 'input'],
    },
  ],
  password: [
    {
      validator: (_, value) => !value || (value.length >= 6 && value.length <= 20),
      message: '密码长度需为 6-20 位',
      trigger: ['blur', 'input'],
    },
  ],
}

const options = [
  { label: '个人中心', key: 'profile' },
  { label: '退出登录', key: 'logout' },
]

const getRoleIdFromRoles = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return null
  }
  for (const item of roles) {
    const key = String(item || '').toUpperCase()
    if (roleValueMap[key]) {
      return roleValueMap[key]
    }
  }
  return null
}

const isSuperAdmin = computed(() => {
  return employeeRoles.value.some((role) => {
    const normalizedRole = String(role || '').trim().toLowerCase()
    return normalizedRole === 'admin' || normalizedRole === '管理员'
  })
})

const currentRoleText = computed(() => {
  const match = roleOptions.find((item) => item.value === profileForm.roleId)
  if (match) {
    return match.label
  }
  return employeeRoles.value[0] || '未知角色'
})

const displayName = computed(() => profileForm.name || employeeDisplayName.value || '员工账号')

const getErrorMessage = (error, fallback) => {
  return (
    error?.msg ||
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === 'string' ? error.response.data : '') ||
    error?.message ||
    fallback
  )
}

const loadProfile = async () => {
  const userId = employeeId.value || getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'id')
  if (!userId) {
    return
  }
  try {
    const res = await adminApi.getAdminDataById(userId)
    const data = res?.data || {}
    const roles = Array.isArray(data.roles) ? data.roles : []
    profileForm.id = data.id ?? data.empId ?? Number(userId)
    profileForm.name =
      data.name ||
      data.empName ||
      getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'name') ||
      ''
    profileForm.phone =
      data.phone ||
      data.phoneNumber ||
      getAuthStorage(AUTH_SCOPE_EMPLOYEE, 'phone') ||
      ''
    profileForm.roleId = data.roleId ?? getRoleIdFromRoles(roles)
    profileForm.password = ''
    authStore.patchScopeProfile(AUTH_SCOPE_EMPLOYEE, {
      id: profileForm.id ? String(profileForm.id) : '',
      name: profileForm.name,
      phone: profileForm.phone,
      roles: roles.length > 0 ? roles : employeeRoles.value,
    })
  } catch (error) {
    message.error(String(getErrorMessage(error, '获取个人信息失败')))
  }
}

const openProfile = async () => {
  await loadProfile()
  profileVisible.value = true
}

const handleSaveProfile = async () => {
  try {
    await profileFormRef.value?.validate()
  } catch {
    return
  }

  if (!profileForm.id) {
    message.error('未获取到员工ID，无法保存')
    return
  }

  const payload = {
    id: profileForm.id,
    name: profileForm.name,
    phone: profileForm.phone,
  }

  if (profileForm.password) {
    payload.password = profileForm.password
  }
  if (isSuperAdmin.value && profileForm.roleId !== null) {
    payload.roleId = profileForm.roleId
  }

  profileSubmitting.value = true
  try {
    await adminApi.updateAdminData(payload)
    authStore.patchScopeProfile(AUTH_SCOPE_EMPLOYEE, {
      id: profileForm.id ? String(profileForm.id) : '',
      name: profileForm.name,
      phone: profileForm.phone,
    })
    profileForm.password = ''
    profileVisible.value = false
    message.success('个人信息保存成功')
  } catch (error) {
    message.error(String(getErrorMessage(error, '保存失败')))
  } finally {
    profileSubmitting.value = false
  }
}

const handleSelect = (key) => {
  if (key === 'profile') {
    openProfile()
    return
  }
  if (key === 'logout') {
    authStore.logout(AUTH_SCOPE_EMPLOYEE)
    message.success('已退出登录')
    router.replace('/adminLogin')
  }
}

onMounted(() => {
  authStore.setActiveScope(AUTH_SCOPE_EMPLOYEE)
  loadProfile()
})
</script>

<style lang="scss" scoped>
.common-header-wrapper {
  width: 100%;
}

.common-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-xs);
  backdrop-filter: blur(12px);
}

.logo {
  height: 38px;
}

.setting {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-name {
  min-width: 90px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  color: var(--color-text-primary);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(231, 240, 233, 0.96));
  border: 1px solid rgba(39, 110, 61, 0.14);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(238, 244, 239, 1));
    box-shadow: var(--shadow-sm);
  }
}

.user-name__icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-brand-700);
  background: rgba(39, 110, 61, 0.1);
}

.user-name__text {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.profile-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mobile-menu-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(39, 110, 61, 0.12);
  border-radius: var(--radius-md);
  background: var(--gradient-brand);
  box-shadow: var(--shadow-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;

  .bar {
    width: 16px;
    height: 2px;
    background: #ffffff;
    border-radius: var(--radius-md);
    transition: transform 0.25s ease, opacity 0.25s ease;
  }

  &.open .bar:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }

  &.open .bar:nth-child(2) {
    opacity: 0;
  }

  &.open .bar:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }
}

@media (max-width: 768px) {
  .common-header {
    height: 56px;
    padding: 0 12px;
  }

  .logo {
    height: 32px;
  }

  .user-name {
    min-width: 0;
    max-width: min(50vw, 170px);
    padding: 6px 10px;
  }
}

@media (max-width: 576px) {
  .setting {
    gap: 8px;
  }

  .user-name {
    padding: 6px 8px;
  }

  .user-name__text {
    max-width: 88px;
  }

  .profile-footer {
    width: 100%;
  }
}
</style>
