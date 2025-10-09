import { supabase } from "@/integrations/supabase/client";
import type {
  OfficeCity,
  OfficeLeader,
  OfficeContact,
  OfficeVisit,
  OfficeVisitForm,
  OfficeSettings,
  CreateOfficeVisitDTO,
  SubmitOfficeFormDTO,
  OfficeVisitsFilters,
  OfficeVisitWithForm
} from "@/types/office";

// =====================================================
// UTILITIES
// =====================================================

/**
 * Normaliza telefone brasileiro para formato E.164
 * Entrada: (61) 99999-9999 ou 61999999999
 * Saída: +5561999999999
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  // Se já tem código do país, apenas adiciona +
  if (digits.startsWith("55")) {
    return `+${digits}`;
  }
  
  // Adiciona código do país
  return `+55${digits}`;
}

/**
 * Formata telefone E.164 para exibição BR
 * Entrada: +5561999999999
 * Saída: (61) 99999-9999
 */
export function formatPhoneBR(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ddd = digits.slice(2, 4);
  const firstPart = digits.slice(4, 9);
  const secondPart = digits.slice(9);
  
  return `(${ddd}) ${firstPart}-${secondPart}`;
}

/**
 * Gera um token mock (HMAC/JWT simulado)
 * Em produção, usar biblioteca JWT real
 */
export function generateMockToken(visitId: string, userId: string, leaderId: string): string {
  const payload = {
    visit_id: visitId,
    user_id: userId,
    leader_id: leaderId,
    exp: Date.now() + 2 * 60 * 60 * 1000 // 2h
  };
  
  return btoa(JSON.stringify(payload));
}

/**
 * Valida token mock
 */
export function validateMockToken(token: string): { valid: boolean; payload?: any } {
  try {
    const payload = JSON.parse(atob(token));
    
    if (payload.exp < Date.now()) {
      return { valid: false };
    }
    
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

// =====================================================
// CITIES
// =====================================================

export async function getCities() {
  const { data, error } = await supabase
    .from("office_cities")
    .select("*")
    .eq("status", "active")
    .order("nome");
  
  if (error) throw error;
  return data as OfficeCity[];
}

export async function getCityById(id: string) {
  const { data, error } = await supabase
    .from("office_cities")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data as OfficeCity;
}

// =====================================================
// LEADERS
// =====================================================

export async function getLeaders(filters?: { cidade_id?: string; search?: string }) {
  let query = supabase
    .from("office_leaders")
    .select("*, cidade:office_cities(*)")
    .eq("status", "active");
  
  if (filters?.cidade_id) {
    query = query.eq("cidade_id", filters.cidade_id);
  }
  
  if (filters?.search) {
    query = query.ilike("nome_completo", `%${filters.search}%`);
  }
  
  query = query.order("nome_completo");
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as OfficeLeader[];
}

export async function getLeadersByCity(cityId: string) {
  return getLeaders({ cidade_id: cityId });
}

// =====================================================
// CONTACTS
// =====================================================

export async function findContactByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  
  const { data, error } = await supabase
    .from("office_contacts")
    .select("*, cidade:office_cities(*)")
    .eq("telefone_norm", normalized)
    .maybeSingle();
  
  if (error) throw error;
  return data as OfficeContact | null;
}

export async function createOrUpdateContact(
  nome: string,
  telefone: string,
  cidade_id: string
): Promise<OfficeContact> {
  const telefone_norm = normalizePhone(telefone);
  
  const existing = await findContactByPhone(telefone);
  
  if (existing) {
    const { data, error } = await supabase
      .from("office_contacts")
      .update({ nome, cidade_id })
      .eq("id", existing.id)
      .select("*, cidade:office_cities(*)")
      .single();
    
    if (error) throw error;
    return data as OfficeContact;
  }
  
  const { data, error } = await supabase
    .from("office_contacts")
    .insert({ nome, telefone_norm, cidade_id })
    .select("*, cidade:office_cities(*)")
    .single();
  
  if (error) throw error;
  return data as OfficeContact;
}

// =====================================================
// VISITS
// =====================================================

export async function getVisits(filters?: OfficeVisitsFilters) {
  let query = supabase
    .from("office_visits")
    .select(`
      *,
      contact:office_contacts(*),
      leader:office_leaders(*),
      city:office_cities(*)
    `);
  
  if (filters?.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }
  
  if (filters?.cidade_id) {
    query = query.eq("city_id", filters.cidade_id);
  }
  
  if (filters?.leader_id) {
    query = query.eq("leader_id", filters.leader_id);
  }
  
  if (filters?.search) {
    // Busca por protocolo
    query = query.ilike("protocolo", `%${filters.search}%`);
  }
  
  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  
  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to);
  }
  
  query = query.order("created_at", { ascending: false });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as OfficeVisit[];
}

