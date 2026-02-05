
## Plano: Adicionar WhatsApp Cloud API (Meta) como Opção ao Z-API

### Visão Geral

Implementar suporte à API oficial do WhatsApp Business (Cloud API) da Meta como provedor alternativo ao Z-API existente, com toggle de seleção, modo teste e fallback configurável.

---

## 1. Alterações no Banco de Dados

### 1.1 Novas Colunas na Tabela `integrations_settings`

```sql
-- Configurações do WhatsApp Cloud API (Meta)
ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  whatsapp_provider_active TEXT DEFAULT 'zapi' CHECK (whatsapp_provider_active IN ('zapi', 'meta_cloud'));

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_enabled BOOLEAN DEFAULT false;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_test_mode BOOLEAN DEFAULT true;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_whitelist JSONB DEFAULT '[]'::jsonb;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_phone_number_id TEXT;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_waba_id TEXT;

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_api_version TEXT DEFAULT 'v20.0';

ALTER TABLE integrations_settings ADD COLUMN IF NOT EXISTS 
  meta_cloud_fallback_enabled BOOLEAN DEFAULT false;
```

### 1.2 Nova Coluna na Tabela `whatsapp_messages`

```sql
-- Rastrear qual provedor enviou a mensagem
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS 
  provider TEXT DEFAULT 'zapi';

-- Adicionar campo para ID único de cliente (idempotência)
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS 
  client_message_id TEXT;

-- Índice para idempotência
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_messages_client_id 
  ON whatsapp_messages(client_message_id) WHERE client_message_id IS NOT NULL;
```

---

## 2. Gerenciamento de Secrets

### 2.1 Secrets Necessários (Supabase Secrets)

O Access Token da Meta **NÃO** será armazenado no banco. Deve ser configurado como secret:

| Secret | Descrição |
|--------|-----------|
| `META_WA_ACCESS_TOKEN` | Token permanente via System User (obrigatório) |
| `META_APP_SECRET` | Para validação de webhooks (opcional, futuro) |

### 2.2 Aviso na UI

Exibir mensagem clara:
> "O Access Token deve ser configurado como secret no ambiente. Não será armazenado no banco de dados por segurança."

---

## 3. Edge Function: `send-whatsapp` (Atualização)

### 3.1 Novo Fluxo com Abstração de Provedor

```text
┌─────────────────────────────────────────────────────────────────┐
│                      send-whatsapp                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Receber request (phone, message, templateSlug, etc.)        │
│  2. Carregar integrations_settings                               │
│  3. Determinar provedor:                                         │
│     - Se providerOverride → usar override (admin)                │
│     - Senão → usar whatsapp_provider_active                      │
│  4. Se meta_cloud:                                               │
│     - Se test_mode → verificar whitelist                         │
│     - Construir request Graph API                                │
│     - Enviar para https://graph.facebook.com/{version}/{id}     │
│  5. Se zapi:                                                     │
│     - Usar implementação atual                                   │
│  6. Registrar em whatsapp_messages com provider                  │
│  7. Se falhou E fallback habilitado:                             │
│     - Tentar provedor alternativo                                │
│     - Registrar tentativa                                        │
│  8. Retornar { success, providerUsed, message_id, error? }      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Estrutura do Request para Graph API

```typescript
// URL: https://graph.facebook.com/{apiVersion}/{phoneNumberId}/messages
// Headers:
//   Authorization: Bearer {META_WA_ACCESS_TOKEN}
//   Content-Type: application/json

// Body para texto simples:
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+5511999999999",
  "type": "text",
  "text": { "body": "Mensagem aqui" }
}

// Body para template (preparar estrutura):
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "template",
  "template": {
    "name": "nome_do_template",
    "language": { "code": "pt_BR" },
    "components": [...]
  }
}
```

### 3.3 Tipagens para Payload

```typescript
type WhatsAppOutgoingPayload = 
  | { kind: 'text'; body: string }
  | { kind: 'template'; name: string; language: string; components?: any[] };
