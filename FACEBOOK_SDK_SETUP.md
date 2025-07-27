# 🚀 Configuração do Facebook SDK com Login para Empresas

## 📋 Pré-requisitos

- App do Facebook do tipo **"Empresa"**
- Produto **"Login do Facebook para Empresas"** ativo
- Configuração criada com **config_id**

## 🔧 Passo a Passo

### 1. Configurar App do Facebook

#### 1.1. Criar/Configurar App
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um app do tipo **"Empresa"** (obrigatório)
3. Nome: "AdCloner Pro"

#### 1.2. Adicionar Produto
1. No painel do app, vá para **"Produtos"**
2. Clique em **"Adicionar Produto"**
3. Selecione **"Login do Facebook para Empresas"**
4. Clique em **"Configurar"**

#### 1.3. Criar Configuração
1. No menu esquerdo, clique em **"Configurações"**
2. Clique em **"+ Criar configuração"**
3. Configure:

**Informações Básicas:**
- Nome: "AdCloner Pro Config"
- Tipo de token: "Token de acesso do usuário"

**Selecionar Ativos:**
- ✅ Contas de anúncios
- ✅ Páginas do Facebook
- ✅ Pixels da Meta

**Selecionar Permissões:**
- ✅ `ads_management`
- ✅ `ads_read`
- ✅ `public_profile`
- ✅ `email`

#### 1.4. Obter Config ID
Após criar a configuração, copie o **Config ID** que será usado no código.

### 2. Configurar URLs de Redirecionamento

Em **"Login do Facebook para Empresas"** > **"Configurações"**:

**URLs de Redirecionamento OAuth Válidas:**
```
https://adcloner.vercel.app/api/auth/callback/facebook
http://localhost:3000/api/auth/callback/facebook
```

**URL do Site:**
```
https://adcloner.vercel.app
http://localhost:3000
```

### 3. Configurar Variáveis de Ambiente

Crie o arquivo `.env.local`:

```env
# Facebook App Configuration (Login para Empresas)
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=https://adcloner.vercel.app
NEXT_PUBLIC_APP_NAME=AdCloner Pro
```

### 4. Verificar Configuração

Execute o script de verificação:

```bash
node scripts/check-facebook-sdk-config.js
```

### 5. Testar Integração

1. **Iniciar servidor:**
```bash
npm run dev
```

2. **Acessar aplicação:**
```
http://localhost:3000
```

3. **Testar login:**
- Clique em "Conectar Facebook"
- Verifique o console do navegador para logs
- Confirme se o login funciona

## 🔍 Debugging

### Verificar SDK
Abra o console do navegador e digite:
```javascript
console.log('FB SDK:', window.FB)
```

### Verificar Configuração
```javascript
console.log('App ID:', process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)
console.log('Config ID:', process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID)
```

### Logs de Login
O SDK gera logs detalhados no console:
- `Facebook SDK inicializado`
- `Status de login: {status: "connected"}`
- `Informações do usuário: {id, name, email}`

## 🚨 Problemas Comuns

### "SDK não está carregado"
- Verifique se o script do Facebook está sendo carregado
- Confirme se não há bloqueadores de script

### "Config ID não configurado"
- Verifique se `NEXT_PUBLIC_FACEBOOK_CONFIG_ID` está definido
- Confirme se a configuração foi criada no Facebook

### "Login falhou"
- Verifique se o app é do tipo "Empresa"
- Confirme se o Login para Empresas está ativo
- Verifique as URLs de redirecionamento

### "Permissões não concedidas"
- Confirme se todas as permissões foram adicionadas na configuração
- Verifique se o usuário concedeu as permissões

## 📊 Diferenças do Login para Empresas

### Antes (Login Normal):
```javascript
FB.login(function(response) {
  // ...
}, {
  scope: 'ads_read,ads_management,public_profile,email'
})
```

### Agora (Login para Empresas):
```javascript
FB.login(function(response) {
  // ...
}, {
  config_id: 'CONFIG_ID',
  response_type: 'code',
  override_default_response_type: true
})
```

## ✅ Checklist Final

- [ ] App criado como tipo "Empresa"
- [ ] Login do Facebook para Empresas adicionado
- [ ] Configuração criada com config_id
- [ ] Permissões configuradas
- [ ] URLs de redirecionamento configuradas
- [ ] Variáveis de ambiente definidas
- [ ] SDK carregado corretamente
- [ ] Login funcionando
- [ ] Informações do usuário obtidas

## 🎯 Próximos Passos

Após a integração funcionar:

1. **Implementar armazenamento de tokens**
2. **Adicionar logout**
3. **Implementar refresh de tokens**
4. **Adicionar tratamento de erros avançado**
5. **Implementar validação de permissões**

## 📞 Suporte

Se ainda houver problemas:

1. Verifique os logs do console
2. Confirme a configuração do Facebook App
3. Teste com uma conta de administrador
4. Verifique se não há bloqueadores de script
5. Teste em modo incógnito 