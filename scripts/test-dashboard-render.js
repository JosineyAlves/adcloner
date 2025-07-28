// Simular dados de insights para testar a renderização
const mockInsights = [
  {
    campaign_id: '123456789',
    campaign_name: 'Campanha Teste 1',
    impressions: '1000',
    clicks: '50',
    spend: '100.50',
    reach: '800',
    frequency: '1.25',
    cpm: '100.50',
    cpc: '2.01',
    ctr: '5.00'
  },
  {
    campaign_id: '987654321',
    campaign_name: 'Campanha Teste 2',
    impressions: '2000',
    clicks: '100',
    spend: '200.00',
    reach: '1500',
    frequency: '1.33',
    cpm: '100.00',
    cpc: '2.00',
    ctr: '5.00'
  }
]

// Simular configuração de colunas
const mockColumns = [
  {
    id: 'campaign_name',
    label: 'Campanha',
    category: 'Identificação',
    type: 'text',
    visible: true,
    order: 1,
    fixed: true
  },
  {
    id: 'impressions',
    label: 'Impressões',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 2,
    fixed: true
  },
  {
    id: 'clicks',
    label: 'Cliques',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 3,
    fixed: true
  },
  {
    id: 'spend',
    label: 'Gasto',
    category: 'Métricas Básicas',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 4,
    fixed: true
  }
]

// Função para obter colunas visíveis
function getVisibleColumns(columns) {
  console.log('🔍 Teste: getVisibleColumns - Total de colunas:', columns.length)
  
  const visibleColumns = columns
    .filter(col => col.visible || col.fixed)
    .sort((a, b) => a.order - b.order)
  
  console.log('🔍 Teste: Colunas visíveis encontradas:', visibleColumns.length)
  console.log('🔍 Teste: Colunas fixas:', visibleColumns.filter(col => col.fixed).length)
  console.log('🔍 Teste: IDs das colunas visíveis:', visibleColumns.map(col => col.id))
  
  return visibleColumns
}

// Função para formatar valores
function formatColumnValue(value, column) {
  console.log(`🔍 Teste: formatColumnValue - Coluna: ${column.id}, Valor:`, value, 'Tipo:', typeof value)
  
  if (value === null || value === undefined || value === '') {
    console.log(`🔍 Teste: formatColumnValue - Valor vazio para ${column.id}`)
    return '-'
  }

  if (column.format) {
    const formatted = column.format(value)
    console.log(`🔍 Teste: formatColumnValue - Formatado para ${column.id}:`, formatted)
    return formatted
  }

  let result
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
  
  console.log(`🔍 Teste: formatColumnValue - Resultado para ${column.id}:`, result)
  return result
}

// Testar a renderização
function testDashboardRender() {
  console.log('🚀 Testando renderização do dashboard...')
  
  const visibleColumns = getVisibleColumns(mockColumns)
  
  console.log('📊 Renderizando tabela com dados simulados:')
  
  mockInsights.forEach((insight, index) => {
    console.log(`📊 Insight ${index}:`, insight)
    
    visibleColumns.forEach(column => {
      const value = insight[column.id]
      const formattedValue = formatColumnValue(value, column)
      console.log(`  ${column.label}: ${value} -> ${formattedValue}`)
    })
    
    console.log('---')
  })
  
  console.log('✅ Teste de renderização concluído!')
}

testDashboardRender() 