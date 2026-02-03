
## Documento de Auditoria Completa do Sistema

### Objetivo
Criar um arquivo Markdown (`SYSTEM_BLUEPRINT.md`) completo que sirva como "blueprint" do sistema, permitindo que uma IA reconstrua o sistema do absoluto zero apenas lendo este documento.

---

## Estrutura do Documento

### 1. VISAO GERAL DO SISTEMA

**1.1 Proposito e Contexto**
- Sistema de gestao de relacionamento politico (CRM)
- Gerenciamento de liderancas, contatos, eventos e campanhas
- Comunicacao multicanal (WhatsApp, SMS, Email)
- Modulo de gabinete para atendimento presencial

**1.2 Stack Tecnologico**
- Frontend: React 18.3, Vite, TypeScript, Tailwind CSS
- UI Components: Radix UI, shadcn/ui
- State Management: TanStack React Query
- Backend: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- Integrações: Z-API (WhatsApp), SMSDEV/SMSBarato/Disparopro (SMS), Resend (Email), PassKit (Cartao Digital)

**1.3 Arquitetura de Pastas**
```
src/
├── components/           # Componentes React organizados por modulo
├── contexts/            # Context providers (Auth, Tutorial)
├── hooks/               # Custom hooks organizados por dominio
├── pages/               # Paginas da aplicacao
├── services/            # Servicos de negocio
├── integrations/        # Cliente Supabase e tipos
├── lib/                 # Utilitarios
├── types/               # Tipos TypeScript
└── utils/               # Funcoes utilitarias

supabase/
├── functions/           # Edge Functions (42 funcoes)
├── migrations/          # Migracoes SQL (221+ arquivos)
└── config.toml          # Configuracao
```

---

### 2. SISTEMA DE AUTENTICACAO E PERMISSOES

**2.1 Roles do Sistema**
| Role | Descricao | Acessos |
|------|-----------|---------|
| `super_admin` | Administrador da plataforma | Tudo, incluindo tickets de suporte |
| `admin` | Administrador da organizacao | Gestao completa exceto tickets internos |
| `atendente` | Operador de atendimento | Dashboard, contatos, liderancas, gabinete |
| `checkin_operator` | Operador de check-in | Apenas modulo de eventos |

**2.2 Fluxo de Autenticacao**
1. Login via email/senha (Supabase Auth)
2. Busca perfil em `profiles` e role em `user_roles`
3. Registro de sessao em `active_sessions`
4. Controle de multiplas sessoes (logout forcado da mais antiga)

**2.3 Funcoes RPC de Seguranca**
- `has_role(_user_id, _role)`: Verifica se usuario tem role especifica
- `has_admin_access(_user_id)`: Verifica se e admin ou super_admin
- `is_super_admin(_user_id)`: Verifica se e super_admin

---

### 3. SCHEMA DO BANCO DE DADOS

**3.1 Tabelas Principais (42 tabelas)**

