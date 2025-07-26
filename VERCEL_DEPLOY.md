# 🚀 Deploy no Vercel - Próximos Passos

## ✅ GitHub Configurado

O projeto foi enviado com sucesso para: https://github.com/JosineyAlves/adcloner

## 🔧 Configurar Vercel

### **Passo 1: Acessar Vercel**
1. Vá para: https://vercel.com/
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**

### **Passo 2: Importar Repositório**
1. Selecione o repositório: `JosineyAlves/adcloner`
2. Clique em **"Import"**

### **Passo 3: Configurar Projeto**
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### **Passo 4: Configurar Variáveis de Ambiente**
Adicione estas variáveis no Vercel:

```
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_SECRET=seu_facebook_app_secret
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
NEXTAUTH_SECRET=seu_nextauth_secret
NEXTAUTH_URL=https://seu-projeto.vercel.app
```

### **Passo 5: Deploy**
1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://adcloner-xyz.vercel.app`)

## 🔗 Atualizar Facebook App

### **Passo 1: Acessar Facebook Developers**
1. Vá para: https://developers.facebook.com/
2. Selecione seu app

### **Passo 2: Configurar URLs**
```
Site URL: https://seu-projeto.vercel.app

Valid OAuth Redirect URIs:
https://seu-projeto.vercel.app/api/auth/callback/facebook

App Domains:
seu-projeto.vercel.app
```

### **Passo 3: Testar Integração**
1. Acesse sua URL do Vercel
2. Teste o login com Facebook
3. Verifique se não há mais erro de "URL bloqueada"

## 📋 Checklist de Deploy

### **GitHub** ✅
- [x] Repositório criado
- [x] Código enviado
- [x] README.md atualizado

### **Vercel** 🔄
- [ ] Projeto importado
- [ ] Variáveis configuradas
- [ ] Deploy realizado
- [ ] URL obtida

### **Facebook App** 🔄
- [ ] URLs atualizadas
- [ ] OAuth testado
- [ ] Integração funcionando

## 🎯 Próximos Passos

1. **Configure o Vercel** seguindo o guia acima
2. **Atualize o Facebook App** com a nova URL
3. **Teste a integração** completa
4. **Configure monitoramento** e logs

## 🚨 Troubleshooting

### **Erro no Vercel: "Build failed"**
- Verifique se todas as dependências estão no package.json
- Verifique se o build command está correto
- Verifique os logs de erro no Vercel

### **Erro: "URL bloqueada" no Facebook**
- Certifique-se de que a URL do Vercel está configurada no Facebook App
- Verifique se o domínio está na lista de App Domains

### **Erro: "Authentication failed"**
- Verifique se as variáveis de ambiente estão corretas
- Verifique se o Facebook App ID e Secret estão corretos

---

**🎉 Parabéns! O projeto está no GitHub e pronto para deploy no Vercel!** 