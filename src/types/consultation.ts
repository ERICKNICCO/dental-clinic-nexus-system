export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  appointment_id?: string;
  status: 'in-progress' | 'waiting-xray' | 'xray-done' | 'completed' | 'cancelled';

  // Consultation steps
  symptoms: string;
  examination: string;
  vital_signs: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    weight?: string;
    height?: string;
  };
  diagnosis: string;
  diagnosis_type?: 'clinical' | 'xray';
  treatment_plan: string;
  prescriptions: string;
  follow_up_instructions: string;
  next_appointment?: string;

  // Treatment cost information
  estimated_cost?: number;
  treatment_items?: Array<{
    name: string;
    cost: number;
    duration: string;
  }>;
  discount_percent?: number;

  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  xray_result?: {
    images: string[];
    note: string;
    radiologist: string;
  } | null;
}