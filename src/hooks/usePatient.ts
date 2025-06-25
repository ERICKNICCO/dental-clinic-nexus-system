
import { useState, useEffect } from 'react';
import { supabasePatientService } from '../services/supabasePatientService';

interface Patient {
  id: string;
  patientId?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  insurance: string;
  lastVisit: string;
  nextAppointment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const usePatient = (patientId: string | undefined) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    const fetchPatient = async () => {
      try {
        console.log('usePatient: Fetching patient from Supabase:', patientId);
        setLoading(true);
        const patientData = await supabasePatientService.getPatient(patientId);
        
        if (patientData) {
          console.log('usePatient: Patient data from Supabase:', patientData);
          setPatient({
            id: patientData.id,
            patientId: patientData.patientId,
            name: patientData.name,
            email: patientData.email,
            phone: patientData.phone,
            dateOfBirth: patientData.dateOfBirth,
            gender: patientData.gender,
            address: patientData.address,
            emergencyContact: patientData.emergencyContact,
            emergencyPhone: patientData.emergencyPhone,
            insurance: patientData.insurance,
            lastVisit: patientData.lastVisit,
            nextAppointment: patientData.nextAppointment,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setError(null);
        } else {
          setError('Patient not found');
        }
      } catch (err) {
        console.error('usePatient: Error fetching patient:', err);
        setError('Failed to fetch patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  return { patient, loading, error };
};
