

# Portal do Coordenador + Regras de Cadastro via Eventos

## Resumo

Este plano cobre 3 grandes entregas:

1. **Regra: Cadastro via evento NAO transforma em lider** -- Pessoas cadastradas em eventos (inclusive via link de lider com `?ref=`) serao apenas contatos comuns
2. **Regra: Contatos existentes nao contam como cadastro pelo link de lider** -- O formulario `/cadastro/:token` deve verificar se a pessoa ja existe em `office_contacts` e nao criar lider duplicado
3. **Portal publico do Coordenador** -- Login por telefone+senha, dashboard com dados do coordenador, e tela de criacao de eventos

---

## Parte 1: Regras de Cadastro

### 1.1 Evento nao promove a lider
- **Arquivo**: `src/pages/EventRegistration.tsx`
- Remover toda a logica que verifica se o contato indicado por lider precisa virar lider (linhas 186-217)
- O `source_type` do contato criado pela RPC `create_event_registration` deve ser `'evento'` (nao `'lider'`)
- Manter o fluxo de confirmacao normal (WhatsApp, email, SMS)

### 1.2 Link de lider nao cadastra quem ja e contato
- **Arquivo**: RPC `register_leader_from_affiliate` (banco de dados)
- Adicionar verificacao: se o telefone ja existe em `office_contacts`, retornar erro/flag `already_is_contact`
- **Arquivo**: `src/pages/LeaderRegistrationForm.tsx`
- Tratar o novo caso mostrando mensagem informativa

### 1.3 Acesso restrito (somente teste)
- Adicionar coluna `is_test_feature` na `app_settings` ou usar feature flag
- Somente super_admin e usuarios de teste podem ver estas mudancas
- Configuravel via settings

---

## Parte 2: Portal do Coordenador

### 2.1 Banco de Dados

**Nova tabela: `coordinator_credentials`**
```text
id              uuid PK
leader_id       uuid FK -> lideres(id) UNIQUE
password_hash   text NOT NULL
created_at      timestamptz
updated_at      timestamptz
```

**Nova coluna na tabela `events`:**
- `created_by_coordinator_id` (uuid, nullable, FK -> lideres) -- identifica eventos criados por coordenadores
- `cover_image_fixed` (boolean, default false) -- indica se usa imagem fixa

**RLS**: Tabela `coordinator_credentials` sem acesso publico direto; login via RPC SECURITY DEFINER.

### 2.2 RPCs (funcoes de banco)

- `coordinator_login(p_phone text, p_password text)` -- Valida telefone+senha, retorna JWT customizado ou token de sessao + dados do coordenador
- `coordinator_get_dashboard(p_leader_id uuid)` -- Retorna pontos, indicacoes, nivel, cadastros dos subordinados, eventos participados, comunicacoes recebidas
- `coordinator_set_password(p_leader_id uuid, p_password text)` -- Para admins definirem a senha do coordenador

### 2.3 Rotas e Paginas

**Novas rotas publicas em `App.tsx`:**
- `/coordenador/login` -- Tela de login
- `/coordenador/dashboard` -- Dashboard do coordenador (protegido por sessao)
- `/coordenador/eventos` -- Gerenciamento de eventos do coordenador

**Novos arquivos:**
- `src/pages/coordinator/CoordinatorLogin.tsx`
- `src/pages/coordinator/CoordinatorDashboard.tsx`
- `src/pages/coordinator/CoordinatorEvents.tsx`
- `src/hooks/coordinator/useCoordinatorAuth.ts`
- `src/hooks/coordinator/useCoordinatorDashboard.ts`
- `src/hooks/coordinator/useCoordinatorEvents.ts`
- `src/contexts/CoordinatorAuthContext.tsx`

### 2.4 Tela de Login (`CoordinatorLogin.tsx`)
- Campo: Telefone (com mascara brasileira)
- Campo: Senha
- Botao: Entrar
- Validacao via RPC `coordinator_login`
- Sessao armazenada em sessionStorage (token temporario)
- Sem acesso ao sistema "Pai" (admin)

