

## Corrigir Permissão para Edição de Templates SMS

### Problema Identificado

A edição de templates SMS não está sendo salva no banco de dados devido a uma **política RLS restritiva**.

| Situação | Valor |
|----------|-------|
| Role do usuário | `super_admin` |
| Role exigida pela política | `admin` (exato) |
| Resultado | UPDATE bloqueado silenciosamente |

A política `sms_templates_modify` usa a função `has_role(auth.uid(), 'admin')` que faz comparação exata, não reconhecendo que `super_admin` deveria ter as mesmas permissões.

### Solução

Atualizar a política RLS da tabela `sms_templates` para permitir que tanto `admin` quanto `super_admin` possam modificar templates.

---

## Seção Técnica

### Migração SQL

```sql
-- Remover política antiga
DROP POLICY IF EXISTS sms_templates_modify ON sms_templates;

-- Criar nova política que aceita admin OU super_admin
CREATE POLICY sms_templates_modify ON sms_templates
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);
```

### Alternativa (Melhor Prática)

Criar uma função auxiliar que verifica se o usuário é administrador (qualquer tipo):

```sql
CREATE OR REPLACE FUNCTION is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'super_admin')
  )
$$;
```

E depois atualizar a política:

```sql
DROP POLICY IF EXISTS sms_templates_modify ON sms_templates;

CREATE POLICY sms_templates_modify ON sms_templates
FOR ALL
TO public
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
```

### Resultado Esperado

Após a migração:
- Usuários com role `admin` podem editar templates
- Usuários com role `super_admin` também podem editar templates
- As edições serão persistidas corretamente no banco

