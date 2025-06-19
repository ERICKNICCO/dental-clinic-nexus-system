
import { Appointment } from './appointment';

export interface DoctorSchedule {
  id: number;
  doctorName: string;
  doctorImage: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  specialNotes?: string;
}

export interface DaySchedule {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  specialNotes?: string;
  appointments?: Appointment[];
}

export interface WeeklySchedule {
  doctorName: string;
  doctorImage: string;
  schedule: {
    [key: string]: DaySchedule;
  };
}
