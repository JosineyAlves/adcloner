/**
 * Camada de dados para a feature "Conectar múltiplas contas/BMs".
 *
 * Isolado de lib/facebook-api.ts (usado pela parte de clonagem) — este módulo é
 * responsável por: salvar uma nova conexão OAuth com o Meta, descobrir a estrutura
 * de Business Manager/contas de anúncio/páginas/pixels visível para aquele token,
 * persistir tudo no Supabase, e listar o que já está conectado para a UI.
 *
 * Referência oficial usada para desenhar os endpoints: ver
 * claude/meta-api-reference.md no projeto (Business Manager API, edges
 * owned_ad_accounts / client_ad_accounts / owned_pages / owned_pixels).
 */

import { getSupabaseAdmin } from './supabase-admin'
import { encryptSecret, decryptSecret } from './crypto'

const GRAPH_API_VERSION = 'v23.0'
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface MetaUserInfo {
  id: string
  name?: string
  email?: string
}

export interface ConnectionSummary {
  id: string
  fbUserId: string
  fbUserName: string | null
  fbUserEmail: string | null
  tokenType: 'user' | 'system_user'
  status: 'valid' | 'expired' | 'revoked' | 'error'
  createdAt: string
  businessCount: number
  adAccountCount: number
}

export interface AdAccountSummary {
  id: string
  metaAccountId: string
  name: string | null
  currency: string | null
  accountStatus: number | null
  relationship: 'owned' | 'client'
  businessName: string | null
  connectionFbUserName: string | null
  syncEnabled: boolean
  lastSyncedAt: string | null
}

async function graphGet(path: string, accessToken: string, params: Record<string, string> = {}) {
  const url = new URL(`${GRAPH_BASE_URL}${path}`)
  url.searchParams.set('access_token', accessToken)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.error) {
    const error = new Error(data.error.message || 'Erro na Graph API')
    ;(error as any).code = data.error.code
    ;(error as any).fbtrace_id = data.error.fbtrace_id
    throw error
  }

  return data
}

/**
 * Passo 1: salva a conexão (token criptografado) assim que o OAuth retorna com sucesso.
 * Não faz nenhuma chamada de descoberta ainda — isso é feito por discoverBusinessStructure.
 */
export async function saveConnection(params: {
  fbUser: MetaUserInfo
  accessToken: string
  tokenType?: 'user' | 'system_user'
  scopes?: string[]
}): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('meta_connections')
    .insert({
      fb_user_id: params.fbUser.id,
      fb_user_name: params.fbUser.name ?? null,
      fb_user_email: params.fbUser.email ?? null,
      access_token_encrypted: encryptSecret(params.accessToken),
      token_type: params.tokenType ?? 'user',
      scopes: params.scopes ?? [],
      status: 'valid',
      last_validated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`Falha ao salvar conexão: ${error.message}`)
  return data.id as string
}

/**
 * Passo 2: usa o token da conexão para descobrir toda a estrutura visível a ele —
 * Business Managers, contas de anúncio (owned + client), páginas e pixels — e grava
 * tudo no Supabase. Idempotente: pode ser chamado de novo a qualquer momento para
 * atualizar a estrutura (upsert por meta_business_id / meta_account_id).
 */
