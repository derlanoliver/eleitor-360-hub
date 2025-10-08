# 🏗️ Bloco 0.1 - Estrutura Multi-Tenant Core

## ✅ Objetivo

Criar a base de dados multi-tenant com isolamento por `tenant_id` e Row Level Security (RLS) em todas as tabelas do cliente, sem quebrar dados existentes.

## 📦 O que foi implementado

### 1️⃣ Migration 01: Core Tenants
- ✅ Criado enum `tenant_status` (active, suspended, cancelled)
- ✅ Criadas tabelas:
  - `tenants` - Dados do cliente/gabinete
  - `tenant_domains` - Domínios whitelabel (primary + extras)
  - `tenant_settings` - Configurações JSONB (organização, privacidade, limites)
  - `tenant_branding` - Tema visual (cor primária, logo, favicon)
- ✅ Seed do tenant **"Rafael Prudente"** (slug: `rafael-prudente`)
- ✅ Domínio primário: `rafael.eleitor360.ai`
- ✅ Branding default: cor `#F25822`

### 2️⃣ Migration 02: Catálogos Globais
- ✅ Renomeado `cadastros_ra` → `regiao_administrativa`
- ✅ Renomeado `temas_interesse` → `temas`
- ✅ Criados índices de performance
- ℹ️ `perfil_demografico` mantido (decisão em bloco futuro)

### 3️⃣ Migration 03: Adicionar tenant_id
- ✅ Adicionado `tenant_id` em:
  - `profiles` (com índice)
  - `coordenadores` → renomeado para `lideres` (com índice)
- ✅ Migrados todos os dados existentes para tenant "Rafael Prudente"
- ✅ Backup de tabelas legadas:
  - `admin_users` → `admin_users_bak_legacy`
  - `user_sessions` → `user_sessions_bak_legacy`

### 4️⃣ Migration 04: RLS e Funções Helper
- ✅ Habilitado RLS em todas as novas tabelas
- ✅ Criadas funções helper:
  - `has_role()` - Stub para RBAC (implementação no Bloco 0.2)
  - `get_single_tenant_for_user()` - Retorna tenant do usuário
- ✅ Criadas policies base:
  - Tenants: apenas super_admin/super_user podem ler
  - Profiles: usuário vê próprio perfil + tenant
  - Lideres: tenant-scoped com CRUD

### 5️⃣ Edge Function: tenant-config
- ✅ Endpoint utilitário para buscar tenant por domínio
- ✅ Retorna tenant + branding + settings
- ✅ CORS habilitado
- ℹ️ Ainda não integrado na UI (aguarda Bloco 0.3)

## 🎯 Estrutura de dados criada

```
tenants (1)
├── tenant_domains (N) → rafael.eleitor360.ai
├── tenant_settings (1) → org_data, privacy, limits
└── tenant_branding (1) → #F25822, logo, favicon

profiles (N) → tenant_id FK
lideres (N) → tenant_id FK (ex-coordenadores)

Catálogos GLOBAIS (sem tenant_id):
├── regiao_administrativa (ex-cadastros_ra)
└── temas (ex-temas_interesse)
```

## 🔐 Segurança (RLS)

### Políticas implementadas:

#### Tenants (apenas super admins)
- `p_tenants_select` - Leitura para super_admin/super_user
- `p_tenant_domains_select` - Leitura para super_admin/super_user
- `p_tenant_settings_select` - Leitura para super_admin/super_user
- `p_tenant_branding_select` - Leitura para super_admin/super_user

#### Profiles (tenant-scoped)
- `p_profiles_select` - Usuário vê próprio perfil + seu tenant
- `p_profiles_update` - Usuário edita próprio perfil + seu tenant

#### Lideres (tenant-scoped)
- `p_lideres_select` - Leitura do próprio tenant
- `p_lideres_insert` - Inserção no próprio tenant
- `p_lideres_update` - Edição no próprio tenant
- `p_lideres_delete` - Apenas super_admin

