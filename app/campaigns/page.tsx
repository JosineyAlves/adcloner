'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, BarChart3, Calendar, DollarSign } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { Campaign, CampaignClone } from '@/lib/types'
import { formatDate, getStatusColor, getStatusIcon } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [clones, setClones] = useState<CampaignClone[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchCampaigns()
    fetchClones()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else if (response.status === 401) {
        window.location.href = '/login'
        return
      } else {
        console.error('Failed to fetch campaigns')
        toast.error('Erro ao carregar campanhas')
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Erro ao carregar campanhas')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClones = async () => {
    try {
      const response = await fetch('/api/campaigns/clones', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setClones(data.clones || [])
      } else {
        console.error('Failed to fetch clones')
      }
    } catch (error) {
      console.error('Error fetching clones:', error)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando campanhas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Campanhas
            </h1>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nova Campanha</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar campanhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="paused">Pausadas</option>
                <option value="draft">Rascunhos</option>
              </select>
            </div>

            {/* Campaigns Grid */}
            {filteredCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {campaign.objective}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Orçamento:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${campaign.budget.amount} {campaign.budget.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Início:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(campaign.scheduling.startDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button className="btn-secondary text-sm py-2 px-4">
                        Ver Detalhes
                      </button>
                      <button className="btn-primary text-sm py-2 px-4">
                        Clonar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Nenhuma campanha encontrada' 
                    : 'Nenhuma campanha criada'
                  }
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Tente ajustar sua busca ou filtros.' 
                    : 'Crie sua primeira campanha para começar.'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button className="btn-primary">
                    Criar Primeira Campanha
                  </button>
                )}
              </motion.div>
            )}

            {/* Recent Cloning Activity */}
            {clones.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Atividade de Clonagem
                </h2>
                <div className="card p-6">
                  <div className="space-y-4">
                    {clones.slice(0, 5).map((clone, index) => (
                      <motion.div
                        key={clone.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(clone.status)}`}>
                            {getStatusIcon(clone.status)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Clonagem para {clone.accountName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(clone.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(clone.status)}`}>
                            {clone.status}
                          </div>
                          {clone.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {clone.error}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
} 