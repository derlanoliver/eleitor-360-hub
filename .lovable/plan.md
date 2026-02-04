

## Excluir Líder David Sveci

### Registro Identificado

Encontrado na tabela `lideres`:

| Campo | Valor |
|-------|-------|
| ID | `6245439c-f739-4803-9dd6-1e7f462a15ad` |
| Nome | David Sveci |
| Email | davi_2d@hotmail.com |
| Telefone | +5527999161738 |

### Plano de Execução

1. **Anular referências** em tabelas relacionadas para evitar erros de chave estrangeira:
   - `event_registrations.leader_id`
   - `event_registrations.referred_by_leader_id`
   - `email_logs.leader_id`
   - `scheduled_messages.leader_id`
   - `office_visits.leader_id`
   - `survey_responses.leader_id`
   - `survey_responses.referred_by_leader_id`

2. **Excluir o registro** da tabela `lideres`

3. **Verificar** que o registro foi removido

---

### Detalhes Técnicos

```sql
-- Passo 1: Anular referências em tabelas relacionadas
UPDATE event_registrations SET leader_id = NULL WHERE leader_id = '6245439c-f739-4803-9dd6-1e7f462a15ad';
UPDATE event_registrations SET referred_by_leader_id = NULL WHERE referred_by_leader_id = '6245439c-f739-4803-9dd6-1e7f462a15ad';
UPDATE email_logs SET leader_id = NULL WHERE leader_id = '6245439c-f739-4803-9dd6-1e7f462a15ad';
UPDATE scheduled_messages SET leader_id = NULL WHERE leader_id = '6245439c-f739-4803-9dd6-1e7f462a15ad';
UPDATE office_visits SET leader_id = NULL WHERE leader_id = '6245439c-f739-4803-9dd6-1e7f462a15ad';
UPDATE survey_responses SET leader_id = NULL WHERE leader_id = '6245439c-f739-4803-9dd6-1e7f462a15ad';
UPDATE survey_responses SET referred_by_leader_id = NULL WHERE referred_by_leader_id = '6245439c-f739-4803-9dd6-1e7f462a15ad';

-- Passo 2: Excluir o líder
DELETE FROM lideres WHERE id = '6245439c-f739-4803-9dd6-1e7f462a15ad';
```

