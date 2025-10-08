# 🎨 Bloco 0.3 — Branding & Domínios Multi-tenant

## Objetivo

Implementar resolução de **tenant por domínio** e aplicar **branding dinâmico** (logo, cores, favicon) em runtime, utilizando um sistema **stateless** de headers HTTP para propagação do `tenant_id` compatível com RLS.

---

## ✅ O que foi implementado

### 1. Backend (SQL)

#### Funções de Resolução de Tenant

**`header_tenant()`**
- Extrai o `tenant_id` do header HTTP `x-tenant-id`
- Utiliza `request.headers::json` do PostgREST
- Retorna `UUID` ou `NULL` se não encontrado

**`effective_tenant()`**
- Resolve o tenant efetivo com **triple fallback**:
  1. **GUC** (`app.tenant_id`) - sessão stateful (dev/admin)
  2. **Header** (`x-tenant-id`) - stateless (produção)
  3. **Fallback** (`get_single_tenant_for_user`) - mono-tenant (dev helper)

#### RLS Policies Atualizadas

Todas as policies das seguintes tabelas foram atualizadas para usar `effective_tenant()`:

- **`profiles`** (SELECT, UPDATE)
- **`lideres`** (SELECT, INSERT, UPDATE, DELETE)
- **`user_roles`** (SELECT tenant-scoped)

Isso garante que o isolamento de dados funcione tanto com GUC quanto com headers HTTP, mantendo total compatibilidade com o sistema RBAC do Bloco 0.2.

---

### 2. Frontend

#### TenantContext (`src/contexts/TenantContext.tsx`)

**Responsabilidades:**
1. Busca configuração do tenant via edge function `tenant-config`
2. Aplica branding dinâmico:
   - CSS custom properties (`--primary`, `--primary-600`)
   - Favicon via manipulação do DOM
   - Logo armazenado em localStorage (para uso global)
3. **Injeta header `x-tenant-id`** no client Supabase para todas as requisições

**Uso:**
```tsx
import { useTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { tenant, tenantId, isLoading } = useTenant();
  
  if (isLoading) return <div>Carregando...</div>;
  
  return <div>Tenant: {tenant?.name}</div>;
}
```

#### TenantThemeProvider (`src/providers/TenantThemeProvider.tsx`)

**Responsabilidades:**
1. Loading state elegante durante resolução do tenant
2. Validação de status do tenant:
   - `active` → renderiza children normalmente
   - `suspended` → exibe tela de bloqueio
   - `cancelled` → exibe tela de conta cancelada

#### Whitelabel Helpers (`src/lib/whitelabel.ts`)

Funções utilitárias para trabalhar com domínios customizados:

```typescript
// Construir URL completa
buildTenantUrl('eleitor360.ai', '/eventos/123')
// → "https://eleitor360.ai/eventos/123"

// URL absoluta usando domínio primário do tenant
absoluteLinkForTenant(tenant, '/campanhas/456')
// → "https://rafaelprudente.com.br/campanhas/456"

// Obter domínio primário
getPrimaryDomain(tenant)
// → "eleitor360.ai"

// Verificar se domínio atual é o primário
isCurrentDomainPrimary(tenant)
// → true/false
```

---

### 3. Integração

A aplicação foi envolvida com os novos providers em `src/App.tsx`:

```tsx
<TenantProvider>          {/* Resolve tenant + branding */}
  <TenantThemeProvider>   {/* Valida status */}
    <QueryClientProvider> {/* React Query */}
      <AuthProvider>      {/* Autenticação */}
        {/* App */}
      </AuthProvider>
    </QueryClientProvider>
  </TenantThemeProvider>
</TenantProvider>
```

**Ordem crítica:**
1. `TenantProvider` (mais externo - resolve tenant primeiro)
2. `TenantThemeProvider` (valida status antes de renderizar app)
3. Demais providers (Query, Tooltip, Auth, Router)

---

### 4. Edge Function

A edge function `tenant-config` foi atualizada para incluir `tenant_domains(*)` no payload, permitindo que o frontend tenha acesso aos domínios configurados.

---

## 🔧 Como funciona

### Fluxo de Resolução de Tenant

1. **Usuário acessa** `https://eleitor360.ai`
2. **TenantContext** busca tenant via `tenant-config` edge function
3. **Edge function** consulta `tenant_domains` → encontra `tenant_id`
4. **Frontend** recebe dados completos do tenant (branding, settings, domains)
5. **Branding aplicado** dinamicamente (cores, favicon, logo)
6. **Header injetado** no Supabase client: `x-tenant-id: <uuid>`
7. **Todas as requisições** passam a incluir esse header automaticamente
8. **RLS** usa `effective_tenant()` → pega o header → isola dados

### Propagação Stateless do Tenant

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│                                                         │
│  1. TenantProvider resolve tenant por domínio          │
│  2. Injeta header: x-tenant-id: abc-123                │
│  3. Todas as queries/mutations incluem header          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ HTTP Request + Header
┌─────────────────────────────────────────────────────────┐
│                Supabase (PostgREST/RLS)                 │
│                                                         │
│  1. Recebe request com x-tenant-id: abc-123            │
│  2. RLS policy chama effective_tenant()                │
│  3. header_tenant() extrai: abc-123                    │
│  4. Filtra dados: WHERE tenant_id = abc-123            │
└─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ **Stateless**: não depende de sessão ou GUC persistente
- ✅ **Escalável**: funciona em ambientes serverless
- ✅ **Compatível**: mantém suporte a GUC e fallback mono-tenant
- ✅ **Seguro**: header validado no backend via RLS

