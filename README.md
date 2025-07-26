# AdCloner Pro

Um SaaS moderno para clonar campanhas do Facebook Ads em múltiplas contas de anúncios, Business Managers, páginas e pixels.

## 🚀 Funcionalidades

- **Autenticação via Facebook OAuth2.0**
- **Dashboard intuitivo** com visão geral das contas conectadas
- **Criação de campanhas base** com todos os parâmetros necessários
- **Clonagem automática** em múltiplas contas com UTMs únicos
- **Templates reutilizáveis** para campanhas
- **Painel de resultados** com logs detalhados
- **Design responsivo** com modo escuro/claro

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod
- **Notifications**: React Hot Toast
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/JosineyAlves/adcloner.git
cd adcloner
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:
```env
# Facebook App
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_SECRET=seu_facebook_app_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase

# NextAuth
NEXTAUTH_SECRET=seu_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. **Execute o projeto**
```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver o projeto.

## 📁 Estrutura do Projeto

```
adcloner/
├── app/                    # App Router (Next.js 14)
│   ├── dashboard/         # Página do dashboard
│   ├── login/            # Página de login
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página raiz
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticação
│   ├── dashboard/        # Componentes do dashboard
│   └── layout/           # Componentes de layout
├── lib/                  # Utilitários e configurações
│   ├── types.ts          # Tipos TypeScript
│   ├── utils.ts          # Funções utilitárias
│   └── mock-data.ts      # Dados mockados
├── public/               # Arquivos estáticos
└── package.json          # Dependências
```

## 🔧 Configuração do Facebook

### ⚠️ IMPORTANTE: Se você está recebendo o erro "App não está disponível"

**Solução Rápida:**
1. Execute: `node scripts/setup-env.js` para configurar as variáveis de ambiente
2. Siga o guia completo: [FACEBOOK_APP_SETUP.md](./FACEBOOK_APP_SETUP.md)
3. Ou use a solução rápida: [SOLUCAO_RAPIDA.md](./SOLUCAO_RAPIDA.md)

### Configuração Padrão

1. **Crie um app no Facebook Developers**
   - Acesse [developers.facebook.com](https://developers.facebook.com)
   - Crie um novo app do tipo "Business"
   - Adicione os produtos "Facebook Login" e "Marketing API"

2. **Configure as permissões necessárias**
   - `ads_management` - **OBRIGATÓRIO**
   - `ads_read` - **OBRIGATÓRIO**
   - `business_management` - **OBRIGATÓRIO**
   - `pages_show_list` - **OBRIGATÓRIO**
   - `pages_read_engagement` - **OBRIGATÓRIO**
   - `public_profile` (já incluída)
   - `email` (já incluída)
   - `business_management`
   - `pages_show_list`

3. **Configure as URLs de redirecionamento**
   - `http://localhost:3000/api/auth/callback/facebook` (desenvolvimento)
   - `https://seu-dominio.com/api/auth/callback/facebook` (produção)

## 🎨 Componentes Principais

### LoginForm
Componente de autenticação com Facebook OAuth2.0

### Dashboard
Dashboard principal com:
- Cards de estatísticas
- Lista de contas conectadas
- Atividade recente

### AccountCard
Card que exibe informações de uma conta do Facebook:
- Nome e ID da conta
- Business Manager
- Status do token
- Páginas e pixels disponíveis

### Sidebar
Navegação lateral com:
- Dashboard
- Campanhas
- Templates
- Contas
- Configurações

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras plataformas
O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 📝 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- Email: suporte@adclonerpro.com
- Discord: [Link do servidor]
- Documentação: [Link da documentação]

## 🔮 Roadmap

- [ ] Integração com Google Ads
- [ ] Integração com TikTok Ads
- [ ] Geração de criativos com IA
- [ ] Variações automáticas de copy
- [ ] Acesso multiusuário por equipe
- [ ] Exportação de dados
- [ ] API pública
- [ ] Mobile app
