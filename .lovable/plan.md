

## Verificacao via WhatsApp com Consentimento (Revisado)

### Resumo das Mudancas Solicitadas

1. **Codigo de verificacao NAO expira** - tokens permanentes, sem TTL
2. **WhatsApp ativo = SMS de verificacao em pausa** - quando o metodo WhatsApp Consent estiver ativo, o envio de SMS de verificacao para (contatos ou lideres sera pausado, mas o Email de boas-vindas continua sendo enviado normalmente

---

## 1. ALTERACOES NO BANCO DE DADOS

### 1.1 Novas colunas em `integrations_settings`

| Coluna | Tipo | Default | Descricao |
|--------|------|---------|-----------|
| `verification_method` | text | 'link' | Metodo ativo: 'link' ou 'whatsapp_consent' |
| `verification_wa_test_mode` | boolean | true | Modo teste (apenas admins/whitelist) |
| `verification_wa_whitelist` | jsonb | '[]' | Lista de telefones para teste |
| `verification_wa_keyword` | text | 'CONFIRMAR' | Palavra-chave para iniciar fluxo |
| `verification_wa_enabled` | boolean | false | Toggle master do fluxo |
| `verification_wa_zapi_phone` | text | null | Numero do Z-API para wa.me link |

### 1.2 Nova tabela `contact_verifications` (SEM expiracao)

```sql
CREATE TABLE contact_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type TEXT NOT NULL, -- 'leader' ou 'contact'
  contact_id UUID NOT NULL,
  method TEXT NOT NULL, -- 'link', 'whatsapp_consent'
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending', 
  -- Estados: pending, keyword_received, awaiting_consent, verified, cancelled
  phone TEXT NOT NULL,
  
  -- Timestamps (SEM expires_at)
  created_at TIMESTAMPTZ DEFAULT now(),
  keyword_received_at TIMESTAMPTZ,
  consent_question_sent_at TIMESTAMPTZ,
  consent_received_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Auditoria
  consent_text_version TEXT DEFAULT 'v1',
  consent_channel TEXT,
  consent_message_id TEXT
);

-- Indice para token (sem restricao de expiracao)
CREATE UNIQUE INDEX idx_verifications_token ON contact_verifications(token);
CREATE INDEX idx_verifications_phone_status ON contact_verifications(phone, status);

-- Apenas 1 verificacao ativa por contato
CREATE UNIQUE INDEX idx_verifications_active_per_contact 
  ON contact_verifications(contact_type, contact_id) 
  WHERE status IN ('pending', 'keyword_received', 'awaiting_consent');
```

### 1.3 Novos templates WhatsApp

| Slug | Mensagem |
|------|----------|
| `wa-verificacao-consent` | "Ola {{nome}}! Recebemos sua solicitacao. Voce autoriza a verificacao do seu cadastro? Responda *SIM* para confirmar." |
| `wa-verificacao-sucesso` | "{{nome}}, cadastro verificado! Seu link de indicacao: {{link_indicacao}}" |

---

## 2. LOGICA DE ENVIO (SMS vs WhatsApp)

### 2.1 Regra Principal

```
SE verification_method = 'whatsapp_consent' E verification_wa_enabled = true:
   - NAO enviar SMS de verificacao (pausado)
   - ENVIAR Email de boas-vindas normalmente
   - Exibir botao "Verificar pelo WhatsApp" na tela

SE verification_method = 'link' OU verification_wa_enabled = false:
   - ENVIAR SMS de verificacao (comportamento atual)
   - ENVIAR Email de boas-vindas normalmente
```

### 2.2 Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/PublicLeaderRegistration.tsx` | Checar settings antes de enviar SMS |
| `src/pages/LeaderRegistrationForm.tsx` | Checar settings antes de enviar SMS |
| `src/hooks/office/useCreateLeader.ts` | Checar settings antes de enviar SMS |
| `src/hooks/leaders/useLeaderVerification.ts` | Checar settings antes de enviar SMS |

### 2.3 Pseudocodigo do Fluxo

```typescript
// Apos cadastro bem-sucedido:
const settings = await getIntegrationsSettings();

// SEMPRE envia Email (se tiver email)
if (leaderEmail) {
  await sendEmail({ 
    template: "lideranca-boas-vindas",
    to: leaderEmail,
    variables: { nome, mensagem: "..." }
  });
}

// SMS de verificacao: apenas se NAO estiver usando WhatsApp Consent
const useWhatsAppVerification = 
  settings.verification_wa_enabled && 
  settings.verification_method === 'whatsapp_consent';

if (!useWhatsAppVerification) {
  // Fluxo atual: enviar SMS com link de verificacao
  await sendSMS({
    template: "verificacao-lider-sms",
    phone: telefone,
    variables: { nome, link_verificacao }
  });
}

// A tela de sucesso exibira o botao WhatsApp se elegivel
```

---

## 3. FRONTEND: TELA POS-CADASTRO

### 3.1 Componente de Sucesso Atualizado

```tsx
// Dentro de PublicLeaderRegistration.tsx e LeaderRegistrationForm.tsx

if (isSuccess) {
  return (
    <Card>
      <CardContent className="text-center">
        <CheckCircle2 className="text-green-600" />
        
        {isWhatsAppVerificationEligible ? (
          // NOVO: Fluxo WhatsApp
          <>
            <h2>Verifique seu Cadastro!</h2>
            <p>Para ativar seu link de indicacao, confirme pelo WhatsApp:</p>
            
            <Button 
              onClick={handleOpenWhatsApp}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageSquare className="mr-2" />
              Verificar pelo WhatsApp
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              Voce tambem recebera um email com mais informacoes.
            </p>
          </>
        ) : (
          // ATUAL: Fluxo SMS
          <>
            <h2>Falta Apenas uma Etapa!</h2>
            <p>Enviamos um SMS para confirmar seu telefone.</p>
            <p className="text-sm">
              Clique no link do SMS para ativar seu link de indicacao.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3.2 Funcao para Abrir WhatsApp

```typescript
const handleOpenWhatsApp = async () => {
  // Buscar ou criar token de verificacao
  const { data } = await supabase.rpc('create_whatsapp_verification', {
    _contact_type: 'leader',
    _contact_id: leaderId,
    _phone: telefoneNorm,
  });
  
  const keyword = settings?.verification_wa_keyword || 'CONFIRMAR';
  const token = data?.[0]?.token || verificationCode;
  const zapiPhone = settings?.verification_wa_zapi_phone || '5561999999999';
  
  const message = `${keyword} ${token}`;
  const url = `https://wa.me/${zapiPhone}?text=${encodeURIComponent(message)}`;
  
  window.open(url, '_blank');
};
```

### 3.3 Logica de Elegibilidade (Modo Teste)

```typescript
const isWhatsAppVerificationEligible = useMemo(() => {
  if (!settings?.verification_wa_enabled) return false;
  if (settings?.verification_method !== 'whatsapp_consent') return false;
  
  // Se em modo teste
  if (settings?.verification_wa_test_mode) {
    const whitelist = settings?.verification_wa_whitelist || [];
    const phoneInWhitelist = whitelist.includes(telefoneNorm);
    
    // Para usuarios logados, verificar se e admin
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    
    return phoneInWhitelist || isAdmin;
  }
  
  return true; // Modo producao - todos elegiveis
}, [settings, telefoneNorm, user]);
```

---

## 4. EDGE FUNCTION: `zapi-webhook` (Extensao)

### 4.1 Nova Logica para Processar CONFIRMAR <TOKEN>

```typescript
// Dentro de handleReceivedMessage()

// Detectar keyword CONFIRMAR <TOKEN>
const keywordMatch = cleanMessage.match(/^CONFIRMAR\s+([A-Z0-9]{5,8})$/);

if (keywordMatch) {
  const token = keywordMatch[1];
  
  // Buscar verificacao pendente (SEM checar expiracao!)
  const { data: verification } = await supabase
    .from("contact_verifications")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();
  
  if (verification) {
    // Atualizar status
    await supabase
      .from("contact_verifications")
      .update({ 
        status: "awaiting_consent",
        keyword_received_at: new Date().toISOString()
      })
      .eq("id", verification.id);
    
    // Enviar pergunta de consentimento
    await sendWhatsAppTemplate(
      phone, 
      "wa-verificacao-consent",
      { nome: contactName }
    );
    return;
  }
}

// Detectar resposta SIM (para quem esta em awaiting_consent)
if (['SIM', 'S'].includes(cleanMessage)) {
  const { data: verification } = await supabase
    .from("contact_verifications")
    .select("*")
    .eq("phone", normalizedPhone)
    .eq("status", "awaiting_consent")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (verification) {
    // Marcar como verificado
    await supabase
      .from("contact_verifications")
      .update({ 
        status: "verified",
        consent_received_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        consent_channel: "whatsapp"
      })
      .eq("id", verification.id);
    
    // Atualizar lider/contato
    if (verification.contact_type === 'leader') {
      await supabase
        .from("lideres")
        .update({ 
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: 'whatsapp_consent'
        })
        .eq("id", verification.contact_id);
      
      // Enviar link de afiliado + material por regiao
      await supabase.functions.invoke("send-leader-affiliate-links", {
        body: { leader_id: verification.contact_id }
      });
    }
    
    return;
  }
}
```

---

## 5. CONFIGURACOES: UI (Integrations.tsx)

### Nova Secao "Verificacao de Cadastro"

```tsx
<Card>
  <CardHeader>
    <CardTitle>Verificacao de Cadastro</CardTitle>
    <CardDescription>
      Configure como novos apoiadores confirmam o cadastro
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Toggle Master */}
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Verificacao via WhatsApp</p>
        <p className="text-sm text-muted-foreground">
          Permite confirmar cadastro respondendo "SIM" no WhatsApp
        </p>
      </div>
      <Switch 
        checked={settings.verification_wa_enabled}
        onCheckedChange={v => updateSettings({ verification_wa_enabled: v })}
      />
    </div>
    
    {/* Metodo Padrao */}
    {settings.verification_wa_enabled && (
      <>
        <RadioGroup value={settings.verification_method}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link" />
            <Label>Link via SMS (atual)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="whatsapp_consent" />
            <Label>WhatsApp com Consentimento</Label>
          </div>
        </RadioGroup>
        
        {/* Modo Teste */}
        <div className="flex items-center justify-between py-2 border-t">
          <div>
            <p className="font-medium">Modo Teste</p>
            <p className="text-sm text-muted-foreground">
              Apenas admins e telefones na whitelist
            </p>
          </div>
          <Switch 
            checked={settings.verification_wa_test_mode}
            onCheckedChange={v => updateSettings({ verification_wa_test_mode: v })}
          />
        </div>
        
        {/* Whitelist (se modo teste) */}
        {settings.verification_wa_test_mode && (
          <div>
            <Label>Telefones para Teste</Label>
            <Textarea
              placeholder="+5561999999999 (um por linha)"
              value={whitelistText}
              onChange={handleWhitelistChange}
            />
          </div>
        )}
        
        {/* Numero do Z-API */}
        <div>
          <Label>Numero do WhatsApp (Z-API)</Label>
          <Input
            placeholder="5561999999999"
            value={settings.verification_wa_zapi_phone || ''}
            onChange={e => updateSettings({ verification_wa_zapi_phone: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Este numero sera usado no link wa.me
          </p>
        </div>
      </>
    )}
  </CardContent>
</Card>
```

---

## 6. RPC FUNCTIONS (SQL)

### 6.1 Criar verificacao WhatsApp (sem expiracao)

```sql
CREATE OR REPLACE FUNCTION create_whatsapp_verification(
  _contact_type TEXT,
  _contact_id UUID,
  _phone TEXT
) RETURNS TABLE(token TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _token TEXT;
  _existing_token TEXT;
BEGIN
  -- Verificar se ja existe verificacao ativa (reutilizar token)
  SELECT cv.token INTO _existing_token
  FROM contact_verifications cv
  WHERE cv.contact_type = _contact_type 
    AND cv.contact_id = _contact_id
    AND cv.status IN ('pending', 'keyword_received', 'awaiting_consent')
  LIMIT 1;
  
  IF _existing_token IS NOT NULL THEN
    RETURN QUERY 
      SELECT _existing_token, now();
    RETURN;
  END IF;
  
  -- Cancelar verificacoes anteriores finalizadas
  UPDATE contact_verifications
  SET status = 'cancelled'
  WHERE contact_type = _contact_type 
    AND contact_id = _contact_id
    AND status NOT IN ('verified', 'cancelled');
  
  -- Gerar token unico (6 caracteres)
  _token := upper(substring(md5(random()::text) from 1 for 6));
  
  -- Inserir nova verificacao (sem expires_at!)
  INSERT INTO contact_verifications (
    contact_type, contact_id, method, token, phone
  ) VALUES (
    _contact_type, _contact_id, 'whatsapp_consent', _token, _phone
  );
  
  RETURN QUERY SELECT _token, now();
END;
$$;
```

### 6.2 Processar keyword (sem verificar expiracao)

```sql
CREATE OR REPLACE FUNCTION process_verification_keyword(
  _token TEXT,
  _phone TEXT
) RETURNS TABLE(
  success BOOLEAN,
  contact_type TEXT,
  contact_id UUID,
  contact_name TEXT,
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _verification RECORD;
  _name TEXT;
BEGIN
  -- Buscar verificacao ativa (SEM checar expiracao)
  SELECT * INTO _verification
  FROM contact_verifications cv
  WHERE cv.token = upper(_token)
    AND cv.status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TEXT, 'invalid_token'::TEXT;
    RETURN;
  END IF;
  
  -- Atualizar status para awaiting_consent
  UPDATE contact_verifications
  SET status = 'awaiting_consent',
      keyword_received_at = now()
  WHERE id = _verification.id;
  
  -- Buscar nome
  IF _verification.contact_type = 'leader' THEN
    SELECT nome_completo INTO _name FROM lideres WHERE id = _verification.contact_id;
  ELSE
    SELECT nome INTO _name FROM office_contacts WHERE id = _verification.contact_id;
  END IF;
  
  RETURN QUERY SELECT true, _verification.contact_type, _verification.contact_id, _name, NULL::TEXT;
END;
$$;
```

---

## 7. MIGRACAO SQL COMPLETA

```sql
-- 1. Adicionar colunas em integrations_settings
ALTER TABLE integrations_settings 
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'link',
ADD COLUMN IF NOT EXISTS verification_wa_test_mode BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS verification_wa_whitelist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS verification_wa_keyword TEXT DEFAULT 'CONFIRMAR',
ADD COLUMN IF NOT EXISTS verification_wa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_wa_zapi_phone TEXT;

-- 2. Criar tabela contact_verifications (sem expires_at)
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

CREATE INDEX IF NOT EXISTS idx_verifications_phone_status 
  ON contact_verifications(phone, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verifications_active_per_contact 
  ON contact_verifications(contact_type, contact_id) 
  WHERE status IN ('pending', 'keyword_received', 'awaiting_consent');

-- 3. RLS
ALTER TABLE contact_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access" ON contact_verifications
  FOR SELECT USING (has_admin_access(auth.uid()));

-- 4. Templates WhatsApp
INSERT INTO whatsapp_templates (slug, nome, mensagem, categoria, variaveis, is_system)
VALUES 
  ('wa-verificacao-consent', 'Verificacao - Consentimento', 
   'Ola {{nome}}! Recebemos sua solicitacao de verificacao. Voce autoriza a verificacao do seu cadastro na plataforma? Responda *SIM* para confirmar.',
   'verificacao', ARRAY['nome'], true),
  ('wa-verificacao-sucesso', 'Verificacao - Sucesso',
   '{{nome}}, seu cadastro foi verificado com sucesso! Seu link de indicacao: {{link_indicacao}}',
   'verificacao', ARRAY['nome', 'link_indicacao'], true)
ON CONFLICT (slug) DO NOTHING;
```

---

## 8. ARQUIVOS A MODIFICAR

### Backend (SQL)
- `supabase/migrations/XXXXXX_add_whatsapp_verification.sql`

### Edge Functions
- `supabase/functions/zapi-webhook/index.ts` - Adicionar handler para CONFIRMAR e SIM

### Frontend
- `src/hooks/useIntegrationsSettings.ts` - Adicionar campos de verificacao
- `src/pages/settings/Integrations.tsx` - Adicionar card de configuracao
- `src/pages/PublicLeaderRegistration.tsx` - Checar settings, adicionar botao WhatsApp
- `src/pages/LeaderRegistrationForm.tsx` - Checar settings, adicionar botao WhatsApp
- `src/hooks/office/useCreateLeader.ts` - Checar settings antes de enviar SMS
- `src/hooks/leaders/useLeaderVerification.ts` - Checar settings antes de enviar SMS

---

## 9. PLANO DE TESTES

| Cenario | Passos | Resultado Esperado |
|---------|--------|-------------------|
| Toggle desligado | verification_wa_enabled=false | Botao nao aparece, SMS enviado |
| Toggle ligado, metodo=link | verification_method='link' | Botao nao aparece, SMS enviado |
| Toggle ligado, metodo=whatsapp | verification_method='whatsapp_consent' | Botao aparece, SMS NAO enviado, Email enviado |
| Modo teste, admin ve | Admin cadastra | Botao aparece |
| Modo teste, whitelist ve | Telefone na whitelist | Botao aparece |
| Modo teste, nao elegivel | Telefone fora whitelist, nao-admin | Botao NAO aparece, SMS enviado |
| CONFIRMAR TOKEN correto | Enviar keyword | Recebe pergunta SIM |
| Token invalido | Enviar CONFIRMAR XXXXX | Orientacao de erro |
| SIM confirma | Apos pergunta | Verificado + Link enviado |
| Email sempre enviado | Qualquer cenario com email | Email de boas-vindas recebido |

---

## 10. ROLLOUT

### Fase 1: TESTE (1-2 semanas)
1. Deploy com `verification_wa_test_mode = true`
2. Adicionar telefones da equipe na whitelist
3. Testar fluxo completo

### Fase 2: PRODUCAO
1. Desativar modo teste
2. Monitorar metricas

