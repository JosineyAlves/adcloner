'use client'

import { useState } from 'react'
import { BarChart3, ChevronDown, X, GripVertical, Eye, EyeOff } from 'lucide-react'
import { ALL_METRICS, MetricConfig, METRICS_BY_CATEGORY } from '@/lib/metrics-config'

interface MetricsSelectorProps {
  metrics: MetricConfig[]
  onMetricsChange: (metrics: MetricConfig[]) => void
}

// Usar as métricas importadas do arquivo de configuração
const AVAILABLE_METRICS = ALL_METRICS

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
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
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