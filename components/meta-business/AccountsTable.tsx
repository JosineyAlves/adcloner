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
interface RatioMetricConfig {
  numerator: string
  denominator: string
  multiplier?: number
}

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
  // Selo sólido (sem dot, sem borda) — pill compacta com preenchimento suave, conforme
  // referência visual pedida pelo usuário: verde-menta para "Ativa", cinza neutro para
  // "Restrita". Mantido como texto estático (não clicável), já que o status da conta perante a
  // Meta não é algo que o usuário liga/desliga por aqui.
  const getAccountStatusBadge = (accountStatus: number | null | undefined) => {
    if (accountStatus === null || accountStatus === undefined) {
      return (
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          -
        </span>
      )
    }
    const isActive = accountStatus === 1
    return (
      <span
        className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
          isActive
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {isActive ? 'Ativa' : 'Restrita'}
      </span>
    )
  }

  // Linha de totais no rodapé — mesmo cálculo usado em CampaignsTable/AdSetsTable/AdsTable:
  // soma para colunas 'number'/'currency', média simples para 'percentage'.
  const visibleMetrics = metrics.filter(m => m.visible)
  // Metricas de razao (custo-por-X, CTR-familia, ROAS, frequencia): somar ou fazer media simples
  // das linhas esta matematicamente errado - ex.: CPM do total NAO e a soma dos CPMs de cada
  // linha. O correto, e o que o proprio Gerenciador de Anuncios da Meta faz na linha de totais, e
  // recalcular a razao a partir dos totais reais de numerador/denominador das linhas visiveis
  // (ex.: total gasto / total de impressoes * 1000 para CPM). `multiplier` cobre os casos que nao
  // sao uma razao direta (CPM x1000, CTRs em % x100).
  const RATIO_METRICS: Record<string, RatioMetricConfig> = {
    cpc: { numerator: 'spend', denominator: 'clicks' },
    cost_per_inline_link_click: { numerator: 'spend', denominator: 'inline_link_clicks' },
    cpm: { numerator: 'spend', denominator: 'impressions', multiplier: 1000 },
    cost_per_conversion: { numerator: 'spend', denominator: 'conversions' },
    cost_per_initiate_checkout: { numerator: 'spend', denominator: 'initiate_checkout' },
    cost_per_landing_page_view: { numerator: 'spend', denominator: 'landing_page_view' },
    purchase_roas: { numerator: 'conversion_values', denominator: 'spend' },
    frequency: { numerator: 'impressions', denominator: 'reach' },
    ctr: { numerator: 'clicks', denominator: 'impressions', multiplier: 100 },
    unique_ctr: { numerator: 'unique_clicks', denominator: 'reach', multiplier: 100 },
    inline_link_click_ctr: { numerator: 'inline_link_clicks', denominator: 'impressions', multiplier: 100 },
    unique_inline_link_click_ctr: { numerator: 'unique_inline_link_clicks', denominator: 'reach', multiplier: 100 }
  }

  const metricTotals = visibleMetrics.map((metric) => {
    const ratio = RATIO_METRICS[metric.id]
    if (ratio) {
      let totalNumerator = 0
      let totalDenominator = 0
      let hasData = false
      for (const row of accounts) {
        const num = (row as any)[ratio.numerator]
        const den = (row as any)[ratio.denominator]
        if (typeof num === 'number' && !isNaN(num)) {
          totalNumerator += num
          hasData = true
        }
        if (typeof den === 'number' && !isNaN(den)) totalDenominator += den
      }
      if (!hasData || totalDenominator === 0) return null
      return (totalNumerator / totalDenominator) * (ratio.multiplier ?? 1)
    }

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
          <table className="min-w-full">
            <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                  Conta
                </th>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                  <th key={metric.id} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-normal min-w-[130px] max-w-[220px] leading-tight align-bottom">
                    <span title={metric.label} className="block line-clamp-2">{metric.label}</span>
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
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Área de rolagem única (horizontal + vertical) — a tentativa de separar isso em dois
          contêineres não resolveu o leve efeito visual de "colunas se empurrando" no scroll
          lateral (é um comportamento residual do próprio navegador ao combinar cabeçalho fixo +
          colunas fixas, sem impacto funcional), então voltamos à versão mais simples: flex-1
          min-h-0 continua fazendo a tabela ocupar exatamente a primeira dobra disponível. */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <table className="min-w-full">
          <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* Status/Conta ficam fixos (sticky left) durante a rolagem horizontal pelas colunas
                  de métrica — mesmo padrão de CampaignsTable/AdSetsTable/AdsTable. Sem
                  will-change-transform: essa dica de composição promovia cada coluna sticky pra
                  sua própria camada de GPU, e como o navegador atualiza cada camada de forma um
                  pouco independente a cada frame, dava pra perceber Status/Conta desalinhando 1-2px
                  durante o scroll, corrigindo sozinho ao parar. */}
              <th className="sticky left-0 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                Status
              </th>
              <th className="sticky left-24 z-20 w-[240px] bg-gray-50 dark:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.4)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.4)] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                Conta
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th key={metric.id} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-normal min-w-[130px] max-w-[220px] leading-tight align-bottom">
                  <span title={metric.label} className="block line-clamp-2">{metric.label}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {/* Só opacity — sem "y" (vira transform: translateY(...) que fica como estilo
                inline mesmo após a animação, e um transform no <tr> ancestral das próprias
                células sticky da linha pode interferir no posicionamento delas durante o scroll
                lateral). */}
            {accounts.map((account, index) => (
              <motion.tr
                key={account.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="sticky left-0 z-10 w-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-3">
                  {getAccountStatusBadge(account.account_status)}
                </td>
                <td className="sticky left-24 z-10 w-[240px] bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={account.name}>
                    {account.name}
                  </div>
                </td>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (account as any)[metric.id]
                  const formattedValue = formatMetricValue(value, metric.type, metric.id)
                  return (
                    <td key={metric.id} className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {formattedValue}
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 bottom-0 z-20 w-24 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3"></td>
              <td className="sticky left-24 bottom-0 z-20 w-[240px] bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                {accounts.length} {accounts.length === 1 ? 'CONTA' : 'CONTAS'}
              </td>
              {showMetrics && visibleMetrics.map((metric, index) => (
                <td key={metric.id} className="sticky bottom-0 z-10 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
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
