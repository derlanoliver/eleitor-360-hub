

## Exibir Líder Superior dos Participantes

### O Que Será Implementado

Para cada inscrito classificado como **Líder** ou **Coordenador**, o sistema mostrará quem é o líder direto acima dele na hierarquia.

### Alterações na Interface

| Local | Alteração |
|-------|-----------|
| Tabela de inscritos | Nova coluna "Líder Superior" |
| Exportação Excel | Coluna adicional com nome do líder superior |

### Visual da Tabela Atualizada

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LISTA DETALHADA DE INSCRITOS                                                             │
├───────────────┬────────────┬──────────┬─────────────┬────────────────┬─────────────────┤
│ Nome          │ Cidade     │ Status   │ Perfil      │ Líder Superior │ Outros Eventos  │
├───────────────┼────────────┼──────────┼─────────────┼────────────────┼─────────────────┤
│ João Silva    │ Taguatinga │ ✅ Check │ Líder       │ Maria Costa    │ 5 eventos       │
│ Maria Costa   │ Ceilândia  │ ❌ Ausen │ Coordenador │ -              │ 3 eventos       │
│ Pedro Alves   │ Samambaia  │ ✅ Check │ Contato     │ -              │ Primeira vez    │
│ Ana Souza     │ Planaltina │ ✅ Check │ Líder       │ João Silva     │ 2 eventos       │
└───────────────┴────────────┴──────────┴─────────────┴────────────────┴─────────────────┘
```

**Regras:**
- Se for **Contato comum**: não exibe nada (traço ou vazio)
- Se for **Líder**: exibe o nome do `parent_leader` (líder ou coordenador acima)
- Se for **Coordenador**: não tem líder acima (topo da hierarquia), exibe traço

---

## Seção Técnica

### 1. Atualizar Interface `EventDetailedReport`

Adicionar campos para o líder superior:

```typescript
// src/hooks/reports/useEventDetailedReport.ts
registrations: {
  // ... campos existentes ...
  profileType: 'contact' | 'leader' | 'coordinator';
  leaderId: string | null;
  
  // NOVOS CAMPOS
  parentLeaderId: string | null;
  parentLeaderName: string | null;
  
  otherEventsCount: number;
  otherEventNames: string[];
}[];
```

### 2. Atualizar Hook `useEventDetailedReport.ts`

Modificar a query de líderes para incluir `parent_leader_id` e nome:

```typescript
// Buscar todos os líderes COM parent_leader_id e nome
const { data: leaders } = await supabase
  .from('lideres')
  .select('id, email, telefone, is_coordinator, parent_leader_id, nome_completo');

// Criar map de líderes por ID para lookup do nome do parent
const leadersById = new Map<string, { nome_completo: string; is_coordinator: boolean }>();
leaders?.forEach(l => {
  leadersById.set(l.id, { 
    nome_completo: l.nome_completo, 
    is_coordinator: l.is_coordinator || false 
  });
});

// No processamento de cada registro:
let parentLeaderId: string | null = null;
let parentLeaderName: string | null = null;

if (match) {
  matchedLeaderId = match.id;
  profileType = match.is_coordinator ? 'coordinator' : 'leader';
  
  // Buscar líder superior
  const matchedLeader = leaders?.find(l => l.id === match.id);
  if (matchedLeader?.parent_leader_id) {
    parentLeaderId = matchedLeader.parent_leader_id;
    const parentInfo = leadersById.get(matchedLeader.parent_leader_id);
    parentLeaderName = parentInfo?.nome_completo || null;
  }
}

return {
  // ... outros campos ...
  parentLeaderId,
  parentLeaderName,
};
```

### 3. Atualizar Componente `EventDetailedReportPanel.tsx`

Adicionar coluna na tabela:

```tsx
<TableHeader>
  <TableRow>
    <TableHead>Nome</TableHead>
    <TableHead>Cidade</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Perfil</TableHead>
    <TableHead>Líder Superior</TableHead>  {/* NOVA COLUNA */}
    <TableHead>Outros Eventos</TableHead>
    <TableHead>Inscrito em</TableHead>
  </TableRow>
</TableHeader>

// Na célula:
<TableCell>
  {reg.profileType !== 'contact' && reg.parentLeaderName ? (
    <span className="text-sm">{reg.parentLeaderName}</span>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

### 4. Atualizar Exportação Excel

Em `eventReportsExport.ts`, adicionar a nova coluna:

```typescript
// Na aba de lista completa
const registrationsData = data.registrations.map(reg => ({
  Nome: reg.nome,
  Email: reg.email,
  WhatsApp: reg.whatsapp,
  Cidade: reg.cityName || 'N/A',
  Status: reg.checkedIn ? 'Check-in' : 'Ausente',
  Perfil: reg.profileType === 'coordinator' ? 'Coordenador' : 
          reg.profileType === 'leader' ? 'Líder' : 'Contato',
  'Líder Superior': reg.parentLeaderName || '-',  // NOVA COLUNA
  'Outros Eventos': reg.otherEventsCount,
  'Inscrito em': reg.createdAt
}));
```

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/reports/useEventDetailedReport.ts` | Adicionar parentLeaderId/parentLeaderName |
| `src/components/reports/EventDetailedReportPanel.tsx` | Nova coluna na tabela |
| `src/utils/eventReportsExport.ts` | Nova coluna no Excel |

