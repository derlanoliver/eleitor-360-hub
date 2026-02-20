import { ReactNode } from "react";
import { useMonitoredEntities } from "@/hooks/public-opinion/usePublicOpinion";
import { usePublicOpinionRealtime } from "@/hooks/public-opinion/usePublicOpinionRealtime";

interface Props {
  children: ReactNode;
}

/**
 * Provider que ativa as subscriptions Realtime do módulo de Opinião Pública.
 * Deve envolver todas as páginas do módulo para garantir atualizações em tempo real.
 */
function RealtimeActivator() {
  const { data: entities } = useMonitoredEntities();
  const principalEntity = entities?.find(e => e.is_principal) || entities?.[0];
  usePublicOpinionRealtime(principalEntity?.id);
  return null;
}

export function PublicOpinionRealtimeProvider({ children }: Props) {
  return (
    <>
      <RealtimeActivator />
      {children}
    </>
  );
}