| Tabela | Proposito | Campos Chave |
|--------|-----------|--------------|
| `lideres` | Liderancas politicas | nome_completo, telefone, email, cidade_id, pontuacao_total, cadastros, is_coordinator, parent_leader_id, hierarchy_level, affiliate_token, is_verified |
| `office_contacts` | Base de contatos | nome, telefone_norm, cidade_id, source_type, source_id, is_verified, genero |
| `office_cities` | Cidades/Regioes | nome, codigo_ra, tipo (DF/ENTORNO), latitude, longitude |
| `events` | Eventos | name, slug, date, time, location, categories, capacity, checkin_pin |
| `event_registrations` | Inscricoes em eventos | event_id, contact_id, leader_id, nome, email, whatsapp, checked_in |
| `office_visits` | Visitas ao gabinete | protocolo, contact_id, leader_id, status, scheduled_date |
| `surveys` | Pesquisas | titulo, slug, status, config |
| `survey_questions` | Perguntas das pesquisas | survey_id, tipo, pergunta, opcoes |
| `survey_responses` | Respostas das pesquisas | survey_id, contact_id, leader_id, respostas (JSONB) |
| `campaigns` | Campanhas de marketing | nome, utm_source, utm_campaign, event_id, funnel_id |
| `lead_funnels` | Funis de captacao | nome, slug, lead_magnet_url, campos_form |
| `whatsapp_messages` | Historico WhatsApp | phone, message, direction, status, message_id |
| `sms_messages` | Historico SMS | phone, message, status, provider, retry_count |
| `email_logs` | Historico Email | to_email, subject, status, resend_id |
| `whatsapp_templates` | Templates WhatsApp | slug, nome, mensagem, variaveis |
| `sms_templates` | Templates SMS | slug, nome, mensagem (max 160 chars) |
| `email_templates` | Templates Email | slug, nome, assunto, conteudo_html |
| `integrations_settings` | Configuracoes de integracao | zapi_*, resend_*, smsdev_*, passkit_*, wa_auto_* |
| `user_roles` | Roles dos usuarios | user_id, role |
| `profiles` | Perfis de usuario | name, email, avatar_url, telefone |
| `active_sessions` | Sessoes ativas | user_id, session_id, device_info, browser, os |
| `scheduled_messages` | Mensagens agendadas | message_type, template_slug, scheduled_for, status |
| `support_tickets` | Tickets de suporte | protocolo, assunto, status, prioridade |
| `organization` | Dados da organizacao | nome, cargo, partido, logo_url, redes sociais |

**3.2 Enums do Sistema**
```sql
-- Roles de usuario
CREATE TYPE app_role AS ENUM ('super_admin', 'super_user', 'admin', 'atendente', 'checkin_operator');

-- Status de visita ao gabinete
CREATE TYPE office_visit_status AS ENUM (
  'SCHEDULED', 'REGISTERED', 'LINK_SENT', 'FORM_OPENED', 
  'FORM_SUBMITTED', 'CHECKED_IN', 'CANCELLED', 'MEETING_COMPLETED', 'RESCHEDULED'
);

-- Status de cidade/lider
CREATE TYPE office_city_status AS ENUM ('active', 'inactive');
CREATE TYPE office_leader_status AS ENUM ('active', 'inactive');
```

**3.3 Funcoes RPC Principais (60+ funcoes)**
- Hierarquia de lideres: `get_leader_tree`, `get_leader_hierarchy_path`, `move_leader_branch`, `promote_to_coordinator`
- Estatisticas: `get_coordinator_network_stats`, `get_leader_ranking_position`, `get_leaders_ranking_paginated`
- Registros: `create_event_registration`, `create_leader_from_public_form`, `upsert_contact_from_public_form`
- Verificacao: `verify_leader_by_code`, `verify_contact_by_code`, `mark_leader_verified_manually`
- Check-in: `checkin_event_by_qr`, `checkin_visit_by_qr`, `validate_checkin_pin`
- Gamificacao: `award_leader_points`, `increment_leader_cadastros`

---

### 4. MODULOS DO SISTEMA

**4.1 Modulo de Liderancas**
- Hierarquia em arvore (coordenadores > lideres nivel 1-3)
- Sistema de pontuacao e gamificacao (Bronze < Prata < Ouro < Diamante)
- Token de afiliado para indicacoes
- Verificacao via WhatsApp/SMS (codigo de 5 caracteres)
- Cartao digital via PassKit

**Algoritmo de Hierarquia:**
```typescript
// Coordenador: is_coordinator = true, hierarchy_level = 1
// Lider N1: parent = coordenador, hierarchy_level = 2
// Lider N2: parent = N1, hierarchy_level = 3
// Lider N3: parent = N2, hierarchy_level = 4 (limite)
```

**4.2 Modulo de Eventos**
- Criacao de eventos com categorias multiplas
- Inscricao publica via slug (/eventos/:slug)
- QR Code para check-in
- PIN de seguranca para operadores de check-in
- Envio de fotos pos-evento via WhatsApp/SMS

