/**
 * Masks a phone number showing only the last 4 digits.
 * Example: "5561999991234" → "***1234"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return "***";
  return `***${cleaned.slice(-4)}`;
}
