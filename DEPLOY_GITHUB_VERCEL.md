# 🚀 Guia Completo: Deploy GitHub + Vercel

## 📋 Pré-requisitos

### 1. Instalar Git
```bash
# Baixar Git para Windows
# Acesse: https://git-scm.com/download/win
# Ou use o instalador que já está no projeto: nodejs-installer.msi
```

### 2. Instalar GitHub CLI (Opcional)
```bash
# Baixar GitHub CLI
# Acesse: https://cli.github.com/
```

## 🔧 Passo a Passo

### **Passo 1: Instalar Git**

1. **Baixar Git:**
   - Acesse: https://git-scm.com/download/win
   - Baixe a versão para Windows
   - Execute o instalador

2. **Configurar Git:**
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu@email.com"
   ```

### **Passo 2: Configurar Repositório Local**

```bash
# 1. Inicializar Git
git init

# 2. Adicionar arquivos
git add .

# 3. Fazer primeiro commit
git commit -m "Initial commit: AdCloner Pro setup"

# 4. Adicionar repositório remoto
git remote add origin https://github.com/JosineyAlves/adcloner.git

# 5. Fazer push
git branch -M main
git push -u origin main
```

### **Passo 3: Deploy no Vercel**

1. **Acessar Vercel:**
   - Vá para: https://vercel.com/
   - Faça login com GitHub

2. **Importar Projeto:**
   - Clique em **"New Project"**
   - Selecione o repositório `JosineyAlves/adcloner`
   - Clique em **"Import"**

3. **Configurar Projeto:**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Configurar Variáveis de Ambiente:**
   ```
   NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
   FACEBOOK_APP_SECRET=seu_app_secret_aqui
   NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
   ```

5. **Deploy:**
   - Clique em **"Deploy"**
   - Aguarde o build completar

### **Passo 4: Configurar Facebook App**

1. **Acessar Facebook Developers:**
   - Vá para: https://developers.facebook.com/
   - Selecione seu app

2. **Configurar URLs:**
   ```
   Site URL: https://seu-projeto.vercel.app
   
   Valid OAuth Redirect URIs:
   https://seu-projeto.vercel.app/api/auth/callback/facebook
   
   App Domains:
   seu-projeto.vercel.app
   ```

3. **Configurar Permissões:**
   - Vá em **App Review** → **Permissions and Features**
   - Adicione permissões:
     - `ads_read`
     - `ads_management`
     - `public_profile`
     - `email`
     - `pages_show_list`
     - `pages_read_engagement`

## 📝 Scripts Automatizados

### **Script para Windows (PowerShell)**

```powershell
# deploy.ps1
Write-Host "🚀 Iniciando deploy do AdCloner Pro..." -ForegroundColor Green

# Verificar se Git está instalado
try {
    git --version
    Write-Host "✅ Git encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não encontrado. Instale em: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Configurar Git (se necessário)
if (-not (git config --global user.name)) {
    git config --global user.name "JosineyAlves"
    git config --global user.email "seu@email.com"
}

# Inicializar repositório
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Repositório Git inicializado" -ForegroundColor Green
}

# Adicionar arquivos
git add .
Write-Host "✅ Arquivos adicionados" -ForegroundColor Green

# Fazer commit
git commit -m "Deploy: AdCloner Pro with Facebook integration"
Write-Host "✅ Commit realizado" -ForegroundColor Green

# Configurar remote
git remote add origin https://github.com/JosineyAlves/adcloner.git 2>$null
git remote set-url origin https://github.com/JosineyAlves/adcloner.git

# Fazer push
git branch -M main
git push -u origin main
Write-Host "✅ Push realizado para GitHub" -ForegroundColor Green

Write-Host "🎉 Deploy concluído!" -ForegroundColor Green
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://vercel.com/" -ForegroundColor Cyan
Write-Host "2. Importe o repositório: JosineyAlves/adcloner" -ForegroundColor Cyan
Write-Host "3. Configure as variáveis de ambiente" -ForegroundColor Cyan
Write-Host "4. Deploy!" -ForegroundColor Cyan
```

### **Script para Linux/Mac**

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deploy do AdCloner Pro..."

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado. Instale o Git primeiro."
    exit 1
fi

echo "✅ Git encontrado"

# Configurar Git (se necessário)
if [ -z "$(git config --global user.name)" ]; then
    git config --global user.name "JosineyAlves"
    git config --global user.email "seu@email.com"
fi

# Inicializar repositório
if [ ! -d ".git" ]; then
    git init
    echo "✅ Repositório Git inicializado"
fi

# Adicionar arquivos
git add .
echo "✅ Arquivos adicionados"

# Fazer commit
git commit -m "Deploy: AdCloner Pro with Facebook integration"
echo "✅ Commit realizado"

# Configurar remote
git remote add origin https://github.com/JosineyAlves/adcloner.git 2>/dev/null
git remote set-url origin https://github.com/JosineyAlves/adcloner.git

# Fazer push
git branch -M main
git push -u origin main
echo "✅ Push realizado para GitHub"

echo "🎉 Deploy concluído!"
echo "📝 Próximos passos:"
echo "1. Acesse: https://vercel.com/"
echo "2. Importe o repositório: JosineyAlves/adcloner"
echo "3. Configure as variáveis de ambiente"
echo "4. Deploy!"
```

## 🔧 Configuração Manual

### **Se preferir fazer manualmente:**

1. **Instalar Git:**
   - Baixe de: https://git-scm.com/download/win
   - Execute o instalador

2. **Configurar Git:**
   ```bash
   git config --global user.name "JosineyAlves"
   git config --global user.email "seu@email.com"
   ```

3. **Inicializar repositório:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AdCloner Pro"
   ```

4. **Conectar ao GitHub:**
   ```bash
   git remote add origin https://github.com/JosineyAlves/adcloner.git
   git branch -M main
   git push -u origin main
   ```

5. **Deploy no Vercel:**
   - Acesse: https://vercel.com/
   - Importe o repositório
   - Configure variáveis de ambiente
   - Deploy!

## 📋 Checklist de Deploy

### **Antes do Deploy**
- [ ] Git instalado
- [ ] GitHub CLI instalado (opcional)
- [ ] Repositório criado no GitHub
- [ ] Conta Vercel criada
- [ ] Facebook App configurado

### **Durante o Deploy**
- [ ] Repositório inicializado localmente
- [ ] Arquivos commitados
- [ ] Push realizado para GitHub
- [ ] Projeto importado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado

### **Após o Deploy**
- [ ] URL do Vercel obtida
- [ ] Facebook App atualizado com nova URL
- [ ] OAuth testado
- [ ] APIs funcionando
- [ ] Monitoramento ativo

## 🚨 Troubleshooting

### **Erro: "Git não encontrado"**
```bash
# Instalar Git
# Windows: https://git-scm.com/download/win
# Mac: brew install git
# Linux: sudo apt-get install git
```

### **Erro: "Authentication failed"**
```bash
# Configurar credenciais
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### **Erro: "Repository not found"**
- Verificar se o repositório existe no GitHub
- Verificar permissões de acesso
- Verificar URL do remote

### **Erro no Vercel: "Build failed"**
- Verificar se todas as dependências estão no package.json
- Verificar se o build command está correto
- Verificar logs de erro no Vercel

## 🎯 Próximos Passos

1. **Execute o script de deploy**
2. **Configure o Vercel**
3. **Atualize o Facebook App**
4. **Teste a integração**
5. **Configure monitoramento**

---

**Nota:** Este guia assume que você já tem uma conta no GitHub e Vercel. Se não tiver, crie-as primeiro. 