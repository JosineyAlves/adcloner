/**
 * Camada de dados para a persistência de "colunas selecionadas" (Meta Business).
 *
 * Antes disso, a seleção de colunas do usuário só vivia no localStorage do navegador via
 * hooks/useSelectedMetrics.ts — além de um bug de ordem de useEffect que fazia a seleção salva
 * ser sobrescrita pelo padrão a cada carregamento da página (ver hooks/useSelectedMetrics.ts),
 * isso também significava que a seleção não acompanhava o usuário entre navegadores/dispositivos.
 *
 * Este módulo persiste a seleção (lista ordenada de ids de métrica) no Supabase, por usuário
 * (fb_user_id — mesmo identificador usado em meta_connections, já que este app não tem uma
 * tabela de "usuários" própria: ver app/api/auth/check/route.ts) e por "view" (view_key), para
 * permitir reaproveitar a mesma tabela caso outras telas ganhem seletores de coluna no futuro.
 */

import { getSupabaseAdmin } from './supabase-admin'

export async function getColumnPreferences(fbUserId: string, viewKey: string): Promise<string[] | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('column_preferences')
    .select('metric_ids')
    .eq('fb_user_id', fbUserId)
    .eq('view_key', viewKey)
    .maybeSingle()

  if (error) throw new Error(`Falha ao buscar preferências de colunas: ${error.message}`)
  if (!data) return null

  const metricIds = data.metric_ids
  return Array.isArray(metricIds) ? (metricIds as string[]) : null
}

export async function saveColumnPreferences(
  fbUserId: string,
  viewKey: string,
  metricIds: string[]
): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('column_preferences')
    .upsert(
      {
        fb_user_id: fbUserId,
        view_key: viewKey,
        metric_ids: metricIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'fb_user_id,view_key' }
    )

  if (error) throw new Error(`Falha ao salvar preferências de colunas: ${error.message}`)
}
