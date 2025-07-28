'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Upload, FileText, Download, Trash2 } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
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

  const handleCreateBaseTemplate = async () => {
    try {
      // Criar template base com dados reais da campanha Dog
      const templateResponse = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Template Dog Campaign - Teste',
          description: 'Template base para teste com dados reais da campanha Dog',
          processedData: [
            {
              'Campaign Name': 'CA02 - THE DOG - CBO - 16/05',
              'Campaign Objective': 'Outcome Sales',
              'Campaign Status': 'PAUSED',
              'Ad Set Name': 'CJ01',
              'Ad Set Daily Budget': '5000',
              'Countries': 'US, CA',
              'Ad Name': 'AD06',
              'Title': 'Your dog could be an influencer!',
              'Body': 'Do you have a dog?\nTurn your pup\'s playful moments into something bigger while they have fun!\nIt\'s all about your dog enjoying life and you enjoying the perks.\nClick "Learn More" to see if your dog\'s breed can become an influencer.',
              'Link': 'https://inlead.digital/the-dog-influencer/?sck=fb|cam2|g1|ad6',
              'Image Hash': '864904627876681:30ffb9f08957ee8c222d4319f5e6f05d'
            },
            {
              'Campaign Name': 'CA02 - THE DOG - CBO - 16/05',
              'Campaign Objective': 'Outcome Sales',
              'Campaign Status': 'PAUSED',
              'Ad Set Name': 'CJ01',
              'Ad Set Daily Budget': '5000',
              'Countries': 'US, CA',
              'Ad Name': 'AD07',
              'Title': 'Your dog could be an influencer!',
              'Body': 'Do you have a dog?\nTurn your pup\'s playful moments into something bigger while they have fun!\nIt\'s all about your dog enjoying life and you enjoying the perks.\nClick "Learn More" to see if your dog\'s breed can become an influencer.',
              'Link': 'https://inlead.digital/the-dog-influencer/?sck=fb|cam2|g1|ad7',
              'Image Hash': '864904627876681:0322382636f64a4df9b6825809ca97b1'
            },
            {
              'Campaign Name': 'CA02 - THE DOG - CBO - 16/05',
              'Campaign Objective': 'Outcome Sales',
              'Campaign Status': 'PAUSED',
              'Ad Set Name': 'CJ01',
              'Ad Set Daily Budget': '5000',
              'Countries': 'US, CA',
              'Ad Name': 'AD08',
              'Title': 'Your dog could be an influencer!',
              'Body': 'Do you have a dog?\nTurn your pup\'s playful moments into something bigger while they have fun!\nIt\'s all about your dog enjoying life and you enjoying the perks.\nClick "Learn More" to see if your dog\'s breed can become an influencer.',
              'Link': 'https://inlead.digital/the-dog-influencer/?sck=fb|cam2|g1|ad8',
              'Image Hash': '864904627876681:13b238cb007c6963954b4ae623a2ae61'
            },
            {
              'Campaign Name': 'CA02 - THE DOG - CBO - 16/05',
              'Campaign Objective': 'Outcome Sales',
              'Campaign Status': 'PAUSED',
              'Ad Set Name': 'CJ01',
              'Ad Set Daily Budget': '5000',
              'Countries': 'US, CA',
              'Ad Name': 'AD09',
              'Title': 'Your dog could be an influencer!',
              'Body': 'Do you have a dog?\nTurn your pup\'s playful moments into something bigger while they have fun!\nIt\'s all about your dog enjoying life and you enjoying the perks.\nClick "Learn More" to see if your dog\'s breed can become an influencer.',
              'Link': 'https://inlead.digital/the-dog-influencer/?sck=fb|cam2|g1|ad9',
              'Image Hash': '864904627876681:97385c9a2d58641989570ac50118f7e6'
            },
            {
              'Campaign Name': 'CA02 - THE DOG - CBO - 16/05',
              'Campaign Objective': 'Outcome Sales',
              'Campaign Status': 'PAUSED',
              'Ad Set Name': 'CJ01',
              'Ad Set Daily Budget': '5000',
              'Countries': 'US, CA',
              'Ad Name': 'AD10',
              'Title': 'Your dog could be an influencer!',
              'Body': 'Do you have a dog?\nTurn your pup\'s playful moments into something bigger while they have fun!\nIt\'s all about your dog enjoying life and you enjoying the perks.\nClick "Learn More" to see if your dog\'s breed can become an influencer.',
              'Link': 'https://inlead.digital/the-dog-influencer/?sck=fb|cam2|g1|ad10',
              'Image Hash': '864904627876681:e48c883d825a6909760c1a3236eb9e0e'
            }
          ]
        })
      })
      
      if (templateResponse.ok) {
        alert('Template base criado com sucesso! Agora você pode testar a clonagem na seção Campanhas.')
        fetchTemplates()
      } else {
        const error = await templateResponse.text()
        console.error('Erro na resposta:', error)
        alert('Erro ao criar template base')
      }
    } catch (error) {
      console.error('Erro ao criar template base:', error)
      alert('Erro ao criar template base: ' + (error as Error).message)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Templates de Campanha
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie seus templates de campanha para clonagem rápida
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Template</span>
              </button>
              
              <button
                onClick={handleCreateBaseTemplate}
                className="btn-secondary flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Criar Template Base</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
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
        </main>
      </div>

      {/* Upload Modal */}
      <CSVUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
} 