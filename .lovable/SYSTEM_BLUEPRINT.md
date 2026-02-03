# SYSTEM BLUEPRINT - Documentação Técnica Completa

> **Versão**: 1.0.0  
> **Última Atualização**: 2026-02-03  
> **Propósito**: Documento completo para reconstrução do sistema por IA

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Propósito e Contexto

Sistema de **Gestão de Relacionamento Político (CRM)** desenvolvido para:

- Gerenciamento hierárquico de lideranças políticas em árvore
- Gestão de base de contatos com verificação multicanal
- Organização e check-in de eventos com QR Code
- Campanhas de marketing com rastreamento UTM
- Comunicação multicanal (WhatsApp, SMS, Email)
- Módulo de gabinete para atendimento presencial
- Pesquisas com análise via IA
- Sistema de gamificação com pontuação e níveis

### 1.2 Stack Tecnológico

```
FRONTEND
├── Framework: React 18.3 + TypeScript
├── Build: Vite
├── Styling: Tailwind CSS
├── UI Components: Radix UI + shadcn/ui
├── State: TanStack React Query v5
├── Routing: React Router DOM v6
├── Charts: Recharts
├── Maps: Leaflet + React Leaflet
└── Forms: React Hook Form + Zod

BACKEND (Supabase)
├── Database: PostgreSQL 15
├── Auth: Supabase Auth (email/password)
├── Functions: Deno Edge Functions (42 funções)
├── Storage: Supabase Storage
└── Realtime: Supabase Realtime (para fila do gabinete)

INTEGRAÇÕES EXTERNAS
├── WhatsApp: Z-API (instância própria)
├── SMS: SMSDEV / SMSBarato / Disparopro (fallback)
├── Email: Resend
├── Cartão Digital: PassKit (Apple/Google Wallet)
└── IA: Lovable AI Gateway (Gemini, GPT)
```

### 1.3 Arquitetura de Pastas

```
projeto/
├── src/
│   ├── components/           # Componentes React organizados por módulo
│   │   ├── ui/              # Componentes base shadcn/ui
│   │   ├── leaders/         # Componentes de lideranças
│   │   ├── contacts/        # Componentes de contatos
│   │   ├── events/          # Componentes de eventos
│   │   ├── campaigns/       # Componentes de campanhas
│   │   ├── surveys/         # Componentes de pesquisas
│   │   ├── office/          # Componentes do módulo gabinete
│   │   ├── whatsapp/        # Componentes de WhatsApp
│   │   ├── sms/             # Componentes de SMS
│   │   ├── email/           # Componentes de Email
│   │   ├── settings/        # Componentes de configurações
│   │   ├── reports/         # Componentes de relatórios
│   │   ├── maps/            # Componentes de mapas estratégicos
│   │   └── support/         # Componentes de suporte
│   │
│   ├── contexts/            # Context Providers React
│   │   ├── AuthContext.tsx  # Autenticação e sessão
│   │   └── TutorialContext.tsx
│   │
│   ├── hooks/               # Custom hooks organizados por domínio
│   │   ├── leaders/         # Hooks de lideranças
│   │   ├── contacts/        # Hooks de contatos
│   │   ├── events/          # Hooks de eventos
│   │   ├── campaigns/       # Hooks de campanhas
│   │   ├── surveys/         # Hooks de pesquisas
│   │   ├── office/          # Hooks do gabinete
│   │   ├── dashboard/       # Hooks do dashboard
│   │   ├── reports/         # Hooks de relatórios
│   │   ├── notifications/   # Hooks de notificações
│   │   ├── team/            # Hooks de equipe
│   │   ├── programs/        # Hooks de programas
│   │   ├── sms/             # Hooks de SMS
│   │   └── support/         # Hooks de suporte
│   │
│   ├── pages/               # Páginas da aplicação
│   │   ├── office/          # Páginas do módulo gabinete
│   │   └── settings/        # Páginas de configurações
│   │
│   ├── services/            # Serviços de negócio
│   │   └── office/          # Serviços do gabinete
│   │
│   ├── integrations/        # Cliente Supabase
│   │   └── supabase/
│   │       ├── client.ts    # Cliente Supabase (auto-gerado)
│   │       └── types.ts     # Tipos do banco (auto-gerado)
│   │
│   ├── lib/                 # Utilitários
│   ├── types/               # Tipos TypeScript customizados
│   ├── utils/               # Funções utilitárias
│   └── data/                # Dados estáticos/seed
│
├── supabase/
│   ├── functions/           # Edge Functions (42 funções)
│   ├── migrations/          # Migrações SQL (221+ arquivos)
│   └── config.toml          # Configuração Supabase
│
└── public/                  # Assets estáticos
```

---

## 2. SISTEMA DE AUTENTICAÇÃO E PERMISSÕES

### 2.1 Roles do Sistema

| Role | Enum | Descrição | Acessos Principais |
|------|------|-----------|-------------------|
| `super_admin` | `app_role` | Administrador da plataforma | Tudo, incluindo tickets internos e configurações globais |
| `admin` | `app_role` | Administrador da organização | Gestão completa exceto tickets internos |
| `atendente` | `app_role` | Operador de atendimento | Dashboard, contatos, lideranças, gabinete, comunicação |
| `checkin_operator` | `app_role` | Operador de check-in | Apenas módulo de eventos |

### 2.2 Mapeamento de Acessos por Role

```typescript
// src/hooks/useUserRole.ts
const ROLE_ACCESS: Record<string, { pages: string[], settings: string[] }> = {
  admin: {
    pages: ['dashboard', 'contacts', 'leaders', 'campaigns', 'events', 
            'projects', 'ai-agent', 'whatsapp', 'email', 'office', 'settings'],
    settings: ['organization', 'team', 'integrations', 'tracking', 
               'ai-providers', 'affiliate-form', 'leader-form', 'privacy', 
               'support', 'profile']
  },
  atendente: {
    pages: ['dashboard', 'contacts', 'leaders', 'campaigns', 'events', 
            'projects', 'ai-agent', 'whatsapp', 'email', 'office', 'settings'],
    settings: ['affiliate-form', 'leader-form', 'privacy', 'support', 'profile']
  },
  checkin_operator: {
    pages: ['events'],
    settings: ['privacy', 'profile']
  }
};
// super_admin tem acesso total (bypass)
```

### 2.3 Fluxo de Autenticação

```
1. Usuário acessa /login
2. Submete email/senha
3. Supabase Auth valida credenciais
4. Se válido:
   a. Busca perfil em `profiles` (name, email, avatar_url)
   b. Busca role em `user_roles` (role)
   c. Gera session_id único para este navegador
   d. Registra sessão em `active_sessions` com device_info
   e. Se já existem outras sessões:
      - Marca a mais antiga para logout forçado em 5 minutos
      - Define force_logout_at e force_logout_reason
5. AuthContext mantém estado do usuário
6. ProtectedRoute/RoleProtectedRoute controlam acesso às rotas
```

### 2.4 Controle de Sessões Múltiplas

```typescript
// Gerar ID único para sessão do navegador
const getOrCreateSessionId = (): string => {
  const storageKey = 'active_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
};

// Detectar informações do dispositivo
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  // Detecta: browser (Firefox, Edge, Chrome, Safari, Opera)
  // Detecta: os (Windows, macOS, Linux, Android, iOS)
  // Detecta: deviceType (Desktop, Mobile, Tablet)
  return { browser, os, deviceInfo: `${deviceType} - ${browser} no ${os}` };
};
```

### 2.5 Funções RPC de Segurança (SQL)

```sql
-- Verifica se usuário tem role específica
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Verifica se é admin ou super_admin
CREATE OR REPLACE FUNCTION has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Verifica se é super_admin
CREATE OR REPLACE FUNCTION is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;
```

---

## 3. SCHEMA DO BANCO DE DADOS

### 3.1 Enums do Sistema

```sql
-- Roles de usuário do sistema
CREATE TYPE app_role AS ENUM (
  'super_admin',   -- Administrador da plataforma
  'super_user',    -- Usuário especial (legacy)
  'admin',         -- Administrador da organização
  'atendente',     -- Operador de atendimento
  'checkin_operator' -- Operador de check-in
);

-- Status de visita ao gabinete
CREATE TYPE office_visit_status AS ENUM (
  'SCHEDULED',        -- Agendada
  'REGISTERED',       -- Registrada na fila
  'LINK_SENT',        -- Link do formulário enviado
  'FORM_OPENED',      -- Formulário foi aberto
  'FORM_SUBMITTED',   -- Formulário preenchido
  'CHECKED_IN',       -- Check-in realizado
  'CANCELLED',        -- Cancelada
  'MEETING_COMPLETED', -- Reunião concluída
  'RESCHEDULED'       -- Reagendada
);

-- Status de cidade
CREATE TYPE office_city_status AS ENUM ('active', 'inactive');

-- Status de líder
CREATE TYPE office_leader_status AS ENUM ('active', 'inactive');
```

### 3.2 Tabelas Principais (42 tabelas)

