# 🔐 BLOCO 0.2 - RBAC + Guards

**Status:** ✅ Implementado  
**Objetivo:** Sistema de papéis e permissões (RBAC) com RLS seguro e guards no frontend.

---

## 📦 O que foi criado

### 1. Estrutura de Banco de Dados

#### Enum `app_role`
Papéis disponíveis no sistema:
- `super_admin`: Acesso total a todos os tenants
- `super_user`: Leitura total, sem modificações críticas
- `admin`: CRUD completo no próprio tenant
- `atendente`: Leitura + inserção limitada (contatos, visitas, check-in)
- `checkin_operator`: Apenas atualização de status de check-in

#### Tabela `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);
```

**Importante:** `tenant_id` pode ser NULL → papel GLOBAL (super_admin, super_user)

### 2. Funções SQL Auxiliares

#### `has_role(_user_id, _role, _tenant_id)`
Verifica se usuário possui papel específico.
- `_tenant_id` NULL → busca papel global
- `_tenant_id` fornecido → busca papel no tenant OU global

```sql
SELECT has_role(auth.uid(), 'admin', 'tenant-id-aqui');
```

#### `has_any_role(_user_id, _roles[], _tenant_id)`
Verifica se usuário possui QUALQUER papel da lista.

```sql
SELECT has_any_role(
  auth.uid(), 
  ARRAY['admin','atendente']::app_role[], 
  'tenant-id-aqui'
);
```

#### `current_tenant()`
Retorna tenant da sessão atual (via GUC `app.tenant_id`).

**Nota:** Será configurado pelo `TenantProvider` no Bloco 0.3.

#### `grant_role_by_email(_email, _role, _tenant_slug)`
Função utilitária para conceder papéis via SQL.

```sql
-- Conceder super_admin global
SELECT grant_role_by_email('admin@example.com', 'super_admin', NULL);

-- Conceder admin no tenant 'rafael-prudente'
SELECT grant_role_by_email('user@example.com', 'admin', 'rafael-prudente');
```

### 3. RLS Policies Atualizadas

As seguintes tabelas agora possuem RLS baseado em papéis:
- ✅ `profiles` (super_admin/super_user/admin/atendente podem visualizar)
- ✅ `lideres` (super_admin/super_user global OU admin do tenant)
- 📝 `user_roles` (super_admin/super_user veem tudo; admin vê apenas do tenant)

Políticas preparadas para tabelas futuras (serão ativadas quando as tabelas forem criadas):
- `contatos`, `events`, `event_registrations`, `gabinete_visitas`, `programas`, `ai_sessions`, `ai_messages`

### 4. Frontend: Guards e Hooks

#### `/src/lib/rbac.ts`
Tipos e funções auxiliares:
- `AppRole`: Tipo TypeScript dos papéis
- `UserRole`: Interface com `{ role, tenant_id }`
- `canSeeTenant()`: Verifica acesso a tenant
- `hasRole()`: Verifica papel específico
- `hasAnyRole()`: Verifica lista de papéis
- `isSuperUser()`: Verifica se é super admin/user
- `getAccessibleTenantIds()`: Retorna tenants acessíveis

#### `/src/hooks/useRoles.ts`
Hook React para buscar papéis do usuário:
```tsx
const { roles, loading, error } = useRoles();
```
- Busca automaticamente no login
- Limpa no logout
- Recarrega em mudanças de autenticação

#### `/src/components/RequireRole.tsx`
Componente guard para controle de acesso:
```tsx
<RequireRole anyOf={['admin', 'atendente']}>
  <Button>Cadastrar contato</Button>
</RequireRole>

<RequireRole anyOf={['admin']} tenantId={currentTenantId}>
  <SettingsPanel />
</RequireRole>
```

---

## 🚀 Como usar

### 1. Conceder papéis iniciais

Após implementar o Bloco 0.2, rode no SQL Editor do backend:

```sql
-- Conceder super_admin global aos administradores
SELECT grant_role_by_email('joao@rafaelprudente.com', 'super_admin', NULL);

-- Conceder admin no tenant 'rafael-prudente'
SELECT grant_role_by_email('admin@rafaelprudente.com', 'admin', 'rafael-prudente');

-- Conceder atendente no tenant 'rafael-prudente'
SELECT grant_role_by_email('atendente@rafaelprudente.com', 'atendente', 'rafael-prudente');
```

### 2. Verificar papéis de um usuário

```sql
SELECT * FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### 3. Usar guards no frontend

#### Esconder elemento se não tiver permissão
```tsx
import { RequireRole } from '@/components/RequireRole';

function MyComponent() {
  return (
    <div>
      <RequireRole anyOf={['admin']}>
        <Button onClick={handleDelete}>Deletar</Button>
      </RequireRole>
    </div>
  );
}
```

