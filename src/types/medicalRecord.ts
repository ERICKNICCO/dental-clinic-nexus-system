export interface MedicalRecord {
  id: string;
  patient_id?: string;
  date: string;
  condition: string;
  description?: string;
  treatment?: string;
  doctor?: string;
  created_at?: string;
  updated_at?: string;
}