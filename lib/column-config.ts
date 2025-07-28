export interface ColumnConfig {
  id: string
  label: string
  category: string
  type: 'number' | 'currency' | 'percentage' | 'text'
  format?: (value: any) => string
  visible: boolean
  order: number
  fixed?: boolean // Colunas que sempre devem estar visíveis
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  // Identificação
  {
    id: 'campaign_name',
    label: 'Campanha',
    category: 'Identificação',
    type: 'text',
    visible: true,
    order: 1,
    fixed: true // Sempre visível
  },

  // Métricas básicas (FIXAS - sempre visíveis)
  {
    id: 'impressions',
    label: 'Impressões',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 2,
    fixed: true // Sempre visível
  },
  {
    id: 'clicks',
    label: 'Cliques',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 3,
    fixed: true // Sempre visível
  },
  {
    id: 'spend',
    label: 'Gasto',
    category: 'Métricas Básicas',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 4,
    fixed: true // Sempre visível
  },
  {
    id: 'reach',
    label: 'Alcance',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 5,
    fixed: true // Sempre visível
  },
  {
    id: 'frequency',
    label: 'Frequência',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseFloat(value || '0').toFixed(2),
    visible: true,
    order: 6,
    fixed: true // Sempre visível
  },

  // Métricas de custo (FIXAS - sempre visíveis)
  {
    id: 'cpm',
    label: 'CPM',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 7,
    fixed: true // Sempre visível
  },
  {
    id: 'cpc',
    label: 'CPC',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 8,
    fixed: true // Sempre visível
  },
  {
    id: 'ctr',
    label: 'CTR',
    category: 'Métricas de Custo',
    type: 'percentage',
    format: (value) => `${parseFloat(value || '0').toFixed(2)}%`,
    visible: true,
    order: 9,
    fixed: true // Sempre visível
  },

  // Métricas de engajamento
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links',
    category: 'Engajamento',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 12
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento do Post',
    category: 'Engajamento',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 13
  },

  // Métricas de conversão
  {
    id: 'conversions',
    label: 'Conversões',
    category: 'Conversão',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 14
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 15
  },
  {
    id: 'conversion_values',
    label: 'Valores de Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 16
  },

  // Métricas de qualidade
  {
    id: 'quality_ranking',
    label: 'Ranking de Qualidade',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 17
  },
  {
    id: 'engagement_rate_ranking',
    label: 'Ranking de Engajamento',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 18
  }
]

export function getVisibleColumns(columns: ColumnConfig[]): ColumnConfig[] {
  console.log('🔍 ColumnConfig: getVisibleColumns - Total de colunas:', columns.length)
  
  // Primeiro, pegar todas as colunas fixas (sempre visíveis)
  const fixedColumns = columns.filter(col => col.fixed)
  console.log('🔍 ColumnConfig: Colunas fixas encontradas:', fixedColumns.length)
  
  // Depois, pegar colunas visíveis que não são fixas
  const visibleNonFixedColumns = columns.filter(col => col.visible && !col.fixed)
  console.log('🔍 ColumnConfig: Colunas visíveis não-fixas:', visibleNonFixedColumns.length)
  
  // Combinar e ordenar
  const visibleColumns = [...fixedColumns, ...visibleNonFixedColumns].sort((a, b) => a.order - b.order)
  
  console.log('🔍 ColumnConfig: Colunas visíveis finais:', visibleColumns.length)
  console.log('🔍 ColumnConfig: IDs das colunas visíveis:', visibleColumns.map(col => col.id))
  
  return visibleColumns
}

export function getFixedColumns(columns: ColumnConfig[]): ColumnConfig[] {
  return columns
    .filter(col => col.fixed)
    .sort((a, b) => a.order - b.order)
}

export function formatColumnValue(value: any, column: ColumnConfig): string {
  console.log(`🔍 ColumnConfig: formatColumnValue - Coluna: ${column.id}, Valor:`, value, 'Tipo:', typeof value)
  
  if (value === null || value === undefined || value === '') {
    console.log(`🔍 ColumnConfig: formatColumnValue - Valor vazio para ${column.id}`)
    return '-'
  }

  if (column.format) {
    const formatted = column.format(value)
    console.log(`🔍 ColumnConfig: formatColumnValue - Formatado para ${column.id}:`, formatted)
    return formatted
  }

  let result: string
  switch (column.type) {
    case 'currency':
      result = `R$ ${parseFloat(value || '0').toFixed(2)}`
      break
    case 'percentage':
      result = `${parseFloat(value || '0').toFixed(2)}%`
      break
    case 'number':
      result = parseInt(value || '0').toLocaleString()
      break
    default:
      result = String(value)
  }
  
  console.log(`🔍 ColumnConfig: formatColumnValue - Resultado para ${column.id}:`, result)
  return result
}

export function getCategories(columns: ColumnConfig[]): string[] {
  return Array.from(new Set(columns.map(col => col.category)))
} 