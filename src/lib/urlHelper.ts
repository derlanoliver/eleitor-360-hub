/**
 * Retorna a URL base da aplicação
 * Em produção: usa window.location.origin
 * Em desenvolvimento: também usa window.location.origin
 */
export function getBaseUrl(): string {
  return window.location.origin;
}

/**
 * Gera o link do formulário de visita
 */
export function generateVisitFormUrl(visitId: string, leaderId: string, userId: string): string {
  return `${getBaseUrl()}/visita-gabinete/${visitId}/${leaderId}/${userId}`;
}
