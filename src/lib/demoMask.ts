/**
 * Demo Mode Data Masking Utilities
 * Masks sensitive data for presentation/demo purposes
 */

const FAKE_FIRST_NAMES = [
  "Ana", "Carlos", "Maria", "João", "Paula", "Pedro", "Luísa", "Rafael",
  "Fernanda", "Lucas", "Beatriz", "Gabriel", "Juliana", "Thiago", "Camila",
  "Bruno", "Larissa", "Diego", "Amanda", "Felipe", "Isabela", "Rodrigo",
  "Patrícia", "Gustavo", "Vanessa", "André", "Renata", "Marcos", "Tatiana", "Henrique"
];

const FAKE_LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Ferreira",
  "Almeida", "Nascimento", "Lima", "Araújo", "Melo", "Barbosa", "Ribeiro",
  "Martins", "Rocha", "Carvalho", "Gomes", "Monteiro", "Dias"
];

const FAKE_CITIES = [
  "Águas Claras", "Taguatinga", "Ceilândia", "Samambaia", "Plano Piloto",
  "Gama", "Sobradinho", "Planaltina", "Recanto das Emas", "Santa Maria"
];

// Seed-based pseudo-random to get consistent masking per item
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function pickFromArray<T>(arr: T[], seed: string): T {
  const index = seededRandom(seed) % arr.length;
  return arr[index];
}

/**
 * Masks a person's name with a fake but realistic name
 * Same input always produces the same output (deterministic)
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return "Nome Oculto";
  const seed = name.toLowerCase().trim();
  const firstName = pickFromArray(FAKE_FIRST_NAMES, seed);
  const lastName = pickFromArray(FAKE_LAST_NAMES, seed + "_last");
  return `${firstName} ${lastName}`;
}

/**
 * Masks a phone number: (61) 9****-**34
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "(--) -----‑----";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) {
    const lastTwo = digits.slice(-2);
    return `(${digits.slice(0, 2) || "XX"}) 9****-**${lastTwo}`;
  }
  return "(XX) 9****-****";
}

/**
 * Masks an email: j***@***.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "***@***.com";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***.com";
  const firstChar = local.charAt(0);
  const domainParts = domain.split(".");
  const ext = domainParts.pop() || "com";
  return `${firstChar}***@***.${ext}`;
}

/**
 * Masks an address
 */
export function maskAddress(address: string | null | undefined): string {
  if (!address) return "";
  // Keep only the first word (street type like "Rua", "Av.") + generic
  const parts = address.split(/\s+/);
  const prefix = parts[0] || "Rua";
  return `${prefix} ***, Nº **`;
}

/**
 * Masks a numeric value by applying a random-ish multiplier
 * Makes numbers look realistic but different from real data
 * Deterministic based on a label
 */
export function maskNumber(value: number, label: string = ""): number {
  if (value === 0) return 0;
  const seed = seededRandom(label || String(value));
  // Multiplier between 0.7 and 1.5
  const multiplier = 0.7 + (seed % 80) / 100;
  return Math.round(value * multiplier);
}

/**
 * Masks a percentage (keeps it realistic 0-100)
 */
export function maskPercentage(value: number, label: string = ""): number {
  const seed = seededRandom(label || String(value));
  const offset = -10 + (seed % 20);
  return Math.max(0, Math.min(100, Math.round(value + offset)));
}

/**
 * Masks a city name
 */
export function maskCity(city: string | null | undefined): string {
  if (!city) return "Cidade Oculta";
  return pickFromArray(FAKE_CITIES, city.toLowerCase());
}

/**
 * Masks a date of birth (shifts by a random number of days)
 */
export function maskDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const shift = seededRandom(dateStr) % 365;
    date.setDate(date.getDate() + shift);
    return date.toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

/**
 * Masks social media handles
 */
export function maskSocialHandle(handle: string | null | undefined): string {
  if (!handle) return "";
  return `@usuario_${seededRandom(handle) % 9999}`;
}

/**
 * Masks an observation/note text
 */
export function maskObservation(text: string | null | undefined): string {
  if (!text) return "";
  return "Observação oculta no modo demonstração";
}

/**
 * Generic record masker - masks common fields in any object
 */
export function maskRecord<T extends Record<string, unknown>>(record: T): T {
  const masked = { ...record };

  // Name fields
  const nameFields = ["nome", "nome_completo", "name", "to_name"];
  for (const field of nameFields) {
    if (field in masked && typeof masked[field] === "string") {
      (masked as Record<string, unknown>)[field] = maskName(masked[field] as string);
    }
  }

  // Phone fields
  const phoneFields = ["telefone", "telefone_norm", "whatsapp", "phone"];
  for (const field of phoneFields) {
    if (field in masked && typeof masked[field] === "string") {
      (masked as Record<string, unknown>)[field] = maskPhone(masked[field] as string);
    }
  }

  // Email fields
  const emailFields = ["email", "to_email"];
  for (const field of emailFields) {
    if (field in masked && typeof masked[field] === "string") {
      (masked as Record<string, unknown>)[field] = maskEmail(masked[field] as string);
    }
  }

  // Address fields
  if ("endereco" in masked && typeof masked.endereco === "string") {
    (masked as Record<string, unknown>).endereco = maskAddress(masked.endereco as string);
  }

  // Social media
  if ("facebook" in masked && typeof masked.facebook === "string") {
    (masked as Record<string, unknown>).facebook = maskSocialHandle(masked.facebook as string);
  }
  if ("instagram" in masked && typeof masked.instagram === "string") {
    (masked as Record<string, unknown>).instagram = maskSocialHandle(masked.instagram as string);
  }

  // Observation
  if ("observacao" in masked && typeof masked.observacao === "string") {
    (masked as Record<string, unknown>).observacao = maskObservation(masked.observacao as string);
  }

  // Date of birth
  if ("data_nascimento" in masked && typeof masked.data_nascimento === "string") {
    (masked as Record<string, unknown>).data_nascimento = maskDate(masked.data_nascimento as string);
  }

  return masked;
}

/**
 * Masks an array of records
 */
export function maskRecords<T extends Record<string, unknown>>(records: T[]): T[] {
  return records.map(r => maskRecord(r));
}
