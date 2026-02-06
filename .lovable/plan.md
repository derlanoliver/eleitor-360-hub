
# Integrar 360dialog como Provedor WhatsApp

## Resumo
Adicionar a 360dialog como terceiro provedor de WhatsApp Business API, seguindo o mesmo padrao de abstração já existente para Z-API e Meta Cloud API. A 360dialog utiliza a mesma Graph API do WhatsApp (compatível com a Meta Cloud API), mas com autenticação e endpoints próprios.

## O que muda para o usuário
- Nova opção "360dialog" no seletor de provedor WhatsApp ativo nas Integrações
- Card de configuração com campos: API Key da 360dialog e Phone Number ID
- Modo teste com whitelist (mesmo padrão do Meta Cloud)
- Fallback automático para Z-API se 360dialog falhar
- Botão para testar conexão

## Etapas de Implementação

### 1. Banco de Dados - Nova coluna na tabela `integrations_settings`
Adicionar colunas para armazenar configurações da 360dialog:
- `dialog360_enabled` (boolean, default false)
- `dialog360_api_key` (text, nullable) - API Key da 360dialog
- `dialog360_phone_number_id` (text, nullable)
- `dialog360_test_mode` (boolean, default true)
- `dialog360_whitelist` (jsonb, default '[]')
- `dialog360_fallback_enabled` (boolean, default false)

Atualizar o tipo de `whatsapp_provider_active` para aceitar `'zapi' | 'meta_cloud' | 'dialog360'`.

### 2. Secret - API Key da 360dialog
Armazenar a API Key como secret do backend (`DIALOG360_API_KEY`) para uso seguro na Edge Function, seguindo o mesmo padrão do `META_WA_ACCESS_TOKEN`.

### 3. Edge Function `send-whatsapp` - Novo provedor
Adicionar função `sendVia360Dialog()` seguindo o padrão existente:
- A 360dialog usa a mesma Graph API (`https://waba-v2.360dialog.io/messages`)
- Autenticação via header `D360-API-KEY`
- Payload idêntico ao da Meta Cloud (messaging_product, type, to, text/template)
- Integrar no fluxo de seleção de provedor e fallback

Atualizar o tipo `IntegrationSettings` e a lógica de roteamento para incluir `dialog360`.

### 4. Edge Function `test-360dialog-connection`
Nova Edge Function para validar a API Key e Phone Number ID:
- Chamar endpoint de health/status da 360dialog
- Retornar informações do número conectado

### 5. Edge Function `dialog360-webhook` (recebimento de mensagens)
Webhook para receber mensagens e status updates da 360dialog:
- Mesmo formato da Graph API (compatível com meta-whatsapp-webhook)
- Registrar mensagens recebidas
- Atualizar status de entrega
- Suporte ao chatbot

### 6. Frontend - Configurações de Integração

**`src/hooks/useIntegrationsSettings.ts`:**
- Atualizar interfaces `IntegrationsSettings` e `UpdateIntegrationsDTO` com campos 360dialog
- Adicionar hook `useTest360DialogConnection`

**`src/components/settings/MetaCloudConfigCard.tsx`:**
- Expandir o seletor de provedor para incluir opção "360dialog"

**Novo componente `src/components/settings/Dialog360ConfigCard.tsx`:**
- Card com campos: API Key, Phone Number ID
- Toggle habilitado/desabilitado
- Modo teste com whitelist
- Fallback para Z-API
- Botão testar conexão

**`src/pages/settings/Integrations.tsx`:**
- Renderizar o novo `Dialog360ConfigCard`
- Integrar salvamento das configurações

### 7. Atualizar tipos e referências
- `whatsapp_messages.provider` - garantir que aceite valor 'dialog360'
- Atualizar `providerOverride` no tipo `SendWhatsAppRequest` para incluir `'dialog360'`
- Atualizar abas de WhatsApp (histórico, API Oficial) se necessário

## Detalhes Técnicos

### API da 360dialog
```text
Endpoint: https://waba-v2.360dialog.io/messages
Auth: Header "D360-API-KEY: {api_key}"
Payload: Mesmo formato da Graph API do WhatsApp (messaging_product, to, type, text/template)
```

### Fluxo de roteamento de provedores (atualizado)
```text
providerOverride definido?
  |-- Sim --> Usa provedor especificado (zapi / meta_cloud / dialog360)
  |-- Nao --> Usa whatsapp_provider_active da config
        |-- dialog360 --> dialog360_enabled?
        |     |-- Nao --> fallback para zapi
        |     |-- Sim --> test_mode? whitelist ok? --> envia via 360dialog
        |           |-- Falhou + fallback --> tenta zapi
        |-- meta_cloud --> (fluxo existente)
        |-- zapi --> (fluxo existente)
```

### Arquivos a criar
- `supabase/functions/test-360dialog-connection/index.ts`
- `supabase/functions/dialog360-webhook/index.ts`
- `src/components/settings/Dialog360ConfigCard.tsx`

### Arquivos a modificar
- `supabase/functions/send-whatsapp/index.ts` (novo provedor)
- `supabase/config.toml` (novas functions)
- `src/hooks/useIntegrationsSettings.ts` (tipos + hook teste)
- `src/components/settings/MetaCloudConfigCard.tsx` (seletor 3 opções)
- `src/pages/settings/Integrations.tsx` (novo card)
- Migration SQL para novas colunas
