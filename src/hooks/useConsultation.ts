import { useState, useEffect } from 'react';
import { consultationService, Consultation } from '../services/consultationService';
import { appointmentService } from '../services/appointmentService';

export const useConsultation = (patientId: string) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadConsultations();
    }
  }, [patientId]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const consultationsList = await consultationService.getPatientConsultations(patientId);
      setConsultations(consultationsList);
      
      // Support for active consultations in in-progress/xray states
      const active = consultationsList.find(
        c =>
          c.status === 'in-progress' ||
          c.status === 'waiting-xray' ||
          c.status === 'xray-done'
      );
      setActiveConsultation(active || null);
    } catch (err) {
      console.error('Error loading consultations:', err);
      setError('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const startConsultation = async (doctorId: string, doctorName: string, appointmentId?: string) => {
    try {
      setLoading(true);
      
      const consultationData: any = {
        patientId,
        doctorId,
        doctorName,
        status: 'in-progress',
        symptoms: '',
        examination: '',
        vitalSigns: {},
        diagnosis: '',
        treatmentPlan: '',
        prescriptions: '',
        followUpInstructions: ''
      };
      
      // Only include appointmentId if it's provided
      if (appointmentId) {
        consultationData.appointmentId = appointmentId;
        
        // Update appointment status to "In Progress"
        try {
          await appointmentService.startConsultationFromAppointment(parseInt(appointmentId));
        } catch (error) {
          console.error('Error updating appointment status:', error);
        }
      }
      
      const consultationId = await consultationService.startConsultation(consultationData);
      
      await loadConsultations();
      return consultationId;
    } catch (err) {
      console.error('Error starting consultation:', err);
      setError('Failed to start consultation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateConsultation = async (id: string, updates: Partial<Consultation>) => {
    try {
      await consultationService.updateConsultation(id, updates);
      await loadConsultations();
    } catch (err) {
      console.error('Error updating consultation:', err);
      setError('Failed to update consultation');
      throw err;
    }
  };

  const completeConsultation = async (id: string, finalData: Partial<Consultation>) => {
    try {
      setLoading(true);
      await consultationService.completeConsultation(id, finalData);
      
      // If consultation has an appointmentId, mark appointment as completed
      const consultation = consultations.find(c => c.id === id);
      if (consultation && consultation.appointmentId) {
        try {
          await appointmentService.completeAppointment(parseInt(consultation.appointmentId));
        } catch (error) {
          console.error('Error completing appointment:', error);
        }
      }
      
      await loadConsultations();
    } catch (err) {
      console.error('Error completing consultation:', err);
      setError('Failed to complete consultation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    consultations,
    activeConsultation,
    loading,
    error,
    startConsultation,
    updateConsultation,
    completeConsultation,
    refreshConsultations: loadConsultations
  };
};