export async function discoverBusinessStructure(connectionId: string, accessToken: string) {
  const supabase = getSupabaseAdmin()
  let businessCount = 0
  let accountCount = 0

  // 1) Business Managers visíveis a este token
  const businesses = await graphGet('/me/businesses', accessToken, {
    fields: 'id,name,verification_status',
  })

  for (const biz of businesses.data ?? []) {
    const { data: businessRow, error: businessError } = await supabase
      .from('meta_businesses')
      .upsert(
        {
          connection_id: connectionId,
          meta_business_id: biz.id,
          name: biz.name ?? null,
          verification_status: biz.verification_status ?? null,
        },
        { onConflict: 'connection_id,meta_business_id' }
      )
      .select('id')
      .single()

    if (businessError) {
      console.error('Erro ao salvar business', biz.id, businessError.message)
      continue
    }
    businessCount++
    const businessRowId = businessRow.id as string

    // Contas próprias do BM
    const owned = await graphGet(`/${biz.id}/owned_ad_accounts`, accessToken, {
      fields: 'account_id,name,currency,timezone_name,account_status,amount_spent,balance,spend_cap',
    })
    accountCount += await upsertAdAccounts(connectionId, businessRowId, owned.data ?? [], 'owned')

    // Contas de clientes que compartilharam acesso com esse BM
    const client = await graphGet(`/${biz.id}/client_ad_accounts`, accessToken, {
      fields: 'account_id,name,currency,timezone_name,account_status,amount_spent,balance,spend_cap',
    })
    accountCount += await upsertAdAccounts(connectionId, businessRowId, client.data ?? [], 'client')

    // Páginas próprias
    try {
      const pages = await graphGet(`/${biz.id}/owned_pages`, accessToken, { fields: 'id,name,category' })
      for (const page of pages.data ?? []) {
        await supabase.from('meta_pages').upsert(
          {
            connection_id: connectionId,
            business_id: businessRowId,
            meta_page_id: page.id,
            name: page.name ?? null,
            category: page.category ?? null,
          },
          { onConflict: 'connection_id,meta_page_id' }
        )
      }
    } catch (err: any) {
      console.error(`Erro ao buscar páginas do business ${biz.id}:`, err.message)
    }

    // Pixels próprios
    try {
      const pixels = await graphGet(`/${biz.id}/owned_pixels`, accessToken, { fields: 'id,name' })
      for (const pixel of pixels.data ?? []) {
        await supabase.from('meta_pixels').upsert(
          {
            connection_id: connectionId,
            business_id: businessRowId,
            meta_pixel_id: pixel.id,
            name: pixel.name ?? null,
          },
          { onConflict: 'connection_id,meta_pixel_id' }
        )
      }
    } catch (err: any) {
      console.error(`Erro ao buscar pixels do business ${biz.id}:`, err.message)
    }
  }

  // 2) Contas de anúncio pessoais do usuário, não vinculadas a nenhum Business Manager
  try {
    const personalAccounts = await graphGet('/me/adaccounts', accessToken, {
      fields: 'account_id,name,currency,timezone_name,account_status,amount_spent,balance,spend_cap',
    })
    accountCount += await upsertAdAccounts(connectionId, null, personalAccounts.data ?? [], 'owned')
  } catch (err: any) {
    console.error('Erro ao buscar contas pessoais:', err.message)
  }

  await supabase
    .from('meta_connections')
    .update({ status: 'valid', last_validated_at: new Date().toISOString() })
    .eq('id', connectionId)

  return { businessCount, accountCount }
}

async function upsertAdAccounts(
  connectionId: string,
  businessRowId: string | null,
  accounts: any[],
  relationship: 'owned' | 'client'
): Promise<number> {
  if (accounts.length === 0) return 0
  const supabase = getSupabaseAdmin()

  const rows = accounts.map((acc) => ({
    connection_id: connectionId,
    business_id: businessRowId,
    meta_account_id: acc.account_id ?? acc.id,
    name: acc.name ?? null,
    currency: acc.currency ?? null,
    timezone_name: acc.timezone_name ?? null,
    account_status: acc.account_status ?? null,
    relationship,
    amount_spent: acc.amount_spent ? Number(acc.amount_spent) : null,
    balance: acc.balance ? Number(acc.balance) : null,
    spend_cap: acc.spend_cap ? Number(acc.spend_cap) : null,
  }))

  const { error } = await supabase
    .from('meta_ad_accounts')
    .upsert(rows, { onConflict: 'connection_id,meta_account_id' })

  if (error) {
    console.error('Erro ao salvar contas de anúncio:', error.message)
    return 0
  }
  return rows.length
}

