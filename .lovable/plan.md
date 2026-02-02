
## Relatório Detalhado por Evento

### O Que Será Implementado

Um novo sistema de relatórios na aba "Eventos" (Configurações > Relatórios) que permite selecionar um evento específico e visualizar um panorama completo com:

| Categoria | Informações |
|-----------|-------------|
| **Origem Geográfica** | De onde são os inscritos e check-ins (por cidade) |
| **Taxas de Comparecimento** | Taxa de check-in, taxa de não comparecimento |
| **Perfil dos Participantes** | Se são líderes, coordenadores ou contatos comuns |
| **Recorrência** | Participação em outros eventos do sistema |

### Nova Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Eventos                                                                    │
│  ┌──────────────────────────────┐  ┌────────────────┐                       │
│  │ Selecione um evento        ▼ │  │ 🔄 Atualizar   │  📥 Exportar Excel    │
│  └──────────────────────────────┘  └────────────────┘                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  📊 PAINEL GERAL (quando nenhum evento selecionado - atual)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  📋 RELATÓRIO DO EVENTO (quando evento selecionado)                         │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Inscritos   │ │ Check-ins   │ │ Ausentes    │ │ Taxa Conv.  │           │
│  │    120      │ │     95      │ │     25      │ │   79.2%     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 📍 ORIGEM DOS PARTICIPANTES                                             ││
│  │                                                                         ││
│  │ Cidade          │ Inscritos │ Check-ins │ Ausentes │ Taxa Conv.        ││
│  │ ────────────────│───────────│───────────│──────────│───────────        ││
│  │ Taguatinga      │    45     │    38     │    7     │   84.4%           ││
│  │ Ceilândia       │    30     │    25     │    5     │   83.3%           ││
│  │ Samambaia       │    25     │    18     │    7     │   72.0%           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 👥 PERFIL DOS PARTICIPANTES                                             ││
│  │                                                                         ││
│  │ [Gráfico Pizza]                                                         ││
│  │ • Contatos comuns: 65 (54.2%)                                           ││
│  │ • Líderes: 45 (37.5%)                                                   ││
│  │ • Coordenadores: 10 (8.3%)                                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🔄 RECORRÊNCIA DE PARTICIPAÇÃO                                          ││
│  │                                                                         ││
│  │ • Primeira vez neste tipo de evento: 80 (66.7%)                         ││
│  │ • Já participaram de outros eventos: 40 (33.3%)                         ││
│  │ • Média de eventos por participante: 2.3                                ││
│  │                                                                         ││
│  │ Top Participantes Recorrentes:                                          ││
│  │ 1. João Silva - 5 eventos (Reuniões, Encontros)                         ││
│  │ 2. Maria Santos - 4 eventos (Reuniões)                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 📋 LISTA DETALHADA DE INSCRITOS                                         ││
│  │                                                                         ││
│  │ Nome        │ Cidade    │ Status  │ Perfil      │ Outros Eventos       ││
│  │ ────────────│───────────│─────────│─────────────│──────────────        ││
│  │ João Silva  │ Taguatinga│ ✅ Check│ Líder       │ 5 eventos            ││
│  │ Maria Costa │ Ceilândia │ ❌ Ausen│ Coordenador │ 3 eventos            ││
│  │ Pedro Alves │ Samambaia │ ✅ Check│ Contato     │ Primeira vez         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Seção Tecnica

### 1. Novo Hook: `useEventDetailedReport.ts`

Este hook buscara todas as informacoes detalhadas de um evento especifico:

```typescript
// src/hooks/reports/useEventDetailedReport.ts
interface EventDetailedReport {
  // Metricas gerais
  totalRegistrations: number;
  totalCheckins: number;
  totalAbsent: number;
  conversionRate: number;
  
  // Origem geografica
  citiesBreakdown: {
    cityId: string;
    cityName: string;
    registrations: number;
    checkins: number;
    absents: number;
    conversionRate: number;
  }[];
  
  // Perfil dos participantes
  profileBreakdown: {
    contacts: number;
    leaders: number;
    coordinators: number;
  };
  
  // Recorrencia
  recurrenceStats: {
    firstTimers: number;
    recurring: number;
    averageEventsPerParticipant: number;
  };
  
  // Lista detalhada
  registrations: {
    id: string;
    nome: string;
    email: string;
    whatsapp: string;
    cityName: string | null;
    checkedIn: boolean;
    checkedInAt: string | null;
    createdAt: string;
    profileType: 'contact' | 'leader' | 'coordinator';
    otherEventsCount: number;
    otherEventNames: string[];
  }[];
}
```

