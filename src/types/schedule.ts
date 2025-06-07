
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

export interface WeeklySchedule {
  doctorName: string;
  doctorImage: string;
  schedule: {
    [key: string]: {
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      specialNotes?: string;
    };
  };
}
