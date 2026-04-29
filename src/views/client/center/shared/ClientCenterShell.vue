<template>
  <n-layout :has-sider="!isCompactViewport" class="client-center-shell">
    <n-layout-sider
      v-if="!isCompactViewport"
      bordered
      :width="240"
      :native-scrollbar="false"
      class="client-center-shell__sider"
    >
      <n-card :title="menuTitle" class="client-center-fill-card">
        <n-menu
          :options="menuOptions"
          :value="activeMenu"
          @update:value="handleMenuChange"
        />
      </n-card>
    </n-layout-sider>

    <n-layout-content class="client-center-content">
      <div class="client-center-body">
        <n-card
          v-if="isCompactViewport"
          :title="menuTitle"
          class="client-center-mobile-menu"
        >
          <div class="client-center-mobile-nav" :style="mobileGridStyle">
            <button
              v-for="item in menuItems"
              :key="item.key"
              type="button"
              class="client-center-mobile-nav__item"
              :class="{ 'is-active': activeMenu === item.key }"
              @click="handleMenuChange(item.key)"
            >
              <span class="client-center-mobile-nav__icon">
                <n-icon size="24">
                  <component :is="item.icon" />
                </n-icon>
              </span>
              <span class="client-center-mobile-nav__label">{{ item.label }}</span>
              <span class="client-center-mobile-nav__desc">
                {{ item.description }}
              </span>
            </button>
          </div>
        </n-card>

        <slot />
      </div>
    </n-layout-content>
  </n-layout>
</template>

<script setup>
import { computed, h } from 'vue'
import { NIcon } from 'naive-ui'

const props = defineProps({
  menuTitle: {
    type: String,
    required: true,
  },
  activeMenu: {
    type: String,
    required: true,
  },
  menuItems: {
    type: Array,
    default: () => [],
  },
  isCompactViewport: {
    type: Boolean,
    default: false,
  },
  mobileColumns: {
    type: Number,
    default: 0,
  },
  mobileColumnsNarrow: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['update:activeMenu'])

const renderMenuIcon = (icon) => () =>
  h(NIcon, null, {
    default: () => h(icon),
  })

const menuOptions = computed(() =>
  props.menuItems.map((item) => ({
    label: item.label,
    key: item.key,
    icon: renderMenuIcon(item.icon),
  })),
)

const mobileGridStyle = computed(() => ({
  '--client-center-mobile-columns': String(
    props.mobileColumns || props.menuItems.length || 1,
  ),
  '--client-center-mobile-columns-narrow': String(props.mobileColumnsNarrow || 1),
}))

const handleMenuChange = (value) => {
  emit('update:activeMenu', value)
}
</script>

<style lang="scss" scoped>
:deep(.n-layout) {
  background: transparent;
}

:deep(.n-layout-sider) {
  box-shadow: var(--shadow-sm);
}

.client-center-shell {
  min-height: 100vh;
}

.client-center-content {
  min-width: 0;
}

.client-center-body {
  padding: 24px;
}

.client-center-mobile-menu {
  margin-bottom: 16px;
}

.client-center-mobile-nav {
  display: grid;
  grid-template-columns: repeat(
    var(--client-center-mobile-columns, 3),
    minmax(0, 1fr)
  );
  gap: 10px;
}

.client-center-mobile-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%);
  color: var(--color-text-secondary);
  text-align: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.client-center-mobile-nav__item.is-active {
  color: var(--color-brand-700);
  border-color: rgba(39, 110, 61, 0.22);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.client-center-mobile-nav__icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  background: rgba(39, 110, 61, 0.1);
}

.client-center-mobile-nav__label {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.client-center-mobile-nav__desc {
  font-size: 11px;
  line-height: 1.2;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .client-center-shell {
    min-height: auto;
  }

  .client-center-body {
    padding: 0;
  }

  .client-center-mobile-menu {
    :deep(.n-card-header) {
      padding-bottom: 12px;
    }
  }
}

@media (max-width: 576px) {
  .client-center-mobile-nav {
    grid-template-columns: repeat(
      var(--client-center-mobile-columns-narrow, 1),
      minmax(0, 1fr)
    );
  }

  .client-center-mobile-nav__item {
    padding: 12px 8px 10px;
  }

  .client-center-mobile-nav__icon {
    width: 42px;
    height: 42px;
  }
}
</style>