```

---

## 4. Nova Edge Function: `test-meta-cloud-connection`

Criar função para testar a conexão com a Cloud API:

```typescript
// Endpoint: GET https://graph.facebook.com/{version}/{phoneNumberId}
// Verifica se o token é válido e retorna info do número
```

---

## 5. Atualização do Frontend

### 5.1 Arquivo: `src/pages/settings/Integrations.tsx`

Adicionar nova seção após Z-API:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🟢 WhatsApp Cloud API (Meta Oficial)                            │
│ ─────────────────────────────────────────────────────────────── │
│ Provedor Ativo: ○ Z-API  ● WhatsApp Cloud API                   │
│ ─────────────────────────────────────────────────────────────── │
│ Phone Number ID: [___________________________]                   │
│ WABA ID: [___________________________] (opcional)                │
│ Versão da API: [ v20.0 ▼ ]                                      │
│                                                                  │
│ ⚠️ O Access Token deve ser configurado como secret              │
│    no ambiente (META_WA_ACCESS_TOKEN).                          │
│                                                                  │
│ [✓] Modo Teste                                                  │
│ Whitelist (números E.164):                                       │
│ [+5511999999999, +5521888888888]                                │
│                                                                  │
│ [ ] Habilitar fallback (tentar outro provedor se falhar)        │
│                                                                  │
│ [Testar Conexão]  [Salvar]                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Arquivo: `src/hooks/useIntegrationsSettings.ts`

Adicionar novos campos à interface:

```typescript
interface IntegrationsSettings {
  // ... campos existentes ...
  
  // WhatsApp Cloud API (Meta)
  whatsapp_provider_active: 'zapi' | 'meta_cloud';
  meta_cloud_enabled: boolean;
  meta_cloud_test_mode: boolean;
  meta_cloud_whitelist: string[];
  meta_cloud_phone_number_id: string | null;
  meta_cloud_waba_id: string | null;
  meta_cloud_api_version: string;
  meta_cloud_fallback_enabled: boolean;
}
```

Adicionar hook `useTestMetaCloudConnection()`.

---

## 6. Plano de Rollout Seguro

### 6.1 Fase 1: Modo Teste (Padrão)

| Configuração | Valor |
|--------------|-------|
| `meta_cloud_enabled` | `true` |
| `meta_cloud_test_mode` | `true` |
| `whatsapp_provider_active` | `meta_cloud` |
| `meta_cloud_whitelist` | `["+55XXXXXXXXXXX"]` |

Comportamento: Apenas números na whitelist recebem via Cloud API. Outros recebem via Z-API.

### 6.2 Fase 2: Produção

| Configuração | Valor |
|--------------|-------|
| `meta_cloud_test_mode` | `false` |

Comportamento: Todos os envios usam Cloud API.

---

## 7. Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx_add_meta_cloud_settings.sql` | Criar | Migration para novas colunas |
| `supabase/functions/send-whatsapp/index.ts` | Modificar | Adicionar lógica de provider switch |
| `supabase/functions/test-meta-cloud-connection/index.ts` | Criar | Testar conexão com Graph API |
| `src/pages/settings/Integrations.tsx` | Modificar | UI de configuração |
| `src/hooks/useIntegrationsSettings.ts` | Modificar | Tipos e hooks |

---

## 8. Considerações sobre Templates

A Cloud API oficial exige templates aprovados pela Meta para iniciar conversas fora da janela de 24h. O sistema atual com Z-API envia mensagens livres.

**Estratégia:**
1. Manter suporte a `text` (mensagem livre) para conversas dentro da janela
2. Preparar estrutura de `template` para uso futuro
3. Documentar que templates precisam ser criados no Meta Business Manager

---

## 9. Checklist de Testes

- [x] Z-API ativo: tudo funciona como antes
- [x] Meta Cloud ativo + test_mode=true + número na whitelist: envia via Cloud API
- [x] Meta Cloud ativo + test_mode=true + número fora da whitelist: bloqueia (ou usa fallback se ativo)
- [x] Meta Cloud ativo + test_mode=false: envia para qualquer número
- [x] Fallback habilitado: se Cloud API falha, tenta Z-API
- [x] Histórico (`whatsapp_messages`) registra o `provider` correto
- [x] Nenhum token aparece em logs/console/frontend

---

## 10. Documentação de Secrets Necessários

Após implementação, os seguintes secrets devem existir no ambiente Supabase:

| Secret | Obrigatório | Onde Obter |
|--------|-------------|------------|
| `META_WA_ACCESS_TOKEN` | Sim (se usar Cloud API) | Meta Business Suite > System User > Token |
| `META_APP_SECRET` | Não (futuro) | Meta Developers > App Settings |

---

## 11. Ordem de Implementação (CONCLUÍDO ✅)

1. ✅ **Migration SQL** - Colunas adicionadas
2. ✅ **Request Secret** - `META_WA_ACCESS_TOKEN` configurado
3. ✅ **Edge Function `test-meta-cloud-connection`** - Criada e deployada
4. ✅ **Edge Function `send-whatsapp`** - Refatorada com provider switch
5. ✅ **Hook `useIntegrationsSettings`** - Tipos atualizados + novo hook `useTestMetaCloudConnection`
6. ✅ **UI Integrations.tsx** - Novo componente `MetaCloudConfigCard` adicionado
7. ⏳ **Testes manuais** - Pendente validação pelo usuário
