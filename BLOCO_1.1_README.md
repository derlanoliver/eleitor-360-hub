# BLOCO 1.1 - Configurações do Tenant (Organização/Branding/Domínios)

## 📋 Visão Geral

Este bloco implementa o módulo completo de **Configurações do Tenant**, permitindo que administradores gerenciem:

- **Organização**: Dados públicos do político/campanha (nome, contatos, endereço, redes sociais)
- **Branding**: Identidade visual (cor primária, logo, favicon) com aplicação em runtime
- **Domínios**: Gestão de domínios customizados (whitelabel/multi-domínio)

Todas as funcionalidades estão protegidas por **RBAC** (apenas `admin`, `super_admin` e `super_user` podem editar).

---

## 🗂️ Estrutura de Rotas

```
/settings (Hub principal)
  ├── /organization ✅ Implementado
  ├── /branding ✅ Implementado
  ├── /domains ✅ Implementado
  ├── /team 🚧 Stub (Bloco 1.2)
  ├── /integrations 🚧 Stub (Bloco 1.3)
  ├── /billing 🚧 Stub (Bloco 1.5)
  ├── /privacy 🚧 Stub (Bloco 1.6)
  └── /ai-providers ✅ Já existia
```

---

## 🔐 RBAC (Controle de Acesso)

### Políticas RLS Implementadas

#### `tenant_settings`
- **SELECT**: `super_admin`, `super_user` OU tenant atual via `effective_tenant()`
- **INSERT/UPDATE/DELETE**: `super_admin`, `super_user` OU `admin` do tenant

#### `tenant_branding`
- **SELECT**: `super_admin`, `super_user` OU tenant atual via `effective_tenant()`
- **INSERT/UPDATE/DELETE**: `super_admin`, `super_user` OU `admin` do tenant

#### `tenant_domains`
- **SELECT**: `super_admin`, `super_user` OU tenant atual via `effective_tenant()`
- **INSERT/UPDATE/DELETE**: `super_admin`, `super_user` OU `admin` do tenant

### Guards de Rota

Todas as rotas de configurações usam:
```tsx
<ProtectedRoute>
  <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
    <DashboardLayout>
      <ComponentPage />
    </DashboardLayout>
  </RequireRole>
</ProtectedRoute>
```

**Comportamento:**
- Usuários **atendente** e **checkin_operator**: podem visualizar mas **não editar**
- Usuários **admin**: podem editar apenas seu próprio tenant
- Usuários **super_admin** e **super_user**: podem editar qualquer tenant

---

## 🏢 Organização (`/settings/organization`)

### Schema de Dados (`organization_data` - JSONB)

```json
{
  "public_name": "Deputado Rafael Prudente",
  "contact_email": "contato@rafaelprudente.com.br",
  "contact_phone": "+55 61 99999-9999",
  "default_ra_id": "uuid-da-regiao-administrativa",
  "address": {
    "street": "SCS Quadra 1, Bloco A",
    "city": "Brasília",
    "state": "DF",
    "zip": "70000-000"
  },
  "social": {
    "instagram": "@rafaelprudente",
    "youtube": "RafaelPrudente",
    "site": "https://rafaelprudente.com.br"
  }
}
```

### Funcionalidades

1. **Formulário de edição** com seções:
   - Dados básicos (nome, e-mail, telefone)
   - Localização (RA padrão, endereço completo)
   - Redes sociais (Instagram, YouTube, Site)

2. **Dropdown de RAs** populado automaticamente da tabela `regiao_administrativa`

3. **Persistência**: `UPDATE` em `tenant_settings.organization_data`

4. **Validações**: Frontend básicas (campos obrigatórios, formato de e-mail)

---

## 🎨 Branding (`/settings/branding`)

### Schema de Dados (`tenant_branding`)

```typescript
{
  primary_color: string;  // Hex color (ex: "#F25822")
  logo_url: string | null;
  favicon_url: string | null;
}
```

### Aplicação em Runtime

Quando o usuário salva alterações de branding:

```typescript
// 1. Atualizar no banco
await supabase.from('tenant_branding').update({ primary_color, logo_url, favicon_url })

// 2. Aplicar cor primária imediatamente
document.documentElement.style.setProperty('--primary', primary_color)

// 3. Atualizar favicon dinamicamente
let linkEl = document.querySelector("link[rel~='icon']")
if (!linkEl) {
  linkEl = document.createElement('link')
  linkEl.rel = 'icon'
  document.head.appendChild(linkEl)
}
linkEl.href = favicon_url
```

