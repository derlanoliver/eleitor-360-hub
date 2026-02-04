

## Correção: Migração SQL Completa para Verificação WhatsApp

### Problema Identificado

A migração anterior (`20260204005403`) só incluiu os templates WhatsApp. Estão faltando:

1. **6 novas colunas em `integrations_settings`**
2. **Tabela `contact_verifications`**
3. **3 RPCs** (`create_whatsapp_verification`, `process_verification_keyword`, `process_verification_consent`)

### Solução

Criar uma nova migração SQL que adiciona todos os elementos faltantes.

---

## Migração SQL a ser Criada

### 1. Colunas em `integrations_settings`

```sql
ALTER TABLE integrations_settings 
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'link',
ADD COLUMN IF NOT EXISTS verification_wa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_wa_test_mode BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS verification_wa_whitelist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS verification_wa_keyword TEXT DEFAULT 'CONFIRMAR',
ADD COLUMN IF NOT EXISTS verification_wa_zapi_phone TEXT;
```

### 2. Tabela `contact_verifications`

```sql
CREATE TABLE IF NOT EXISTS contact_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type TEXT NOT NULL,
  contact_id UUID NOT NULL,
  method TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  keyword_received_at TIMESTAMPTZ,
  consent_question_sent_at TIMESTAMPTZ,
  consent_received_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  consent_text_version TEXT DEFAULT 'v1',
  consent_channel TEXT,
  consent_message_id TEXT
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_verifications_phone_status 
  ON contact_verifications(phone, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verifications_active_per_contact 
  ON contact_verifications(contact_type, contact_id) 
  WHERE status IN ('pending', 'keyword_received', 'awaiting_consent');

-- RLS
ALTER TABLE contact_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access" ON contact_verifications
  FOR SELECT USING (has_admin_access(auth.uid()));
```

### 3. RPCs (Security Definer)

Três funções para o fluxo seguro de verificação:

- `create_whatsapp_verification`: Cria/reutiliza token de verificação
- `process_verification_keyword`: Processa recebimento da keyword
- `process_verification_consent`: Processa resposta "SIM"

---

## Arquivo a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/[timestamp]_add_verification_schema.sql` | Migração completa com colunas, tabela e RPCs |

---

## Após Migração

Ao aplicar a migração, os types do Supabase serão atualizados automaticamente e o card de configuração funcionará corretamente.

