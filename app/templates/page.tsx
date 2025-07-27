'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Copy, Star, Users, Calendar, BarChart3, DollarSign } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { Template } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else if (response.status === 401) {
        window.location.href = '/login'
        return
      } else {
        console.error('Failed to fetch templates')
        toast.error('Erro ao carregar templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'public' && template.isPublic) ||
                         (filterType === 'private' && !template.isPublic)
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Copy className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando templates...</p>
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
              Templates
            </h1>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Template</span>
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
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Todos os tipos</option>
                <option value="public">Públicos</option>
                <option value="private">Privados</option>
              </select>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          {template.isPublic && (
                            <Star className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.isPublic 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {template.isPublic ? 'Público' : 'Privado'}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Objetivo:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {template.campaign.objective}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Orçamento:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${template.campaign.budget.amount} {template.campaign.budget.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Criado:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(template.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button className="btn-secondary text-sm py-2 px-4">
                        Ver Detalhes
                      </button>
                      <button className="btn-primary text-sm py-2 px-4">
                        Usar Template
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
                <Copy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterType !== 'all' 
                    ? 'Nenhum template encontrado' 
                    : 'Nenhum template criado'
                  }
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Tente ajustar sua busca ou filtros.' 
                    : 'Crie seu primeiro template para reutilizar campanhas.'
                  }
                </p>
                {!searchTerm && filterType === 'all' && (
                  <button className="btn-primary">
                    Criar Primeiro Template
                  </button>
                )}
              </motion.div>
            )}

            {/* Popular Templates Section */}
            {templates.filter(t => t.isPublic).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Templates Populares
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates
                    .filter(t => t.isPublic)
                    .slice(0, 3)
                    .map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="card p-6 border-2 border-primary-200 dark:border-primary-800"
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                            Popular
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {template.description}
                        </p>
                        <button className="w-full btn-primary text-sm py-2">
                          Usar Template
                        </button>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
} 