### ⚠️ Aviso de Segurança Remanescente

Existe 1 aviso **WARN** (não crítico) sobre "Leaked Password Protection Disabled". Este é uma configuração de autenticação do Supabase que deve ser ajustada nas configurações de Auth do projeto (não via SQL).

**Recomendação:** Habilitar "Leaked Password Protection" nas configurações de Auth do Supabase para produção.

## 🧪 Como testar

### 1. Verificar tenant criado
```sql
SELECT * FROM tenants WHERE slug = 'rafael-prudente';
```

### 2. Verificar domínio
```sql
SELECT * FROM tenant_domains WHERE domain = 'rafael.eleitor360.ai';
```

### 3. Verificar branding
```sql
SELECT tb.* 
FROM tenant_branding tb
JOIN tenants t ON t.id = tb.tenant_id
WHERE t.slug = 'rafael-prudente';
```

### 4. Verificar dados migrados
```sql
-- Todos os profiles devem ter tenant_id
SELECT COUNT(*) FROM profiles WHERE tenant_id IS NOT NULL;

-- Todos os lideres devem ter tenant_id
SELECT COUNT(*) FROM lideres WHERE tenant_id IS NOT NULL;
```

### 5. Testar Edge Function
```bash
# Via query param
curl "https://[PROJECT-ID].supabase.co/functions/v1/tenant-config?domain=rafael.eleitor360.ai"

# Via POST
curl -X POST "https://[PROJECT-ID].supabase.co/functions/v1/tenant-config" \
  -H "Content-Type: application/json" \
  -d '{"domain":"rafael.eleitor360.ai"}'
```

## 📊 Estatísticas

- **4 migrações SQL** executadas com sucesso
- **4 novas tabelas** core de tenant
- **2 tabelas renomeadas** (catálogos globais)
- **2 tabelas migradas** para multi-tenant (profiles, lideres)
- **2 tabelas backup** (admin_users, user_sessions)
- **10 policies RLS** criadas
- **2 funções helper** implementadas
- **1 edge function** utilitária

## 🚀 Próximos passos (Bloco 0.2)

1. Criar tabela `user_roles` com enum `app_role`
2. Implementar função `has_role()` real (substituir stub)
3. Criar policies RLS completas com RBAC
4. Atribuir role 'admin' ao usuário existente
5. Implementar `<ProtectedRoute>` e `useUserRole()` no frontend

## 🚀 Próximos passos (Bloco 0.3)

1. Criar `TenantProvider` e `useTenant()` hook
2. Integrar edge function `tenant-config`
3. Injetar CSS variables dinâmicas
4. Implementar detecção de tenant por domínio
5. Atualizar favicon dinamicamente

## 📝 Notas importantes

- ✅ Todas as migrações são **idempotentes** (podem ser executadas múltiplas vezes)
- ✅ **Sem perda de dados**: renomeações preservam conteúdo
- ✅ **Backup de segurança**: tabelas antigas viram `*_bak_legacy`
- ⚠️ Função `has_role()` é **stub** por ora (retorna FALSE até Bloco 0.2)
- ⚠️ Função `get_single_tenant_for_user()` retorna sempre tenant "Rafael Prudente"
- 🔒 RLS habilitado e funcional em todas as tabelas do cliente

## 🛠️ Troubleshooting

### Erro: "Tenant rafael-prudente não encontrado"
Execute as migrações na ordem: 01 → 02 → 03 → 04

### Erro: "Permission denied for table"
Verifique se RLS está habilitado e policies criadas (Migration 04)

### Edge function retorna 404
Verifique se o domínio está cadastrado em `tenant_domains`

### Dados não aparecem na UI
Por ora, `has_role()` retorna FALSE. Isso será resolvido no Bloco 0.2.
Use `get_single_tenant_for_user()` nas policies até lá.

## 📚 Referências

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Security Definer Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

---

✨ **Bloco 0.1 concluído com sucesso!** ✨
