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
 * Gera o link de check-in da visita
 */
export function generateVisitCheckinUrl(qrCode: string): string {
  return `${getBaseUrl()}/office/checkin/${qrCode}`;
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
 * Gera link de evento com parâmetros UTM de campanha
 */
export function generateEventCampaignUrl(
  eventSlug: string,
  utmSource: string,
  utmMedium: string,
  utmCampaign: string
): string {
  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign
  });
  return `${getBaseUrl()}/eventos/${eventSlug}?${params.toString()}`;
}

/**
 * Gera link de indicação de líder (formulário de cadastro)
 */
export function generateLeaderReferralUrl(affiliateToken: string): string {
  return `${getBaseUrl()}/cadastro/${affiliateToken}`;
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

/**
 * Gera o link do formulário público de cadastro de líderes
 */
export function generateLeaderRegistrationUrl(): string {
  return `${getBaseUrl()}/lider/cadastro`;
}

/**
 * Gera link de funil de captação com parâmetros UTM de campanha
 */
export function generateFunnelCampaignUrl(
  funnelSlug: string,
  utmSource: string,
  utmMedium: string,
  utmCampaign: string
): string {
  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign
  });
  return `${getBaseUrl()}/captacao/${funnelSlug}?${params.toString()}`;
}

/**
 * Gera link de descadastro com token
 */
export function generateUnsubscribeUrl(token: string): string {
  return `${getBaseUrl()}/descadastro?token=${token}`;
}
