<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="支付协议"
    style="width: 980px; max-width: calc(100vw - 32px)"
    :mask-closable="!saving"
    :closable="!saving"
  >
    <n-space vertical size="large">
      <n-spin :show="loading">
        <n-form label-placement="top">
          <n-form-item label="支付协议内容">
            <div class="payment-agreement-editor-wrap">
              <Toolbar
                :editor="editorRef"
                :default-config="toolbarConfig"
                mode="default"
                class="payment-agreement-toolbar"
              />
              <Editor
                :model-value="draft"
                :default-config="editorConfig"
                mode="default"
                class="payment-agreement-editor"
                @update:model-value="emit('update:draft', $event)"
                @onCreated="emit('editor-created', $event)"
              />
            </div>
          </n-form-item>
        </n-form>
      </n-spin>
    </n-space>

    <template #footer>
      <div class="financial-modal-actions">
        <n-button
          :disabled="loading || saving"
          @click="emit('restore-current')"
        >
          恢复线上内容
        </n-button>
        <div class="financial-modal-actions__group">
          <n-button :disabled="saving" @click="emit('cancel')">取消</n-button>
          <n-button
            type="primary"
            :loading="saving"
            :disabled="!hasUpdatePermission"
            @click="emit('save')"
          >
            保存
          </n-button>
        </div>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

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
  draft: {
    type: String,
    default: '',
  },
  editorRef: {
    type: Object,
    default: null,
  },
  toolbarConfig: {
    type: Object,
    required: true,
  },
  editorConfig: {
    type: Object,
    required: true,
  },
  hasUpdatePermission: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:show',
  'update:draft',
  'editor-created',
  'restore-current',
  'cancel',
  'save',
])

const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})
</script>

<style lang="scss" scoped>
.payment-agreement-editor-wrap {
  width: 100%;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.payment-agreement-toolbar {
  border-bottom: 1px solid var(--color-border-soft);
  background: linear-gradient(180deg, #f8fbf8 0%, #f2f7f3 100%);
}

.payment-agreement-editor {
  min-height: 360px;

  :deep(.w-e-text-container) {
    min-height: 320px !important;
    max-height: 52vh;
    overflow-y: auto !important;
  }

  :deep(.w-e-scroll) {
    min-height: 320px !important;
  }
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

  .payment-agreement-editor {
    min-height: 280px;

    :deep(.w-e-text-container) {
      min-height: 240px !important;
      max-height: 46vh;
    }

    :deep(.w-e-scroll) {
      min-height: 240px !important;
    }
  }
}
</style>
