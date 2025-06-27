
import { useState, useEffect } from 'react';
import { supabasePatientService } from '../services/supabasePatientService';
import { Patient } from '../types/patient';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useSupabasePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 useSupabasePatients: Setting up patients subscription');
    setLoading(true);

    let channel: RealtimeChannel | null = null;

    const loadInitialPatients = async () => {
      try {
        console.log('🔥 useSupabasePatients: Loading initial patients');
        const patientsList = await supabasePatientService.getPatients();
        console.log('🔥 useSupabasePatients: Loaded patients:', patientsList.length);
        console.log('🔥 useSupabasePatients: Patient details:', patientsList.map(p => ({ id: p.id, name: p.name, patientId: p.patientId })));
        
        setPatients(patientsList);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('❌ useSupabasePatients: Error loading patients:', err);
        setError('Failed to load patients');
        setLoading(false);
      }
    };

    loadInitialPatients();

    return () => {
      console.log('🔥 useSupabasePatients: Cleaning up subscription');
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, []);

  const addPatient = async (patientData: Omit<Patient, 'id'>) => {
    try {
      console.log('🔥 useSupabasePatients: Adding patient:', patientData);
      
      // Generate a unique patient ID
      const generatePatientId = () => {
        const existingIds = patients.map(p => p.patientId).filter(Boolean);
        let maxNumber = 0;
        
        existingIds.forEach(id => {
          const match = id.match(/SD-25-(\d+)/);
          if (match) {
            const number = parseInt(match[1]);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        });
        
        const nextNumber = maxNumber + 1;
        return `SD-25-${nextNumber.toString().padStart(5, '0')}`;
      };

      const patientWithId = {
        ...patientData,
        patientId: patientData.patientId || generatePatientId()
      };

      console.log('🔥 useSupabasePatients: Patient data with ID:', patientWithId);
      
      const newPatientId = await supabasePatientService.addPatient(patientWithId);
      console.log('✅ useSupabasePatients: Patient added with ID:', newPatientId);
      
      // Refresh the patients list
      const updatedPatients = await supabasePatientService.getPatients();
      setPatients(updatedPatients);
      
      return newPatientId;
    } catch (err) {
      console.error('❌ useSupabasePatients: Error adding patient:', err);
      setError('Failed to add patient');
      throw err;
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      console.log('🔥 useSupabasePatients: Updating patient:', id, updates);
      await supabasePatientService.updatePatient(id, updates);
      
      // Refresh the patients list
      const updatedPatients = await supabasePatientService.getPatients();
      setPatients(updatedPatients);
    } catch (err) {
      console.error('❌ useSupabasePatients: Error updating patient:', err);
      setError('Failed to update patient');
      throw err;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      console.log('🔥 useSupabasePatients: Deleting patient:', id);
      await supabasePatientService.deletePatient(id);
      
      // Refresh the patients list
      const updatedPatients = await supabasePatientService.getPatients();
      setPatients(updatedPatients);
    } catch (err) {
      console.error('❌ useSupabasePatients: Error deleting patient:', err);
      setError('Failed to delete patient');
      throw err;
    }
  };

  return {
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient
  };
};
