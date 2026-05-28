<template>
  <n-card title="收藏户型">
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
        <n-card hoverable class="favorite-house-card">
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
          <div class="favorite-house-card__body">
            <h3 class="house-title">{{ item.name }}</h3>
            <div class="favorite-house-card__meta">
              <n-tag class="favorite-house-card__style" type="success">
                {{ formatFavoriteStyle(item.style) }}
              </n-tag>
              <n-tag
                class="favorite-house-card__area"
                size="small"
                :bordered="false"
                type="info"
              >
                {{ formatFavoriteArea(item) }}
              </n-tag>
            </div>
            <div class="favorite-actions">
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
            </div>
          </div>
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
  'go-to-house-page',
  'view-detail',
  'cancel-favorite',
  'page-change',
])
</script>

<style scoped>
.favorite-house-card {
  height: 100%;
}

.favorite-house-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.favorite-house-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.house-title {
  margin: 0;
  color: #25362b;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.45;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.favorite-house-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

.favorite-house-card__style {
  max-width: 100%;
}

.favorite-house-card__area {
  margin-left: auto;
}

.favorite-actions {
  margin-top: 2px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.favorite-actions :deep(.n-button) {
  width: 100%;
  min-width: 0;
}
</style>
