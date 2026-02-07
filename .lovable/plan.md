
# Horario de Silencio (21h as 8h)

## Resumo
Implementar um sistema de "horario de silencio" das **21h as 8h (horario de Brasilia)** que bloqueia disparos automaticos (cron jobs, retentativas, fallbacks), mas permite mensagens transacionais disparadas por acoes do usuario (cadastro, verificacao, etc.).

## Logica Principal

Mensagens **bloqueadas** durante o silencio:
- Retentativas automaticas de SMS (`retry-failed-sms`)
- Fallback SMS para WhatsApp (`process-sms-fallback`)
- Mensagens agendadas (`process-scheduled-messages`)
- Envio pendente de SMS para lideres (`send-pending-leader-sms`)
- Reprocessamento de status SMS (`reprocess-sms-status`)

Mensagens **permitidas** (transacionais):
- Verificacao de lider/contato (provocada por acao do usuario)
- Link de indicacao apos verificacao (provocada por cadastro)
- Inscricao em evento
- Cadastro via formulario publico
- Qualquer disparo iniciado diretamente por uma acao do usuario no sistema

## Implementacao

### 1. Configuracao no banco de dados
Adicionar colunas na tabela `integrations_settings`:
- `quiet_hours_enabled` (boolean, default true)
- `quiet_hours_start` (text, default '21:00') -- hora de inicio
- `quiet_hours_end` (text, default '08:00') -- hora de fim

### 2. Funcao utilitaria nas Edge Functions
Criar uma funcao `isQuietHours()` que sera chamada pelas Edge Functions automaticas (cron):

```typescript
function isQuietHours(settings: { quiet_hours_enabled: boolean; quiet_hours_start: string; quiet_hours_end: string }): boolean {
  if (!settings.quiet_hours_enabled) return false;
  const now = new Date();
  // Converter para horario de Brasilia (UTC-3)
  const brasiliaHour = (now.getUTCHours() - 3 + 24) % 24;
  const startHour = parseInt(settings.quiet_hours_start.split(':')[0]);
  const endHour = parseInt(settings.quiet_hours_end.split(':')[0]);
  // Ex: 21h ate 8h -> bloqueio se hora >= 21 OU hora < 8
  if (startHour > endHour) {
    return brasiliaHour >= startHour || brasiliaHour < endHour;
  }
  return brasiliaHour >= startHour && brasiliaHour < endHour;
}
```

### 3. Edge Functions que serao modificadas (adicionar verificacao de silencio)
Estas funcoes automaticas verificarao `isQuietHours()` antes de processar:

- **`process-scheduled-messages/index.ts`** -- Pular execucao se estiver no horario de silencio
- **`retry-failed-sms/index.ts`** -- Pular retentativas durante silencio
- **`process-sms-fallback/index.ts`** -- Pular fallbacks durante silencio
- **`send-pending-leader-sms/index.ts`** -- Pular envios pendentes durante silencio
- **`reprocess-sms-status/index.ts`** -- Pular reprocessamento durante silencio

### 4. Edge Functions que NAO serao modificadas (transacionais)
Estas continuam funcionando normalmente, pois sao disparadas por acao direta do usuario:

- `send-sms` (chamada direta por verificacao/cadastro)
- `send-whatsapp` (chamada direta)
- `send-email` (chamada direta)
- `send-leader-affiliate-links` (chamada apos verificacao)
- `send-event-photos`
- `resend-verification-sms`

### 5. Interface de configuracao
Adicionar um card na pagina de Integracoes (`src/pages/settings/Integrations.tsx`) com:
- Toggle para ativar/desativar horario de silencio
- Campos para configurar horario de inicio e fim
- Indicacao do fuso horario (Brasilia)

### 6. Hook do frontend
Atualizar `src/hooks/useIntegrationsSettings.ts` para incluir os novos campos de quiet hours.

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE integrations_settings
  ADD COLUMN quiet_hours_enabled boolean DEFAULT true,
  ADD COLUMN quiet_hours_start text DEFAULT '21:00',
  ADD COLUMN quiet_hours_end text DEFAULT '08:00';
```

### Padrao de bloqueio nas Edge Functions cron
Cada funcao cron recebera no inicio:
```typescript
// Verificar horario de silencio
const { data: settings } = await supabase
  .from("integrations_settings")
  .select("quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
  .limit(1)
  .single();

if (isQuietHours(settings)) {
  console.log("[function-name] Horario de silencio ativo. Pulando execucao.");
  return new Response(JSON.stringify({ success: true, skipped: true, reason: "quiet_hours" }));
}
```

### Arquivos a serem criados/modificados
1. **Migracao SQL** -- Novas colunas em `integrations_settings`
2. **5 Edge Functions** -- Adicionar verificacao de silencio
3. **1 componente novo** -- `QuietHoursCard.tsx` para configuracao
4. **`useIntegrationsSettings.ts`** -- Novos campos
5. **`Integrations.tsx`** -- Incluir novo card
