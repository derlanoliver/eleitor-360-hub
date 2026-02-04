
## Correção: Link do WhatsApp Universal (wa.me)

### Problema

O link do WhatsApp para desktop (`https://web.whatsapp.com/send?phone=...&text=...`) não está abrindo corretamente no navegador. O usuário quer usar o formato `wa.me` para todos os casos.

### Solução

Simplificar a lógica para usar **sempre** o formato `https://wa.me/[numero]?text=[mensagem]`, removendo a detecção de dispositivo.

### Alteração

**Arquivo**: `src/pages/LeaderRegistrationForm.tsx` (linhas 429-435)

**De:**
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const href = isMobile
  ? `https://wa.me/${phone}?text=${message}`
  : `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
```

**Para:**
```typescript
const href = `https://wa.me/${phone}?text=${message}`;
```

### Comportamento

O link `wa.me`:
- Em **mobile**: abre o app WhatsApp diretamente
- Em **desktop**: redireciona para WhatsApp Web ou oferece opção de abrir o app desktop

Esta é a abordagem recomendada pela própria documentação do WhatsApp (Click to Chat), pois o `wa.me` detecta automaticamente o melhor método de abertura.
