

## Converter Relatório Detalhado de PDF para Excel

### Resumo
Alterar o botão "Relatório Detalhado" na aba "Árvore" do diálogo de detalhes do líder para gerar um arquivo Excel (.xlsx) ao invés de PDF.

### Estrutura do Relatório Excel

O arquivo Excel terá uma planilha com as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| N° | Número sequencial |
| Nome | Nome completo do líder |
| Telefone | Telefone formatado |
| Árvore | Quantidade de subordinados diretos |
| Verificados | Total de líderes verificados na sub-árvore |
| Não Verificados | Total de líderes não verificados na sub-árvore |

### Informações Adicionais
- **Nome do arquivo**: `Relatorio_Arvore_[Nome_do_Lider].xlsx`
- **Cabeçalho na planilha**: Informações sobre o líder e data de geração
- **Filtro aplicado**: Indicação se inclui "Todos os níveis" ou "Apenas liderados diretos"

---

## Seção Técnica

### Alterações no Arquivo

**Arquivo:** `src/components/leaders/LeaderDetailsDialog.tsx`

#### 1. Adicionar Import do XLSX
Adicionar import da biblioteca `xlsx` que já está instalada no projeto.

#### 2. Substituir Lógica de Geração PDF por Excel
Na função de onClick do botão "Relatório Detalhado" (linhas ~1185-1275):

- **Remover**: Toda a lógica de criação do PDF com `jsPDF`
- **Adicionar**: Lógica para criar workbook Excel usando `XLSX`

#### 3. Estrutura do Excel

```text
+------------------------------------------+
| RELATÓRIO DE ÁRVORE - [Nome do Líder]    |
| Gerado em: 29/01/2026 às 14:30           |
| Filtro: Todos os níveis                   |
+------------------------------------------+
| N° | Nome | Telefone | Árvore | Verif... |
+----+------+----------+--------+----------+
| 1  | ...  | ...      | ...    | ...      |
+------------------------------------------+
```

#### 4. Atualizar Texto do Botão
- De: `"Gerando PDF..."` → Para: `"Gerando Excel..."`
- De: `"Relatório Detalhado"` (sem mudança, mantém o mesmo)

### Benefícios da Mudança
1. **Mais editável**: Excel permite filtros, ordenação e edição dos dados
2. **Melhor para grandes volumes**: Excel lida melhor com muitas linhas que PDF
3. **Compatibilidade**: Formato amplamente utilizado em ambientes corporativos
4. **Já existe no projeto**: A biblioteca `xlsx` já está instalada e em uso

