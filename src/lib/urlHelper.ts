/**
 * Retorna a URL base da aplicação
 * Fixada para app.rafaelprudente.com
 */
export function getBaseUrl(): string {
  return "https://app.rafaelprudente.com";
}

/**
 * Gera o link do formulário de visita
 */
export function generateVisitFormUrl(visitId: string): string {
  return `${getBaseUrl()}/visita-gabinete/${visitId}`;
}
