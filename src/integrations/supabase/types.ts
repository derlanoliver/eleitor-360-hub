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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          files: Json | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          files?: Json | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          files?: Json | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          affiliate_form_cover_url: string | null
          affiliate_form_logo_url: string | null
          created_at: string
          facebook_api_token: string | null
          facebook_pixel_code: string | null
          facebook_pixel_id: string | null
          gtm_id: string | null
          id: string
          leader_form_cover_url: string | null
          leader_form_logo_url: string | null
          leader_form_subtitle: string | null
          leader_form_title: string | null
          updated_at: string
        }
        Insert: {
          affiliate_form_cover_url?: string | null
          affiliate_form_logo_url?: string | null
          created_at?: string
          facebook_api_token?: string | null
          facebook_pixel_code?: string | null
          facebook_pixel_id?: string | null
          gtm_id?: string | null
          id?: string
          leader_form_cover_url?: string | null
          leader_form_logo_url?: string | null
          leader_form_subtitle?: string | null
          leader_form_title?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_form_cover_url?: string | null
          affiliate_form_logo_url?: string | null
          created_at?: string
          facebook_api_token?: string | null
          facebook_pixel_code?: string | null
          facebook_pixel_id?: string | null
          gtm_id?: string | null
          id?: string
          leader_form_cover_url?: string | null
          leader_form_logo_url?: string | null
          leader_form_subtitle?: string | null
          leader_form_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          descricao: string | null
          event_id: string | null
          event_slug: string | null
          funnel_id: string | null
          funnel_slug: string | null
          id: string
          nome: string
          status: string
          total_cadastros: number
          updated_at: string
          utm_campaign: string
          utm_medium: string | null
          utm_source: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          event_id?: string | null
          event_slug?: string | null
          funnel_id?: string | null
          funnel_slug?: string | null
          id?: string
          nome: string
          status?: string
          total_cadastros?: number
          updated_at?: string
          utm_campaign: string
          utm_medium?: string | null
          utm_source: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          event_id?: string | null
          event_slug?: string | null
          funnel_id?: string | null
          funnel_slug?: string | null
          id?: string
          nome?: string
          status?: string
          total_cadastros?: number
          updated_at?: string
          utm_campaign?: string
          utm_medium?: string | null
          utm_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "lead_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_activity_log: {
        Row: {
          action: string
          action_by: string | null
          contact_id: string
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          action_by?: string | null
          contact_id: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          action_by?: string | null
          contact_id?: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_downloads: {
        Row: {
          contact_id: string
          downloaded_at: string
          funnel_id: string | null
          funnel_name: string
          id: string
          lead_magnet_nome: string
        }
        Insert: {
          contact_id: string
          downloaded_at?: string
          funnel_id?: string | null
          funnel_name: string
          id?: string
          lead_magnet_nome: string
        }
        Update: {
          contact_id?: string
          downloaded_at?: string
          funnel_id?: string | null
          funnel_name?: string
          id?: string
          lead_magnet_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_downloads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_downloads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "lead_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_page_views: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          page_identifier: string
          page_name: string | null
          page_type: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          page_identifier: string
          page_name?: string | null
          page_type: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          page_identifier?: string
          page_name?: string | null
          page_type?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_page_views_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          contact_id: string | null
          created_at: string
          error_message: string | null
          event_id: string | null
          id: string
          leader_id: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          to_email: string
          to_name: string | null
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          id?: string
          leader_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          to_email: string
          to_name?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          id?: string
          leader_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          to_email?: string
          to_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          assunto: string
          categoria: string
          conteudo_html: string
          created_at: string
          id: string
          is_active: boolean | null
          nome: string
          slug: string
          updated_at: string
          variaveis: Json | null
        }
        Insert: {
          assunto: string
          categoria: string
          conteudo_html: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          nome: string
          slug: string
          updated_at?: string
          variaveis?: Json | null
        }
        Update: {
          assunto?: string
          categoria?: string
          conteudo_html?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          nome?: string
          slug?: string
          updated_at?: string
          variaveis?: Json | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          checked_in: boolean | null
          checked_in_at: string | null
          cidade_id: string | null
          contact_id: string | null
          created_at: string | null
          email: string
          event_id: string
          id: string
          leader_id: string | null
          nome: string
          qr_code: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp: string
        }
        Insert: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          cidade_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          email: string
          event_id: string
          id?: string
          leader_id?: string | null
          nome: string
          qr_code?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp: string
        }
        Update: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          cidade_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          email?: string
          event_id?: string
          id?: string
          leader_id?: string | null
          nome?: string
          qr_code?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "office_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          capacity: number | null
          categories: string[] | null
          checkedin_count: number | null
          checkin_pin: string | null
          cover_image_url: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          location: string
          name: string
          region: string
          registrations_count: number | null
          show_registrations_count: boolean
          slug: string
          status: string
          time: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          categories?: string[] | null
          checkedin_count?: number | null
          checkin_pin?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          location: string
          name: string
          region: string
          registrations_count?: number | null
          show_registrations_count?: boolean
          slug: string
          status?: string
          time: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          categories?: string[] | null
          checkedin_count?: number | null
          checkin_pin?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          region?: string
          registrations_count?: number | null
          show_registrations_count?: boolean
          slug?: string
          status?: string
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      integrations_settings: {
        Row: {
          created_at: string
          id: string
          resend_api_key: string | null
          resend_enabled: boolean | null
          resend_from_email: string | null
          resend_from_name: string | null
          smsdev_api_key: string | null
          smsdev_enabled: boolean | null
          updated_at: string
          zapi_client_token: string | null
          zapi_enabled: boolean | null
          zapi_instance_id: string | null
          zapi_token: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          resend_api_key?: string | null
          resend_enabled?: boolean | null
          resend_from_email?: string | null
          resend_from_name?: string | null
          smsdev_api_key?: string | null
          smsdev_enabled?: boolean | null
          updated_at?: string
          zapi_client_token?: string | null
          zapi_enabled?: boolean | null
          zapi_instance_id?: string | null
          zapi_token?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          resend_api_key?: string | null
          resend_enabled?: boolean | null
          resend_from_email?: string | null
          resend_from_name?: string | null
          smsdev_api_key?: string | null
          smsdev_enabled?: boolean | null
          updated_at?: string
          zapi_client_token?: string | null
          zapi_enabled?: boolean | null
          zapi_instance_id?: string | null
          zapi_token?: string | null
        }
        Relationships: []
      }
      lead_funnels: {
        Row: {
          campos_form: Json
          cor_botao: string | null
          cover_url: string | null
          created_at: string
          cta_adicional_texto: string | null
          cta_adicional_url: string | null
          descricao: string | null
          downloads_count: number
          id: string
          lead_magnet_nome: string
          lead_magnet_url: string
          leads_count: number
          logo_url: string | null
          nome: string
          obrigado_subtitulo: string | null
          obrigado_texto_botao: string
          obrigado_titulo: string
          slug: string
          status: string
          subtitulo: string | null
          texto_botao: string
          titulo: string
          updated_at: string
          views_count: number
        }
        Insert: {
          campos_form?: Json
          cor_botao?: string | null
          cover_url?: string | null
          created_at?: string
          cta_adicional_texto?: string | null
          cta_adicional_url?: string | null
          descricao?: string | null
          downloads_count?: number
          id?: string
          lead_magnet_nome: string
          lead_magnet_url: string
          leads_count?: number
          logo_url?: string | null
          nome: string
          obrigado_subtitulo?: string | null
          obrigado_texto_botao?: string
          obrigado_titulo?: string
          slug: string
          status?: string
          subtitulo?: string | null
          texto_botao?: string
          titulo: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          campos_form?: Json
          cor_botao?: string | null
          cover_url?: string | null
          created_at?: string
          cta_adicional_texto?: string | null
          cta_adicional_url?: string | null
          descricao?: string | null
          downloads_count?: number
          id?: string
          lead_magnet_nome?: string
          lead_magnet_url?: string
          leads_count?: number
          logo_url?: string | null
          nome?: string
          obrigado_subtitulo?: string | null
          obrigado_texto_botao?: string
          obrigado_titulo?: string
          slug?: string
          status?: string
          subtitulo?: string | null
          texto_botao?: string
          titulo?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      lideres: {
        Row: {
          affiliate_token: string | null
          cadastros: number
          cidade_id: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean
          is_coordinator: boolean | null
          is_verified: boolean | null
          join_date: string | null
          last_activity: string | null
          nome_completo: string
          observacao: string | null
          parent_leader_id: string | null
          pontuacao_total: number
          status: Database["public"]["Enums"]["office_leader_status"]
          telefone: string | null
          updated_at: string
          verification_code: string | null
          verification_method: string | null
          verification_sent_at: string | null
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          affiliate_token?: string | null
          cadastros?: number
          cidade_id?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean
          is_coordinator?: boolean | null
          is_verified?: boolean | null
          join_date?: string | null
          last_activity?: string | null
          nome_completo: string
          observacao?: string | null
          parent_leader_id?: string | null
          pontuacao_total?: number
          status?: Database["public"]["Enums"]["office_leader_status"]
          telefone?: string | null
          updated_at?: string
          verification_code?: string | null
          verification_method?: string | null
          verification_sent_at?: string | null
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          affiliate_token?: string | null
          cadastros?: number
          cidade_id?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean
          is_coordinator?: boolean | null
          is_verified?: boolean | null
          join_date?: string | null
          last_activity?: string | null
          nome_completo?: string
          observacao?: string | null
          parent_leader_id?: string | null
          pontuacao_total?: number
          status?: Database["public"]["Enums"]["office_leader_status"]
          telefone?: string | null
          updated_at?: string
          verification_code?: string | null
          verification_method?: string | null
          verification_sent_at?: string | null
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lideres_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "office_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lideres_parent_leader_id_fkey"
            columns: ["parent_leader_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
        ]
      }
      map_analyses: {
        Row: {
          content: string
          created_at: string | null
          id: string
          total_connections: number | null
          total_contacts: number | null
          total_leaders: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          total_connections?: number | null
          total_contacts?: number | null
          total_leaders?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          total_connections?: number | null
          total_contacts?: number | null
          total_leaders?: number | null
          user_id?: string
        }
        Relationships: []
      }
      office_cities: {
        Row: {
          codigo_ra: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          status: Database["public"]["Enums"]["office_city_status"]
          updated_at: string
        }
        Insert: {
          codigo_ra: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          status?: Database["public"]["Enums"]["office_city_status"]
          updated_at?: string
        }
        Update: {
          codigo_ra?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
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
          email: string | null
          endereco: string | null
          facebook: string | null
          genero: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_verified: boolean | null
          nome: string
          observacao: string | null
          opt_out_channel: string | null
          opt_out_reason: string | null
          opted_out_at: string | null
          pending_messages: Json | null
          source_id: string | null
          source_type: string | null
          telefone_norm: string
          unsubscribe_token: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          verification_code: string | null
          verification_sent_at: string | null
          verified_at: string | null
        }
        Insert: {
          cidade_id: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          facebook?: string | null
          genero?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          nome: string
          observacao?: string | null
          opt_out_channel?: string | null
          opt_out_reason?: string | null
          opted_out_at?: string | null
          pending_messages?: Json | null
          source_id?: string | null
          source_type?: string | null
          telefone_norm: string
          unsubscribe_token?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verification_code?: string | null
          verification_sent_at?: string | null
          verified_at?: string | null
        }
        Update: {
          cidade_id?: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          facebook?: string | null
          genero?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          nome?: string
          observacao?: string | null
          opt_out_channel?: string | null
          opt_out_reason?: string | null
          opted_out_at?: string | null
          pending_messages?: Json | null
          source_id?: string | null
          source_type?: string | null
          telefone_norm?: string
          unsubscribe_token?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verification_code?: string | null
          verification_sent_at?: string | null
          verified_at?: string | null
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
      office_meeting_minutes: {
        Row: {
          content_text: string | null
          content_type: string
          created_at: string
          file_mime_type: string | null
          file_name: string | null
          file_path: string | null
          id: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          content_text?: string | null
          content_type: string
          created_at?: string
          file_mime_type?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          created_at?: string
          file_mime_type?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_meeting_minutes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "office_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      office_settings: {
        Row: {
          created_at: string
          id: string
          limite_eventos_dia: number | null
          nivel_bronze_max: number | null
          nivel_bronze_min: number | null
          nivel_diamante_min: number | null
          nivel_ouro_max: number | null
          nivel_ouro_min: number | null
          nivel_prata_max: number | null
          nivel_prata_min: number | null
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
          limite_eventos_dia?: number | null
          nivel_bronze_max?: number | null
          nivel_bronze_min?: number | null
          nivel_diamante_min?: number | null
          nivel_ouro_max?: number | null
          nivel_ouro_min?: number | null
          nivel_prata_max?: number | null
          nivel_prata_min?: number | null
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
          limite_eventos_dia?: number | null
          nivel_bronze_max?: number | null
          nivel_bronze_min?: number | null
          nivel_diamante_min?: number | null
          nivel_ouro_max?: number | null
          nivel_ouro_min?: number | null
          nivel_prata_max?: number | null
          nivel_prata_min?: number | null
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
          tema_id: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          aceita_reuniao?: boolean
          continua_projeto?: boolean
          created_at?: string
          data_nascimento: string
          endereco: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          observacoes?: string | null
          submitted_at?: string | null
          tema_id?: string | null
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
          tema_id?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_visit_forms_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
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
          checked_in: boolean | null
          checked_in_at: string | null
          city_id: string
          confirmed_at: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          leader_id: string | null
          protocolo: string
          qr_code: string | null
          rescheduled_at: string | null
          rescheduled_date: string | null
          scheduled_by: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["office_visit_status"]
          token: string | null
          token_expires_at: string | null
          updated_at: string
          webhook_error: string | null
          webhook_last_status: number | null
          webhook_sent_at: string | null
        }
        Insert: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          city_id: string
          confirmed_at?: string | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          leader_id?: string | null
          protocolo: string
          qr_code?: string | null
          rescheduled_at?: string | null
          rescheduled_date?: string | null
          scheduled_by?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["office_visit_status"]
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          webhook_error?: string | null
          webhook_last_status?: number | null
          webhook_sent_at?: string | null
        }
        Update: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          city_id?: string
          confirmed_at?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          leader_id?: string | null
          protocolo?: string
          qr_code?: string | null
          rescheduled_at?: string | null
          rescheduled_date?: string | null
          scheduled_by?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
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
      organization: {
        Row: {
          bio: string | null
          cargo: string | null
          cidade: string | null
          created_at: string
          email_contato: string | null
          estado: string | null
          facebook: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nome: string
          nome_plataforma: string | null
          partido: string | null
          twitter: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          bio?: string | null
          cargo?: string | null
          cidade?: string | null
          created_at?: string
          email_contato?: string | null
          estado?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome?: string
          nome_plataforma?: string | null
          partido?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          bio?: string | null
          cargo?: string | null
          cidade?: string | null
          created_at?: string
          email_contato?: string | null
          estado?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome?: string
          nome_plataforma?: string | null
          partido?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string | null
          id: string
          page_identifier: string
          page_type: string
          session_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_identifier: string
          page_type: string
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_identifier?: string
          page_type?: string
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
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
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          impacto: number
          inicio: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          impacto?: number
          inicio: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          impacto?: number
          inicio?: string
          nome?: string
          status?: string
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
      scheduled_messages: {
        Row: {
          batch_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          leader_id: string | null
          message_type: string
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          template_slug: string
          variables: Json | null
        }
        Insert: {
          batch_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          leader_id?: string | null
          message_type: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          template_slug: string
          variables?: Json | null
        }
        Update: {
          batch_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          leader_id?: string | null
          message_type?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          template_slug?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          contact_id: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error_message: string | null
          id: string
          message: string
          message_id: string | null
          phone: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          message: string
          message_id?: string | null
          phone: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          message?: string
          message_id?: string | null
          phone?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          categoria: string
          created_at: string
          id: string
          is_active: boolean | null
          mensagem: string
          nome: string
          slug: string
          updated_at: string
          variaveis: Json | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          mensagem: string
          nome: string
          slug: string
          updated_at?: string
          variaveis?: Json | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          mensagem?: string
          nome?: string
          slug?: string
          updated_at?: string
          variaveis?: Json | null
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_response: boolean
          mensagem: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_response?: boolean
          mensagem: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_response?: boolean
          mensagem?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assunto: string
          categoria: string
          created_at: string
          descricao: string
          id: string
          prioridade: string
          protocolo: string
          resolved_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assunto: string
          categoria: string
          created_at?: string
          descricao: string
          id?: string
          prioridade?: string
          protocolo: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assunto?: string
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          prioridade?: string
          protocolo?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      survey_analyses: {
        Row: {
          content: string
          created_at: string | null
          id: string
          leader_responses: number | null
          referred_responses: number | null
          survey_id: string
          total_responses: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          leader_responses?: number | null
          referred_responses?: number | null
          survey_id: string
          total_responses?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          leader_responses?: number | null
          referred_responses?: number | null
          survey_id?: string
          total_responses?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_analyses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          obrigatoria: boolean
          opcoes: Json | null
          ordem: number
          pergunta: string
          survey_id: string
          tipo: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem: number
          pergunta: string
          survey_id: string
          tipo: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem?: number
          pergunta?: string
          survey_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          contact_id: string | null
          created_at: string
          id: string
          is_leader: boolean
          leader_id: string | null
          referred_by_leader_id: string | null
          respostas: Json
          survey_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          id?: string
          is_leader?: boolean
          leader_id?: string | null
          referred_by_leader_id?: string | null
          respostas?: Json
          survey_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          id?: string
          is_leader?: boolean
          leader_id?: string | null
          referred_by_leader_id?: string | null
          respostas?: Json
          survey_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_referred_by_leader_id_fkey"
            columns: ["referred_by_leader_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          config: Json | null
          cover_url: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          logo_url: string | null
          slug: string
          status: string
          titulo: string
          total_respostas: number
          updated_at: string
        }
        Insert: {
          config?: Json | null
          cover_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          logo_url?: string | null
          slug: string
          status?: string
          titulo: string
          total_respostas?: number
          updated_at?: string
        }
        Update: {
          config?: Json | null
          cover_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          logo_url?: string | null
          slug?: string
          status?: string
          titulo?: string
          total_respostas?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          descricao: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          tipo?: string
          titulo?: string
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
      user_notification_reads: {
        Row: {
          id: string
          notification_id: string | null
          read_at: string
          ticket_message_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notification_id?: string | null
          read_at?: string
          ticket_message_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string | null
          read_at?: string
          ticket_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "system_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_reads_ticket_message_id_fkey"
            columns: ["ticket_message_id"]
            isOneToOne: false
            referencedRelation: "support_ticket_messages"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_messages: {
        Row: {
          contact_id: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error_message: string | null
          id: string
          message: string
          message_id: string | null
          phone: string
          read_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          message: string
          message_id?: string | null
          phone: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          message?: string
          message_id?: string | null
          phone?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "office_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "office_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          categoria: string
          created_at: string
          id: string
          is_active: boolean | null
          mensagem: string
          nome: string
          slug: string
          updated_at: string
          variaveis: Json | null
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          mensagem: string
          nome: string
          slug: string
          updated_at?: string
          variaveis?: Json | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          mensagem?: string
          nome?: string
          slug?: string
          updated_at?: string
          variaveis?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_leader_points: {
        Args: { _leader_id: string; _points: number; _reason?: string }
        Returns: undefined
      }
      checkin_event_by_qr: {
        Args: { _checked_in: boolean; _qr_code: string }
        Returns: boolean
      }
      checkin_visit_by_qr: { Args: { _qr_code: string }; Returns: boolean }
      create_event_registration: {
        Args: {
          _cidade_id?: string
          _email: string
          _event_id: string
          _leader_id?: string
          _nome: string
          _utm_campaign?: string
          _utm_content?: string
          _utm_medium?: string
          _utm_source?: string
          _whatsapp: string
        }
        Returns: {
          checked_in: boolean
          id: string
          qr_code: string
        }[]
      }
      demote_coordinator: { Args: { _leader_id: string }; Returns: boolean }
      generate_checkin_pin: { Args: never; Returns: string }
      generate_event_qr_code: { Args: never; Returns: string }
      generate_funnel_slug: { Args: { base_name: string }; Returns: string }
      generate_leader_affiliate_token: { Args: never; Returns: string }
      generate_leader_verification_code: { Args: never; Returns: string }
      generate_office_protocol:
        | { Args: { _prefix?: string }; Returns: string }
        | { Args: { _prefix?: string; _tenant_id: string }; Returns: string }
      generate_support_protocol: { Args: never; Returns: string }
      generate_survey_slug: { Args: { base_name: string }; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      generate_visit_qr_code: { Args: never; Returns: string }
      get_all_coordinators_with_stats: {
        Args: never
        Returns: {
          cadastros: number
          cidade_id: string
          cidade_nome: string
          email: string
          id: string
          nome_completo: string
          pontuacao_total: number
          telefone: string
          total_cadastros: number
          total_leaders: number
          total_pontos: number
        }[]
      }
      get_coordinator_network_stats: {
        Args: { _coordinator_id: string }
        Returns: {
          total_cadastros: number
          total_leaders: number
          total_pontos: number
        }[]
      }
      get_leader_by_affiliate_token: {
        Args: { _token: string }
        Returns: {
          cidade_id: string
          cidade_nome: string
          id: string
          nome_completo: string
        }[]
      }
      get_leader_by_phone_or_email: {
        Args: { _email: string; _phone: string }
        Returns: string
      }
      get_leader_hierarchy_path: {
        Args: { _leader_id: string }
        Returns: {
          cidade_nome: string
          depth: number
          email: string
          hierarchy_level: number
          id: string
          is_coordinator: boolean
          nome_completo: string
          parent_leader_id: string
          telefone: string
        }[]
      }
      get_leader_tree: {
        Args: { _leader_id: string }
        Returns: {
          cadastros: number
          cidade_id: string
          cidade_nome: string
          created_at: string
          depth: number
          email: string
          hierarchy_level: number
          id: string
          is_active: boolean
          is_coordinator: boolean
          is_verified: boolean
          nome_completo: string
          parent_leader_id: string
          pontuacao_total: number
          telefone: string
        }[]
      }
      get_public_form_settings: {
        Args: never
        Returns: {
          affiliate_form_cover_url: string
          affiliate_form_logo_url: string
          leader_form_cover_url: string
          leader_form_logo_url: string
          leader_form_subtitle: string
          leader_form_title: string
        }[]
      }
      get_registration_by_qr: {
        Args: { _qr_code: string }
        Returns: {
          checked_in: boolean
          checked_in_at: string
          event_address: string
          event_category: string
          event_date: string
          event_id: string
          event_location: string
          event_name: string
          event_time: string
          id: string
          nome: string
        }[]
      }
      get_subtree_max_depth: { Args: { _leader_id: string }; Returns: number }
      get_top_city: {
        Args: never
        Returns: {
          city_count: number
          city_name: string
        }[]
      }
      get_user_context: {
        Args: { user_id: string }
        Returns: {
          accessible_tenants: string[]
          user_data: Json
          user_type: string
        }[]
      }
      get_visit_by_qr: {
        Args: { _qr_code: string }
        Returns: {
          checked_in: boolean
          checked_in_at: string
          city_nome: string
          contact_nome: string
          contact_telefone: string
          id: string
          leader_nome: string
          protocolo: string
          status: Database["public"]["Enums"]["office_visit_status"]
        }[]
      }
      get_visit_for_public_form: {
        Args: { _visit_id: string }
        Returns: {
          city_id: string
          city_nome: string
          contact_id: string
          contact_nome: string
          contact_telefone: string
          id: string
          protocolo: string
          qr_code: string
          scheduled_date: string
          scheduled_time: string
          status: string
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
      has_admin_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_funnel_metric: {
        Args: { _funnel_id: string; _metric: string }
        Returns: undefined
      }
      increment_leader_cadastros: {
        Args: { _leader_id: string }
        Returns: undefined
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_leader_verified_manually:
        | { Args: { _leader_id: string }; Returns: boolean }
        | {
            Args: { _leader_id: string; _verified_by?: string }
            Returns: boolean
          }
      move_leader_branch: {
        Args: { _leader_id: string; _new_parent_id: string }
        Returns: Json
      }
      normalize_phone_e164: { Args: { phone: string }; Returns: string }
      promote_to_coordinator: { Args: { _leader_id: string }; Returns: boolean }
      promote_to_coordinator_with_subordinates: {
        Args: { _leader_id: string }
        Returns: Json
      }
      register_leader_from_affiliate: {
        Args: {
          p_cidade_id: string
          p_data_nascimento: string
          p_email: string
          p_endereco: string
          p_nome: string
          p_referring_leader_id: string
          p_telefone_norm: string
        }
        Returns: {
          affiliate_token: string
          already_referred_by_other_leader: boolean
          hierarchy_level_exceeded: boolean
          is_already_leader: boolean
          leader_id: string
          original_leader_name: string
          verification_code: string
        }[]
      }
      remove_from_tree: { Args: { _leader_id: string }; Returns: boolean }
      set_parent_leader: {
        Args: { _leader_id: string; _parent_id: string }
        Returns: boolean
      }
      unsubscribe_contact_by_token: {
        Args: { p_reason?: string; p_token: string }
        Returns: Json
      }
      update_contact_verification_sent: {
        Args: { _contact_id: string }
        Returns: boolean
      }
      update_leader_verification_sent: {
        Args: { _leader_id: string }
        Returns: boolean
      }
      update_visit_status_form_opened: {
        Args: { _visit_id: string }
        Returns: boolean
      }
      update_whatsapp_message_status: {
        Args: {
          _delivered_at?: string
          _error_message?: string
          _message_id: string
          _read_at?: string
          _status: string
        }
        Returns: boolean
      }
      upsert_contact_from_leader_form: {
        Args: {
          p_cidade_id: string
          p_data_nascimento: string
          p_email: string
          p_endereco: string
          p_leader_id: string
          p_nome: string
          p_telefone_norm: string
        }
        Returns: {
          already_referred_by_other_leader: boolean
          contact_id: string
          is_already_leader: boolean
          is_verified: boolean
          needs_verification: boolean
          original_leader_name: string
          verification_code: string
        }[]
      }
      upsert_contact_from_public_form: {
        Args: {
          _cidade_id?: string
          _data_nascimento?: string
          _email?: string
          _endereco?: string
          _facebook?: string
          _instagram?: string
          _nome: string
          _source_id?: string
          _source_type?: string
          _telefone_norm: string
          _utm_campaign?: string
          _utm_content?: string
          _utm_medium?: string
          _utm_source?: string
        }
        Returns: string
      }
      validate_checkin_pin: {
        Args: { _event_id: string; _pin: string }
        Returns: boolean
      }
      verify_contact_by_code: { Args: { _code: string }; Returns: Json }
      verify_leader_by_code: { Args: { _code: string }; Returns: Json }
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
        | "SCHEDULED"
        | "REGISTERED"
        | "LINK_SENT"
        | "FORM_OPENED"
        | "FORM_SUBMITTED"
        | "CHECKED_IN"
        | "CANCELLED"
        | "MEETING_COMPLETED"
        | "RESCHEDULED"
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
        "SCHEDULED",
        "REGISTERED",
        "LINK_SENT",
        "FORM_OPENED",
        "FORM_SUBMITTED",
        "CHECKED_IN",
        "CANCELLED",
        "MEETING_COMPLETED",
        "RESCHEDULED",
      ],
      tenant_status: ["active", "suspended", "cancelled"],
    },
  },
} as const
