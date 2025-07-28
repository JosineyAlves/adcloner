'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Eye, EyeOff, GripVertical, Check } from 'lucide-react'
import { ColumnConfig, DEFAULT_COLUMNS, getCategories } from '@/lib/column-config'

interface ColumnConfigModalProps {
  isOpen: boolean
  onClose: () => void
  columns: ColumnConfig[]
  onSave: (columns: ColumnConfig[]) => void
}

export default function ColumnConfigModal({ 
  isOpen, 
  onClose, 
  columns, 
  onSave 
}: ColumnConfigModalProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const categories = ['Todas', ...getCategories(columns)]
  const filteredColumns = selectedCategory === 'Todas' 
    ? localColumns 
    : localColumns.filter(col => col.category === selectedCategory)

  const handleToggleColumn = (columnId: string) => {
    setLocalColumns(prev => 
      prev.map(col => 
        col.id === columnId 
          ? { ...col, visible: !col.visible }
          : col
      )
    )
  }

  const handleMoveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...localColumns]
    const [movedColumn] = newColumns.splice(fromIndex, 1)
    newColumns.splice(toIndex, 0, movedColumn)
    
    // Update order based on new position
    const updatedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index + 1
    }))
    
    setLocalColumns(updatedColumns)
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      handleMoveColumn(dragIndex, index)
      setDragIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const handleSave = () => {
    onSave(localColumns)
    onClose()
  }

  const handleReset = () => {
    setLocalColumns(DEFAULT_COLUMNS)
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configurar Colunas
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filtrar por Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columns List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredColumns.map((column, index) => (
                  <motion.div
                    key={column.id}
                    layout
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border ${
                      dragIndex === index ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {column.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                            {column.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {column.type} • Ordem: {column.order}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleColumn(column.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          column.visible
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                        }`}
                      >
                        {column.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      {column.visible && (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Resumo da Configuração
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {localColumns.filter(col => col.visible).length} de {localColumns.length} colunas visíveis
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Arraste para reordenar • Clique no ícone para mostrar/ocultar
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Restaurar Padrão
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
                  Salvar Configuração
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 