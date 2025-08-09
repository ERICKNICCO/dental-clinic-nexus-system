import { Appointment } from '../../types/appointment';
import { WeeklySchedule, DaySchedule } from '../../types/schedule';

// Get unique doctors from appointments
const getUniqueDoctors = (appointments: Appointment[]) => {
  const doctorMap = new Map();
  
  appointments.forEach(appointment => {
    const doctorName = appointment.dentist;
    if (doctorName && !doctorMap.has(doctorName)) {
      doctorMap.set(doctorName, {
        name: doctorName,
        image: getDoctorImage(doctorName)
      });
    }
  });
  
  return Array.from(doctorMap.values());
};

// Get doctor profile image based on name
const getDoctorImage = (doctorName: string) => {
  const imageMap: { [key: string]: string } = {
    'Dr. Shabbir Mohammedali': 'https://randomuser.me/api/portraits/men/1.jpg',
    'Dr. Shabbir': 'https://randomuser.me/api/portraits/men/1.jpg', // Fallback
    'Dr. Israel Kombole': 'https://randomuser.me/api/portraits/men/2.jpg',
    'Dr. Israel': 'https://randomuser.me/api/portraits/men/2.jpg', // Fallback
    'Dr. Rashid Qurban': 'https://randomuser.me/api/portraits/men/3.jpg',
    'Dr. Rashid': 'https://randomuser.me/api/portraits/men/3.jpg', // Fallback
  };
  
  return imageMap[doctorName] || 'https://randomuser.me/api/portraits/men/5.jpg';
};

// Create default schedule for days without appointments
const createDefaultDaySchedule = (): DaySchedule => {
  return {
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: false, // Changed to false - only show as available if there are actual appointments
    specialNotes: 'No appointments scheduled',
    appointments: []
  };
};

// Create schedule for days with appointments
const createDayScheduleWithAppointments = (appointments: Appointment[]): DaySchedule => {
  // Sort appointments by time
  const sortedAppointments = appointments.sort((a, b) => {
    const timeA = a.time.replace(/[^\d:]/g, '');
    const timeB = b.time.replace(/[^\d:]/g, '');
    return timeA.localeCompare(timeB);
  });
  
  const firstAppointment = sortedAppointments[0];
  const lastAppointment = sortedAppointments[sortedAppointments.length - 1];
  
  // Extract start and end times
  const startTime = firstAppointment.time.replace(/[^\d:]/g, '').substring(0, 5) || '09:00';
  const endTime = lastAppointment.time.replace(/[^\d:]/g, '').substring(0, 5) || '17:00';
  
  return {
    startTime,
    endTime,
    isAvailable: true,
    specialNotes: `${appointments.length} appointment${appointments.length > 1 ? 's' : ''} scheduled`,
    appointments: sortedAppointments
  };
};

// Generate weekly schedule from real appointments ONLY
export const getWeeklyScheduleByDoctor = (appointments: Appointment[]): WeeklySchedule[] => {
  console.log('🔍 Generating schedule from appointments:', appointments);
  
  // Filter only confirmed and approved appointments
  const validAppointments = appointments.filter(appointment => 
    ['Confirmed', 'Approved', 'Checked In', 'Pending'].includes(appointment.status)
  );
  
  console.log('🔍 Valid appointments after filtering:', validAppointments);
  
  if (validAppointments.length === 0) {
    console.log('🔍 No valid appointments found, returning empty schedule');
    return [];
  }
  
  // Get unique doctors from valid appointments only
  const doctors = getUniqueDoctors(validAppointments);
  console.log('🔍 Unique doctors found:', doctors);
  
  // Group appointments by doctor and day
  const groupedAppointments: { [doctorName: string]: { [day: string]: Appointment[] } } = {};
  
  validAppointments.forEach(appointment => {
    const doctorName = appointment.dentist;
    const appointmentDate = new Date(appointment.date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!groupedAppointments[doctorName]) {
      groupedAppointments[doctorName] = {};
    }
    
    if (!groupedAppointments[doctorName][dayName]) {
      groupedAppointments[doctorName][dayName] = [];
    }
    
    groupedAppointments[doctorName][dayName].push(appointment);
  });
  
  console.log('🔍 Grouped appointments:', groupedAppointments);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Create weekly schedules for each doctor with actual appointments
  const weeklySchedules: WeeklySchedule[] = doctors.map(doctor => {
    const schedule: { [key: string]: DaySchedule } = {};
    
    daysOfWeek.forEach(day => {
      const dayAppointments = groupedAppointments[doctor.name]?.[day] || [];
      
      if (dayAppointments.length > 0) {
        schedule[day] = createDayScheduleWithAppointments(dayAppointments);
      } else {
        schedule[day] = createDefaultDaySchedule();
      }
    });
    
    return {
      doctorName: doctor.name,
      doctorImage: doctor.image,
      schedule
    };
  });
  
  console.log('🔍 Generated weekly schedules:', weeklySchedules);
  return weeklySchedules;
};

// Helper function to get appointments for a specific doctor on a specific day
export const getDoctorAppointmentsForDay = (
  appointments: Appointment[], 
  doctorName: string, 
  date: string
): Appointment[] => {
  return appointments.filter(appointment => {
    return appointment.dentist === doctorName && 
           appointment.date === date &&
           (appointment.status === 'Confirmed' || appointment.status === 'Approved');
  });
};

// Helper function to check if doctor is available at specific time
export const isDoctorAvailableAtTime = (
  appointments: Appointment[],
  doctorName: string,
  date: string,
  time: string
): boolean => {
  const dayAppointments = getDoctorAppointmentsForDay(appointments, doctorName, date);
  
  // Check if there's already an appointment at this time
  return !dayAppointments.some(appointment => {
    const appointmentTime = appointment.time.replace(/[^\d:]/g, '').substring(0, 5);
    const checkTime = time.replace(/[^\d:]/g, '').substring(0, 5);
    return appointmentTime === checkTime;
  });
};