export async function listConnections(): Promise<ConnectionSummary[]> {
  const supabase = getSupabaseAdmin()

  const { data: connections, error } = await supabase
    .from('meta_connections')
    .select('id, fb_user_id, fb_user_name, fb_user_email, token_type, status, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Falha ao listar conexões: ${error.message}`)
  if (!connections) return []

  const results: ConnectionSummary[] = []
  for (const conn of connections) {
    const { count: businessCount } = await supabase
      .from('meta_businesses')
      .select('id', { count: 'exact', head: true })
      .eq('connection_id', conn.id)

    const { count: adAccountCount } = await supabase
      .from('meta_ad_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('connection_id', conn.id)

    results.push({
      id: conn.id,
      fbUserId: conn.fb_user_id,
      fbUserName: conn.fb_user_name,
      fbUserEmail: conn.fb_user_email,
      tokenType: conn.token_type,
      status: conn.status,
      createdAt: conn.created_at,
      businessCount: businessCount ?? 0,
      adAccountCount: adAccountCount ?? 0,
    })
  }

  return results
}

export async function listAdAccounts(): Promise<AdAccountSummary[]> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('meta_ad_accounts')
    .select(
      `id, meta_account_id, name, currency, account_status, relationship, sync_enabled, last_synced_at,
       meta_businesses ( name ),
       meta_connections ( fb_user_name )`
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Falha ao listar contas de anúncio: ${error.message}`)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    metaAccountId: row.meta_account_id,
    name: row.name,
    currency: row.currency,
    accountStatus: row.account_status,
    relationship: row.relationship,
    businessName: row.meta_businesses?.name ?? null,
    connectionFbUserName: row.meta_connections?.fb_user_name ?? null,
    syncEnabled: row.sync_enabled,
    lastSyncedAt: row.last_synced_at,
  }))
}

/** Uso interno futuro (worker de sync) — obtém o token em claro de uma conexão. */
export async function getDecryptedAccessToken(connectionId: string): Promise<string> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('meta_connections')
    .select('access_token_encrypted')
    .eq('id', connectionId)
    .single()

  if (error || !data) throw new Error('Conexão não encontrada.')
  return decryptSecret(data.access_token_encrypted)
}

/**
 * Resolve o token de acesso correto para UMA conta de anúncio específica, usando as conexões
 * persistidas no Supabase — em vez do cookie único `fb_access_token`, que só guarda o token da
 * ÚLTIMA conta conectada. Cada conexão feita via "Login para Empresas" gera um token de sistema
 * escopado a um cliente/Business Manager específico: usar o token errado para uma conta de outro
 * cliente falha (permissão) mesmo que a conta apareça corretamente na listagem.
 *
 * Normaliza o `accountId` removendo o prefixo "act_" (formato usado pela Graph API em endpoints
 * como /me/adaccounts e em todo o restante do app) para comparar com
 * `meta_ad_accounts.meta_account_id`, que é gravado sem o prefixo (vem do campo `account_id` das
 * edges owned_ad_accounts/client_ad_accounts — ver upsertAdAccounts acima).
 */
export async function getAccessTokenForAdAccount(accountId: string): Promise<string | null> {
  if (!accountId) return null
  const supabase = getSupabaseAdmin()
  const normalizedId = accountId.replace(/^act_/, '')

  const { data, error } = await supabase
    .from('meta_ad_accounts')
    .select('connection_id')
    .eq('meta_account_id', normalizedId)
    .limit(1)
    .maybeSingle()

  if (error || !data?.connection_id) return null

  try {
    return await getDecryptedAccessToken(data.connection_id)
  } catch {
    return null
  }
}

/**
 * Wrapper usado por todas as rotas de API do Meta Business: tenta resolver o token pela conexão
 * dona da `accountId` informada (ver getAccessTokenForAdAccount) e só cai para o cookie único
 * `fb_access_token` se não achar (conta não descoberta ainda, accountId não informado, ou erro no
 * Supabase) — preserva o comportamento antigo como rede de segurança em vez de quebrar tudo.
 */
export async function resolveMetaAccessToken(
  cookieToken: string | undefined | null,
  accountId?: string | null
): Promise<string | null> {
  if (accountId) {
    const tokenFromConnection = await getAccessTokenForAdAccount(accountId)
    if (tokenFromConnection) return tokenFromConnection
  }
  return cookieToken ?? null
}

export async function removeConnection(connectionId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('meta_connections').delete().eq('id', connectionId)
  if (error) throw new Error(`Falha ao remover conexão: ${error.message}`)
}

/**
 * Liga/desliga a sincronização de UMA conta de anúncio (linha de `meta_ad_accounts`, pelo `id`
 * interno — não o `meta_account_id`). Usado pela tela de Integrações (checkbox por conta).
 */
export async function setAdAccountSyncEnabled(id: string, syncEnabled: boolean): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('meta_ad_accounts').update({ sync_enabled: syncEnabled }).eq('id', id)
  if (error) throw new Error(`Falha ao atualizar sincronização da conta: ${error.message}`)
}

/** Liga/desliga a sincronização de TODAS as contas de anúncio de uma vez ("Ativar todas"). */
export async function setAllAdAccountsSyncEnabled(syncEnabled: boolean): Promise<void> {
  const supabase = getSupabaseAdmin()
  // Supabase/PostgREST exige pelo menos um filtro em updates em massa — usamos um que sempre
  // bate (todo id de UUID é diferente do UUID zerado) para atualizar a tabela inteira.
  const { error } = await supabase
    .from('meta_ad_accounts')
    .update({ sync_enabled: syncEnabled })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(`Falha ao atualizar sincronização das contas: ${error.message}`)
}
