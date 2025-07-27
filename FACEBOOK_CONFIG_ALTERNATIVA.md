# 🔧 Configuração Alternativa - Sem public_profile

## 🎯 Objetivo
Testar a integração do AdCloner Pro sem a permissão `public_profile` que requer acesso avançado.

## 📋 Passos no Facebook Developers

### 1. **Criar Nova Configuração**
1. Acesse: https://developers.facebook.com/apps/[SEU_APP_ID]/fb-login/settings/
2. Clique em **"Adicionar"** na seção "Configurações"
3. Nome: `AdCloner Pro - Teste`
4. Clique em **"Criar"**

### 2. **Configurar Permissões (SEM public_profile)**
Na nova configuração, adicione apenas estas permissões:

#### **Permissões Básicas:**
- ✅ `ads_management` - Gerenciar anúncios
- ✅ `ads_read` - Ler dados de anúncios  
- ✅ `business_management` - Gerenciar negócios
- ✅ `pages_show_list` - Ver páginas
- ✅ `pages_read_engagement` - Ler engajamento
- ✅ `pages_manage_metadata` - Gerenciar metadados

#### **Permissões NÃO incluir:**
- ❌ `public_profile` - (requer acesso avançado)
- ❌ `email` - (requer acesso avançado)

### 3. **Configurar URLs**
Na nova configuração:

#### **URLs de Redirecionamento:**
```
https://adcloner.vercel.app/api/auth/callback/facebook
```

#### **Domínios Permitidos:**
```
https://adcloner.vercel.app
```

### 4. **Obter Config ID**
1. Após criar a configuração, você receberá um **Config ID**
2. Copie este ID para usar no `.env.local`

## 🔧 Atualizar Variáveis de Ambiente

### **Local (.env.local):**
```env
NEXT_PUBLIC_FACEBOOK_APP_ID=4146589882096422
FACEBOOK_APP_SECRET=7c850da81330320a1d09376f1d4adf7f
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=NOVO_CONFIG_ID_AQUI
NEXT_PUBLIC_APP_URL=https://adcloner.vercel.app
NEXT_PUBLIC_APP_NAME=AdCloner Pro
```

### **Vercel (Environment Variables):**
```
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=NOVO_CONFIG_ID_AQUI
```

## 🧪 Testar Integração

### **1. Teste Local:**
```bash
npm run dev
```
Acesse: http://localhost:3000

### **2. Teste Produção:**
Acesse: https://adcloner.vercel.app

### **3. Fluxo de Teste:**
1. Clique "Conectar Facebook"
2. Popup deve abrir sem erro
3. Autorize as permissões
4. Deve retornar ao dashboard
5. Verificar se as funcionalidades principais funcionam

## ✅ Funcionalidades Esperadas

### **Funcionando:**
- ✅ Conectar contas de anúncios
- ✅ Ver campanhas
- ✅ Clonar campanhas
- ✅ Gerenciar templates
- ✅ Todas as funcionalidades principais

### **Limitado:**
- ⚠️ Nome do usuário não aparecerá personalizado
- ⚠️ Interface mais genérica

## 🔄 Voltar para Configuração Completa

Após testar, você pode:
1. Solicitar acesso avançado para `public_profile`
2. Ou manter esta configuração se funcionar bem

## 🆘 Solução de Problemas

### **Erro "App não disponível":**
- Verificar se o Config ID está correto
- Verificar se as URLs estão configuradas
- Verificar se as permissões estão corretas

### **Erro de callback:**
- Verificar se a URL de callback está correta
- Verificar se o domínio está permitido 