
## Correção: Verificação via WhatsApp

Identifiquei dois problemas que precisam ser corrigidos:

---

### Problema 1: Link WhatsApp bloqueado no desktop

**Causa**: O link `https://wa.me/...` redireciona para `api.whatsapp.com` que é bloqueado em alguns navegadores desktop (Chrome, Firefox) porque requer o app nativo instalado.

**Solução**: Detectar se o usuário está em desktop e usar `https://web.whatsapp.com/send?phone=...` para desktop, mantendo `https://wa.me/...` para mobile.

---

### Problema 2: Palavra-chave "CONFIRMAR" não reconhecida

**Causa**: O sistema atual tem uma falha de integração:

1. O formulário de cadastro mostra "envie **CONFIRMAR**" mas não inclui o token de verificação na mensagem
2. O usuário envia apenas "CONFIRMAR" ao invés de "CONFIRMAR DXBQVW"
3. O `zapi-webhook` não tem lógica para processar "CONFIRMAR [TOKEN]" e chamar as RPCs de verificação

**Fluxo esperado (que não está funcionando)**:
```
Usuário envia → "CONFIRMAR DXBQVW"
Webhook processa → process_verification_keyword(token, phone)  
Sistema pergunta → "Responda SIM para confirmar"
Usuário responde → "SIM"
Webhook processa → process_verification_consent(phone)
Sistema verifica → envia links de afiliado
```

**Solução**: 

1. **Alterar mensagem do botão** para incluir o token: "CONFIRMAR {token}"
2. **Adicionar lógica no zapi-webhook** para detectar mensagens que começam com "CONFIRMAR" e processar com a RPC

---

## Alterações Necessárias

### 1. Frontend (LeaderRegistrationForm.tsx)

```diff
// Linha 265: Guardar o verification_code
+ const [verificationCode, setVerificationCode] = useState<string | null>(null);

// Linha 266: No bloco useWhatsApp
+ setVerificationCode(leaderResult.verification_code);

// Linha 414: Alterar mensagem do WhatsApp
- const message = encodeURIComponent(whatsAppKeyword);
+ const message = encodeURIComponent(`${whatsAppKeyword} ${verificationCode}`);

// Linha 408: Alterar texto explicativo
- envie a palavra <strong>{whatsAppKeyword}</strong>
+ envie <strong>{whatsAppKeyword} {verificationCode}</strong>

// Linha 415: Detectar desktop vs mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const baseUrl = isMobile 
  ? `https://wa.me/${phone}?text=${message}`
  : `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
window.open(baseUrl, '_blank');
```

### 2. Edge Function (zapi-webhook/index.ts)

Adicionar na função `handleReceivedMessage`:

```typescript
// Detectar comando CONFIRMAR [TOKEN]
const confirmMatch = cleanMessage.match(/^CONFIRMAR\s+([A-Z0-9]{5,6})$/);
if (confirmMatch) {
  const token = confirmMatch[1];
  console.log(`[zapi-webhook] Detected CONFIRMAR command with token: ${token}`);
  
  // Chamar RPC process_verification_keyword
  const { data: result, error } = await supabase.rpc("process_verification_keyword", {
    _token: token,
    _phone: normalizedPhone
  });
  
  if (result?.[0]?.success) {
    // Pedir consentimento
    await sendMessage(supabase, normalizedPhone, 
      `Olá ${result[0].contact_name}! Para confirmar seu cadastro, responda *SIM*.`
    );
    return; // Não chamar chatbot
  }
}

// Detectar resposta SIM para consentimento
if (cleanMessage === "SIM") {
  const { data: result } = await supabase.rpc("process_verification_consent", {
    _phone: normalizedPhone
  });
  
  if (result?.[0]?.success) {
    // Chamar edge function para enviar links de afiliado
    await sendAffiliateLinks(result[0].contact_id, result[0].contact_type);
    await sendMessage(supabase, normalizedPhone, 
      `✅ Cadastro confirmado! Você receberá seu link de indicação em instantes.`
    );
    return;
  }
}
```

---

## Resumo das Correções

| Item | Problema | Solução |
|------|----------|---------|
| Link desktop | `api.whatsapp.com` bloqueado | Usar `web.whatsapp.com` para desktop |
| Mensagem WhatsApp | Envia só "CONFIRMAR" | Incluir token: "CONFIRMAR DXBQVW" |
| Webhook | Não processa "CONFIRMAR [TOKEN]" | Adicionar regex e chamar RPCs |
| Fluxo completo | SIM não confirmava | Processar "SIM" com RPC consent |

Após estas correções, o fluxo completo funcionará:
1. Usuário clica no botão → abre WhatsApp Web (desktop) ou WhatsApp (mobile)
2. Mensagem pré-preenchida: "CONFIRMAR DXBQVW"
3. Sistema recebe, processa token, pede "Responda SIM"
4. Usuário responde SIM → sistema confirma e envia links
