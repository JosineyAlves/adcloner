# 🚀 Configuração Rápida do GitHub

## 📋 Passo a Passo

### **Passo 1: Instalar Git**

1. **Baixar Git:**
   - Acesse: https://git-scm.com/download/win
   - Baixe a versão para Windows
   - Execute o instalador

2. **Ou usar o instalador automático:**
   ```bash
   # Execute o script setup-github.bat
   setup-github.bat
   ```

### **Passo 2: Configurar Git**

Após instalar o Git, abra o PowerShell e execute:

```bash
# Configurar usuário
git config --global user.name "JosineyAlves"
git config --global user.email "seu@email.com"

# Verificar configuração
git config --global user.name
git config --global user.email
```

### **Passo 3: Configurar Repositório**

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

### **Passo 4: Verificar**

```bash
# Verificar status
git status

# Verificar remote
git remote -v

# Verificar branch
git branch
```

## 🔧 Script Automatizado

Se preferir, execute o script PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

## 🚨 Troubleshooting

### **Erro: "Git não encontrado"**
- Instale o Git: https://git-scm.com/download/win
- Reinicie o PowerShell após a instalação

### **Erro: "Authentication failed"**
- Configure suas credenciais do GitHub
- Use GitHub CLI ou configure token de acesso pessoal

### **Erro: "Repository not found"**
- Verifique se o repositório existe no GitHub
- Verifique se você tem permissão de push

## 📝 Próximos Passos

1. ✅ Instalar Git
2. ✅ Configurar usuário
3. ✅ Inicializar repositório
4. ✅ Fazer push para GitHub
5. 🔄 Configurar Vercel
6. 🔄 Atualizar Facebook App

---

**Nota:** Após o push para o GitHub, você poderá configurar o Vercel para fazer o deploy automático. 