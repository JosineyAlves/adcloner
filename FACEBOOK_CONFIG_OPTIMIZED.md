# Otimização da Configuração do Facebook Login para Empresas

## Problema Identificado
A configuração atual inclui "Contas do Instagram" como ativo obrigatório, mas o AdCloner não precisa do Instagram para funcionar.

## Solução: Remover Instagram da Configuração

### 1. No Painel do Facebook
1. Vá para **Login do Facebook para Empresas > Configurações**
2. Edite a configuração **757815830318736**
3. Na seção **"Ativos"**, remova:
   - ❌ Contas do Instagram
4. Mantenha apenas:
   - ✅ Páginas
   - ✅ Contas de anúncios
   - ✅ Catálogos
   - ✅ Pixels

### 2. Permissões Necessárias (Manter)
```
✅ ads_management
✅ ads_read
✅ business_management
✅ pages_manage_metadata
✅ pages_show_list
✅ pages_read_engagement
✅ read_insights
✅ pages_manage_posts
✅ pages_manage_engagement
```

### 3. Permissões do Instagram (Remover)
```
❌ instagram_basic
❌ instagram_content_publish
❌ instagram_manage_comments
❌ instagram_manage_insights
❌ instagram_manage_messages
❌ instagram_shopping_tag_products
```

## Benefícios da Otimização

1. **Fluxo Simplificado**: Sem tela de Instagram
2. **Foco no Essencial**: Apenas ativos necessários
3. **Menos Permissões**: Reduz complexidade
4. **Melhor UX**: Processo mais direto

## Status Atual
- ✅ Popup funcionando
- ✅ Config ID correto
- ✅ Response type correto
- ⚠️ Instagram precisa ser removido da configuração

## Próximos Passos
1. Remover Instagram da configuração no painel
2. Testar novamente o fluxo
3. Verificar se o popup não pede mais Instagram 