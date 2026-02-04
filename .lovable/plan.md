
## Correção: Encurtar Link do Material de Região no Agendamento Automático

### Problema Identificado

A função `schedule-region-material` salva o `link_material` diretamente como está no banco (`material.material_url`), que é a URL completa do Supabase Storage. 

**Exemplo do link atual (longo):**
```
https://eydqducvsddckhyatcux.supabase.co/storage/v1/object/public/region-materials/arapoanga.pdf
```

**Exemplo do link esperado (encurtado):**
```
https://app.rafaelprudente.com/s/Ab3Xyz
```

O envio em massa (`SMSBulkSendTab`) encurta a URL antes de enviar, mas o agendamento automático não faz isso.

---

### Solução

Modificar a Edge Function `schedule-region-material` para chamar `shorten-url` antes de salvar a mensagem agendada.

---

### Alterações Técnicas

**Arquivo:** `supabase/functions/schedule-region-material/index.ts`

**Modificação:**

1. Adicionar chamada à função `shorten-url` antes de criar a `scheduled_message`
2. Usar o link encurtado como valor de `link_material` nas variáveis

**Código atualizado (linhas 118-139):**

```typescript
// 5. Get the city name
const cityName = (leader.office_cities as any)?.nome || "sua região";

// 5.5. Shorten material URL using the production domain
let shortenedUrl = material.material_url;
try {
  console.log("[schedule-region-material] Shortening material URL...");
  const { data: shortenResult, error: shortenError } = await supabase.functions.invoke("shorten-url", {
    body: { url: material.material_url },
  });
  
  if (!shortenError && shortenResult?.shortUrl) {
    shortenedUrl = shortenResult.shortUrl;
    console.log(`[schedule-region-material] URL shortened: ${shortenedUrl}`);
  } else {
    console.warn("[schedule-region-material] Could not shorten URL, using original:", shortenError);
  }
} catch (e) {
  console.warn("[schedule-region-material] Error shortening URL, using original:", e);
}

// 6. Create scheduled message
const { error: insertError } = await supabase.from("scheduled_messages").insert({
  message_type: "sms",
  recipient_phone: leader.telefone,
  recipient_name: leader.nome_completo,
  template_slug: material.sms_template_slug || "material-regiao-sms",
  variables: {
    nome: leader.nome_completo,
    regiao: cityName,
    link_material: shortenedUrl,  // ← Agora usa o link encurtado
  },
  scheduled_for: scheduledFor.toISOString(),
  leader_id: leader_id,
  status: "pending",
});
```

---

### Comportamento Resultante

| Cenário | Antes | Depois |
|---------|-------|--------|
| Agendamento automático | URL do Storage (~100 chars) | URL curta (~40 chars) |
| Envio em massa | URL curta | URL curta (sem mudança) |
| Fallback se encurtamento falhar | N/A | Usa URL original |

---

### Benefícios

1. **Economia de caracteres no SMS** - Link curto ocupa ~40 chars vs ~100+ chars
2. **Consistência** - Todos os envios usam o mesmo formato de link
3. **Tracking** - Links curtos são rastreáveis via tabela `short_urls`
4. **Domínio profissional** - `app.rafaelprudente.com/s/XXX` vs URL do Supabase

---

### Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/schedule-region-material/index.ts` | Adicionar encurtamento de URL antes de criar scheduled_message |
