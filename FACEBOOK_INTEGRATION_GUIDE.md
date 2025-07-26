# Guia Completo de Integração Facebook/Meta para AdCloner Pro

## 🎯 Baseado na Documentação Oficial do Facebook

Este guia foi criado com base na documentação oficial da API do Facebook/Meta e implementa todas as melhores práticas recomendadas.

## 📋 Índice

1. [Autenticação e Tokens](#autenticação-e-tokens)
2. [Configuração do Facebook App](#configuração-do-facebook-app)
3. [Permissões Necessárias](#permissões-necessárias)
4. [Implementação da API](#implementação-da-api)
5. [Teste e Debug](#teste-e-debug)
6. [Produção](#produção)

## 🔐 Autenticação e Tokens

### Tipos de Access Tokens

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **User Access Token** | Token do usuário logado | Ações em nome do usuário |
| **Page Access Token** | Token de uma página específica | Gerenciar conteúdo da página |
| **App Access Token** | Token do aplicativo | Configurações do app |
| **System User Token** | Token para automação | Ações programáticas |

### Fluxo de Autenticação

```javascript
// 1. Usuário faz login via Facebook OAuth
const popupUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&display=popup`

// 2. Facebook retorna token de curta duração
// 3. Converter para token de longa duração
const longLivedToken = await facebookAPI.exchangeToken(shortLivedToken)

// 4. Salvar token no banco de dados
// 5. Usar token para chamadas da API
```

## ⚙️ Configuração do Facebook App

### 1. Criar App no Facebook Developers

1. Acesse: https://developers.facebook.com/
2. Clique em **"Criar App"**
3. Selecione **"Business"**
4. Preencha:
   - **Nome:** AdCloner Pro
   - **Email:** seu@email.com
   - **Categoria:** Business

### 2. Configurar Facebook Login

1. **Adicionar Produto** → **Facebook Login**
2. **Plataforma** → **Web**
3. **URLs de Redirecionamento OAuth Válidas:**
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://seu-dominio.com/api/auth/callback/facebook
   ```
4. **Domínios de App Válidos:**
   ```
   localhost
   seu-dominio.com
   ```

### 3. Configurar Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔑 Permissões Necessárias

### Permissões Básicas (Obrigatórias)

| Permissão | Descrição | Justificativa |
|-----------|-----------|---------------|
| `ads_read` | Ler dados de anúncios | Dashboard e relatórios |
| `ads_management` | Gerenciar campanhas | Criar e clonar campanhas |
| `public_profile` | Informações básicas | Identificação do usuário |
| `email` | Endereço de email | Comunicação e suporte |

### Permissões Adicionais (Opcionais)

| Permissão | Descrição | Uso |
|-----------|-----------|-----|
| `pages_show_list` | Listar páginas | Seleção de páginas |
| `pages_read_engagement` | Ler engajamento | Analytics de páginas |
| `pages_manage_posts` | Gerenciar posts | Publicação automática |
| `business_management` | Gerenciar Business Manager | Multi-tenant |

## 🚀 Implementação da API

### Classe FacebookAPI

```typescript
// lib/facebook-api.ts
export class FacebookAPI {
  // Autenticação
  async getUserInfo(accessToken: string)
  async exchangeToken(shortLivedToken: string)
  async validateToken(accessToken: string)
  
  // Contas de Anúncios
  async getAdAccounts(userAccessToken: string)
  async getPages(userAccessToken: string)
  async getPixels(userAccessToken: string)
  
  // Campanhas
  async createCampaign(adAccountId: string, accessToken: string, data: any)
  async createAdSet(adAccountId: string, accessToken: string, data: any)
  async createAd(adAccountId: string, accessToken: string, data: any)
  async cloneCampaign(sourceAccountId: string, targetAccountId: string, accessToken: string, campaignId: string)
  
  // Insights
  async getCampaignInsights(campaignId: string, accessToken: string)
}
```

### Endpoints Implementados

```typescript
// APIs do AdCloner Pro
GET  /api/facebook/accounts          // Listar contas
POST /api/facebook/campaigns         // Criar campanha
POST /api/facebook/campaigns/clone   // Clonar campanha
GET  /api/facebook/insights          // Obter insights
GET  /api/auth/callback/facebook     // Callback OAuth
```

## 🧪 Teste e Debug

### 1. Teste de Simulação

```bash
# Usar método de simulação para desenvolvimento
npm run dev
# Acesse: http://localhost:3000
# Vá em: Contas → Conectar Conta
# Use: Método 1 (Simulação)
```

### 2. Teste com Facebook Real

```bash
# 1. Configure o Facebook App
# 2. Adicione URLs de redirecionamento
# 3. Configure permissões
# 4. Teste o popup real
```

### 3. Debug de Tokens

```javascript
// Verificar token
const isValid = await facebookAPI.validateToken(accessToken)

// Obter permissões
const permissions = await facebookAPI.getUserPermissions(accessToken)

// Obter informações do usuário
const userInfo = await facebookAPI.getUserInfo(accessToken)
```

## 🚨 Tratamento de Erros

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `URL bloqueada` | URL não configurada | Adicionar URL nas configurações |
| `Permissões insuficientes` | Permissões não concedidas | Solicitar permissões corretas |
| `Token inválido` | Token expirado | Renovar token |
| `Rate limit` | Muitas requisições | Implementar backoff |

### Implementação de Retry

```typescript
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  throw new Error('Max retries exceeded')
}
```

## 🏭 Produção

### 1. App Review

Para produção, você precisa:

1. **Submeter App Review**
2. **Justificar permissões**
3. **Demonstrar uso**
4. **Aguardar aprovação**

### 2. Configurações de Produção

```bash
# URLs de produção
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_producao
FACEBOOK_APP_SECRET=seu_app_secret_producao

# URLs de redirecionamento
https://seu-dominio.com/api/auth/callback/facebook
```

### 3. Monitoramento

```typescript
// Logs de monitoramento
console.log('Facebook API call:', {
  endpoint: '/me/adaccounts',
  userId: userInfo.id,
  timestamp: new Date().toISOString()
})

// Métricas
- Taxa de sucesso das chamadas
- Tempo de resposta
- Erros por endpoint
- Uso de tokens
```

## 📊 Métricas e Insights

### Implementação de Analytics

```typescript
// Tracking de eventos
async function trackEvent(event: string, data: any) {
  // Enviar para sistema de analytics
  console.log('Event:', event, data)
}

// Métricas importantes
- Número de contas conectadas
- Campanhas criadas
- Clones realizados
- Taxa de sucesso
- Tempo de processamento
```

## 🔒 Segurança

### Boas Práticas

1. **Nunca exponha App Secret** no frontend
2. **Use HTTPS** para todas as comunicações
3. **Valide tokens** antes de cada chamada
4. **Implemente rate limiting** no seu servidor
5. **Log de auditoria** para ações sensíveis

### Armazenamento Seguro

```typescript
// Exemplo de armazenamento seguro
interface UserTokens {
  userId: string
  accessToken: string // Criptografado
  refreshToken?: string
  expiresAt: Date
  permissions: string[]
}
```

## 🚀 Próximos Passos

### Implementações Futuras

1. **Conversions API (CAPI)**
   - Envio de eventos servidor-servidor
   - Melhor atribuição de conversões

2. **Webhooks**
   - Notificações em tempo real
   - Atualizações automáticas

3. **Business Manager API**
   - Gerenciamento de múltiplos clientes
   - Onboarding em escala

4. **Insights Avançados**
   - Relatórios customizados
   - Análise de performance

## 📚 Recursos Adicionais

- [Facebook Developers](https://developers.facebook.com/)
- [Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis/)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review/)
- [Rate Limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/)

---

**Nota:** Este guia é baseado na documentação oficial mais recente do Facebook/Meta. Mantenha-se atualizado com as mudanças da API. 