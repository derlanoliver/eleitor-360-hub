
# Plano: Sistema de Fallback Automático para Verificação de Cadastro

## Objetivo
Quando a conexão com o Z-API falhar, o sistema deve automaticamente mudar o método de verificação de "WhatsApp com Consentimento" para "Link via SMS" até que a conexão seja restabelecida.

## Problema Atual
- O método de verificação (`verification_method`) é configurado manualmente pelo administrador
- Se o Z-API desconecta, os novos cadastros tentam usar WhatsApp e falham silenciosamente
- Não há mecanismo automático para alternar o método quando a conexão falha

## Arquitetura da Solução

### 1. Nova Coluna no Banco de Dados
Adicionar campo para rastrear se o fallback está ativo:

```sql
ALTER TABLE integrations_settings 
ADD COLUMN verification_fallback_active boolean DEFAULT false;
ADD COLUMN zapi_last_connected_at timestamp with time zone;
ADD COLUMN zapi_disconnected_at timestamp with time zone;
```

### 2. Atualização do Webhook Z-API
Modificar a função `handleConnectionStatus` para:
- Ao receber `DisconnectedCallback`: ativar `verification_fallback_active = true`
- Ao receber `ConnectedCallback`: desativar `verification_fallback_active = false`

### 3. Atualização da RPC `get_verification_settings`
Modificar para retornar o método efetivo baseado no fallback:

```sql
CREATE OR REPLACE FUNCTION get_verification_settings()
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Se fallback ativo E método era whatsapp_consent, retorna 'link'
    CASE 
      WHEN i.verification_fallback_active = true 
           AND i.verification_method = 'whatsapp_consent'
      THEN 'link'
      ELSE i.verification_method
    END as verification_method,
    ...
  FROM integrations_settings i
  LIMIT 1;
END;
$$
```

### 4. UI: Indicador de Fallback na Página de Configurações
Mostrar um alerta visual quando o fallback estiver ativo:
- Badge amarelo/laranja: "Fallback SMS Ativo"
- Mensagem explicativa: "WhatsApp desconectado. Verificações estão sendo enviadas via SMS automaticamente."

## Alterações Técnicas

### Arquivo 1: Migração SQL (nova)
- Adiciona colunas de fallback
- Atualiza a RPC `get_verification_settings` para considerar fallback

### Arquivo 2: `supabase/functions/zapi-webhook/index.ts`
- Modificar `handleConnectionStatus()` para atualizar o status de fallback no banco

### Arquivo 3: `src/components/settings/VerificationSettingsCard.tsx`
- Adicionar indicador visual quando fallback está ativo
- Mostrar timestamps de última conexão/desconexão

### Arquivo 4: `src/hooks/useIntegrationsSettings.ts`
- Adicionar novos campos à interface `IntegrationsSettings`

## Fluxo Detalhado

```
[Z-API Desconecta]
       ↓
[Webhook recebe DisconnectedCallback]
       ↓
[handleConnectionStatus atualiza DB]
  • verification_fallback_active = true
  • zapi_disconnected_at = now()
       ↓
[Novo cadastro de líder]
       ↓
[LeaderRegistrationForm chama get_verification_settings()]
       ↓
[RPC retorna verification_method = 'link' (fallback)]
       ↓
[SMS enviado em vez de WhatsApp]
       ↓
[Líder recebe SMS com link de verificação]
```

## Indicador Visual (Admin)

No card "Verificação de Cadastro":
- Quando conectado: Badge verde "WhatsApp Ativo"
- Quando desconectado: Badge laranja "Fallback SMS" + alerta explicativo

## Benefícios

1. **Continuidade**: Cadastros nunca falham por falta de WhatsApp
2. **Transparência**: Admin vê claramente quando o fallback está ativo
3. **Automático**: Não requer intervenção manual
4. **Reversível**: Restaura WhatsApp assim que reconecta

## Considerações de Segurança

- A RPC `get_verification_settings` continua segura (SECURITY DEFINER)
- Nenhuma credencial sensível é exposta
- Apenas o método efetivo de verificação é alterado

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Adicionar colunas e atualizar RPC |
| `supabase/functions/zapi-webhook/index.ts` | Atualizar `handleConnectionStatus` |
| `src/hooks/useIntegrationsSettings.ts` | Adicionar novos campos de fallback |
| `src/components/settings/VerificationSettingsCard.tsx` | Indicador visual de fallback |
| `src/hooks/useZapiConnectionStatus.ts` | Retornar mais info sobre status |

## Teste Recomendado
Após implementação:
1. Configurar verificação como "WhatsApp com Consentimento"
2. Desconectar o WhatsApp do celular
3. Aguardar webhook de desconexão
4. Verificar que novos cadastros recebem SMS
5. Reconectar WhatsApp
6. Verificar que novos cadastros voltam a usar WhatsApp
