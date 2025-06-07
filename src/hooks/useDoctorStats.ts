
import { useState, useEffect } from 'react';
import { useAppointments } from './useAppointments';
import { usePatients } from './usePatients';

interface DoctorStats {
  monthlyAppointments: number;
  totalPatients: number;
  pendingTreatments: number;
}

export const useDoctorStats = (doctorName: string) => {
  const [stats, setStats] = useState<DoctorStats>({
    monthlyAppointments: 0,
    totalPatients: 0,
    pendingTreatments: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { appointments } = useAppointments();
  const { patients } = usePatients();

  useEffect(() => {
    if (!doctorName) {
      setLoading(false);
      return;
    }

    try {
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11
      const currentYear = now.getFullYear();
      
      // Helper function to normalize doctor names for comparison
      const normalizeDoctorName = (name: string) => {
        if (!name) return '';
        return name.toLowerCase()
          .replace(/^dr\.?\s*/i, '') // Remove "Dr." or "Dr" prefix
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      // Helper function to check if two doctor names match
      const isDoctorNameMatch = (appointmentDoctor: string, userDoctor: string) => {
        const normalizedAppointmentDoctor = normalizeDoctorName(appointmentDoctor);
        const normalizedUserDoctor = normalizeDoctorName(userDoctor);
        
        // Exact match
        if (normalizedAppointmentDoctor === normalizedUserDoctor) {
          return true;
        }
        
        // Split both names into words for better matching
        const appointmentWords = normalizedAppointmentDoctor.split(' ').filter(word => word.length > 0);
        const userWords = normalizedUserDoctor.split(' ').filter(word => word.length > 0);
        
        // Check if any word from appointment doctor matches any word from user doctor
        for (const appointmentWord of appointmentWords) {
          for (const userWord of userWords) {
            if (appointmentWord === userWord) {
              return true;
            }
          }
        }
        
        // Check if appointment doctor contains any user word or vice versa
        for (const appointmentWord of appointmentWords) {
          if (normalizedUserDoctor.includes(appointmentWord)) {
            return true;
          }
        }
        
        for (const userWord of userWords) {
          if (normalizedAppointmentDoctor.includes(userWord)) {
            return true;
          }
        }
        
        return false;
      };

      // Filter appointments for this doctor
      const doctorAppointments = appointments.filter(appointment => 
        isDoctorNameMatch(appointment.dentist || '', doctorName)
      );

      // Count current month's confirmed appointments
      const monthlyAppointments = doctorAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        const appointmentMonth = appointmentDate.getMonth();
        const appointmentYear = appointmentDate.getFullYear();
        
        return appointmentMonth === currentMonth && 
               appointmentYear === currentYear && 
               appointment.status === 'Confirmed';
      }).length;

      // Count unique patients for this doctor
      const uniquePatientNames = new Set(
        doctorAppointments.map(appointment => appointment.patient.name.toLowerCase())
      );
      const totalPatients = uniquePatientNames.size;

      // Count pending treatments (appointments with status 'Approved' or 'Pending')
      const pendingTreatments = doctorAppointments.filter(appointment => 
        appointment.status === 'Approved' || appointment.status === 'Pending'
      ).length;

      setStats({
        monthlyAppointments,
        totalPatients,
        pendingTreatments
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error calculating doctor stats:', error);
      setLoading(false);
    }
  }, [appointments, patients, doctorName]);

  return { stats, loading };
};
