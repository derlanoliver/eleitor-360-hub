
## Análise Completa: Pontos de Falha no Cadastro de Líderes com Verificação via WhatsApp

### Resumo Executivo

Identifiquei **4 problemas críticos** e **3 pontos de atenção** no fluxo de cadastro com verificação via WhatsApp.

---

## Problema 1: SMS Enviado MESMO com Verificação via WhatsApp

### Evidência
David Sveci foi verificado via `whatsapp_consent` às 02:19:34, mas recebeu SMS com link de indicação às 02:19:38 (4 segundos depois).

### Causa Raiz
A correção que implementamos (`send-leader-affiliate-links`) foi deployada **APÓS** o teste do David Sveci, portanto o código antigo ainda estava em execução.

### Verificação Necessária
Confirmar se o deploy mais recente corrigiu o problema. Novo teste necessário.

---

## Problema 2: Inconsistência de `verification_method`

### Evidência
```
verification_method | total
--------------------|-------
link                | 6103
<nil>               | 4089
manual              | 196
whatsapp            | 124   ← Problema!
whatsapp_consent    | 1     ← Correto
```

O código verifica `verification_method === 'whatsapp_consent'`, mas existem **124 líderes** com `verification_method = 'whatsapp'` (sem o sufixo `_consent`).

### Causa Raiz
Existem dois fluxos de verificação via WhatsApp:
1. **Antigo** (zapi-webhook linha 486): Define `verification_method = 'whatsapp'` (código simples)
2. **Novo** (process_verification_consent RPC): Define `verification_method = 'whatsapp_consent'`

### Impacto
Líderes verificados pelo fluxo antigo (`verification_method = 'whatsapp'`) estão recebendo SMS ao invés de WhatsApp porque o código só verifica `whatsapp_consent`.

### Correção Necessária
Atualizar a verificação para incluir ambos os valores:
```typescript
const isWhatsAppVerification = 
  leader.verification_method === 'whatsapp_consent' || 
  leader.verification_method === 'whatsapp';
```

---

## Problema 3: Fluxo Duplicado no zapi-webhook

### Localização
`supabase/functions/zapi-webhook/index.ts` linhas 424-508

### Descrição
Existe um fluxo **antigo** de verificação por código simples (5-6 caracteres) que:
1. Busca líder por `verification_code`
2. Marca como verificado com `verification_method = 'whatsapp'`
3. **NÃO chama** `send-leader-affiliate-links`

Este fluxo conflita com o novo sistema de `CONFIRMAR [TOKEN]` → `SIM`.

### Comportamento Confuso
- Se usuário enviar apenas código (ex: "Z6WND7"), entra no fluxo antigo
- Se usuário enviar "CONFIRMAR Z6WND7", entra no fluxo novo

### Correção Necessária
Remover ou desabilitar o fluxo antigo para evitar confusão.

---

## Problema 4: Mensagens de Erro para Código Inválido

### Evidência
David Sveci recebeu 3 mensagens de erro "Não encontramos um cadastro pendente" porque enviou "CONFIRMAR" sem o código antes de se cadastrar.

### Causa
O usuário tentou verificar **ANTES** de completar o cadastro (não existia registro em `contact_verifications`).

### UX Problemática
Mensagem de erro genérica não orienta o usuário sobre o problema real.

### Correção Sugerida
Melhorar a mensagem para diferenciar:
- "Você ainda não se cadastrou" (token não existe)
- "Código incorreto" (token inválido)
- "Cadastro já verificado" (token já foi usado)

---

## Pontos de Atenção

### 1. Modo de Teste Ativo
```
verification_wa_test_mode: true
verification_wa_whitelist: ["+5527999161738"]
```
Apenas o número do David está na whitelist. **Nenhum outro usuário verá o botão do WhatsApp**.

### 2. Cron Job de Fallback
Existe um cron (`send-leader-affiliate-links-fallback`) que roda a cada 5 minutos e pode reenviar mensagens. Ele também precisa respeitar o `verification_method`.

### 3. Tokens Diferentes entre Tabelas
- Tabela `lideres`: `verification_code = 'Z6WND7'`
- Tabela `contact_verifications`: `token = 'AC6503'`

O sistema usa tokens **diferentes**. Isso está correto mas pode confundir:
- O código da tabela `lideres` é usado para verificação via SMS (link)
- O token de `contact_verifications` é usado para verificação via WhatsApp

---

## Fluxo Atual Correto (quando funciona)

```text
Usuário preenche formulário
        │
        ▼
create_whatsapp_verification() cria token na contact_verifications
        │
        ▼
Tela mostra botão "Confirmar via WhatsApp" (wa.me)
        │
        ▼
Usuário envia "CONFIRMAR [TOKEN]"
        │
        ▼
zapi-webhook → process_verification_keyword() → status='awaiting_consent'
        │
        ▼
Sistema envia "Responda SIM para confirmar"
        │
        ▼
Usuário responde "SIM"
        │
        ▼
zapi-webhook → process_verification_consent() → verification_method='whatsapp_consent'
        │
        ▼
zapi-webhook chama send-leader-affiliate-links
        │
        ▼
send-leader-affiliate-links verifica verification_method
        │
        ▼
Se 'whatsapp_consent' → Envia WhatsApp
Se outro → Envia SMS
```

---

## Correções Recomendadas (em ordem de prioridade)

| # | Correção | Arquivo | Impacto |
|---|----------|---------|---------|
| 1 | Verificar AMBOS `whatsapp` e `whatsapp_consent` | `send-leader-affiliate-links/index.ts` | 124 líderes afetados |
| 2 | Desabilitar fluxo antigo de verificação | `zapi-webhook/index.ts` | Evita confusão |
| 3 | Melhorar mensagens de erro | `zapi-webhook/index.ts` | UX |
| 4 | Testar com novo cadastro | N/A | Validar correções |

---

## Teste Recomendado

1. Desabilitar modo de teste OU adicionar outro número na whitelist
2. Fazer novo cadastro via link de afiliado
3. Verificar via WhatsApp
4. Confirmar que recebe link de indicação **apenas** via WhatsApp (não SMS)
5. Verificar logs para confirmar fluxo correto
