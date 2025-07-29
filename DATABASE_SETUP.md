# 🗄️ Configuração do Banco de Dados - AdCloner Pro

## 📋 Visão Geral

O AdCloner Pro agora possui um sistema completo de autenticação e persistência de dados usando:

- **PostgreSQL** como banco de dados
- **Prisma** como ORM
- **NextAuth.js** para autenticação
- **bcryptjs** para criptografia de senhas

## 🚀 Configuração Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp env.example .env
```

Edite o arquivo `.env` e configure:
```env
# NextAuth Configuration
NEXTAUTH_SECRET=sua-chave-secreta-aqui
NEXTAUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/adcloner"

# Facebook App Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=seu-facebook-app-id
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu-facebook-config-id
FACEBOOK_APP_SECRET=seu-facebook-app-secret
```

### 3. Configurar Banco de Dados
```bash
npm run db:setup
```

### 4. Iniciar Aplicação
```bash
npm run dev
```

### 5. Criar Primeira Conta
Acesse: http://localhost:3000/register

## 📊 Estrutura do Banco

### Tabelas Principais:

#### `User`
- Armazena dados dos usuários
- Senhas criptografadas com bcrypt
- Relacionamento com contas do Facebook

#### `FacebookAccount`
- Contas do Facebook conectadas
- Tokens de acesso
- Dados do perfil

#### `Campaign`
- Campanhas do Facebook
- Relacionamento com contas

#### `Insight`
- Métricas de performance
- Dados históricos
- Agregação por data

#### `UserSettings`
- Configurações personalizadas
- Métricas principais
- Preferências de data

## 🔐 Sistema de Autenticação

### Funcionalidades:
- ✅ **Registro** de novos usuários
- ✅ **Login** com email/senha
- ✅ **Sessões** persistentes
- ✅ **Proteção** de rotas
- ✅ **Criptografia** de senhas

### Rotas Protegidas:
- `/dashboard/*`
- `/campaigns/*`
- `/templates/*`
- `/settings/*`
- `/accounts/*`

## 🛠️ Comandos Úteis

```bash
# Configurar banco de dados
npm run db:setup

# Gerar cliente Prisma
npm run db:generate

# Sincronizar schema
npm run db:push

# Abrir Prisma Studio
npm run db:studio
```

## 🔧 Configuração do PostgreSQL

### Local (Desenvolvimento):
```bash
# Instalar PostgreSQL
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Baixar do site oficial

# Criar banco
createdb adcloner

# Configurar DATABASE_URL
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/adcloner"
```

### Produção (Vercel):
```bash
# Usar PostgreSQL do Vercel ou externo
# Configurar DATABASE_URL no Vercel Dashboard
```

## 📈 Benefícios

### ✅ Persistência de Dados:
- Contas do Facebook salvas
- Configurações personalizadas
- Histórico de métricas
- Dados de campanhas

### ✅ Multi-Usuário:
- Cada usuário tem seus dados
- Isolamento completo
- Configurações individuais

### ✅ Segurança:
- Senhas criptografadas
- Sessões seguras
- Tokens protegidos

### ✅ Escalabilidade:
- Banco relacional robusto
- Índices otimizados
- Backup automático

## 🚨 Troubleshooting

### Erro de Conexão:
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar DATABASE_URL
echo $DATABASE_URL
```

### Erro de Migração:
```bash
# Resetar banco
npx prisma db push --force-reset

# Regenerar cliente
npx prisma generate
```

### Erro de Autenticação:
```bash
# Verificar NEXTAUTH_SECRET
# Gerar nova chave
openssl rand -base64 32
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme as variáveis de ambiente
3. Teste a conexão com o banco
4. Verifique se o PostgreSQL está rodando 