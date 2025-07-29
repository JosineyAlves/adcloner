'use client'

import { useState } from 'react'
import { BarChart3, ChevronDown, X, GripVertical } from 'lucide-react'
import { MetricConfig } from './MetricsSelector'

interface MainMetricsOrderSelectorProps {
  metrics: MetricConfig[]
  onMetricsChange: (metrics: MetricConfig[]) => void
}

export default function MainMetricsOrderSelector({
  metrics,
  onMetricsChange
}: MainMetricsOrderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updatedMetrics = [...metrics]
    const [movedItem] = updatedMetrics.splice(fromIndex, 1)
    updatedMetrics.splice(toIndex, 0, movedItem)
    
    // Atualizar a ordem
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
    
    if (!draggedItem || draggedItem === targetMetricId) {
      setDraggedItem(null)
      return
    }

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
        className="btn-secondary flex items-center space-x-2"
      >
        <BarChart3 className="w-4 h-4" />
        <span>Ordenar Métricas</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ordenar Métricas Principais
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Arraste para reordenar as métricas nos cards
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-4">
              {visibleMetrics.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma métrica selecionada</p>
                  <p className="text-sm">Selecione métricas primeiro</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleMetrics.map((metric, index) => (
                    <div
                      key={metric.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, metric.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, metric.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-move transition-all ${
                        draggedItem === metric.id 
                          ? 'opacity-50 bg-gray-100 dark:bg-gray-700' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className={`w-3 h-3 rounded-full ${metric.iconColor}`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {metric.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Posição {index + 1}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        #{metric.order}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 