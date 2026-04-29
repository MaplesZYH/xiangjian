<template>
  <n-card title="收藏户型">
    <div class="client-center-toolbar-end">
      <n-button size="small" @click="$emit('refresh')">刷新列表</n-button>
    </div>

    <n-empty
      v-if="favorites.length === 0 && !loadingFavorites"
      description="您还没有收藏任何户型"
    >
      <template #extra>
        <n-button size="small" type="primary" @click="$emit('go-to-house-page')">
          去收藏
        </n-button>
      </template>
    </n-empty>

    <n-grid
      v-else
      cols="1 s:2 m:3"
      responsive="screen"
      :x-gap="16"
      :y-gap="16"
    >
      <n-grid-item v-for="item in favorites" :key="item.id">
        <n-card hoverable>
          <template #cover>
            <SmartImage
              :src="item.image"
              :alt="item.name"
              class="house-image"
              loading="lazy"
              decoding="async"
              :placeholder="defaultFavoriteImage"
            />
          </template>
          <n-space vertical>
            <n-h3 class="house-title">{{ item.name }}</n-h3>
            <n-space justify="space-between">
              <n-tag type="success">{{ formatFavoriteStyle(item.style) }}</n-tag>
              <span>{{ formatFavoriteArea(item) }}</span>
            </n-space>
            <n-space class="favorite-actions" justify="space-between">
              <n-button type="primary" @click="$emit('view-detail', item)">
                查看详情
              </n-button>
              <n-button
                type="error"
                ghost
                :loading="!!favoriteActionLoading[item.id]"
                @click="$emit('cancel-favorite', item)"
              >
                取消收藏
              </n-button>
            </n-space>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>

    <div
      v-if="favoritePagination.pageCount > 1"
      class="favorites-pagination"
    >
      <n-pagination
        :page="favoritePagination.page"
        :page-count="favoritePagination.pageCount"
        :page-slot="3"
        show-quick-jumper
        @update:page="$emit('page-change', $event)"
      />
    </div>
  </n-card>
</template>

<script setup>
import SmartImage from '@/components/common/SmartImage.vue'

defineProps({
  favorites: {
    type: Array,
    default: () => [],
  },
  loadingFavorites: {
    type: Boolean,
    default: false,
  },
  favoriteActionLoading: {
    type: Object,
    default: () => ({}),
  },
  favoritePagination: {
    type: Object,
    required: true,
  },
  defaultFavoriteImage: {
    type: String,
    default: '',
  },
  formatFavoriteStyle: {
    type: Function,
    required: true,
  },
  formatFavoriteArea: {
    type: Function,
    required: true,
  },
})

defineEmits([
  'refresh',
  'go-to-house-page',
  'view-detail',
  'cancel-favorite',
  'page-change',
])
</script>
