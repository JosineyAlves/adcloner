'use client'

import { useState } from 'react'
import { BarChart3, ChevronDown, X, GripVertical, Eye, EyeOff, Filter } from 'lucide-react'
import { ALL_METRICS, MetricConfig, METRICS_BY_CATEGORY } from '@/lib/metrics-config'

interface MetaBusinessMetricsSelectorProps {
  metrics: MetricConfig[]
  onMetricsChange: (metrics: MetricConfig[]) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

const CATEGORIES = [
  { id: 'all', label: 'Todas as Métricas', count: ALL_METRICS.length },
  { id: 'basic', label: 'Básicas', count: METRICS_BY_CATEGORY.basic.length },
  { id: 'cost', label: 'Custo', count: METRICS_BY_CATEGORY.cost.length },
  { id: 'engagement', label: 'Engajamento', count: METRICS_BY_CATEGORY.engagement.length },
  { id: 'conversion', label: 'Conversão', count: METRICS_BY_CATEGORY.conversion.length },
  { id: 'video', label: 'Vídeo', count: METRICS_BY_CATEGORY.video.length },
  { id: 'quality', label: 'Qualidade', count: METRICS_BY_CATEGORY.quality.length },
  { id: 'actions', label: 'Ações', count: METRICS_BY_CATEGORY.actions.length },
  { id: 'landing', label: 'Landing Page', count: METRICS_BY_CATEGORY.landing.length },
  { id: 'reach', label: 'Alcance', count: METRICS_BY_CATEGORY.reach.length },
  { id: 'frequency', label: 'Frequência', count: METRICS_BY_CATEGORY.frequency.length }
]

export default function MetaBusinessMetricsSelector({
  metrics,
  onMetricsChange,
  selectedCategory = 'all',
  onCategoryChange
}: MetaBusinessMetricsSelectorProps) {
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

  const handleSelectAll = () => {
    const updatedMetrics = metrics.map(metric => ({ ...metric, visible: true }))
    onMetricsChange(updatedMetrics)
  }

  const handleDeselectAll = () => {
    const updatedMetrics = metrics.map(metric => ({ ...metric, visible: false }))
    onMetricsChange(updatedMetrics)
  }

  const getFilteredMetrics = () => {
    if (selectedCategory === 'all') return metrics
    return metrics.filter(metric => metric.category === selectedCategory)
  }

  const visibleMetrics = metrics.filter(m => m.visible).sort((a, b) => a.order - b.order)
  const filteredMetrics = getFilteredMetrics()

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
        <div className="absolute top-full left-0 mt-1 w-[90vw] max-w-[600px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Configurar Métricas do Meta Business
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filtros de Categoria */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categorias:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange?.(category.id)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors text-center ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="truncate" title={category.label}>
                      {category.label}
                    </div>
                    <div className="text-xs opacity-75">({category.count})</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ações em Massa */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Selecionar Todas
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Desmarcar Todas
                </button>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {visibleMetrics.length} de {metrics.length} selecionadas
              </span>
            </div>

            {/* Lista de Métricas */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredMetrics.map((metric, index) => (
                <div
                  key={metric.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, metric.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, metric.id)}
                  className={`flex items-start space-x-2 p-2 rounded-lg border transition-colors ${
                    draggedItem === metric.id
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move mt-1 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${metric.iconColor} flex-shrink-0`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {metric.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-nowrap">
                        {metric.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {metric.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleMetric(metric.id)}
                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
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