### 2.5 Dashboard do Coordenador (`CoordinatorDashboard.tsx`)

Secoes da tela:
1. **Cabecalho**: Nome, foto/avatar, nivel atual (Bronze/Prata/Ouro/Diamante) com badge
2. **Pontos e Progresso**: Total de pontos, barra de progresso para proximo nivel, pontos faltantes
3. **Indicacoes**: Lista de lideres subordinados com:
   - Nome
   - Status verificado/pendente (badge)
   - Data de cadastro
   - Telefone mascarado (ex: ***9999)
   - Quantidade de cadastros e pontos de cada um
4. **Eventos Participados**: Lista de eventos que o coordenador se inscreveu/fez check-in
5. **Eventos Convidado**: Eventos que ele foi convidado (via comunicacao)
6. **Comunicacoes**: Historico de SMS, WhatsApp e emails enviados para o coordenador
7. **Arvore**: Totais gerais -- soma de pontos de toda a sub-arvore
8. **Status**: Badge do nivel atual

### 2.6 Tela de Eventos do Coordenador (`CoordinatorEvents.tsx`)

- Formulario de criacao de evento **identico** ao do sistema "Pai" (`Events.tsx`), com as seguintes diferencas:
  - **Sem** botao "Link do Lider" -- substituido por botao com link usando a `ref` do coordenador (ex: `/eventos/[slug]?ref=[coordinator_token]`)
  - **Sem** botao "Enviar Fotos"
  - **Imagem de capa fixa**: Sempre usa a imagem de capa do formulario de indicacao (configurada em `affiliate_form_settings` ou `app_settings`)
  - O evento e salvo na **mesma tabela `events`** com `created_by_coordinator_id` preenchido
- Lista de eventos criados por este coordenador
- Os cadastros no evento via link do coordenador (`?ref=`) **NAO** transformam a pessoa em lider -- ela fica como contato comum
- O fluxo pos-cadastro e identico: formulario -> tela de confirmacao -> QR Code para check-in

### 2.7 Configuracao pelo Admin

- **Arquivo**: `src/pages/settings/Team.tsx` ou novo sub-menu
- Opcao para definir senha de acesso ao portal para cada coordenador
- Ou: Na tela de detalhes do lider/coordenador, botao "Definir senha do portal"

---

## Parte 3: Integracao com Relatorios

- Eventos criados por coordenadores entram nos mesmos relatorios existentes
- A coluna `created_by_coordinator_id` permite filtrar/agrupar por coordenador nos relatorios
- Nenhuma mudanca necessaria nos relatorios existentes (ja leem da tabela `events`)

---

## Sequencia de Implementacao

1. Migracoes de banco (tabela `coordinator_credentials`, colunas novas em `events`)
2. RPCs de login e dashboard do coordenador
3. Regras de cadastro (evento nao promove, contato existente bloqueado)
4. Paginas do portal (login, dashboard, eventos)
5. Configuracao de senha pelo admin
6. Testes end-to-end

---

## Detalhes Tecnicos

- **Autenticacao do coordenador**: Nao usa Supabase Auth (que e para admins). Usa sistema proprio com RPC SECURITY DEFINER que valida telefone+senha (hash bcrypt via `pgcrypto`). Retorna dados do coordenador para sessionStorage.
- **Protecao de rotas**: Context `CoordinatorAuthContext` verifica sessao ativa antes de renderizar paginas do portal.
- **Imagem de capa fixa**: Busca a URL da imagem do formulario de indicacao (tabela `affiliate_form_settings` ou similar) e usa como `cover_image_url` ao criar evento.
- **Mascaramento de telefone**: Funcao utilitaria `maskPhone("5561999991234")` retorna `***1234`.
- **Feature flag**: As regras da Parte 1 podem ser controladas por uma flag em `app_settings` para ativar somente para teste.

