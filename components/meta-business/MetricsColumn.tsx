'use client'

import { MetricConfig } from '@/lib/metrics-config'

interface MetricsColumnProps {
  data: any
  metrics: MetricConfig[]
  visibleMetrics: string[]
}

export default function MetricsColumn({ data, metrics, visibleMetrics }: MetricsColumnProps) {
  const formatValue = (value: any, type: 'number' | 'currency' | 'percentage') => {
    if (value === null || value === undefined) return '-'
    
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    
    if (isNaN(numValue)) return '-'
    
    switch (type) {
      case 'currency':
        return `R$ ${numValue.toFixed(2)}`
      case 'percentage':
        return `${numValue.toFixed(2)}%`
      default:
        return numValue.toLocaleString()
    }
  }

  const getMetricValue = (metricId: string) => {
    const metric = metrics.find(m => m.id === metricId)
    if (!metric) return '-'
    
    const value = data[metricId]
    return formatValue(value, metric.type)
  }

  const getMetricColor = (metricId: string) => {
    const metric = metrics.find(m => m.id === metricId)
    if (!metric) return 'text-gray-500'
    
    const value = data[metricId]
    if (value === null || value === undefined) return 'text-gray-400'
    
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    
    if (isNaN(numValue)) return 'text-gray-400'
    
    // Cores baseadas no tipo de métrica
    switch (metric.category) {
      case 'cost':
        return numValue > 0 ? 'text-red-600' : 'text-gray-500'
      case 'conversion':
        return numValue > 0 ? 'text-green-600' : 'text-gray-500'
      case 'engagement':
        return numValue > 0 ? 'text-blue-600' : 'text-gray-500'
      case 'video':
        return numValue > 0 ? 'text-purple-600' : 'text-gray-500'
      default:
        return numValue > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500'
    }
  }

  if (visibleMetrics.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-2">
        <p className="text-sm">Nenhuma métrica selecionada</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {visibleMetrics.map((metricId) => {
        const metric = metrics.find(m => m.id === metricId)
        if (!metric) return null
        
        return (
          <div key={metricId} className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 truncate mr-2">
              {metric.label}:
            </span>
            <span className={`font-medium ${getMetricColor(metricId)}`}>
              {getMetricValue(metricId)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
