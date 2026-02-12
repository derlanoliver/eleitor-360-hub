/**
 * Gera link do WhatsApp compatível com desktop e mobile.
 * - Mobile: usa wa.me (abre o app diretamente)
 * - Desktop: usa web.whatsapp.com/send (evita bloqueio do api.whatsapp.com)
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const isMobile = typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  if (isMobile) {
    const params = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${cleanPhone}${params}`;
  }

  const params = message
    ? `?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
    : `?phone=${cleanPhone}`;
  return `https://web.whatsapp.com/send${params}`;
}
