# 📊 Documentação Completa das Métricas da API do Meta

## Visão Geral

O AdCloner agora implementa **50+ métricas** disponíveis na API do Meta, organizadas em 10 categorias distintas para facilitar a análise e otimização de campanhas.

## 📈 Categorias de Métricas

### 1. **Métricas Básicas** (5 métricas)
Métricas fundamentais para análise de desempenho:

- **Impressões** - Número de vezes que os anúncios foram exibidos
- **Cliques** - Número de cliques em anúncios
- **Gasto** - Valor total gasto em anúncios
- **Alcance** - Número de pessoas únicas que viram os anúncios
- **Frequência** - Média de vezes que cada pessoa viu o anúncio

### 2. **Métricas de Custo** (8 métricas)
Análise detalhada de custos e eficiência:

- **CPM** - Custo por mil impressões
- **CPC** - Custo por clique
- **CTR** - Taxa de clique (cliques / impressões)
- **Custo por Conversão** - Custo médio por conversão
- **Custo por Ação** - Custo por tipo de ação específica
- **Custo por Clique em Link** - Custo por clique em link inline
- **Custo por Clique Único** - Custo por clique único
- **Custo por Visualização de Página** - Custo por visualização da página de destino

### 3. **Métricas de Engajamento** (7 métricas)
Interações e engajamento com o conteúdo:

- **Cliques em Links** - Número de cliques em links específicos
- **Engajamento** - Interações com o post (likes, comentários, shares)
- **Engajamento do Post** - Total de engajamentos no post
- **Engajamento da Página** - Engajamentos na página do Facebook
- **Reações** - Número de reações (likes, loves, etc.)
- **Comentários** - Número de comentários no post
- **Compartilhamentos** - Número de compartilhamentos do post

### 4. **Métricas de Conversão** (4 métricas)
Análise de conversões e resultados:

- **Conversões** - Número de conversões realizadas
- **Taxa de Conversão** - Percentual de conversões em relação aos cliques
- **Valor das Conversões** - Valor total das conversões
- **Ranking de Taxa de Conversão** - Ranking vs concorrentes

### 5. **Métricas de Vídeo** (8 métricas)
Análise específica para campanhas de vídeo:

- **Visualizações de Vídeo** - Número de visualizações de vídeo
- **Visualizações 3s** - Visualizações de vídeo por 3 segundos
- **Visualizações 25%** - Visualizações de 25% do vídeo
- **Visualizações 50%** - Visualizações de 50% do vídeo
- **Visualizações 75%** - Visualizações de 75% do vídeo
- **Visualizações 100%** - Visualizações de 100% do vídeo
- **Ações de Reprodução** - Ações de reprodução do vídeo
- **Curva de Reprodução** - Ações na curva de reprodução do vídeo

### 6. **Métricas de Qualidade** (3 métricas)
Rankings e pontuações de qualidade:

- **Ranking de Qualidade** - Ranking de qualidade vs concorrentes
- **Ranking de Engajamento** - Ranking de taxa de engajamento vs concorrentes
- **Pontuação de Qualidade** - Pontuação de qualidade do anúncio

### 7. **Métricas de Ações** (7 métricas)
Ações específicas realizadas pelos usuários:

- **Ações** - Total de ações realizadas
- **Compras** - Número de compras realizadas
- **Adicionar ao Carrinho** - Número de adições ao carrinho
- **Iniciar Checkout** - Número de inícios de checkout
- **Leads** - Número de leads gerados
- **Instalações de App** - Número de instalações de aplicativo
- **Eventos de App** - Número de eventos de aplicativo

### 8. **Métricas de Landing Page** (2 métricas)
Análise da página de destino:

- **Visualizações de Página** - Visualizações da página de destino
- **CTR da Página** - Taxa de clique para a página de destino

### 9. **Métricas de Alcance** (4 métricas)
Análise de alcance e cliques únicos:

- **Cliques Únicos** - Número de pessoas únicas que clicaram
- **Cliques Únicos em Links** - Número de pessoas únicas que clicaram em links
- **Cliques Únicos Inline** - Número de pessoas únicas que clicaram em links inline
- **CTR Único** - Taxa de clique única (cliques únicos / alcance)

### 10. **Métricas de Frequência** (2 métricas)
Análise de frequência de visualização:

- **Distribuição de Frequência** - Distribuição de frequência de visualização
- **Frequência Efetiva** - Frequência efetiva de visualização

## 🎯 Métricas por Objetivo de Campanha

### **VIDEO_VIEWS**
- Métricas básicas + Métricas de vídeo
- Foco em visualizações e engajamento de vídeo

### **CONVERSIONS**
- Métricas básicas + Métricas de conversão + Métricas de ações
- Foco em conversões e ações específicas

### **TRAFFIC**
- Métricas básicas + Métricas de landing page + Métricas de engajamento
- Foco em tráfego e engajamento

### **LEAD_GENERATION**
- Métricas básicas + Métricas de leads
- Foco em geração de leads

### **REACH**
- Métricas básicas + Métricas de alcance + Métricas de frequência
- Foco em alcance e frequência

### **BRAND_AWARENESS**
- Métricas básicas + Métricas de engajamento + Métricas de qualidade
- Foco em engajamento e qualidade

## 🔧 Implementação Técnica

### **Arquivo de Configuração**
- `lib/metrics-config.ts` - Configuração centralizada de todas as métricas
- Organização por categorias e objetivos de campanha
- Ícones e cores personalizados para cada métrica

### **API do Facebook**
- `lib/facebook-api.ts` - Atualizado com todos os campos disponíveis
- Suporte a 50+ campos da Insights API
- Métodos `getCampaignInsights` e `getAccountInsights` atualizados

### **Componentes de Interface**
- `components/dashboard/MetricsSelector.tsx` - Seletor de métricas completo
- `components/dashboard/MainMetricsSelector.tsx` - Seletor de métricas principais
- Interface organizada por categorias

## 📊 Benefícios da Implementação

### **Análise Completa**
- **50+ métricas** vs 12 anteriores (aumento de 317%)
- Cobertura completa de todos os aspectos das campanhas
- Análise detalhada por categoria

### **Flexibilidade**
- Métricas organizadas por objetivo de campanha
- Seleção personalizada de métricas
- Interface intuitiva e organizada

### **Competitividade**
- Paridade com ferramentas como UTMify
- Análise mais profunda que concorrentes
- Dados completos para tomada de decisão

## 🚀 Próximos Passos

1. **Teste das Métricas** - Verificar funcionamento com dados reais
2. **Otimização de Performance** - Cache para métricas pesadas
3. **Relatórios Avançados** - Exportação e análise comparativa
4. **Alertas Inteligentes** - Notificações baseadas em métricas específicas

## 📝 Notas Importantes

- Todas as métricas são compatíveis com a API v23.0 do Facebook
- Algumas métricas podem não estar disponíveis para todos os tipos de campanha
- Recomenda-se testar com dados reais para validar disponibilidade
- Métricas de qualidade e ranking podem variar conforme a região

---

**Total de Métricas Implementadas: 50+**
**Categorias: 10**
**Objetivos de Campanha Suportados: 6**