---

## 🧪 Testes

### 1. Branding Dinâmico

```sql
-- Alterar cor primária no banco
UPDATE tenant_branding 
SET primary_color = '#FF0000' 
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'rafael-prudente');
```

**Esperado:**
- Recarregar página → cor muda sem rebuild
- Elementos com `text-primary`, `bg-primary` devem refletir nova cor

### 2. RLS por Header (Isolamento Multi-tenant)

**Setup:**
```sql
-- Criar segundo tenant
INSERT INTO tenants (name, slug, status) 
VALUES ('Candidato XYZ', 'candidato-xyz', 'active');

-- Adicionar domínio
INSERT INTO tenant_domains (tenant_id, domain, is_primary) 
VALUES (
  (SELECT id FROM tenants WHERE slug = 'candidato-xyz'),
  'candidatoxyz.com.br',
  true
);
```

**Teste:**
1. Acessar `https://eleitor360.ai` (tenant Rafael Prudente)
2. Verificar que vê apenas líderes/contatos do Rafael Prudente
3. Simular acesso a `https://candidatoxyz.com.br` (via hosts file ou deploy)
4. Verificar isolamento completo de dados

### 3. Status Suspenso/Cancelado

```sql
-- Suspender tenant
UPDATE tenants 
SET status = 'suspended' 
WHERE slug = 'rafael-prudente';
```

**Esperado:**
- Recarregar página → tela de bloqueio exibida
- Mensagem clara com nome da organização
- Usuário não consegue acessar a aplicação

```sql
-- Reativar
UPDATE tenants 
SET status = 'active' 
WHERE slug = 'rafael-prudente';
```

### 4. Fallback Mono-tenant (Dev Helper)

**Cenário:**
- Usuário autenticado
- **SEM** header `x-tenant-id` (ex: requisição direta sem passar pelo TenantContext)
- Usuário possui **apenas um tenant** em `user_roles`

**Esperado:**
- `effective_tenant()` usa `get_single_tenant_for_user()` como fallback
- Usuário consegue ver dados normalmente
- Útil para desenvolvimento local e debugging

---

## 🔐 Segurança

### Validações Implementadas

1. **Header Validation**: `header_tenant()` usa `NULLIF` para evitar strings vazias
2. **RLS Enforcement**: Todas as queries passam por `effective_tenant()`
3. **Status Check**: `TenantThemeProvider` bloqueia acesso para status ≠ `active`
4. **RBAC Integration**: Mantém todo o sistema de papéis do Bloco 0.2

### Possíveis Vetores de Ataque (Mitigados)

❌ **Header Spoofing**: Atacante tenta injetar header fake
✅ **Mitigação**: RLS valida com `has_role()` - usuário precisa ter papel no tenant

❌ **Domain Hijacking**: Atacante cria domínio apontando para outro tenant
✅ **Mitigação**: Edge function valida `tenant_domains` no banco

❌ **Session Fixation**: Atacante tenta fixar sessão de outro tenant
✅ **Mitigação**: Sistema stateless, sem sessão server-side

---

## 🚀 Próximos Passos (Bloco 0.4+)

- [ ] UI de configuração de branding (upload de logo, seleção de cores)
- [ ] Gerenciamento de domínios customizados (adicionar/remover)
- [ ] Preview de branding antes de aplicar
- [ ] Suporte a múltiplos temas (light/dark)
- [ ] Exportar branding para QR codes (já preparado com whitelabel helpers)

---

## 📚 Referências

- **Migração SQL**: `supabase/migrations/*_07_header_tenant_helpers.sql`
- **TenantContext**: `src/contexts/TenantContext.tsx`
- **TenantThemeProvider**: `src/providers/TenantThemeProvider.tsx`
- **Whitelabel Utils**: `src/lib/whitelabel.ts`
- **Edge Function**: `supabase/functions/tenant-config/index.ts`
- **App Integration**: `src/App.tsx`

---

## 🐛 Troubleshooting

### Branding não aplica

1. Verificar se `tenant_branding` tem registro para o tenant
2. Checar console do browser por erros do `tenant-config`
3. Confirmar que `TenantProvider` está envolvendo a aplicação

### Header não é enviado

1. Verificar se `TenantContext` resolveu o tenant (`tenantId` não é null)
2. Checar network tab do DevTools: header `x-tenant-id` deve aparecer
3. Confirmar que modificação do Supabase client está funcionando

### RLS bloqueia acesso mesmo com header

1. Confirmar que usuário tem papel no tenant: `SELECT * FROM user_roles WHERE user_id = auth.uid()`
2. Verificar que `effective_tenant()` está retornando o tenant correto
3. Testar manualmente: `SELECT effective_tenant()` no SQL editor

### Tela de loading infinito

1. Edge function `tenant-config` pode estar falhando
2. Verificar logs da edge function no Supabase Dashboard
3. Confirmar que domínio está cadastrado em `tenant_domains`

---

**Implementação Completa do Bloco 0.3** ✅
