'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Archive,
  Layers,
  Megaphone
} from 'lucide-react'
import { DEFAULT_METRIC_IDS, buildMetricsFromIds, MetricConfig } from '@/lib/metrics-config'
import { useColumnPreferences } from '@/hooks/useColumnPreferences'
import AccountsIcon from '@/components/meta-business/icons/AccountsIcon'
import CampaignsIcon from '@/components/meta-business/icons/CampaignsIcon'
import AdSetsIcon from '@/components/meta-business/icons/AdSetsIcon'
import AdsIcon from '@/components/meta-business/icons/AdsIcon'
import Sidebar from '@/components/layout/Sidebar'
import PageHeader from '@/components/layout/PageHeader'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import Select from '@/components/ui/Select'
import AccountsTable from '@/components/meta-business/AccountsTable'
import CampaignsTable from '@/components/meta-business/CampaignsTable'
import AdSetsTable from '@/components/meta-business/AdSetsTable'
import AdsTable from '@/components/meta-business/AdsTable'
import MetaBusinessMetricsSelector from '@/components/meta-business/MetricsSelector'
import { 
  MetaAccount,
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  MetaBusinessStats
} from '@/lib/types'
import { useApp } from '@/contexts/AppContext'
import { useDebounce } from '@/lib/debounce'
import {
  readLocalCache,
  writeLocalCache,
  LOCAL_CACHE_KEYS
} from '@/lib/local-storage-cache'
import toast from 'react-hot-toast'

interface MetaBusinessCachedData {
  accounts: MetaAccount[]
  campaigns: MetaCampaign[]
  adSets: MetaAdSet[]
  ads: MetaAd[]
  stats: MetaBusinessStats
  datePreset: string
  customRange?: DateRange
}

// Decide o que aplicar no estado local depois de uma busca: se essa busca foi bloqueada por
// rate limit (ver lib/meta-rate-limit.ts no servidor) E já existe algo no estado local, mantém o
// que já está na tela em vez do fallback do servidor (que pode ser mais velho que o estado atual —
// seja de uma busca anterior bem-sucedida, seja de uma atualização otimista recente feita por uma
// ação de escrita). O fallback do servidor só é aceito quando não há nada melhor localmente ainda
// (primeiro carregamento da sessão, sem cache nenhum).
function resolveFetchedItems<T>(current: T[], result: { items: T[]; rateLimitedUntil: number | null }): T[] {
  if (result.rateLimitedUntil && current.length > 0) {
    return current
  }
  return result.items
}