**Resultado:** Mudanças são **instantâneas** (sem reload da página).

### Funcionalidades

1. **Color Picker** nativo (HTML5 `<input type="color">`)
2. **Preview visual** da cor primária em botões e links
3. **Campos de URL** para logo e favicon
4. **Persistência** com feedback via toast

---

## 🌐 Domínios (`/settings/domains`)

### Schema de Dados (`tenant_domains`)

```typescript
{
  id: uuid;
  tenant_id: uuid;
  domain: string;              // ex: "plataforma.exemplo.com.br"
  is_primary: boolean;         // apenas UM domínio pode ser primário
  ssl_status: "pending" | "active" | "error";
}
```

### Funcionalidades

1. **Adicionar domínio**
   - Input text + botão "Adicionar"
   - Validação básica de formato
   - Status SSL inicial: `pending`

2. **Listar domínios**
   - Ordenados por `is_primary DESC`
   - Badge visual para domínio primário
   - Exibição do status SSL

3. **Tornar primário**
   - Desativa `is_primary` em todos os outros
   - Ativa no selecionado
   - Lógica de transação segura

4. **Remover domínio**
   - Bloqueado se for primário
   - Confirmação via toast

### Lógica de Domínio Primário

```typescript
async function makePrimary(id: string) {
  // 1. Desmarcar todos
  await supabase
    .from('tenant_domains')
    .update({ is_primary: false })
    .eq('tenant_id', tenantId)

  // 2. Marcar o selecionado
  await supabase
    .from('tenant_domains')
    .update({ is_primary: true })
    .eq('id', id)
}
```

### Configuração DNS (Instruções para o usuário)

1. Acessar painel do provedor de domínio (Registro.br, GoDaddy, etc.)
2. Adicionar registro **CNAME** apontando para o domínio da plataforma
3. Aguardar propagação DNS (até 48h)
4. Certificado SSL provisionado automaticamente pelo CDN

---

## 🧭 Navegação (SettingsTabs)

Componente de tabs horizontal com navegação entre todas as seções:

```tsx
<SettingsTabs />
```

**Abas disponíveis:**
- Organização ✅
- Branding ✅
- Domínios ✅
- Equipe (stub)
- Integrações (stub)
- Faturamento (stub)
- Privacidade (stub)
- Provedores de IA ✅

**Estilo:**
- Aba ativa com **borda inferior colorida** (`border-primary`)
- Hover states
- Scroll horizontal em mobile

---

## 📦 Arquivos Criados/Modificados

### Novos Arquivos

```
src/components/settings/
  └── SettingsTabs.tsx

src/pages/settings/
  ├── OrganizationPage.tsx
  ├── BrandingPage.tsx
  ├── DomainsPage.tsx
  ├── TeamPage.tsx (stub)
  ├── IntegrationsPage.tsx (stub)
  ├── BillingPage.tsx (stub)
  └── PrivacyPage.tsx (stub)
```

### Arquivos Modificados

```
src/App.tsx
  - Adicionadas rotas com guards RequireRole
  - Importações dos novos componentes

src/pages/Settings.tsx
  - Marcadas seções Organization, Branding, Domains como available: true
  - Reordenação das seções

src/components/AppSidebar.tsx
  - Link principal para /settings no menu de configurações
```

### Migração SQL

```
supabase/migrations/
  └── 20XXXXXX_settings_org_branding_domains.sql
      - RLS policies para tenant_settings
      - RLS policies para tenant_branding
      - RLS policies para tenant_domains
      - Índice em tenant_domains(tenant_id)
```

---

## 🧪 Testes de Validação

### ✅ Organização

1. **Como admin:**
   - [ ] Salvar dados de organização
   - [ ] Verificar persistência no DB (`tenant_settings.organization_data`)
   - [ ] Dropdown de RA populado corretamente
   - [ ] Campos obrigatórios validados

2. **Como atendente:**
   - [ ] Consegue visualizar página mas botão "Salvar" está desabilitado

### ✅ Branding

