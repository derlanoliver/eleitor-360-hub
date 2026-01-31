

## Prazo de Inscrição Configurável por Evento

### O Que Será Implementado

Cada evento terá seu próprio prazo de encerramento de inscrições, configurável no momento da criação ou edição. O valor padrão será **4 horas** após o início do evento, mas poderá ser alterado conforme necessidade.

### Alterações na Interface

| Local | Alteração |
|-------|-----------|
| Formulário de criação | Novo campo "Prazo de inscrição" |
| Formulário de edição | Mesmo campo para editar |
| Valor padrão | 4 horas (mantém comportamento atual) |

### Opções de Prazo

```
┌─────────────────────────────────────────────────┐
│  Prazo para inscrições                          │
│  ┌─────────────────────────────────────────┐    │
│  │ 4 horas após o início do evento       ▼│    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Opções:                                        │
│  • 1 hora após o início                         │
│  • 2 horas após o início                        │
│  • 4 horas após o início (padrão)               │
│  • 8 horas após o início                        │
│  • 24 horas após o início                       │
│  • Sem limite (inscrições sempre abertas)       │
└─────────────────────────────────────────────────┘
```

---

## Seção Técnica

### 1. Migração SQL

Adicionar coluna na tabela `events` e atualizar a função RPC:

```sql
-- Adicionar coluna de prazo (em horas, NULL = sem limite)
ALTER TABLE events ADD COLUMN registration_deadline_hours integer DEFAULT 4;

-- Atualizar função RPC para usar prazo configurável
CREATE OR REPLACE FUNCTION create_event_registration(...)
AS $$
DECLARE
  ...
  _deadline_hours integer;
BEGIN
  -- Buscar evento e prazo configurado
  SELECT (e.date + e.time)::timestamp with time zone, e.registration_deadline_hours
  INTO _event_datetime, _deadline_hours
  FROM events e
  WHERE e.id = _event_id AND e.status = 'active';
  
  -- Verificar prazo se configurado (NULL = sem limite)
  IF _deadline_hours IS NOT NULL THEN
    _deadline := _event_datetime + (_deadline_hours || ' hours')::interval;
    IF now() > _deadline THEN
      RAISE EXCEPTION 'O prazo para inscrições neste evento foi encerrado.';
    END IF;
  END IF;
  
  -- resto do código...
END;
$$;
```

### 2. Atualizar Hooks

**`src/hooks/events/useCreateEvent.ts`:**
```typescript
type CreateEventData = {
  ...
  registration_deadline_hours?: number | null;
};

// No insert:
registration_deadline_hours: data.registration_deadline_hours ?? 4,
```

**`src/hooks/events/useUpdateEvent.ts`:**
```typescript
type UpdateEventData = {
  ...
  registration_deadline_hours?: number | null;
};
```

### 3. Atualizar `src/lib/eventUtils.ts`

```typescript
export function isEventDeadlinePassed(
  eventDate: string, 
  eventTime: string, 
  deadlineHours: number | null = 4
): boolean {
  // Sem limite se null
  if (deadlineHours === null) return false;
  
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  const deadline = new Date(eventDateTime.getTime() + (deadlineHours * 60 * 60 * 1000));
  return new Date() > deadline;
}
```

### 4. Atualizar Formulário em `src/pages/Events.tsx`

**Estado do novo evento:**
```typescript
const [newEvent, setNewEvent] = useState({
  ...
  registration_deadline_hours: 4 as number | null,
});
```

**Novo campo no formulário:**
```tsx
<div>
  <Label htmlFor="deadline">Prazo para inscrições</Label>
  <Select 
    value={String(newEvent.registration_deadline_hours ?? "null")} 
    onValueChange={(v) => setNewEvent({ 
      ...newEvent, 
      registration_deadline_hours: v === "null" ? null : parseInt(v) 
    })}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">1 hora após o início</SelectItem>
      <SelectItem value="2">2 horas após o início</SelectItem>
      <SelectItem value="4">4 horas após o início (padrão)</SelectItem>
      <SelectItem value="8">8 horas após o início</SelectItem>
      <SelectItem value="24">24 horas após o início</SelectItem>
      <SelectItem value="null">Sem limite</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 5. Atualizar Páginas Públicas

**`src/pages/EventRegistration.tsx`:**
```typescript
const isRegistrationClosed = isEventDeadlinePassed(
  event.date, 
  event.time, 
  event.registration_deadline_hours
);
```

**`src/pages/EventCheckin.tsx`:**
```typescript
// Similar, usar registration_deadline_hours do evento
```

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Adicionar coluna e atualizar RPC |
| `src/lib/eventUtils.ts` | Aceitar parâmetro de horas |
| `src/hooks/events/useCreateEvent.ts` | Adicionar campo |
| `src/hooks/events/useUpdateEvent.ts` | Adicionar campo |
| `src/pages/Events.tsx` | Formulário de criação/edição |
| `src/pages/EventRegistration.tsx` | Usar prazo do evento |
| `src/pages/EventCheckin.tsx` | Usar prazo do evento |

