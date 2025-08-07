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
