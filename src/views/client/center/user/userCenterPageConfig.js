import {
  ArrowUndoCircleOutline,
  ColorPaletteOutline,
  DocumentTextOutline,
  HeartOutline,
  PersonCircleOutline,
} from '@/icons/ionicons'

export const mobileMenuItems = [
  {
    label: '个人信息',
    description: '资料与地址',
    key: 'profile',
    icon: PersonCircleOutline,
  },
  {
    label: '我的订单',
    description: '订单与支付',
    key: 'orders',
    icon: DocumentTextOutline,
  },
  {
    label: '设计订单',
    description: '设计与交付',
    key: 'designOrders',
    icon: ColorPaletteOutline,
  },
  {
    label: '收藏户型',
    description: '收藏记录',
    key: 'favorites',
    icon: HeartOutline,
  },
  {
    label: '退出登录',
    description: '安全退出',
    key: 'logout',
    icon: ArrowUndoCircleOutline,
  },
]

export const orderStatusFilterTagConfigs = [
  { key: 'all', label: '全部' },
  { key: '0', label: '订单提交' },
  { key: '1', label: '派单中' },
  { key: '2', label: '已派单' },
  { key: '3', label: '施工中' },
  { key: '4', label: '已完成' },
  { key: '5', label: '已取消' },
]
