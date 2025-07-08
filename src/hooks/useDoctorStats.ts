import { useState, useEffect } from 'react';
import { useAppointments } from './useAppointments';
import { useSupabasePatients } from './useSupabasePatients';
import { supabaseConsultationService } from '../services/supabaseConsultationService';

interface DoctorStats {
  monthlyAppointments: number;
  totalPatients: number;
  pendingTreatments: number;
}

export const useDoctorStats = (doctorName: string, userRole?: string, forceUpdate?: number) => {
  const [stats, setStats] = useState<DoctorStats>({
    monthlyAppointments: 0,
    totalPatients: 0,
    pendingTreatments: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { appointments } = useAppointments();
  const { patients } = useSupabasePatients();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get current date information
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();
        const todayString = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        console.log('Stats calculation - Today string:', todayString);
        console.log('Stats calculation - User role:', userRole, 'Doctor name:', doctorName);
        
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

        // Filter appointments based on user role
        let filteredAppointments = appointments;
        
        if (userRole === 'doctor' && doctorName) {
          // For doctors, filter by their name
          filteredAppointments = appointments.filter(appointment => 
            isDoctorNameMatch(appointment.dentist || '', doctorName)
          );
        }
        // For admin or other roles, use all appointments (no filtering)

        console.log('Stats calculation - Total appointments:', appointments.length);
        console.log('Stats calculation - Filtered appointments:', filteredAppointments.length);

        // Calculate appointments based on user role
        let appointmentCount = 0;
        
        if (userRole === 'doctor') {
          // For doctors: Count current month's relevant appointments (Approved, Confirmed, Checked In, In Progress)
          appointmentCount = filteredAppointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            const appointmentMonth = appointmentDate.getMonth();
            const appointmentYear = appointmentDate.getFullYear();
            return appointmentMonth === currentMonth && 
                   appointmentYear === currentYear && 
                   ['Approved', 'Confirmed', 'Checked In', 'In Progress'].includes(appointment.status);
          }).length;
          console.log('Stats calculation - Monthly relevant appointments for doctor:', appointmentCount);
        } else {
          // For admin: Count today's appointments (any status)
          appointmentCount = filteredAppointments.filter(appointment => {
            const appointmentDateString = appointment.date; // Should be in YYYY-MM-DD format
            console.log('Comparing appointment date:', appointmentDateString, 'with today:', todayString);
            return appointmentDateString === todayString;
          }).length;
          console.log('Stats calculation - Today\'s appointments for admin:', appointmentCount);
        }

        // Count unique patients
        let totalPatients = 0;
        if (userRole === 'doctor' && doctorName) {
          // For doctors, count unique patients from their appointments
          const uniquePatientNames = new Set(
            filteredAppointments.map(appointment => appointment.patient.name.toLowerCase())
          );
          totalPatients = uniquePatientNames.size;
        } else {
          // For admin, use total patients from Supabase
          totalPatients = patients.length;
        }

        console.log('Stats calculation - Total patients:', totalPatients);

        // Fetch all consultations and count those not completed or cancelled
        const allConsultations = await supabaseConsultationService.getAllConsultations();
        let pendingConsultations = 0;
        if (allConsultations && Array.isArray(allConsultations)) {
          pendingConsultations = allConsultations.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length;
        }

        setStats({
          monthlyAppointments: appointmentCount,
          totalPatients,
          pendingTreatments: pendingConsultations
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error calculating stats:', error);
        setLoading(false);
      }
    };
    fetchStats();
  }, [appointments, patients, doctorName, userRole, forceUpdate]);

  return { stats, loading };
};
