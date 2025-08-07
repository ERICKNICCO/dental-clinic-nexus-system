export interface MedicalRecord {
  id: string;
  patient_id: string | null;
  condition: string;
  description: string | null;
  treatment: string | null;
  doctor: string | null;
  date: string;
  created_at: string | null;
  updated_at: string | null;
}