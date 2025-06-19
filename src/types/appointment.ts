
export interface Patient {
  name: string;
  image: string;
  phone: string;
  email?: string;
  initials?: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  patient_name: string; // Updated to match database schema
  patient_phone: string; // Updated to match database schema
  patient_email: string; // Updated to match database schema
  treatment: string;
  dentist: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved' | 'Checked In' | 'In Progress' | 'Completed';
  patientId?: string;
  patientType?: 'cash' | 'insurance';
  insurance?: string;
  notes?: string;
  // Legacy patient object for backward compatibility
  patient?: Patient;
}