**Logica de classificacao de perfil:**
1. Buscar o email/telefone do inscrito na tabela `lideres`
2. Se encontrar e `is_coordinator = true` -> Coordenador
3. Se encontrar e `is_coordinator = false` -> Lider
4. Se nao encontrar -> Contato comum

**Logica de recorrencia:**
1. Buscar todas as inscricoes do mesmo email/telefone em outros eventos
2. Contar quantos eventos distintos participou
3. Listar os nomes dos eventos

### 2. Atualizar `EventsReportTab.tsx`

Adicionar um Select para escolher o evento e renderizar condicionalmente:
- Se nenhum evento selecionado: mostra o painel geral (atual)
- Se evento selecionado: mostra o relatorio detalhado

```typescript
// Estado
const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

// Buscar lista de eventos para o Select
const { data: eventsList } = useQuery({
  queryKey: ['events_list_for_report'],
  queryFn: async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name, date')
      .order('date', { ascending: false });
    return data;
  }
});

// Usar hook de relatorio detalhado quando evento selecionado
const { data: eventReport } = useEventDetailedReport(selectedEventId);
```

### 3. Novo Componente: `EventDetailedReportPanel.tsx`

Componente que renderiza o painel completo do relatorio:

```typescript
// src/components/reports/EventDetailedReportPanel.tsx
interface Props {
  report: EventDetailedReport;
  eventName: string;
}
```

Secoes:
1. **Cards de KPIs**: Inscritos, Check-ins, Ausentes, Taxa
2. **Tabela de Cidades**: Origem geografica com barras de progresso
3. **Grafico de Perfil**: PieChart com contatos/lideres/coordenadores
4. **Card de Recorrencia**: Estatisticas e top participantes
5. **Tabela Completa**: Lista paginada de todos os inscritos

### 4. Exportacao Excel

Atualizar `eventReportsExport.ts` para incluir:

```typescript
export function exportEventDetailedReport(data: EventDetailedReport, eventName: string) {
  const workbook = XLSX.utils.book_new();
  
  // Aba 1: Resumo
  // Aba 2: Por Cidade
  // Aba 3: Perfil dos Participantes
  // Aba 4: Lista Completa com todas as colunas
}
```

### 5. Consultas SQL Otimizadas

Para classificar perfil (RPC ou query otimizada):

```sql
-- Buscar inscricoes com join em lideres para classificacao
SELECT 
  er.*,
  oc.nome as cidade_nome,
  l.id as matched_leader_id,
  l.is_coordinator,
  CASE 
    WHEN l.id IS NOT NULL AND l.is_coordinator THEN 'coordinator'
    WHEN l.id IS NOT NULL THEN 'leader'
    ELSE 'contact'
  END as profile_type
FROM event_registrations er
LEFT JOIN office_cities oc ON er.cidade_id = oc.id
LEFT JOIN lideres l ON (
  lower(l.email) = lower(er.email)
  OR l.telefone LIKE '%' || RIGHT(REGEXP_REPLACE(er.whatsapp, '[^0-9]', '', 'g'), 8) || '%'
)
WHERE er.event_id = $1;
```

Para recorrencia:

```sql
-- Buscar outros eventos do mesmo email
SELECT DISTINCT e.id, e.name
FROM event_registrations er
JOIN events e ON er.event_id = e.id
WHERE lower(er.email) = lower($1)
AND er.event_id != $2;
```

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/hooks/reports/useEventDetailedReport.ts` | Criar - Hook principal |
| `src/components/reports/EventDetailedReportPanel.tsx` | Criar - Componente do painel |
| `src/components/reports/EventsReportTab.tsx` | Modificar - Adicionar seletor de evento |
| `src/utils/eventReportsExport.ts` | Modificar - Adicionar exportacao detalhada |

### Fluxo de Dados

```
EventsReportTab
    |
    +-- Select evento --> null: mostra painel geral
    |                 --> eventId: busca useEventDetailedReport
    |
    +-- useEventDetailedReport(eventId)
            |
            +-- Buscar inscricoes do evento
            +-- JOIN com office_cities (origem)
            +-- JOIN com lideres (classificacao)
            +-- Subquery para recorrencia
            |
            +-- Retorna EventDetailedReport
                    |
                    +-- EventDetailedReportPanel renderiza
```
