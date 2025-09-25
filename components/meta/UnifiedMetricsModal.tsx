'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Eye, EyeOff, GripVertical, Check, BarChart3 } from 'lucide-react'

export interface MetricOption {
  id: string
  label: string
  description?: string
  iconColor: string
  type: 'number' | 'currency' | 'percentage' | 'text'
  category: string
  visible: boolean
  order: number
}

interface UnifiedMetricsModalProps {
  isOpen: boolean
  onClose: () => void
  metrics: MetricOption[]
  onSave: (metrics: MetricOption[]) => void
  title?: string
  description?: string
}

const AVAILABLE_METRICS: Omit<MetricOption, 'visible' | 'order'>[] = [
  // Métricas Básicas
  {
    id: 'campaign_name',
    label: 'Campanha',
    description: 'Nome da campanha',
    iconColor: 'text-gray-600',
    type: 'text',
    category: 'Identificação'
  },
  {
    id: 'impressions',
    label: 'Impressões',
    description: 'Número de vezes que seus anúncios foram exibidos',
    iconColor: 'text-blue-600',
    type: 'number',
    category: 'Métricas Básicas'
  },
  {
    id: 'clicks',
    label: 'Cliques',
    description: 'Número de cliques em seus anúncios',
    iconColor: 'text-green-600',
    type: 'number',
    category: 'Métricas Básicas'
  },
  {
    id: 'spend',
    label: 'Gasto',
    description: 'Valor total gasto em anúncios',
    iconColor: 'text-red-600',
    type: 'currency',
    category: 'Métricas Básicas'
  },
  {
    id: 'reach',
    label: 'Alcance',
    description: 'Número de pessoas únicas que viram seus anúncios',
    iconColor: 'text-purple-600',
    type: 'number',
    category: 'Métricas Básicas'
  },
  {
    id: 'frequency',
    label: 'Frequência',
    description: 'Média de vezes que cada pessoa viu seu anúncio',
    iconColor: 'text-orange-600',
    type: 'number',
    category: 'Métricas Básicas'
  },
  
  // Métricas de Custo
  {
    id: 'cpm',
    label: 'CPM',
    description: 'Custo por mil impressões',
    iconColor: 'text-indigo-600',
    type: 'currency',
    category: 'Métricas de Custo'
  },
  {
    id: 'cpc',
    label: 'CPC',
    description: 'Custo por clique',
    iconColor: 'text-teal-600',
    type: 'currency',
    category: 'Métricas de Custo'
  },
  {
    id: 'ctr',
    label: 'CTR',
    description: 'Taxa de clique (cliques / impressões)',
    iconColor: 'text-pink-600',
    type: 'percentage',
    category: 'Métricas de Custo'
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    description: 'Custo médio por conversão',
    iconColor: 'text-amber-600',
    type: 'currency',
    category: 'Métricas de Custo'
  },
  
  // Métricas de Conversão
  {
    id: 'conversions',
    label: 'Conversões',
    description: 'Número de conversões realizadas',
    iconColor: 'text-emerald-600',
    type: 'number',
    category: 'Conversão'
  },
  {
    id: 'conversion_rate',
    label: 'Taxa de Conversão',
    description: 'Percentual de cliques que resultaram em conversão',
    iconColor: 'text-cyan-600',
    type: 'percentage',
    category: 'Conversão'
  },
  {
    id: 'roas',
    label: 'ROAS',
    description: 'Retorno sobre gastos em anúncios',
    iconColor: 'text-violet-600',
    type: 'number',
    category: 'Conversão'
  },
  {
    id: 'roi',
    label: 'ROI',
    description: 'Retorno sobre investimento',
    iconColor: 'text-rose-600',
    type: 'percentage',
    category: 'Conversão'
  },
  
  // Métricas de Engajamento
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links',
    description: 'Número de cliques em links específicos',
    iconColor: 'text-cyan-600',
    type: 'number',
    category: 'Engajamento'
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento',
    description: 'Interações com o post (likes, comentários, shares)',
    iconColor: 'text-rose-600',
    type: 'number',
    category: 'Engajamento'
  },
  
  // Status e Configuração
  {
    id: 'status',
    label: 'Status',
    description: 'Status da campanha (Ativa, Pausada, etc.)',
    iconColor: 'text-gray-600',
    type: 'text',
    category: 'Status'
  },
  {
    id: 'objective',
    label: 'Objetivo',
    description: 'Objetivo da campanha',
    iconColor: 'text-gray-600',
    type: 'text',
    category: 'Status'
  },
  {
    id: 'daily_budget',
    label: 'Orçamento Diário',
    description: 'Orçamento diário da campanha',
    iconColor: 'text-green-600',
    type: 'currency',
    category: 'Status'
  },
  {
    id: 'created_time',
    label: 'Criada em',
    description: 'Data de criação da campanha',
    iconColor: 'text-gray-600',
    type: 'text',
    category: 'Status'
  }
]

