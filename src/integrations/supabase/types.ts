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
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          module: string | null
          record_id: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string | null
          record_id?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string | null
          record_id?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
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
      bpmn_execution_log: {
        Row: {
          action: string
          created_at: string
          id: string
          instance_id: string
          node_id: string
          node_label: string | null
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          instance_id: string
          node_id: string
          node_label?: string | null
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          instance_id?: string
          node_id?: string
          node_label?: string | null
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bpmn_execution_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      bpmn_process_instances: {
        Row: {
          completed_at: string | null
          current_node_ids: string[]
          id: string
          process_id: string
          started_at: string
          started_by: string
          status: string
          title: string
          updated_at: string
          variables: Json
        }
        Insert: {
          completed_at?: string | null
          current_node_ids?: string[]
          id?: string
          process_id: string
          started_at?: string
          started_by: string
          status?: string
          title: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          completed_at?: string | null
          current_node_ids?: string[]
          id?: string
          process_id?: string
          started_at?: string
          started_by?: string
          status?: string
          title?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bpmn_process_instances_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "bpmn_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      bpmn_processes: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          edges: Json
          id: string
          nodes: Json
          sector: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          edges?: Json
          id?: string
          nodes?: Json
          sector?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          edges?: Json
          id?: string
          nodes?: Json
          sector?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      calibrations: {
        Row: {
          calibration_date: string
          certificate_number: string | null
          certificate_url: string | null
          created_at: string
          created_by: string
          deviation: string | null
          equipment_id: string
          id: string
          next_calibration_date: string | null
          notes: string | null
          performed_by: string | null
          result: string
          updated_at: string
        }
        Insert: {
          calibration_date: string
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          created_by: string
          deviation?: string | null
          equipment_id: string
          id?: string
          next_calibration_date?: string | null
          notes?: string | null
          performed_by?: string | null
          result?: string
          updated_at?: string
        }
        Update: {
          calibration_date?: string
          certificate_number?: string | null
          certificate_url?: string | null
          created_at?: string
          created_by?: string
          deviation?: string | null
          equipment_id?: string
          id?: string
          next_calibration_date?: string | null
          notes?: string | null
          performed_by?: string | null
          result?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calibrations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
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
      change_requests: {
        Row: {
          affected_documents: string | null
          affected_processes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string
          id: string
          impact_analysis: string | null
          implemented_at: string | null
          justification: string | null
          priority: string
          requested_by: string
          risk_assessment: string | null
          sector: string | null
          status: string
          title: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          affected_documents?: string | null
          affected_processes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description: string
          id?: string
          impact_analysis?: string | null
          implemented_at?: string | null
          justification?: string | null
          priority?: string
          requested_by: string
          risk_assessment?: string | null
          sector?: string | null
          status?: string
          title: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          affected_documents?: string | null
          affected_processes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string
          id?: string
          impact_analysis?: string | null
          implemented_at?: string | null
          justification?: string | null
          priority?: string
          requested_by?: string
          risk_assessment?: string | null
          sector?: string | null
          status?: string
          title?: string
          updated_at?: string
          verified_at?: string | null
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
      contracts: {
        Row: {
          ai_analysis: string | null
          ai_analyzed_at: string | null
          alert_days_before: number
          category: string | null
          contract_number: string | null
          counterparty: string | null
          created_at: string
          created_by: string
          description: string | null
          duration_months: number
          end_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          notes: string | null
          sector: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_analyzed_at?: string | null
          alert_days_before?: number
          category?: string | null
          contract_number?: string | null
          counterparty?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_months?: number
          end_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          sector?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_analyzed_at?: string | null
          alert_days_before?: number
          category?: string | null
          contract_number?: string | null
          counterparty?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_months?: number
          end_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          sector?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_access_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          details?: string | null
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "quality_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_read_confirmations: {
        Row: {
          confirmed_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_read_confirmations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "quality_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          created_at: string
          document_hash: string
          document_id: string
          geolocation: string | null
          id: string
          ip_address: string | null
          is_verified: boolean
          metadata: Json | null
          revoked_at: string | null
          revoked_reason: string | null
          signature_hash: string
          signature_role: string
          signature_type: string
          signed_at: string
          signer_email: string
          signer_id: string
          signer_name: string
          user_agent: string | null
          verification_code: string | null
          verification_method: string
        }
        Insert: {
          created_at?: string
          document_hash: string
          document_id: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          is_verified?: boolean
          metadata?: Json | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signature_hash: string
          signature_role?: string
          signature_type?: string
          signed_at?: string
          signer_email: string
          signer_id: string
          signer_name: string
          user_agent?: string | null
          verification_code?: string | null
          verification_method?: string
        }
        Update: {
          created_at?: string
          document_hash?: string
          document_id?: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          is_verified?: boolean
          metadata?: Json | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signature_hash?: string
          signature_role?: string
          signature_type?: string
          signed_at?: string
          signer_email?: string
          signer_id?: string
          signer_name?: string
          user_agent?: string | null
          verification_code?: string | null
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "quality_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          body: string
          created_at: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          to_user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          to_user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          to_user_id?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          acquisition_date: string | null
          category: string | null
          created_at: string
          created_by: string
          id: string
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          sector: string | null
          serial_number: string | null
          status: string
          tag_number: string | null
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          sector?: string | null
          serial_number?: string | null
          status?: string
          tag_number?: string | null
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          sector?: string | null
          serial_number?: string | null
          status?: string
          tag_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fmea_analyses: {
        Row: {
          created_at: string
          created_by: string
          id: string
          process: string | null
          sector: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          process?: string | null
          sector?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          process?: string | null
          sector?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      fmea_items: {
        Row: {
          cause: string | null
          created_at: string
          current_controls: string | null
          detection: number
          effect: string | null
          failure_mode: string
          fmea_id: string
          id: string
          occurrence: number
          recommended_action: string | null
          responsible: string | null
          rpn: number | null
          severity: number
          status: string
        }
        Insert: {
          cause?: string | null
          created_at?: string
          current_controls?: string | null
          detection?: number
          effect?: string | null
          failure_mode: string
          fmea_id: string
          id?: string
          occurrence?: number
          recommended_action?: string | null
          responsible?: string | null
          rpn?: number | null
          severity?: number
          status?: string
        }
        Update: {
          cause?: string | null
          created_at?: string
          current_controls?: string | null
          detection?: number
          effect?: string | null
          failure_mode?: string
          fmea_id?: string
          id?: string
          occurrence?: number
          recommended_action?: string | null
          responsible?: string | null
          rpn?: number | null
          severity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fmea_items_fmea_id_fkey"
            columns: ["fmea_id"]
            isOneToOne: false
            referencedRelation: "fmea_analyses"
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
      lgpd_data_mappings: {
        Row: {
          created_at: string
          created_by: string
          data_category: string
          data_type: string
          id: string
          is_sensitive: boolean
          legal_basis: string
          notes: string | null
          purpose: string
          responsible: string | null
          retention_period: string | null
          sector: string | null
          status: string
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data_category: string
          data_type: string
          id?: string
          is_sensitive?: boolean
          legal_basis: string
          notes?: string | null
          purpose: string
          responsible?: string | null
          retention_period?: string | null
          sector?: string | null
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data_category?: string
          data_type?: string
          id?: string
          is_sensitive?: boolean
          legal_basis?: string
          notes?: string | null
          purpose?: string
          responsible?: string | null
          retention_period?: string | null
          sector?: string | null
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: []
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
      nc_custom_fields: {
        Row: {
          created_at: string
          display_order: number
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          nc_type: string
          options: string[] | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          nc_type: string
          options?: string[] | null
        }
        Update: {
          created_at?: string
          display_order?: number
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          nc_type?: string
          options?: string[] | null
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
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          created_at: string
          depends_on: string | null
          display_order: number
          end_date: string
          id: string
          is_milestone: boolean
          progress: number
          project_id: string
          responsible: string | null
          start_date: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          depends_on?: string | null
          display_order?: number
          end_date?: string
          id?: string
          is_milestone?: boolean
          progress?: number
          project_id: string
          responsible?: string | null
          start_date?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          depends_on?: string | null
          display_order?: number
          end_date?: string
          id?: string
          is_milestone?: boolean
          progress?: number
          project_id?: string
          responsible?: string | null
          start_date?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          progress: number
          responsible: string | null
          sector: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          progress?: number
          responsible?: string | null
          sector?: string | null
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          progress?: number
          responsible?: string | null
          sector?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
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
          file_url: string | null
          id: string
          is_signed: boolean
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
          file_url?: string | null
          id?: string
          is_signed?: boolean
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
          file_url?: string | null
          id?: string
          is_signed?: boolean
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
          formula: string | null
          frequency: Database["public"]["Enums"]["indicator_frequency"]
          id: string
          is_active: boolean
          is_composite: boolean
          max_acceptable: number | null
          min_acceptable: number | null
          name: string
          responsible_id: string | null
          sector: string | null
          source_indicator_ids: string[] | null
          target_value: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          formula?: string | null
          frequency?: Database["public"]["Enums"]["indicator_frequency"]
          id?: string
          is_active?: boolean
          is_composite?: boolean
          max_acceptable?: number | null
          min_acceptable?: number | null
          name: string
          responsible_id?: string | null
          sector?: string | null
          source_indicator_ids?: string[] | null
          target_value: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          formula?: string | null
          frequency?: Database["public"]["Enums"]["indicator_frequency"]
          id?: string
          is_active?: boolean
          is_composite?: boolean
          max_acceptable?: number | null
          min_acceptable?: number | null
          name?: string
          responsible_id?: string | null
          sector?: string | null
          source_indicator_ids?: string[] | null
          target_value?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      regulatory_reports: {
        Row: {
          created_at: string
          exported_data: Json | null
          generated_by: string
          id: string
          period_end: string | null
          period_start: string | null
          records_count: number
          report_type: string
          title: string
        }
        Insert: {
          created_at?: string
          exported_data?: Json | null
          generated_by: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          records_count?: number
          report_type?: string
          title: string
        }
        Update: {
          created_at?: string
          exported_data?: Json | null
          generated_by?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          records_count?: number
          report_type?: string
          title?: string
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
      satisfaction_surveys: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          questions: Json | null
          sector: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["survey_status"]
          survey_type: Database["public"]["Enums"]["survey_type"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          questions?: Json | null
          sector?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          survey_type?: Database["public"]["Enums"]["survey_type"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          questions?: Json | null
          sector?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          survey_type?: Database["public"]["Enums"]["survey_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      signature_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json | null
          document_hash: string | null
          document_id: string
          id: string
          ip_address: string | null
          signature_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          document_hash?: string | null
          document_id: string
          id?: string
          ip_address?: string | null
          signature_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          document_hash?: string | null
          document_id?: string
          id?: string
          ip_address?: string | null
          signature_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_audit_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "quality_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_audit_log_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "document_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_evaluations: {
        Row: {
          compliance_score: number
          cost_score: number
          created_at: string
          delivery_score: number
          evaluated_by: string
          evaluation_date: string
          id: string
          non_conformities_count: number
          notes: string | null
          overall_score: number | null
          quality_score: number
          supplier_id: string
        }
        Insert: {
          compliance_score?: number
          cost_score?: number
          created_at?: string
          delivery_score?: number
          evaluated_by: string
          evaluation_date?: string
          id?: string
          non_conformities_count?: number
          notes?: string | null
          overall_score?: number | null
          quality_score?: number
          supplier_id: string
        }
        Update: {
          compliance_score?: number
          cost_score?: number
          created_at?: string
          delivery_score?: number
          evaluated_by?: string
          evaluation_date?: string
          id?: string
          non_conformities_count?: number
          notes?: string | null
          overall_score?: number | null
          quality_score?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_evaluations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          cnpj: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          criticality: Database["public"]["Enums"]["supplier_criticality"]
          id: string
          name: string
          next_evaluation_date: string | null
          notes: string | null
          qualification_date: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          criticality?: Database["public"]["Enums"]["supplier_criticality"]
          id?: string
          name: string
          next_evaluation_date?: string | null
          notes?: string | null
          qualification_date?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          criticality?: Database["public"]["Enums"]["supplier_criticality"]
          id?: string
          name?: string
          next_evaluation_date?: string | null
          notes?: string | null
          qualification_date?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          answers: Json | null
          comments: string | null
          created_at: string
          id: string
          respondent_name: string | null
          respondent_sector: string | null
          score: number | null
          survey_id: string
        }
        Insert: {
          answers?: Json | null
          comments?: string | null
          created_at?: string
          id?: string
          respondent_name?: string | null
          respondent_sector?: string | null
          score?: number | null
          survey_id: string
        }
        Update: {
          answers?: Json | null
          comments?: string | null
          created_at?: string
          id?: string
          respondent_name?: string | null
          respondent_sector?: string | null
          score?: number | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "satisfaction_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
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
      user_dashboard_configs: {
        Row: {
          config_name: string
          created_at: string
          id: string
          is_default: boolean
          is_shared: boolean
          layouts: Json
          shared_with_roles: string[] | null
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          config_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layouts?: Json
          shared_with_roles?: string[] | null
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          config_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layouts?: Json
          shared_with_roles?: string[] | null
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      user_module_access: {
        Row: {
          can_access: boolean
          created_at: string
          id: string
          module_key: string
          user_id: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_key: string
          user_id: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_key?: string
          user_id?: string
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
      workflow_approval_requests: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          escalated_at: string | null
          id: string
          module: string
          record_id: string
          record_title: string | null
          requested_at: string
          requested_by: string | null
          rule_id: string
          status: string
          step_id: string
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          escalated_at?: string | null
          id?: string
          module: string
          record_id: string
          record_title?: string | null
          requested_at?: string
          requested_by?: string | null
          rule_id: string
          status?: string
          step_id: string
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          escalated_at?: string | null
          id?: string
          module?: string
          record_id?: string
          record_title?: string | null
          requested_at?: string
          requested_by?: string | null
          rule_id?: string
          status?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_approval_requests_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_approval_requests_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "workflow_approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_approval_steps: {
        Row: {
          approver_role: string
          approver_user_id: string | null
          created_at: string
          escalation_user_id: string | null
          id: string
          required_approvals: number
          rule_id: string
          step_order: number
          timeout_hours: number | null
        }
        Insert: {
          approver_role?: string
          approver_user_id?: string | null
          created_at?: string
          escalation_user_id?: string | null
          id?: string
          required_approvals?: number
          rule_id: string
          step_order?: number
          timeout_hours?: number | null
        }
        Update: {
          approver_role?: string
          approver_user_id?: string | null
          created_at?: string
          escalation_user_id?: string | null
          id?: string
          required_approvals?: number
          rule_id?: string
          step_order?: number
          timeout_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_approval_steps_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execution_log: {
        Row: {
          actions_executed: Json | null
          conditions_met: boolean
          executed_at: string
          id: string
          module: string
          notes: string | null
          record_id: string | null
          rule_id: string | null
          rule_name: string | null
          trigger_event: string | null
        }
        Insert: {
          actions_executed?: Json | null
          conditions_met?: boolean
          executed_at?: string
          id?: string
          module: string
          notes?: string | null
          record_id?: string | null
          rule_id?: string | null
          rule_name?: string | null
          trigger_event?: string | null
        }
        Update: {
          actions_executed?: Json | null
          conditions_met?: boolean
          executed_at?: string
          id?: string
          module?: string
          notes?: string | null
          record_id?: string | null
          rule_id?: string | null
          rule_name?: string | null
          trigger_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          module: string
          name: string
          priority: number
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          module: string
          name: string
          priority?: number
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module?: string
          name?: string
          priority?: number
          trigger_event?: string
          updated_at?: string
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
          protocol: string
          status: Database["public"]["Enums"]["report_status"]
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
      supplier_criticality: "baixa" | "media" | "alta" | "critica"
      supplier_status: "ativo" | "inativo" | "em_avaliacao" | "bloqueado"
      survey_status: "rascunho" | "ativa" | "encerrada"
      survey_type: "nps" | "csat" | "custom"
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
      supplier_criticality: ["baixa", "media", "alta", "critica"],
      supplier_status: ["ativo", "inativo", "em_avaliacao", "bloqueado"],
      survey_status: ["rascunho", "ativa", "encerrada"],
      survey_type: ["nps", "csat", "custom"],
    },
  },
} as const
