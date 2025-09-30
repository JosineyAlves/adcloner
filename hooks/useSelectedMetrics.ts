'use client'

import { useState, useEffect } from 'react'
import { MetricConfig, MAIN_METRICS } from '@/lib/metrics-config'

export function useSelectedMetrics(initialMetrics?: string[]) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(() => {
    if (initialMetrics) return initialMetrics
    // Usar métricas principais como padrão
    return MAIN_METRICS.map(metric => metric.id)
  })

  const [isModalOpen, setIsModalOpen] = useState(false)

  // Salvar no localStorage apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedMetrics', JSON.stringify(selectedMetrics))
    }
  }, [selectedMetrics])

  // Carregar do localStorage na inicialização apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedMetrics')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSelectedMetrics(parsed)
        } catch (error) {
          console.error('Erro ao carregar métricas salvas:', error)
        }
      }
    }
  }, [])

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const saveMetrics = (metrics: string[]) => {
    setSelectedMetrics(metrics)
  }

  const getSelectedMetricsConfig = (allMetrics: MetricConfig[]): MetricConfig[] => {
    return selectedMetrics
      .map(id => allMetrics.find(metric => metric.id === id))
      .filter(Boolean) as MetricConfig[]
  }

  return {
    selectedMetrics,
    isModalOpen,
    openModal,
    closeModal,
    saveMetrics,
    getSelectedMetricsConfig
  }
}