export default function UnifiedMetricsModal({ 
  isOpen, 
  onClose, 
  metrics, 
  onSave,
  title = "Personalize as colunas",
  description = "Escolha como você quer visualizar as colunas na tabela."
}: UnifiedMetricsModalProps) {
  const [localMetrics, setLocalMetrics] = useState<MetricOption[]>(metrics)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Criar métricas completas com todas as opções disponíveis
  const allMetrics = AVAILABLE_METRICS.map(metric => {
    const existingMetric = localMetrics.find(m => m.id === metric.id)
    return {
      ...metric,
      visible: existingMetric?.visible || false,
      order: existingMetric?.order || 999
    }
  })

  // Métricas visíveis ordenadas
  const visibleMetrics = localMetrics
    .filter(m => m.visible)
    .sort((a, b) => a.order - b.order)

  // Métricas não selecionadas
  const unselectedMetrics = allMetrics.filter(m => !m.visible)

  const handleToggleMetric = (metricId: string) => {
    const metric = allMetrics.find(m => m.id === metricId)
    if (!metric) return

    if (metric.visible) {
      // Remover da lista visível
      setLocalMetrics(prev => prev.filter(m => m.id !== metricId))
    } else {
      // Adicionar à lista visível com ordem no final
      const maxOrder = Math.max(...localMetrics.map(m => m.order), 0)
      setLocalMetrics(prev => [...prev, { ...metric, visible: true, order: maxOrder + 1 }])
    }
  }

  const handleMoveMetric = (fromIndex: number, toIndex: number) => {
    const newMetrics = [...visibleMetrics]
    const [movedMetric] = newMetrics.splice(fromIndex, 1)
    newMetrics.splice(toIndex, 0, movedMetric)
    
    // Atualizar ordem
    const updatedMetrics = newMetrics.map((metric, index) => ({
      ...metric,
      order: index + 1
    }))
    
    setLocalMetrics(prev => {
      const hiddenMetrics = prev.filter(m => !m.visible)
      return [...hiddenMetrics, ...updatedMetrics]
    })
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      handleMoveMetric(dragIndex, index)
      setDragIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const handleSave = () => {
    onSave(localMetrics)
    onClose()
  }

  const handleReset = () => {
    setLocalMetrics([])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex h-[60vh]">
              {/* Left Panel - Available Metrics */}
              <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Métricas Disponíveis
                </h3>
                <div className="space-y-2">
                  {unselectedMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleToggleMetric(metric.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${metric.iconColor}`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {metric.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {metric.description}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {metric.category} • {metric.type}
                          </div>
                        </div>
                      </div>
                      <button
                        className="p-2 rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Selected and Ordered Metrics */}
              <div className="w-1/2 p-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Métricas Selecionadas e Ordenadas
                </h3>
                <div className="space-y-2">
                  {visibleMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.id}
                      layout
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        dragIndex === index 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'
                      } hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <div className={`w-3 h-3 rounded-full ${metric.iconColor}`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {metric.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {metric.description}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleMetric(metric.id)}
                        className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  
                  {visibleMetrics.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma métrica selecionada</p>
                      <p className="text-sm">Selecione métricas no painel à esquerda</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Limpar Seleção
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