**4.3 Modulo de Campanhas**
- Funis de captacao com lead magnet
- Rastreamento UTM (source, medium, campaign, content)
- Integracao com eventos e pesquisas

**4.4 Modulo de Gabinete**
- Registro de visitas presenciais
- Fila de atendimento
- Formulario publico pre-visita
- Atas de reuniao
- Agendamento de visitas

**4.5 Modulo de Pesquisas**
- Editor de perguntas (texto, multipla escolha, escala, etc)
- Links de indicacao por lider
- Analise com IA
- Exportacao de resultados

**4.6 Modulo de Comunicacao**
- Disparo em massa (WhatsApp, SMS, Email)
- Templates com variaveis dinamicas
- Agendamento de mensagens
- Fallback automatico (WhatsApp falhou -> SMS)
- Chatbot para lideres via WhatsApp

---

### 5. EDGE FUNCTIONS (42 funcoes)

**5.1 Comunicacao**
| Funcao | Proposito |
|--------|-----------|
| `send-whatsapp` | Envio via Z-API com suporte a templates e imagens |
| `send-sms` | Envio com fallback entre provedores (SMSDEV, SMSBarato, Disparopro) |
| `send-email` | Envio via Resend com templates HTML |
| `whatsapp-chatbot` | Chatbot interativo para lideres |
| `zapi-webhook` | Recebe callbacks do Z-API (status, mensagens recebidas) |
| `smsdev-webhook` | Recebe callbacks de status do SMSDEV |

**5.2 Algoritmo do Chatbot**
```typescript
// 1. Recebe mensagem do lider
// 2. Busca keyword match (AJUDA, PONTOS, ARVORE, etc)
// 3. Se keyword encontrada:
//    - static: retorna resposta fixa com variaveis
//    - dynamic: executa funcao (ex: get_leader_tree_stats)
//    - ai: gera resposta com IA
// 4. Se nao encontrada: usa IA ou mensagem fallback
// 5. Envia resposta via Z-API
```

**5.3 Integrações Externas**
| Funcao | Integracao |
|--------|------------|
| `create-leader-pass` | PassKit - Cria cartao digital do lider |
| `passkit-webhook` | PassKit - Recebe callbacks (instalacao/desinstalacao) |
| `get-zapi-qrcode` | Z-API - Obtem QR Code para conectar instancia |
| `test-*-connection` | Testa conexao com provedores |

**5.4 Processos Automatizados**
| Funcao | Proposito |
|--------|-----------|
| `process-scheduled-messages` | Processa mensagens agendadas |
| `process-sms-fallback` | Reenvia SMS falhos como WhatsApp |
| `retry-failed-sms` | Retry automatico com backoff exponencial |
| `schedule-region-material` | Agenda envio de material por regiao |

---

### 6. FLUXOS DE NEGOCIOS

**6.1 Cadastro de Lider via Link de Afiliado**
```
1. Pessoa acessa /affiliate/:leaderToken
2. Sistema busca lider pelo token
3. Pessoa preenche formulario (nome, telefone, email, cidade)
4. RPC `register_leader_from_affiliate` executa:
   - Verifica se ja e lider (por telefone/email)
   - Se ja e lider de outro: retorna erro
   - Se novo: cria lider com parent_leader_id = lider indicador
   - Gera verification_code
   - Incrementa cadastros do lider indicador
   - Dispara award_leader_points
5. Edge Function `send-whatsapp` envia codigo de verificacao
6. Pessoa responde com codigo no WhatsApp
7. `zapi-webhook` recebe, valida codigo, marca is_verified = true
8. Se aprovado, envia link de indicacao pessoal
```

