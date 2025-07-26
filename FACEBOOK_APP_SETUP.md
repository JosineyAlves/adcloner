# Configuração Completa do App Facebook

## Problema Identificado
O erro "Este app precisa pelo menos do supported permission" indica que o app do Facebook não tem as permissões necessárias configuradas.

## Solução Passo a Passo

### 1. Acessar o Facebook Developers
1. Vá para [developers.facebook.com](https://developers.facebook.com)
2. Faça login com sua conta do Facebook
3. Clique em "Meus Apps" no menu superior

### 2. Criar/Configurar o App
1. Clique em "Criar App" ou selecione seu app existente
2. Se criar novo app:
   - Escolha "Business" como tipo
   - Digite um nome para o app (ex: "AdCloner Pro")
   - Adicione seu email de contato

### 3. Configurar Permissões Obrigatórias

#### 3.1. Adicionar Produtos
No painel do app, vá para "Produtos" e adicione:

1. **Facebook Login**
   - Clique em "Adicionar Produto"
   - Selecione "Facebook Login"
   - Clique em "Configurar"

2. **Marketing API**
   - Clique em "Adicionar Produto"
   - Selecione "Marketing API"
   - Clique em "Configurar"

#### 3.2. Configurar Facebook Login
1. Vá para "Facebook Login" > "Configurações"
2. Configure as URLs:
   - **URLs de Redirecionamento OAuth Válidas:**
     ```
     http://localhost:3000/api/auth/callback/facebook
     https://seu-dominio.vercel.app/api/auth/callback/facebook
     ```
   - **URL do Site:**
     ```
     http://localhost:3000
     https://seu-dominio.vercel.app
     ```

#### 3.3. Configurar Permissões
1. Vá para "Facebook Login" > "Permissões e Recursos"
2. Adicione as seguintes permissões:

**Permissões Básicas:**
- `public_profile` (já incluída)
- `email` (já incluída)

**Permissões de Anúncios:**
- `ads_management` - **OBRIGATÓRIO**
- `ads_read` - **OBRIGATÓRIO**
- `business_management` - **OBRIGATÓRIO**

**Permissões de Páginas:**
- `pages_show_list` - **OBRIGATÓRIO**
- `pages_read_engagement` - **OBRIGATÓRIO**
- `pages_manage_metadata` - **OBRIGATÓRIO**

**Permissões de Pixels:**
- `ads_read` (já incluída acima)

### 4. Configurar App Review (Opcional mas Recomendado)

#### 4.1. Para Desenvolvimento
1. Vá para "Configurações" > "Básico"
2. Adicione seu email como "Desenvolvedor" ou "Administrador"
3. Isso permite testar o app sem revisão

#### 4.2. Para Produção
1. Vá para "App Review" > "Permissões e Recursos"
2. Para cada permissão, clique em "Solicitar"
3. Preencha os formulários de revisão

### 5. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Facebook App Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AdCloner Pro

# Para produção, use:
# NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

### 6. Obter Credenciais

#### 6.1. App ID
1. Vá para "Configurações" > "Básico"
2. Copie o "App ID"

#### 6.2. App Secret
1. Vá para "Configurações" > "Básico"
2. Clique em "Mostrar" ao lado de "App Secret"
3. Copie o "App Secret"

### 7. Testar a Integração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:3000`

3. Tente conectar com o Facebook

### 8. Troubleshooting

#### Erro: "App não está disponível"
- Verifique se o app está ativo em "Configurações" > "Básico"
- Certifique-se de que você é administrador do app

#### Erro: "Permissões não suportadas"
- Verifique se todas as permissões listadas acima foram adicionadas
- Certifique-se de que o app está em modo de desenvolvimento

#### Erro: "URL de redirecionamento inválida"
- Verifique se as URLs de redirecionamento estão configuradas corretamente
- Certifique-se de que não há espaços extras

### 9. Configuração para Produção

1. Vá para "Configurações" > "Básico"
2. Adicione seu domínio de produção em "Domínios do App"
3. Configure as URLs de redirecionamento para produção
4. Ative o modo de produção (após revisão do Facebook)

### 10. Verificação Final

Após seguir todos os passos, você deve conseguir:
- Conectar com o Facebook sem erros
- Ver suas contas de anúncios
- Acessar campanhas e dados de marketing

## Permissões Mínimas Necessárias

```javascript
// Estas são as permissões que o app solicita:
const requiredPermissions = [
  'ads_management',      // Gerenciar anúncios
  'business_management', // Gerenciar negócios
  'pages_show_list',     // Ver páginas
  'pages_read_engagement', // Ler engajamento das páginas
  'public_profile',      // Perfil público
  'email'               // Email do usuário
]
```

## Suporte

Se ainda houver problemas após seguir este guia:
1. Verifique os logs do console do navegador
2. Verifique os logs do servidor
3. Confirme que todas as variáveis de ambiente estão configuradas
4. Teste com uma conta de administrador do app 