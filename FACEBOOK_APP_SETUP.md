# Configuração do Facebook App para AdCloner Pro

## 🚀 Passo a Passo para Configurar

### 1. Criar App no Facebook Developers

1. Acesse: https://developers.facebook.com/
2. Clique em **"Criar App"**
3. Selecione **"Business"**
4. Preencha as informações:
   - **Nome do App:** AdCloner Pro
   - **Email de contato:** seu@email.com
   - **Categoria:** Business

### 2. Configurar Facebook Login

1. No painel do app, vá em **"Adicionar Produto"**
2. Clique em **"Facebook Login"**
3. Selecione **"Web"**
4. Configure as URLs:

#### URLs de Redirecionamento OAuth Válidas:
```
http://localhost:3000/api/auth/callback/facebook
https://seu-dominio.com/api/auth/callback/facebook
```

#### Domínios de App Válidos:
```
localhost
seu-dominio.com
```

### 3. Configurar Permissões

1. Vá em **"Facebook Login"** → **"Configurações"**
2. Em **"Permissões e Recursos"**, adicione:
   - ✅ `ads_read`
   - ✅ `ads_management`
   - ✅ `public_profile`
   - ✅ `email`

### 4. Configurar App ID

1. Copie o **App ID** do painel
2. Crie arquivo `.env.local`:
```bash
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
```

### 5. Configurar App Review (Opcional)

Para produção, você precisa:
1. **Submeter** o app para revisão
2. **Explicar** o uso das permissões
3. **Aguardar** aprovação do Facebook

## 🔧 Configuração para Desenvolvimento

### URLs Necessárias:
```
http://localhost:3000/api/auth/callback/facebook
```

### Permissões Mínimas:
- `ads_read`
- `ads_management`
- `public_profile`
- `email`

## 🚨 Solução de Problemas

### Erro: "URL bloqueada"
**Solução:**
1. Verifique se a URL está em **"URLs de Redirecionamento OAuth Válidas"**
2. Certifique-se de que o domínio está em **"Domínios de App Válidos"**
3. Use `http://localhost:3000` para desenvolvimento

### Erro: "Permissões não autorizadas"
**Solução:**
1. Adicione as permissões em **"Permissões e Recursos"**
2. Para desenvolvimento, use **"Usuários de Teste"**
3. Para produção, submeta para **App Review**

### Erro: "App não encontrado"
**Solução:**
1. Verifique se o **App ID** está correto
2. Certifique-se de que o app está **ativo**
3. Verifique se está no **modo correto** (desenvolvimento/produção)

## 📋 Checklist de Configuração

- [ ] App criado no Facebook Developers
- [ ] Facebook Login adicionado
- [ ] URLs de redirecionamento configuradas
- [ ] Permissões adicionadas
- [ ] App ID configurado no .env.local
- [ ] Usuários de teste adicionados (desenvolvimento)
- [ ] App Review submetido (produção)

## 🔗 Links Úteis

- **Facebook Developers:** https://developers.facebook.com/
- **App Review Guidelines:** https://developers.facebook.com/docs/app-review/
- **OAuth Documentation:** https://developers.facebook.com/docs/facebook-login/

## 💡 Dicas

1. **Para desenvolvimento:** Use usuários de teste
2. **Para produção:** Submeta para App Review
3. **URLs:** Sempre use HTTPS em produção
4. **Permissões:** Solicite apenas o necessário
5. **Teste:** Sempre teste em ambiente de desenvolvimento primeiro 