'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Upload, FileText, Download, Trash2 } from 'lucide-react'
import CSVUploadModal from '@/components/templates/CSVUploadModal'

interface Template {
  id: string
  name: string
  description: string
  fileName: string
  processedAt: string
  campaignCount: number
  status: 'active' | 'archived'
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error)
    }
  }

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false)
    fetchTemplates()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Templates de Campanha
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie seus templates de campanha para clonagem rápida
          </p>
        </div>
        
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Faça upload de um arquivo CSV do Facebook Ads Manager para criar seu primeiro template
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary flex items-center mx-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Criar Primeiro Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  template.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {template.status === 'active' ? 'Ativo' : 'Arquivado'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4 mr-2" />
                  {template.fileName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {template.campaignCount} campanhas
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Processado em {new Date(template.processedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {/* TODO: Implementar download */}}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="btn-danger flex items-center text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <CSVUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
} 