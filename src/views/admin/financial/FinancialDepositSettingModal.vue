<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="定金设置"
    style="width: min(520px, calc(100vw - 24px))"
  >
    <div class="deposit-setting-panel">
      <section class="deposit-setting-card">
        <div class="deposit-setting-card__title">设计订单定金</div>
        <div class="deposit-setting-card__desc">
          这里直接读取并修改后端全局默认定金，保存后后续新建设计订单会立即按新金额生效。
        </div>

        <n-form label-placement="top">
          <n-form-item label="定金金额">
            <n-input-number
              :value="draftAmount"
              :min="0.01"
              :precision="2"
              :step="100"
              style="width: 100%"
              placeholder="请输入设计订单定金"
              @update:value="emit('update:draftAmount', $event)"
            />
          </n-form-item>
        </n-form>

        <div class="deposit-setting-card__status">
          <span>当前已保存：</span>
          <strong>
            {{ savedAmount == null ? '未设置' : `¥${formatMoney(savedAmount)}` }}
          </strong>
        </div>
        <div class="deposit-setting-card__hint">
          已创建的历史订单不会回溯修改，实际支付金额仍以后端实时生成账单为准。
        </div>
      </section>

      <div class="deposit-setting-inline-note">
        建房订单定金继续按订单详情里的单笔链路处理；这里仅维护“新订单默认定金”。
      </div>
    </div>

    <template #footer>
      <div class="financial-modal-actions">
        <n-button :disabled="loading" @click="emit('reload')">刷新</n-button>
        <div class="financial-modal-actions__group">
          <n-button :disabled="saving" @click="emit('cancel')">取消</n-button>
          <n-button type="primary" :loading="saving" @click="emit('save')">
            保存
          </n-button>
        </div>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  draftAmount: {
    type: Number,
    default: 0.01,
  },
  savedAmount: {
    type: Number,
    default: null,
  },
  formatMoney: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'update:show',
  'update:draftAmount',
  'reload',
  'cancel',
  'save',
])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.deposit-setting-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.deposit-setting-card {
  padding: 18px 18px 16px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-soft);
  background: linear-gradient(180deg, var(--color-surface) 0%, #f8fbf8 100%);
  box-shadow: var(--shadow-xs);
}

.deposit-setting-card__title {
  color: var(--color-text-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.deposit-setting-card__desc {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.deposit-setting-card__status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
}

.deposit-setting-card__hint {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.deposit-setting-inline-note {
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: rgba(60, 64, 97, 0.05);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.financial-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.financial-modal-actions__group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .financial-modal-actions,
  .financial-modal-actions__group {
    width: 100%;
  }

  .financial-modal-actions {
    justify-content: stretch;
  }

  .financial-modal-actions > *,
  .financial-modal-actions__group > * {
    flex: 1 1 100%;
  }
}
</style>
