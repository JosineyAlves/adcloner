# 🔗 Configuração de URLs Obrigatórias - Facebook Developers

## ⚠️ IMPORTANTE: URLs Obrigatórias para Apps do Tipo "Empresa"

Para apps do tipo "Empresa", o Facebook exige que você configure URLs específicas. Aqui está o guia completo:

## 📋 URLs Obrigatórias

### 1. URL de Política de Privacidade
**OBRIGATÓRIO** - O Facebook exige uma URL de política de privacidade válida.

**URLs aceitas:**
```
http://localhost:3000/privacy-policy.html
https://seu-dominio.vercel.app/privacy-policy.html
```

### 2. URL de Termos de Serviço
**OBRIGATÓRIO** - O Facebook exige uma URL de termos de serviço válida.

**URLs aceitas:**
```
http://localhost:3000/terms-of-service.html
https://seu-dominio.vercel.app/terms-of-service.html
```

### 3. URLs de Redirecionamento OAuth
**OBRIGATÓRIO** - Para o Login do Facebook para Empresas.

**URLs aceitas:**
```
http://localhost:3000/api/auth/callback/facebook
https://seu-dominio.vercel.app/api/auth/callback/facebook
```

### 4. URL do Site
**OBRIGATÓRIO** - URL principal do seu aplicativo.

**URLs aceitas:**
```
http://localhost:3000
https://seu-dominio.vercel.app
```

## 🔧 Como Configurar no Facebook Developers

### Passo 1: Acessar Configurações do App
1. Vá para [developers.facebook.com](https://developers.facebook.com)
2. Selecione seu app
3. No menu esquerdo, clique em **"Configurações"**
4. Clique em **"Básico"**

### Passo 2: Configurar URLs Obrigatórias

#### 2.1. URL de Política de Privacidade
1. Role até a seção **"URL de Política de Privacidade"**
2. Adicione: `http://localhost:3000/privacy-policy.html`
3. Clique em **"Salvar Alterações"**

#### 2.2. URL de Termos de Serviço
1. Role até a seção **"URL de Termos de Serviço"**
2. Adicione: `http://localhost:3000/terms-of-service.html`
3. Clique em **"Salvar Alterações"**

### Passo 3: Configurar Login do Facebook para Empresas

#### 3.1. URLs de Redirecionamento
1. No menu esquerdo, clique em **"Login do Facebook para Empresas"**
2. Clique em **"Configurações"**
3. Em **"URLs de Redirecionamento OAuth Válidas"**, adicione:
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://seu-dominio.vercel.app/api/auth/callback/facebook
   ```

#### 3.2. URL do Site
1. Na mesma página, em **"URL do Site"**, adicione:
   ```
   http://localhost:3000
   https://seu-dominio.vercel.app
   ```

## 📄 Arquivos Criados

Criei os seguintes arquivos para você:

### 1. Política de Privacidade
- **Arquivo:** `privacy-policy.html`
- **URL:** `http://localhost:3000/privacy-policy.html`
- **Conteúdo:** Política de privacidade completa para o AdCloner Pro

### 2. Termos de Serviço
- **Arquivo:** `terms-of-service.html`
- **URL:** `http://localhost:3000/terms-of-service.html`
- **Conteúdo:** Termos de serviço completos para o AdCloner Pro

## 🚀 Como Testar

### 1. Iniciar o Servidor
```bash
npm run dev
```

### 2. Verificar URLs
Acesse as URLs para verificar se estão funcionando:
- http://localhost:3000/privacy-policy.html
- http://localhost:3000/terms-of-service.html

### 3. Testar Integração
1. Acesse: http://localhost:3000
2. Tente conectar com o Facebook
3. Verifique se não há mais erros de URL

## 🚨 Problemas Comuns

### "URL de política de privacidade inválida"
- ✅ Verifique se o arquivo `privacy-policy.html` existe
- ✅ Confirme se o servidor está rodando
- ✅ Teste a URL no navegador

### "URL de termos de serviço inválida"
- ✅ Verifique se o arquivo `terms-of-service.html` existe
- ✅ Confirme se o servidor está rodando
- ✅ Teste a URL no navegador

### "URL de redirecionamento inválida"
- ✅ Verifique se a rota `/api/auth/callback/facebook` existe
- ✅ Confirme se não há espaços extras na URL
- ✅ Teste se o servidor está rodando

## 📋 Checklist de URLs

- [ ] URL de Política de Privacidade configurada
- [ ] URL de Termos de Serviço configurada
- [ ] URLs de Redirecionamento OAuth configuradas
- [ ] URL do Site configurada
- [ ] Arquivos HTML criados e funcionando
- [ ] Servidor rodando e URLs acessíveis
- [ ] Teste de integração realizado

## 🔗 Links Úteis

- **Facebook Developers:** https://developers.facebook.com/
- **Política de Privacidade:** http://localhost:3000/privacy-policy.html
- **Termos de Serviço:** http://localhost:3000/terms-of-service.html

## 💡 Dicas

1. **Para desenvolvimento:** Use `http://localhost:3000`
2. **Para produção:** Use `https://seu-dominio.vercel.app`
3. **Sempre teste:** Verifique se as URLs estão acessíveis
4. **Mantenha atualizado:** Revise as políticas periodicamente
5. **Conformidade:** Certifique-se de que as políticas estão em conformidade com LGPD 