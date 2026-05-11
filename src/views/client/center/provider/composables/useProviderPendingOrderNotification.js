import { h, ref } from 'vue'
import {
  NAvatar,
  NButton,
  NIcon,
  useMessage,
  useNotification,
} from 'naive-ui'
import { DocumentTextOutline } from '@/icons/ionicons'

export const useProviderPendingOrderNotification = ({
  vendorInfo,
  acceptedNeedHandleCount,
  unrepliedOrderCount,
  getProviderId,
}) => {
  const message = useMessage()
  const notification = useNotification()
  const pendingOrderNotificationRef = ref(null)
  const pendingOrderNotificationSignature = ref('')

  const getPendingOrderNotificationSessionKey = (vendorId) =>
    `provider-pending-order-notification-read:${vendorId}`

  const getPendingOrderNotificationSignature = () => {
    const accepted = Number(acceptedNeedHandleCount.value || 0)
    const unreplied = Number(unrepliedOrderCount.value || 0)
    return `${accepted}:${unreplied}`
  }

  const readPendingOrderNotification = (vendorId) => {
    if (typeof window === 'undefined' || !vendorId) return ''
    return (
      window.sessionStorage.getItem(
        getPendingOrderNotificationSessionKey(vendorId),
      ) || ''
    )
  }

  const markPendingOrderNotificationRead = (vendorId, signature) => {
    if (typeof window === 'undefined' || !vendorId) return
    window.sessionStorage.setItem(
      getPendingOrderNotificationSessionKey(vendorId),
      signature,
    )
  }

  const clearPendingOrderNotificationRead = (vendorId) => {
    if (typeof window === 'undefined' || !vendorId) return
    window.sessionStorage.removeItem(
      getPendingOrderNotificationSessionKey(vendorId),
    )
  }

  const closePendingOrderNotification = () => {
    pendingOrderNotificationRef.value?.destroy()
    pendingOrderNotificationRef.value = null
    pendingOrderNotificationSignature.value = ''
  }

  const maybeShowPendingOrderNotification = () => {
    const vendorId = vendorInfo.value?.id || getProviderId()
    if (!vendorId) return

    const accepted = Number(acceptedNeedHandleCount.value || 0)
    const unreplied = Number(unrepliedOrderCount.value || 0)
    const total = accepted + unreplied

    if (total <= 0) {
      clearPendingOrderNotificationRead(vendorId)
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

    if (readPendingOrderNotification(vendorId) === signature) {
      return
    }

    closePendingOrderNotification()

    let markAsRead = false
    const metaText = [
      accepted > 0 ? `已接受待处理 ${accepted}` : '',
      unreplied > 0 ? `未回复 ${unreplied}` : '',
    ]
      .filter(Boolean)
      .join(' · ')

    const notificationReactive = notification.create({
      title: '订单待处理提醒',
      description: '订单管理中存在需要尽快处理的内容',
      content: `当前共有 ${total} 条待处理提醒，请及时进入订单管理查看并处理。`,
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
              markPendingOrderNotificationRead(vendorId, signature)
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
    maybeShowPendingOrderNotification,
    clearPendingOrderNotificationRead,
    closePendingOrderNotification,
  }
}
