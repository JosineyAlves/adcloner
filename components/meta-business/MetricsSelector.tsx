'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { ALL_METRICS } from '@/lib/metrics-config'
import ColumnsCustomizationModal from './ColumnsCustomizationModal'

interface MetaBusinessMetricsSelectorProps {
  // Componente controlado: a lista de métricas selecionadas (ordenada) e o que fazer quando o
  // usuário salvar uma nova seleção vêm do componente pai (app/meta-business/page.tsx), que é a
  // única fonte de verdade para essa seleção (persistida via hooks/useColumnPreferences.ts).
  // Antes esse componente tinha seu próprio estado (via hooks/useSelectedMetrics.ts, que salvava
  // e lia do localStorage em useEffects na ordem errada), desconectado do estado real que
  // controlava o que era buscado/renderizado na página — o que fazia a seleção salva parecer
  // "perdida" ao recarregar a página.
  selectedMetricIds: string[]
  onSave: (metricIds: string[]) => void
}

export default function MetaBusinessMetricsSelector({
  selectedMetricIds,
  onSave
}: MetaBusinessMetricsSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleSave = (metricIds: string[]) => {
    onSave(metricIds)
    closeModal()
  }

  return (
    <>
      <button
        onClick={openModal}
        title="Personalizar Colunas"
        aria-label="Personalizar Colunas"
        className="flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-ds-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
      >
        <Settings className="w-4 h-4" />
      </button>

      <ColumnsCustomizationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedMetrics={selectedMetricIds}
        onSave={handleSave}
        availableMetrics={ALL_METRICS}
      />
    </>
  )
}
