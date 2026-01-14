import { PRODUCTION_URL } from "./urlHelper";

/**
 * Gera a URL pública de cadastro do evento
 * SEMPRE usa URL de produção (enviado externamente via QR Code)
 */
export function generateEventUrl(slug: string): string {
  return `${PRODUCTION_URL}/eventos/${slug}`;
}

/**
 * Gera a URL de cadastro do evento com parâmetros UTM
 */
export function generateEventUrlWithTracking(
  slug: string,
  trackingCode: string
): string {
  const params = new URLSearchParams({
    utm_source: 'qr',
    utm_medium: 'offline',
    utm_campaign: `evento_${slug}`,
    utm_content: trackingCode
  });
  return `${generateEventUrl(slug)}?${params.toString()}`;
}
