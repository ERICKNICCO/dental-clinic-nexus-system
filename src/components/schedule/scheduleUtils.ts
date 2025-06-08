
import { Appointment } from '../../types/appointment';

export interface DaySchedule {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
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

// Updated working hours: 9:00-17:00
const WORKING_HOURS = {
  start: '09:00',
  end: '17:00'
};

// Generate appointments for a doctor on a specific day
const generateAppointmentsForDay = (doctorName: string, appointments: Appointment[], dayName: string): Appointment[] => {
  const today = new Date();
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
  
  // Calculate the date for this day of the week
  const dayDate = new Date(today);
  const currentDay = today.getDay();
  const daysToAdd = (dayIndex - currentDay + 7) % 7;
  dayDate.setDate(today.getDate() + daysToAdd);
  
  const dateString = dayDate.toISOString().split('T')[0];
  
  // Filter appointments for this doctor and this specific date
  return appointments.filter(appointment => 
    appointment.dentist === doctorName && 
    appointment.date === dateString
  );
};

export const getWeeklyScheduleByDoctor = (appointments: Appointment[] = []): WeeklySchedule[] => {
  const doctors = [
    { name: 'Dr. Shabbir', image: '/placeholder.svg' },
    { name: 'Dr. Israel', image: '/placeholder.svg' },
    { name: 'Dr. Rashid', image: '/placeholder.svg' },
    { name: 'Dr. Nyaki', image: '/placeholder.svg' }
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return doctors.map(doctor => {
    const schedule: { [key: string]: DaySchedule } = {};
    
    daysOfWeek.forEach(day => {
      const dayAppointments = generateAppointmentsForDay(doctor.name, appointments, day);
      
      // Doctors are available Monday-Friday, 9:00-17:00
      const isWorkingDay = !['Saturday', 'Sunday'].includes(day);
      
      schedule[day] = {
        isAvailable: isWorkingDay,
        startTime: isWorkingDay ? WORKING_HOURS.start : '',
        endTime: isWorkingDay ? WORKING_HOURS.end : '',
        specialNotes: isWorkingDay ? undefined : 'Weekend',
        appointments: dayAppointments
      };
    });

    return {
      doctorName: doctor.name,
      doctorImage: doctor.image,
      schedule
    };
  });
};

export const getDoctorSchedule = (doctorName: string, appointments: Appointment[] = []): WeeklySchedule | null => {
  const allSchedules = getWeeklyScheduleByDoctor(appointments);
  return allSchedules.find(schedule => schedule.doctorName === doctorName) || null;
};
