# 🚀 Configurando URL Real para Desenvolvimento

## ❌ Problema Atual

O Facebook está bloqueando `localhost` com o erro:
```
URL bloqueada: O redirecionamento falhou porque o URl usado não está na lista de liberação nas configurações de OAuth do cliente do app.
```

## ✅ Soluções

### Opção 1: ngrok (Recomendado)

**ngrok** cria um túnel seguro para seu localhost, gerando uma URL pública.

#### 1. Instalar ngrok
```bash
# Via npm
npm install -g ngrok

# Ou baixar de https://ngrok.com/download
```

#### 2. Iniciar o projeto
```bash
npm run dev
# Servidor rodando em http://localhost:3000
```

#### 3. Criar túnel com ngrok
```bash
ngrok http 3000
```

#### 4. Configurar Facebook App
1. Acesse: https://developers.facebook.com/
2. Vá no seu app → **Facebook Login** → **Settings**
3. Em **Valid OAuth Redirect URIs**, adicione:
   ```
   https://seu-tunnel.ngrok.io/api/auth/callback/facebook
   ```
4. Em **App Domains**, adicione:
   ```
   seu-tunnel.ngrok.io
   ```

#### 5. Atualizar variáveis de ambiente
```bash
# .env.local
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret
NEXT_PUBLIC_APP_URL=https://seu-tunnel.ngrok.io
```

### Opção 2: Vercel (Alternativa)

Deploy automático no Vercel para desenvolvimento.

#### 1. Conectar com GitHub
```bash
# Push para GitHub
git add .
git commit -m "Setup for real URL"
git push origin main
```

#### 2. Deploy no Vercel
1. Acesse: https://vercel.com/
2. **New Project** → Import do GitHub
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** .next

#### 3. Configurar variáveis de ambiente
No Vercel Dashboard:
```
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

#### 4. Configurar Facebook App
```
https://seu-projeto.vercel.app/api/auth/callback/facebook
```

### Opção 3: Netlify (Alternativa)

Similar ao Vercel.

#### 1. Deploy no Netlify
1. Acesse: https://netlify.com/
2. **New site from Git**
3. Conecte com GitHub
4. Configure build:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

## 🔧 Configuração do Facebook App

### 1. Criar App
1. https://developers.facebook.com/
2. **Create App** → **Business**
3. Preencha dados básicos

### 2. Configurar Facebook Login
1. **Add Product** → **Facebook Login**
2. **Platform** → **Web**
3. **Site URL:** `https://sua-url.com`
4. **Valid OAuth Redirect URIs:**
   ```
   https://sua-url.com/api/auth/callback/facebook
   ```

### 3. Configurar Permissões
1. **App Review** → **Permissions and Features**
2. Adicione permissões:
   - `ads_read`
   - `ads_management`
   - `public_profile`
   - `email`
   - `pages_show_list`

### 4. Configurar App Domains
1. **Settings** → **Basic**
2. **App Domains:** `sua-url.com`
3. **Privacy Policy URL:** `https://sua-url.com/privacy`

## 🧪 Teste

### 1. Verificar Configuração
```bash
# Teste se a URL está funcionando
curl https://sua-url.com/api/facebook/accounts
```

### 2. Testar Conexão
1. Acesse: `https://sua-url.com`
2. **Contas** → **Conectar Conta**
3. Teste o popup do Facebook

### 3. Debug
```bash
# Logs do ngrok
ngrok http 3000 --log=stdout

# Logs do Next.js
npm run dev
```

## 🔒 Segurança

### Para Desenvolvimento
- ✅ Use HTTPS (ngrok/Vercel/Netlify já fornecem)
- ✅ Configure CORS adequadamente
- ✅ Use variáveis de ambiente

### Para Produção
- ✅ Domínio próprio
- ✅ SSL certificado
- ✅ Rate limiting
- ✅ Monitoramento

## 📝 Checklist

- [ ] URL pública configurada (ngrok/Vercel/Netlify)
- [ ] Facebook App criado
- [ ] URLs de redirecionamento configuradas
- [ ] Permissões adicionadas
- [ ] Variáveis de ambiente atualizadas
- [ ] Teste de conexão realizado
- [ ] Logs verificados

## 🚨 Troubleshooting

### Erro: "URL bloqueada"
- ✅ Verificar se a URL está nas configurações do Facebook App
- ✅ Verificar se o domínio está em App Domains
- ✅ Verificar se o app está em modo de desenvolvimento

### Erro: "Popup bloqueado"
- ✅ Permitir popups no navegador
- ✅ Verificar se a URL é HTTPS
- ✅ Verificar se o domínio é válido

### Erro: "Permissões insuficientes"
- ✅ Adicionar permissões no Facebook App
- ✅ Solicitar permissões corretas no OAuth
- ✅ Verificar se o app foi aprovado

## 🎯 Próximos Passos

1. **Configure uma URL real** usando ngrok
2. **Atualize o Facebook App** com a nova URL
3. **Teste a conexão** completa
4. **Implemente o banco de dados** para salvar tokens
5. **Configure monitoramento** e logs

---

**Nota:** Para desenvolvimento, recomendamos usar **ngrok** por ser mais rápido e simples. Para produção, use um domínio próprio. 