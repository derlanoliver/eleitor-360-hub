

## Excluir Líder David Sveci da tabela `lideres`

### Situação Identificada

O usuário "David Sveci" foi excluído do **Supabase Auth** (tabela `profiles`/`user_roles`), porém existe um registro separado na tabela **`lideres`** que não foi removido:

| ID | Nome | Email | Telefone |
|----|------|-------|----------|
| `bbfc0d9a-46fb-470c-9e3c-d9b17465077f` | David Sveci | davi_2d@hotmail.com | 5527999161738 |
| `0a4b04f7-a164-4db8-b9a7-76d293c21e78` | David Teste Sveci | teste@teste1.com.br | +5527999887788 |

### Ação Necessária

Executar `DELETE` para remover permanentemente os registros de líder:

```sql
DELETE FROM public.lideres 
WHERE id IN (
  'bbfc0d9a-46fb-470c-9e3c-d9b17465077f',
  '0a4b04f7-a164-4db8-b9a7-76d293c21e78'
);
```

### Passos

1. Executar o comando DELETE usando a ferramenta de inserção/atualização de dados
2. Confirmar que os registros foram removidos
3. Testar se a lista de lideranças não exibe mais esses nomes

### Observação

Não é necessário criar migração SQL pois esta é uma operação de **dados** (DELETE), não de esquema.

