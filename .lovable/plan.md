

## Adicionar Opção de PDF Somente para Coordenadores

### O Que Será Implementado

Será adicionado um novo botão na modal de links do líder que permite gerar um PDF contendo **somente os links dos coordenadores** do evento.

### Alterações na Interface

| Elemento | Descrição |
|----------|-----------|
| Novo botão | "Gerar PDF para Coordenadores" |
| Ícone | Crown (coroa) para diferenciar dos líderes |
| Estado de loading | Indicador separado para geração do PDF |

### Visualização

```
┌─────────────────────────────────────────────────────────┐
│  Gerar Link do Líder                               [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Selecione o líder que receberá o link...               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 📄 Gerar PDF para Todos os Líderes             │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 👑 Gerar PDF para Coordenadores                │ ← NOVO
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Líder: [________________▼]                             │
│                                                         │
│  [ Gerar Link do Líder ]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Seção Técnica

### Arquivo: `src/components/events/EventAffiliateDialog.tsx`

#### 1. Importar ícone Crown

```typescript
import { Copy, Download, QrCode as QrCodeIcon, FileText, Crown } from "lucide-react";
```

#### 2. Adicionar estado para loading do PDF de coordenadores

```typescript
const [isGeneratingCoordinatorsPdf, setIsGeneratingCoordinatorsPdf] = useState(false);
```

#### 3. Criar função `handleGeneratePdfForCoordinators`

Nova função baseada em `handleGeneratePdfForAll`, mas com filtro adicional:

```typescript
const handleGeneratePdfForCoordinators = async () => {
  setIsGeneratingCoordinatorsPdf(true);
  try {
    // Buscar apenas coordenadores ativos com affiliate_token
    const { data: coordinators, error } = await supabase
      .from("lideres")
      .select("id, nome_completo, affiliate_token, cidade:office_cities(nome)")
      .eq("is_active", true)
      .eq("is_coordinator", true)  // ← FILTRO ADICIONAL
      .not("affiliate_token", "is", null)
      .order("nome_completo");

    if (error) throw error;
    if (!coordinators || coordinators.length === 0) {
      toast({
        title: "Nenhum coordenador encontrado",
        description: "Não há coordenadores ativos com token de afiliado.",
        variant: "destructive"
      });
      return;
    }

    // Criar PDF (mesma lógica de handleGeneratePdfForAll)
    const pdf = new jsPDF();
    // ... gerar conteúdo ...

    // Download com nome diferenciado
    pdf.save(`links-coordenadores-${event.slug}.pdf`);
    
    toast({
      title: "PDF gerado!",
      description: `PDF com links de ${coordinators.length} coordenadores foi baixado.`
    });
  } catch (error) {
    // ... tratamento de erro ...
  } finally {
    setIsGeneratingCoordinatorsPdf(false);
  }
};
```

#### 4. Adicionar botão na interface

Adicionar abaixo do botão existente de "Gerar PDF para Todos os Líderes":

```tsx
<div className="flex gap-2">
  <Button 
    onClick={handleGeneratePdfForAll} 
    variant="outline" 
    className="flex-1"
    disabled={isGeneratingPdf}
  >
    <FileText className="h-4 w-4 mr-2" />
    {isGeneratingPdf ? "Gerando PDF..." : "Gerar PDF para Todos os Líderes"}
  </Button>
</div>

{/* NOVO BOTÃO */}
<div className="flex gap-2">
  <Button 
    onClick={handleGeneratePdfForCoordinators} 
    variant="outline" 
    className="flex-1"
    disabled={isGeneratingCoordinatorsPdf}
  >
    <Crown className="h-4 w-4 mr-2" />
    {isGeneratingCoordinatorsPdf ? "Gerando PDF..." : "Gerar PDF para Coordenadores"}
  </Button>
</div>
```

### Resultado Esperado

- Novo botão com ícone de coroa para gerar PDF apenas de coordenadores
- PDF gerado com nome `links-coordenadores-{slug}.pdf` para diferenciação
- Mensagem de sucesso informando a quantidade de coordenadores incluídos
- Loading state independente para não bloquear o outro botão

