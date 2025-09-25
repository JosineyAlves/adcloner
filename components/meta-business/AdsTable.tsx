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
import toast from 'react-hot-toast'

interface AdsTableProps {
  ads: MetaAd[]
  selectedAds: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (id: string, currentStatus: string) => void
  onBulkStatusUpdate: (status: string) => void
}

export default function AdsTable({
  ads,
  selectedAds,
  onSelectionChange,
  onStatusToggle,
  onBulkStatusUpdate
}: AdsTableProps) {
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

  const handleStatusToggle = (adId: string, currentStatus: string) => {
    onStatusToggle(adId, currentStatus)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Play className="w-4 h-4 text-green-600" />
      case 'PAUSED':
        return <Pause className="w-4 h-4 text-yellow-600" />
      case 'ARCHIVED':
        return <Archive className="w-4 h-4 text-gray-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getEffectiveStatusColor = (effectiveStatus: string) => {
    switch (effectiveStatus) {
      case 'ACTIVE':
        return 'text-green-600'
      case 'PAUSED':
        return 'text-yellow-600'
      case 'ARCHIVED':
        return 'text-gray-600'
      case 'CAMPAIGN_PAUSED':
        return 'text-orange-600'
      case 'CAMPAIGN_ARCHIVED':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
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
      <div className="text-center py-12">
        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhum anúncio encontrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Não há anúncios disponíveis para o período selecionado.
        </p>
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
                onClick={() => onBulkStatusUpdate('ACTIVE')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Ativar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('PAUSED')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('ARCHIVED')}
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
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Conjunto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Criativo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gasto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Impressões
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cliques
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CPC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CTR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
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
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                      {getStatusIcon(ad.status)}
                      <span className="ml-1">{ad.status}</span>
                    </span>
                    {ad.status !== ad.effective_status && (
                      <span className={`text-xs ${getEffectiveStatusColor(ad.effective_status)}`} title="Status efetivo">
                        ({ad.effective_status})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {ad.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {ad.account_name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {ad.adset_name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <img
                        src={getCreativeThumbnail(ad.creative)}
                        alt="Creative thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://via.placeholder.com/60x60/6B7280/FFFFFF?text=?'
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ad.creative.name}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        {getCreativeIcon(ad.creative)}
                        <span className="capitalize">{getCreativeType(ad.creative)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(ad.spend)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatNumber(ad.impressions)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatNumber(ad.clicks)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(ad.cpc)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatPercentage(ad.ctr)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusToggle(ad.id, ad.status)}
                      className={`p-1 rounded ${
                        ad.status === 'ACTIVE' 
                          ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900' 
                          : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                      }`}
                      title={ad.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                    >
                      {ad.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