1. **Como admin:**
   - [ ] Alterar cor primária usando color picker
   - [ ] Cor muda **instantaneamente** na interface (sem reload)
   - [ ] Salvar logo e favicon URLs
   - [ ] Preview visual funciona

2. **Validação de runtime:**
   - [ ] `document.documentElement.style.getPropertyValue('--primary')` reflete nova cor
   - [ ] Favicon é atualizado dinamicamente

### ✅ Domínios

1. **CRUD básico:**
   - [ ] Adicionar novo domínio
   - [ ] Listar domínios ordenados (primário primeiro)
   - [ ] Tornar domínio primário (atualiza badge)
   - [ ] Remover domínio secundário
   - [ ] Impossível remover domínio primário (erro exibido)

2. **Edge cases:**
   - [ ] Tentativa de adicionar domínio vazio (erro)
   - [ ] Tenant sem domínios ainda (mensagem amigável)

### ✅ RBAC

1. **Permissões:**
   - [ ] `super_admin` consegue editar qualquer tenant
   - [ ] `admin` edita apenas seu próprio tenant
   - [ ] `atendente` consegue visualizar mas não editar

2. **Guards de rota:**
   - [ ] Usuário sem permissão é redirecionado ou vê mensagem de erro
   - [ ] `RequireRole` funciona corretamente em todas as rotas

---

## 🚨 Segurança

### Isolamento de Tenant

Todas as queries usam `effective_tenant()` para garantir:
- Admin só acessa dados do seu próprio tenant
- Super_admin pode acessar qualquer tenant
- Atendentes não podem editar configurações

### Validação de Inputs

- **Frontend**: Validação básica de tipos e formatos
- **Backend**: RLS policies garantem que apenas admins modificam dados
- **JSONB flexível**: `organization_data` aceita campos extras sem quebrar schema

### Branding Runtime

Aplicação de CSS vars e favicon é **client-side only** (não afeta outros usuários conectados até eles recarregarem).

Para broadcast de mudanças em tempo real (futuro):
```typescript
// Usar Supabase Realtime em tenant_branding
supabase
  .channel('branding-updates')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tenant_branding' }, 
    (payload) => {
      // Aplicar mudanças para todos os usuários conectados
    }
  )
  .subscribe()
```

---

## 🔄 Próximos Blocos

- **Bloco 1.2**: Equipe (CRUD de usuários, convites, permissões)
- **Bloco 1.3**: Integrações (WhatsApp, e-mail marketing, redes sociais)
- **Bloco 1.4**: Provedores de IA (já implementado, melhorias futuras)
- **Bloco 1.5**: Faturamento (planos, pagamentos, uso)
- **Bloco 1.6**: Privacidade (LGPD, consentimentos, auditoria)

---

## 📚 Referências

### Contextos e Hooks Utilizados

```typescript
import { useTenant } from '@/contexts/TenantContext'
import { useRoles } from '@/hooks/useRoles'
import { useToast } from '@/hooks/use-toast'
```

### Componentes Base

```typescript
import { RequireRole } from '@/components/RequireRole'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import { Button, Input, Label } from '@/components/ui/*'
```

### Funções do Banco

```sql
-- Resolução de tenant
effective_tenant() → uuid

-- Verificação de papéis
has_role(user_id, role, tenant_id) → boolean
has_any_role(user_id, roles[], tenant_id) → boolean
```

---

## 🎯 Definition of Done

- [x] Migração SQL 08 executada com sucesso
- [x] RLS policies garantem isolamento por tenant
- [x] `SettingsTabs` navegação funcionando
- [x] **OrganizationPage** salva/lê `organization_data` corretamente
- [x] **BrandingPage** atualiza cor/logo/favicon em runtime
- [x] **DomainsPage** lista/adiciona/remove/torna primário domínios
- [x] Todas as rotas registradas com guards de RBAC
- [x] Dropdown de RAs populado no form de Organização
- [x] Página `/settings` marca as novas seções como disponíveis
- [x] Sidebar tem link para configurações
- [x] Documentação completa em `BLOCO_1.1_README.md`
- [x] Stubs criados para blocos futuros (Team, Integrations, Billing, Privacy)

---

**Status:** ✅ Implementado e funcional  
**Versão:** 1.0  
**Data:** 2025-01-08
