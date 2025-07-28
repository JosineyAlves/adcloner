'use client'

import React, { useState, useEffect } from 'react'
import { X, Play, FileText, Download } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  fileName: string
  processedAt: string
  campaignCount: number
  status: 'active' | 'archived'
}

interface CloneFromTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
}

export default function CloneFromTemplateModal({ isOpen, onClose, accounts }: CloneFromTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCloning, setIsCloning] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

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

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleStartCloning = async () => {
    if (!selectedTemplate || selectedAccounts.length === 0) {
      alert('Selecione um template e pelo menos uma conta')
      return
    }

    try {
      setIsCloning(true)
      
      // Enviar dados para API de clonagem
      const response = await fetch('/api/campaigns/clone-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          accountIds: selectedAccounts
        })
      })

      if (response.ok) {
        alert('Clonagem iniciada com sucesso!')
        onClose()
      } else {
        throw new Error('Erro na clonagem')
      }
    } catch (error) {
      console.error('Erro ao clonar template:', error)
      alert('Erro ao clonar template. Tente novamente.')
    } finally {
      setIsCloning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Clonar de Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Seleção de Template */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Selecione um Template
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum template disponível. Crie templates na seção Templates.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {template.campaignCount} campanhas • {template.fileName}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {template.status === 'active' ? 'Ativo' : 'Arquivado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seleção de Contas */}
          {selectedTemplate && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Selecione as Contas de Destino
              </h3>
              
              <div className="space-y-3">
                {accounts.map((account) => (
                  <label key={account.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => handleAccountToggle(account.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {account.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {account.accountId}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Resumo */}
          {selectedTemplate && selectedAccounts.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Resumo da Clonagem
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Template: {selectedTemplate.name}</li>
                <li>• Contas selecionadas: {selectedAccounts.length}</li>
                <li>• Campanhas por conta: {selectedTemplate.campaignCount}</li>
                <li>• Total de campanhas: {selectedTemplate.campaignCount * selectedAccounts.length}</li>
              </ul>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isCloning}
            >
              Cancelar
            </button>
            <button
              onClick={handleStartCloning}
              disabled={!selectedTemplate || selectedAccounts.length === 0 || isCloning}
              className="btn-primary flex items-center"
            >
              {isCloning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Clonando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Clonagem
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 