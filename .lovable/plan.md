
## Correção: Envio de Link de Afiliado por WhatsApp

### Problema Identificado

Quando a verificação do líder é feita via WhatsApp (fluxo "CONFIRMAR [TOKEN]" → "SIM"), o sistema:
1. ✅ Marca `verification_method = 'whatsapp_consent'` corretamente no banco
2. ❌ Chama `send-leader-affiliate-links` que **sempre envia SMS** (não respeita o canal de verificação)
3. ❌ Permite que outras mensagens sejam enviadas antes do link de afiliado

### Solução

Modificar a edge function `send-leader-affiliate-links` para:

1. **Verificar o método de verificação** do líder (`verification_method`)
2. **Se for `whatsapp_consent`** → enviar link via WhatsApp usando template `lider-cadastro-confirmado`
3. **Se for outro método** (link, manual) → manter comportamento atual (SMS)
4. **Email continua** sendo enviado em todos os casos
5. **WhatsApp é enviado PRIMEIRO** antes do email (para garantir ordem correta)

### Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Usuário envia "SIM"                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  zapi-webhook chama send-leader-affiliate-links                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ verification_method │
                    │ = whatsapp_consent? │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │ SIM                             │ NÃO
              ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│ 1. Envia WhatsApp       │       │ 1. Envia SMS            │
│    (lider-cadastro-     │       │    (lider-cadastro-     │
│     confirmado)         │       │     confirmado-sms)     │
│ 2. Envia Email          │       │ 2. Envia Email          │
│    (lideranca-boas-     │       │    (lideranca-boas-     │
│     vindas)             │       │     vindas)             │
└─────────────────────────┘       └─────────────────────────┘
```

---

## Alterações Técnicas

### Edge Function: `send-leader-affiliate-links/index.ts`

**Modificações na função `processLeader`:**

1. Adicionar busca do campo `verification_method` do líder
2. Adicionar parâmetro `skipWhatsApp` similar aos existentes `skipSMS` e `skipEmail`
3. Implementar lógica condicional:
   - Se `verification_method === 'whatsapp_consent'`:
     - Não enviar SMS (`skipSMS = true`)
     - Enviar WhatsApp usando `send-whatsapp` com template `lider-cadastro-confirmado`
   - Caso contrário: manter comportamento atual (SMS)
4. Garantir que WhatsApp seja enviado ANTES do email

**Estrutura do código atualizado:**

```typescript
async function processLeader(
  supabase: any,
  leaderId: string,
  baseUrl: string,
  leaderData?: Leader,
  skipSMS: boolean = false,
  skipEmail: boolean = false,
  skipWhatsApp: boolean = false  // novo parâmetro
): Promise<{ ... }> {
  
  // Buscar dados incluindo verification_method
  const leader = await supabase
    .from("lideres")
    .select("id, nome_completo, telefone, email, affiliate_token, verification_method")
    ...
  
  const isWhatsAppVerification = leader.verification_method === 'whatsapp_consent';
  
  // PASSO 1: Se verificação foi por WhatsApp → enviar WhatsApp (não SMS)
  if (isWhatsAppVerification && !skipWhatsApp && leader.telefone) {
    // Chamar send-whatsapp com template lider-cadastro-confirmado
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        phone: leader.telefone,
        templateSlug: "lider-cadastro-confirmado",
        variables: {
          nome: leader.nome_completo,
          link_indicacao: affiliateLink,
        },
      },
    });
    whatsAppSent = true;
  }
  
  // PASSO 2: Se verificação NÃO foi por WhatsApp → enviar SMS
  if (!isWhatsAppVerification && !skipSMS && leader.telefone) {
    // Código SMS existente
  }
  
  // PASSO 3: Enviar Email (sempre, após WhatsApp/SMS)
  if (!skipEmail && leader.email) {
    // Código email existente
  }
}
```

### Verificação de duplicatas no batch processing

Adicionar verificação para WhatsApp similar à de SMS:

```typescript
// Verificar se já foi enviado WhatsApp com link de afiliado
const { data: existingWhatsApp } = await supabase
  .from("whatsapp_messages")
  .select("id")
  .or(`message.ilike.%link de indicacao%,message.ilike.%link_indicacao%`)
  .ilike("phone", `%${phoneNormalized}`)
  .eq("direction", "outgoing")
  .limit(1);

const hasWhatsApp = existingWhatsApp && existingWhatsApp.length > 0;
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/send-leader-affiliate-links/index.ts` | Adicionar lógica para verificar `verification_method` e enviar via WhatsApp quando apropriado |

### Comportamento Final

| Método de Verificação | Canal do Link de Afiliado | Email |
|----------------------|---------------------------|-------|
| `whatsapp_consent` | WhatsApp | ✅ Sim |
| `link` (SMS) | SMS | ✅ Sim |
| `manual` | SMS | ✅ Sim |

Isso garante que:
1. Quem verificou por WhatsApp recebe o link por WhatsApp
2. Quem verificou por SMS/link recebe o link por SMS
3. Email é enviado em todos os casos
4. Nenhuma mensagem é enviada fora de ordem
