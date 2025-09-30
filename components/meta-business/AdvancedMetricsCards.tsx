'use client'

import { motion } from 'framer-motion'
import { MetricConfig } from '@/lib/metrics-config'
import StatsCard from '@/components/dashboard/StatsCard'

interface AdvancedMetricsCardsProps {
  metrics: MetricConfig[]
  data: any[]
  level: 'campaign' | 'adset' | 'ad'
}

export default function AdvancedMetricsCards({ 
  metrics, 
  data, 
  level 
}: AdvancedMetricsCardsProps) {
  const visibleMetrics = metrics.filter(m => m.visible).sort((a, b) => a.order - b.order)

  const calculateTotalValue = (metricId: string) => {
    return data.reduce((sum, item) => {
      const value = item[metricId] || 0
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
  }

  const calculateAverageValue = (metricId: string) => {
    const total = calculateTotalValue(metricId)
    return data.length > 0 ? total / data.length : 0
  }

  const formatValue = (value: number, type: 'number' | 'currency' | 'percentage') => {
    switch (type) {
      case 'currency':
        return `R$ ${value.toFixed(2)}`
      case 'percentage':
        return `${value.toFixed(2)}%`
      default:
        return value.toLocaleString()
    }
  }

  const getMetricValue = (metric: MetricConfig) => {
    const value = calculateTotalValue(metric.id)
    return formatValue(value, metric.type)
  }

  const getMetricTrend = (metricId: string) => {
    // Simulação de tendência - em produção, compararia com período anterior
    const value = calculateTotalValue(metricId)
    return value > 0 ? 'up' : 'neutral'
  }

  if (visibleMetrics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Nenhuma métrica selecionada</p>
          <p className="text-sm">Configure as métricas para visualizar os dados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {visibleMetrics.map((metric, index) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <StatsCard
            title={metric.label}
            value={getMetricValue(metric)}
            trend={getMetricTrend(metric.id)}
            description={metric.description}
          />
        </motion.div>
      ))}
    </div>
  )
}
