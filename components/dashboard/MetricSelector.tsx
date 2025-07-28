'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { ColumnConfig } from '@/lib/column-config'
import { getMetricCategories, getMetricsByCategory } from '@/lib/all-metrics-config'

interface MetricSelectorProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
}

export default function MetricSelector({ columns, onColumnsChange }: MetricSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const categories = getMetricCategories()

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleMetric = (metricId: string) => {
    if (columns.find(col => col.id === metricId)?.fixed) {
      return // Não permitir ocultar métricas fixas
    }

    const updatedColumns = columns.map(col => 
      col.id === metricId 
        ? { ...col, visible: !col.visible }
        : col
    )
    onColumnsChange(updatedColumns)
  }

  const selectAllInCategory = (category: string) => {
    const categoryMetrics = getMetricsByCategory(category)
    const updatedColumns = columns.map(col => {
      const categoryMetric = categoryMetrics.find(m => m.id === col.id)
      if (categoryMetric && !col.fixed) {
        return { ...col, visible: true }
      }
      return col
    })
    onColumnsChange(updatedColumns)
  }

  const deselectAllInCategory = (category: string) => {
    const categoryMetrics = getMetricsByCategory(category)
    const updatedColumns = columns.map(col => {
      const categoryMetric = categoryMetrics.find(m => m.id === col.id)
      if (categoryMetric && !col.fixed) {
        return { ...col, visible: false }
      }
      return col
    })
    onColumnsChange(updatedColumns)
  }

  const getCategoryMetrics = (category: string) => {
    return getMetricsByCategory(category)
  }

  const getVisibleCountInCategory = (category: string) => {
    const categoryMetrics = getCategoryMetrics(category)
    return categoryMetrics.filter(metric => 
      columns.find(col => col.id === metric.id)?.visible || 
      columns.find(col => col.id === metric.id)?.fixed
    ).length
  }

  const getTotalCountInCategory = (category: string) => {
    return getCategoryMetrics(category).length
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center space-x-2"
      >
        <Filter className="w-4 h-4" />
        <span>Selecionar Métricas</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Selecionar Métricas
            </h3>
            
            <div className="space-y-2">
              {categories.map(category => {
                const isExpanded = expandedCategories.includes(category)
                const visibleCount = getVisibleCountInCategory(category)
                const totalCount = getTotalCountInCategory(category)
                const categoryMetrics = getCategoryMetrics(category)

                return (
                  <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({visibleCount}/{totalCount})
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            selectAllInCategory(category)
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
                        >
                          Todos
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deselectAllInCategory(category)
                          }}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Nenhum
                        </button>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                        {categoryMetrics.map(metric => {
                          const column = columns.find(col => col.id === metric.id)
                          const isVisible = column?.visible || column?.fixed
                          const isFixed = column?.fixed

                          return (
                            <div
                              key={metric.id}
                              className={`flex items-center justify-between p-2 rounded ${
                                isFixed ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {isFixed ? (
                                  <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isVisible}
                                    onChange={() => toggleMetric(metric.id)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                  />
                                )}
                                <span className={`text-sm ${isFixed ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {metric.label}
                                </span>
                                {isFixed && (
                                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">
                                    Fixa
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {columns.filter(col => col.visible || col.fixed).length} de {columns.length} métricas selecionadas
                </span>
                <span>
                  {columns.filter(col => col.fixed).length} fixas
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 