

## Correção da Lógica de Prazo de Inscrição

### Problema Identificado

A lógica atual calcula o prazo de encerramento como **X horas APÓS o início do evento**, mas você espera que seja **X horas ANTES do início**.

| Lógica | Evento às 19:30 | Prazo 2h |
|--------|-----------------|----------|
| **Atual** (após) | Deadline às 21:30 | ❌ Aceita inscrições até 21:30 |
| **Esperada** (antes) | Deadline às 17:30 | ✅ Encerra inscrições às 17:30 |

### Opções de Solução

**Opção A: Mudar para "antes do evento"**
O prazo passaria a significar "inscrições encerram X horas ANTES do evento".

**Opção B: Adicionar novo campo para escolher o tipo**
Permitir configurar se é "antes" ou "depois" do evento.

**Opção C: Criar dois campos separados**
Um para "encerramento de inscrições" (antes) e outro para "validação de check-in" (depois).

---

## Seção Técnica (Opção A - Recomendada)

### 1. Atualizar `src/lib/eventUtils.ts`

```typescript
export function isEventDeadlinePassed(
  eventDate: string, 
  eventTime: string, 
  deadlineHours: number | null = 4
): boolean {
  if (deadlineHours === null) return false;
  
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  // ANTES: deadline = evento + horas (depois)
  // AGORA: deadline = evento - horas (antes)
  const deadline = new Date(eventDateTime.getTime() - (deadlineHours * 60 * 60 * 1000));
  return new Date() > deadline;
}
```

### 2. Atualizar RPC `create_event_registration`

```sql
-- ANTES: deadline = evento + horas
-- _deadline := _event_datetime + (_deadline_hours || ' hours')::interval;

-- AGORA: deadline = evento - horas
_deadline := _event_datetime - (_deadline_hours || ' hours')::interval;
```

### 3. Atualizar labels no formulário

Mudar de "X horas após o início" para "X horas antes do início":
- "1 hora antes do início"
- "2 horas antes do início"
- etc.

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Alterar RPC para usar subtração |
| `src/lib/eventUtils.ts` | Mudar de `+` para `-` no cálculo |
| `src/pages/Events.tsx` | Atualizar labels do Select |

