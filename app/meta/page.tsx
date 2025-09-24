'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, DollarSign, MousePointer, Target, TrendingUp, BarChart3, RefreshCw, Settings, Repeat, Percent, Link, Heart, Pause, Play, DollarSign as DollarIcon } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import { FacebookAccount } from '@/lib/types'
import toast from 'react-hot-toast'

type TabType = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios'

interface Campaign {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: number
  lifetime_budget?: number
  created_time: string
  updated_time: string
}

interface AdSet {
  id: string
  name: string
  status: string
  campaign_id: string
  daily_budget?: number
  lifetime_budget?: number
  optimization_goal: string
  created_time: string
  updated_time: string
}

interface Ad {
  id: string
  name: string
  status: string
  adset_id: string
  campaign_id: string
  created_time: string
  updated_time: string
}

export default function MetaPage() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [adsets, setAdsets] = useState<AdSet[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('contas')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [datePreset, setDatePreset] = useState<string>('today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [selectedAccount, setSelectedAccount] = useState<string>('')

  const tabs = [
    { id: 'contas', label: 'Contas', icon: BarChart3 },
    { id: 'campanhas', label: 'Campanhas', icon: Target },
    { id: 'conjuntos', label: 'Conjuntos', icon: TrendingUp },
    { id: 'anuncios', label: 'Anúncios', icon: MousePointer }
  ]

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id)
    }
  }, [accounts])

  useEffect(() => {
    if (selectedAccount) {
      fetchData()
    }
  }, [selectedAccount, activeTab])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else if (response.status === 401) {
        window.location.href = '/login'
        return
      } else {
        console.error('Failed to fetch accounts')
        toast.error('Erro ao carregar contas do Facebook')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Erro ao carregar contas do Facebook')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchData = async () => {
    if (!selectedAccount) return

    try {
      switch (activeTab) {
        case 'campanhas':
          await fetchCampaigns()
          break
        case 'conjuntos':
          await fetchAdsets()
          break
        case 'anuncios':
          await fetchAds()
          break
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns?accountId=${selectedAccount}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else {
        console.error('Failed to fetch campaigns')
        toast.error('Erro ao carregar campanhas')
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Erro ao carregar campanhas')
    }
  }

  const fetchAdsets = async () => {
    try {
      const response = await fetch(`/api/adsets?accountId=${selectedAccount}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAdsets(data.adsets || [])
      } else {
        console.error('Failed to fetch adsets')
        toast.error('Erro ao carregar conjuntos de anúncios')
      }
    } catch (error) {
      console.error('Error fetching adsets:', error)
      toast.error('Erro ao carregar conjuntos de anúncios')
    }
  }

  const fetchAds = async () => {
    try {
      const response = await fetch(`/api/ads?accountId=${selectedAccount}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAds(data.ads || [])
      } else {
        console.error('Failed to fetch ads')
        toast.error('Erro ao carregar anúncios')
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
      toast.error('Erro ao carregar anúncios')
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAccounts()
    if (selectedAccount) {
      await fetchData()
    }
    setIsRefreshing(false)
    toast.success('Dados atualizados!')
  }

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      setCustomRange(undefined)
    }
  }

  const handleCustomRangeChange = (range: DateRange) => {
    setCustomRange(range)
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleStatusChange = async (type: 'campaign' | 'adset' | 'ad', id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    const endpoint = type === 'campaign' ? 'campaigns' : type === 'adset' ? 'adsets' : 'ads'
    
    try {
      const response = await fetch(`/api/${endpoint}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${newStatus === 'ACTIVE' ? 'Ativado' : 'Pausado'} com sucesso!`)
        await fetchData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleBudgetChange = async (type: 'campaign' | 'adset', id: string, currentBudget: number, budgetType: 'daily_budget' | 'lifetime_budget') => {
    const newBudget = prompt(`Digite o novo ${budgetType === 'daily_budget' ? 'orçamento diário' : 'orçamento total'} (R$):`, currentBudget.toString())
    
    if (!newBudget || isNaN(parseFloat(newBudget))) {
      toast.error('Valor inválido')
      return
    }

    const budgetValue = parseFloat(newBudget)
    const endpoint = type === 'campaign' ? 'campaigns' : 'adsets'
    
    try {
      const response = await fetch(`/api/${endpoint}/${id}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          budget: budgetValue,
          budgetType: budgetType
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Orçamento atualizado com sucesso!')
        await fetchData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao atualizar orçamento')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error('Erro ao atualizar orçamento')
    }
  }

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100'
      case 'PAUSED':
        return 'text-yellow-600 bg-yellow-100'
      case 'DELETED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando Meta Manager...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Meta Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerenciamento avançado de campanhas do Facebook
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {activeTab === 'contas' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contas Integradas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{account.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {account.id}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'campanhas' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Campanhas ({campaigns.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Objetivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orçamento Diário</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criada</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {campaign.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {campaign.objective}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {campaign.daily_budget ? formatCurrency(campaign.daily_budget) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(campaign.created_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleStatusChange('campaign', campaign.id, campaign.status)}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                campaign.status === 'ACTIVE'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {campaign.status === 'ACTIVE' ? (
                                <>
                                  <Pause className="w-3 h-3 mr-1" />
                                  Pausar
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 mr-1" />
                                  Ativar
                                </>
                              )}
                            </button>
                            {campaign.daily_budget && (
                              <button
                                onClick={() => handleBudgetChange('campaign', campaign.id, campaign.daily_budget! / 100, 'daily_budget')}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                <DollarIcon className="w-3 h-3 mr-1" />
                                Orçamento
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'conjuntos' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Conjuntos de Anúncios ({adsets.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Otimização</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orçamento Diário</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {adsets.map((adset) => (
                        <tr key={adset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {adset.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(adset.status)}`}>
                              {adset.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {adset.optimization_goal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {adset.daily_budget ? formatCurrency(adset.daily_budget) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(adset.created_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleStatusChange('adset', adset.id, adset.status)}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                adset.status === 'ACTIVE'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {adset.status === 'ACTIVE' ? (
                                <>
                                  <Pause className="w-3 h-3 mr-1" />
                                  Pausar
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 mr-1" />
                                  Ativar
                                </>
                              )}
                            </button>
                            {adset.daily_budget && (
                              <button
                                onClick={() => handleBudgetChange('adset', adset.id, adset.daily_budget! / 100, 'daily_budget')}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                <DollarIcon className="w-3 h-3 mr-1" />
                                Orçamento
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'anuncios' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Anúncios ({ads.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conjunto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campanha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {ads.map((ad) => (
                        <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {ad.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                              {ad.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {ad.adset_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {ad.campaign_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(ad.created_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleStatusChange('ad', ad.id, ad.status)}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                ad.status === 'ACTIVE'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {ad.status === 'ACTIVE' ? (
                                <>
                                  <Pause className="w-3 h-3 mr-1" />
                                  Pausar
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 mr-1" />
                                  Ativar
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
