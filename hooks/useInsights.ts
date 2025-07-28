import { useState, useEffect } from 'react'

interface Insight {
  impressions?: string
  clicks?: string
  spend?: string
  conversions?: string
  cpm?: string
  cpc?: string
  reach?: string
  frequency?: string
  campaign_id?: string
  campaign_name?: string
  adset_id?: string
  adset_name?: string
  ad_id?: string
  ad_name?: string
}

interface UseInsightsProps {
  accountId?: string
  campaignId?: string
  datePreset?: string
  level?: string
  breakdowns?: string[]
}

export function useInsights({
  accountId,
  campaignId,
  datePreset = 'last_7d',
  level = 'campaign',
  breakdowns = []
}: UseInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [breakdownInsights, setBreakdownInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    if (!accountId && !campaignId) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (accountId) params.append('accountId', accountId)
      if (campaignId) params.append('campaignId', campaignId)
      
      params.append('datePreset', datePreset)
      params.append('level', level)
      
      if (breakdowns.length > 0) {
        params.append('breakdowns', breakdowns.join(','))
      }

      const response = await fetch(`/api/insights?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      
      setInsights(data.insights || [])
      setBreakdownInsights(data.breakdowns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar insights')
      console.error('Error fetching insights:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [accountId, campaignId, datePreset, level, breakdowns.join(',')])

  const aggregatedMetrics = insights.reduce((acc, insight) => {
    return {
      impressions: (acc.impressions || 0) + (parseInt(insight.impressions || '0') || 0),
      clicks: (acc.clicks || 0) + (parseInt(insight.clicks || '0') || 0),
      spend: (acc.spend || 0) + (parseFloat(insight.spend || '0') || 0),
      reach: (acc.reach || 0) + (parseInt(insight.reach || '0') || 0),
      conversions: (acc.conversions || 0) + (parseInt(insight.conversions || '0') || 0)
    }
  }, {} as any)

  const derivedMetrics = {
    cpm: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.spend / aggregatedMetrics.impressions) * 1000 : 0,
    cpc: aggregatedMetrics.clicks > 0 ? aggregatedMetrics.spend / aggregatedMetrics.clicks : 0,
    ctr: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100 : 0
  }

  return {
    insights,
    breakdownInsights,
    aggregatedMetrics,
    derivedMetrics,
    isLoading,
    error,
    refetch: fetchInsights
  }
} 