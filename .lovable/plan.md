
# Plano: Corrigir Métricas do WhatsApp (Paginação)

## Problema Identificado

As métricas do WhatsApp na página `/whatsapp` estão incorretas porque o hook `useWhatsAppMetrics()` busca dados sem paginação, ficando limitado a 1.000 registros (limite padrão do banco de dados).

**Dados reais vs exibidos:**
| Métrica | Valor Real | Valor Exibido |
|---------|-----------|---------------|
| Total Enviadas | 3.976 | ~1.000 |
| Entregues | 1.281 | ~limitado |
| Lidas | 101 | ~limitado |
| Com Erro | 773 | ~limitado |

## Solução

Modificar o hook `useWhatsAppMetrics()` para usar a abordagem de **contagem via SQL** com `count: 'exact'` e `head: true`, que é mais eficiente e precisa.

Esta abordagem:
- Não tem limite de 1.000 registros
- É mais performática (não transfere dados, só conta)
- Já é usada no relatório de emails com sucesso

## Alterações Técnicas

### Arquivo: `src/hooks/useWhatsAppMessages.ts`

Substituir a função `useWhatsAppMetrics()` atual por uma versão otimizada que faz contagens diretas no banco:

```typescript
export function useWhatsAppMetrics() {
  return useQuery({
    queryKey: ["whatsapp-metrics"],
    queryFn: async () => {
      // Usar count com head: true para contagem precisa sem limite de 1000
      const [totalResult, sentResult, deliveredResult, readResult, failedResult] = await Promise.all([
        supabase
          .from("whatsapp_messages")
          .select("*", { count: "exact", head: true })
          .eq("direction", "outgoing"),
        supabase
          .from("whatsapp_messages")
          .select("*", { count: "exact", head: true })
          .eq("direction", "outgoing")
          .eq("status", "sent"),
        supabase
          .from("whatsapp_messages")
          .select("*", { count: "exact", head: true })
          .eq("direction", "outgoing")
          .eq("status", "delivered"),
        supabase
          .from("whatsapp_messages")
          .select("*", { count: "exact", head: true })
          .eq("direction", "outgoing")
          .eq("status", "read"),
        supabase
          .from("whatsapp_messages")
          .select("*", { count: "exact", head: true })
          .eq("direction", "outgoing")
          .eq("status", "failed"),
      ]);

      const total = totalResult.count || 0;
      const sent = sentResult.count || 0;
      const delivered = deliveredResult.count || 0;
      const read = readResult.count || 0;
      const failed = failedResult.count || 0;

      const successfulDeliveries = delivered + read;
      const deliveryRate = total > 0 ? (successfulDeliveries / total) * 100 : 0;
      const readRate = successfulDeliveries > 0 ? (read / successfulDeliveries) * 100 : 0;

      return {
        total,
        sent,
        delivered,
        read,
        failed,
        deliveryRate,
        readRate,
      } as WhatsAppMetrics;
    },
    staleTime: 10000,
    refetchInterval: 15000,
  });
}
```

## Resultado Esperado

Após a correção, os cards exibirão:

| Métrica | Valor Correto |
|---------|---------------|
| Total Enviadas | 3.976 |
| Taxa de Entrega | ~34.7% |
| Taxa de Leitura | ~7.3% |
| Com Erro | 773 |

## Benefícios

1. **Precisão**: Contagem exata de todos os registros
2. **Performance**: Queries `head: true` são mais rápidas (não transferem dados)
3. **Consistência**: Mesma abordagem usada no relatório de emails
4. **Paralelismo**: 5 queries executadas simultaneamente via `Promise.all`