**6.2 Inscricao em Evento**
```
1. Pessoa acessa /eventos/:slug
2. Sistema busca evento e lider (se ?l=token presente)
3. Pessoa preenche formulario
4. RPC `create_event_registration`:
   - Cria/atualiza contato em office_contacts
   - Cria registro em event_registrations
   - Gera QR Code unico
   - Incrementa registrations_count do evento
   - Se indicado por lider: incrementa cadastros
5. Envia WhatsApp de confirmacao com QR Code
6. No dia do evento: operador escaneia QR ou digita codigo
7. RPC `checkin_event_by_qr` marca checked_in = true
```

**6.3 Sistema de Pontuacao (Gamificacao)**
```
Pontos sao concedidos via RPC award_leader_points:
- Cadastro de contato: +X pontos
- Contato aceita reuniao: +Y pontos
- Indicacao de novo lider: +Z pontos
- Participacao em evento: +W pontos

Niveis (configuravel em office_settings):
- Bronze: 0-10 pontos
- Prata: 11-30 pontos
- Ouro: 31-50 pontos
- Diamante: 51+ pontos
```

**6.4 Verificacao de Contatos/Lideres**
```
1. Codigo de 5 caracteres alfanumericos gerado no cadastro
2. Armazenado em verification_code
3. Enviado via SMS ou WhatsApp
4. Pessoa responde com codigo
5. zapi-webhook detecta codigo (regex ^[A-Z0-9]{5,6}$)
6. Busca em office_contacts ou lideres
7. Se encontrado: marca is_verified = true
8. Envia mensagens pendentes (pending_messages JSONB)
```

---

### 7. ROTAS DA APLICACAO

**7.1 Rotas Publicas (sem autenticacao)**
| Rota | Componente | Proposito |
|------|------------|-----------|
| `/login` | Login | Tela de login |
| `/eventos/:slug` | EventRegistration | Inscricao em evento |
| `/captacao/:slug` | LeadCaptureLanding | Pagina de captura |
| `/cadastro/:leaderToken` | LeaderRegistrationForm | Cadastro via indicacao |
| `/affiliate/:leaderToken` | AffiliateForm | Formulario de afiliado |
| `/pesquisa/:slug` | SurveyPublicForm | Resposta de pesquisa |
| `/checkin/:qrCode` | EventCheckin | Check-in com PIN |
| `/v/:codigo` | VerifyContact | Verificacao de contato |
| `/verificar-lider/:codigo` | VerifyLeader | Verificacao de lider |
| `/s/:code` | ShortUrlRedirect | Redirecionador de URLs curtas |
| `/descadastro` | Unsubscribe | Opt-out de comunicacoes |

**7.2 Rotas Protegidas (requer autenticacao)**
| Rota | Roles | Componente |
|------|-------|------------|
| `/dashboard` | admin, atendente | Dashboard |
| `/leaders` | admin, atendente | Gestao de Liderancas |
| `/leaders/tree` | admin, atendente | Arvore de Hierarquia |
| `/contacts` | admin, atendente | Base de Contatos |
| `/events` | admin, atendente, checkin_operator | Gestao de Eventos |
| `/campaigns` | admin, atendente | Campanhas |
| `/surveys` | admin, atendente | Pesquisas |
| `/whatsapp` | admin, atendente | WhatsApp Marketing |
| `/sms` | admin, atendente | SMS Marketing |
| `/email` | admin, atendente | Email Marketing |
| `/office/*` | admin, atendente | Modulo Gabinete |
| `/settings/*` | variado | Configuracoes |

---

### 8. INTEGRACOES EXTERNAS

**8.1 Z-API (WhatsApp)**
```
Configuracao: integrations_settings.zapi_*
- instance_id: ID da instancia
- token: Token de API
- client_token: Token do cliente (opcional)

Endpoints:
- POST /send-text: Enviar mensagem texto
- POST /send-image: Enviar imagem
- GET /status: Verificar conexao
- GET /qr-code/image: Obter QR para conectar

Webhook: supabase/functions/zapi-webhook
- MessageStatusCallback: Atualiza status da mensagem
- ReceivedCallback: Processa mensagem recebida (verificacao, chatbot, opt-out)
- ConnectedCallback/DisconnectedCallback: Status da conexao
```

