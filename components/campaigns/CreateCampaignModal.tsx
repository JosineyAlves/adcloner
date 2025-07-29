import React, { useState } from 'react'
import { X, Plus, Target, DollarSign, Image, Link, Save } from 'lucide-react'

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
}

export default function CreateCampaignModal({ isOpen, onClose, accounts }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    objective: 'OUTCOME_SALES',
    dailyBudget: 1000,
    targetAccountId: '',
    bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    billingEvent: 'IMPRESSIONS',
    targeting: {
      ageMin: 18,
      ageMax: 65,
      countries: ['BR'],
      interests: [],
      gender: 'all',
      languages: []
    },
    creative: {
      title: '',
      message: '',
      imageUrl: '',
      link: '',
      callToAction: 'LEARN_MORE'
    },
    scheduling: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      timezone: 'America/Sao_Paulo'
    }
  })

  const [isLoading, setIsLoading] = useState(false)

  const objectives = [
    { value: 'OUTCOME_SALES', label: 'Conversões' },
    { value: 'LINK_CLICKS', label: 'Tráfego' },
    { value: 'REACH', label: 'Alcance' },
    { value: 'BRAND_AWARENESS', label: 'Reconhecimento da Marca' },
    { value: 'LEAD_GENERATION', label: 'Geração de Leads' },
    { value: 'VIDEO_VIEWS', label: 'Visualizações de Vídeo' },
    { value: 'APP_INSTALLS', label: 'Instalações de App' },
    { value: 'MESSAGES', label: 'Mensagens' },
    { value: 'ENGAGEMENT', label: 'Engajamento' },
    { value: 'CATALOG_SALES', label: 'Vendas do Catálogo' }
  ]

  const bidStrategies = [
    { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Menor Custo' },
    { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Menor Custo com Limite' },
    { value: 'COST_CAP', label: 'Limite de Custo' },
    { value: 'BID_CAP', label: 'Limite de Lance' }
  ]

  const billingEvents = [
    { value: 'IMPRESSIONS', label: 'Impressões' },
    { value: 'LINK_CLICKS', label: 'Cliques em Links' },
    { value: 'PURCHASE', label: 'Compras' },
    { value: 'LEAD', label: 'Leads' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onClose()
        // Recarregar campanhas
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erro ao criar campanha: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Erro ao criar campanha')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Criar Nova Campanha
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Informações Básicas
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Campanha
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Campanha de Conversões - Produto X"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objetivo
              </label>
              <select
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {objectives.map((obj) => (
                  <option key={obj.value} value={obj.value}>
                    {obj.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Orçamento Diário (R$)
              </label>
              <input
                type="number"
                value={formData.dailyBudget}
                onChange={(e) => setFormData({ ...formData, dailyBudget: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                min="100"
                step="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conta de Destino
              </label>
              <select
                value={formData.targetAccountId}
                onChange={(e) => setFormData({ ...formData, targetAccountId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.businessManagerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Público-alvo */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Público-alvo
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idade Mínima
                </label>
                <input
                  type="number"
                  value={formData.targeting.ageMin}
                  onChange={(e) => setFormData({
                    ...formData,
                    targeting: { ...formData.targeting, ageMin: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="13"
                  max="65"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idade Máxima
                </label>
                <input
                  type="number"
                  value={formData.targeting.ageMax}
                  onChange={(e) => setFormData({
                    ...formData,
                    targeting: { ...formData.targeting, ageMax: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="13"
                  max="65"
                />
              </div>
            </div>
          </div>

          {/* Criativos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Image className="w-5 h-5 mr-2" alt="Criativos" />
              Criativos
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título do Anúncio
              </label>
              <input
                type="text"
                value={formData.creative.title}
                onChange={(e) => setFormData({
                  ...formData,
                  creative: { ...formData.creative, title: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Descubra nosso produto incrível!"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensagem
              </label>
              <textarea
                value={formData.creative.message}
                onChange={(e) => setFormData({
                  ...formData,
                  creative: { ...formData.creative, message: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Ex: Confira nossos produtos e aproveite as ofertas especiais!"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de Destino
              </label>
              <div className="flex items-center">
                <Link className="w-4 h-4 mr-2 text-gray-400" />
                <input
                  type="url"
                  value={formData.creative.link}
                  onChange={(e) => setFormData({
                    ...formData,
                    creative: { ...formData.creative, link: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://seusite.com/produto"
                  required
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Campanha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 