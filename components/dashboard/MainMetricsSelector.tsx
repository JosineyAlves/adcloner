'use client'

import { useState } from 'react'
import { BarChart3, ChevronDown, X, Eye, EyeOff, MousePointer, DollarSign, Target, Repeat, TrendingUp, Percent, Link, Heart } from 'lucide-react'
import { MetricConfig } from './MetricsSelector'

interface MainMetricsSelectorProps {
  metrics: MetricConfig[]
  onMetricsChange: (metrics: MetricConfig[]) => void
}

const MAIN_METRICS_OPTIONS: MetricConfig[] = [
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