export interface Notification {
  id: string;
  type: 'appointment' | 'new_appointment' | 'appointment_approved' | 'appointment_cancelled' | 'consultation_completed' | 'payment_required';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  appointmentId?: string;
  targetDoctorName?: string;
  target_role?: string;
  target_user?: string;
}

// For Supabase notifications (snake_case for DB, camelCase for app)
export interface SupabaseNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string; // ISO string from Supabase
  read: boolean;
  appointment_id?: string;
  target_doctor_name?: string;
  target_role?: string;
  target_user?: string;
}
