# 🔧 Configuração da Facebook API

## 📋 Pré-requisitos

1. **Conta de Desenvolvedor do Facebook**
   - Acesse [developers.facebook.com](https://developers.facebook.com)
   - Faça login com sua conta do Facebook
   - Aceite os termos de uso

2. **Aplicativo do Facebook**
   - Crie um novo aplicativo
   - Escolha o tipo "Business" ou "Consumer"
   - Configure as informações básicas

## 🛠️ Configuração do Aplicativo

### 1. Configurações Básicas

1. **Acesse seu aplicativo** no Facebook Developers
2. **Vá em "Configurações" > "Básico"**
3. **Configure:**
   - **Nome do aplicativo**: AdCloner Pro
   - **Domínio do aplicativo**: localhost (desenvolvimento)
   - **Categoria**: Business

### 2. Configurar Facebook Login

1. **Adicione o produto "Facebook Login"**
2. **Configure as URLs:**
   - **URL do site**: `http://localhost:3000`
   - **URI de redirecionamento OAuth válido**: `http://localhost:3000/api/auth/callback/facebook`

### 3. Configurar Permissões

1. **Vá em "Produtos" > "Facebook Login" > "Configurações"**
2. **Adicione as permissões necessárias:**
   ```
   ads_management
   business_management
   pages_show_list
   pages_read_engagement
   pages_manage_ads
   ```

### 4. Configurar App Review (Opcional)

Para usar em produção, você precisa:
1. **Submeter o aplicativo para revisão**
2. **Explicar o uso das permissões**
3. **Fornecer vídeos de demonstração**

## 🔑 Configuração das Variáveis de Ambiente

### 1. Copie o arquivo de exemplo
```bash
cp env.example .env.local
```

### 2. Configure as variáveis

Edite `.env.local` com suas informações:

```env
# Facebook App
NEXT_PUBLIC_FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef123456789abcdef123456789

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Obter as credenciais

1. **App ID**: Encontrado em "Configurações" > "Básico"
2. **App Secret**: Clique em "Mostrar" em "Configurações" > "Básico"

## 🚀 Testando a Integração

### 1. Inicie o servidor
```bash
npm run dev
```

### 2. Acesse a aplicação
- Vá para `http://localhost:3000`
- Clique em "Continuar com Facebook"
- Autorize o aplicativo

### 3. Verifique os logs
- Abra o console do navegador (F12)
- Verifique se não há erros
- Confirme se as contas aparecem no dashboard

## 🔍 Solução de Problemas

### Erro: "App ID não encontrado"
- Verifique se `NEXT_PUBLIC_FACEBOOK_APP_ID` está configurado
- Confirme se o App ID está correto

### Erro: "URL de redirecionamento inválida"
- Verifique se a URL está configurada no Facebook Developers
- Confirme se `NEXTAUTH_URL` está correto

### Erro: "Permissões insuficientes"
- Verifique se todas as permissões foram adicionadas
- Confirme se o aplicativo está em modo de desenvolvimento

### Erro: "Token inválido"
- Verifique se `FACEBOOK_APP_SECRET` está correto
- Confirme se o token não expirou

## 📱 Configuração para Produção

### 1. Domínio de Produção
- Configure o domínio real no Facebook Developers
- Atualize as URLs de redirecionamento
- Configure `NEXT_PUBLIC_APP_URL` para o domínio real

### 2. HTTPS
- Certifique-se de que o site usa HTTPS
- Configure `secure: true` nos cookies

### 3. App Review
- Submeta o aplicativo para revisão do Facebook
- Forneça documentação detalhada
- Demonstre o uso das permissões

## 🔐 Segurança

### 1. Variáveis de Ambiente
- Nunca commite `.env.local`
- Use variáveis de ambiente no servidor de produção
- Rotacione as chaves regularmente

### 2. Tokens
- Armazene tokens de forma segura
- Use cookies httpOnly
- Implemente refresh de tokens

### 3. Permissões
- Solicite apenas as permissões necessárias
- Documente o uso de cada permissão
- Revise as permissões regularmente

## 📊 Monitoramento

### 1. Logs
- Monitore os logs de erro
- Configure alertas para falhas de autenticação
- Rastreie o uso da API

### 2. Métricas
- Monitore o número de usuários ativos
- Acompanhe o sucesso das clonagens
- Meça o tempo de resposta da API

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Confirme as configurações do Facebook
3. Teste com um aplicativo de exemplo
4. Consulte a documentação do Facebook
5. Entre em contato com o suporte

## 📚 Recursos Úteis

- [Facebook Developers](https://developers.facebook.com)
- [Facebook Marketing API](https://developers.facebook.com/docs/marketing-api)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review) 