
import { useState, useEffect, useCallback } from 'react';
import { supabaseConsultationService } from '../services/supabaseConsultationService';
import { Consultation } from '../services/consultationService';

export const useSupabaseConsultation = (patientId: string) => {
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActiveConsultation = useCallback(async () => {
    try {
      setLoading(true);
      const consultation = await supabaseConsultationService.getActiveConsultation(patientId);
      console.log('Loaded active consultation:', consultation);
      setActiveConsultation(consultation);
    } catch (error) {
      console.error('Error loading active consultation:', error);
      setActiveConsultation(null);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadActiveConsultation();
  }, [loadActiveConsultation]);

  const startConsultation = async (doctorId: string, doctorName: string, appointmentId?: string) => {
    try {
      const consultation = await supabaseConsultationService.startConsultation(patientId, doctorId, doctorName, appointmentId);
      setActiveConsultation(consultation);
      return consultation;
    } catch (error) {
      console.error('Error starting consultation:', error);
      throw error;
    }
  };

  const updateConsultation = async (consultationId: string, data: Partial<Consultation>) => {
    try {
      await supabaseConsultationService.updateConsultation(consultationId, data);
      // Refresh the consultation data after update
      await loadActiveConsultation();
    } catch (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }
  };

  const completeConsultation = async (consultationId: string, finalData: Partial<Consultation>) => {
    try {
      await supabaseConsultationService.completeConsultation(consultationId, finalData);
      setActiveConsultation(null);
    } catch (error) {
      console.error('Error completing consultation:', error);
      throw error;
    }
  };

  const refreshConsultation = useCallback(async () => {
    await loadActiveConsultation();
  }, [loadActiveConsultation]);

  return {
    activeConsultation,
    loading,
    startConsultation,
    updateConsultation,
    completeConsultation,
    refreshConsultation
  };
};
