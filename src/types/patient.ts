export interface Patient {
  id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  insurance: string;
  lastVisit: string;
  nextAppointment: string;
  patientType: 'cash' | 'insurance';
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  condition: string;
  description?: string;
  date: string;
  doctor?: string;
  treatment?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper interface for creating new patients
export interface NewPatient {
  patientId?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  insurance: string;
  lastVisit?: string;
  nextAppointment?: string;
  patientType: 'cash' | 'insurance';
}