#### 3.2.1 Tabela: `lideres` (Lideranças Políticas)

```sql
CREATE TABLE lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  telefone TEXT,                    -- Formato: +5561999999999
  email TEXT,
  cidade_id UUID REFERENCES office_cities(id),
  status office_leader_status DEFAULT 'active',
  pontuacao_total INTEGER DEFAULT 0,
  cadastros INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ,
  join_date TIMESTAMPTZ DEFAULT now(),
  data_nascimento DATE,
  observacao TEXT,
  
  -- Hierarquia
  is_coordinator BOOLEAN DEFAULT false,
  hierarchy_level INTEGER,          -- 1=Coordenador, 2-4=Subordinados
  parent_leader_id UUID REFERENCES lideres(id),
  
  -- Afiliação
  affiliate_token TEXT UNIQUE,      -- Token único para links de indicação
  
  -- Verificação
  is_verified BOOLEAN DEFAULT false,
  verification_code TEXT,           -- Código de 5 caracteres
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verification_method TEXT,         -- 'link', 'whatsapp', 'sms', 'manual'
  verified_by_user_id UUID,
  
  -- PassKit (Cartão Digital)
  passkit_member_id TEXT,
  passkit_pass_installed BOOLEAN DEFAULT false,
  passkit_installed_at TIMESTAMPTZ,
  passkit_uninstalled_at TIMESTAMPTZ,
  passkit_invalidated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices importantes
CREATE INDEX idx_lideres_telefone ON lideres(telefone);
CREATE INDEX idx_lideres_affiliate_token ON lideres(affiliate_token);
CREATE INDEX idx_lideres_parent_leader_id ON lideres(parent_leader_id);
CREATE INDEX idx_lideres_cidade_id ON lideres(cidade_id);
CREATE INDEX idx_lideres_verification_code ON lideres(verification_code);
```

#### 3.2.2 Tabela: `office_contacts` (Base de Contatos)

```sql
CREATE TABLE office_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone_norm TEXT NOT NULL,      -- Formato E.164: +5561999999999
  email TEXT,
  cidade_id UUID NOT NULL REFERENCES office_cities(id),
  endereco TEXT,
  data_nascimento DATE,
  instagram TEXT,
  facebook TEXT,
  genero TEXT,                      -- 'Masculino', 'Feminino', 'Não identificado'
  observacao TEXT,
  
  -- Origem
  source_type TEXT,                 -- 'manual', 'lider', 'campanha', 'evento', 'captacao', 'visita'
  source_id TEXT,                   -- ID da origem (leader_id, event_id, etc)
  
  -- UTM Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  
  -- Verificação
  is_verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  pending_messages JSONB,           -- Mensagens pendentes pós-verificação
  
  -- Opt-out
  is_active BOOLEAN DEFAULT true,
  opted_out_at TIMESTAMPTZ,
  opt_out_reason TEXT,
  opt_out_channel TEXT,             -- 'whatsapp', 'sms', 'email', 'manual'
  unsubscribe_token TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_office_contacts_telefone_norm ON office_contacts(telefone_norm);
CREATE INDEX idx_office_contacts_cidade_id ON office_contacts(cidade_id);
CREATE INDEX idx_office_contacts_verification_code ON office_contacts(verification_code);
CREATE INDEX idx_office_contacts_source ON office_contacts(source_type, source_id);
```

#### 3.2.3 Tabela: `office_cities` (Cidades/Regiões)

```sql
CREATE TABLE office_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_ra TEXT NOT NULL,          -- Código da Região Administrativa
  tipo TEXT DEFAULT 'DF',           -- 'DF' ou 'ENTORNO'
  status office_city_status DEFAULT 'active',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.4 Tabela: `events` (Eventos)

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  region TEXT NOT NULL,
  categories TEXT[],                -- Array de categorias
  capacity INTEGER,
  cover_image_url TEXT,
  status TEXT DEFAULT 'published',  -- 'draft', 'published', 'cancelled'
  
  -- Contadores
  registrations_count INTEGER DEFAULT 0,
  checkedin_count INTEGER DEFAULT 0,
  
  -- Configurações
  show_registrations_count BOOLEAN DEFAULT true,
  registration_deadline_hours INTEGER,
  checkin_pin TEXT,                 -- PIN de 4 dígitos para operadores
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.5 Tabela: `event_registrations` (Inscrições em Eventos)

```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES office_contacts(id),
  leader_id UUID REFERENCES lideres(id),
  cidade_id UUID REFERENCES office_cities(id),
  
  -- Dados da inscrição
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  endereco TEXT,
  data_nascimento DATE,
  
  -- Check-in
  qr_code TEXT UNIQUE,              -- Código único para QR
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  
  -- UTM Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.6 Tabela: `office_visits` (Visitas ao Gabinete)

