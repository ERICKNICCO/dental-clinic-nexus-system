export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          date: string
          dentist: string
          id: string
          insurance: string | null
          notes: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          patienttype: string | null
          status: string
          time: string
          treatment: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          dentist: string
          id?: string
          insurance?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          patienttype?: string | null
          status?: string
          time: string
          treatment: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          dentist?: string
          id?: string
          insurance?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          patienttype?: string | null
          status?: string
          time?: string
          treatment?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          appointment_id: string | null
          completed_at: string | null
          created_at: string
          diagnosis: string | null
          diagnosis_type: string | null
          discount_percent: number | null
          doctor_id: string
          doctor_name: string
          estimated_cost: number | null
          examination: string | null
          follow_up_instructions: string | null
          id: string
          next_appointment: string | null
          patient_id: string
          prescriptions: string | null
          started_at: string
          status: string
          symptoms: string | null
          treatment_items: Json | null
          treatment_plan: string | null
          updated_at: string
          vital_signs: Json | null
          xray_result: Json | null
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          diagnosis_type?: string | null
          discount_percent?: number | null
          doctor_id: string
          doctor_name: string
          estimated_cost?: number | null
          examination?: string | null
          follow_up_instructions?: string | null
          id?: string
          next_appointment?: string | null
          patient_id: string
          prescriptions?: string | null
          started_at?: string
          status?: string
          symptoms?: string | null
          treatment_items?: Json | null
          treatment_plan?: string | null
          updated_at?: string
          vital_signs?: Json | null
          xray_result?: Json | null
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          diagnosis_type?: string | null
          discount_percent?: number | null
          doctor_id?: string
          doctor_name?: string
          estimated_cost?: number | null
          examination?: string | null
          follow_up_instructions?: string | null
          id?: string
          next_appointment?: string | null
          patient_id?: string
          prescriptions?: string | null
          started_at?: string
          status?: string
          symptoms?: string | null
          treatment_items?: Json | null
          treatment_plan?: string | null
          updated_at?: string
          vital_signs?: Json | null
          xray_result?: Json | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          appointment_id: string | null
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string
          status: string
          subject: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string
          status?: string
          subject: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          appointment_id: string | null
          approved_at: string | null
          claim_number: string | null
          claim_status: string
          consultation_id: string | null
          created_at: string
          id: string
          insurance_provider: string
          patient_id: string
          patient_name: string
          patient_signature: string
          rejection_reason: string | null
          submitted_at: string | null
          treatment_details: Json
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          approved_at?: string | null
          claim_number?: string | null
          claim_status?: string
          consultation_id?: string | null
          created_at?: string
          id?: string
          insurance_provider: string
          patient_id: string
          patient_name: string
          patient_signature: string
          rejection_reason?: string | null
          submitted_at?: string | null
          treatment_details?: Json
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          approved_at?: string | null
          claim_number?: string | null
          claim_status?: string
          consultation_id?: string | null
          created_at?: string
          id?: string
          insurance_provider?: string
          patient_id?: string
          patient_name?: string
          patient_signature?: string
          rejection_reason?: string | null
          submitted_at?: string | null
          treatment_details?: Json
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          current_stock: number
          expiry_date: string | null
          id: string
          name: string
          reorder_level: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          name: string
          reorder_level?: number
          supplier?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          name?: string
          reorder_level?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      jubilee_auth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          provider_id: string
          token_type: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          provider_id: string
          token_type?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider_id?: string
          token_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      jubilee_item_verifications: {
        Row: {
          benefit_code: string
          id: string
          items: Json
          member_no: string
          procedure_code: string
          total_amount: number
          verification_response: Json
          verification_status: string
          verified_at: string
        }
        Insert: {
          benefit_code: string
          id?: string
          items: Json
          member_no: string
          procedure_code: string
          total_amount: number
          verification_response: Json
          verification_status: string
          verified_at?: string
        }
        Update: {
          benefit_code?: string
          id?: string
          items?: Json
          member_no?: string
          procedure_code?: string
          total_amount?: number
          verification_response?: Json
          verification_status?: string
          verified_at?: string
        }
        Relationships: []
      }
      jubilee_price_lists: {
        Row: {
          id: string
          last_updated: string
          list_data: Json
          list_type: string
        }
        Insert: {
          id?: string
          last_updated?: string
          list_data: Json
          list_type: string
        }
        Update: {
          id?: string
          last_updated?: string
          list_data?: Json
          list_type?: string
        }
        Relationships: []
      }
      jubilee_submissions: {
        Row: {
          authorization_no: string
          bill_no: string
          created_at: string
          current_status: string | null
          doctor_data: Json
          folio_no: string
          id: string
          last_status_check: string | null
          member_no: string
          patient_data: Json
          status_response: Json | null
          submission_id: string | null
          submission_response: Json
          submission_status: string
          submission_type: string
          submitted_at: string
          total_amount: number
          treatments: Json
          updated_at: string
        }
        Insert: {
          authorization_no: string
          bill_no: string
          created_at?: string
          current_status?: string | null
          doctor_data: Json
          folio_no: string
          id?: string
          last_status_check?: string | null
          member_no: string
          patient_data: Json
          status_response?: Json | null
          submission_id?: string | null
          submission_response: Json
          submission_status: string
          submission_type: string
          submitted_at?: string
          total_amount: number
          treatments: Json
          updated_at?: string
        }
        Update: {
          authorization_no?: string
          bill_no?: string
          created_at?: string
          current_status?: string | null
          doctor_data?: Json
          folio_no?: string
          id?: string
          last_status_check?: string | null
          member_no?: string
          patient_data?: Json
          status_response?: Json | null
          submission_id?: string | null
          submission_response?: Json
          submission_status?: string
          submission_type?: string
          submitted_at?: string
          total_amount?: number
          treatments?: Json
          updated_at?: string
        }
        Relationships: []
      }
      jubilee_verifications: {
        Row: {
          authorization_no: string | null
          benefits: Json | null
          daily_limit: number | null
          id: string
          member_details: Json
          member_no: string
          verification_response: Json
          verification_status: string
          verified_at: string
        }
        Insert: {
          authorization_no?: string | null
          benefits?: Json | null
          daily_limit?: number | null
          id?: string
          member_details: Json
          member_no: string
          verification_response: Json
          verification_status: string
          verified_at?: string
        }
        Update: {
          authorization_no?: string | null
          benefits?: Json | null
          daily_limit?: number | null
          id?: string
          member_details?: Json
          member_no?: string
          verification_response?: Json
          verification_status?: string
          verified_at?: string
        }
        Relationships: []
      }
      medical_history: {
        Row: {
          condition: string
          created_at: string | null
          date: string
          description: string | null
          doctor: string | null
          id: string
          patient_id: string | null
          treatment: string | null
          updated_at: string | null
        }
        Insert: {
          condition: string
          created_at?: string | null
          date: string
          description?: string | null
          doctor?: string | null
          id?: string
          patient_id?: string | null
          treatment?: string | null
          updated_at?: string | null
        }
        Update: {
          condition?: string
          created_at?: string | null
          date?: string
          description?: string | null
          doctor?: string | null
          id?: string
          patient_id?: string | null
          treatment?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          target_doctor_name: string | null
          target_role: string | null
          target_user: string | null
          timestamp: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          target_doctor_name?: string | null
          target_role?: string | null
          target_user?: string | null
          timestamp?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          target_doctor_name?: string | null
          target_role?: string | null
          target_user?: string | null
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string
          created_at: string
          date_of_birth: string
          email: string | null
          emergency_contact: string
          emergency_phone: string
          gender: string
          id: string
          insurance: string | null
          last_visit: string | null
          name: string
          next_appointment: string | null
          patient_id: string
          patient_type: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          date_of_birth: string
          email?: string | null
          emergency_contact: string
          emergency_phone: string
          gender: string
          id?: string
          insurance?: string | null
          last_visit?: string | null
          name: string
          next_appointment?: string | null
          patient_id: string
          patient_type: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          date_of_birth?: string
          email?: string | null
          emergency_contact?: string
          emergency_phone?: string
          gender?: string
          id?: string
          insurance?: string | null
          last_visit?: string | null
          name?: string
          next_appointment?: string | null
          patient_id?: string
          patient_type?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          payment_id: string | null
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          payment_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          payment_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          appointment_id: string | null
          collected_by: string | null
          consultation_id: string | null
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          final_total: number | null
          id: string
          insurance_provider: string | null
          notes: string | null
          patient_id: string
          patient_name: string
          payment_date: string | null
          payment_method: string
          payment_status: string
          total_amount: number
          treatment_name: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          appointment_id?: string | null
          collected_by?: string | null
          consultation_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          final_total?: number | null
          id?: string
          insurance_provider?: string | null
          notes?: string | null
          patient_id: string
          patient_name: string
          payment_date?: string | null
          payment_method?: string
          payment_status?: string
          total_amount?: number
          treatment_name: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          appointment_id?: string | null
          collected_by?: string | null
          consultation_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          final_total?: number | null
          id?: string
          insurance_provider?: string | null
          notes?: string | null
          patient_id?: string
          patient_name?: string
          payment_date?: string | null
          payment_method?: string
          payment_status?: string
          total_amount?: number
          treatment_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          brand: string | null
          created_at: string
          expiry_date: string | null
          id: string
          item_id: string | null
          item_name: string
          performed_by: string
          quantity: number
          reason: string
          remaining_stock: number
          supplier: string | null
          type: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_id?: string | null
          item_name: string
          performed_by: string
          quantity: number
          reason: string
          remaining_stock: number
          supplier?: string | null
          type: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_id?: string | null
          item_name?: string
          performed_by?: string
          quantity?: number
          reason?: string
          remaining_stock?: number
          supplier?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_notes: {
        Row: {
          created_at: string | null
          date: string
          doctor: string
          follow_up: string | null
          id: string
          notes: string | null
          patient_id: string | null
          procedure: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          doctor: string
          follow_up?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          procedure: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          doctor?: string
          follow_up?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          procedure?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_pricing: {
        Row: {
          base_price: number
          category: string
          created_at: string
          description: string | null
          duration: number
          id: string
          insurance_provider: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          insurance_provider?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          insurance_provider?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      treatment_pricing_overview: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          insurance_provider: string | null
          is_active: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          insurance_provider?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          insurance_provider?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
