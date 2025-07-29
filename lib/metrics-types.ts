export interface MetricConfig {
  id: string
  label: string
  description: string
  icon: any
  iconColor: string
  type: 'number' | 'currency' | 'percentage'
  visible: boolean
  order: number
} 