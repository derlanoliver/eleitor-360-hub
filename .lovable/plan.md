

## Corrigir QR Code do Evento - WhatsApp → Link Principal

### Resumo
Alterar o componente `EventQRCode` para exibir o QR Code que leva diretamente para o link de cadastro do evento, ao invés do QR Code do WhatsApp.

### Situação Atual

O componente `EventQRCode.tsx` gera **dois** QR Codes:
1. **WhatsApp** (`whatsappQR`) - Exibido na interface ✓
2. **Cadastro** (`registrationQR`) - Apenas usado no botão "Copiar Link" ✗

A interface mostra o QR do WhatsApp com ícone verde e título "QR Code WhatsApp", mas o usuário precisa que seja o link direto do evento.

### Mudança Proposta

Substituir a exibição do QR Code WhatsApp pelo QR Code de cadastro do evento:

| Antes | Depois |
|-------|--------|
| QR Code → WhatsApp | QR Code → Link do Evento |
| Ícone: MessageCircle (verde) | Ícone: Link2 (azul) |
| Título: "QR Code WhatsApp" | Título: "QR Code do Evento" |
| Download: `qr-whatsapp-evento-...` | Download: `qr-evento-...` |

### URL do QR Code

O QR Code levará para:
```
https://app.rafaelprudente.com/eventos/{slug}?utm_source=qr&utm_medium=offline&utm_campaign=evento_{id}&utm_content={tracking}
```

---

## Seção Técnica

### Arquivo a Modificar

**`src/components/EventQRCode.tsx`**

### Alterações

1. **Remover estados e código do WhatsApp**:
   - Remover `whatsappQR` state
   - Remover `whatsappURL` e `whatsappMessage` 
   - Simplificar `generateQRCodes` para gerar apenas o QR de registro

2. **Atualizar a interface**:
   - Trocar ícone de `MessageCircle` para `Link2`
   - Trocar título de "QR Code WhatsApp" para "QR Code do Evento"
   - Usar `registrationQR` no lugar de `whatsappQR`
   - Atualizar alt text da imagem
   - Atualizar função de download para usar `'registration'`

3. **Simplificar a função de download**:
   - Renomear para apenas baixar o QR de registro
   - Atualizar nome do arquivo para `qr-evento-{id}-{tracking}.png`

### Código Simplificado

```tsx
// Estado simplificado
const [eventQR, setEventQR] = useState<string>("");

// Apenas uma URL
const eventURL = generateEventRegistrationUrl(event.slug, event.id, trackingCode);

// Gerar apenas um QR Code
useEffect(() => {
  const generateQRCode = async () => {
    const qrData = await QRCode.toDataURL(eventURL, { ... });
    setEventQR(qrData);
  };
  generateQRCode();
}, [eventURL]);

// Interface com ícone Link2 e título "QR Code do Evento"
```

### Resultado Esperado

O modal de QR Code exibirá:
- Título: "QR Code do Evento" com ícone de link
- QR Code que leva diretamente para a página de cadastro do evento
- Botão "Baixar QR Code" que salva em alta resolução
- Botão "Copiar Link" mantido

