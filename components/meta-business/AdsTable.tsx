'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Archive, 
  Image as ImageIcon,
  Video,
  Settings, 
  Check, 
  X,
  AlertCircle,
  Eye
} from 'lucide-react'
import { MetaAd } from '@/lib/types'
import { MetricConfig } from '@/lib/metrics-config'
import StatusToggle from './StatusToggle'
import MetricsColumn from './MetricsColumn'
import toast from 'react-hot-toast'

interface AdsTableProps {
  ads: MetaAd[]
  selectedAds: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => void
  onBulkStatusUpdate: (type: 'campaigns' | 'adsets' | 'ads', status: string) => void
  metrics?: MetricConfig[]
  showMetrics?: boolean
}

export default function AdsTable({
  ads,
  selectedAds,
  onSelectionChange,
  onStatusToggle,
  onBulkStatusUpdate,
  metrics = [],
  showMetrics = false
}: AdsTableProps) {
  
  // Debug: verificar métricas recebidas
  console.log('📊 AdsTable - Métricas recebidas:', metrics.filter(m => m.visible).map(m => m.label))
  console.log('📊 AdsTable - showMetrics:', showMetrics)

  // Funções de formatação
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

  // Linha de totais no rodapé — mesmo padrão de CampaignsTable.tsx. Anúncios não têm orçamento
  // próprio (é definido no conjunto), então essa coluna fica "-" no total.
  const visibleMetrics = metrics.filter(m => m.visible)
  const metricTotals = visibleMetrics.map((metric) => {
    const values = ads
      .map((a) => (a as any)[metric.id])
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !isNaN(v))
    if (values.length === 0) return null
    const sum = values.reduce((s, v) => s + v, 0)
    return metric.type === 'percentage' ? sum / values.length : sum
  })

  const handleSelectAll = () => {
    if (selectedAds.size === ads.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(ads.map(a => a.id)))
    }
  }

  const handleSelectAd = (adId: string) => {
    const newSelection = new Set(selectedAds)
    if (newSelection.has(adId)) {
      newSelection.delete(adId)
    } else {
      newSelection.add(adId)
    }
    onSelectionChange(newSelection)
  }

  const handleStatusToggle = async (adId: string, currentStatus: string) => {
    await onStatusToggle('ads', adId, currentStatus)
  }

  const getCreativeType = (creative: MetaAd['creative']) => {
    if (creative.object_story_spec?.link_data?.video_id) {
      return 'video'
    }
    if (creative.object_story_spec?.link_data?.image_hash) {
      return 'image'
    }
    return 'unknown'
  }

  const getCreativeIcon = (creative: MetaAd['creative']) => {
    const type = getCreativeType(creative)
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-600" />
      case 'image':
        return <ImageIcon className="w-4 h-4 text-green-600" />
      default:
        return <Eye className="w-4 h-4 text-gray-400" />
    }
  }

  const getCreativeThumbnail = (creative: MetaAd['creative']) => {
    if (creative.thumbnail_url) {
      return creative.thumbnail_url
    }
    
    // Fallback para imagem padrão baseada no tipo
    const type = getCreativeType(creative)
    if (type === 'video') {
      return 'https://via.placeholder.com/60x60/3B82F6/FFFFFF?text=V'
    }
    if (type === 'image') {
      return 'https://via.placeholder.com/60x60/10B981/FFFFFF?text=I'
    }
    
    return 'https://via.placeholder.com/60x60/6B7280/FFFFFF?text=?'
  }

  if (ads.length === 0) {
    return (
      <div className="space-y-4">
        {/* Cabeçalho da tabela mesmo sem dados */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="sticky will-change-transform left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                <th className="sticky will-change-transform left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="sticky will-change-transform left-[144px] z-20 w-[240px] bg-gray-50 dark:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.4)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.4)] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Anúncio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Orçamento
                </th>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                  <th key={metric.id} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-normal max-w-[190px] leading-tight align-bottom">
                    <span className="line-clamp-2" title={metric.label}>{metric.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              <tr>
                <td colSpan={4 + (showMetrics ? metrics.filter(m => m.visible).length : 0)} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Eye className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhum anúncio encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Não há anúncios disponíveis para o período selecionado.
                    </p>
                  </div>
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

      {/* Tabela — altura limitada com rolagem própria (max-h + overflow-y-auto) para que a linha
          de totais no rodapé possa ficar fixa (sticky) enquanto as linhas passam por baixo dela. */}
      <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="sticky will-change-transform left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAds.size === ads.length && ads.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th className="sticky will-change-transform left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="sticky will-change-transform left-[144px] z-20 w-[240px] bg-gray-50 dark:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.4)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.4)] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Anúncio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Orçamento
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th key={metric.id} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-normal max-w-[190px] leading-tight align-bottom">
                  <span className="line-clamp-2" title={metric.label}>{metric.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {ads.map((ad) => (
              <tr key={ad.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="sticky will-change-transform left-0 z-10 w-12 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedAds.has(ad.id)}
                    onChange={() => handleSelectAd(ad.id)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </td>
                <td className="sticky will-change-transform left-12 z-10 w-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-4">
                  <StatusToggle
                    id={ad.id}
                    status={ad.status}
                    effectiveStatus={ad.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={ad.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="sticky will-change-transform left-[144px] z-10 w-[240px] bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={ad.name}>
                    {ad.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    -
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Definido no conjunto
                  </div>
                </td>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (ad as any)[metric.id]
                  const formattedValue = formatMetricValue(value, metric.type, metric.id)
                  return (
                    <td key={metric.id} className="px-4 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky will-change-transform left-0 bottom-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3"></td>
              <td className="sticky will-change-transform left-12 bottom-0 z-20 w-24 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3"></td>
              <td className="sticky will-change-transform left-[144px] bottom-0 z-20 w-[240px] bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                {ads.length} {ads.length === 1 ? 'ANÚNCIO' : 'ANÚNCIOS'}
              </td>
              <td className="sticky bottom-0 z-10 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">-</td>
              {showMetrics && visibleMetrics.map((metric, index) => (
                <td key={metric.id} className="sticky bottom-0 z-10 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
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
