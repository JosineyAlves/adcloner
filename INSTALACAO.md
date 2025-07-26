# 🚀 Instalação do AdCloner Pro

## 📋 Pré-requisitos

### 1. Instalar Node.js

**Opção 1: Download direto**
1. Acesse [nodejs.org](https://nodejs.org)
2. Baixe a versão LTS (recomendada)
3. Execute o instalador e siga as instruções

**Opção 2: Via Chocolatey (Windows)**
```powershell
# Instalar Chocolatey primeiro (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Node.js
choco install nodejs
```

**Opção 3: Via Scoop (Windows)**
```powershell
# Instalar Scoop primeiro (se não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Node.js
scoop install nodejs
```

### 2. Verificar instalação
```bash
node --version
npm --version
```

## 🛠️ Configuração do Projeto

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
copy .env.example .env.local
```

Editar `.env.local` com suas configurações:
```env
# Facebook App
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_SECRET=seu_facebook_app_secret

# Supabase (opcional para desenvolvimento)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase

# NextAuth
NEXTAUTH_SECRET=seu_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Executar o projeto
```bash
npm run dev
```

### 4. Acessar o projeto
Abra [http://localhost:3000](http://localhost:3000) no navegador

## 🔧 Solução de Problemas

### Erro: "npm não é reconhecido"
- Verifique se o Node.js foi instalado corretamente
- Reinicie o terminal/PowerShell
- Verifique se o Node.js está no PATH do sistema

### Erro: "node não é reconhecido"
- Reinstale o Node.js
- Certifique-se de marcar a opção "Add to PATH" durante a instalação

### Erro de dependências
```bash
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📱 Desenvolvimento

### Scripts disponíveis
```bash
npm run dev      # Executar em modo desenvolvimento
npm run build    # Build para produção
npm run start    # Executar build de produção
npm run lint     # Verificar código
```

### Estrutura do projeto
```
adcloner-pro/
├── app/                    # Páginas (Next.js 14)
├── components/             # Componentes React
├── lib/                   # Utilitários e tipos
├── public/                # Arquivos estáticos
└── package.json           # Dependências
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras opções
- Netlify
- Railway
- DigitalOcean App Platform

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o Node.js está instalado: `node --version`
2. Verifique se o npm está disponível: `npm --version`
3. Tente reinstalar as dependências: `npm install`
4. Consulte a documentação do Next.js: [nextjs.org](https://nextjs.org) 