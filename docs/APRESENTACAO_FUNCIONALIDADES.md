# 🎯 Plataforma 360 Eleitor — Guia Completo de Funcionalidades

> Documento para montagem de apresentação institucional  
> Linguagem acessível, sem termos técnicos  
> Versão 1.0 — Fevereiro 2026

---

## 📑 Índice

1. [Visão Geral](#1-visão-geral)
2. [Painel Principal (Dashboard)](#2-painel-principal-dashboard)
3. [Gestão de Contatos](#3-gestão-de-contatos)
4. [Gestão de Lideranças](#4-gestão-de-lideranças)
5. [Árvore de Lideranças](#5-árvore-de-lideranças)
6. [Mapa Estratégico](#6-mapa-estratégico)
7. [Materiais de Campanha](#7-materiais-de-campanha)
8. [Campanhas e Captação](#8-campanhas-e-captação)
9. [Pesquisas de Opinião](#9-pesquisas-de-opinião)
10. [Eventos](#10-eventos)
11. [Programas e Projetos](#11-programas-e-projetos)
12. [Opinião Pública](#12-opinião-pública)
13. [Agente de Inteligência Artificial](#13-agente-de-inteligência-artificial)
14. [Comunicação via WhatsApp](#14-comunicação-via-whatsapp)
15. [Comunicação via Email](#15-comunicação-via-email)
16. [Comunicação via SMS](#16-comunicação-via-sms)
17. [Mensagens Agendadas](#17-mensagens-agendadas)
18. [Módulo Gabinete](#18-módulo-gabinete)
19. [Portal do Coordenador](#19-portal-do-coordenador)
20. [Configurações e Administração](#20-configurações-e-administração)
21. [Segurança e Privacidade](#21-segurança-e-privacidade)
22. [Resumo de Telas](#22-resumo-de-telas)

---

## 1. Visão Geral

A **Plataforma 360 Eleitor** é uma solução completa para **gestão de relacionamento político**. Ela reúne em um único lugar todas as ferramentas necessárias para:

- 📋 **Organizar** sua base de apoiadores e lideranças
- 📊 **Acompanhar** métricas e resultados em tempo real
- 💬 **Comunicar** com sua base por WhatsApp, SMS e Email
- 📅 **Gerenciar** eventos com inscrição e check-in automáticos
- 🏢 **Atender** visitantes no gabinete de forma organizada
- 🗺️ **Visualizar** sua presença territorial em mapas interativos
- 📦 **Controlar** a distribuição de materiais de campanha
- 🔍 **Pesquisar** a opinião da população com análise inteligente
- 🤖 **Automatizar** tarefas com inteligência artificial

> **💡 Slide sugerido:** Mosaico visual com ícones representando cada módulo ao redor do logo central

---

## 2. Painel Principal (Dashboard)

**Tela: `/dashboard`**

O painel principal é a **primeira tela** que o usuário vê ao entrar no sistema. Apresenta uma visão consolidada de toda a operação.

### O que mostra:
- **Números gerais**: Total de contatos, lideranças, eventos realizados
- **Gráfico de evolução**: Crescimento da base ao longo do tempo
- **Ranking de lideranças**: Os líderes mais ativos e com mais indicações
- **Ranking por região**: Quais regiões administrativas têm mais presença
- **Ranking por tema**: Quais assuntos mais geram demandas
- **Estatísticas do gabinete**: Visitas realizadas, atendimentos do dia
- **Perfil consolidado**: Dados gerais do mandatário/candidato

### Funcionalidades:
- Filtros por período (7 dias, 30 dias, 90 dias, total)
- Exportação de dados
- Atualização em tempo real

> **📸 Print sugerido:** Dashboard completo com cards de estatísticas e gráficos

---

## 3. Gestão de Contatos

**Tela: `/contacts`**

O módulo de contatos é a **base de dados central** da plataforma. Todos os cidadãos que interagem com o sistema são registrados aqui.

### O que faz:
- **Cadastro manual** de novos contatos
- **Importação em massa** via planilha Excel/CSV
- **Importação de emails** para contatos existentes
- **Busca e filtros** por nome, telefone, região, origem
- **Verificação de contato** por SMS ou WhatsApp (confirma que o número é válido)
- **Identificação automática de gênero** por nome
- **Visualização completa** do histórico de cada contato:
  - Mensagens enviadas (WhatsApp, SMS, Email)
  - Eventos que participou
  - Pesquisas que respondeu
  - Visitas ao gabinete
  - Páginas que acessou
  - Downloads realizados
- **Desativação voluntária** (quando o contato pede para não ser mais contatado)
- **Promoção a liderança** (transformar um contato em líder)

### Informações de cada contato:
- Nome, telefone, email
- Região/cidade
- Data de nascimento
- Redes sociais (Instagram, Facebook)
- Origem do cadastro (manual, evento, campanha, indicação de líder)
- Status de verificação
- Histórico completo de interações

> **📸 Prints sugeridos:** Lista de contatos com filtros + Detalhe de um contato com histórico

---

## 4. Gestão de Lideranças

**Tela: `/leaders`**

As lideranças são os **multiplicadores** — pessoas que trazem novos contatos e apoiadores para a rede.

### O que faz:
- **Cadastro de líderes** com dados completos
- **Importação em massa** via planilha
- **Link de indicação único** para cada líder (os novos contatos vindos por esse link são automaticamente creditados ao líder)
- **Sistema de pontuação e gamificação**:
  - Bronze, Prata, Ouro, Diamante (baseado em indicações e atividades)
  - Ranking geral e por região
- **Verificação de liderança** (confirmar identidade por SMS/WhatsApp)
- **Cartão digital** na carteira do celular (Apple Wallet / Google Wallet)
- **Hierarquia**: Cada líder pode ter um líder superior (coordenador)
- **Coordenadores**: Líderes promovidos que gerenciam outros líderes
- **Visualização detalhada**:
  - Contatos indicados
  - Subordinados na hierarquia
  - Eventos que participou
  - Mensagens recebidas
  - Pesquisas indicadas
  - Páginas acessadas via link de afiliado

### Ações disponíveis:
- Editar dados
- Mover para outro coordenador
- Promover a coordenador
- Enviar notificação do cartão digital
- QR Code para cadastro público

> **📸 Prints sugeridos:** Lista de lideranças com badges de nível + Detalhe com pontuação e indicações

---

## 5. Árvore de Lideranças

**Tela: `/leaders/tree`**

Visualização gráfica da **estrutura hierárquica** de toda a rede de lideranças.

### O que mostra:
- Organograma interativo com coordenadores no topo
- Líderes subordinados em ramificações
- Quantidade de indicações por líder
- Nível de gamificação de cada um
- Busca por nome dentro da árvore

### Como funciona:
- Clique em qualquer líder para ver seus detalhes
- Expanda ou recolha ramos da árvore
- Visualize a cadeia completa de indicações

> **📸 Print sugerido:** Árvore expandida mostrando 2-3 níveis de hierarquia

---

## 6. Mapa Estratégico

**Tela: `/strategic-map`**

Mapa interativo que mostra a **presença territorial** da rede em todas as regiões administrativas.

### O que mostra:
- **Mapa de calor**: Concentração de contatos e lideranças por região
- **Marcadores**: Posição de lideranças e coordenadores
- **Limites regionais**: Contornos das regiões administrativas do DF
- **Painel de análise**: Resumo com totais e distribuição
- **Análise por IA**: Geração automática de insights estratégicos sobre a distribuição territorial

### Funcionalidades:
- Zoom e navegação
- Filtros por tipo (contatos, lideranças, coordenadores)
- Camadas sobrepostas (calor + marcadores + limites)

> **📸 Print sugerido:** Mapa com zonas de calor e marcadores sobre o DF

---

## 7. Materiais de Campanha

**Tela: `/materials`**

Módulo completo para **controle de produção, estoque e distribuição** de materiais.

### O que faz:
- **Cadastro de materiais** com foto, tipo, unidade e quantidade produzida
- **Controle de estoque** em tempo real
- **Reserva por coordenadores** (via Portal do Coordenador)
- **Retirada validada** por QR Code no WhatsApp
- **Devolução controlada** também por QR Code
- **Prazo de retirada**: 3 dias para buscar o material reservado
- **Registro de origem**: Diferencia entre "Reserva" (coordenador solicitou) e "Direta" (equipe registrou)
- **Histórico completo** de cada movimentação

### Fluxo de distribuição:
1. 📦 Material é cadastrado com quantidade produzida
2. 📋 Coordenador reserva pelo portal (ou equipe registra diretamente)
3. 📱 Sistema gera QR Code com código de confirmação
4. ✅ Coordenador escaneia e envia comando no WhatsApp para confirmar retirada
5. 🔄 Para devolução, mesmo processo com QR Code específico
6. 📊 Estoque atualizado automaticamente a cada operação

> **📸 Prints sugeridos:** Tela de materiais com estoque + QR Code de retirada + Histórico de movimentações

---

## 8. Campanhas e Captação

**Tela: `/campaigns`**

Módulo para criar e acompanhar **campanhas de captação de contatos** com rastreamento completo.

### Funcionalidades:

#### 8.1 Funis de Captação
- Criação de **páginas de captura** (landing pages) personalizadas
- Oferta de **materiais gratuitos** (e-books, guias, etc.) em troca de dados
- Personalização visual (logo, cores, textos)
- Página de agradecimento customizável
- Métricas: visualizações, cadastros, downloads

#### 8.2 Campanhas com Rastreamento
- Cada campanha gera **links rastreáveis** (UTM)
- Saber exatamente de onde veio cada contato
- Vincular campanhas a eventos ou funis
- Relatórios de performance por campanha

#### 8.3 Relatórios
- Conversão por campanha
- Origem dos cadastros
- Ranking de líderes por captação

> **📸 Prints sugeridos:** Lista de campanhas com métricas + Página de captura de exemplo

---

## 9. Pesquisas de Opinião

**Telas: `/surveys`, `/surveys/:id/edit`, `/surveys/:id/results`**

Ferramenta completa para **criar, distribuir e analisar pesquisas** de opinião.

### O que faz:
- **Editor de pesquisas** com múltiplos tipos de perguntas:
  - Texto livre
  - Múltipla escolha
  - Escala (1 a 5, 1 a 10)
  - Sim/Não
  - Avaliação por estrelas
- **Geração de perguntas por IA**: Descreva o tema e a IA sugere perguntas
- **Link público** para distribuição por qualquer canal
- **Links personalizados por líder**: Cada líder pode ter seu link, rastreando quem indicou
- **Análise de resultados**:
  - Gráficos automáticos para cada pergunta
  - Tabela com todas as respostas
  - **Análise inteligente por IA**: Resumo dos principais insights
- **Status da pesquisa**: Rascunho → Ativa → Encerrada

> **📸 Prints sugeridos:** Editor de pesquisa + Gráficos de resultado + Análise por IA

---

## 10. Eventos

**Tela: `/events`**

Gestão completa de **eventos presenciais e online** com inscrição pública e check-in.

### O que faz:
- **Criar eventos** com data, horário, local, endereço, capacidade
- **Imagem de capa** personalizada
- **Categorias** para classificação
- **Página pública de inscrição** com formulário automático
- **QR Code do evento** para divulgação
- **Check-in por QR Code**: Cada inscrito recebe um código único
- **PIN de segurança**: Operadores de check-in precisam de PIN para operar
- **Contagem em tempo real** de inscritos e presentes
- **Vínculo com lideranças**: Saber quais líderes trouxeram mais inscritos
- **Envio de fotos do evento** por WhatsApp/Email/SMS para todos os participantes
- **Relatórios detalhados**:
  - Inscritos vs. presentes
  - Origem dos inscritos
  - Timeline de inscrições
  - Ranking de líderes por indicação
  - Estatísticas por cidade

### Fluxo do evento:
1. 📅 Criar evento com todos os dados
2. 📲 Compartilhar link/QR de inscrição
3. 📝 Cidadãos se inscrevem pelo formulário público
4. ✅ No dia, check-in por QR Code
5. 📸 Após o evento, enviar fotos para participantes
6. 📊 Analisar resultados

> **📸 Prints sugeridos:** Lista de eventos + Formulário de inscrição pública + Tela de check-in

---

## 11. Programas e Projetos

**Tela: `/projects`**

Módulo para registrar e acompanhar **programas, projetos e ações** do mandato.

### O que faz:
- Cadastro de programas com nome, descrição e status
- Classificação por categoria
- Acompanhamento de status (Ativo, Concluído, Pausado)
- Vinculação com eventos e campanhas relacionadas

> **📸 Print sugerido:** Lista de programas com status

---

## 12. Opinião Pública

**Telas: `/public-opinion/*` (10 subtelas)**

Módulo avançado de **monitoramento da opinião pública** nas redes sociais e mídias.

### Subtelas:

| Tela | O que faz |
|---|---|
| **Visão Geral** | Dashboard com métricas consolidadas de menções e sentimento |
| **Sentimento** | Análise se as menções são positivas, negativas ou neutras |
| **Linha do Tempo** | Evolução das menções ao longo do tempo |
| **Comparação** | Compare métricas entre diferentes períodos ou termos |
| **Análise de Conteúdo** | Perfil demográfico e temático das menções |
| **Menções** | Lista completa de todas as menções encontradas |
| **Insights IA** | Análise inteligente automática com recomendações |
| **Eventos Analisados** | Correlação entre eventos e impacto na opinião pública |
| **Relatórios** | Geração de relatórios exportáveis |
| **Configurações** | Termos monitorados, fontes e frequência de coleta |

### Funcionalidades:
- Coleta automática de menções em redes sociais
- Análise de sentimento por inteligência artificial
- Identificação de tendências e crises
- Alertas em tempo real
- Relatórios periódicos automáticos

> **📸 Prints sugeridos:** Visão geral com gráficos de sentimento + Linha do tempo + Insights IA

---

## 13. Agente de Inteligência Artificial

**Tela: `/ai-agent`**

Um **assistente inteligente** integrado ao sistema que ajuda na operação diária.

### O que faz:
- **Conversa natural**: Pergunte qualquer coisa sobre seus dados
- **Análise de dados**: "Quantos contatos cadastramos este mês?"
- **Sugestões estratégicas**: "Quais regiões precisam de mais atenção?"
- **Redação de mensagens**: Cria textos para WhatsApp, SMS e Email
- **Histórico de conversas**: Todas as interações ficam salvas
- **Múltiplos modelos de IA**: Utiliza os modelos mais avançados do mercado

> **📸 Print sugerido:** Tela do chat com uma conversa de exemplo

---

## 14. Comunicação via WhatsApp

**Tela: `/whatsapp`**

Centro de comunicação por **WhatsApp** com envio individual e em massa.

### O que faz:
- **Templates personalizáveis**: Crie modelos de mensagem reutilizáveis
- **Variáveis dinâmicas**: O sistema substitui automaticamente `{{nome}}`, `{{link}}`, etc.
- **Envio em massa**: Envie para toda a base ou grupos filtrados
- **Envio de teste**: Teste a mensagem antes de disparar
- **Histórico completo**: Veja todas as mensagens enviadas e recebidas
- **Status de entrega**: Pendente → Enviado → Entregue → Lido
- **Chatbot automático**: Respostas automáticas para perguntas frequentes
- **Múltiplos provedores**: Suporte a diferentes serviços de WhatsApp
- **Proteção anti-spam**: Intervalo automático entre envios e variação de texto

### Chatbot WhatsApp:
O sistema possui um **chatbot inteligente** que responde automaticamente:
- Consultas de rede (quantos indicados o líder tem)
- Pontuação e ranking
- Link de indicação
- Perguntas gerais (respondidas por IA)

> **📸 Prints sugeridos:** Editor de template + Histórico de mensagens + Tela de envio em massa

---

## 15. Comunicação via Email

**Tela: `/email`**

Centro de comunicação por **Email** com templates em HTML.

### O que faz:
- **Editor de templates**: Crie emails com formatação rica (HTML)
- **Envio em massa**: Para contatos, lideranças ou participantes de eventos
- **Envio de teste**: Prévia antes do disparo
- **Histórico**: Todas as mensagens com status de entrega
- **Relatórios**: Taxa de envio, abertura e cliques
- **Categorização**: Organize templates por tipo (evento, campanha, verificação, etc.)

> **📸 Prints sugeridos:** Editor de template de email + Relatório de envio

---

## 16. Comunicação via SMS

**Tela: `/sms`**

Centro de comunicação por **mensagens de texto (SMS)**.

### O que faz:
- **Templates de SMS**: Mensagens curtas (até 160 caracteres)
- **Envio em massa**: Para toda a base ou filtros específicos
- **Múltiplos provedores**: Alternância automática entre serviços
- **Retry automático**: Se o envio falhar, tenta novamente automaticamente
- **Histórico com status**: Pendente → Enviado → Entregue → Falhou
- **Detalhes de cada mensagem**: Veja o conteúdo e status individual

> **📸 Print sugerido:** Histórico de SMS com status de entrega

---

## 17. Mensagens Agendadas

**Tela: `/scheduled`**

Programação de **envios futuros** em qualquer canal.

### O que faz:
- Agendar mensagens para data e hora específicas
- Suporte a WhatsApp, SMS e Email
- Visualizar todas as mensagens programadas
- Cancelar agendamentos pendentes
- Status: Pendente → Enviado → Falhou → Cancelado

> **📸 Print sugerido:** Lista de mensagens agendadas com datas futuras

---

## 18. Módulo Gabinete

**Telas: `/office/*` (5 subtelas)**

Sistema completo para **atendimento presencial** no gabinete do mandatário.

### Subtelas:

| Tela | O que faz |
|---|---|
| **Nova Visita** | Registra um novo visitante na fila |
| **Agenda** | Visualiza e gerencia visitas agendadas |
| **Fila do Dia** | Acompanha em tempo real quem está esperando |
| **Histórico** | Consulta todas as visitas anteriores |
| **Configurações** | Ajustes do gabinete (prefixo de protocolo, pontuação, etc.) |

### Fluxo de atendimento:
1. 📝 Visitante chega e é registrado (com líder indicador, se houver)
2. 📱 Sistema envia link de formulário por WhatsApp
3. ✍️ Visitante preenche formulário com dados e demanda
4. ✅ Check-in confirma presença no gabinete
5. 🤝 Reunião realizada e registrada com ata
6. 📊 Dados alimentam o painel e ranking de lideranças

### Funcionalidades especiais:
- **Protocolo automático**: Cada visita recebe um número único (ex: GAB-2026-00001)
- **Notificação sonora**: Alerta quando novo visitante entra na fila
- **Fila em tempo real**: Atualiza automaticamente sem recarregar
- **Ata de reunião**: Registro do que foi discutido
- **Agendamento**: Marcar visitas futuras com data e horário
- **Reagendamento**: Remarcar visitas com histórico
- **Temas de interesse**: Classificar cada visita por assunto

> **📸 Prints sugeridos:** Fila do dia com visitantes + Formulário público de visita + Ata de reunião

---

## 19. Portal do Coordenador

**Telas: `/coordenador/*`**

Portal exclusivo para **coordenadores** — líderes promovidos que gerenciam outros líderes.

### O que inclui:

| Tela | O que faz |
|---|---|
| **Login** | Acesso por telefone e senha (independente do sistema principal) |
| **Dashboard** | Visão consolidada dos subordinados, comunicações e atividades |
| **Eventos** | Criar eventos, gerenciar inscrições e fazer check-in |
| **Materiais** | Reservar materiais de campanha para distribuição |
| **Verificar Líder** | Ferramenta pública para confirmar identidade de lideranças |

### Destaques:
- **Acesso independente**: Coordenadores não precisam de acesso ao sistema principal
- **Visão focada**: Veem apenas seus subordinados e dados relevantes
- **Criação de eventos**: Podem criar e gerenciar seus próprios eventos
- **Reserva de materiais**: Solicitam materiais que serão validados via QR Code

> **📸 Prints sugeridos:** Dashboard do coordenador + Tela de reserva de materiais

---

## 20. Configurações e Administração

**Telas: `/settings/*`**

### 20.1 Organização (`/settings/organization`)
- Nome da organização, cargo, partido
- Logo, redes sociais, contato
- Nome da plataforma personalizável

### 20.2 Equipe (`/settings/team`)
- Adicionar membros da equipe (atendentes, operadores)
- Definir permissões por perfil:
  - **Administrador**: Acesso total
  - **Atendente**: Operação diária (sem configurações avançadas)
  - **Operador de Check-in**: Apenas módulo de eventos

### 20.3 Integrações (`/settings/integrations`)
- Configuração de WhatsApp (conexão com serviço)
- Configuração de Email (servidor de envio)
- Configuração de SMS (provedores)
- Cartão Digital (Apple/Google Wallet)
- Horário de silêncio (não enviar mensagens fora do horário)

### 20.4 Chatbot WhatsApp (`/settings/whatsapp-chatbot`)
- Ativar/desativar chatbot
- Configurar mensagem de boas-vindas
- Gerenciar palavras-chave e respostas
- Ativar IA para perguntas não mapeadas

### 20.5 Gamificação (`/settings/gamification`)
- Definir faixas de pontuação por nível
- Configurar pontos por ação
- Limites de eventos por dia

### 20.6 Formulários Públicos
- **Formulário de Apoiador** (`/settings/affiliate-form`): Personalizar a página pública de cadastro de apoiadores
- **Formulário de Liderança** (`/settings/leader-form`): Personalizar a página pública de cadastro de líderes

### 20.7 Rastreamento (`/settings/tracking`)
- Pixel do Facebook
- Google Tag Manager
- Token da API do Facebook

### 20.8 Provedores de IA (`/settings/ai-providers`)
- Configuração dos modelos de IA utilizados

### 20.9 Relatórios (`/settings/reports`)
- Visão consolidada com múltiplas abas:
  - Visão geral
  - Lideranças
  - Coordenadores
  - Eventos
  - Comunicação

### 20.10 Materiais por Região (`/settings/region-materials`)
- Configurar distribuição automática de materiais por região

### 20.11 Contatos Duplicados (`/settings/duplicate-contacts`)
- Identificar e mesclar contatos duplicados

### 20.12 Suporte (`/settings/support`)
- Abrir tickets de suporte
- Acompanhar status dos tickets
- Administrar tickets (para administradores)

### 20.13 Privacidade (`/settings/privacy`)
- Gerenciar sessões ativas (ver de onde está conectado)
- Encerrar sessões em outros dispositivos
- Alterar perfil e senha

> **📸 Prints sugeridos:** Tela de equipe com membros + Configuração de integrações + Relatório consolidado

---

## 21. Segurança e Privacidade

### 21.1 Controle de Acesso
- **4 níveis de permissão**: Super Admin, Administrador, Atendente, Operador de Check-in
- Cada perfil vê apenas o que é permitido
- Rotas protegidas por autenticação

### 21.2 Controle de Sessão
- Monitoramento de sessões ativas em diferentes dispositivos
- Detecção automática de dispositivo, navegador e sistema operacional
- Quando um novo login acontece, a sessão anterior recebe aviso de 5 minutos para encerrar
- Possibilidade de encerrar sessões remotamente

### 21.3 Verificação de Identidade
- Contatos e lideranças passam por verificação por SMS ou WhatsApp
- Códigos únicos de verificação
- Registro de quando e como foi verificado

### 21.4 Proteção de Dados
- Opt-out respeitado (cidadão pode pedir para não ser mais contatado)
- Token de descadastro em cada mensagem
- Horário de silêncio configurável

### 21.5 Inatividade
- Logout automático após período de inatividade
- Aviso prévio antes do encerramento

> **📸 Print sugerido:** Tela de sessões ativas com dispositivos listados

---

## 22. Resumo de Telas

### Telas Internas (Autenticadas)

| # | Tela | Caminho | Descrição |
|---|---|---|---|
| 1 | Dashboard | `/dashboard` | Painel principal com métricas |
| 2 | Contatos | `/contacts` | Gestão da base de contatos |
| 3 | Lideranças | `/leaders` | Gestão de lideranças |
| 4 | Ranking | `/leaders/ranking` | Ranking de lideranças |
| 5 | Árvore | `/leaders/tree` | Organograma hierárquico |
| 6 | Mapa Estratégico | `/strategic-map` | Mapa territorial interativo |
| 7 | Materiais | `/materials` | Controle de materiais |
| 8 | Campanhas | `/campaigns` | Campanhas de captação |
| 9 | Pesquisas | `/surveys` | Lista de pesquisas |
| 10 | Editor de Pesquisa | `/surveys/:id/edit` | Criar/editar perguntas |
| 11 | Resultados da Pesquisa | `/surveys/:id/results` | Análise de respostas |
| 12 | Eventos | `/events` | Gestão de eventos |
| 13 | Programas | `/projects` | Programas e projetos |
| 14 | Opinião Pública | `/public-opinion/*` | 10 subtelas de monitoramento |
| 15 | Agente IA | `/ai-agent` | Chat com inteligência artificial |
| 16 | WhatsApp | `/whatsapp` | Envio e histórico de WhatsApp |
| 17 | Email | `/email` | Envio e histórico de emails |
| 18 | SMS | `/sms` | Envio e histórico de SMS |
| 19 | Agendados | `/scheduled` | Mensagens programadas |
| 20 | Gabinete - Nova Visita | `/office/new` | Registrar visitante |
| 21 | Gabinete - Agenda | `/office/schedule` | Visitas agendadas |
| 22 | Gabinete - Fila | `/office/queue` | Fila do dia em tempo real |
| 23 | Gabinete - Histórico | `/office/history` | Visitas anteriores |
| 24 | Gabinete - Config. | `/office/settings` | Configurações do gabinete |
| 25-36 | Configurações | `/settings/*` | 12 subtelas de configuração |

### Telas Públicas (Sem login)

| # | Tela | Caminho | Descrição |
|---|---|---|---|
| 1 | Inscrição em Evento | `/eventos/:slug` | Formulário público de inscrição |
| 2 | Check-in | `/checkin/:qrCode` | Confirmar presença no evento |
| 3 | Captação/Funil | `/captacao/:slug` | Landing page de captura de leads |
| 4 | Cadastro de Apoiador | `/affiliate/:token` | Formulário via link de líder |
| 5 | Cadastro de Líder | `/lider/cadastro` | Formulário público de líder |
| 6 | Pesquisa | `/pesquisa/:slug` | Formulário público de pesquisa |
| 7 | Verificar Contato | `/v/:codigo` | Página de verificação |
| 8 | Verificar Líder | `/verificar-lider/:codigo` | Confirmação de liderança |
| 9 | Descadastro | `/descadastro` | Opt-out de comunicações |
| 10 | Visita Gabinete | `/visita-gabinete/:id` | Formulário de visita |
| 11 | Agendar Visita | Formulário público | Agendamento de visita |

### Portal do Coordenador

| # | Tela | Caminho | Descrição |
|---|---|---|---|
| 1 | Login | `/coordenador/login` | Acesso por telefone/senha |
| 2 | Dashboard | `/coordenador/dashboard` | Painel do coordenador |
| 3 | Eventos | `/coordenador/eventos` | Gestão de eventos |
| 4 | Materiais | `/coordenador/materiais` | Reserva de materiais |
| 5 | Verificar Líder | `/coordenador/verificar` | Verificação pública |

---

## 📊 Números do Sistema

| Métrica | Valor |
|---|---|
| **Total de telas internas** | 36+ |
| **Total de telas públicas** | 11 |
| **Total de telas do portal** | 5 |
| **Canais de comunicação** | 3 (WhatsApp, SMS, Email) |
| **Tipos de relatório** | 5+ |
| **Módulos principais** | 12 |

---

## 🎬 Sugestão de Roteiro para Apresentação

### Slide 1 — Abertura
> "Conheça a plataforma que revoluciona a gestão política"

### Slide 2 — O Problema
> "Como gerenciar milhares de contatos, lideranças e demandas de forma organizada?"

### Slide 3 — A Solução
> Visão geral da plataforma com mosaico dos módulos

### Slides 4-8 — Módulos Principais
> Dashboard → Contatos → Lideranças → Mapa → Materiais

### Slides 9-12 — Campanhas e Comunicação
> Campanhas → Eventos → Pesquisas → WhatsApp/SMS/Email

### Slides 13-14 — Gabinete e Portal
> Atendimento presencial → Portal do Coordenador

### Slide 15 — Inteligência Artificial
> Agente IA + Opinião Pública + Análise automática

### Slide 16 — Segurança
> Controle de acesso, verificação, privacidade

### Slide 17 — Encerramento
> Números consolidados e chamada para ação

---

*Este documento serve como base completa para montagem de uma apresentação institucional da Plataforma 360 Eleitor. Para cada seção, capture prints das telas correspondentes no sistema.*
