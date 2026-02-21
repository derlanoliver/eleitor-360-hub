
# Relatórios de Opiniao Publica - Geracao Real

## Problema Atual
Os botoes "Gerar Relatorio" na pagina de Opiniao Publica > Relatorios apenas exibem uma mensagem toast dizendo que a funcionalidade nao esta disponivel. Porem, o sistema ja coleta dados reais de mencoes, sentimentos e analises.

## Solucao
Implementar a geracao real de relatorios em PDF e Excel usando os dados ja coletados no banco de dados (mencoes, analises de sentimento, snapshots diarios, eventos).

## Relatorios que serao implementados

### 1. Relatorio Semanal de Sentimento (PDF)
- Periodo: ultimos 7 dias
- Conteudo: total de mencoes, distribuicao positivo/negativo/neutro, grafico de evolucao diaria, top 5 topicos, top 5 emocoes, top 10 mencoes mais relevantes

### 2. Comparativo com Adversarios (PDF)
- Periodo: ultimos 30 dias
- Conteudo: tabela comparativa entre todas as entidades monitoradas com total de mencoes, % positivo/negativo, score medio

### 3. Analise de Evento Especifico (PDF)
- Permite selecionar um evento registrado na tabela po_events
- Conteudo: impacto do evento, mencoes relacionadas, sentimento antes/depois

### 4. Relatorio Demografico por Fonte (Excel)
- Periodo: ultimos 30 dias
- Conteudo: planilha com breakdown por fonte (Instagram, Twitter, YouTube, etc.), quantidade de mencoes, % sentimento por fonte

### 5. Resumo Executivo (PDF)
- Periodo: ultimos 7 dias
- Conteudo: versao compacta com metricas-chave, tendencia, principais topicos e recomendacoes (1 pagina)

## Arquivos a criar/modificar

### Novo: `src/utils/generatePoReportPdf.ts`
- Funcoes para gerar cada tipo de relatorio PDF usando jsPDF (ja instalado no projeto)
- Reutiliza o padrao visual do `generateCoordinatorReportPdf.ts` (cores laranja #F05023, logo, formatacao)

### Novo: `src/utils/generatePoReportExcel.ts`
- Funcao para gerar o relatorio demografico em Excel usando xlsx (ja instalado)
- Segue o padrao do `emailReportExport.ts`

### Novo: `src/hooks/public-opinion/usePoReportData.ts`
- Hook que busca todos os dados necessarios para cada tipo de relatorio (mencoes, analises, snapshots, entidades)
- Consolida os dados no formato necessario para a geracao

### Modificado: `src/pages/public-opinion/Reports.tsx`
- Substituir o toast pelo chamado real de geracao
- Adicionar estado de loading por relatorio (spinner no botao durante geracao)
- Para o relatorio "Analise de Evento", abrir um dialog para selecionar qual evento analisar
- Exibir a data real da ultima geracao (pode ser armazenada em localStorage)

### Novo: `src/components/public-opinion/SelectEventReportDialog.tsx`
- Modal simples para selecionar um evento da lista po_events antes de gerar o relatorio tipo 3

## Detalhes Tecnicos

### Geracao PDF (jsPDF)
- Cabecalho com logo e titulo do relatorio
- Cor primaria #F05023 para destaques
- Tabelas formatadas com alternancia de cores nas linhas
- Secoes com titulos em negrito
- Rodape com data de geracao e nome da entidade

### Geracao Excel (xlsx)
- Headers formatados
- Colunas auto-dimensionadas
- Nome do arquivo com data e tipo do relatorio

### Fluxo do usuario
1. Clica em "Gerar Relatorio"
2. Botao mostra spinner "Gerando..."
3. Dados sao buscados do banco em tempo real
4. PDF/Excel e gerado e o download inicia automaticamente
5. Botao volta ao estado normal

### Dados utilizados (todos ja disponiveis via hooks existentes)
- `po_mentions` - mencoes brutas com fonte, conteudo, engajamento
- `po_sentiment_analyses` - sentimento, categoria, topicos, emocoes
- `po_daily_snapshots` - agregados diarios para graficos
- `po_events` - eventos para relatorio especifico
- `po_monitored_entities` - entidades para comparativo
