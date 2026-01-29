

## Encurtar Link do Material por Região para SMS

### Resumo
Encurtar automaticamente os links de materiais (PDFs do Google Drive, etc.) para um formato amigável usando a URL principal `app.rafaelprudente.com/s/{código}` antes de enviar via SMS.

### Problema Atual

Os links de materiais enviados por SMS são muito longos:
```
https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
```
**70+ caracteres** - consome metade do limite de 160 caracteres do SMS.

### Solução

Transformar automaticamente em:
```
https://app.rafaelprudente.com/s/AbC123
```
**38 caracteres** - economia de 30+ caracteres por SMS!

### Fluxo

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE ENCURTAMENTO                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Usuário seleciona material no dropdown                                   │
│     (URL longa: https://drive.google.com/file/d/1abc.../view)               │
│                                                                              │
│  2. Sistema detecta que template usa {{link_material}}                       │
│                                                                              │
│  3. Antes de enviar cada SMS:                                               │
│     → Chama edge function shorten-url                                       │
│     → Recebe código curto (ex: "AbC123")                                    │
│     → Monta link: https://app.rafaelprudente.com/s/AbC123                   │
│                                                                              │
│  4. SMS enviado com link curto                                              │
│     "João, temos um material especial! Acesse: app.rafaelprudente.com/s/X" │
│                                                                              │
│  5. Destinatário clica → redireciona para URL original do Google Drive      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Otimização

O mesmo link do material será encurtado UMA VEZ e reutilizado para todos os destinatários do lote, economizando chamadas à API.

---

## Seção Técnica

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/shorten-url/index.ts` | Corrigir para usar URL de produção |
| `src/components/sms/SMSBulkSendTab.tsx` | Encurtar link antes do envio |

### 1. Corrigir Edge Function (shorten-url)

Alterar a linha 94 para usar a URL de produção:

```typescript
// Antes (ERRADO - URL de preview)
const siteUrl = "https://eydqducvsddckhyatcux.lovableproject.com";

// Depois (CORRETO - URL de produção)
const siteUrl = "https://app.rafaelprudente.com";
```

### 2. Modificar SMSBulkSendTab

**2.1 Adicionar função para encurtar URL:**

```typescript
const shortenUrl = async (url: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke("shorten-url", {
      body: { url },
    });
    
    if (error) throw error;
    return data.shortUrl;
  } catch (err) {
    console.error("Erro ao encurtar URL:", err);
    // Fallback: retorna URL original se falhar
    return url;
  }
};
```

**2.2 Encurtar link ANTES do loop de envio:**

Na função `handleSendBulk`, antes do loop de destinatários:

```typescript
// Encurtar link do material uma vez (reutilizado para todos os destinatários)
let shortenedMaterialUrl = "";
if (templateRequiresMaterial && selectedMaterialUrl) {
  toast.info("Encurtando link do material...");
  shortenedMaterialUrl = await shortenUrl(selectedMaterialUrl);
  console.log("Link encurtado:", shortenedMaterialUrl);
}
```

**2.3 Usar o link encurtado nas variáveis:**

```typescript
const variables: Record<string, string> = {
  nome: recipient.nome || "",
  email: recipient.email || "",
  // Usar link encurtado quando disponível
  ...(shortenedMaterialUrl && { link_material: shortenedMaterialUrl }),
};
```

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| `https://drive.google.com/file/d/1a2b3c4d5e6f7g8h/view?usp=sharing` | `https://app.rafaelprudente.com/s/AbC123` |
| ~70 caracteres | ~38 caracteres |

### Benefícios

- **Economia de caracteres**: ~30+ caracteres por SMS
- **Link amigável**: Usa domínio principal da aplicação
- **Tracking**: A tabela `short_urls` registra cliques
- **Único encurtamento**: O mesmo link é reutilizado (não cria duplicatas)

