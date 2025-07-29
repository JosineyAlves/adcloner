'use client'

import { useState } from 'react'
import { BarChart3, ChevronDown, X, GripVertical, Eye, EyeOff, MousePointer, DollarSign, Target, Repeat, TrendingUp, Percent, Link, Heart } from 'lucide-react'

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

interface MetricsSelectorProps {
  metrics: MetricConfig[]
  onMetricsChange: (metrics: MetricConfig[]) => void
}

const AVAILABLE_METRICS: MetricConfig[] = [
  {
    id: 'impressions',
    label: 'Impressões',
    description: 'Número de vezes que seus anúncios foram exibidos',
    icon: Eye,
    iconColor: 'text-blue-600',
    type: 'number',
    visible: true,
    order: 1
  },
  {
    id: 'clicks',
    label: 'Cliques',
    description: 'Número de cliques em seus anúncios',
    icon: MousePointer,
    iconColor: 'text-green-600',
    type: 'number',
    visible: true,
    order: 2
  },
  {
    id: 'spend',
    label: 'Gasto',
    description: 'Valor total gasto em anúncios',
    icon: DollarSign,
    iconColor: 'text-red-600',
    type: 'currency',
    visible: true,
    order: 3
  },
  {
    id: 'reach',
    label: 'Alcance',
    description: 'Número de pessoas únicas que viram seus anúncios',
    icon: Target,
    iconColor: 'text-purple-600',
    type: 'number',
    visible: true,
    order: 4
  },
  {
    id: 'frequency',
    label: 'Frequência',
    description: 'Média de vezes que cada pessoa viu seu anúncio',
    icon: Repeat,
    iconColor: 'text-orange-600',
    type: 'number',
    visible: false,
    order: 5
  },
  {
    id: 'cpm',
    label: 'CPM',
    description: 'Custo por mil impressões',
    icon: TrendingUp,
    iconColor: 'text-indigo-600',
    type: 'currency',
    visible: false,
    order: 6
  },
  {
    id: 'cpc',
    label: 'CPC',
    description: 'Custo por clique',
    icon: MousePointer,
    iconColor: 'text-teal-600',
    type: 'currency',
    visible: false,
    order: 7
  },
  {
    id: 'ctr',
    label: 'CTR',
    description: 'Taxa de clique (cliques / impressões)',
    icon: Percent,
    iconColor: 'text-pink-600',
    type: 'percentage',
    visible: false,
    order: 8
  },
  {
    id: 'conversions',
    label: 'Conversões',
    description: 'Número de conversões realizadas',
    icon: Target,
    iconColor: 'text-emerald-600',
    type: 'number',
    visible: false,
    order: 9
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    description: 'Custo médio por conversão',
    icon: DollarSign,
    iconColor: 'text-amber-600',
    type: 'currency',
    visible: false,
    order: 10
  },
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links',
    description: 'Número de cliques em links específicos',
    icon: Link,
    iconColor: 'text-cyan-600',
    type: 'number',
    visible: false,
    order: 11
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento',
    description: 'Interações com o post (likes, comentários, shares)',
    icon: Heart,
    iconColor: 'text-rose-600',
    type: 'number',
    visible: false,
    order: 12
  }
]

export default function MetricsSelector({
  metrics,
  onMetricsChange
}: MetricsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleToggleMetric = (metricId: string) => {
    const updatedMetrics = metrics.map(metric =>
      metric.id === metricId
        ? { ...metric, visible: !metric.visible }
        : metric
    )
    onMetricsChange(updatedMetrics)
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updatedMetrics = [...metrics]
    const [movedItem] = updatedMetrics.splice(fromIndex, 1)
    updatedMetrics.splice(toIndex, 0, movedItem)
    
    // Atualizar ordem
    const reorderedMetrics = updatedMetrics.map((metric, index) => ({
      ...metric,
      order: index + 1
    }))
    
    onMetricsChange(reorderedMetrics)
  }

  const handleDragStart = (e: React.DragEvent, metricId: string) => {
    setDraggedItem(metricId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetMetricId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetMetricId) return
    
    const draggedIndex = metrics.findIndex(m => m.id === draggedItem)
    const targetIndex = metrics.findIndex(m => m.id === targetMetricId)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      handleReorder(draggedIndex, targetIndex)
    }
    
    setDraggedItem(null)
  }

  const visibleMetrics = metrics.filter(m => m.visible).sort((a, b) => a.order - b.order)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <BarChart3 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          Métricas ({visibleMetrics.length})
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Configurar Métricas Principais
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metrics.map((metric, index) => (
                <div
                  key={metric.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, metric.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, metric.id)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    draggedItem === metric.id
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${metric.iconColor}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {metric.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleMetric(metric.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      metric.visible
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                    }`}
                  >
                    {metric.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Métricas visíveis: {visibleMetrics.length}
                </span>
                <span className="text-gray-500 dark:text-gray-500">
                  Arraste para reordenar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 