export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  status: 'in-progress' | 'waiting-xray' | 'xray-done' | 'completed' | 'cancelled';

  // Consultation steps
  symptoms: string;
  examination: string;
  vitalSigns: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    weight?: string;
    height?: string;
  };
  diagnosis: string;
  diagnosisType?: 'clinical' | 'xray';
  treatmentPlan: string;
  prescriptions: string;
  followUpInstructions: string;
  nextAppointment?: string;

  // Treatment cost information
  estimatedCost?: number;
  treatmentItems?: Array<{
    name: string;
    cost: number;
    duration: string;
  }>;

  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Add the xrayResult field
  xrayResult?: {
    images: string[];
    note: string;
    radiologist: string;
  } | null;
} 