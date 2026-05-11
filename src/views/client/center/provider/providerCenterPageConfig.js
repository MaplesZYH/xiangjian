import {
  ArrowUndoCircleOutline,
  DocumentTextOutline,
  HomeOutline,
} from '@/icons/ionicons'

export const providerMobileMenuItems = [
  {
    label: '企业信息',
    description: '资料与资质',
    key: 'company',
    icon: HomeOutline,
  },
  {
    label: '订单管理',
    description: '订单与进度',
    key: 'orders',
    icon: DocumentTextOutline,
  },
  {
    label: '退出登录',
    description: '安全退出',
    key: 'logout',
    icon: ArrowUndoCircleOutline,
  },
]
