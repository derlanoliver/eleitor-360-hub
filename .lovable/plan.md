

## Adicionar Data/Hora de Inscrição e Check-in na Lista de Inscritos

### Alterações Planejadas

A lista de inscritos será aprimorada para mostrar claramente:
- **Data e hora da inscrição** - quando a pessoa se inscreveu no evento
- **Horário do check-in** - quando a pessoa fez o check-in (se aplicável)

### O Que Será Alterado

| Local | Alteração |
|-------|-----------|
| PDF de inscritos | Adicionar coluna "Inscrito em" com data/hora |
| PDF de check-in | Diferenciar "Inscrito em" e "Check-in às" |
| Lista na interface | Exibir data de inscrição e horário do check-in |

### Visualização Final

**Na lista de cards:**
```
┌─────────────────────────────────────────────────┐
│ Maria Silva                                      │
│ maria@email.com                        Check-in │
│                                          feito  │
│ Inscrito em: 25/01/2026 às 14:30                │
│ Check-in: 29/01/2026 às 09:15                   │
└─────────────────────────────────────────────────┘
```

**No PDF:**
```
# | Nome          | WhatsApp      | Email           | Cidade  | Inscrito em   | Check-in
1 | Maria Silva   | 61999...      | maria@...       | Brasília| 25/01 14:30   | 09:15
```

---

## Seção Técnica

### Arquivo: `src/pages/Events.tsx`

#### 1. PDF de Lista de Inscritos (função `handleGenerateRegistrationsPDF`)

Atualizar o header da tabela para incluir "Inscrito em":

```typescript
// Header atual (linha ~205-208)
pdf.text("Nome", 22, y);
pdf.text("WhatsApp", 82, y);
pdf.text("Email", 115, y);
pdf.text("Cidade", 160, y);

// Adicionar:
pdf.text("Inscrito", 175, y);  // Nova coluna
```

Atualizar renderização das linhas para incluir data de inscrição:

```typescript
// Adicionar na renderização de cada linha:
if (reg.created_at) {
  const inscricaoDate = format(new Date(reg.created_at), "dd/MM HH:mm", { locale: ptBR });
  pdf.text(inscricaoDate, 175, y);
}
```

#### 2. Lista de Cards na Interface (componente `EventCheckInManagement`)

Modificar o card de cada inscrito (linhas ~1459-1471) para exibir as datas:

```tsx
<Card key={reg.id}>
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="font-medium">{reg.nome}</p>
        <p className="text-sm text-muted-foreground">{reg.email}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span>
            Inscrito em: {format(new Date(reg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
          {reg.checked_in && reg.checked_in_at && (
            <span className="text-green-600">
              Check-in: {format(new Date(reg.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
      <Badge>...</Badge>
    </div>
  </CardContent>
</Card>
```

#### 3. PDF de Check-in (função `handleExportCheckInPDF`)

Ajustar para mostrar ambas as datas:

```typescript
// Header
pdf.text("Nome", 26, yPos);
pdf.text("WhatsApp", 85, yPos);
pdf.text("Email", 125, yPos);
pdf.text("Inscrito", 168, yPos);   // Data de inscrição
pdf.text("Check-in", 190, yPos);   // Hora do check-in

// Linhas
const inscricaoTime = format(new Date(reg.created_at), "dd/MM HH:mm");
pdf.text(inscricaoTime, 168, yPos);

if (reg.checked_in_at) {
  const checkTime = format(new Date(reg.checked_in_at), "HH:mm");
  pdf.text(checkTime, 192, yPos);
}
```

### Resultado

- O PDF mostrará data e hora de inscrição para todos os inscritos
- A seção de check-ins realizados mostrará também o horário do check-in
- A interface web mostrará as informações de forma clara e organizada

