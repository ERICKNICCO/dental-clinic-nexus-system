
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
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved' | 'Checked In' | 'In Progress' | 'Completed';
  patientId?: string;
}
