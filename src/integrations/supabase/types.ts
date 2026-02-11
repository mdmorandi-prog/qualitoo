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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_plans: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          how: string | null
          how_much: string | null
          id: string
          origin_id: string | null
          origin_type: string | null
          progress: number | null
          responsible_id: string | null
          sector: string | null
          status: string
          title: string
          updated_at: string
          what: string | null
          when_end: string | null
          when_start: string | null
          where_action: string | null
          who: string | null
          why: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          how?: string | null
          how_much?: string | null
          id?: string
          origin_id?: string | null
          origin_type?: string | null
          progress?: number | null
          responsible_id?: string | null
          sector?: string | null
          status?: string
          title: string
          updated_at?: string
          what?: string | null
          when_end?: string | null
          when_start?: string | null
          where_action?: string | null
          who?: string | null
          why?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          how?: string | null
          how_much?: string | null
          id?: string
          origin_id?: string | null
          origin_type?: string | null
          progress?: number | null
          responsible_id?: string | null
          sector?: string | null
          status?: string
          title?: string
          updated_at?: string
          what?: string | null
          when_end?: string | null
          when_start?: string | null
          where_action?: string | null
          who?: string | null
          why?: string | null
        }
        Relationships: []
      }
      adverse_events: {
        Row: {
          capa_id: string | null
          created_at: string
          description: string
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          immediate_actions: string | null
          location: string | null
          patient_involved: boolean
          patient_outcome: string | null
          reported_by: string
          responsible_id: string | null
          sector: string | null
          severity: Database["public"]["Enums"]["event_severity"]
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          capa_id?: string | null
          created_at?: string
          description: string
          event_date: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          immediate_actions?: string | null
          location?: string | null
          patient_involved?: boolean
          patient_outcome?: string | null
          reported_by: string
          responsible_id?: string | null
          sector?: string | null
          severity?: Database["public"]["Enums"]["event_severity"]
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          capa_id?: string | null
          created_at?: string
          description?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          immediate_actions?: string | null
          location?: string | null
          patient_involved?: boolean
          patient_outcome?: string | null
          reported_by?: string
          responsible_id?: string | null
          sector?: string | null
          severity?: Database["public"]["Enums"]["event_severity"]
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adverse_events_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_id: string
          corrective_action: string | null
          created_at: string
          description: string
          id: string
          non_conformity_id: string | null
          severity: Database["public"]["Enums"]["nc_severity"]
          status: Database["public"]["Enums"]["nc_status"]
          updated_at: string
        }
        Insert: {
          audit_id: string
          corrective_action?: string | null
          created_at?: string
          description: string
          id?: string
          non_conformity_id?: string | null
          severity?: Database["public"]["Enums"]["nc_severity"]
          status?: Database["public"]["Enums"]["nc_status"]
          updated_at?: string
        }
        Update: {
          audit_id?: string
          corrective_action?: string | null
          created_at?: string
          description?: string
          id?: string
          non_conformity_id?: string | null
          severity?: Database["public"]["Enums"]["nc_severity"]
          status?: Database["public"]["Enums"]["nc_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_non_conformity_id_fkey"
            columns: ["non_conformity_id"]
            isOneToOne: false
            referencedRelation: "non_conformities"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          audit_type: string
          completed_date: string | null
          conclusion: string | null
          created_at: string
          created_by: string
          description: string | null
          findings: string | null
          id: string
          lead_auditor_id: string | null
          scheduled_date: string
          scope: string | null
          sector: string | null
          status: Database["public"]["Enums"]["audit_status"]
          title: string
          updated_at: string
        }
        Insert: {
          audit_type?: string
          completed_date?: string | null
          conclusion?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          findings?: string | null
          id?: string
          lead_auditor_id?: string | null
          scheduled_date: string
          scope?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          title: string
          updated_at?: string
        }
        Update: {
          audit_type?: string
          completed_date?: string | null
          conclusion?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          findings?: string | null
          id?: string
          lead_auditor_id?: string | null
          scheduled_date?: string
          scope?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      capas: {
        Row: {
          capa_type: Database["public"]["Enums"]["capa_type"]
          corrective_action: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          five_whys: Json | null
          id: string
          is_effective: boolean | null
          ishikawa_data: Json | null
          origin_id: string | null
          origin_title: string | null
          origin_type: string | null
          preventive_action: string | null
          responsible_id: string | null
          root_cause_analysis: string | null
          sector: string | null
          status: Database["public"]["Enums"]["capa_status"]
          title: string
          updated_at: string
          verification_date: string | null
          verification_method: string | null
          verification_result: string | null
        }
        Insert: {
          capa_type?: Database["public"]["Enums"]["capa_type"]
          corrective_action?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          five_whys?: Json | null
          id?: string
          is_effective?: boolean | null
          ishikawa_data?: Json | null
          origin_id?: string | null
          origin_title?: string | null
          origin_type?: string | null
          preventive_action?: string | null
          responsible_id?: string | null
          root_cause_analysis?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["capa_status"]
          title: string
          updated_at?: string
          verification_date?: string | null
          verification_method?: string | null
          verification_result?: string | null
        }
        Update: {
          capa_type?: Database["public"]["Enums"]["capa_type"]
          corrective_action?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          five_whys?: Json | null
          id?: string
          is_effective?: boolean | null
          ishikawa_data?: Json | null
          origin_id?: string | null
          origin_title?: string | null
          origin_type?: string | null
          preventive_action?: string | null
          responsible_id?: string | null
          root_cause_analysis?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["capa_status"]
          title?: string
          updated_at?: string
          verification_date?: string | null
          verification_method?: string | null
          verification_result?: string | null
        }
        Relationships: []
      }
      competencies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_mandatory: boolean
          name: string
          related_training_ids: string[] | null
          required_for_roles: string[] | null
          sector: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean
          name: string
          related_training_ids?: string[] | null
          required_for_roles?: string[] | null
          sector?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean
          name?: string
          related_training_ids?: string[] | null
          required_for_roles?: string[] | null
          sector?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      competency_evaluations: {
        Row: {
          competency_id: string
          created_at: string
          employee_name: string
          employee_role: string | null
          evaluated_by: string
          evaluation_date: string
          id: string
          level: number
          notes: string | null
          sector: string | null
        }
        Insert: {
          competency_id: string
          created_at?: string
          employee_name: string
          employee_role?: string | null
          evaluated_by: string
          evaluation_date?: string
          id?: string
          level?: number
          notes?: string | null
          sector?: string | null
        }
        Update: {
          competency_id?: string
          created_at?: string
          employee_name?: string
          employee_role?: string | null
          evaluated_by?: string
          evaluation_date?: string
          id?: string
          level?: number
          notes?: string | null
          sector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_evaluations_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_measurements: {
        Row: {
          created_at: string
          id: string
          indicator_id: string
          notes: string | null
          period_date: string
          recorded_by: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_id: string
          notes?: string | null
          period_date: string
          recorded_by: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          indicator_id?: string
          notes?: string | null
          period_date?: string
          recorded_by?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicator_measurements_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          action_items: string | null
          agenda: string | null
          created_at: string
          created_by: string
          decisions: string | null
          discussions: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_type: string | null
          next_meeting: string | null
          participants: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: string | null
          agenda?: string | null
          created_at?: string
          created_by: string
          decisions?: string | null
          discussions?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_type?: string | null
          next_meeting?: string | null
          participants?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: string | null
          agenda?: string | null
          created_at?: string
          created_by?: string
          decisions?: string | null
          discussions?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_type?: string | null
          next_meeting?: string | null
          participants?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      non_conformities: {
        Row: {
          closed_at: string | null
          corrective_action: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          id: string
          preventive_action: string | null
          responsible_id: string | null
          root_cause: string | null
          sector: string | null
          severity: Database["public"]["Enums"]["nc_severity"]
          status: Database["public"]["Enums"]["nc_status"]
          title: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          corrective_action?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          id?: string
          preventive_action?: string | null
          responsible_id?: string | null
          root_cause?: string | null
          sector?: string | null
          severity?: Database["public"]["Enums"]["nc_severity"]
          status?: Database["public"]["Enums"]["nc_status"]
          title: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          corrective_action?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          id?: string
          preventive_action?: string | null
          responsible_id?: string | null
          root_cause?: string | null
          sector?: string | null
          severity?: Database["public"]["Enums"]["nc_severity"]
          status?: Database["public"]["Enums"]["nc_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          module: string | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          module?: string | null
          reference_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          module?: string | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      quality_documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          code: string | null
          content: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          sector: string | null
          status: Database["public"]["Enums"]["doc_status"]
          title: string
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          code?: string | null
          content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          sector?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          title: string
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          code?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          sector?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          title?: string
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: []
      }
      quality_indicators: {
        Row: {
          created_at: string
          description: string | null
          frequency: Database["public"]["Enums"]["indicator_frequency"]
          id: string
          is_active: boolean
          max_acceptable: number | null
          min_acceptable: number | null
          name: string
          responsible_id: string | null
          sector: string | null
          target_value: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["indicator_frequency"]
          id?: string
          is_active?: boolean
          max_acceptable?: number | null
          min_acceptable?: number | null
          name: string
          responsible_id?: string | null
          sector?: string | null
          target_value: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["indicator_frequency"]
          id?: string
          is_active?: boolean
          max_acceptable?: number | null
          min_acceptable?: number | null
          name?: string
          responsible_id?: string | null
          sector?: string | null
          target_value?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          accused_name: string | null
          accused_role: string | null
          admin_notes: string | null
          assigned_to: string | null
          contact_info: string | null
          created_at: string
          date: string
          description: string
          has_witnesses: boolean
          id: string
          identity_name: string | null
          identity_role: string | null
          is_anonymous: boolean
          location: string
          protocol: string
          sector: string | null
          shift: string | null
          status: Database["public"]["Enums"]["report_status"]
          type: string
          updated_at: string
          wants_follow_up: boolean
          witness_info: string | null
        }
        Insert: {
          accused_name?: string | null
          accused_role?: string | null
          admin_notes?: string | null
          assigned_to?: string | null
          contact_info?: string | null
          created_at?: string
          date: string
          description: string
          has_witnesses?: boolean
          id?: string
          identity_name?: string | null
          identity_role?: string | null
          is_anonymous?: boolean
          location: string
          protocol: string
          sector?: string | null
          shift?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          type: string
          updated_at?: string
          wants_follow_up?: boolean
          witness_info?: string | null
        }
        Update: {
          accused_name?: string | null
          accused_role?: string | null
          admin_notes?: string | null
          assigned_to?: string | null
          contact_info?: string | null
          created_at?: string
          date?: string
          description?: string
          has_witnesses?: boolean
          id?: string
          identity_name?: string | null
          identity_role?: string | null
          is_anonymous?: boolean
          location?: string
          protocol?: string
          sector?: string | null
          shift?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          type?: string
          updated_at?: string
          wants_follow_up?: boolean
          witness_info?: string | null
        }
        Relationships: []
      }
      risks: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          current_controls: string | null
          description: string | null
          id: string
          impact: number
          mitigation_plan: string | null
          probability: number
          responsible: string | null
          review_date: string | null
          risk_level: number | null
          sector: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          current_controls?: string | null
          description?: string | null
          id?: string
          impact?: number
          mitigation_plan?: string | null
          probability?: number
          responsible?: string | null
          review_date?: string | null
          risk_level?: number | null
          sector?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          current_controls?: string | null
          description?: string | null
          id?: string
          impact?: number
          mitigation_plan?: string | null
          probability?: number
          responsible?: string | null
          review_date?: string | null
          risk_level?: number | null
          sector?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          duration_hours: number | null
          expiry_date: string | null
          id: string
          instructor: string | null
          materials: string | null
          participants_count: number | null
          sector: string | null
          status: string
          title: string
          training_date: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_hours?: number | null
          expiry_date?: string | null
          id?: string
          instructor?: string | null
          materials?: string | null
          participants_count?: number | null
          sector?: string | null
          status?: string
          title: string
          training_date?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_hours?: number | null
          expiry_date?: string | null
          id?: string
          instructor?: string | null
          materials?: string | null
          participants_count?: number | null
          sector?: string | null
          status?: string
          title?: string
          training_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_report_by_protocol: {
        Args: { p_protocol: string }
        Returns: {
          created_at: string
          date: string
          is_anonymous: boolean
          location: string
          protocol: string
          status: Database["public"]["Enums"]["report_status"]
          type: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "analyst"
      audit_status: "planejada" | "em_andamento" | "concluida" | "cancelada"
      capa_status:
        | "identificacao"
        | "analise_causa"
        | "plano_acao"
        | "implementacao"
        | "verificacao_eficacia"
        | "encerrada"
      capa_type: "corretiva" | "preventiva" | "melhoria"
      doc_status: "rascunho" | "em_revisao" | "aprovado" | "obsoleto"
      event_severity: "leve" | "moderado" | "grave" | "sentinela"
      event_status:
        | "notificado"
        | "em_investigacao"
        | "acao_corretiva"
        | "encerrado"
      event_type:
        | "evento_adverso"
        | "near_miss"
        | "incidente"
        | "queixa_tecnica"
      indicator_frequency:
        | "diario"
        | "semanal"
        | "mensal"
        | "trimestral"
        | "anual"
      indicator_trend: "acima" | "abaixo" | "na_meta"
      nc_severity: "baixa" | "media" | "alta" | "critica"
      nc_status:
        | "aberta"
        | "em_analise"
        | "plano_acao"
        | "em_execucao"
        | "verificacao"
        | "concluida"
      report_status: "nova" | "em_analise" | "concluida" | "arquivada"
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
      app_role: ["admin", "analyst"],
      audit_status: ["planejada", "em_andamento", "concluida", "cancelada"],
      capa_status: [
        "identificacao",
        "analise_causa",
        "plano_acao",
        "implementacao",
        "verificacao_eficacia",
        "encerrada",
      ],
      capa_type: ["corretiva", "preventiva", "melhoria"],
      doc_status: ["rascunho", "em_revisao", "aprovado", "obsoleto"],
      event_severity: ["leve", "moderado", "grave", "sentinela"],
      event_status: [
        "notificado",
        "em_investigacao",
        "acao_corretiva",
        "encerrado",
      ],
      event_type: [
        "evento_adverso",
        "near_miss",
        "incidente",
        "queixa_tecnica",
      ],
      indicator_frequency: [
        "diario",
        "semanal",
        "mensal",
        "trimestral",
        "anual",
      ],
      indicator_trend: ["acima", "abaixo", "na_meta"],
      nc_severity: ["baixa", "media", "alta", "critica"],
      nc_status: [
        "aberta",
        "em_analise",
        "plano_acao",
        "em_execucao",
        "verificacao",
        "concluida",
      ],
      report_status: ["nova", "em_analise", "concluida", "arquivada"],
    },
  },
} as const
