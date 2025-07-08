export interface Patient {
  name: string;
  image: string;
  phone: string;
  email?: string;
  initials?: string;
}

export interface Appointment {
  id: string; // Changed from number to string to match Firebase document IDs
  date: string;
  time: string;
  patient: Patient;
  treatment: string;
  dentist: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved' | 'Checked In' | 'In Progress' | 'Completed' | 'X-Ray';
  patientId?: string;
  patient_id?: string; // Add database field name
  patient_name?: string; // Add database field name
  patient_phone?: string; // Add database field name
  patient_email?: string; // Add database field name
  patientType?: 'cash' | 'insurance';
  insurance?: string;
  notes?: string;
}
