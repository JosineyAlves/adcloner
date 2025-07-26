# 🔧 Login do Facebook para Empresas - Configuração Completa

## ⚠️ PROBLEMA IDENTIFICADO

O erro **"Este app precisa pelo menos do supported permission"** indica que seu app precisa usar o **Login do Facebook para Empresas**, que é obrigatório para apps do tipo "Empresa".

## 🎯 SOLUÇÃO BASEADA NA DOCUMENTAÇÃO OFICIAL

### 1. Criar App do Tipo "Empresa"

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Clique em **"Criar App"**
3. **IMPORTANTE**: Escolha **"Empresa"** como tipo de app
4. Preencha as informações:
   - Nome: "AdCloner Pro"
   - Email de contato: seu@email.com

### 2. Adicionar Login do Facebook para Empresas

1. No painel do app, vá para **"Produtos"**
2. Clique em **"Adicionar Produto"**
3. Selecione **"Login do Facebook para Empresas"**
4. Clique em **"Configurar"**

### 3. Criar Configuração (OBRIGATÓRIO)

1. No menu esquerdo, clique em **"Configurações"**
2. Clique em **"+ Criar configuração"** ou **"Criar a partir de modelo"**
3. Configure a configuração:

#### 3.1. Informações Básicas
- **Nome da configuração**: "AdCloner Pro Config"
- **Tipo de token**: "Token de acesso do usuário" (para ações em tempo real)

#### 3.2. Selecionar Ativos
Marque os ativos que seu app precisa acessar:
- ✅ **Contas de anúncios**
- ✅ **Páginas do Facebook**
- ✅ **Pixels da Meta**
- ✅ **Catálogos de produtos**
- ✅ **Contas do Instagram**

#### 3.3. Selecionar Permissões
Adicione as permissões compatíveis:

**Permissões de Anúncios:**
- ✅ `ads_management`
- ✅ `ads_read`

**Permissões de Negócios:**
- ✅ `business_management`

**Permissões de Páginas:**
- ✅ `pages_show_list`
- ✅ `pages_read_engagement`
- ✅ `pages_manage_metadata`

**Permissões Básicas (automáticas):**
- ✅ `public_profile`
- ✅ `email`

### 4. Obter Config ID

Após criar a configuração, você receberá um **Config ID**. Este é obrigatório!

1. Copie o **Config ID** da configuração criada
2. Adicione ao seu arquivo `.env.local`:

```env
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui
```

### 5. Configurar URLs de Redirecionamento

Em **"Login do Facebook para Empresas"** > **"Configurações"**:

**URLs de Redirecionamento OAuth Válidas:**
```
http://localhost:3000/api/auth/callback/facebook
https://seu-dominio.vercel.app/api/auth/callback/facebook
```

**URL do Site:**
```
http://localhost:3000
https://seu-dominio.vercel.app
```

### 6. Atualizar Variáveis de Ambiente

Crie/atualize o arquivo `.env.local`:

```env
# Facebook App Configuration (Login para Empresas)
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AdCloner Pro
```

### 7. Testar a Integração

1. Reinicie o servidor: `npm run dev`
2. Acesse: http://localhost:3000
3. Tente conectar com o Facebook

## 🔍 Verificação da Configuração

Execute o script de verificação atualizado:

```bash
node scripts/check-facebook-config.js
```

## 🚨 Problemas Comuns e Soluções

### "App não está disponível"
- ✅ Verifique se o app é do tipo **"Empresa"**
- ✅ Certifique-se de que o app está ativo
- ✅ Confirme que você é administrador do app

### "Configuração não encontrada"
- ✅ Verifique se o `NEXT_PUBLIC_FACEBOOK_CONFIG_ID` está configurado
- ✅ Confirme se a configuração foi criada no Facebook Developers
- ✅ Verifique se o Config ID está correto

### "Permissões não suportadas"
- ✅ Use apenas as permissões listadas na documentação oficial
- ✅ Certifique-se de que o app é do tipo "Empresa"
- ✅ Confirme que está usando `config_id` em vez de `scope`

## 📋 Checklist Obrigatório

- [ ] App criado como tipo **"Empresa"**
- [ ] Login do Facebook para Empresas adicionado
- [ ] Configuração criada com Config ID
- [ ] Todas as permissões compatíveis adicionadas
- [ ] URLs de redirecionamento configuradas
- [ ] `NEXT_PUBLIC_FACEBOOK_CONFIG_ID` configurado
- [ ] Servidor reiniciado
- [ ] Teste de conexão realizado

## 🔗 Links Úteis

- **Documentação Oficial**: https://developers.facebook.com/docs/facebook-login/facebook-login-for-businesses/
- **Painel de Apps**: https://developers.facebook.com/apps/
- **Configurações de App**: https://developers.facebook.com/apps/[SEU_APP_ID]/fb-login/settings/

## 💡 Dicas Importantes

1. **Obrigatório**: Apps do tipo "Empresa" devem usar Login para Empresas
2. **Config ID**: Substitui o parâmetro `scope` na URL de autenticação
3. **Permissões**: Use apenas as permissões compatíveis listadas na documentação
4. **Teste**: Sempre teste em desenvolvimento antes de produção
5. **Reversão**: Você pode reverter para Login normal em até 30 dias

## 🆘 Suporte

Se ainda houver problemas:
1. Verifique se o app é do tipo "Empresa"
2. Confirme se a configuração foi criada corretamente
3. Verifique se o Config ID está correto
4. Teste com uma conta de administrador do app
5. Verifique os logs do console e servidor 