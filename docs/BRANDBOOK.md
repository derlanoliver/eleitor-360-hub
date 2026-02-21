# 📘 BrandBook — Plataforma 360 Eleitor

> Guia de Identidade Visual e Diretrizes de Marca  
> Versão 1.0 — Fevereiro 2026

---

## 1. Sobre a Marca

A **Plataforma 360 Eleitor** é um sistema completo de gestão de relacionamento político, desenvolvido para fortalecer o vínculo entre mandatários e cidadãos. A marca transmite **proximidade, organização e eficiência**, refletindo o compromisso com a transparência e o atendimento de qualidade.

### 1.1 Propósito
Conectar o mandatário à sua base de apoio de forma inteligente, organizada e humanizada — potencializando resultados por meio da tecnologia.

### 1.2 Valores da Marca
- **Proximidade** — A tecnologia serve para aproximar, não afastar
- **Organização** — Dados estruturados geram decisões melhores
- **Eficiência** — Automatizar o operacional para focar no essencial
- **Transparência** — Informação clara e acessível para todos os envolvidos

### 1.3 Tom de Voz
| Contexto | Tom |
|---|---|
| Interface do sistema | Direto, objetivo, sem jargões técnicos |
| Comunicações com cidadãos | Acolhedor, respeitoso, próximo |
| Relatórios e dados | Informativo, preciso, confiável |
| Notificações | Breve, claro, orientado à ação |

---

## 2. Paleta de Cores

### 2.1 Cor Primária — Laranja Institucional

A cor principal é um **laranja vibrante** que transmite energia, acessibilidade e ação. Representa dinamismo e proximidade.

| Token | Hex | HSL | Uso |
|---|---|---|---|
| **Primary 500** (Principal) | `#F05023` | `hsl(15, 89%, 54%)` | Botões principais, links, destaques |
| **Primary 600** | `#C0401C` | `hsl(15, 77%, 44%)` | Hover de botões, textos de destaque |
| **Primary 700** | `#B0361A` | `hsl(15, 77%, 40%)` | Estados pressed, bordas ativas |
| **Primary 400** | `#F3734F` | `hsl(15, 85%, 63%)` | Ícones secundários, badges |
| **Primary 100** | `#FDF1EC` | `hsl(15, 100%, 96%)` | Fundos sutis, cards destacados |

### 2.2 Cores Neutras

| Token | Hex | HSL | Uso |
|---|---|---|---|
| **Gray 50** | `#F9FAFB` | `hsl(210, 20%, 98%)` | Fundo de página |
| **Gray 100** | `#F3F4F6` | `hsl(220, 14%, 96%)` | Fundo de cards, áreas secundárias |
| **Gray 200** | `#E5E7EB` | `hsl(220, 13%, 91%)` | Bordas, divisores |
| **Gray 600** | `#4B5563` | `hsl(220, 9%, 46%)` | Textos secundários, labels |
| **Gray 800** | `#1F2937` | `hsl(220, 26%, 14%)` | Textos em cards escuros |
| **Gray 900** | `#111827` | `hsl(220, 39%, 11%)` | Títulos, textos principais |

### 2.3 Cores Semânticas

| Token | Hex | HSL | Uso |
|---|---|---|---|
| **Success** | `#10B981` | `hsl(158, 64%, 52%)` | Confirmações, status positivo, verificado |
| **Warning** | `#F59E0B` | `hsl(43, 96%, 56%)` | Alertas, pendências, atenção |
| **Danger** | `#EF4444` | `hsl(0, 84%, 60%)` | Erros, exclusões, cancelamentos |
| **Info** | `#3B82F6` | `hsl(221, 83%, 53%)` | Informações, dicas, links auxiliares |

### 2.4 Aplicação de Cores

