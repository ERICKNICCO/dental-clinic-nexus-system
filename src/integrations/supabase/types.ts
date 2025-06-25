export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          date: string
          dentist: string
          id: string
          notes: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
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
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
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
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
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
      [_ in never]: never
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
