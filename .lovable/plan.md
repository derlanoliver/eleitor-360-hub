

## Adicionar Template "Material Região" no Envio em Massa de SMS

### Resumo
Criar o template SMS `material-regiao-sms` no banco de dados para que ele apareça no seletor de templates da aba "Envio em Massa" do SMS Marketing.

### Situação Atual

O template `material-regiao-sms` foi referenciado no código da edge function `schedule-region-material`, mas **não existe** na tabela `sms_templates`. Por isso, ele não aparece na lista de templates disponíveis.

A aba de Envio em Massa busca todos os templates via hook `useSMSTemplates()` e filtra por `is_active: true`.

### Solução

Inserir o template diretamente no banco de dados com os seguintes dados:

| Campo | Valor |
|-------|-------|
| slug | `material-regiao-sms` |
| nome | `Material Região (padrão)` |
| categoria | `materiais` |
| mensagem | `{{nome}}, temos um material especial para você! Acesse: {{link_material}}` |
| variaveis | `["nome", "link_material"]` |
| is_active | `true` |

### Resultado Esperado

Após a migração:
- O template aparecerá no dropdown "Template SMS" da aba Envio em Massa
- Será agrupado na categoria "materiais"
- Poderá ser usado para envios manuais além do agendamento automático

---

## Seção Técnica

### Migração SQL

```sql
INSERT INTO public.sms_templates (
  slug,
  nome,
  mensagem,
  categoria,
  variaveis,
  is_active
) VALUES (
  'material-regiao-sms',
  'Material Região (padrão)',
  '{{nome}}, temos um material especial para você! Acesse: {{link_material}}',
  'materiais',
  ARRAY['nome', 'link_material'],
  true
);
```

### Arquivos Afetados

Nenhum arquivo de código precisa ser alterado - apenas a inserção no banco de dados.

### Variáveis do Template

| Variável | Descrição | Fonte |
|----------|-----------|-------|
| `{{nome}}` | Primeiro nome do destinatário | Truncado automaticamente pelo sistema |
| `{{link_material}}` | URL do material da região | Vem da tabela `region_materials.material_url` |

**Nota:** A variável `{{regiao}}` foi omitida do template padrão para economia de caracteres (limite de 160), mas pode ser adicionada posteriormente se necessário.

