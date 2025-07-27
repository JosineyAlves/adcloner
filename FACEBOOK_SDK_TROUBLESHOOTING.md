# 🔧 Facebook SDK Troubleshooting Guide

## 🚨 Problemas Identificados

### 1. **Erro: Failed to load resource: net::ERR_NAME_NOT_RESOLVED**
- **Causa**: Problemas de DNS ou conectividade com `connect.facebook.net`
- **Solução**: Verificar conectividade de internet e DNS

### 2. **Erro: Erro ao carregar script do Facebook**
- **Causa**: Script não consegue carregar do CDN do Facebook
- **Solução**: Implementar fallback e melhor tratamento de erros

### 3. **Botão "Conectar Facebook" não clicável**
- **Causa**: SDK não carregado ou função `isSDKReady()` retornando false
- **Solução**: Remover dependência do SDK para habilitar o botão

## 🔧 Soluções Implementadas

### ✅ **1. Dados Fictícios Removidos**
- Settings page agora busca dados reais da API
- Contador de contas conectadas é dinâmico
- Interface sincronizada com dados reais

### ✅ **2. Facebook SDK Melhorado**
- Logs detalhados para debugging
- Verificação periódica de carregamento
- Melhor tratamento de erros
- Fallback para casos de falha

### ✅ **3. Botão de Conexão Corrigido**
- Removida dependência do SDK para habilitar botão
- Logs de debug adicionados
- Melhor feedback visual

## 🧪 Como Testar

### **1. Verificar Console do Navegador**
```javascript
// Procure por estas mensagens:
✅ Script do Facebook carregado com sucesso
✅ Facebook SDK inicializado com sucesso
🔍 SDK Status: Pronto
```

### **2. Testar Conectividade**
```bash
# No terminal, teste se consegue acessar o Facebook
curl -I https://connect.facebook.net/en_US/sdk.js
```

### **3. Verificar Variáveis de Ambiente**
```bash
# Execute o script de teste
node scripts/test-facebook-sdk-integration.js
```

## 🔍 Diagnóstico de Problemas

### **Problema: SDK não carrega**
**Sintomas:**
- Erro `net::ERR_NAME_NOT_RESOLVED`
- Console mostra "Erro ao carregar script do Facebook"

**Soluções:**
1. **Verificar DNS:**
   ```bash
   nslookup connect.facebook.net
   ```

2. **Testar conectividade:**
   ```bash
   ping connect.facebook.net
   ```

3. **Usar DNS alternativo:**
   - Google DNS: 8.8.8.8, 8.8.4.4
   - Cloudflare DNS: 1.1.1.1, 1.0.0.1

### **Problema: App ID não reconhecido**
**Sintomas:**
- Erro "NEXT_PUBLIC_FACEBOOK_APP_ID não configurado"
- SDK não inicializa

**Soluções:**
1. **Verificar variáveis de ambiente:**
   ```env
   NEXT_PUBLIC_FACEBOOK_APP_ID=4146589882096422
   FACEBOOK_APP_SECRET=7c850da81330320a1d09376f1d4adf7f
   NEXT_PUBLIC_FACEBOOK_CONFIG_ID=621387444316240
   ```

2. **Verificar se o App ID está correto:**
   - Acesse: https://developers.facebook.com/apps/
   - Confirme o App ID: `4146589882096422`

### **Problema: Domínio não autorizado**
**Sintomas:**
- Erro "App not available"
- Login não funciona

**Soluções:**
1. **Adicionar domínio no Facebook App:**
   - Settings > Basic > App Domains
   - Adicionar: `adcloner.vercel.app`

2. **Configurar OAuth Redirect URIs:**
   - Facebook Login > Settings
   - Valid OAuth Redirect URIs:
     - `https://adcloner.vercel.app/api/auth/callback/facebook`
     - `https://adcloner.vercel.app`

## 🚀 Próximos Passos

### **1. Testar Integração Atual**
```bash
# 1. Acesse: https://adcloner.vercel.app
# 2. Abra Console (F12)
# 3. Procure por logs do Facebook SDK
# 4. Tente conectar uma conta
```

### **2. Implementar Fallback**
Se o SDK não carregar, implementar:
- Login via popup direto
- OAuth flow alternativo
- Mensagem de erro clara

### **3. Melhorar UX**
- Loading states mais claros
- Mensagens de erro específicas
- Retry automático em caso de falha

## 📊 Status Atual

### ✅ **Implementado:**
- Dados fictícios removidos
- SDK Facebook melhorado
- Botão de conexão corrigido
- Logs de debug detalhados
- Script de teste criado

### 🔄 **Em Progresso:**
- Teste da integração atual
- Diagnóstico de problemas específicos
- Implementação de fallbacks

### 📋 **Próximas Ações:**
1. Testar integração no navegador
2. Identificar problemas específicos
3. Implementar soluções baseadas nos resultados
4. Validar funcionamento completo

## 🆘 Suporte

Se ainda houver problemas:

1. **Execute o script de teste:**
   ```bash
   node scripts/test-facebook-sdk-integration.js
   ```

2. **Verifique os logs no console do navegador**

3. **Teste a conectividade:**
   ```bash
   curl -I https://connect.facebook.net/en_US/sdk.js
   ```

4. **Verifique as variáveis de ambiente no Vercel**

5. **Confirme se o domínio está autorizado no Facebook App** 