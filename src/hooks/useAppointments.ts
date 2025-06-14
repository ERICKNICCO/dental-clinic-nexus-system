import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) return;

    const loadAppointments = async () => {
      try {
        setLoading(true);
        // Always fetch all appointments, then filter locally
        const allAppointments = await appointmentService.getAppointments();

        const filteredAppointments = allAppointments.filter((appt) => {
          if (userProfile.role === 'doctor') {
            // Filter by 'Approved' status and matching doctor's name
            return appt.status === 'Approved' && appt.dentist === userProfile.name;
          }
          return true; // Admin and other roles see all
        });

        setAppointments(filteredAppointments);
        setError(null);
      } catch (err) {
        setError('Failed to load appointments');
        console.error('Error loading appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();

    // Subscribe to real-time updates for all appointments, then filter locally
    const unsubscribe = appointmentService.subscribeToAppointments((allUpdatedAppointments) => {
      const filteredUpdatedAppointments = allUpdatedAppointments.filter((appt) => {
        if (userProfile.role === 'doctor') {
          return appt.status === 'Approved' && appt.dentist === userProfile.name;
        }
        return true; // Admin and other roles see all
      });
      setAppointments(filteredUpdatedAppointments);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    try {
      const appointmentId = await appointmentService.addAppointment(appointment);
      const newAppointment = {
        ...appointment,
        id: appointmentId
      } as Appointment;
      setAppointments((prev) => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      setError('Failed to create appointment');
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      console.log('[useAppointments.updateAppointment] called with:', { id, updates });
      await appointmentService.updateAppointment(id, updates);
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...updates } : app))
      );
      return { ...updates, id } as Appointment;
    } catch (err) {
      console.error('[useAppointments.updateAppointment] ERROR:', err);
      setError('Failed to update appointment');
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await appointmentService.deleteAppointment(id);
      setAppointments((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      setError('Failed to delete appointment');
      throw err;
    }
  };

  return {
    appointments,
    loading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };
};
