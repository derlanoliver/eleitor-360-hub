export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      lideres: {
        Row: {
          cadastros: number
          cidade_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          join_date: string | null
          last_activity: string | null
          nome_completo: string
          pontuacao_total: number
          status: Database["public"]["Enums"]["office_leader_status"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cadastros?: number
          cidade_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          join_date?: string | null
          last_activity?: string | null
          nome_completo: string
          pontuacao_total?: number
          status?: Database["public"]["Enums"]["office_leader_status"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cadastros?: number
          cidade_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          join_date?: string | null
          last_activity?: string | null
          nome_completo?: string
          pontuacao_total?: number
          status?: Database["public"]["Enums"]["office_leader_status"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lideres_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "office_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      office_cities: {
        Row: {
          codigo_ra: string
          created_at: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["office_city_status"]
          updated_at: string
        }
        Insert: {
          codigo_ra: string
          created_at?: string
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["office_city_status"]
          updated_at?: string
        }
        Update: {
          codigo_ra?: string
          created_at?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["office_city_status"]
          updated_at?: string
        }
        Relationships: []
      }
      office_contacts: {
        Row: {
          cidade_id: string
          created_at: string
          data_nascimento: string | null
          endereco: string | null
          facebook: string | null
          id: string
          instagram: string | null
          nome: string
          telefone_norm: string
          updated_at: string
        }
        Insert: {
          cidade_id: string
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          nome: string
          telefone_norm: string
          updated_at?: string
        }
        Update: {
          cidade_id?: string
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          nome?: string
          telefone_norm?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_contacts_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "office_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      office_settings: {
        Row: {
          created_at: string
          id: string
          pontos_aceita_reuniao: number
          pontos_form_submitted: number
          protocolo_prefix: string
          sound_notification_url: string | null
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          pontos_aceita_reuniao?: number
          pontos_form_submitted?: number
          protocolo_prefix?: string
          sound_notification_url?: string | null
          updated_at?: string
          webhook_url?: string
        }
        Update: {
          created_at?: string
          id?: string
          pontos_aceita_reuniao?: number
          pontos_form_submitted?: number
          protocolo_prefix?: string
          sound_notification_url?: string | null
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      office_visit_forms: {
        Row: {
          aceita_reuniao: boolean
          continua_projeto: boolean
          created_at: string
          data_nascimento: string
          endereco: string
          facebook: string | null
          id: string
          instagram: string | null
          observacoes: string | null
          submitted_at: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          aceita_reuniao: boolean
          continua_projeto: boolean
          created_at?: string
          data_nascimento: string
          endereco: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          observacoes?: string | null
          submitted_at?: string | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          aceita_reuniao?: boolean
          continua_projeto?: boolean
          created_at?: string
          data_nascimento?: string
          endereco?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          observacoes?: string | null
          submitted_at?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_visit_forms_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "office_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      office_visits: {
        Row: {
          city_id: string
          contact_id: string
          created_at: string
          created_by: string
          id: string
          leader_id: string
          protocolo: string
          status: Database["public"]["Enums"]["office_visit_status"]
          token: string | null
          token_expires_at: string | null
          updated_at: string
          webhook_error: string | null
          webhook_last_status: number | null
          webhook_sent_at: string | null
        }
        Insert: {
          city_id: string
          contact_id: string
          created_at?: string
          created_by: string
          id?: string
          leader_id: string
          protocolo: string
          status?: Database["public"]["Enums"]["office_visit_status"]
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          webhook_error?: string | null
          webhook_last_status?: number | null
          webhook_sent_at?: string | null
        }
        Update: {
          city_id?: string
          contact_id?: string
          created_at?: string
          created_by?: string
          id?: string
          leader_id?: string
          protocolo?: string
          status?: Database["public"]["Enums"]["office_visit_status"]
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          webhook_error?: string | null
          webhook_last_status?: number | null
          webhook_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_visits_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "office_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_visits_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_visits_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_demografico: {
        Row: {
          created_at: string
          genero: string
          id: string
          valor: number
        }
        Insert: {
          created_at?: string
          genero: string
          id?: string
          valor: number
        }
        Update: {
          created_at?: string
          genero?: string
          id?: string
          valor?: number
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_login?: string | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      regiao_administrativa: {
        Row: {
          cadastros: number
          created_at: string
          id: string
          ra: string
          updated_at: string
        }
        Insert: {
          cadastros?: number
          created_at?: string
          id?: string
          ra: string
          updated_at?: string
        }
        Update: {
          cadastros?: number
          created_at?: string
          id?: string
          ra?: string
          updated_at?: string
        }
        Relationships: []
      }
      temas: {
        Row: {
          cadastros: number
          created_at: string
          id: string
          tema: string
          updated_at: string
        }
        Insert: {
          cadastros?: number
          created_at?: string
          id?: string
          tema: string
          updated_at?: string
        }
        Update: {
          cadastros?: number
          created_at?: string
          id?: string
          tema?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_login?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_office_protocol: {
        Args: { _prefix?: string } | { _prefix?: string; _tenant_id: string }
        Returns: string
      }
      get_user_context: {
        Args: { user_id: string }
        Returns: {
          accessible_tenants: string[]
          user_data: Json
          user_type: string
        }[]
      }
      grant_role_by_email: {
        Args: {
          _email: string
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_slug?: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "super_user"
        | "admin"
        | "atendente"
        | "checkin_operator"
      office_city_status: "active" | "inactive"
      office_leader_status: "active" | "inactive"
      office_visit_status:
        | "REGISTERED"
        | "LINK_SENT"
        | "FORM_OPENED"
        | "FORM_SUBMITTED"
        | "CHECKED_IN"
        | "CANCELLED"
      tenant_status: "active" | "suspended" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "super_user",
        "admin",
        "atendente",
        "checkin_operator",
      ],
      office_city_status: ["active", "inactive"],
      office_leader_status: ["active", "inactive"],
      office_visit_status: [
        "REGISTERED",
        "LINK_SENT",
        "FORM_OPENED",
        "FORM_SUBMITTED",
        "CHECKED_IN",
        "CANCELLED",
      ],
      tenant_status: ["active", "suspended", "cancelled"],
    },
  },
} as const
