'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Check,
  X,
  AlertCircle,
  Eye,
  Target
} from 'lucide-react'
import { MetaAccount } from '@/lib/types'
import { MetricConfig } from '@/lib/metrics-config'
import MetricsColumn from './MetricsColumn'
import toast from 'react-hot-toast'

interface AccountsTableProps {
  accounts: MetaAccount[]
  metrics?: MetricConfig[]
  showMetrics?: boolean
}

export default function AccountsTable({
  accounts,
  metrics = [],
  showMetrics = false
}: AccountsTableProps) {
  
  // Debug: verificar métricas recebidas
  console.log('📊 AccountsTable - Métricas recebidas:', metrics.filter(m => m.visible).map(m => m.label))
  console.log('📊 AccountsTable - showMetrics:', showMetrics)

  // Funções de formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta encontrada</h3>
          <p className="text-gray-500">Não há dados de contas disponíveis para o período selecionado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Cabeçalho da tabela */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Contas</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {showMetrics && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{metrics.filter(m => m.visible).length} métricas visíveis</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de dados */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Colunas fixas */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Conta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Gasto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Impressões
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Cliques
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Alcance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Frequência
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                CPC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                CTR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                CPM
              </th>
              
              {/* Colunas dinâmicas de métricas */}
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account, index) => (
              <motion.tr
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                {/* Nome da conta */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 max-w-[240px]">
                      <div className="text-sm font-medium text-gray-900 truncate" title={account.name}>
                        {account.name}
                      </div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        ID: {account.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Gasto */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(account.spend)}
                    </span>
                    {account.spend > 0 && (
                      <span className="text-xs text-gray-500">
                        {account.account_currency}
                      </span>
                    )}
                  </div>
                </td>

                {/* Impressões */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatNumber(account.impressions)}
                  </div>
                </td>

                {/* Cliques */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatNumber(account.clicks)}
                  </div>
                </td>

                {/* Alcance */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatNumber(account.reach)}
                  </div>
                </td>

                {/* Frequência */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {account.frequency.toFixed(2)}
                  </span>
                </td>

                {/* CPC */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(account.cpc)}
                  </span>
                </td>

                {/* CTR */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPercentage(account.ctr)}
                  </span>
                </td>

                {/* CPM */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(account.cpm)}
                  </span>
                </td>

                {/* Colunas dinâmicas de métricas */}
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  return (
                    <td key={metric.id} className="px-6 py-4 whitespace-nowrap">
                      <MetricsColumn 
                        data={account}
                        metrics={metrics}
                        visibleMetrics={[metric.id]}
                      />
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé com resumo */}
      {accounts.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Total de Contas</div>
              <div className="font-semibold text-gray-900">{accounts.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Gasto Total</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(accounts.reduce((sum, account) => sum + account.spend, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Impressões Total</div>
              <div className="font-semibold text-gray-900">
                {formatNumber(accounts.reduce((sum, account) => sum + account.impressions, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Cliques Total</div>
              <div className="font-semibold text-gray-900">
                {formatNumber(accounts.reduce((sum, account) => sum + account.clicks, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Alcance Total</div>
              <div className="font-semibold text-gray-900">
                {formatNumber(accounts.reduce((sum, account) => sum + account.reach, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">CPC Médio</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(
                  accounts.reduce((sum, account) => sum + account.cpc, 0) / accounts.length
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
