// =====================================================
// TIPOS DO MÓDULO GABINETE
// =====================================================

export type OfficeVisitStatus =
  | "REGISTERED"
  | "LINK_SENT"
  | "FORM_OPENED"
  | "FORM_SUBMITTED"
  | "CHECKED_IN"
  | "CANCELLED";

export type OfficeCityStatus = "active" | "inactive";
export type OfficeLeaderStatus = "active" | "inactive";

// =====================================================
// INTERFACES PRINCIPAIS
// =====================================================

export interface OfficeCity {
  id: string;
  nome: string;
  codigo_ra: string;
  status: OfficeCityStatus;
  created_at: string;
  updated_at: string;
}

export interface OfficeLeader {
  id: string;
  nome_completo: string;
  email?: string;
  telefone?: string;
  cidade_id?: string;
  cidade?: OfficeCity; // populated join
  status: OfficeLeaderStatus;
  pontuacao_total: number;
  cadastros: number;
  is_active: boolean;
  affiliate_token?: string;
  last_activity?: string;
  join_date?: string;
  data_nascimento?: string; // YYYY-MM-DD
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export interface OfficeContact {
  id: string;
  nome: string;
  telefone_norm: string; // E.164 format (+5561999999999)
  cidade_id: string;
  cidade?: OfficeCity;
  endereco?: string;
  data_nascimento?: string; // YYYY-MM-DD
  instagram?: string;
  facebook?: string;
  genero?: "Masculino" | "Feminino" | "Não identificado";
  source_type?: "manual" | "lider" | "campanha";
  source_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OfficeVisit {
  id: string;
  protocolo: string;
  contact_id: string;
  contact?: OfficeContact;
  leader_id: string;
  leader?: OfficeLeader;
  city_id: string;
  city?: OfficeCity;
  status: OfficeVisitStatus;
  token?: string;
  token_expires_at?: string;
  webhook_sent_at?: string;
  webhook_last_status?: number | null;
  webhook_error?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OfficeVisitForm {
  id: string;
  visit_id: string;
  endereco: string;
  data_nascimento: string; // YYYY-MM-DD
  aceita_reuniao: boolean;
  continua_projeto: boolean;
  instagram: string;
  facebook: string;
  observacoes: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OfficeSettings {
  id: string;
  protocolo_prefix: string;
  sound_notification_url?: string;
  pontos_form_submitted: number;
  pontos_aceita_reuniao: number;
  webhook_url: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// DTOs PARA FORMULÁRIOS
// =====================================================

export interface CreateLeaderDTO {
  nome_completo: string;
  email?: string;
  telefone?: string;
  cidade_id?: string;
  is_active: boolean;
  data_nascimento?: string; // YYYY-MM-DD
  observacao?: string;
}

export interface UpdateLeaderDTO {
  nome_completo?: string;
  email?: string;
  telefone?: string;
  cidade_id?: string;
  is_active?: boolean;
  data_nascimento?: string; // YYYY-MM-DD
  observacao?: string;
}

export interface CreateOfficeVisitDTO {
  nome: string;
  whatsapp: string; // Formato BR (61) 99999-9999
  cidade_id: string;
  leader_id: string;
}

export interface SubmitOfficeFormDTO {
  visit_id: string;
  endereco: string;
  data_nascimento: string; // DD/MM/YYYY
  aceita_reuniao: boolean;
  continua_projeto: boolean;
  instagram: string;
  facebook: string;
  observacoes: string;
}

export interface UpdateOfficeVisitDTO {
  nome?: string;
  whatsapp?: string;
  cidade_id?: string;
  leader_id?: string;
}

export interface CreateAffiliateVisitDTO {
  leader_token: string;
  nome: string;
  telefone: string;
  cidade_id: string;
  endereco: string;
  data_nascimento: string;
  instagram: string;
  facebook: string;
  aceita_reuniao: boolean;
  continua_projeto: boolean;
  observacoes: string;
}

// =====================================================
// TYPES AUXILIARES
// =====================================================

export interface OfficeVisitWithForm extends OfficeVisit {
  form?: OfficeVisitForm;
}

export interface WebhookPayload {
  user_id: string; // contact_id
  city_id: string;
  leader_id: string;
  whatsapp: string; // E.164 format
  nome: string;
  form_link: string;
}

export interface OfficeEvent {
  type: 
    | "visit_registered"
    | "webhook_sent"
    | "webhook_failed"
    | "form_opened"
    | "form_submitted"
    | "checkin_done"
    | "visit_updated"
    | "token_invalid";
  visit_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// =====================================================
// FILTROS
// =====================================================

export interface OfficeVisitsFilters {
  status?: OfficeVisitStatus[];
  cidade_id?: string;
  leader_id?: string;
  search?: string; // busca por nome/telefone/protocolo
  date_from?: string;
  date_to?: string;
}
