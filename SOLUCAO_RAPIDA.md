# 🚀 Solução Rápida - Erro "App não está disponível"

## ❌ Problema Identificado
O erro "Este app precisa pelo menos do supported permission" indica que:
1. O app do Facebook não tem as permissões necessárias
2. O arquivo `.env.local` não existe ou está mal configurado
3. O app pode estar inativo ou mal configurado

## ✅ Solução Imediata

### 1. Criar arquivo .env.local
Crie um arquivo `.env.local` na raiz do projeto com:

```env
# Facebook App Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AdCloner Pro
```

### 2. Configurar App no Facebook Developers

#### 2.1. Acessar Facebook Developers
1. Vá para: https://developers.facebook.com/
2. Faça login com sua conta
3. Clique em "Meus Apps"

#### 2.2. Criar/Configurar App
1. Clique em "Criar App" (se não existir)
2. Escolha "Business" como tipo
3. Nome: "AdCloner Pro"

#### 2.3. Adicionar Produtos
1. **Facebook Login**
   - Clique em "Adicionar Produto"
   - Selecione "Facebook Login"
   - Clique em "Configurar"

2. **Marketing API**
   - Clique em "Adicionar Produto"
   - Selecione "Marketing API"
   - Clique em "Configurar"

#### 2.4. Configurar URLs
Em "Facebook Login" > "Configurações":

**URLs de Redirecionamento OAuth Válidas:**
```
http://localhost:3000/api/auth/callback/facebook
```

**URL do Site:**
```
http://localhost:3000
```

#### 2.5. Adicionar Permissões OBRIGATÓRIAS
Em "Facebook Login" > "Permissões e Recursos":

**Permissões de Anúncios:**
- ✅ `ads_management`
- ✅ `ads_read`
- ✅ `business_management`

**Permissões de Páginas:**
- ✅ `pages_show_list`
- ✅ `pages_read_engagement`
- ✅ `pages_manage_metadata`

**Permissões Básicas:**
- ✅ `public_profile` (já incluída)
- ✅ `email` (já incluída)

### 3. Obter Credenciais

#### 3.1. App ID
1. Vá para "Configurações" > "Básico"
2. Copie o "App ID"

#### 3.2. App Secret
1. Vá para "Configurações" > "Básico"
2. Clique em "Mostrar" ao lado de "App Secret"
3. Copie o "App Secret"

### 4. Atualizar .env.local
Substitua os valores no arquivo `.env.local`:

```env
NEXT_PUBLIC_FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef123456789abcdef123456789ab
```

### 5. Testar
1. Reinicie o servidor: `npm run dev`
2. Acesse: http://localhost:3000
3. Tente conectar com o Facebook

## 🔧 Verificação Rápida

Execute este comando para verificar se tudo está configurado:

```bash
node scripts/check-facebook-config.js
```

## 🚨 Problemas Comuns

### "App não está disponível"
- Verifique se o app está ativo em "Configurações" > "Básico"
- Certifique-se de que você é administrador do app

### "Permissões não suportadas"
- Adicione TODAS as permissões listadas acima
- Certifique-se de que o app está em modo de desenvolvimento

### "URL de redirecionamento inválida"
- Verifique se a URL está exatamente como mostrado acima
- Não adicione espaços extras

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do servidor no terminal
3. Confirme que todas as permissões foram adicionadas
4. Teste com uma conta de administrador do app

## ✅ Checklist Final

- [ ] App criado no Facebook Developers
- [ ] Facebook Login adicionado
- [ ] Marketing API adicionado
- [ ] URLs configuradas corretamente
- [ ] Todas as permissões adicionadas
- [ ] App ID e Secret configurados no .env.local
- [ ] Servidor reiniciado
- [ ] Teste de conexão realizado 