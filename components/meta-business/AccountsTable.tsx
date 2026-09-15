'use client'

import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { MetaAccount } from '@/lib/types'
import { MetricConfig } from '@/lib/metrics-config'

interface AccountsTableProps {
  accounts: MetaAccount[]
  metrics?: MetricConfig[]
  showMetrics?: boolean
}

// Segue exatamente o mesmo padrão de CampaignsTable/AdSetsTable/AdsTable: nenhuma coluna de
// métrica fixa — Gasto/Impressões/Cliques/Alcance/Frequência/CPC/CTR/CPM só aparecem se
// estiverem marcadas em "Personalizar Colunas" (metrics.filter(m => m.visible)), sem duplicar
// com uma coluna fixa embutida. Isso também elimina os ícones que só existiam neste componente
// (cabeçalho "Contas N contas", "N métricas visíveis", avatar de cada linha) e que não existem
// nas outras 3 abas.
export default function AccountsTable({
  accounts,
  metrics = [],
  showMetrics = false
}: AccountsTableProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatMetricValue = (value: any, type: 'number' | 'currency' | 'percentage', metricId?: string) => {
    if (value === null || value === undefined) return '-'

    const numValue = typeof value === 'number' ? value : parseFloat(value)

    if (isNaN(numValue)) return '-'

    // Frequência: arredonda pra 2 casas decimais (ex.: 1.185 -> "1.19"), igual ao Gerenciador de
    // Anúncios nativo — o formatNumber genérico abaixo deixava até 3 casas por padrão.
    if (metricId === 'frequency') return numValue.toFixed(2)

    switch (type) {
      case 'currency':
        return formatCurrency(numValue)
      case 'percentage':
        return formatPercentage(numValue)
      default:
        return formatNumber(numValue)
    }
  }

  // account_status vem do objeto Ad Account (não do /insights) — ver app/api/meta-business/accounts/route.ts.
  // Só 1 (ACTIVE) é considerado "Ativa"; qualquer outro valor documentado pela Meta (2=DISABLED,
  // 3=UNSETTLED, 7=PENDING_RISK_REVIEW, 8=PENDING_SETTLEMENT, 9=IN_GRACE_PERIOD,
  // 100=PENDING_CLOSURE, 101=CLOSED) é tratado como "Restrita" — mesmo critério binário já usado
  // em lib/facebook-api.ts (mapAccountStatus).
  const getAccountStatusBadge = (accountStatus: number | null | undefined) => {
    if (accountStatus === null || accountStatus === undefined) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          -
        </span>
      )
    }
    const isActive = accountStatus === 1
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
          isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        {isActive ? 'Ativa' : 'Restrita'}
      </span>
    )
  }

  // Linha de totais no rodapé — mesmo cálculo usado em CampaignsTable/AdSetsTable/AdsTable:
  // soma para colunas 'number'/'currency', média simples para 'percentage'.
  const visibleMetrics = metrics.filter(m => m.visible)
  const metricTotals = visibleMetrics.map((metric) => {
    const values = accounts
      .map((a) => (a as any)[metric.id])
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !isNaN(v))
    if (values.length === 0) return null
    const sum = values.reduce((s, v) => s + v, 0)
    return metric.type === 'percentage' ? sum / values.length : sum
  })

  if (!accounts || accounts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Conta
                </th>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                  <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {metric.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2 + (showMetrics ? metrics.filter(m => m.visible).length : 0)} className="px-6 py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhuma conta encontrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Não há dados de contas disponíveis para o período selecionado.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* Status/Conta ficam fixos (sticky left) durante a rolagem horizontal pelas colunas
                  de métrica — mesmo padrão de CampaignsTable/AdSetsTable/AdsTable. */}
              <th className="sticky left-0 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="sticky left-24 z-20 w-[240px] bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Conta
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((account, index) => (
              <motion.tr
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="sticky left-0 z-10 w-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-4">
                  {getAccountStatusBadge(account.account_status)}
                </td>
                <td className="sticky left-24 z-10 w-[240px] bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={account.name}>
                    {account.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    ID: {account.id} · {account.account_currency}
                  </div>
                </td>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (account as any)[metric.id]
                  const formattedValue = formatMetricValue(value, metric.type, metric.id)
                  return (
                    <td key={metric.id} className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {formattedValue}
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 bottom-0 z-20 w-24 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3"></td>
              <td className="sticky left-24 bottom-0 z-20 w-[240px] bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                {accounts.length} {accounts.length === 1 ? 'CONTA' : 'CONTAS'}
              </td>
              {showMetrics && visibleMetrics.map((metric, index) => (
                <td key={metric.id} className="sticky bottom-0 z-10 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  {metricTotals[index] === null ? '-' : formatMetricValue(metricTotals[index], metric.type, metric.id)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