export async function getVisitById(id: string) {
  const { data, error } = await supabase
    .from("office_visits")
    .select(`
      *,
      contact:office_contacts(*),
      leader:office_leaders(*),
      city:office_cities(*)
    `)
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data as OfficeVisit;
}

export async function getVisitByProtocol(protocolo: string) {
  const { data, error } = await supabase
    .from("office_visits")
    .select(`
      *,
      contact:office_contacts(*),
      leader:office_leaders(*),
      city:office_cities(*)
    `)
    .eq("protocolo", protocolo)
    .maybeSingle();
  
  if (error) throw error;
  return data as OfficeVisit | null;
}

export async function createVisit(dto: CreateOfficeVisitDTO, userId: string) {
  const contact = await createOrUpdateContact(
    dto.nome,
    dto.whatsapp,
    dto.cidade_id
  );
  
  const { data: protocolData, error: protocolError } = await supabase
    .rpc("generate_office_protocol", { _prefix: "RP-GB" });
  
  if (protocolError) throw protocolError;
  const protocolo = protocolData as string;
  
  const token = generateMockToken("pending", contact.id, dto.leader_id);
  const token_expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("office_visits")
    .insert({
      protocolo,
      contact_id: contact.id,
      leader_id: dto.leader_id,
      city_id: dto.cidade_id,
      status: "REGISTERED",
      token,
      token_expires_at,
      created_by: userId
    })
    .select(`
      *,
      contact:office_contacts(*),
      leader:office_leaders(*),
      city:office_cities(*)
    `)
    .single();
  
  if (error) throw error;
  return data as OfficeVisit;
}

export async function updateVisitStatus(id: string, status: OfficeVisit["status"]) {
  const { data, error } = await supabase
    .from("office_visits")
    .update({ status })
    .eq("id", id)
    .select(`
      *,
      contact:office_contacts(*),
      leader:office_leaders(*),
      city:office_cities(*)
    `)
    .single();
  
  if (error) throw error;
  return data as OfficeVisit;
}

// =====================================================
// VISIT FORMS
// =====================================================

export async function submitForm(dto: SubmitOfficeFormDTO) {
  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [day, month, year] = dto.data_nascimento.split("/");
  const data_nascimento = `${year}-${month}-${day}`;
  
  const { data, error } = await supabase
    .from("office_visit_forms")
    .insert({
      visit_id: dto.visit_id,
      endereco: dto.endereco,
      data_nascimento,
      aceita_reuniao: dto.aceita_reuniao,
      continua_projeto: dto.continua_projeto,
      instagram: dto.instagram,
      facebook: dto.facebook,
      observacoes: dto.observacoes,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Atualizar status da visita
  await updateVisitStatus(dto.visit_id, "FORM_SUBMITTED");
  
  return data as OfficeVisitForm;
}

export async function getVisitWithForm(visitId: string) {
  const visit = await getVisitById(visitId);
  
  const { data: form } = await supabase
    .from("office_visit_forms")
    .select("*")
    .eq("visit_id", visitId)
    .maybeSingle();
  
  return {
    ...visit,
    form: form || undefined
  } as OfficeVisitWithForm;
}

// =====================================================
// SETTINGS
// =====================================================

export async function getSettings() {
  const { data, error } = await supabase
    .from("office_settings")
    .select("*")
    .maybeSingle();
  
  if (error) throw error;
  
  if (!data) {
    const { data: newSettings, error: createError } = await supabase
      .from("office_settings")
      .insert({
        protocolo_prefix: "RP-GB",
        pontos_form_submitted: 1,
        pontos_aceita_reuniao: 3,
        webhook_url: "https://webhook.escaladigital.ai/webhook/gabinete/envio-formulario"
      })
      .select()
      .single();
    
    if (createError) throw createError;
    return newSettings as OfficeSettings;
  }
  
  return data as OfficeSettings;
}

export async function updateSettings(updates: Partial<OfficeSettings>) {
  const { data: existing } = await supabase
    .from("office_settings")
    .select("id")
    .maybeSingle();

  if (!existing) throw new Error("Settings not found");

  const { data, error } = await supabase
    .from("office_settings")
    .update(updates)
    .eq("id", existing.id)
    .select()
    .single();
  
  if (error) throw error;
  return data as OfficeSettings;
}
