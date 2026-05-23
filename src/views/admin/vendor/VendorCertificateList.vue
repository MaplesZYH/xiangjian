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
        <div class="cert-item__icon">
          <div class="cert-item__paper">
            <span>{{ getCertFileExt(cert.fileUrl) }}</span>
          </div>
        </div>
        <div class="cert-item__badge">资质 {{ index + 1 }}</div>
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
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }

  .cert-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-md);
    padding: 18px 14px 14px;
    background: linear-gradient(180deg, var(--color-surface) 0%, #f8fbf8 100%);
    box-shadow: var(--shadow-xs);

    .cert-item__badge {
      background: rgba(39, 110, 61, 0.1);
      color: var(--color-brand-700);
      border: 1px solid rgba(39, 110, 61, 0.18);
      border-radius: 999px;
      font-size: 12px;
      padding: 2px 8px;
      margin-top: 12px;
      margin-bottom: 8px;
      white-space: nowrap;
    }

    .cert-item__icon {
      width: 78px;
      height: 92px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cert-item__paper {
      position: relative;
      width: 64px;
      height: 78px;
      border: 2px solid rgba(39, 110, 61, 0.28);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 10px 24px rgba(37, 54, 43, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-brand-700);
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;

      &::before {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 20px;
        height: 20px;
        border-left: 2px solid rgba(39, 110, 61, 0.22);
        border-bottom: 2px solid rgba(39, 110, 61, 0.22);
        border-radius: 0 8px 0 6px;
        background: linear-gradient(135deg, #eaf4ed 50%, #fff 50%);
      }
    }

    .cert-item__name {
      width: 100%;
      font-weight: 600;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      margin-bottom: 12px;
    }

    .cert-item__actions {
      display: flex;
      gap: 8px;
      width: 100%;
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