```
┌─────────────────────────────────────────────┐
│  FUNDO DA PÁGINA          Gray 50 (#F9FAFB) │
│  ┌─────────────────────────────────────────┐ │
│  │  CARD                  Branco (#FFFFFF)  │ │
│  │  ┌────────────┐                         │ │
│  │  │ BOTÃO      │  Primary 500 (#F05023)  │ │
│  │  │ PRIMÁRIO   │  Texto: Branco          │ │
│  │  └────────────┘                         │ │
│  │  Título:  Gray 900                      │ │
│  │  Texto:   Gray 600                      │ │
│  │  Borda:   Gray 200                      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 3. Tipografia

### 3.1 Família Tipográfica

| Uso | Fonte | Fallback |
|---|---|---|
| **Todo o sistema** | **Inter** | system-ui, sans-serif |

A **Inter** foi escolhida por sua excelente legibilidade em telas, ampla variedade de pesos e design otimizado para interfaces digitais.

### 3.2 Escala Tipográfica

| Nível | Tamanho | Peso | Uso |
|---|---|---|---|
| **H1** | 24px (text-2xl) | Semibold (600) | Títulos de página |
| **H2** | 20px (text-xl) | Semibold (600) | Títulos de seção |
| **Body** | 16px (text-base) | Regular (400) | Texto corrido |
| **Small** | 14px (text-sm) | Regular (400) | Labels, legendas |
| **Caption** | 12px (text-xs) | Medium (500) | Badges, tags, datas |

### 3.3 Tracking e Leading

| Elemento | Line-height | Letter-spacing |
|---|---|---|
| Títulos (H1) | tight (1.25) | tight (-0.025em) |
| Subtítulos (H2) | snug (1.375) | normal |
| Corpo | relaxed (1.625) | normal |
| Pequeno | normal (1.5) | normal |

---

## 4. Componentes Visuais

### 4.1 Bordas e Arredondamento

| Componente | Border Radius |
|---|---|
| Cards, Modais | `0.75rem` (12px) |
| Botões, Inputs | `calc(0.75rem - 2px)` (10px) |
| Badges, Tags | `calc(0.75rem - 4px)` (8px) |

### 4.2 Sombras

| Nome | Valor CSS | Uso |
|---|---|---|
| **Soft** | `0 8px 20px rgba(17,24,39, 0.08)` | Cards padrão, elementos flutuantes |
| **Hard** | `0 10px 30px rgba(17,24,39, 0.15)` | Modais, dropdowns, popovers |

### 4.3 Botões

| Variante | Fundo | Texto | Uso |
|---|---|---|---|
| **Primary** | Primary 500 | Branco | Ação principal (Salvar, Confirmar) |
| **Secondary** | Gray 100 | Gray 900 | Ação secundária (Cancelar, Voltar) |
| **Destructive** | Danger 500 | Branco | Excluir, Cancelar permanente |
| **Outline** | Transparente + borda | Gray 900 | Ações terciárias |
| **Ghost** | Transparente | Gray 600 | Ações inline, ícones |

### 4.4 Badges e Status

| Tipo | Fundo | Texto | Exemplo |
|---|---|---|---|
| **Brand** | Primary 100 | Primary 600 | "Ativo", "Coordenador" |
| **Sucesso** | Verde claro | Success 500 | "Verificado", "Enviado" |
| **Alerta** | Amarelo claro | Warning 500 | "Pendente", "Expirando" |
| **Erro** | Vermelho claro | Danger 500 | "Falhou", "Cancelado" |
| **Info** | Azul claro | Info 500 | "Novo", "Agendado" |

---

## 5. Iconografia

### 5.1 Biblioteca
O sistema utiliza **Lucide React** como biblioteca de ícones — um conjunto open-source com traço fino e consistente.

### 5.2 Tamanhos

| Contexto | Tamanho | Classe |
|---|---|---|
| Sidebar expandida | 20px | `h-5 w-5` |
| Sidebar colapsada | 24px | `h-6 w-6` |
| Botões inline | 16px | `h-4 w-4` |
| Cards de estatísticas | 20-24px | `h-5 w-5` a `h-6 w-6` |

### 5.3 Ícones por Módulo

| Módulo | Ícone | Lucide |
|---|---|---|
| Dashboard | 📊 | `LayoutDashboard` |
| Contatos | 👥 | `Users` |
| Lideranças | ✅ | `UserCheck` |
| Eventos | 📅 | `Calendar` |
| Campanhas | 🎯 | `Target` |
| Pesquisas | 📋 | `ClipboardList` |
| WhatsApp | 💬 | `MessageSquare` |
| Email | ✉️ | `Mail` |
| SMS | 📱 | `Smartphone` |
| Gabinete | 🏢 | `Building` |
| Mapa Estratégico | 🗺️ | `Map` |
| Agente IA | 🤖 | `Bot` |
| Materiais | 📦 | `Package` |
| Opinião Pública | 🌐 | `Globe` |

---

## 6. Layout e Estrutura

### 6.1 Grid Principal

```
┌──────────────────────────────────────────────────────┐
│                    TOPBAR (64px)                      │
│  [Logo/Nome]              [Notificações] [Usuário]   │
├────────┬─────────────────────────────────────────────┤
│        │                                             │
│ SIDEBAR│              CONTEÚDO PRINCIPAL             │
│ (256px │               (flex-1, padding 24px)        │
│  ou    │                                             │
│  80px  │  ┌─────────────────────────────────────┐   │
│ colap- │  │  TÍTULO DA PÁGINA                    │   │
│ sado)  │  │  [Ações]                             │   │
│        │  ├─────────────────────────────────────┤   │
│        │  │                                     │   │
│        │  │  CONTEÚDO                            │   │
│        │  │  (cards, tabelas, formulários)       │   │
│        │  │                                     │   │
│        │  └─────────────────────────────────────┘   │
│        │                                             │
└────────┴─────────────────────────────────────────────┘
```

### 6.2 Responsividade

| Breakpoint | Comportamento |
|---|---|
| **Desktop** (≥1024px) | Sidebar fixa, conteúdo fluido |
| **Tablet** (768-1023px) | Sidebar colapsável |
| **Mobile** (<768px) | Sidebar oculta com menu hambúrguer |

### 6.3 Espaçamento

| Token | Valor | Uso |
|---|---|---|
| `p-4` | 16px | Padding interno de cards |
| `p-6` | 24px | Padding da área de conteúdo |
| `gap-4` | 16px | Espaço entre cards |
| `gap-6` | 24px | Espaço entre seções |
| `mb-2` | 8px | Espaço entre label e input |

---

## 7. Modo Escuro

O sistema suporta modo escuro com as seguintes adaptações:

| Elemento | Modo Claro | Modo Escuro |
|---|---|---|
| Fundo da página | Branco | Gray 900 |
| Fundo de card | Branco | Gray 800 |
| Texto principal | Gray 900 | Gray 50 |
| Texto secundário | Gray 600 | Gray 600 |
| Bordas | Gray 200 | Gray 800 |
| Cor primária | Primary 500 | Primary 400 |

---

## 8. Padrões de Interface

### 8.1 Modais e Diálogos
- Fundo overlay semi-transparente
- Card centralizado com cantos arredondados (12px)
- Sombra `hard` para destacar
- Botão de fechar no canto superior direito
- Ações na parte inferior (Cancelar à esquerda, Confirmar à direita)

### 8.2 Tabelas
- Cabeçalho em Gray 50 com texto em Gray 600
- Linhas alternadas ou hover em Gray 50
- Ações no final da linha (ícones ou dropdown)
- Paginação na parte inferior

### 8.3 Formulários
- Labels acima dos campos em Gray 900
- Campos com borda Gray 200
- Foco com ring na cor Primary
- Mensagens de erro em Danger 500 abaixo do campo

### 8.4 Notificações (Toast)
- Aparece no canto inferior direito
- Ícone + texto + ação opcional
- Auto-dismiss após 5 segundos
- Variantes: sucesso (verde), erro (vermelho), info (azul), alerta (amarelo)

---

## 9. Logomarca

### 9.1 Logo Principal
O logo da plataforma está armazenado em `src/assets/logo-rafael-prudente.png`.

### 9.2 Uso na Interface
- **Sidebar expandida**: Nome da plataforma em texto (`text-lg font-bold text-primary-600`)
- **Sidebar colapsada**: Inicial em círculo laranja (`w-10 h-10 bg-primary-500 rounded-lg`)
- **Favicon**: `public/favicon.png`

### 9.3 Área de Proteção
Manter no mínimo 16px de espaço livre ao redor da logomarca.

---

## 10. Acessibilidade

- Contraste mínimo AA (4.5:1 para texto, 3:1 para elementos grandes)
- Todos os ícones interativos possuem tooltips
- Navegação por teclado em todos os componentes
- Labels descritivos em formulários
- Indicadores de foco visíveis (ring na cor primária)

---

*Este documento é a referência oficial de identidade visual da Plataforma 360 Eleitor. Todas as novas funcionalidades e interfaces devem seguir estas diretrizes.*
