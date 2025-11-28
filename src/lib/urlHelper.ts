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

/**
 * Gera link de campanha UTM para cadastro
 */
export function generateCampaignUrl(utmSource: string, utmMedium: string, utmCampaign: string): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign
  });
  return `${baseUrl}/cadastro?${params.toString()}`;
}

/**
 * Gera link de indicação de líder
 */
export function generateLeaderReferralUrl(personalCode: string): string {
  return `${getBaseUrl()}/indicacao/${personalCode}`;
}

/**
 * Gera link de afiliado
 */
export function generateAffiliateUrl(affiliateToken: string): string {
  return `${getBaseUrl()}/affiliate/${affiliateToken}`;
}

/**
 * Gera link de cadastro para evento com tracking
 */
export function generateEventRegistrationUrl(
  eventSlug: string, 
  eventId: string, 
  trackingCode: string
): string {
  const params = new URLSearchParams({
    utm_source: 'qr',
    utm_medium: 'offline',
    utm_campaign: `evento_${eventId.substring(0, 8)}`,
    utm_content: trackingCode
  });
  return `${getBaseUrl()}/eventos/${eventSlug}?${params.toString()}`;
}

/**
 * Gera link de afiliado para evento
 */
export function generateEventAffiliateUrl(eventSlug: string, affiliateToken: string): string {
  return `${getBaseUrl()}/eventos/${eventSlug}?ref=${affiliateToken}`;
}
