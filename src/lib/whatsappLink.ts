/**
 * Gera link do WhatsApp usando api.whatsapp.com/send
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const params = new URLSearchParams({ phone: cleanPhone });
  if (message) {
    params.set("text", message);
  }
  return `https://api.whatsapp.com/send/?${params.toString()}`;
}
