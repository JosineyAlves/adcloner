'use client'

import { Settings } from 'lucide-react'
import { useSelectedMetrics } from '@/hooks/useSelectedMetrics'
import { ALL_METRICS } from '@/lib/metrics-config'
import ColumnsCustomizationModal from './ColumnsCustomizationModal'

interface MetaBusinessMetricsSelectorProps {
  onMetricsChange: (metrics: string[]) => void
}

export default function MetaBusinessMetricsSelector({
  onMetricsChange
}: MetaBusinessMetricsSelectorProps) {
  const {
    selectedMetrics,
    isModalOpen,
    openModal,
    closeModal,
    saveMetrics
  } = useSelectedMetrics()

  const handleSave = (metrics: string[]) => {
    saveMetrics(metrics)
    onMetricsChange(metrics)
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <Settings className="w-4 h-4" />
        Colunas
      </button>

      <ColumnsCustomizationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedMetrics={selectedMetrics}
        onSave={handleSave}
        availableMetrics={ALL_METRICS}
      />
    </>
  )
}