```sql
CREATE TABLE office_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT NOT NULL UNIQUE,   -- Ex: GAB-2024-00001
  contact_id UUID NOT NULL REFERENCES office_contacts(id),
  leader_id UUID REFERENCES lideres(id),
  city_id UUID NOT NULL REFERENCES office_cities(id),
  status office_visit_status DEFAULT 'REGISTERED',
  
  -- Token para formulário público
  token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Webhook
  webhook_sent_at TIMESTAMPTZ,
  webhook_last_status INTEGER,
  webhook_error TEXT,
  
  -- Check-in
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  
  -- Agendamento
  scheduled_date DATE,
  scheduled_time TIME,
  scheduled_by UUID,
  confirmed_at TIMESTAMPTZ,
  rescheduled_date DATE,
  rescheduled_at TIMESTAMPTZ,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.7 Tabela: `office_visit_forms` (Formulários de Visita)

```sql
CREATE TABLE office_visit_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL UNIQUE REFERENCES office_visits(id),
  endereco TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  aceita_reuniao BOOLEAN DEFAULT true,
  continua_projeto BOOLEAN DEFAULT true,
  instagram TEXT,
  facebook TEXT,
  observacoes TEXT,
  tema_id UUID REFERENCES temas(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.8 Tabela: `surveys` (Pesquisas)

```sql
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  status TEXT DEFAULT 'draft',      -- 'draft', 'active', 'closed'
  data_inicio DATE,
  data_fim DATE,
  total_respostas INTEGER DEFAULT 0,
  cover_url TEXT,
  logo_url TEXT,
  config JSONB DEFAULT '{}',        -- Configurações adicionais
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.9 Tabela: `survey_questions` (Perguntas das Pesquisas)

```sql
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  tipo TEXT NOT NULL,               -- 'texto', 'multipla_escolha', 'escala', 'sim_nao', 'rating'
  pergunta TEXT NOT NULL,
  opcoes JSONB,                     -- Array de opções para múltipla escolha
  obrigatoria BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.10 Tabela: `survey_responses` (Respostas das Pesquisas)

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  contact_id UUID REFERENCES office_contacts(id),
  leader_id UUID REFERENCES lideres(id),
  referred_by_leader_id UUID REFERENCES lideres(id),
  respostas JSONB NOT NULL DEFAULT '{}',
  is_leader BOOLEAN DEFAULT false,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.11 Tabela: `campaigns` (Campanhas de Marketing)

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  utm_source TEXT NOT NULL,
  utm_medium TEXT,
  utm_campaign TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  total_cadastros INTEGER DEFAULT 0,
  event_id UUID REFERENCES events(id),
  event_slug TEXT,
  funnel_id UUID REFERENCES lead_funnels(id),
  funnel_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.12 Tabela: `lead_funnels` (Funis de Captação)

```sql
CREATE TABLE lead_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  descricao TEXT,
  
  -- Lead Magnet
  lead_magnet_nome TEXT NOT NULL,
  lead_magnet_url TEXT NOT NULL,
  
  -- Campos do formulário
  campos_form JSONB DEFAULT '["nome", "telefone", "email"]',
  
  -- Customização visual
  logo_url TEXT,
  cover_url TEXT,
  cor_botao TEXT,
  texto_botao TEXT DEFAULT 'Baixar Agora',
  
  -- Página de obrigado
  obrigado_titulo TEXT DEFAULT 'Obrigado!',
  obrigado_subtitulo TEXT,
  obrigado_texto_botao TEXT DEFAULT 'Baixar Material',
  cta_adicional_texto TEXT,
  cta_adicional_url TEXT,
  
  -- Contadores
  views_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.13 Tabela: `whatsapp_messages` (Histórico WhatsApp)

```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL,          -- 'outgoing', 'incoming'
  status TEXT DEFAULT 'pending',    -- 'pending', 'sent', 'delivered', 'read', 'failed'
  message_id TEXT,                  -- ID retornado pelo Z-API
  visit_id UUID REFERENCES office_visits(id),
  contact_id UUID REFERENCES office_contacts(id),
  leader_id UUID REFERENCES lideres(id),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.14 Tabela: `sms_messages` (Histórico SMS)

```sql
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,            -- Max 160 caracteres
  direction TEXT DEFAULT 'outgoing',
  status TEXT DEFAULT 'pending',    -- 'pending', 'sent', 'delivered', 'failed'
  message_id TEXT,                  -- ID do provedor
  contact_id UUID REFERENCES office_contacts(id),
  provider TEXT DEFAULT 'smsdev',   -- 'smsdev', 'smsbarato', 'disparopro'
  error_message TEXT,
  
  -- Retry automático
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 6,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  retry_history JSONB DEFAULT '[]',
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.15 Tabela: `email_logs` (Histórico Email)

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',    -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed'
  resend_id TEXT,                   -- ID retornado pelo Resend
  template_id UUID REFERENCES email_templates(id),
  contact_id UUID REFERENCES office_contacts(id),
  leader_id UUID REFERENCES lideres(id),
  event_id UUID REFERENCES events(id),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.16 Tabela: `whatsapp_templates` (Templates WhatsApp)

```sql
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  categoria TEXT NOT NULL,          -- 'verificacao', 'evento', 'lideranca', 'captacao', 'visita', 'optout'
  variaveis JSONB DEFAULT '[]',     -- Ex: ["nome", "codigo", "link"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.17 Tabela: `sms_templates` (Templates SMS)

```sql
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,           -- Max 160 caracteres
  categoria TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.18 Tabela: `email_templates` (Templates Email)

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  conteudo_html TEXT NOT NULL,
  categoria TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.19 Tabela: `integrations_settings` (Configurações de Integrações)

```sql
CREATE TABLE integrations_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Z-API (WhatsApp)
  zapi_enabled BOOLEAN DEFAULT false,
  zapi_instance_id TEXT,
  zapi_token TEXT,
  zapi_client_token TEXT,
  
  -- Resend (Email)
  resend_enabled BOOLEAN DEFAULT false,
  resend_api_key TEXT,
  resend_from_email TEXT,
  resend_from_name TEXT,
  
  -- SMSDEV
  smsdev_enabled BOOLEAN DEFAULT false,
  smsdev_api_key TEXT,
  
  -- SMSBarato
  smsbarato_enabled BOOLEAN DEFAULT false,
  smsbarato_api_key TEXT,
  
  -- Disparopro
  disparopro_enabled BOOLEAN DEFAULT false,
  disparopro_token TEXT,
  
  -- Provedor SMS ativo
  sms_active_provider TEXT DEFAULT 'smsdev',  -- 'smsdev', 'smsbarato', 'disparopro'
  
  -- PassKit (Cartão Digital)
  passkit_enabled BOOLEAN DEFAULT false,
  passkit_api_token TEXT,
  passkit_api_base_url TEXT DEFAULT 'https://api.pub1.passkit.io',
  passkit_program_id TEXT,
  passkit_tier_id TEXT,
  
  -- Mensagens automáticas WhatsApp (toggles por categoria)
  wa_auto_verificacao_enabled BOOLEAN DEFAULT true,
  wa_auto_captacao_enabled BOOLEAN DEFAULT true,
  wa_auto_pesquisa_enabled BOOLEAN DEFAULT true,
  wa_auto_evento_enabled BOOLEAN DEFAULT true,
  wa_auto_lideranca_enabled BOOLEAN DEFAULT true,
  wa_auto_membro_enabled BOOLEAN DEFAULT true,
  wa_auto_visita_enabled BOOLEAN DEFAULT true,
  wa_auto_optout_enabled BOOLEAN DEFAULT true,
  wa_auto_sms_fallback_enabled BOOLEAN DEFAULT false,
  
  -- Material por região
  region_material_default_delay_minutes INTEGER DEFAULT 60,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.20 Tabela: `user_roles` (Roles dos Usuários)

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);
```

#### 3.2.21 Tabela: `profiles` (Perfis de Usuário)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  telefone TEXT,
  role TEXT,                        -- Legacy, usar user_roles
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.22 Tabela: `active_sessions` (Sessões Ativas)

```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_info TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  is_current BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  force_logout_at TIMESTAMPTZ,
  force_logout_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.23 Tabela: `scheduled_messages` (Mensagens Agendadas)

```sql
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL,       -- 'whatsapp', 'sms', 'email'
  recipient_phone TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  template_slug TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',    -- 'pending', 'sent', 'failed', 'cancelled'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  contact_id UUID REFERENCES office_contacts(id),
  leader_id UUID REFERENCES lideres(id),
  batch_id UUID,                    -- Para envios em lote
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.24 Tabela: `support_tickets` (Tickets de Suporte)

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  prioridade TEXT DEFAULT 'media',  -- 'baixa', 'media', 'alta', 'urgente'
  status TEXT DEFAULT 'aberto',     -- 'aberto', 'em_andamento', 'resolvido', 'fechado'
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.2.25 Tabela: `organization` (Dados da Organização)

```sql
CREATE TABLE organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT 'Organização',
  nome_plataforma TEXT DEFAULT 'Minha Plataforma',
  cargo TEXT,
  partido TEXT,
  estado TEXT,
  cidade TEXT,
  bio TEXT,
  logo_url TEXT,
  website TEXT,
  email_contato TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  twitter TEXT,
  youtube TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Tabelas Auxiliares

#### `office_settings` (Configurações do Gabinete)
```sql
CREATE TABLE office_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_prefix TEXT DEFAULT 'GAB',
  sound_notification_url TEXT,
  webhook_url TEXT,
  pontos_form_submitted INTEGER DEFAULT 5,
  pontos_aceita_reuniao INTEGER DEFAULT 10,
  
  -- Níveis de gamificação
  nivel_bronze_min INTEGER DEFAULT 0,
  nivel_bronze_max INTEGER DEFAULT 10,
  nivel_prata_min INTEGER DEFAULT 11,
  nivel_prata_max INTEGER DEFAULT 30,
  nivel_ouro_min INTEGER DEFAULT 31,
  nivel_ouro_max INTEGER DEFAULT 50,
  nivel_diamante_min INTEGER DEFAULT 51,
  
  limite_eventos_dia INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `temas` (Temas de Interesse)
```sql
CREATE TABLE temas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `whatsapp_chatbot_config` (Configuração do Chatbot)
```sql
CREATE TABLE whatsapp_chatbot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT true,
  use_ai_for_unknown BOOLEAN DEFAULT true,
  welcome_message TEXT,
  fallback_message TEXT,
  ai_system_prompt TEXT,
  max_messages_per_hour INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `whatsapp_chatbot_keywords` (Keywords do Chatbot)
```sql
CREATE TABLE whatsapp_chatbot_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  response_type TEXT NOT NULL,      -- 'static', 'dynamic', 'ai'
  static_response TEXT,
  dynamic_function TEXT,            -- Nome da função dinâmica
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `region_materials` (Materiais por Região)
```sql
CREATE TABLE region_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES office_cities(id),
  material_name TEXT NOT NULL,
  material_url TEXT NOT NULL,
  sms_template_slug TEXT DEFAULT 'material-regiao-sms',
  delay_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. FUNÇÕES RPC PRINCIPAIS (60+)

### 4.1 Hierarquia de Líderes

#### `get_leader_tree` - Árvore Completa de um Líder
```sql
CREATE OR REPLACE FUNCTION get_leader_tree(_leader_id UUID)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  telefone TEXT,
  email TEXT,
  cidade_nome TEXT,
  hierarchy_level INTEGER,
  is_coordinator BOOLEAN,
  parent_leader_id UUID,
  cadastros INTEGER,
  pontuacao_total INTEGER,
  is_verified BOOLEAN,
  depth INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE tree AS (
    -- Âncora: o líder raiz
    SELECT 
      l.id,
      l.nome_completo,
      l.telefone,
      l.email,
      c.nome as cidade_nome,
      l.hierarchy_level,
      l.is_coordinator,
      l.parent_leader_id,
      l.cadastros,
      l.pontuacao_total,
      l.is_verified,
      0 as depth
    FROM lideres l
    LEFT JOIN office_cities c ON l.cidade_id = c.id
    WHERE l.id = _leader_id AND l.is_active = true
    
    UNION ALL
    
    -- Recursão: subordinados
    SELECT 
      l.id,
      l.nome_completo,
      l.telefone,
      l.email,
      c.nome,
      l.hierarchy_level,
      l.is_coordinator,
      l.parent_leader_id,
      l.cadastros,
      l.pontuacao_total,
      l.is_verified,
      t.depth + 1
    FROM lideres l
    INNER JOIN tree t ON l.parent_leader_id = t.id
    LEFT JOIN office_cities c ON l.cidade_id = c.id
    WHERE l.is_active = true
  )
  SELECT * FROM tree ORDER BY depth, nome_completo;
END;
$$;
```

#### `get_leader_hierarchy_path` - Caminho até o Coordenador
```sql
CREATE OR REPLACE FUNCTION get_leader_hierarchy_path(_leader_id UUID)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  hierarchy_level INTEGER,
  is_coordinator BOOLEAN,
  parent_leader_id UUID,
  cidade_nome TEXT,
  telefone TEXT,
  email TEXT,
  depth INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE path AS (
    SELECT 
      l.id,
      l.nome_completo,
      l.hierarchy_level,
      l.is_coordinator,
      l.parent_leader_id,
      c.nome as cidade_nome,
      l.telefone,
      l.email,
      0 as depth
    FROM lideres l
    LEFT JOIN office_cities c ON l.cidade_id = c.id
    WHERE l.id = _leader_id
    
    UNION ALL
    
    SELECT 
      l.id,
      l.nome_completo,
      l.hierarchy_level,
      l.is_coordinator,
      l.parent_leader_id,
      c.nome,
      l.telefone,
      l.email,
      p.depth + 1
    FROM lideres l
    INNER JOIN path p ON l.id = p.parent_leader_id
    LEFT JOIN office_cities c ON l.cidade_id = c.id
  )
  SELECT * FROM path ORDER BY depth DESC;
END;
$$;
```

#### `move_leader_branch` - Mover Líder e Subordinados
```sql
CREATE OR REPLACE FUNCTION move_leader_branch(
  _leader_id UUID,
  _new_parent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _new_level INTEGER;
BEGIN
  -- Validar que novo pai existe e está ativo
  IF NOT EXISTS (SELECT 1 FROM lideres WHERE id = _new_parent_id AND is_active = true) THEN
    RAISE EXCEPTION 'Novo líder superior não encontrado ou inativo';
  END IF;
  
  -- Calcular novo nível
  SELECT COALESCE(hierarchy_level, 1) + 1 INTO _new_level
  FROM lideres WHERE id = _new_parent_id;
  
  -- Limite de 4 níveis
  IF _new_level > 4 THEN
    RAISE EXCEPTION 'Limite de hierarquia excedido (máximo 4 níveis)';
  END IF;
  
  -- Atualizar líder
  UPDATE lideres
  SET 
    parent_leader_id = _new_parent_id,
    hierarchy_level = _new_level,
    is_coordinator = false,
    updated_at = now()
  WHERE id = _leader_id;
  
  -- Recalcular níveis dos subordinados recursivamente
  WITH RECURSIVE update_tree AS (
    SELECT id, _new_level as parent_level
    FROM lideres WHERE id = _leader_id
    
    UNION ALL
    
    SELECT l.id, u.parent_level + 1
    FROM lideres l
    INNER JOIN update_tree u ON l.parent_leader_id = u.id
    WHERE l.is_active = true
  )
  UPDATE lideres l
  SET hierarchy_level = (SELECT parent_level + 1 FROM update_tree u WHERE u.id = l.parent_leader_id)
  WHERE l.id IN (SELECT id FROM update_tree WHERE id != _leader_id);
  
  RETURN true;
END;
$$;
```

#### `promote_to_coordinator` - Promover a Coordenador
```sql
CREATE OR REPLACE FUNCTION promote_to_coordinator(_leader_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE lideres
  SET 
    is_coordinator = true,
    hierarchy_level = 1,
    parent_leader_id = NULL,
    updated_at = now()
  WHERE id = _leader_id AND is_active = true;
  
  -- Atualizar subordinados diretos para nível 2
  UPDATE lideres
  SET hierarchy_level = 2
  WHERE parent_leader_id = _leader_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;
```

### 4.2 Estatísticas e Rankings

#### `get_leader_tree_stats` - Estatísticas da Árvore
```sql
CREATE OR REPLACE FUNCTION get_leader_tree_stats(_leader_id UUID)
RETURNS TABLE (
  total_leaders INTEGER,
  total_cadastros INTEGER,
  total_pontos INTEGER,
  direct_subordinates INTEGER,
  top_subordinate_name TEXT,
  top_subordinate_cadastros INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH tree AS (
    SELECT * FROM get_leader_tree(_leader_id)
  ),
  stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_leaders,
      COALESCE(SUM(cadastros), 0)::INTEGER as total_cadastros,
      COALESCE(SUM(pontuacao_total), 0)::INTEGER as total_pontos
    FROM tree
  ),
  direct AS (
    SELECT COUNT(*)::INTEGER as direct_subordinates
    FROM lideres
    WHERE parent_leader_id = _leader_id AND is_active = true
  ),
  top_sub AS (
    SELECT nome_completo, cadastros
    FROM lideres
    WHERE parent_leader_id = _leader_id AND is_active = true
    ORDER BY cadastros DESC
    LIMIT 1
  )
  SELECT 
    s.total_leaders,
    s.total_cadastros,
    s.total_pontos,
    d.direct_subordinates,
    t.nome_completo,
    t.cadastros
  FROM stats s, direct d
  LEFT JOIN top_sub t ON true;
END;
$$;
```

#### `get_leader_ranking_position` - Posição no Ranking
```sql
CREATE OR REPLACE FUNCTION get_leader_ranking_position(_leader_id UUID)
RETURNS TABLE (
  ranking_position INTEGER,
  total_leaders INTEGER,
  pontuacao INTEGER,
  percentile NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      id,
      pontuacao_total,
      ROW_NUMBER() OVER (ORDER BY pontuacao_total DESC) as pos
    FROM lideres
    WHERE is_active = true
  ),
  total AS (
    SELECT COUNT(*)::INTEGER as cnt FROM lideres WHERE is_active = true
  )
  SELECT 
    r.pos::INTEGER,
    t.cnt,
    r.pontuacao_total,
    (1 - (r.pos::NUMERIC / t.cnt)) * 100
  FROM ranked r, total t
  WHERE r.id = _leader_id;
END;
$$;
```

#### `get_leaders_ranking_paginated` - Ranking Paginado
```sql
CREATE OR REPLACE FUNCTION get_leaders_ranking_paginated(
  _page INTEGER DEFAULT 1,
  _page_size INTEGER DEFAULT 20,
  _search TEXT DEFAULT NULL,
  _cidade_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  telefone TEXT,
  cidade_nome TEXT,
  pontuacao_total INTEGER,
  cadastros INTEGER,
  is_coordinator BOOLEAN,
  ranking_position BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  _offset INTEGER := (_page - 1) * _page_size;
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      l.id,
      l.nome_completo,
      l.telefone,
      c.nome as cidade_nome,
      l.pontuacao_total,
      l.cadastros,
      l.is_coordinator,
      ROW_NUMBER() OVER (ORDER BY l.pontuacao_total DESC, l.cadastros DESC) as pos,
      COUNT(*) OVER () as total
    FROM lideres l
    LEFT JOIN office_cities c ON l.cidade_id = c.id
    WHERE l.is_active = true
      AND (_search IS NULL OR l.nome_completo ILIKE '%' || _search || '%')
      AND (_cidade_id IS NULL OR l.cidade_id = _cidade_id)
  )
  SELECT 
    r.id,
    r.nome_completo,
    r.telefone,
    r.cidade_nome,
    r.pontuacao_total,
    r.cadastros,
    r.is_coordinator,
    r.pos,
    r.total
  FROM ranked r
  ORDER BY r.pos
  LIMIT _page_size
  OFFSET _offset;
END;
$$;
```

### 4.3 Registros e Verificação

#### `create_event_registration` - Inscrição em Evento
```sql
CREATE OR REPLACE FUNCTION create_event_registration(
  _event_id UUID,
  _nome TEXT,
  _email TEXT,
  _whatsapp TEXT,
  _cidade_id UUID,
  _endereco TEXT DEFAULT NULL,
  _data_nascimento DATE DEFAULT NULL,
  _leader_token TEXT DEFAULT NULL,
  _utm_source TEXT DEFAULT NULL,
  _utm_medium TEXT DEFAULT NULL,
  _utm_campaign TEXT DEFAULT NULL,
  _utm_content TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _contact_id UUID;
  _leader_id UUID;
  _registration_id UUID;
  _qr_code TEXT;
  _phone_norm TEXT;
BEGIN
  -- Normalizar telefone
  _phone_norm := regexp_replace(_whatsapp, '[^0-9]', '', 'g');
  IF LEFT(_phone_norm, 2) != '55' THEN
    _phone_norm := '55' || _phone_norm;
  END IF;
  _phone_norm := '+' || _phone_norm;
  
  -- Buscar líder pelo token
  IF _leader_token IS NOT NULL THEN
    SELECT id INTO _leader_id
    FROM lideres
    WHERE affiliate_token = _leader_token AND is_active = true;
  END IF;
  
  -- Upsert contato
  INSERT INTO office_contacts (nome, telefone_norm, email, cidade_id, endereco, data_nascimento, source_type, source_id, utm_source, utm_medium, utm_campaign, utm_content)
  VALUES (_nome, _phone_norm, _email, _cidade_id, _endereco, _data_nascimento, 'evento', _event_id::TEXT, _utm_source, _utm_medium, _utm_campaign, _utm_content)
  ON CONFLICT (telefone_norm) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    endereco = COALESCE(EXCLUDED.endereco, office_contacts.endereco),
    data_nascimento = COALESCE(EXCLUDED.data_nascimento, office_contacts.data_nascimento),
    updated_at = now()
  RETURNING id INTO _contact_id;
  
  -- Gerar QR Code único
  _qr_code := encode(gen_random_bytes(8), 'hex');
  
  -- Criar inscrição
  INSERT INTO event_registrations (
    event_id, contact_id, leader_id, cidade_id, nome, email, whatsapp, 
    endereco, data_nascimento, qr_code, utm_source, utm_medium, utm_campaign, utm_content
  )
  VALUES (
    _event_id, _contact_id, _leader_id, _cidade_id, _nome, _email, _phone_norm,
    _endereco, _data_nascimento, _qr_code, _utm_source, _utm_medium, _utm_campaign, _utm_content
  )
  RETURNING id INTO _registration_id;
  
  -- Incrementar contador do evento
  UPDATE events SET registrations_count = COALESCE(registrations_count, 0) + 1
  WHERE id = _event_id;
  
  -- Se indicado por líder, incrementar cadastros
  IF _leader_id IS NOT NULL THEN
    PERFORM increment_leader_cadastros(_leader_id);
  END IF;
  
  RETURN _registration_id;
END;
$$;
```

#### `verify_leader_by_code` - Verificar Líder por Código
```sql
CREATE OR REPLACE FUNCTION verify_leader_by_code(_code TEXT)
RETURNS TABLE (
  success BOOLEAN,
  leader_id UUID,
  nome_completo TEXT,
  affiliate_token TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _leader RECORD;
BEGIN
  -- Buscar líder pelo código
  SELECT id, nome_completo, affiliate_token, is_verified
  INTO _leader
  FROM lideres
  WHERE verification_code = UPPER(_code)
  LIMIT 1;
  
  IF _leader IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Código não encontrado';
    RETURN;
  END IF;
  
  IF _leader.is_verified THEN
    RETURN QUERY SELECT true, _leader.id, _leader.nome_completo, _leader.affiliate_token, 'Líder já verificado';
    RETURN;
  END IF;
  
  -- Marcar como verificado
  UPDATE lideres
  SET 
    is_verified = true,
    verified_at = now(),
    verification_method = 'link'
  WHERE id = _leader.id;
  
  RETURN QUERY SELECT true, _leader.id, _leader.nome_completo, _leader.affiliate_token, 'Verificação concluída com sucesso';
END;
$$;
```

### 4.4 Check-in

#### `checkin_event_by_qr` - Check-in por QR Code
```sql
CREATE OR REPLACE FUNCTION checkin_event_by_qr(_qr_code TEXT)
RETURNS TABLE (
  success BOOLEAN,
  registration_id UUID,
  nome TEXT,
  event_name TEXT,
  already_checked_in BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _reg RECORD;
BEGIN
  -- Buscar inscrição
  SELECT r.id, r.nome, r.checked_in, e.name as event_name
  INTO _reg
  FROM event_registrations r
  INNER JOIN events e ON r.event_id = e.id
  WHERE r.qr_code = _qr_code;
  
  IF _reg IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, false, 'QR Code não encontrado';
    RETURN;
  END IF;
  
  IF _reg.checked_in THEN
    RETURN QUERY SELECT true, _reg.id, _reg.nome, _reg.event_name, true, 'Participante já fez check-in';
    RETURN;
  END IF;
  
  -- Realizar check-in
  UPDATE event_registrations
  SET checked_in = true, checked_in_at = now()
  WHERE id = _reg.id;
  
  -- Incrementar contador do evento
  UPDATE events 
  SET checkedin_count = COALESCE(checkedin_count, 0) + 1
  WHERE id = (SELECT event_id FROM event_registrations WHERE id = _reg.id);
  
  RETURN QUERY SELECT true, _reg.id, _reg.nome, _reg.event_name, false, 'Check-in realizado com sucesso';
END;
$$;
```

#### `validate_checkin_pin` - Validar PIN de Check-in
```sql
CREATE OR REPLACE FUNCTION validate_checkin_pin(_event_id UUID, _pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE id = _event_id AND checkin_pin = _pin
  );
END;
$$;
```

### 4.5 Gamificação

#### `award_leader_points` - Conceder Pontos
```sql
CREATE OR REPLACE FUNCTION award_leader_points(
  _leader_id UUID,
  _points INTEGER,
  _reason TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _new_total INTEGER;
BEGIN
  UPDATE lideres
  SET 
    pontuacao_total = pontuacao_total + _points,
    last_activity = now(),
    updated_at = now()
  WHERE id = _leader_id
  RETURNING pontuacao_total INTO _new_total;
  
  RETURN _new_total;
END;
$$;
```

#### `increment_leader_cadastros` - Incrementar Cadastros
```sql
CREATE OR REPLACE FUNCTION increment_leader_cadastros(_leader_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _new_count INTEGER;
BEGIN
  UPDATE lideres
  SET 
    cadastros = cadastros + 1,
    last_activity = now(),
    updated_at = now()
  WHERE id = _leader_id
  RETURNING cadastros INTO _new_count;
  
  -- Conceder pontos pelo cadastro
  PERFORM award_leader_points(_leader_id, 5, 'Cadastro de contato');
  
  RETURN _new_count;
END;
$$;
```

---

## 5. EDGE FUNCTIONS (42 Funções)

### 5.1 Comunicação

#### `send-whatsapp` - Envio de WhatsApp via Z-API

**Arquivo**: `supabase/functions/send-whatsapp/index.ts`

**Input**:
```typescript
interface SendWhatsAppRequest {
  phone: string;           // Telefone no formato BR ou E.164
  message?: string;        // Mensagem direta
  templateSlug?: string;   // Slug do template
  variables?: Record<string, string>;  // Variáveis do template
  visitId?: string;        // ID da visita (opcional)
  contactId?: string;      // ID do contato (opcional)
  imageUrl?: string;       // URL da imagem (opcional)
}
```

**Output**:
```typescript
{
  success: boolean;
  data?: {
    zapiMessageId: string;
    // ...dados do Z-API
  };
  messageRecordId?: string;
  error?: string;
}
```

**Fluxo**:
1. Verifica autenticação (pula para templates públicos)
2. Busca configurações do Z-API em `integrations_settings`
3. Verifica se categoria do template está habilitada
4. Se `templateSlug`, busca template e substitui variáveis
5. Para templates anti-spam, gera variação com IA
6. Cria registro em `whatsapp_messages` com status "pending"
7. Envia para Z-API (`send-text`)
8. Atualiza status para "sent" ou "failed"
9. Se `imageUrl`, envia imagem após 2s

**Templates Públicos** (sem autenticação):
```typescript
const PUBLIC_TEMPLATES = [
  'evento-inscricao-confirmada',
  'captacao-boas-vindas',
  'lider-cadastro-confirmado',
  'visita-link-formulario',
  'verificacao-cadastro',
  'verificacao-codigo',
  'membro-cadastro-boas-vindas',
  'lideranca-cadastro-link',
  'verificacao-sms-fallback',
  'link-indicacao-sms-fallback',
];
```

**Mapeamento Template → Configuração**:
```typescript
const TEMPLATE_SETTINGS_MAP = {
  'verificacao-cadastro': 'wa_auto_verificacao_enabled',
  'verificacao-codigo': 'wa_auto_verificacao_enabled',
  'captacao-boas-vindas': 'wa_auto_captacao_enabled',
  'pesquisa-agradecimento': 'wa_auto_pesquisa_enabled',
  'evento-inscricao-confirmada': 'wa_auto_evento_enabled',
  'lideranca-cadastro-link': 'wa_auto_lideranca_enabled',
  'lider-cadastro-confirmado': 'wa_auto_lideranca_enabled',
  'membro-cadastro-boas-vindas': 'wa_auto_membro_enabled',
  'visita-link-formulario': 'wa_auto_visita_enabled',
  'descadastro-confirmado': 'wa_auto_optout_enabled',
  'recadastro-confirmado': 'wa_auto_optout_enabled',
  'verificacao-sms-fallback': 'wa_auto_sms_fallback_enabled',
};
```

---

#### `send-sms` - Envio de SMS Multiprovedores

**Arquivo**: `supabase/functions/send-sms/index.ts`

**Input**:
```typescript
interface SendSMSRequest {
  phone: string;
  message?: string;
  templateSlug?: string;
  variables?: Record<string, string>;
  contactId?: string;
  leaderId?: string;
}
```

**Fluxo**:
1. Busca configurações e provedor ativo em `integrations_settings`
2. Valida configuração do provedor
3. Se `templateSlug`, busca template e substitui variáveis
4. Trunca mensagem para 160 caracteres
5. Cria registro em `sms_messages` com status "pending"
6. Envia via provedor ativo:
   - **SMSDEV**: `https://api.smsdev.com.br/v1/send?key=...`
   - **SMSBarato**: `https://sistema81.smsbarato.com.br/send?chave=...`
   - **Disparopro**: POST `https://apihttp.disparopro.com.br:8433/mt`
7. Atualiza status para "sent" ou "failed"
8. Se falhar, configura retry com backoff exponencial

**Normalização de Telefone**:
```typescript
function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("55") && clean.length > 11) {
    clean = clean.substring(2);
  }
  // Se 10 dígitos e DF, adiciona 9
  if (clean.length === 10 && clean.startsWith("61")) {
    clean = "61" + "9" + clean.substring(2);
  }
  return clean;
}
```

---

#### `zapi-webhook` - Webhook do Z-API

**Arquivo**: `supabase/functions/zapi-webhook/index.ts`

**Tipos de Webhook**:
1. `MessageStatusCallback` - Atualização de status de mensagem
2. `ReceivedCallback` - Mensagem recebida
3. `ConnectedCallback` / `DisconnectedCallback` - Status da conexão

**Fluxo para Mensagem Recebida**:
```
1. Recebe payload do Z-API
2. Detecta tipo do webhook
3. Se mensagem recebida:
   a. Extrai phone e message
   b. Normaliza telefone
   c. Busca contato por telefone_norm
   d. Verifica comandos de opt-out (SAIR, PARAR, CANCELAR, etc)
   e. Verifica comando VOLTAR (re-subscribe)
   f. Verifica se é código de verificação (regex ^[A-Z0-9]{5,6}$)
   g. Se código encontrado em office_contacts ou lideres:
      - Marca is_verified = true
      - Envia confirmação
      - Envia mensagens pendentes
   h. Se não é código, verifica se remetente é líder
   i. Se é líder, chama whatsapp-chatbot
   j. Salva mensagem em whatsapp_messages
```

**Comandos de Opt-out**:
```typescript
const optOutCommands = ["SAIR", "PARAR", "CANCELAR", "DESCADASTRAR", "STOP", "UNSUBSCRIBE"];
```

---

#### `whatsapp-chatbot` - Chatbot para Líderes

**Arquivo**: `supabase/functions/whatsapp-chatbot/index.ts`

**Input**:
```typescript
interface ChatbotRequest {
  phone: string;
  message: string;
  messageId?: string;
}
```

**Fluxo**:
```
1. Verifica se chatbot está habilitado (whatsapp_chatbot_config)
2. Busca líder pelo telefone
3. Verifica rate limit (max_messages_per_hour)
4. Busca keywords ativas (whatsapp_chatbot_keywords)
5. Normaliza mensagem (uppercase, remove acentos)
6. Busca match com keywords ou aliases
7. Se match encontrado:
   - static: substitui variáveis e retorna resposta fixa
   - dynamic: executa função dinâmica
   - ai: gera resposta com IA
8. Se não encontrado e use_ai_for_unknown:
   - Gera resposta com IA
9. Senão:
   - Retorna fallback_message
10. Envia resposta via Z-API
11. Registra em whatsapp_chatbot_logs
```

**Funções Dinâmicas**:
```typescript
const dynamicFunctions = {
  minha_arvore: async (supabase, leader) => { /* Estatísticas da árvore */ },
  meus_cadastros: async (supabase, leader) => { /* Lista cadastros */ },
  minha_pontuacao: async (supabase, leader) => { /* Pontuação e nível */ },
  minha_posicao: async (supabase, leader) => { /* Posição no ranking */ },
  meus_subordinados: async (supabase, leader) => { /* Lista subordinados */ },
  pendentes: async (supabase, leader) => { /* Subordinados não verificados */ },
  ajuda: async (supabase, leader) => { /* Lista de comandos */ },
};
```

**Keywords Padrão**:
| Keyword | Aliases | Tipo | Função |
|---------|---------|------|--------|
| ARVORE | ÁRVORE, REDE, TREE | dynamic | minha_arvore |
| CADASTROS | INDICAÇÕES, INDICACOES | dynamic | meus_cadastros |
| PONTOS | PONTUAÇÃO, PONTUACAO, SCORE | dynamic | minha_pontuacao |
| RANKING | POSIÇÃO, POSICAO | dynamic | minha_posicao |
| SUBORDINADOS | EQUIPE, TIME | dynamic | meus_subordinados |
| PENDENTES | NÃO VERIFICADOS | dynamic | pendentes |
| AJUDA | HELP, COMANDOS | dynamic | ajuda |

---

### 5.2 Integrações Externas

#### `create-leader-pass` - Criar Cartão Digital PassKit

**Fluxo**:
1. Busca líder por ID
2. Busca configurações PassKit em `integrations_settings`
3. Prepara dados do membro:
   - externalId: leader.id
   - firstName, lastName
   - email, phone
   - points: pontuacao_total
4. Se líder já tem passkit_member_id, atualiza
5. Senão, cria novo membro via PassKit API
6. Atualiza líder com passkit_member_id
7. Retorna URL de instalação do cartão

#### `passkit-webhook` - Webhook do PassKit

**Eventos**:
- `install`: Cartão instalado → `passkit_pass_installed = true`
- `uninstall`: Cartão removido → `passkit_pass_installed = false`

---

### 5.3 Processos Automatizados

#### `process-scheduled-messages` - Processar Mensagens Agendadas

**Frequência**: Cron a cada minuto

**Fluxo**:
1. Busca mensagens em `scheduled_messages` com:
   - status = 'pending'
   - scheduled_for <= now()
2. Para cada mensagem:
   a. Chama função de envio apropriada (WhatsApp/SMS/Email)
   b. Atualiza status para 'sent' ou 'failed'
   c. Registra sent_at e error_message

#### `process-sms-fallback` - Fallback SMS → WhatsApp

**Fluxo**:
1. Busca SMS com status 'failed' e retry_count >= max_retries
2. Se `wa_auto_sms_fallback_enabled`:
   - Reenvia como WhatsApp via template 'verificacao-sms-fallback'

#### `retry-failed-sms` - Retry Automático de SMS

**Frequência**: Cron a cada 5 minutos

**Backoff Exponencial**:
```typescript
const delays = [1, 5, 15, 30, 60, 120]; // minutos
next_retry_at = now + delays[retry_count] * 60 * 1000;
```

---

## 6. FLUXOS DE NEGÓCIO

### 6.1 Cadastro de Líder via Link de Afiliado

```
ROTA: /affiliate/:leaderToken

1. Pessoa acessa URL com token do líder indicador
2. Frontend busca líder pelo affiliate_token
3. Se não encontrado, exibe erro
4. Pessoa preenche formulário:
   - Nome completo
   - Telefone (WhatsApp)
   - Email (opcional)
   - Cidade
   - Data de nascimento (opcional)

5. Frontend chama RPC register_leader_from_affiliate:
   a. Normaliza telefone para formato E.164
   b. Verifica se já existe líder com mesmo telefone/email
   c. Se existe e pertence a outro indicador: erro
   d. Se existe e não verificado: reenviar código
   e. Se novo:
      - Cria líder com parent_leader_id = indicador
      - hierarchy_level = parent.hierarchy_level + 1
      - Gera verification_code (5 caracteres alfanuméricos)
      - Gera affiliate_token único
   f. Incrementa cadastros do indicador
   g. Concede pontos ao indicador

6. Edge Function send-whatsapp envia template 'verificacao-codigo':
   "Olá {{nome}}! 👋
   
   Seu código de verificação é: *{{codigo}}*
   
   Responda com o código para ativar sua liderança."

7. Pessoa responde no WhatsApp com o código

8. zapi-webhook recebe mensagem:
   a. Detecta código (regex ^[A-Z0-9]{5,6}$)
   b. Busca em lideres.verification_code
   c. Se encontrado e não verificado:
      - Marca is_verified = true
      - verification_method = 'whatsapp'
      - verified_at = now()
   d. Envia confirmação com link de indicação:
      "Parabéns {{nome}}! ✅
      
      Você agora faz parte da nossa rede de lideranças!
      
      Seu link de indicação:
      {{link_indicacao}}
      
      Compartilhe para crescer sua rede! 🚀"
```

### 6.2 Inscrição em Evento

```
ROTA: /eventos/:slug

1. Pessoa acessa URL do evento (com ou sem ?l=token)
2. Frontend busca evento pelo slug
3. Se ?l=token, busca líder indicador
4. Pessoa preenche formulário:
   - Nome
   - Email
   - WhatsApp
   - Cidade
   - Endereço (se configurado)
   - Data de nascimento (se configurado)

5. Frontend chama RPC create_event_registration:
   a. Normaliza telefone
   b. Upsert contato em office_contacts
   c. Cria registro em event_registrations
   d. Gera QR Code único (16 caracteres hex)
   e. Incrementa registrations_count do evento
   f. Se indicado por líder: increment_leader_cadastros

6. Edge Function send-whatsapp envia template 'evento-inscricao-confirmada':
   "Olá {{nome}}! 🎉
   
   Sua inscrição no evento *{{evento_nome}}* foi confirmada!
   
   📅 Data: {{evento_data}}
   📍 Local: {{evento_local}}
   
   [QR Code anexado]"

7. No dia do evento:
   a. Operador acessa /checkin/:qrCode
   b. Digita PIN de 4 dígitos do evento
   c. Sistema valida PIN e QR Code
   d. RPC checkin_event_by_qr marca checked_in = true
   e. Incrementa checkedin_count do evento
```

### 6.3 Sistema de Pontuação (Gamificação)

```
PONTOS (configuráveis em office_settings):
├── Cadastro de contato: +5 pontos
├── Contato aceita reunião: +10 pontos
├── Indicação de novo líder: +10 pontos
└── Participação em evento: +5 pontos

NÍVEIS (configuráveis em office_settings):
├── Bronze 🥉: 0-10 pontos
├── Prata 🥈: 11-30 pontos
├── Ouro 🥇: 31-50 pontos
└── Diamante 💎: 51+ pontos

CÁLCULO DE NÍVEL:
function calcularNivel(pontos: number): string {
  if (pontos >= 51) return "Diamante 💎";
  if (pontos >= 31) return "Ouro 🥇";
  if (pontos >= 11) return "Prata 🥈";
  return "Bronze 🥉";
}
```

### 6.4 Verificação de Contatos/Líderes

```
GERAÇÃO DO CÓDIGO:
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const code = Array(5).fill(0)
  .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
  .join("");
// Exemplo: "A7X9K"

FLUXO DE VERIFICAÇÃO:
1. Código gerado no cadastro (5 caracteres alfanuméricos)
2. Armazenado em verification_code
3. verification_sent_at = now()
4. Enviado via WhatsApp ou SMS

5. Pessoa responde com código:
   - WhatsApp: detectado pelo zapi-webhook
   - Link: /v/:codigo (contatos) ou /verificar-lider/:codigo (líderes)

6. Validação:
   - Limpa formatação: remove *, _, ~, ` (WhatsApp)
   - Converte para uppercase
   - Valida regex: ^[A-Z0-9]{5,6}$

7. Busca:
   - Primeiro em office_contacts.verification_code
   - Se não encontrado, busca em lideres.verification_code

8. Se encontrado e is_verified = false:
   - is_verified = true
   - verified_at = now()
   - verification_method = 'whatsapp' | 'link' | 'manual'

9. Pós-verificação:
   - Envia mensagens de pending_messages (JSONB)
   - Envia confirmação
```

### 6.5 Fluxo de Visita ao Gabinete

```
1. REGISTRO (Atendente):
   - Acessa /office/new
   - Preenche: nome, telefone, cidade, líder indicador
   - Sistema cria visita com status REGISTERED
   - Gera protocolo: GAB-2024-00001
   - Gera token para formulário

2. ENVIO DO LINK:
   - Webhook envia WhatsApp para contato:
     "Olá {{nome}}! Você está na fila do gabinete.
     
     📋 Protocolo: {{protocolo}}
     
     Enquanto aguarda, preencha este formulário:
     {{link_formulario}}"
   - Status → LINK_SENT

3. FORMULÁRIO PÚBLICO (/visita-gabinete/:visitId):
   - Contato abre link
   - Status → FORM_OPENED
   - Preenche: endereço, nascimento, aceita reunião, etc.
   - Status → FORM_SUBMITTED
   - Pontos concedidos ao líder indicador

4. CHECK-IN:
   - Atendente chama contato
   - Escaneia QR ou digita protocolo
   - Status → CHECKED_IN

5. REUNIÃO (opcional):
   - Atendente registra ata
   - Upload de arquivos ou texto
   - Status → MEETING_COMPLETED
```

---

## 7. ROTAS DA APLICAÇÃO

### 7.1 Rotas Públicas (Sem Autenticação)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | Index | Página inicial (redireciona para login) |
| `/login` | Login | Tela de login |
| `/forgot-password` | ForgotPassword | Recuperação de senha |
| `/reset-password` | ResetPassword | Redefinição de senha |
| `/reset-success` | ResetSuccess | Confirmação de reset |
| `/eventos/:slug` | EventRegistration | Inscrição em evento |
| `/captacao/:slug` | LeadCaptureLanding | Página de captura (funil) |
| `/cadastro/:leaderToken` | LeaderRegistrationForm | Cadastro via indicação |
| `/affiliate/:leaderToken` | AffiliateForm | Formulário de afiliado |
| `/lider/cadastro` | PublicLeaderRegistration | Cadastro público de líder |
| `/pesquisa/:slug` | SurveyPublicForm | Resposta de pesquisa |
| `/checkin/:qrCode` | EventCheckin | Check-in de evento (com PIN) |
| `/v/:codigo` | VerifyContact | Verificação de contato |
| `/verificar-lider/:codigo` | VerifyLeader | Verificação de líder |
| `/s/:code` | ShortUrlRedirect | Redirecionador de URLs curtas |
| `/descadastro` | Unsubscribe | Opt-out de comunicações |
| `/visita-gabinete/:visitId` | ScheduleVisit | Formulário de visita |

### 7.2 Rotas Protegidas (Com Autenticação)

| Rota | Roles Permitidas | Componente |
|------|------------------|------------|
| `/dashboard` | super_admin, admin, atendente | Dashboard |
| `/leaders` | super_admin, admin, atendente | Gestão de Lideranças |
| `/leaders/ranking` | super_admin, admin, atendente | Ranking de Líderes |
| `/leaders/tree` | super_admin, admin, atendente | Árvore de Hierarquia |
| `/contacts` | super_admin, admin, atendente | Base de Contatos |
| `/events` | super_admin, admin, atendente, checkin_operator | Gestão de Eventos |
| `/campaigns` | super_admin, admin, atendente | Campanhas |
| `/surveys` | super_admin, admin, atendente | Pesquisas |
| `/surveys/:id/edit` | super_admin, admin, atendente | Editor de Pesquisa |
| `/surveys/:id/results` | super_admin, admin, atendente | Resultados de Pesquisa |
| `/whatsapp` | super_admin, admin, atendente | WhatsApp Marketing |
| `/sms` | super_admin, admin, atendente | SMS Marketing |
| `/email` | super_admin, admin, atendente | Email Marketing |
| `/scheduled` | super_admin, admin, atendente | Mensagens Agendadas |
| `/ai-agent` | super_admin, admin, atendente | Agente de IA |
| `/strategic-map` | super_admin, admin, atendente | Mapa Estratégico |
| `/projects` | super_admin, admin, atendente | Projetos |

### 7.3 Rotas do Módulo Gabinete

| Rota | Roles Permitidas | Componente |
|------|------------------|------------|
| `/office/new` | super_admin, admin, atendente | Nova Visita |
| `/office/queue` | super_admin, admin, atendente | Fila de Atendimento |
| `/office/history` | super_admin, admin, atendente | Histórico |
| `/office/schedule` | super_admin | Agendamento |
| `/office/settings` | super_admin, admin | Configurações |
| `/office/checkin/:qrCode` | Autenticado | Check-in de Visita |

### 7.4 Rotas de Configurações

| Rota | Roles Permitidas | Componente |
|------|------------------|------------|
| `/settings` | Todos autenticados | Menu de Configurações |
| `/settings/profile` | Todos autenticados | Perfil |
| `/settings/privacy` | Todos autenticados | Privacidade |
| `/settings/support` | Todos autenticados | Suporte |
| `/settings/organization` | super_admin, admin | Organização |
| `/settings/team` | super_admin, admin | Equipe |
| `/settings/integrations` | super_admin, admin | Integrações |
| `/settings/tracking` | super_admin, admin | Rastreamento |
| `/settings/ai-providers` | super_admin, admin | Provedores de IA |
| `/settings/gamification` | super_admin, admin | Gamificação |
| `/settings/whatsapp-chatbot` | super_admin, admin | Chatbot |
| `/settings/region-materials` | super_admin, admin | Materiais por Região |
| `/settings/affiliate-form` | super_admin, admin, atendente | Formulário de Afiliado |
| `/settings/leader-form` | super_admin, admin, atendente | Formulário de Líder |
| `/settings/reports` | super_admin, admin, atendente | Relatórios |
| `/settings/admin-tickets` | super_admin | Tickets de Suporte |

---

## 8. INTEGRAÇÕES EXTERNAS

### 8.1 Z-API (WhatsApp)

**Configuração**: `integrations_settings`
- `zapi_instance_id`: ID da instância
- `zapi_token`: Token de API
- `zapi_client_token`: Token do cliente (opcional)
- `zapi_enabled`: boolean

**Endpoints Utilizados**:
```
Base URL: https://api.z-api.io/instances/{instance_id}/token/{token}

POST /send-text
Body: { phone: "5561999999999", message: "Texto" }

POST /send-image
Body: { phone: "5561999999999", image: "https://..." }

GET /status
Response: { connected: true, ... }

GET /qr-code/image
Response: QR Code em base64
```

**Headers**:
```
Content-Type: application/json
Client-Token: {zapi_client_token}  // Opcional
```

**Webhook**: Edge Function `zapi-webhook`
- URL: `https://{project}.supabase.co/functions/v1/zapi-webhook`
- Eventos: MessageStatusCallback, ReceivedCallback, ConnectedCallback

### 8.2 Provedores SMS

**SMSDEV**:
```
Endpoint: https://api.smsdev.com.br/v1/send
Params: key={api_key}&type=9&number={phone}&msg={message}
Response: { situacao: "OK", id: "123", descricao: "Enviada" }
```

**SMSBarato**:
```
Endpoint: https://sistema81.smsbarato.com.br/send
Params: chave={api_key}&dest={phone}&text={message}
Response: "123" (ID do lote) ou código de erro
```

**Disparopro**:
```
Endpoint: https://apihttp.disparopro.com.br:8433/mt
Method: POST
Headers: Authorization: Bearer {token}
Body: { numero: "61999999999", mensagem: "Texto" }
Response: { status: 200, id: "123" }
```

### 8.3 Resend (Email)

**Configuração**: `integrations_settings`
- `resend_api_key`: Chave da API
- `resend_from_email`: Email remetente
- `resend_from_name`: Nome remetente
- `resend_enabled`: boolean

**Uso**:
```typescript
const resend = new Resend(resend_api_key);
await resend.emails.send({
  from: `${from_name} <${from_email}>`,
  to: [to_email],
  subject: subject,
  html: html_content,
});
```

### 8.4 PassKit (Cartão Digital)

**Configuração**: `integrations_settings`
- `passkit_api_token`: Bearer token
- `passkit_api_base_url`: `https://api.pub1.passkit.io`
- `passkit_program_id`: ID do programa de fidelidade
- `passkit_tier_id`: ID do tier padrão
- `passkit_enabled`: boolean

**Fluxo**:
```
1. Edge Function create-leader-pass:
   POST {base_url}/members/member/points
   Headers: Authorization: Bearer {token}
   Body: {
     externalId: leader.id,
     programId: program_id,
     tierId: tier_id,
     person: { displayName, emailAddress, mobileNumber },
     points: { currentBalance: pontuacao_total }
   }
   
2. PassKit retorna:
   { id: "member_id", installUrl: "https://..." }
   
3. Líder instala cartão no Apple/Google Wallet

4. PassKit envia webhook para passkit-webhook:
   { event: "install", memberId: "..." }
   
5. Sistema atualiza lideres:
   passkit_pass_installed = true
   passkit_installed_at = now()
```

---

## 9. VARIÁVEIS DE AMBIENTE

### 9.1 Variáveis do Frontend (.env)

```env
# Supabase (auto-gerado pelo Lovable Cloud)
VITE_SUPABASE_URL=https://eydqducvsddckhyatcux.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=eydqducvsddckhyatcux
```

### 9.2 Secrets do Supabase (Edge Functions)

```env
# Auto-disponíveis
SUPABASE_URL=https://eydqducvsddckhyatcux.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# IA (para chatbot e geração de conteúdo)
LOVABLE_API_KEY=lvbl_...

# Não armazenar chaves de integração em secrets
# Usar integrations_settings no banco de dados
```

---

## 10. TEMPLATES DE MENSAGEM

### 10.1 Variáveis Disponíveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{nome}}` | Primeiro nome | João |
| `{{nome_completo}}` | Nome completo | João da Silva |
| `{{codigo}}` | Código de verificação | A7X9K |
| `{{link_verificacao}}` | URL de verificação | https://.../v/A7X9K |
| `{{link_indicacao}}` | URL do link de afiliado | https://.../affiliate/abc123 |
| `{{evento_nome}}` | Nome do evento | Reunião Comunitária |
| `{{evento_data}}` | Data formatada | 15/01/2026 |
| `{{evento_horario}}` | Horário | 19:00 |
| `{{evento_local}}` | Local do evento | Centro Comunitário |
| `{{pontos}}` | Pontuação do líder | 45 |
| `{{cadastros}}` | Número de cadastros | 12 |
| `{{protocolo}}` | Protocolo da visita | GAB-2024-00001 |
| `{{link_formulario}}` | Link do formulário | https://.../visita-gabinete/... |

### 10.2 Templates por Categoria

**Verificação**:
- `verificacao-cadastro`: Código inicial de verificação
- `verificacao-codigo`: Reenvio de código
- `verificacao-confirmada`: Confirmação de verificação
- `verificacao-sms-fallback`: Fallback SMS → WhatsApp

**Eventos**:
- `evento-inscricao-confirmada`: Confirmação de inscrição
- `evento-lembrete`: Lembrete 24h antes
- `evento-fotos`: Link das fotos pós-evento

**Liderança**:
- `lideranca-cadastro-link`: Boas-vindas + link de indicação
- `lider-cadastro-confirmado`: Confirmação de cadastro
- `link-indicacao-sms-fallback`: Fallback do link de indicação

**Captação**:
- `captacao-boas-vindas`: Boas-vindas + material

**Visita**:
- `visita-link-formulario`: Link do formulário de visita
- `reuniao-cancelada`: Cancelamento de reunião
- `reuniao-reagendada`: Reagendamento

**Opt-out**:
- `descadastro-confirmado`: Confirmação de descadastro
- `recadastro-confirmado`: Confirmação de recadastro

---

## 11. POLÍTICAS RLS

### 11.1 Padrão de Segurança

```sql
-- Funções auxiliares (SECURITY DEFINER)
has_role(auth.uid(), 'admin'::app_role)      -- Tem role específica
has_admin_access(auth.uid())                  -- É admin ou super_admin
is_super_admin(auth.uid())                    -- É super_admin

-- Padrão para tabelas administrativas
CREATE POLICY "admin_modify" ON tabela
FOR ALL
USING (has_admin_access(auth.uid()))
WITH CHECK (has_admin_access(auth.uid()));

-- Padrão para tabelas com acesso de atendente
CREATE POLICY "staff_access" ON tabela
FOR ALL
USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role))
WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- Padrão para tabelas públicas (formulários)
CREATE POLICY "public_insert" ON tabela
FOR INSERT
WITH CHECK (true);

CREATE POLICY "admin_select" ON tabela
FOR SELECT
USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- Padrão para dados do próprio usuário
CREATE POLICY "own_data" ON tabela
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### 11.2 Políticas por Tabela Crítica

**`lideres`**:
```sql
-- Insert público (auto-cadastro)
CREATE POLICY "lideres_insert_public_self_registration" ON lideres
FOR INSERT
WITH CHECK (
  nome_completo IS NOT NULL AND 
  telefone IS NOT NULL AND 
  cidade_id IS NOT NULL AND 
  is_active = true
);

-- Modificação por admin
CREATE POLICY "lideres_modify" ON lideres
FOR ALL
USING (has_admin_access(auth.uid()))
WITH CHECK (has_admin_access(auth.uid()));

-- Leitura por staff
CREATE POLICY "lideres_select" ON lideres
FOR SELECT
USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));
```

**`office_contacts`**:
```sql
-- Insert público
CREATE POLICY "office_contacts_insert_public" ON office_contacts
FOR INSERT
WITH CHECK (true);

-- Modificação por admin
CREATE POLICY "office_contacts_modify" ON office_contacts
FOR ALL
USING (has_admin_access(auth.uid()))
WITH CHECK (has_admin_access(auth.uid()));

-- Leitura por staff
CREATE POLICY "office_contacts_select" ON office_contacts
FOR SELECT
USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));
```

**`office_visits`**:
```sql
-- Acesso staff
CREATE POLICY "office_visits_all" ON office_visits
FOR ALL
USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role))
WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

-- Insert via afiliado (formulário público)
CREATE POLICY "office_visits_insert_from_affiliate" ON office_visits
FOR INSERT
WITH CHECK (
  contact_id IS NOT NULL AND
  leader_id IS NOT NULL AND
  city_id IS NOT NULL AND
  protocolo IS NOT NULL
);

-- Select público para formulário
CREATE POLICY "office_visits_select_public_for_form" ON office_visits
FOR SELECT
USING (status IN ('REGISTERED', 'LINK_SENT', 'FORM_OPENED', 'FORM_SUBMITTED', 'SCHEDULED'));
```

---

## 12. CONSIDERAÇÕES FINAIS

### 12.1 Padrões de Código

**Componentes React**:
- Usar TypeScript strict
- Componentes funcionais com hooks
- Separar lógica em custom hooks
- Usar shadcn/ui como base
- Aplicar Tailwind CSS com tokens semânticos

**Edge Functions**:
- Usar Deno com TypeScript
- Sempre retornar JSON com success/error
- Logar com prefixo `[function-name]`
- Usar createClient com SERVICE_ROLE_KEY
- Tratar CORS

**Banco de Dados**:
- Sempre habilitar RLS
- Usar gen_random_uuid() para PKs
- Timestamps: created_at, updated_at
- Normalizar telefones para E.164
- Usar JSONB para dados flexíveis

### 12.2 Segurança

- Nunca expor SERVICE_ROLE_KEY no frontend
- Validar dados no backend (Edge Functions)
- Usar RLS para todas as tabelas
- Tokens de afiliado são únicos e indexados
- Códigos de verificação expiram após uso
- Rate limiting no chatbot

### 12.3 Performance

- Índices em campos de busca frequente
- Paginação em listagens grandes
- Cache de queries com React Query
- Lazy loading de componentes
- Otimização de imagens

---

**Fim do Documento**

> Este documento contém todas as informações necessárias para uma IA reconstruir o sistema do zero, incluindo arquitetura, banco de dados, lógica de negócio, integrações e padrões de código.
