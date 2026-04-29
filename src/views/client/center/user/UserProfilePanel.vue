<template>
  <n-card title="个人信息">
    <n-form
      :model="userInfo"
      class="profile-form"
      :label-placement="labelPlacement"
      :label-width="isCompactViewport ? undefined : 100"
    >
      <n-form-item label="姓名">
        <n-input v-model:value="nameValue" placeholder="请输入姓名" />
      </n-form-item>
      <n-form-item label="手机号">
        <n-input v-model:value="phoneValue" placeholder="请输入手机号" />
      </n-form-item>
      <n-form-item label="地址">
        <n-cascader
          :value="selectedProfileRegionCode"
          :options="profileRegionCascaderOptions"
          check-strategy="child"
          filterable
          clearable
          placeholder="请选择省 / 市 / 区"
          @update:value="handleRegionCodeChange"
        />
      </n-form-item>
      <n-form-item label="详细地址">
        <n-input
          v-model:value="addressDetailValue"
          type="textarea"
          placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
          :rows="2"
          maxlength="120"
          show-count
        />
      </n-form-item>
      <n-form-item label="预览地址">
        <div class="profile-address-preview client-center-preview">
          {{
            profileAddressPreview || '请先选择施工行政区并填写详细门牌地址'
          }}
        </div>
      </n-form-item>
      <n-p
        v-if="!canViewUserProfile || !canUpdateUserProfile"
        depth="3"
        class="client-center-helper-text"
      >
        当前账号缺少资料管理权限，个人信息仅本地展示/保存。
      </n-p>
      <div class="client-center-form-actions">
        <n-button @click="$emit('refresh')">重置/刷新</n-button>
        <n-button type="primary" :loading="saving" @click="$emit('save')">
          {{ saveProfileButtonText }}
        </n-button>
      </div>
    </n-form>
  </n-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  userInfo: {
    type: Object,
    required: true,
  },
  selectedProfileRegionCode: {
    default: null,
  },
  profileRegionCascaderOptions: {
    type: Array,
    default: () => [],
  },
  profileAddressForm: {
    type: Object,
    required: true,
  },
  profileAddressPreview: {
    type: String,
    default: '',
  },
  canViewUserProfile: {
    type: Boolean,
    default: false,
  },
  canUpdateUserProfile: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  saveProfileButtonText: {
    type: String,
    default: '',
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  labelPlacement: {
    type: String,
    default: 'left',
  },
})

const emit = defineEmits([
  'update:user-info-field',
  'update:selected-profile-region-code',
  'update:profile-address-detail',
  'profile-region-update',
  'refresh',
  'save',
])

const nameValue = computed({
  get: () => props.userInfo.name,
  set: (value) => emit('update:user-info-field', { key: 'name', value }),
})

const phoneValue = computed({
  get: () => props.userInfo.phone,
  set: (value) => emit('update:user-info-field', { key: 'phone', value }),
})

const addressDetailValue = computed({
  get: () => props.profileAddressForm.detail,
  set: (value) => emit('update:profile-address-detail', value),
})

const handleRegionCodeChange = (value, option, path) => {
  emit('update:selected-profile-region-code', value)
  emit('profile-region-update', value, option, path)
}
</script>
