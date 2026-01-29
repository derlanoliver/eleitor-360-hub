

## Corrigir URL de Produção para Links Encurtados Existentes

### Problema Identificado

Quando um link de material **já foi encurtado anteriormente** (já existe na tabela `short_urls`), o sistema retorna uma URL inválida:

| Cenário | URL Retornada | Status |
|---------|---------------|--------|
| URL nova | `https://app.rafaelprudente.com/s/AbC123` | ✅ Correto |
| URL existente | `https://eydqducvsddckhyatcux/s/CSjlyR` | ❌ Incorreto |

O código na edge function usa a URL de produção apenas para URLs **novas**, mas para URLs **existentes** usa uma variável de ambiente que não está configurada corretamente.

### Causa Raiz

Na edge function `shorten-url/index.ts`, linhas 56-66:

```typescript
if (existingUrl) {
  const baseUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", "");  // ← PROBLEMA
  return new Response(
    JSON.stringify({ 
      shortUrl: `${baseUrl}/s/${existingUrl.code}`,  // ← Gera URL inválida
    }),
    ...
  );
}
```

### Solução

Usar a URL de produção fixa em **ambos os casos** (URL nova e existente):

```typescript
const PRODUCTION_URL = "https://app.rafaelprudente.com";

// No caso de URL existente:
if (existingUrl) {
  return new Response(
    JSON.stringify({ 
      shortUrl: `${PRODUCTION_URL}/s/${existingUrl.code}`,  // ← CORRIGIDO
    }),
    ...
  );
}

// No caso de URL nova (já está correto, mas vamos usar a constante):
const shortUrl = `${PRODUCTION_URL}/s/${code}`;
```

---

## Seção Técnica

### Arquivo a Modificar

**`supabase/functions/shorten-url/index.ts`**

### Alterações

1. Adicionar constante de URL de produção no topo do arquivo:
```typescript
const PRODUCTION_URL = "https://app.rafaelprudente.com";
```

2. Corrigir linha 58 (caso URL existente):
```typescript
// Antes (ERRADO)
const baseUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", "");
shortUrl: `${baseUrl}/s/${existingUrl.code}`

// Depois (CORRETO)
shortUrl: `${PRODUCTION_URL}/s/${existingUrl.code}`
```

3. Atualizar linha 94-95 (caso URL nova) para usar a mesma constante:
```typescript
// Antes
const siteUrl = "https://app.rafaelprudente.com";
const shortUrl = `${siteUrl}/s/${code}`;

// Depois
const shortUrl = `${PRODUCTION_URL}/s/${code}`;
```

### Resultado Esperado

| Cenário | URL Retornada |
|---------|---------------|
| URL nova | `https://app.rafaelprudente.com/s/AbC123` |
| URL existente | `https://app.rafaelprudente.com/s/CSjlyR` |

Após a correção, todos os links encurtados usarão consistentemente a URL principal do sistema.