**8.2 Provedores SMS**
```
Provedor ativo: integrations_settings.sms_active_provider

SMSDEV:
- API Key: smsdev_api_key
- Endpoint: https://api.smsdev.com.br/v1/send

SMSBarato:
- API Key: smsbarato_api_key
- Endpoint: https://sistema81.smsbarato.com.br/send

Disparopro:
- Bearer Token: disparopro_token
- Endpoint: https://apihttp.disparopro.com.br:8433/mt
```

**8.3 Resend (Email)**
```
Configuracao: integrations_settings.resend_*
- api_key: Chave da API
- from_email: Email remetente
- from_name: Nome remetente
```

**8.4 PassKit (Cartao Digital)**
```
Configuracao: integrations_settings.passkit_*
- api_token: Bearer token
- api_base_url: URL base (pub1.passkit.io)
- program_id: ID do programa de fidelidade
- tier_id: ID do tier padrao

Fluxo:
1. create-leader-pass cria/atualiza membro no PassKit
2. PassKit gera URL de instalacao
3. Lider instala no Apple Wallet ou Google Wallet
4. passkit-webhook recebe callbacks de instalacao
5. Atualiza lideres.passkit_pass_installed
```

---

### 9. VARIAVEIS DE AMBIENTE

```env
# Supabase (auto-configurado)
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]

# Edge Functions (secretos do Supabase)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# IA (opcional, para chatbot e geracao de conteudo)
LOVABLE_API_KEY=[key-para-ai-gateway]
```

---

### 10. TEMPLATES DE MENSAGEM

**10.1 Variaveis Disponiveis**
```
{{nome}} - Primeiro nome do destinatario
{{nome_completo}} - Nome completo
{{codigo}} - Codigo de verificacao
{{link_verificacao}} - URL de verificacao
{{link_indicacao}} - URL do link de afiliado
{{evento_nome}} - Nome do evento
{{evento_data}} - Data do evento
{{evento_local}} - Local do evento
{{pontos}} - Pontuacao do lider
{{cadastros}} - Numero de cadastros
```

**10.2 Categorias de Templates**
- `verificacao`: Codigos de verificacao
- `evento`: Confirmacao de inscricao em eventos
- `lideranca`: Boas-vindas e links de indicacao
- `captacao`: Lead magnets e materiais
- `visita`: Fluxo de gabinete
- `optout`: Descadastro e recadastro

---

### 11. POLITICAS RLS

**Padrao de Seguranca:**
```sql
-- Funcoes auxiliares
has_role(auth.uid(), 'admin'::app_role)
has_admin_access(auth.uid())
is_super_admin(auth.uid())

-- Padrao para tabelas administrativas
CREATE POLICY "admin_modify" ON tabela
FOR ALL
USING (has_admin_access(auth.uid()))
WITH CHECK (has_admin_access(auth.uid()));

-- Padrao para tabelas publicas (inscricoes)
CREATE POLICY "public_insert" ON tabela
FOR INSERT
WITH CHECK (true);

CREATE POLICY "admin_select" ON tabela
FOR SELECT
USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));
```

---

### 12. ARQUIVOS A CRIAR

O documento sera salvo em: `.lovable/SYSTEM_BLUEPRINT.md`

---

## Proximos Passos da Implementacao

1. **Criar arquivo** `.lovable/SYSTEM_BLUEPRINT.md`
2. **Incluir todos os itens acima** com nivel de detalhe completo
3. **Adicionar snippets de codigo** das funcoes mais criticas
4. **Incluir exemplos de payloads** para todas as APIs
5. **Documentar todas as 42 Edge Functions** com input/output
6. **Listar todas as 60+ RPCs** com parametros e retornos
7. **Mapear relacionamentos** entre todas as 42 tabelas
