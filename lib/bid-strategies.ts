// Estratégias de lance em que bid_amount é um limite editável pelo usuário (lance manual) — nas
// demais (lance automático ou ROAS mínimo) o campo não é editável. Fonte única usada tanto pelo
// backend (rotas de bid individual e em massa) quanto pelo frontend (BidEditor, AdSetsTable), pra
// não correr o risco das duas listas ficarem dessincronizadas.
export const BID_AMOUNT_STRATEGIES = new Set(['COST_CAP', 'LOWEST_COST_WITH_BID_CAP'])
