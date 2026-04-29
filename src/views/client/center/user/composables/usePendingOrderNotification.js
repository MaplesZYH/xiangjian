import { h, ref } from 'vue'
import { NAvatar, NButton, NIcon } from 'naive-ui'
import { DocumentTextOutline } from '@/icons/ionicons'

const getPendingOrderNotificationSessionKey = (userId) =>
  `user-pending-order-notification-read:${userId}`

const readPendingOrderNotification = (userId) => {
  if (typeof window === 'undefined' || !userId) return ''
  return (
    window.sessionStorage.getItem(
      getPendingOrderNotificationSessionKey(userId),
    ) || ''
  )
}

const markPendingOrderNotificationRead = (userId, signature) => {
  if (typeof window === 'undefined' || !userId) return
  window.sessionStorage.setItem(
    getPendingOrderNotificationSessionKey(userId),
    signature,
  )
}

export const clearPendingOrderNotificationRead = (userId) => {
  if (typeof window === 'undefined' || !userId) return
  window.sessionStorage.removeItem(getPendingOrderNotificationSessionKey(userId))
}

export const usePendingOrderNotification = ({
  pendingOrderNotificationItems,
  getStoredUserId,
  notification,
  message,
}) => {
  const pendingOrderNotificationRef = ref(null)
  const pendingOrderNotificationSignature = ref('')

  const getPendingOrderNotificationSignature = () =>
    pendingOrderNotificationItems.value
      .map((item) => `${item.key}:${item.badgeCount}`)
      .join('|')

  const closePendingOrderNotification = () => {
    pendingOrderNotificationRef.value?.destroy()
    pendingOrderNotificationRef.value = null
    pendingOrderNotificationSignature.value = ''
  }

  const maybeShowPendingOrderNotification = () => {
    const userId = getStoredUserId()
    if (!userId) return

    const items = pendingOrderNotificationItems.value
    const total = items.reduce(
      (sum, item) => sum + Number(item.badgeCount || 0),
      0,
    )

    if (total <= 0) {
      clearPendingOrderNotificationRead(userId)
      closePendingOrderNotification()
      return
    }

    const signature = getPendingOrderNotificationSignature()
    if (
      pendingOrderNotificationRef.value &&
      pendingOrderNotificationSignature.value === signature
    ) {
      return
    }

    if (readPendingOrderNotification(userId) === signature) {
      return
    }

    closePendingOrderNotification()

    let markAsRead = false
    const metaText = items
      .map((item) => `${item.label} ${item.badgeCount}`)
      .join(' · ')

    const notificationReactive = notification.create({
      title: '订单待处理提醒',
      description: '订单中心存在需要您尽快处理的内容',
      content: `当前共有 ${total} 条待处理提醒，请及时进入订单中心查看并处理。`,
      meta: metaText || '请及时处理',
      duration: 0,
      avatar: () =>
        h(
          NAvatar,
          {
            size: 'small',
            round: true,
            style: {
              backgroundColor: '#d03050',
              color: '#fff',
            },
          },
          {
            default: () =>
              h(NIcon, { size: 16 }, { default: () => h(DocumentTextOutline) }),
          },
        ),
      action: () =>
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: () => {
              markAsRead = true
              markPendingOrderNotificationRead(userId, signature)
              notificationReactive.destroy()
            },
          },
          {
            default: () => '已读',
          },
        ),
      onClose: () => {
        if (!markAsRead) {
          message.warning('点击“已读”可暂时关闭该提醒')
          return false
        }
        return true
      },
      onAfterLeave: () => {
        if (pendingOrderNotificationRef.value === notificationReactive) {
          pendingOrderNotificationRef.value = null
          pendingOrderNotificationSignature.value = ''
        }
      },
    })

    pendingOrderNotificationRef.value = notificationReactive
    pendingOrderNotificationSignature.value = signature
  }

  return {
    closePendingOrderNotification,
    maybeShowPendingOrderNotification,
  }
}