export default function MetaBusinessPage() {
  const { accounts: facebookAccounts, isLoading: accountsLoading, refreshAccounts } = useApp()
  // Hidratar tudo (contas/campanhas/adsets/ads/stats + filtros de data) a partir do cache local,
  // se houver, para a tela não aparecer vazia enquanto a busca real na Graph API não termina.
  const cachedMetaBusiness = useState(() =>
    readLocalCache<MetaBusinessCachedData>(LOCAL_CACHE_KEYS.metaBusinessData)
  )[0]
  // Período de data COMPARTILHADO entre esta tela e o Dashboard Financeiro (lib/local-storage-cache.ts)
  // — selecionar um período aqui também vale lá, e vice-versa, em vez de cada tela guardar o seu
  // independente. Prioridade na primeira carga: período compartilhado > cache antigo desta própria
  // tela > "Hoje" (padrão pedido pelo usuário).
  const sharedDateFilter = useState(() =>
    readLocalCache<{ datePreset: string; customRange?: DateRange }>(LOCAL_CACHE_KEYS.sharedDateFilter)
  )[0]

  const [activeTab, setActiveTab] = useState<'accounts' | 'campaigns' | 'adsets' | 'ads'>('accounts')
  const [datePreset, setDatePreset] = useState(() =>
    sharedDateFilter?.data.datePreset || cachedMetaBusiness?.data.datePreset || 'today'
  )
  const [customRange, setCustomRange] = useState<DateRange | undefined>(() =>
    sharedDateFilter?.data.datePreset ? sharedDateFilter.data.customRange : cachedMetaBusiness?.data.customRange
  )
  const [accounts, setAccounts] = useState<MetaAccount[]>(() => cachedMetaBusiness?.data.accounts || [])
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>(() => cachedMetaBusiness?.data.campaigns || [])
  const [adSets, setAdSets] = useState<MetaAdSet[]>(() => cachedMetaBusiness?.data.adSets || [])
  const [ads, setAds] = useState<MetaAd[]>(() => cachedMetaBusiness?.data.ads || [])
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  // Loading independente por aba — cada uma (Contas/Campanhas/Conjuntos/Anúncios) só busca seus
  // próprios dados na Graph API quando o usuário realmente abre aquela aba pela primeira vez,
  // nunca junto com as demais. Isso evita disparar várias chamadas de uma vez por conta (o que
  // estourava o rate limit do tier "Limited Access" da Meta) — igual ao comportamento observado
  // em ferramentas de tracking de terceiros (ex. ratoeiraads.com.br), que mostram um spinner por
  // aba enquanto buscam só o que aquela aba precisa.
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false)
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState<boolean>(false)
  const [isLoadingAdSets, setIsLoadingAdSets] = useState<boolean>(false)
  const [isLoadingAds, setIsLoadingAds] = useState<boolean>(false)
  // Quando alguma conta bate no limite de requisições da Meta, as rotas de API retornam
  // { rateLimited: true, retryAfterSeconds } (ver lib/meta-rate-limit.ts) em vez de tentar de
  // novo às cegas. Guardamos até quando devemos evitar novas chamadas — usado para desabilitar
  // o botão "Atualizar" e pausar o carregamento automático das abas enquanto isso durar, em vez
  // de deixar o usuário reforçar o próprio bloqueio clicando em Atualizar repetidamente.
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)
  // Só usado para o texto da contagem regressiva atualizar a cada segundo enquanto bloqueado.
  const [nowTick, setNowTick] = useState<number>(() => Date.now())
  // true só na primeiríssima carga real (sem nada em cache ainda) — usado para não mostrar
  // "Carregando Meta Business..." em cima de dados que já estão na tela vindos do cache.
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(!!cachedMetaBusiness)
  const [stats, setStats] = useState<MetaBusinessStats>(() => cachedMetaBusiness?.data.stats || {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    averageCpc: 0,
    averageCtr: 0,
    totalCampaigns: 0,
    totalAdSets: 0,
    totalAds: 0,
    activeCampaigns: 0,
    activeAdSets: 0,
    activeAds: 0
  })
  
  // Filtros globais (removido datePreset e customRange). Por padrão só "Ativo" fica marcado — o
  // usuário decidiu manter a busca trazendo todos os status da Meta (não vale a pena economizar
  // chamada filtrando na origem, ver discussão no doc do projeto), mas a tela deve abrir já
  // mostrando só as campanhas ativas por padrão; o usuário pode trocar pra "Qualquer" ou
  // "Pausado" a qualquer momento no filtro existente ("Arquivado" foi removido do dropdown —
  // ver seção 27 do doc do projeto).
  const [filters, setFilters] = useState({
    status: ['ACTIVE'] as string[],
    search: '',
    accountIds: [] as string[]
  })

  // Estados de seleção em massa
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set())
  const [selectedAdSets, setSelectedAdSets] = useState<Set<string>>(new Set())
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())

  // Estados para métricas avançadas — a seleção/ordem de colunas é persistida por usuário no
  // Supabase (ver hooks/useColumnPreferences.ts e lib/column-preferences.ts), com fallback para
  // o padrão "estilo Meta" (lib/metrics-config.ts -> DEFAULT_METRIC_IDS) enquanto nada foi salvo
  // ainda. `metrics` é sempre derivado de `selectedMetricIds` — única fonte de verdade — em vez
  // de manter um segundo estado independente (o que antes causava a seleção salva "sumir" ao
  // recarregar a página).
  const { metricIds: selectedMetricIds, saveMetricIds } = useColumnPreferences(
    'meta_business_metrics',
    DEFAULT_METRIC_IDS
  )
  const metrics = useMemo<MetricConfig[]>(
    () => buildMetricsFromIds(selectedMetricIds),
    [selectedMetricIds]
  )
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Refs sempre sincronizados com o estado mais recente (atualizados a cada render, antes de
  // qualquer efeito), para as funções de busca abaixo poderem montar o objeto de cache local
  // completo sem depender de closures potencialmente desatualizadas (ex.: fetchAdSets só
  // busca conjuntos, mas precisa "lembrar" das campanhas/anúncios já carregados para não
  // sobrescrever o cache local com dados vazios).
  const accountsRef = useRef(accounts)
  accountsRef.current = accounts
  const campaignsRef = useRef(campaigns)
  campaignsRef.current = campaigns
  const adSetsRef = useRef(adSets)
  adSetsRef.current = adSets
  const adsRef = useRef(ads)
  adsRef.current = ads

  // Se o período de data for alterado no Dashboard Financeiro (outra aba/janela do navegador
  // aberta na mesma sessão), o evento nativo `storage` avisa esta página em tempo real — sem
  // isso, só veríamos o novo período compartilhado ao recarregar/reabrir esta tela. `storage` só
  // dispara em OUTRAS abas (nunca na que fez a escrita), então não conflita com o próprio
  // `setDatePreset`/`setCustomRange` chamado localmente pelo handler desta página.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCAL_CACHE_KEYS.sharedDateFilter || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue) as { data: { datePreset: string; customRange?: DateRange } }
        setDatePreset(parsed.data.datePreset)
        setCustomRange(parsed.data.customRange)
      } catch (error) {
        console.warn('⚠️ Falha ao ler período de data compartilhado:', error)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Buscar dados de uma lista de contas ativas para UM endpoint específico, em paralelo entre
  // as contas (mas um endpoint por vez no total) — usado pelas 3 funções de busca abaixo.
  // Retorna também até quando devemos evitar novas chamadas, caso alguma conta tenha
  // retornado `rateLimited: true` (ver lib/meta-rate-limit.ts no servidor) — o maior tempo de
  // espera entre todas as contas consultadas nessa chamada.
  const fetchEndpointForActiveAccounts = useCallback(async <T,>(
    endpoint: 'accounts' | 'campaigns' | 'adsets' | 'ads',
    listKey: 'accounts' | 'campaigns' | 'adSets' | 'ads'
  ): Promise<{ items: T[]; rateLimitedUntil: number | null }> => {
    // Não filtra mais por account_status (status real da conta perante a Meta, ex.: "Restrita").
    // O único controle de quais contas entram aqui é o toggle habilitar/desabilitar da tela de
    // Integrações (sync_enabled) — já aplicado antes disso, no AppContext (fetchAccounts usa
    // /api/meta/accounts?enabledOnly=true). Antes, contas com status "Restrita" eram excluídas
    // daqui mesmo estando habilitadas em Integrações, causando divergência de contagem entre as
    // duas telas (ex.: 15 habilitadas em Integrações, só 7 aparecendo aqui).
    const activeAccounts = facebookAccounts
    if (activeAccounts.length === 0) return { items: [], rateLimitedUntil: null }

    const dateQuery = customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''
    // Só pede à Meta os campos das colunas que o usuário deixou visíveis no seletor de métricas
    // (ver lib/insights-fields.ts no servidor) — reduz o "peso" de cada consulta de insights.
    // A rota de accounts ignora esse parâmetro (mantida como estava); as outras três o usam.
    const visibleMetricIds = metrics.filter(m => m.visible).map(m => m.id).join(',')
    const metricsQuery = visibleMetricIds ? `&metricIds=${encodeURIComponent(visibleMetricIds)}` : ''
    let maxRetryAfterSeconds = 0

    const results = await Promise.all(
      activeAccounts.map(async (account) => {
        try {
          const response = await fetch(
            `/api/meta-business/${endpoint}?accountId=${account.id}&datePreset=${datePreset}${dateQuery}${metricsQuery}`,
            { credentials: 'include' }
          )
          // Sempre tentamos ler o corpo, mesmo em respostas não-ok (429 de rate limit vem com
          // dados "stale" quando disponíveis, ou listas vazias + o motivo do bloqueio).
          let data: any = {}
          try {
            data = await response.json()
          } catch {
            data = {}
          }

          if (data?.rateLimited) {
            maxRetryAfterSeconds = Math.max(maxRetryAfterSeconds, data.retryAfterSeconds || 60)
          }

          return (data[listKey] || []) as T[]
        } catch (error) {
          console.error(`Error fetching ${endpoint} for account ${account.id}:`, error)
          return [] as T[]
        }
      })
    )

    return {
      items: results.flat(),
      rateLimitedUntil: maxRetryAfterSeconds > 0 ? Date.now() + maxRetryAfterSeconds * 1000 : null
    }
  }, [facebookAccounts, datePreset, customRange, metrics])

  const persistCache = useCallback((overrides: Partial<MetaBusinessCachedData>) => {
    const merged: MetaBusinessCachedData = {
      accounts: accountsRef.current,
      campaigns: campaignsRef.current,
      adSets: adSetsRef.current,
      ads: adsRef.current,
      stats,
      datePreset,
      customRange,
      ...overrides
    }
    writeLocalCache<MetaBusinessCachedData>(LOCAL_CACHE_KEYS.metaBusinessData, merged)
  }, [stats, datePreset, customRange])

  // Busca SOB DEMANDA: só roda quando o usuário efetivamente abre a aba "Contas" (ou clica em
  // Atualizar estando nela). Cada aba tem sua própria busca independente agora — nenhuma delas
  // dispara sozinha ao carregar a página, e nenhuma sai "de carona" junto com outra, para nunca
  // gastar cota de rate limit de uma conta com dados que o usuário ainda nem foi olhar.
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true)
      const accountsResult = await fetchEndpointForActiveAccounts<MetaAccount>('accounts', 'accounts')
      const resolvedAccounts = resolveFetchedItems(accountsRef.current, accountsResult)
      setAccounts(resolvedAccounts)
      if (accountsResult.rateLimitedUntil) {
        setRateLimitedUntil(prev => Math.max(prev || 0, accountsResult.rateLimitedUntil!))
        toast.error('Limite de requisições da Meta atingido ao buscar contas. Aguarde antes de tentar de novo.')
      }
      const newStats = calculateStats(resolvedAccounts, campaignsRef.current, adSetsRef.current, adsRef.current)
      persistCache({ accounts: resolvedAccounts, stats: newStats })
      setHasLoadedOnce(true)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Erro ao carregar contas')
    } finally {
      setIsLoadingAccounts(false)
    }
  }, [fetchEndpointForActiveAccounts, persistCache])

  // Busca SOB DEMANDA: mesma lógica de fetchAccounts, para a aba "Campanhas". Antes essa busca
  // saía sempre junto com a de contas (mesmo useCallback); separar as duas faz cada aba consumir
  // só a sua própria fatia de rate limit, e só quando o usuário efetivamente abre aquela aba.
  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoadingCampaigns(true)
      const campaignsResult = await fetchEndpointForActiveAccounts<MetaCampaign>('campaigns', 'campaigns')
      const resolvedCampaigns = resolveFetchedItems(campaignsRef.current, campaignsResult)
      setCampaigns(resolvedCampaigns)
      if (campaignsResult.rateLimitedUntil) {
        setRateLimitedUntil(prev => Math.max(prev || 0, campaignsResult.rateLimitedUntil!))
        toast.error('Limite de requisições da Meta atingido ao buscar campanhas. Aguarde antes de tentar de novo.')
      }
      const newStats = calculateStats(accountsRef.current, resolvedCampaigns, adSetsRef.current, adsRef.current)
      persistCache({ campaigns: resolvedCampaigns, stats: newStats })
      setHasLoadedOnce(true)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Erro ao carregar campanhas')
    } finally {
      setIsLoadingCampaigns(false)
    }
  }, [fetchEndpointForActiveAccounts, persistCache])

  // Busca LAZY: só roda quando o usuário efetivamente abre a aba "Conjuntos" (ou clica em
  // Atualizar estando nela). Antes disso, essa chamada saía sempre junto com contas/campanhas/
  // anúncios, disparando 4 requisições simultâneas por conta e estourando o rate limit
  // "Limited Access" da Marketing API do Meta bem mais rápido do que o necessário.
  const fetchAdSets = useCallback(async () => {
    try {
      setIsLoadingAdSets(true)
      const adSetsResult = await fetchEndpointForActiveAccounts<MetaAdSet>('adsets', 'adSets')
      const resolvedAdSets = resolveFetchedItems(adSetsRef.current, adSetsResult)
      setAdSets(resolvedAdSets)
      if (adSetsResult.rateLimitedUntil) {
        setRateLimitedUntil(prev => Math.max(prev || 0, adSetsResult.rateLimitedUntil!))
        toast.error('Limite de requisições da Meta atingido ao buscar conjuntos. Aguarde antes de tentar de novo.')
      }
      const newStats = calculateStats(accountsRef.current, campaignsRef.current, resolvedAdSets, adsRef.current)
      persistCache({ adSets: resolvedAdSets, stats: newStats })
    } catch (error) {
      console.error('Error fetching ad sets:', error)
      toast.error('Erro ao carregar conjuntos de anúncios')
    } finally {
      setIsLoadingAdSets(false)
    }
  }, [fetchEndpointForActiveAccounts, persistCache])

  // Busca LAZY: mesma lógica de fetchAdSets, para a aba "Anúncios".
  const fetchAds = useCallback(async () => {
    try {
      setIsLoadingAds(true)
      const adsResult = await fetchEndpointForActiveAccounts<MetaAd>('ads', 'ads')
      const resolvedAds = resolveFetchedItems(adsRef.current, adsResult)
      setAds(resolvedAds)
      if (adsResult.rateLimitedUntil) {
        setRateLimitedUntil(prev => Math.max(prev || 0, adsResult.rateLimitedUntil!))
        toast.error('Limite de requisições da Meta atingido ao buscar anúncios. Aguarde antes de tentar de novo.')
      }
      const newStats = calculateStats(accountsRef.current, campaignsRef.current, adSetsRef.current, resolvedAds)
      persistCache({ ads: resolvedAds, stats: newStats })
    } catch (error) {
      console.error('Error fetching ads:', error)
      toast.error('Erro ao carregar anúncios')
    } finally {
      setIsLoadingAds(false)
    }
  }, [fetchEndpointForActiveAccounts, persistCache])

  const calculateStats = (accounts: MetaAccount[], campaigns: MetaCampaign[], adSets: MetaAdSet[], ads: MetaAd[]): MetaBusinessStats => {
    // Usar dados das contas se disponíveis, senão usar campanhas
    const dataSource = accounts.length > 0 ? accounts : campaigns
    const totalSpend = dataSource.reduce((sum, c) => sum + c.spend, 0)
    const totalImpressions = dataSource.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = dataSource.reduce((sum, c) => sum + c.clicks, 0)

    const newStats: MetaBusinessStats = {
      totalSpend,
      totalImpressions,
      totalClicks,
      averageCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalCampaigns: campaigns.length,
      totalAdSets: adSets.length,
      totalAds: ads.length,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      activeAdSets: adSets.filter(a => a.status === 'ACTIVE').length,
      activeAds: ads.filter(a => a.status === 'ACTIVE').length
    }

    setStats(newStats)
    return newStats
  }

  // Enquanto bloqueados por rate limit, atualiza a contagem regressiva mostrada no botão
  // "Atualizar" a cada segundo, e libera automaticamente assim que o tempo passar.
  useEffect(() => {
    if (!rateLimitedUntil) return
    const interval = setInterval(() => {
      const now = Date.now()
      setNowTick(now)
      if (now >= rateLimitedUntil) {
        setRateLimitedUntil(null)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [rateLimitedUntil])

  const isRateLimited = !!rateLimitedUntil && nowTick < rateLimitedUntil
  const rateLimitCountdownSeconds = isRateLimited ? Math.max(Math.ceil((rateLimitedUntil! - nowTick) / 1000), 0) : 0

  // Chave que identifica o "recorte" atual de dados (período de data selecionado). Usada para
  // saber se os dados já carregados numa aba ainda são válidos para o filtro atual, ou se
  // precisam ser buscados de novo quando o usuário voltar a essa aba (ex.: trocou o período).
  const currentDataKey = `${datePreset}|${customRange?.since || ''}|${customRange?.until || ''}`
  const accountsLoadedKeyRef = useRef<string | null>(null)
  const campaignsLoadedKeyRef = useRef<string | null>(null)
  const adSetsLoadedKeyRef = useRef<string | null>(null)
  const adsLoadedKeyRef = useRef<string | null>(null)

  // Busca SOB DEMANDA para as 4 abas (Contas/Campanhas/Conjuntos/Anúncios): cada uma só é
  // buscada na Graph API quando o usuário efetivamente abre aquela aba pela primeira vez (ou
  // quando o período de data muda e ele volta a essa aba) — nenhuma busca dispara sozinha ao
  // carregar a página, e nenhuma sai junto com outra aba. Isso garante no máximo 1 chamada por
  // conta de cada vez (a da aba que o usuário está realmente olhando), em vez de várias
  // simultâneas — o padrão que efetivamente evita estourar o rate limit "Limited Access" da
  // Meta, igual ao comportamento observado em ferramentas de tracking de terceiros (ex.
  // ratoeiraads.com.br), que buscam e mostram um spinner por aba, sob demanda.
  useEffect(() => {
    if (facebookAccounts.length === 0) {
      // Nenhuma conta conectada no AppContext. Enquanto ele ainda está carregando a lista real
      // (accountsLoading), não mexe em nada — evita apagar dados válidos por causa de uma
      // janela inicial vazia antes da primeira resposta chegar. Só limpa quando o AppContext já
      // confirmou definitivamente "zero contas": sem isso, o cache local desta tela
      // (`metaBusinessData`, hidratado direto do localStorage na montagem) continuava mostrando
      // contas/campanhas/conjuntos/anúncios de uma conexão já removida em Integrações para
      // sempre — esta tela nunca tinha motivo pra rebuscar e sobrescrever esse cache, porque o
      // efeito abaixo simplesmente não fazia nada com 0 contas. Ver seção 41 do doc do projeto.
      if (!accountsLoading && (accountsRef.current.length > 0 || campaignsRef.current.length > 0 || adSetsRef.current.length > 0 || adsRef.current.length > 0)) {
        accountsLoadedKeyRef.current = null
        campaignsLoadedKeyRef.current = null
        adSetsLoadedKeyRef.current = null
        adsLoadedKeyRef.current = null
        setAccounts([])
        setCampaigns([])
        setAdSets([])
        setAds([])
        const emptyStats = calculateStats([], [], [], [])
        setStats(emptyStats)
        persistCache({ accounts: [], campaigns: [], adSets: [], ads: [], stats: emptyStats })
      }
      return
    }
    // Não dispara enquanto bloqueados por rate limit; quando o bloqueio acabar, o usuário pode
    // trocar de aba de novo ou clicar em Atualizar para tentar de fato.
    if (isRateLimited) return

    if (activeTab === 'accounts' && accountsLoadedKeyRef.current !== currentDataKey) {
      accountsLoadedKeyRef.current = currentDataKey
      fetchAccounts()
    } else if (activeTab === 'campaigns' && campaignsLoadedKeyRef.current !== currentDataKey) {
      campaignsLoadedKeyRef.current = currentDataKey
      fetchCampaigns()
    } else if (activeTab === 'adsets' && adSetsLoadedKeyRef.current !== currentDataKey) {
      adSetsLoadedKeyRef.current = currentDataKey
      fetchAdSets()
    } else if (activeTab === 'ads' && adsLoadedKeyRef.current !== currentDataKey) {
      adsLoadedKeyRef.current = currentDataKey
      fetchAds()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, facebookAccounts, currentDataKey, isRateLimited, accountsLoading, persistCache])

  // Mantém o filtro de contas em sincronia sempre que os dados de campanhas/adsets/ads
  // (que carregam accountIds reais) mudarem.
  useEffect(() => {
    if (accounts.length > 0) {
      setFilters(prev => ({
        ...prev,
        accountIds: accounts.map(acc => acc.id)
      }))
    }
  }, [accounts])

  const handleRefresh = useDebounce('meta-business-refresh', async () => {
    // Se alguma conta acabou de bater no limite de requisições da Meta, não insiste — a própria
    // Meta recomenda parar de chamar nesse caso, já que continuar só aumenta o bloqueio. O botão
    // já fica desabilitado nesse período, mas essa checagem cobre chamadas vindas de outro lugar.
    if (isRateLimited) {
      toast.error(`Aguarde ${rateLimitCountdownSeconds}s: limite de requisições da Meta ainda ativo.`)
      return
    }

    try {
      setIsRefreshing(true)
      await refreshAccounts()
      // Atualiza só a aba que está aberta no momento — um refresh manual não precisa (e não deve)
      // gastar rate limit buscando as outras 3 abas que o usuário nem está olhando agora.
      if (activeTab === 'accounts') {
        await fetchAccounts()
      } else if (activeTab === 'campaigns') {
        await fetchCampaigns()
      } else if (activeTab === 'adsets') {
        await fetchAdSets()
      } else if (activeTab === 'ads') {
        await fetchAds()
      }
      if (!isRateLimited) {
        toast.success('Dados atualizados!')
      }
    } finally {
      setIsRefreshing(false)
    }
  }, 2000)

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      setCustomRange(undefined)
      // Propaga o novo período pro Dashboard Financeiro (e qualquer outra aba/tela aberta) via
      // localStorage compartilhado — ver comentário em lib/local-storage-cache.ts.
      writeLocalCache(LOCAL_CACHE_KEYS.sharedDateFilter, { datePreset: preset, customRange: undefined })
    }
  }

  const handleCustomRangeChange = (range: DateRange) => {
    setCustomRange(range)
    writeLocalCache(LOCAL_CACHE_KEYS.sharedDateFilter, { datePreset: 'custom', customRange: range })
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search
    }))
  }

  const handleStatusFilter = (status: string[]) => {
    setFilters(prev => ({
      ...prev,
      status
    }))
  }


  const handleAccountFilter = (accountIds: string[]) => {
    setFilters(prev => ({
      ...prev,
      accountIds
    }))
  }

  // Chamado quando o usuário salva uma nova seleção/ordem no modal de colunas — persiste no
  // Supabase (por usuário) via useColumnPreferences, o que atualiza `metrics` automaticamente
  // (derivado de selectedMetricIds acima).
  const handleMetricsChange = (metricIds: string[]) => {
    saveMetricIds(metricIds)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }


  // Funções de seleção em massa
  const handleSelectAll = (type: 'campaigns' | 'adsets' | 'ads') => {
    if (type === 'campaigns') {
      setSelectedCampaigns(new Set(campaigns.map(c => c.id)))
    } else if (type === 'adsets') {
      setSelectedAdSets(new Set(adSets.map(a => a.id)))
    } else if (type === 'ads') {
      setSelectedAds(new Set(ads.map(a => a.id)))
    }
  }

  const handleDeselectAll = (type: 'campaigns' | 'adsets' | 'ads') => {
    if (type === 'campaigns') {
      setSelectedCampaigns(new Set())
    } else if (type === 'adsets') {
      setSelectedAdSets(new Set())
    } else if (type === 'ads') {
      setSelectedAds(new Set())
    }
  }

  const handleToggleStatus = async (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'

    // Descobre a conta dona desse item para o servidor resolver o token certo — necessário desde
    // que o painel passou a mostrar contas de conexões/logins diferentes ao mesmo tempo (ver
    // resolveMetaAccessToken em lib/meta-connections.ts e a seção correspondente do doc do
    // projeto). Sem isso, o servidor caía sempre no cookie único, que só tem o token da última
    // conta conectada.
    const sourceItems = type === 'campaigns' ? campaigns : type === 'adsets' ? adSets : ads
    const accountId = sourceItems.find(item => item.id === id)?.account_id

    try {
      const response = await fetch(`/api/meta-business/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, accountId }),
        credentials: 'include'
      })

      if (response.ok) {
        toast.success(`${type === 'campaigns' ? 'Campanha' : type === 'adsets' ? 'Conjunto' : 'Anúncio'} ${newStatus === 'ACTIVE' ? 'ativado' : 'pausado'}!`)
        // Atualização otimista: a Meta já confirmou a mudança (response.ok), então refletimos
        // isso no estado local IMEDIATAMENTE, antes da busca de sincronização abaixo rodar. Sem
        // isso, a tela dependia inteiramente dessa busca pra "trazer de volta" o novo status — e
        // se ela caísse num bloqueio de rate limit ativo, a rota devolve o último dado bom
        // (lastGood, no servidor), que ainda reflete o status de ANTES do toggle, sobrescrevendo
        // a mudança real que acabou de acontecer na Meta. `resolveFetchedItems` (usado dentro de
        // fetchCampaigns/fetchAdSets/fetchAds) protege essa atualização otimista de
        // ser revertida por essa busca seguinte.
        const applyOptimisticStatus = <T extends { id: string; status: string; effective_status?: string }>(item: T): T =>
          item.id === id ? { ...item, status: newStatus, effective_status: newStatus } : item
        if (type === 'campaigns') setCampaigns(prev => prev.map(applyOptimisticStatus))
        else if (type === 'adsets') setAdSets(prev => prev.map(applyOptimisticStatus))
        else setAds(prev => prev.map(applyOptimisticStatus))

        // Recarregar só os dados do tipo alterado (campanhas/conjuntos/anúncios), não tudo —
        // mantém tudo em sincronia com a Meta em segundo plano, sem bloquear a UI. Não recarrega
        // contas aqui: um toggle de status de campanha não muda nada na aba Contas, então
        // refazer aquela busca só gastaria rate limit à toa.
        if (type === 'campaigns') await fetchCampaigns()
        else if (type === 'adsets') await fetchAdSets()
        else await fetchAds()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao alterar status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const handleBulkStatusUpdate = async (type: 'campaigns' | 'adsets' | 'ads', status: string) => {
    const selectedIds = type === 'campaigns' ? Array.from(selectedCampaigns) : 
                       type === 'adsets' ? Array.from(selectedAdSets) : 
                       Array.from(selectedAds)

    if (selectedIds.length === 0) {
      toast.error('Nenhum item selecionado')
      return
    }

    // Ver comentário equivalente em handleToggleStatus — cada item selecionado leva sua própria
    // account_id para o servidor poder resolver o token certo por item (podem vir de conexões
    // diferentes).
    const sourceItems = type === 'campaigns' ? campaigns : type === 'adsets' ? adSets : ads
    const items = selectedIds.map(id => ({
      id,
      accountId: sourceItems.find(item => item.id === id)?.account_id
    }))

    try {
      const response = await fetch(`/api/meta-business/${type}/bulk-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, status }),
        credentials: 'include'
      })

      if (response.ok) {
        toast.success(`${selectedIds.length} ${type === 'campaigns' ? 'campanhas' : type === 'adsets' ? 'conjuntos' : 'anúncios'} ${status === 'ACTIVE' ? 'ativados' : 'pausados'}!`)
        // Mesma atualização otimista do toggle individual (ver handleToggleStatus) — aplica o
        // novo status localmente para todos os itens selecionados antes da busca de sincronização.
        const applyOptimisticStatus = <T extends { id: string; status: string; effective_status?: string }>(item: T): T =>
          selectedIds.includes(item.id) ? { ...item, status, effective_status: status } : item
        if (type === 'campaigns') setCampaigns(prev => prev.map(applyOptimisticStatus))
        else if (type === 'adsets') setAdSets(prev => prev.map(applyOptimisticStatus))
        else setAds(prev => prev.map(applyOptimisticStatus))

        // Recarregar só os dados do tipo alterado (campanhas/conjuntos/anúncios), não tudo.
        if (type === 'campaigns') await fetchCampaigns()
        else if (type === 'adsets') await fetchAdSets()
        else await fetchAds()
        // Limpar seleção
        if (type === 'campaigns') setSelectedCampaigns(new Set())
        else if (type === 'adsets') setSelectedAdSets(new Set())
        else setSelectedAds(new Set())
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao alterar status em lote')
      }
    } catch (error) {
      console.error('Error bulk updating status:', error)
      toast.error('Erro ao alterar status em lote')
    }
  }

  const handleBudgetUpdate = async (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => {
    try {
      // Atualizar o estado local imediatamente para feedback visual
      if (type === 'campaigns') {
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === id 
            ? { 
                ...campaign, 
                [budgetType === 'daily' ? 'daily_budget' : 'lifetime_budget']: budget,
                budget_type: budgetType
              }
            : campaign
        ))
      } else if (type === 'adsets') {
        setAdSets(prev => prev.map(adSet => 
          adSet.id === id 
            ? { 
                ...adSet, 
                [budgetType === 'daily' ? 'daily_budget' : 'lifetime_budget']: budget,
                budget_type: budgetType
              }
            : adSet
        ))
      }

      // Recarregar dados em background para sincronizar com o servidor. Se essa busca cair num
      // bloqueio de rate limit ativo, `resolveFetchedItems` (dentro de fetchCampaigns/fetchAdSets)
      // mantém o valor otimista acima em vez de deixar o fallback do servidor (lastGood,
      // potencialmente com o orçamento antigo) sobrescrevê-lo.
      setTimeout(() => {
        if (type === 'campaigns') fetchCampaigns()
        else fetchAdSets()
      }, 1000)
    } catch (error) {
      console.error('Error updating budget state:', error)
    }
  }

  // Filtrar dados baseado nos filtros
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filters.search && !campaign.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status.length > 0 && !filters.status.includes(campaign.status)) return false
    if (filters.accountIds.length > 0 && !filters.accountIds.includes(campaign.account_id)) return false
    return true
  })

  const filteredAdSets = adSets.filter(adSet => {
    if (filters.search && !adSet.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status.length > 0 && !filters.status.includes(adSet.status)) return false
    if (filters.accountIds.length > 0 && !filters.accountIds.includes(adSet.account_id)) return false
    // Drill-down: campanhas marcadas na aba Campanhas escopam os Conjuntos exibidos aqui, igual
    // ao Gerenciador de Anúncios nativo (selecionar campanha(s) e abrir "Conjuntos de anúncios
    // para N Campanha(s)"). Ver selectedCampaigns/selectedAdSets mais acima.
    if (selectedCampaigns.size > 0 && !selectedCampaigns.has(adSet.campaign_id)) return false
    return true
  })

  const filteredAds = ads.filter(ad => {
    if (filters.search && !ad.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status.length > 0 && !filters.status.includes(ad.status)) return false
    if (filters.accountIds.length > 0 && !filters.accountIds.includes(ad.account_id)) return false
    // Drill-down: prioriza o escopo de Conjuntos selecionados; sem isso, cai pro escopo de
    // Campanhas selecionadas — mesma hierarquia Campanha > Conjunto > Anúncio do painel nativo.
    if (selectedAdSets.size > 0) {
      if (!selectedAdSets.has(ad.adset_id)) return false
    } else if (selectedCampaigns.size > 0 && !selectedCampaigns.has(ad.campaign_id)) {
      return false
    }
    return true
  })

  // Só bloqueia a tela inteira com o spinner se não houver NADA em cache para mostrar
  // (nem contas do Facebook, nem dados salvos do Meta Business de uma visita anterior).
  // Caso contrário, mostra os dados salvos imediatamente e atualiza em segundo plano
  // (indicado pelo ícone de "Atualizar" girando via isRefreshing).
  if (accountsLoading && !hasLoadedOnce) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando Meta Business...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* main mantém overflow-y-auto como rede de segurança (ex.: filtros quebrando em várias
            linhas numa tela estreita), mas em telas normais quem preenche o espaço é o card de
            abas/tabela logo abaixo (flex-1 min-h-0) — a tabela se adapta à altura real da
            primeira dobra em vez de uma altura fixa em vh/calc que sobra ou falta espaço
            dependendo do monitor. */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 flex-1 flex flex-col min-h-0"
          >
            <PageHeader title="Meta Ads" />

            {/* Aviso de rate limit ativo — some sozinho quando o tempo passar */}
            {isRateLimited && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                Limite de requisições da Meta atingido para uma ou mais contas. Os dados exibidos podem estar desatualizados.
                Nova tentativa liberada em {rateLimitCountdownSeconds}s.
              </div>
            )}

            {/* Filtros — layout em grade com rótulo acima de cada campo (estilo trackers como a
                UTMify), em vez dos cards de estatísticas + barra de filtros em linha única que
                existiam antes. */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Nome da {activeTab === 'campaigns' ? 'Campanha' : activeTab === 'adsets' ? 'Conjunto' : activeTab === 'ads' ? 'Anúncio' : 'Conta'}
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar por nome"
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-ds-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white w-full min-w-0"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <Select
                    value={filters.status.join(',')}
                    onChange={(v) => handleStatusFilter(v ? v.split(',') : [])}
                    options={[
                      { value: '', label: 'Qualquer' },
                      { value: 'ACTIVE', label: 'Ativo' },
                      { value: 'PAUSED', label: 'Pausado' }
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Conta de Anúncio
                  </label>
                  <Select
                    value={filters.accountIds.length === 1 ? filters.accountIds[0] : ''}
                    onChange={(v) => handleAccountFilter(v ? [v] : [])}
                    options={[
                      { value: '', label: 'Todas as Contas' },
                      ...accounts.map((account) => ({ value: account.id, label: account.name }))
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Data
                  </label>
                  <DateSelector
                    datePreset={datePreset}
                    customRange={customRange}
                    onDatePresetChange={handleDatePresetChange}
                    onCustomRangeChange={handleCustomRangeChange}
                  />
                </div>

                {/* Ícone de engrenagem (Personalizar Colunas) + botão Atualizar ficam dentro do
                    próprio card de filtros, junto dos dados que eles afetam — não no cabeçalho da
                    página (ver PageHeader), seguindo o padrão da referência da UTMify. */}
                <div className="flex items-center gap-2 sm:justify-end">
                  <MetaBusinessMetricsSelector
                    selectedMetricIds={selectedMetricIds}
                    onSave={handleMetricsChange}
                  />
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isRateLimited}
                    title={isRateLimited ? `Limite de requisições da Meta atingido. Tente novamente em ${rateLimitCountdownSeconds}s.` : 'Atualizar'}
                    className="btn-primary flex items-center justify-center space-x-2 px-3 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {isRateLimited ? `Aguarde ${rateLimitCountdownSeconds}s` : 'Atualizar'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Abas — os rótulos de Conjuntos/Anúncios mudam pra "... para N Campanha(s)/Conjunto(s)"
                quando há uma seleção ativa vinda da aba anterior, igual ao Gerenciador de Anúncios
                nativo (ver campanhaScopeLabel/adSetScopeLabel e o filtro em filteredAdSets/filteredAds). */}
            {/* flex-1 min-h-0: este card (abas + tabela) é o único bloco que deve crescer pra
                preencher o resto da primeira dobra — PageHeader/aviso/filtros acima têm altura
                fixa (natural do conteúdo). */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-1 min-h-0 flex flex-col">
              <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'accounts', label: 'Contas', icon: AccountsIcon },
                    { id: 'campaigns', label: 'Campanhas', icon: CampaignsIcon },
                    {
                      id: 'adsets',
                      label: selectedCampaigns.size > 0
                        ? `Conjuntos de anúncios para ${selectedCampaigns.size} Campanha${selectedCampaigns.size === 1 ? '' : 's'}`
                        : 'Conjuntos',
                      icon: AdSetsIcon
                    },
                    {
                      id: 'ads',
                      label: selectedAdSets.size > 0
                        ? `Anúncios para ${selectedAdSets.size} Conjunto${selectedAdSets.size === 1 ? '' : 's'}`
                        : selectedCampaigns.size > 0
                          ? `Anúncios para ${selectedCampaigns.size} Campanha${selectedCampaigns.size === 1 ? '' : 's'}`
                          : 'Anúncios',
                      icon: AdsIcon
                    }
                  ].map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-brand-500 text-gray-900 dark:text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Sem padding no topo nem nas laterais — a tabela encosta direto na barra de
                  abas e nas bordas do card, ganhando mais espaço horizontal pras colunas de
                  métrica (o scroll horizontal da própria tabela cuida do resto). flex-1 min-h-0
                  propaga a altura restante do card até a <Table/> de cada aba. */}
              <div className="flex-1 min-h-0 flex flex-col">
                {activeTab === 'accounts' && (
                  isLoadingAccounts && accounts.length === 0 ? (
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando contas...</p>
                    </div>
                  ) : (
                    <AccountsTable
                      accounts={accounts}
                      metrics={metrics}
                      showMetrics={true}
                    />
                  )
                )}

                {activeTab === 'campaigns' && (
                  isLoadingCampaigns && filteredCampaigns.length === 0 ? (
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando campanhas...</p>
                    </div>
                  ) : (
                    <CampaignsTable
                      campaigns={filteredCampaigns}
                      selectedCampaigns={selectedCampaigns}
                      onSelectionChange={setSelectedCampaigns}
                      onStatusToggle={handleToggleStatus}
                      onBudgetUpdate={handleBudgetUpdate}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      metrics={metrics}
                      showMetrics={true}
                    />
                  )
                )}
                
                {activeTab === 'adsets' && (
                  isLoadingAdSets && filteredAdSets.length === 0 ? (
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando conjuntos de anúncios...</p>
                    </div>
                  ) : (
                    <>
                    {selectedCampaigns.size > 0 && (
                      <div className="mb-4 flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm text-blue-800 dark:text-blue-300">
                        <span>
                          Mostrando conjuntos de {selectedCampaigns.size} campanha{selectedCampaigns.size === 1 ? '' : 's'} selecionada{selectedCampaigns.size === 1 ? '' : 's'}.
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCampaigns(new Set())}
                          className="font-medium hover:underline flex-shrink-0"
                        >
                          Limpar seleção
                        </button>
                      </div>
                    )}
                    <AdSetsTable
                      adSets={filteredAdSets}
                      selectedAdSets={selectedAdSets}
                      onSelectionChange={setSelectedAdSets}
                      onStatusToggle={handleToggleStatus}
                      onBudgetUpdate={handleBudgetUpdate}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      metrics={metrics}
                      showMetrics={true}
                    />
                    </>
                  )
                )}

                {activeTab === 'ads' && (
                  isLoadingAds && filteredAds.length === 0 ? (
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando anúncios...</p>
                    </div>
                  ) : (
                    <>
                    {(selectedAdSets.size > 0 || selectedCampaigns.size > 0) && (
                      <div className="mb-4 flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm text-blue-800 dark:text-blue-300">
                        <span>
                          {selectedAdSets.size > 0
                            ? `Mostrando anúncios de ${selectedAdSets.size} conjunto${selectedAdSets.size === 1 ? '' : 's'} selecionado${selectedAdSets.size === 1 ? '' : 's'}.`
                            : `Mostrando anúncios de ${selectedCampaigns.size} campanha${selectedCampaigns.size === 1 ? '' : 's'} selecionada${selectedCampaigns.size === 1 ? '' : 's'}.`}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setSelectedAdSets(new Set()); setSelectedCampaigns(new Set()) }}
                          className="font-medium hover:underline flex-shrink-0"
                        >
                          Limpar seleção
                        </button>
                      </div>
                    )}
                    <AdsTable
                      ads={filteredAds}
                      selectedAds={selectedAds}
                      onSelectionChange={setSelectedAds}
                      onStatusToggle={handleToggleStatus}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      metrics={metrics}
                      showMetrics={true}
                    />
                    </>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
