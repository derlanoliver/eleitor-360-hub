/**
 * URL de produção fixa - NUNCA muda baseado no ambiente.
 * Use para TODAS as URLs enviadas externamente (SMS, Email, WhatsApp).
 */
export const PRODUCTION_URL = "https://app.rafaelprudente.com";

/**
 * Retorna SEMPRE a URL de produção.
 * Use para URLs que serão enviadas externamente (SMS, Email, WhatsApp).
 * 
 * IMPORTANTE: Esta função NUNCA deve usar window.location para evitar
 * que URLs de preview sejam enviadas em comunicações externas.
 */
export function getProductionUrl(): string {
  return PRODUCTION_URL;
}

/**
 * Valida e corrige URLs antes de enviar externamente.
 * Se detectar URL de preview ou localhost, corrige automaticamente.
 */
export function validateExternalUrl(url: string): string {
  if (url.includes('lovableproject.com') || url.includes('localhost') || url.includes('lovable.app')) {
    console.warn('[URL PROTECTION] Tentativa de usar URL de preview em comunicação externa! Corrigindo automaticamente...');
    return url.replace(/https?:\/\/[^/]+/, PRODUCTION_URL);
  }
  return url;
}

/**
 * Retorna a URL base da aplicação.
 * - No navegador: usa o domínio atual (funciona no preview e em domínio customizado)
 * - Fallback: domínio de produção
 * 
 * ⚠️ ATENÇÃO: NÃO USE para URLs externas (SMS, Email, WhatsApp)!
 * Para comunicações externas, use getProductionUrl() ou as funções específicas.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin;
    
    // TRAVA: Detectar ambiente de preview e alertar
    if (origin.includes('lovableproject.com') || origin.includes('localhost') || origin.includes('lovable.app')) {
      console.warn('[ATENÇÃO] getBaseUrl() chamado em ambiente de preview! Para URLs externas, use getProductionUrl().');
    }
    
    return origin;
  }
  return PRODUCTION_URL;
}

/**
 * Gera o link do formulário de visita
 * SEMPRE usa URL de produção (enviado externamente via SMS)
 */
export function generateVisitFormUrl(visitId: string): string {
  return `${PRODUCTION_URL}/visita-gabinete/${visitId}`;
}

/**
 * Gera o link de check-in da visita
 */
export function generateVisitCheckinUrl(qrCode: string): string {
  return `${getBaseUrl()}/office/checkin/${qrCode}`;
}

/**
 * Gera link de campanha UTM para cadastro
 * SEMPRE usa URL de produção (pode ser enviado externamente via QR Code)
 */
export function generateCampaignUrl(utmSource: string, utmMedium: string, utmCampaign: string): string {
  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign
  });
  // Campanhas sem token devem apontar para o formulário público
  return `${PRODUCTION_URL}/lider/cadastro?${params.toString()}`;
}

/**
 * Gera link de evento com parâmetros UTM de campanha
 * SEMPRE usa URL de produção (pode ser enviado externamente via QR Code)
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
  return `${PRODUCTION_URL}/eventos/${eventSlug}?${params.toString()}`;
}

/**
 * Gera link de indicação de líder (formulário de cadastro)
 * SEMPRE usa URL de produção (enviado externamente)
 */
export function generateLeaderReferralUrl(affiliateToken: string): string {
  return `${PRODUCTION_URL}/cadastro/${affiliateToken}`;
}

/**
 * Gera link de afiliado
 * SEMPRE usa URL de produção (enviado externamente)
 */
export function generateAffiliateUrl(affiliateToken: string): string {
  return `${PRODUCTION_URL}/affiliate/${affiliateToken}`;
}

/**
 * Gera link de verificação de líder
 * SEMPRE usa URL de produção (enviado externamente via SMS/Email)
 */
export function generateLeaderVerificationUrl(verificationCode: string): string {
  return `${PRODUCTION_URL}/verificar-lider/${verificationCode}`;
}

/**
 * Gera link de cadastro para evento com tracking
 * SEMPRE usa URL de produção (usado em QR Codes)
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
  return `${PRODUCTION_URL}/eventos/${eventSlug}?${params.toString()}`;
}

/**
 * Gera link de afiliado para evento
 * SEMPRE usa URL de produção (enviado externamente)
 */
export function generateEventAffiliateUrl(eventSlug: string, affiliateToken: string): string {
  return `${PRODUCTION_URL}/eventos/${eventSlug}?ref=${affiliateToken}`;
}

/**
 * Gera o link do formulário público de cadastro de líderes
 * SEMPRE usa URL de produção (pode ser compartilhado externamente)
 */
export function generateLeaderRegistrationUrl(): string {
  return `${PRODUCTION_URL}/lider/cadastro`;
}

/**
 * Gera link de funil de captação com parâmetros UTM de campanha
 * SEMPRE usa URL de produção (pode ser enviado externamente via QR Code)
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
  return `${PRODUCTION_URL}/captacao/${funnelSlug}?${params.toString()}`;
}

/**
 * Gera link de descadastro com token
 * SEMPRE usa URL de produção (enviado externamente via Email)
 */
export function generateUnsubscribeUrl(token: string): string {
  return `${PRODUCTION_URL}/descadastro?token=${token}`;
}

/**
 * Gera link de pesquisa com afiliado
 * SEMPRE usa URL de produção (enviado externamente)
 */
export function generateSurveyAffiliateUrl(surveySlug: string, affiliateToken: string): string {
  return `${PRODUCTION_URL}/pesquisa/${surveySlug}?ref=${affiliateToken}`;
}

/**
 * Gera link curto de verificação de contato
 * SEMPRE usa URL de produção (enviado externamente via SMS)
 * Formato: /v/:codigo (apenas 5 caracteres após /v/)
 */
export function generateVerificationUrl(verificationCode: string): string {
  return `${PRODUCTION_URL}/v/${verificationCode}`;
}
