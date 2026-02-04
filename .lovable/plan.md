

## Plano: Migrar Aba "API Oficial" para Usar Cloud API da Meta

### Situação Atual

| Componente | Função | Provedor |
|------------|--------|----------|
| `WhatsAppOfficialApiTab` | `send-whatsapp-official` | SMSBarato |
| Templates usados | `bemvindo1`, `confirmar1` | Via SMSBarato |

### Objetivo

Migrar a aba "API Oficial" para usar a **Cloud API da Meta** (`send-whatsapp`) com suporte a templates estruturados.

---

## 1. Atualizar Edge Function `send-whatsapp`

### 1.1 Adicionar Tipagens para Templates da Meta

```typescript
interface MetaTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
  }>;
}

interface MetaTemplatePayload {
  name: string;
  language: { code: string };
  components?: MetaTemplateComponent[];
}
```

### 1.2 Adicionar Parâmetro de Template no Request

```typescript
interface SendWhatsAppRequest {
  // ... campos existentes ...
  metaTemplate?: {
    name: string;
    language?: string;
    components?: MetaTemplateComponent[];
  };
}
```

### 1.3 Atualizar `sendViaMetaCloud` para Suportar Templates

```typescript
async function sendViaMetaCloud(
  settings: IntegrationSettings,
  phone: string,
  message: string,
  metaTemplate?: MetaTemplatePayload  // NOVO PARÂMETRO
): Promise<SendResult> {
  // ... validações existentes ...

  let body: object;

  if (metaTemplate) {
    // Enviar como template estruturado
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: metaTemplate,
    };
    console.log(`[send-whatsapp] Sending Meta template: ${metaTemplate.name}`);
  } else {
    // Enviar como texto livre
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: { body: message },
    };
  }

  // ... resto da função ...
}
```

### 1.4 Chamar com Template quando fornecido

```typescript
// Na seção de envio
if (activeProvider === 'meta_cloud') {
  result = await sendViaMetaCloud(
    typedSettings, 
    cleanPhone, 
    finalMessage,
    requestBody.metaTemplate  // Passar template se existir
  );
}
```

---

## 2. Atualizar `WhatsAppOfficialApiTab.tsx`

### 2.1 Verificar Configuração da Meta Cloud

Mudar de verificar `smsbarato_enabled` para verificar `meta_cloud_enabled`:

```typescript
const { data: settings } = useQuery({
  queryKey: ["integrations_settings_meta_cloud"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("integrations_settings")
      .select("meta_cloud_enabled, meta_cloud_phone_number_id, whatsapp_provider_active")
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  }
});

const isConfigured = settings?.meta_cloud_enabled && 
                     settings?.meta_cloud_phone_number_id;
```

### 2.2 Atualizar Função de Envio

Trocar chamada de `send-whatsapp-official` para `send-whatsapp`:

```typescript
const handleSend = async () => {
  // ... validações ...

  for (const recipient of recipients) {
    // Construir template para Meta Cloud API
    const metaTemplate = {
      name: selectedTemplate,  // 'bemvindo1' ou 'confirmar1'
      language: { code: 'pt_BR' },
      components: selectedTemplate === 'bemvindo1' 
        ? [
            {
              type: 'body' as const,
              parameters: [
                { type: 'text' as const, text: recipient.nome_completo.split(' ')[0] },
                { type: 'text' as const, text: recipient.affiliate_token },
              ],
            },
          ]
        : [
            {
              type: 'body' as const,
              parameters: [
                { type: 'text' as const, text: recipient.nome_completo.split(' ')[0] },
                { type: 'text' as const, text: 'sua conta' },
                { type: 'text' as const, text: recipient.verification_code },
              ],
            },
          ],
    };

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phone: recipient.telefone,
        message: `[Template: ${selectedTemplate}]`,  // Fallback message for logging
        metaTemplate,
        providerOverride: 'meta_cloud',  // Forçar uso da Meta Cloud API
      }
    });

    // ... tratamento de resultado ...
  }
};
```

### 2.3 Atualizar Mensagens de Erro/Alerta

```typescript
if (!isConfigured) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        A integração WhatsApp Cloud API (Meta) não está configurada. 
        Acesse Configurações &gt; Integrações para configurar o Phone Number ID.
      </AlertDescription>
    </Alert>
  );
}
```

---

## 3. Resumo dos Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/send-whatsapp/index.ts` | Adicionar suporte a `metaTemplate` na request e na função `sendViaMetaCloud` |
| `src/components/whatsapp/WhatsAppOfficialApiTab.tsx` | Trocar de `send-whatsapp-official` para `send-whatsapp` com templates estruturados |

---

## 4. Pré-Requisitos Importantes

Para que os templates funcionem na Cloud API da Meta:

1. **Templates aprovados no Meta Business Manager**
   - `bemvindo1` com 2 parâmetros no body: `{{1}}` (nome), `{{2}}` (token)
   - `confirmar1` com 3 parâmetros no body: `{{1}}` (nome), `{{2}}` (contexto), `{{3}}` (código)

2. **Idioma correto**: `pt_BR`

3. **Phone Number verificado** (resolver o status `EXPIRED`)

---

## 5. Fluxo Atualizado

```text
┌───────────────────────────────────────────────────────────────┐
│              WhatsAppOfficialApiTab (Atualizado)               │
├───────────────────────────────────────────────────────────────┤
│ 1. Usuário seleciona template (bemvindo1 / confirmar1)         │
│ 2. Seleciona destinatário(s)                                   │
│ 3. Clica em Enviar                                             │
│                                                                │
│ 4. Monta metaTemplate com:                                     │
│    - name: 'bemvindo1' ou 'confirmar1'                         │
│    - language: { code: 'pt_BR' }                               │
│    - components: parâmetros do body                            │
│                                                                │
│ 5. Chama send-whatsapp com:                                    │
│    - phone, metaTemplate, providerOverride: 'meta_cloud'       │
│                                                                │
│ 6. Edge Function:                                              │
│    - Detecta metaTemplate                                      │
│    - Envia type: 'template' para Graph API                     │
│    - Registra em whatsapp_messages                             │
└───────────────────────────────────────────────────────────────┘
```

---

## 6. Compatibilidade

- **Z-API continua funcionando** para todas as outras mensagens
- **`send-whatsapp-official` permanece** (pode ser removido depois se desejado)
- **Modo teste da Meta Cloud** aplica whitelist normalmente

