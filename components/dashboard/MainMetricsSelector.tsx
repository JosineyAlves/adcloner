'use client'

import { useState } from 'react'
import { BarChart3, ChevronDown, X, Eye, EyeOff } from 'lucide-react'
import { MetricConfig, MAIN_METRICS } from '@/lib/metrics-config'

interface MainMetricsSelectorProps {
  metrics: MetricConfig[]
  onMetricsChange: (metrics: MetricConfig[]) => void
}

// Usar as métricas principais importadas do arquivo de configuração
const MAIN_METRICS_OPTIONS = MAIN_METRICS

export default function MainMetricsSelector({
  metrics,
  onMetricsChange
}: MainMetricsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleMetric = (metricId: string) => {
    const updatedMetrics = metrics.map(metric => 
      metric.id === metricId 
        ? { ...metric, visible: !metric.visible }
        : metric
    )
    onMetricsChange(updatedMetrics)
  }

  const visibleCount = metrics.filter(m => m.visible).length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center space-x-2"
      >
        <BarChart3 className="w-4 h-4" />
        <span>Métricas</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        {visibleCount > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {visibleCount}
          </span>
        )}
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
                  Selecionar Métricas Principais
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Escolha quais métricas exibir nos cards principais
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-3">
                {MAIN_METRICS_OPTIONS.map((option) => {
                  const currentMetric = metrics.find(m => m.id === option.id)
                  const isVisible = currentMetric?.visible || false
                  
                  return (
                    <div
                      key={option.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${option.iconColor}`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleMetric(option.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isVisible 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 