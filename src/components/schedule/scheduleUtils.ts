
import { DoctorSchedule, WeeklySchedule } from '../../types/schedule';

export const scheduleData: DoctorSchedule[] = [
  // Dr. Shabbir
  { id: 1, doctorName: 'Dr. Shabbir', doctorImage: 'https://randomuser.me/api/portraits/men/32.jpg', dayOfWeek: 'Monday', startTime: '08:00', endTime: '17:00', isAvailable: true },
  { id: 2, doctorName: 'Dr. Shabbir', doctorImage: 'https://randomuser.me/api/portraits/men/32.jpg', dayOfWeek: 'Tuesday', startTime: '08:00', endTime: '17:00', isAvailable: true },
  { id: 3, doctorName: 'Dr. Shabbir', doctorImage: 'https://randomuser.me/api/portraits/men/32.jpg', dayOfWeek: 'Wednesday', startTime: '08:00', endTime: '17:00', isAvailable: true },
  { id: 4, doctorName: 'Dr. Shabbir', doctorImage: 'https://randomuser.me/api/portraits/men/32.jpg', dayOfWeek: 'Thursday', startTime: '08:00', endTime: '17:00', isAvailable: true },
  { id: 5, doctorName: 'Dr. Shabbir', doctorImage: 'https://randomuser.me/api/portraits/men/32.jpg', dayOfWeek: 'Friday', startTime: '08:00', endTime: '17:00', isAvailable: true },
  { id: 6, doctorName: 'Dr. Shabbir', doctorImage: 'https://randomuser.me/api/portraits/men/32.jpg', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: true },
  { id: 7, doctorName: 'Dr. Shabbir', doctorImage: 'https://randomuser.me/api/portraits/men/32.jpg', dayOfWeek: 'Sunday', startTime: '', endTime: '', isAvailable: false, specialNotes: 'Day Off' },

  // Dr. Israel
  { id: 8, doctorName: 'Dr. Israel', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', dayOfWeek: 'Monday', startTime: '09:00', endTime: '18:00', isAvailable: true },
  { id: 9, doctorName: 'Dr. Israel', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
  { id: 10, doctorName: 'Dr. Israel', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '18:00', isAvailable: true },
  { id: 11, doctorName: 'Dr. Israel', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', dayOfWeek: 'Thursday', startTime: '09:00', endTime: '18:00', isAvailable: true },
  { id: 12, doctorName: 'Dr. Israel', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', dayOfWeek: 'Friday', startTime: '', endTime: '', isAvailable: false, specialNotes: 'Day Off' },
  { id: 13, doctorName: 'Dr. Israel', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', dayOfWeek: 'Saturday', startTime: '08:00', endTime: '14:00', isAvailable: true },
  { id: 14, doctorName: 'Dr. Israel', doctorImage: 'https://randomuser.me/api/portraits/women/44.jpg', dayOfWeek: 'Sunday', startTime: '', endTime: '', isAvailable: false, specialNotes: 'Day Off' },

  // Dr. Rashid
  { id: 15, doctorName: 'Dr. Rashid', doctorImage: 'https://randomuser.me/api/portraits/men/75.jpg', dayOfWeek: 'Monday', startTime: '07:30', endTime: '16:30', isAvailable: true },
  { id: 16, doctorName: 'Dr. Rashid', doctorImage: 'https://randomuser.me/api/portraits/men/75.jpg', dayOfWeek: 'Tuesday', startTime: '07:30', endTime: '16:30', isAvailable: true },
  { id: 17, doctorName: 'Dr. Rashid', doctorImage: 'https://randomuser.me/api/portraits/men/75.jpg', dayOfWeek: 'Wednesday', startTime: '07:30', endTime: '16:30', isAvailable: true },
  { id: 18, doctorName: 'Dr. Rashid', doctorImage: 'https://randomuser.me/api/portraits/men/75.jpg', dayOfWeek: 'Thursday', startTime: '', endTime: '', isAvailable: false, specialNotes: 'Day Off' },
  { id: 19, doctorName: 'Dr. Rashid', doctorImage: 'https://randomuser.me/api/portraits/men/75.jpg', dayOfWeek: 'Friday', startTime: '07:30', endTime: '16:30', isAvailable: true },
  { id: 20, doctorName: 'Dr. Rashid', doctorImage: 'https://randomuser.me/api/portraits/men/75.jpg', dayOfWeek: 'Saturday', startTime: '08:00', endTime: '12:00', isAvailable: true },
  { id: 21, doctorName: 'Dr. Rashid', doctorImage: 'https://randomuser.me/api/portraits/men/75.jpg', dayOfWeek: 'Sunday', startTime: '', endTime: '', isAvailable: false, specialNotes: 'Day Off' },

  // Dr. Nyaki
  { id: 22, doctorName: 'Dr. Nyaki', doctorImage: 'https://randomuser.me/api/portraits/women/63.jpg', dayOfWeek: 'Monday', startTime: '10:00', endTime: '19:00', isAvailable: true },
  { id: 23, doctorName: 'Dr. Nyaki', doctorImage: 'https://randomuser.me/api/portraits/women/63.jpg', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '19:00', isAvailable: true },
  { id: 24, doctorName: 'Dr. Nyaki', doctorImage: 'https://randomuser.me/api/portraits/women/63.jpg', dayOfWeek: 'Wednesday', startTime: '', endTime: '', isAvailable: false, specialNotes: 'Day Off' },
  { id: 25, doctorName: 'Dr. Nyaki', doctorImage: 'https://randomuser.me/api/portraits/women/63.jpg', dayOfWeek: 'Thursday', startTime: '10:00', endTime: '19:00', isAvailable: true },
  { id: 26, doctorName: 'Dr. Nyaki', doctorImage: 'https://randomuser.me/api/portraits/women/63.jpg', dayOfWeek: 'Friday', startTime: '10:00', endTime: '19:00', isAvailable: true },
  { id: 27, doctorName: 'Dr. Nyaki', doctorImage: 'https://randomuser.me/api/portraits/women/63.jpg', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '15:00', isAvailable: true },
  { id: 28, doctorName: 'Dr. Nyaki', doctorImage: 'https://randomuser.me/api/portraits/women/63.jpg', dayOfWeek: 'Sunday', startTime: '', endTime: '', isAvailable: false, specialNotes: 'Day Off' },
];

export const getWeeklyScheduleByDoctor = (): WeeklySchedule[] => {
  const doctors = ['Dr. Shabbir', 'Dr. Israel', 'Dr. Rashid', 'Dr. Nyaki'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return doctors.map(doctorName => {
    const doctorSchedules = scheduleData.filter(schedule => schedule.doctorName === doctorName);
    const doctorImage = doctorSchedules[0]?.doctorImage || '';
    
    const schedule: WeeklySchedule['schedule'] = {};
    
    daysOfWeek.forEach(day => {
      const daySchedule = doctorSchedules.find(s => s.dayOfWeek === day);
      if (daySchedule) {
        schedule[day] = {
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
          isAvailable: daySchedule.isAvailable,
          specialNotes: daySchedule.specialNotes
        };
      }
    });
    
    return {
      doctorName,
      doctorImage,
      schedule
    };
  });
};
