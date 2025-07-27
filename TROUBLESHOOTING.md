# 🔧 Troubleshooting - Facebook SDK

## 🚨 Erro: "e is not iterable"

### **Problema:**
```
TypeError: e is not iterable
at page-41c03f9db09c5d6b.js:44:15054
```

### **Causa:**
Erro no `useState` relacionado à inicialização de estados.

### **Solução:**
✅ **Corrigido** - Adicionado tipagem explícita nos `useState`:

```typescript
// Antes (problemático)
const [isConnecting, setIsConnecting] = useState(false)

// Depois (corrigido)
const [isConnecting, setIsConnecting] = useState<boolean>(false)
```

## 🔍 Verificar Configuração

### **1. Executar Script de Verificação:**
```bash
node scripts/check-facebook-sdk-config.js
```

### **2. Testar SDK:**
```bash
node scripts/test-facebook-sdk.js
```

### **3. Verificar no Navegador:**
1. Abra o console (F12)
2. Digite: `console.log(window.FB)`
3. Deve retornar um objeto, não `undefined`

## 🚨 Problemas Comuns

### **1. "SDK não está carregado"**

**Sintomas:**
- Erro: "SDK do Facebook não está carregado"
- `window.FB` é `undefined`

**Soluções:**
1. **Verificar script:**
   ```javascript
   // No console do navegador
   console.log(document.querySelector('script[src*="connect.facebook.net"]'))
   ```

2. **Verificar variáveis:**
   ```javascript
   console.log('App ID:', process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)
   ```

3. **Recarregar página:**
   - Pressione Ctrl+F5 (hard refresh)
   - Teste em modo incógnito

### **2. "Config ID não configurado"**

**Sintomas:**
- Erro: "Config ID não configurado"
- Login não inicia

**Soluções:**
1. **Verificar .env.local:**
   ```env
   NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui
   ```

2. **Verificar no Facebook:**
   - App deve ser do tipo "Empresa"
   - Login para Empresas deve estar ativo
   - Configuração deve estar criada

### **3. "Login falhou"**

**Sintomas:**
- Login inicia mas falha
- Usuário é redirecionado mas não conecta

**Soluções:**
1. **Verificar URLs de redirecionamento:**
   ```
   https://adcloner.vercel.app/api/auth/callback/facebook
   http://localhost:3000/api/auth/callback/facebook
   ```

2. **Verificar permissões:**
   - `ads_management`
   - `ads_read`
   - `public_profile`
   - `email`

3. **Verificar config_id:**
   - Deve ser o ID correto da configuração
   - Não deve ter espaços extras

### **4. "Application error"**

**Sintomas:**
- Página de erro do Next.js
- Erro no lado do cliente

**Soluções:**
1. **Verificar console do navegador**
2. **Verificar logs do servidor**
3. **Limpar cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

## 🔧 Debugging Avançado

### **1. Logs Detalhados**

Adicione logs no console:

```javascript
// No ConnectFacebookModal.tsx
console.log('SDK Status:', isSDKReady())
console.log('Config ID:', process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID)
console.log('App ID:', process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)
```

### **2. Verificar Rede**

No DevTools > Network:
1. Verifique se o script do Facebook carrega
2. Verifique se não há erros 404/403
3. Verifique se não há bloqueadores

### **3. Testar em Modo Incógnito**

1. Abra navegador em modo incógnito
2. Acesse: http://localhost:3000
3. Teste o login
4. Verifique se funciona

## 📋 Checklist de Verificação

### **Configuração do Facebook:**
- [ ] App é do tipo "Empresa"
- [ ] Login para Empresas está ativo
- [ ] Configuração criada com config_id
- [ ] URLs de redirecionamento configuradas
- [ ] Permissões adicionadas

### **Variáveis de Ambiente:**
- [ ] `NEXT_PUBLIC_FACEBOOK_APP_ID` configurado
- [ ] `NEXT_PUBLIC_FACEBOOK_CONFIG_ID` configurado
- [ ] `NEXT_PUBLIC_APP_URL` configurado

### **Código:**
- [ ] FacebookSDK component carregado
- [ ] useState com tipagem explícita
- [ ] Tratamento de erros implementado
- [ ] Logs de debugging ativos

### **Navegador:**
- [ ] Console sem erros JavaScript
- [ ] Script do Facebook carregado
- [ ] `window.FB` disponível
- [ ] Login funcionando

## 🚀 Comandos Úteis

### **Verificar Configuração:**
```bash
node scripts/check-facebook-sdk-config.js
```

### **Testar SDK:**
```bash
node scripts/test-facebook-sdk.js
```

### **Limpar Cache:**
```bash
rm -rf .next
npm run dev
```

### **Verificar Build:**
```bash
npm run build
```

## 📞 Suporte

Se ainda houver problemas:

1. **Coletar informações:**
   - Screenshot do erro
   - Logs do console
   - Configuração do Facebook App

2. **Testar em ambiente limpo:**
   - Navegador diferente
   - Modo incógnito
   - Dispositivo diferente

3. **Verificar documentação:**
   - [FACEBOOK_SDK_SETUP.md](./FACEBOOK_SDK_SETUP.md)
   - [Documentação oficial do Facebook](https://developers.facebook.com/docs/facebook-login/facebook-login-for-businesses/)

## 🎯 Próximos Passos

Após resolver o problema:

1. **Implementar armazenamento de tokens**
2. **Adicionar logout**
3. **Implementar refresh de tokens**
4. **Adicionar validação de permissões**
5. **Implementar tratamento de erros avançado** 