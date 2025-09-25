'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, FolderPlus } from 'lucide-react'
import { MetaCampaign } from '@/lib/types'

interface CampaignSelectorProps {
  campaigns: MetaCampaign[]
  selectedCampaignIds: string[]
  onSelectionChange: (campaignIds: string[]) => void
  onClear: () => void
}

export default function CampaignSelector({
  campaigns,
  selectedCampaignIds,
  onSelectionChange,
  onClear
}: CampaignSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCampaignToggle = (campaignId: string) => {
    const newSelection = selectedCampaignIds.includes(campaignId)
      ? selectedCampaignIds.filter(id => id !== campaignId)
      : [...selectedCampaignIds, campaignId]
    
    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    onSelectionChange(filteredCampaigns.map(c => c.id))
  }

  const handleClearAll = () => {
    onSelectionChange([])
  }

  const selectedCampaigns = campaigns.filter(c => selectedCampaignIds.includes(c.id))

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do seletor */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <FolderPlus className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-700">Campanhas</span>
        {selectedCampaignIds.length > 0 && (
          <div className="flex items-center space-x-1">
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              {selectedCampaignIds.length} item{selectedCampaignIds.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              className="text-white hover:text-gray-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header com busca e ações */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Selecionar todas
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Limpar
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {filteredCampaigns.length} campanha{filteredCampaigns.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Lista de campanhas */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCampaigns.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhuma campanha encontrada
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <label
                  key={campaign.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCampaignIds.includes(campaign.id)}
                    onChange={() => handleCampaignToggle(campaign.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {campaign.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {campaign.status === 'ACTIVE' ? 'Ativa' : 
                       campaign.status === 'PAUSED' ? 'Pausada' : 'Arquivada'}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
