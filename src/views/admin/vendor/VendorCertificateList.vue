<template>
  <div class="cert-list">
    <div v-if="!certificateList || certificateList.length === 0" class="cert-empty">
      暂无资质文件
    </div>
    <div v-else class="cert-grid">
      <div
        v-for="(cert, index) in certificateList"
        :key="cert.id || cert.fileUrl || index"
        class="cert-item"
      >
        <div class="cert-item__head">
          <div class="cert-item__badge">资质 {{ index + 1 }}</div>
          <div class="cert-item__type">{{ getCertFileExt(cert.fileUrl) }}</div>
        </div>
        <div class="cert-item__name" :title="getCertFileName(cert.fileUrl, index)">
          {{ getCertFileName(cert.fileUrl, index) }}
        </div>
        <div class="cert-item__actions">
          <a
            :href="getCertResolvedUrl(cert.fileUrl)"
            target="_blank"
            rel="noopener noreferrer"
            class="cert-action view"
          >
            在线查看
          </a>
          <a
            :href="getCertResolvedUrl(cert.fileUrl)"
            target="_blank"
            rel="noopener noreferrer"
            :download="getCertFileName(cert.fileUrl, index)"
            class="cert-action download"
          >
            下载文件
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  certificateList: {
    type: Array,
    default: () => [],
  },
  getCertFileExt: {
    type: Function,
    required: true,
  },
  getCertFileName: {
    type: Function,
    required: true,
  },
  getCertResolvedUrl: {
    type: Function,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.cert-list {
  margin-top: 12px;

  .cert-empty {
    color: #9ca3af;
    font-style: italic;
    padding: 8px 2px;
  }

  .cert-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .cert-item {
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    padding: 12px;
    background: linear-gradient(180deg, var(--color-surface) 0%, #f8fbf8 100%);
    box-shadow: var(--shadow-xs);

    .cert-item__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }

    .cert-item__badge {
      background: rgba(39, 110, 61, 0.1);
      color: var(--color-brand-700);
      border: 1px solid rgba(39, 110, 61, 0.18);
      border-radius: 999px;
      font-size: 12px;
      padding: 2px 8px;
      white-space: nowrap;
    }

    .cert-item__name {
      font-weight: 600;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 10px;
    }

    .cert-item__type {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(60, 64, 97, 0.08);
      border: 1px solid rgba(60, 64, 97, 0.16);
      color: var(--color-accent-700);
      font-size: 12px;
      font-weight: 600;
    }

    .cert-item__actions {
      display: flex;
      gap: 8px;
    }

    .cert-action {
      flex: 1;
      text-align: center;
      text-decoration: none;
      font-size: 12px;
      padding: 6px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .cert-action.view {
      background: rgba(39, 110, 61, 0.08);
      color: var(--color-brand-700);
      border-color: rgba(39, 110, 61, 0.18);
    }

    .cert-action.download {
      background: rgba(60, 64, 97, 0.08);
      color: var(--color-accent-700);
      border-color: rgba(60, 64, 97, 0.18);
    }

    .cert-action:hover {
      filter: brightness(0.97);
    }
  }
}

@media (max-width: 768px) {
  .cert-list .cert-grid {
    grid-template-columns: 1fr;
  }

  .cert-list .cert-item {
    .cert-item__head,
    .cert-item__actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
