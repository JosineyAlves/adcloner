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
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Anúncio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Orçamento
                </th>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                  <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {metric.label}
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
      {/* Ações em lote */}
      {selectedAds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedAds.size} anúncio(s) selecionado(s)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBulkStatusUpdate('ads', 'ACTIVE')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Ativar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('ads', 'PAUSED')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('ads', 'ARCHIVED')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Archive className="w-4 h-4" />
                <span>Arquivar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAds.size === ads.length && ads.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Anúncio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Orçamento
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedAds.has(ad.id)}
                    onChange={() => handleSelectAd(ad.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <StatusToggle
                    id={ad.id}
                    status={ad.status}
                    effectiveStatus={ad.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={ad.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {ad.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {ad.daily_budget ? formatCurrency(ad.daily_budget) : ad.lifetime_budget ? formatCurrency(ad.lifetime_budget) : '-'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {ad.budget_type === 'daily' ? 'Diário' : 'Vida útil'}
                  </div>
                </td>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (ad as any)[metric.id]
                  const formattedValue = formatMetricValue(value, metric.type)
                  return (
                    <td key={metric.id} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
