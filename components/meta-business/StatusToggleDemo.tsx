'use client'

import { useState } from 'react'
import StatusToggle from './StatusToggle'

export default function StatusToggleDemo() {
  const [campaigns, setCampaigns] = useState([
    { id: '1', name: 'Campanha Ativa', status: 'ACTIVE' as const, effectiveStatus: 'ACTIVE' as const },
    { id: '2', name: 'Campanha Pausada', status: 'PAUSED' as const, effectiveStatus: 'PAUSED' as const },
    { id: '3', name: 'Campanha Pausada por Herança', status: 'ACTIVE' as const, effectiveStatus: 'CAMPAIGN_PAUSED' as const },
    { id: '4', name: 'Campanha Arquivada', status: 'ARCHIVED' as const, effectiveStatus: 'ARCHIVED' as const },
  ])

  const handleToggle = async (id: string, currentStatus: string) => {
    console.log(`Toggling campaign ${id} from ${currentStatus}`)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Atualizar status
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === id 
        ? { 
            ...campaign, 
            status: campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
            effectiveStatus: campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
          }
        : campaign
    ))
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Status Toggle Demo
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {campaign.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status: {campaign.status} | Efetivo: {campaign.effectiveStatus}
                </p>
              </div>
              <StatusToggle
                id={campaign.id}
                status={campaign.status}
                effectiveStatus={campaign.effectiveStatus}
                onToggle={handleToggle}
                disabled={campaign.status === 'ARCHIVED'}
                size="md"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          Características do StatusToggle
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Verde:</strong> Status ativo (ACTIVE)</li>
          <li>• <strong>Cinza:</strong> Status pausado (PAUSED)</li>
          <li>• <strong>Laranja:</strong> Pausado por herança (CAMPAIGN_PAUSED)</li>
          <li>• <strong>Desabilitado:</strong> Itens arquivados (ARCHIVED)</li>
          <li>• <strong>Loading:</strong> Animação durante atualização</li>
          <li>• <strong>Tooltip:</strong> Informações sobre o status</li>
          <li>• <strong>Acessibilidade:</strong> Suporte a screen readers</li>
        </ul>
      </div>
    </div>
  )
}
