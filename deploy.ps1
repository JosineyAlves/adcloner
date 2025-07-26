# Script de Deploy Automatizado - AdCloner Pro
# Execute este script no PowerShell como administrador

Write-Host "Iniciando deploy do AdCloner Pro..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Verificar se Git esta instalado
Write-Host "Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git nao encontrado!" -ForegroundColor Red
    Write-Host "Instale o Git em: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Ou execute o instalador: nodejs-installer.msi" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Configurar Git (se necessario)
Write-Host "Configurando Git..." -ForegroundColor Yellow
$gitName = git config --global user.name
$gitEmail = git config --global user.email

if (-not $gitName) {
    Write-Host "Configurando nome do usuario Git..." -ForegroundColor Yellow
    git config --global user.name "JosineyAlves"
}

if (-not $gitEmail) {
    Write-Host "Configurando email do usuario Git..." -ForegroundColor Yellow
    git config --global user.email "josiney@example.com"
}

Write-Host "Git configurado" -ForegroundColor Green

# Verificar se ja e um repositorio Git
Write-Host "Verificando repositorio Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    Write-Host "Repositorio Git inicializado" -ForegroundColor Green
} else {
    Write-Host "Repositorio Git ja existe" -ForegroundColor Green
}

# Verificar se ha mudancas para commit
Write-Host "Verificando mudancas..." -ForegroundColor Yellow
$status = git status --porcelain

if ($status) {
    Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
    git add .
    Write-Host "Arquivos adicionados" -ForegroundColor Green

    Write-Host "Fazendo commit..." -ForegroundColor Yellow
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Deploy: AdCloner Pro with Facebook integration - $date"
    Write-Host "Commit realizado" -ForegroundColor Green
} else {
    Write-Host "Nenhuma mudanca para commit" -ForegroundColor Cyan
}

# Configurar remote
Write-Host "Configurando repositorio remoto..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/JosineyAlves/adcloner.git"

# Verificar se remote ja existe
$remotes = git remote -v
if ($remotes -match "origin") {
    Write-Host "Atualizando remote origin..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
} else {
    Write-Host "Adicionando remote origin..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
}

Write-Host "Remote configurado: $remoteUrl" -ForegroundColor Green

# Fazer push
Write-Host "Fazendo push para GitHub..." -ForegroundColor Yellow
try {
    git branch -M main
    git push -u origin main
    Write-Host "Push realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro no push!" -ForegroundColor Red
    Write-Host "Verifique se:" -ForegroundColor Yellow
    Write-Host "   - O repositorio existe no GitHub" -ForegroundColor Yellow
    Write-Host "   - Voce tem permissao de push" -ForegroundColor Yellow
    Write-Host "   - Suas credenciais estao configuradas" -ForegroundColor Yellow
    Read-Host "Pressione Enter para continuar"
}

# Mostrar informacoes do repositorio
Write-Host "Informacoes do Repositorio:" -ForegroundColor Cyan
Write-Host "   GitHub: https://github.com/JosineyAlves/adcloner" -ForegroundColor White
Write-Host "   Branch: main" -ForegroundColor White
Write-Host "   Remote: origin" -ForegroundColor White

Write-Host ""
Write-Host "Deploy para GitHub concluido!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Proximos passos
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://vercel.com/" -ForegroundColor Cyan
Write-Host "2. Importe o repositorio: JosineyAlves/adcloner" -ForegroundColor Cyan
Write-Host "3. Configure as variaveis de ambiente:" -ForegroundColor Cyan
Write-Host "   - NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id" -ForegroundColor White
Write-Host "   - FACEBOOK_APP_SECRET=seu_app_secret" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app" -ForegroundColor White
Write-Host "4. Deploy!" -ForegroundColor Cyan
Write-Host "5. Atualize o Facebook App com a nova URL" -ForegroundColor Cyan

Write-Host ""
Write-Host "Dica: Apos o deploy no Vercel, voce tera uma URL real" -ForegroundColor Yellow
Write-Host "   que pode ser usada no Facebook App para resolver o erro de URL bloqueada" -ForegroundColor Yellow

Write-Host ""
Write-Host "Script concluido!" -ForegroundColor Green
Read-Host "Pressione Enter para sair" 