#### Verificar programaticamente
```tsx
import { useRoles } from '@/hooks/useRoles';
import { hasRole } from '@/lib/rbac';

function MyComponent() {
  const { roles, loading } = useRoles();
  
  if (loading) return <Spinner />;
  
  const canEdit = hasRole(roles, 'admin', tenantId);
  
  return (
    <div>
      {canEdit && <EditButton />}
    </div>
  );
}
```

---

## 🧪 Testes mínimos

### 1. Testar super_admin global
Após conceder `super_admin` a um usuário:
```sql
-- Logar como super_admin
SELECT * FROM user_roles; -- Deve ver TODOS os papéis
SELECT * FROM profiles; -- Deve ver TODOS os profiles
SELECT * FROM lideres; -- Deve ver TODOS os lideres
```

### 2. Testar admin do tenant
Após conceder `admin` no tenant 'rafael-prudente':
```sql
-- Logar como admin do tenant
SELECT * FROM profiles WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'rafael-prudente');
-- Deve ver apenas profiles do tenant

SELECT * FROM lideres WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'rafael-prudente');
-- Deve ver apenas lideres do tenant
```

### 3. Testar usuário sem papel
Criar novo usuário sem papéis e tentar:
```sql
SELECT * FROM profiles; -- Deve retornar vazio (sem erro)
SELECT * FROM lideres; -- Deve retornar vazio (sem erro)
```

### 4. Testar hierarquia de papéis

| Papel | Ação | Resultado esperado |
|-------|------|-------------------|
| `super_admin` | SELECT em qualquer tenant | ✅ Permitido |
| `super_admin` | INSERT/UPDATE/DELETE em qualquer tenant | ✅ Permitido |
| `super_user` | SELECT em qualquer tenant | ✅ Permitido |
| `super_user` | INSERT/UPDATE/DELETE em qualquer tenant | ⚠️ Depende da tabela |
| `admin` | CRUD no próprio tenant | ✅ Permitido |
| `admin` | CRUD em outro tenant | ❌ Negado |
| `atendente` | SELECT no próprio tenant | ✅ Permitido |
| `atendente` | INSERT contatos/visitas no tenant | ✅ Permitido |
| `atendente` | DELETE em qualquer tabela | ❌ Negado |
| `checkin_operator` | UPDATE status de check-in | ✅ Permitido |
| `checkin_operator` | INSERT/DELETE eventos | ❌ Negado |

---

## 🔒 Matriz de Permissões

### Profiles
- **SELECT:** próprio profile OU super_admin/super_user OU admin/atendente do tenant
- **UPDATE:** próprio profile OU super_admin/super_user OU admin do tenant

### Lideres
- **SELECT:** super_admin/super_user OU admin/atendente do tenant
- **INSERT/UPDATE/DELETE:** super_admin/super_user OU admin do tenant

### User Roles
- **SELECT:** super_admin/super_user (tudo) OU admin/atendente (apenas do tenant)
- **INSERT:** super_admin/super_user
- **UPDATE/DELETE:** super_admin/super_user OU admin do tenant

---

## ⚠️ Observações importantes

### 1. `current_tenant()` ainda não funciona
A função `current_tenant()` retorna `NULL` até que o `TenantProvider` (Bloco 0.3) configure o GUC `app.tenant_id`.

**Por enquanto:** Usar `tenant_id` diretamente nas queries do frontend:
```tsx
const { data } = await supabase
  .from('lideres')
  .select('*')
  .eq('tenant_id', currentTenantId);
```

### 2. Políticas preparatórias
As políticas de `contatos`, `events`, etc. só serão ativadas quando essas tabelas forem criadas. Não causam erros enquanto isso.

### 3. Security Definer
Todas as funções auxiliares (`has_role`, `has_any_role`) usam `SECURITY DEFINER` para:
- Ignorar RLS ao consultar `user_roles`
- Evitar recursão infinita nas políticas

### 4. Papéis globais (tenant_id NULL)
Papéis globais (`super_admin`, `super_user`) devem SEMPRE ter `tenant_id = NULL`.
Papéis locais devem SEMPRE ter `tenant_id` definido.

---

## 🔄 Próximos passos (Bloco 0.3)

- [ ] Implementar `TenantProvider` para configurar `app.tenant_id` via GUC
- [ ] Criar hook `useTenant()` para gerenciar tenant atual
- [ ] Atualizar guards para usar tenant do contexto
- [ ] Implementar seletor de tenant (para super_admin/super_user)
- [ ] Criar página de gerenciamento de papéis (UI)

---

## 📚 Referências

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Definer](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [GUC (Runtime Config Variables)](https://www.postgresql.org/docs/current/runtime-config-client.html)

---

**✅ Bloco 0.2 concluído!** Sistema RBAC implementado e pronto para uso.
