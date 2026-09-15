'use client'

import { useState, useEffect } from 'react'
import { X, Search, GripVertical, Check } from 'lucide-react'
import { MetricConfig, ALL_METRICS } from '@/lib/metrics-config'

interface ColumnsCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  selectedMetrics: string[]
  onSave: (metrics: string[]) => void
  availableMetrics: MetricConfig[]
}

export default function ColumnsCustomizationModal({
  isOpen,
  onClose,
  selectedMetrics,
  onSave,
  availableMetrics
}: ColumnsCustomizationModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (selectedMetrics && selectedMetrics.length > 0) {
      setSelected(selectedMetrics)
    }
  }, [selectedMetrics])

  if (!isOpen) return null

  // Filtrar métricas disponíveis baseado na busca
  const filteredMetrics = availableMetrics.filter(metric =>
    metric.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metric.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Métricas selecionadas ordenadas
  const selectedMetricsConfig = selected
    .map(id => availableMetrics.find(m => m.id === id))
    .filter(Boolean) as MetricConfig[]

  const handleToggleMetric = (metricId: string) => {
    if (selected.includes(metricId)) {
      setSelected(selected.filter(id => id !== metricId))
    } else {
      setSelected([...selected, metricId])
    }
  }

  const handleRemoveMetric = (metricId: string) => {
    setSelected(selected.filter(id => id !== metricId))
  }

  const handleDragStart = (e: React.DragEvent, metricId: string) => {
    setDraggedItem(metricId)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', metricId)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, targetMetricId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(targetMetricId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetMetricId: string) => {
    e.preventDefault()
    const draggedMetricId = e.dataTransfer.getData('text/plain')
    
    if (!draggedMetricId || draggedMetricId === targetMetricId) {
      setDragOverItem(null)
      return
    }

    const draggedIndex = selected.indexOf(draggedMetricId)
    const targetIndex = selected.indexOf(targetMetricId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverItem(null)
      return
    }
    
    const newSelected = [...selected]
    newSelected.splice(draggedIndex, 1)
    newSelected.splice(targetIndex, 0, draggedMetricId)
    
    setSelected(newSelected)
    setDragOverItem(null)
  }

  const handleSave = () => {
    onSave(selected)
    onClose()
  }

  const handleCancel = () => {
    setSelected(selectedMetrics)
    onClose()
  }

  const handleSelectAll = () => {
    const allMetricIds = availableMetrics.map(metric => metric.id)
    setSelected(allMetricIds)
  }

  const handleDeselectAll = () => {
    setSelected([])
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Colunas</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Selecionar Todas
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Desmarcar Todas
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Available Metrics */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por coluna"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleToggleMetric(metric.id)}
                  >
                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                      {selected.includes(metric.id) ? (
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center transition-all duration-200 scale-110">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded transition-all duration-200 hover:border-blue-400"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{metric.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Selected Metrics */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Colunas selecionadas</h3>
              <p className="text-sm text-gray-600 mt-1">
                Arraste para reordenar as colunas
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {selectedMetricsConfig.map((metric, index) => (
                  <div
                    key={metric.id}
                    draggable
                    onDragStart={(e: React.DragEvent) => handleDragStart(e, metric.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e: React.DragEvent) => handleDragOver(e, metric.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e: React.DragEvent) => handleDrop(e, metric.id)}
                    className={`
                      flex items-center p-3 rounded-lg cursor-move transition-all duration-300 ease-in-out
                      ${draggedItem === metric.id 
                        ? 'bg-blue-100 border-2 border-blue-400 shadow-xl transform scale-105 rotate-1' 
                        : dragOverItem === metric.id
                        ? 'bg-blue-50 border-2 border-blue-300 shadow-lg transform scale-102'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                      }
                      ${isDragging && draggedItem !== metric.id ? 'opacity-50' : 'opacity-100'}
                    `}
                    style={{
                      transform: draggedItem === metric.id 
                        ? 'scale(1.05) rotate(1deg)' 
                        : dragOverItem === metric.id 
                        ? 'scale(1.02)' 
                        : 'scale(1)',
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                      <GripVertical className={`w-4 h-4 transition-colors duration-200 ${
                        draggedItem === metric.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex items-center flex-1">
                      <span className="font-medium text-gray-900">{metric.label}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMetric(metric.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-2 p-1 rounded hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {selectedMetricsConfig.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma coluna selecionada</p>
                    <p className="text-sm mt-1">Selecione métricas do painel à esquerda</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
