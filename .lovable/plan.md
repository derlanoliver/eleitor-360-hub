
# Plano: Mesclar os 3 registros de Allan Damaceno Vargas Araújo

## Situacao Atual

| Registro | ID | Nivel | Pontos | Pai | Status |
|----------|-----|-------|--------|-----|--------|
| Principal | 21cbcb08 | 2 (Lider Nivel 1) | 4 | TCB (CONTRATADOS) | Ativo |
| Duplicata 2 | a61a04fa | 3 | 1 | Allan (principal) | Inativo |
| Duplicata 3 | 409d9a98 | 3 | 24 | Allan (principal) | Ativo |

## Resultado da Mesclagem

- **Registro sobrevivente**: 21cbcb08
- **Nivel**: 2 (Lider Nivel 1) -- **NAO coordenador**
- **Coordenador pai**: TCB (CONTRATADOS) -- mantido
- **Pontuacao total**: 4 + 1 + 24 = **29 pontos**
- **Subordinados**: Todos os subordinados das duplicatas serao transferidos para o registro principal

## Operacoes no Banco de Dados

1. Transferir subordinados do registro 2 (a61a04fa) para o registro principal (21cbcb08)
2. Transferir subordinados do registro 3 (409d9a98) para o registro principal (21cbcb08)
3. Atualizar pontuacao do registro principal para 29
4. Desativar os registros duplicados (2 e 3)
5. Recalcular niveis hierarquicos dos subordinados transferidos (nivel 3 para diretos, nivel 4 para sub-subordinados, etc.)

## Detalhes Tecnicos

```sql
-- 1. Mover subordinados da duplicata 2 para o principal
UPDATE lideres SET parent_leader_id = '21cbcb08-d5cc-4811-bb05-27c2cfdca76a'
WHERE parent_leader_id = 'a61a04fa-ef28-45f9-aa95-411834b56eda';

-- 2. Mover subordinados da duplicata 3 para o principal
UPDATE lideres SET parent_leader_id = '21cbcb08-d5cc-4811-bb05-27c2cfdca76a'
WHERE parent_leader_id = '409d9a98-2031-483b-bc4f-56974b6c818e';

-- 3. Somar pontuacao no registro principal
UPDATE lideres SET pontuacao_total = 29
WHERE id = '21cbcb08-d5cc-4811-bb05-27c2cfdca76a';

-- 4. Desativar duplicatas
UPDATE lideres SET is_active = false, parent_leader_id = NULL, hierarchy_level = NULL
WHERE id IN ('a61a04fa-ef28-45f9-aa95-411834b56eda', '409d9a98-2031-483b-bc4f-56974b6c818e');

-- 5. Recalcular niveis dos subordinados diretos (nivel 3)
UPDATE lideres SET hierarchy_level = 3
WHERE parent_leader_id = '21cbcb08-d5cc-4811-bb05-27c2cfdca76a'
  AND is_active = true
  AND id NOT IN ('a61a04fa-ef28-45f9-aa95-411834b56eda', '409d9a98-2031-483b-bc4f-56974b6c818e');
```

## Resultado Final

- Allan Damaceno: **Lider Nivel 1** (hierarchy_level=2), 29 pontos, sob coordenador TCB (CONTRATADOS)
- Todos os subordinados preservados e reagrupados sob o registro principal
- Registros duplicados desativados (mantidos no historico)
