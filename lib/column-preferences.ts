/**
 * Camada de dados para a persistência de "colunas selecionadas" (Meta Business).
 *
 * Antes disso, a seleção de colunas do usuário só vivia no localStorage do navegador via
 * hooks/useSelectedMetrics.ts — além de um bug de ordem de useEffect que fazia a seleção salva
 * ser sobrescrita pelo padrão a cada carregamento da página (ver hooks/useSelectedMetrics.ts),
 * isso também significava que a seleção não acompanhava o usuário entre navegadores/dispositivos.
 *
 * Este módulo persiste a seleção (lista ordenada de ids de métrica) no Supabase, por usuário
 * vmetrics autenticado (user_id = auth.users.id, igual meta_connections e as rotas de
 * meta-business/* — ver lib/supabase/server.ts -> getAuthenticatedUserId) e por "view"
 * (view_key), para permitir reaproveitar a mesma tabela caso outras telas ganhem seletores de
 * coluna no futuro.
 *
 * Antes usava fb_user_id (cookie do perfil do Facebook), que nunca era setado em nenhum fluxo
 * real do app — toda gravação falhava com 401 silenciosamente (ver hooks/useColumnPreferences.ts)
 * e a tabela ficava sempre vazia, mesmo com a seleção "funcionando" via cache em localStorage.
 */

import { getSupabaseAdmin } from './supabase-admin'

export async function getColumnPreferences(userId: string, viewKey: string): Promise<string[] | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('column_preferences')
    .select('metric_ids')
    .eq('user_id', userId)
    .eq('view_key', viewKey)
    .maybeSingle()

  if (error) throw new Error(`Falha ao buscar preferências de colunas: ${error.message}`)
  if (!data) return null

  const metricIds = data.metric_ids
  return Array.isArray(metricIds) ? (metricIds as string[]) : null
}

export async function saveColumnPreferences(
  userId: string,
  viewKey: string,
  metricIds: string[]
): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('column_preferences')
    .upsert(
      {
        user_id: userId,
        view_key: viewKey,
        metric_ids: metricIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,view_key' }
    )

  if (error) throw new Error(`Falha ao salvar preferências de colunas: ${error.message}`)
}
