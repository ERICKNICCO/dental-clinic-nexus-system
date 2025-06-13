export interface Notification {
  id: string;
  type: 'new_appointment' | 'appointment_approved' | 'appointment_cancelled';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  appointmentId?: string;
  targetDoctorName?: string; // New field to target specific doctors
} 